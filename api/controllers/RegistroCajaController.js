/**
 * RegistroCajaController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const objId = require('mongodb').ObjectID;

const puppeteer = require('puppeteer');
const fs = require('fs');
const ejs = require('ejs');

module.exports = {
  crear: async function (req, res) {
    try {
      let registroCajaCreada = {};
      await Caja.getDatastore().transaction(async (db, proceed) => {
        const registroCaja = {
          id: new objId().toString(),
          cajaId: req.body.cajaId,
          fechaApertura: new Date(),
          efectivoInicial: req.body.efectivoInicial,
          efectivoFinal: 0,
          estado: 'abierta',
          userId: req.body.userId
        };

        if (!registroCaja.efectivoInicial) {
          return res.badRequest({ err: 'El efectivo inicial es requerido' });
        }

        if (!registroCaja.userId) {
          return res.badRequest({ err: 'El usuario es requerido' });
        }

        if (!registroCaja.cajaId) {
          return res.badRequest({ err: 'La caja es requerida' });
        }

        const caja = await Caja.findOne({ id: registroCaja.cajaId, deleted: false }).usingConnection(db);

        if (!caja) {
          return res.badRequest({ err: 'No existe la caja' });
        }

        const cajaActualizada = await Caja.updateOne({ id: registroCaja.cajaId, deleted: false }).set({ disponible: false }).usingConnection(db);

        if (!cajaActualizada) {
          return await proceed(new Error('Ocurrio un error al actualizar la caja'));
        }

        const registroCajaCreado = await RegistroCaja.create(registroCaja).fetch()
          .catch(err => {
            sails.log.error(err);
            return proceed(new Error('Ocurrió un error al crear el registro de caja'));
          });

        if (!registroCajaCreado) {
          return await proceed(new Error('Ocurrio un error al crear el registro de caja'));
        }

        registroCajaCreada = registroCajaCreado;

        // Generar log
        const descripcion = `Se creo un registro de caja con los siguientes datos:\n${JSON.stringify(registroCajaCreado, null, 2)}`;
        await sails.helpers.log({
          accion: 'POST',
          descripcion,
          origen: 'RegistroCajaController.crear',
          token: req.headers.authorization,
          elementId: registroCajaCreado.id,
          success: true
        });
        return await proceed();
      });

      return res.ok(registroCajaCreada);

    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al crear el registro de caja.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'RegistroCajaController.crear',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Ocurrió un error al crear el registro de caja.'
      });

    }
  },
  listar: async function (req, res) {
    try {
      const {
        top = 10,
        page = 0
      } = req.allParams();

      const cantidadRegistros = await RegistroCaja.count({ deleted: false });
      const registroCajas = await RegistroCaja.find()
        .where({
          // cajaId: caja,
          // userId: usuario,
          // fechaApertura: { '>=': fecha },
          deleted: false
        })
        .populate('cajaId')
        .sort([
          { fechaApertura: 'DESC' },
          { fechaCierre: 'DESC' },
          { estado: 'ASC' }
        ])
        .limit(top)
        .skip(page * top);

      return res.ok({
        facturaciones: registroCajas,
        total: cantidadRegistros
      });
    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los registros de caja.\n- Error: ${JSON.stringify(err, null, 2)}\n- Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'RegistroCajaController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      return res.serverError(err);
    }
  },
  listarPorEstado: async function (req, res) {
    try {
      const { top = 10, page = 0, estado } = req.allParams();

      const cantidadRegistros = await RegistroCaja.count({ estado, deleted: false });
      const registroCajas = await RegistroCaja.find()
        .where({
          estado,
          deleted: false
        })
        .populate('cajaId')
        .sort([
          { fechaApertura: 'DESC' },
          { fechaCierre: 'DESC' },
          { estado: 'ASC' }
        ])
        .limit(top)
        .skip(page * top);

      return res.ok({
        facturaciones: registroCajas,
        total: cantidadRegistros
      });
    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los registros de caja por estado.\n- Error: ${JSON.stringify(err, null, 2)}\n- Params: ${JSON.stringify(req.allParams(), null, 2)}`;

      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'RegistroCajaController.listarPorEstado',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      return res.serverError(err);
    }
  },
  obtenerPorId: async function (req, res) {
    try {
      const registroCaja = await RegistroCaja.findOne({ id: req.params.id, deleted: false }).populate('cajaId');

      if (!registroCaja) {
        return res.badRequest({ err: 'No existe el registro de caja' });
      }

      return res.ok(registroCaja);
    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el registro de caja por id.\n- Error: ${JSON.stringify(err, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'RegistroCajaController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(err);
    }
  },
  obtenerPorUserId: async function (req, res) {
    try {
      const registroCajas = await RegistroCaja
        .find({ userId: req.params.userId, estado: 'abierta', deleted: false })
        .populate('cajaId')
        .sort([
          { fechaApertura: 'DESC' },
          { fechaCierre: 'DESC' },
          { estado: 'ASC' }
        ]);

      return res.ok(registroCajas);
    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el registro de caja por id de usuario.\n- Error: ${JSON.stringify(err, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'RegistroCajaController.obtenerPorUserId',
        token: req.headers.authorization,
        elementId: req.params.userId,
        success: false
      });

      return res.serverError(err);
    }
  },
  actualizar: async function (req, res) {
    try {
      const registroCaja = {
        cajaId: req.body.cajaId,
        fechaApertura: req.body.fechaApertura,
        fechaCierre: req.body.fechaCierre,
        efectivoInicial: req.body.efectivoInicial,
        efectivoFinal: req.body.efectivoFinal,
        tarjetas: req.body.tarjetas,
        otrosMetodos: req.body.otrosMetodos,
        estado: req.body.estado,
        userId: req.body.userId
      };

      if (!registroCaja.fechaApertura) {
        return res.badRequest({ err: 'La fecha de apertura es requerida' });
      }

      if (!registroCaja.efectivoInicial) {
        return res.badRequest({ err: 'El efectivo inicial es requerido' });
      }

      if (!registroCaja.userId) {
        return res.badRequest({ err: 'El usuario es requerido' });
      }

      if (!registroCaja.estado) {
        return res.badRequest({ err: 'El estado es requerido' });
      }

      const registroCajaDesactualizado = await RegistroCaja.findOne({ id: req.params.id, deleted: false });

      if (!registroCajaDesactualizado) {
        return res.badRequest({ err: 'No existe el registro de caja' });
      }

      const registroCajaActualizado = await RegistroCaja.update({ id: req.params.id }).set(registroCaja).fetch();

      if (registroCajaActualizado) {
        // Generar log
        const descripcion = `Se actualizo el registro de caja con los siguientes datos:\n-Datos anteriores: ${JSON.stringify(registroCajaDesactualizado, null, 2)}\n-Datos nuevos: ${JSON.stringify(registroCajaActualizado, null, 2)}`;
        await sails.helpers.log({
          accion: 'PUT',
          descripcion,
          origen: 'RegistroCajaController.actualizar',
          token: req.headers.authorization,
          elementId: req.params.id,
          success: true
        });

        return res.ok(registroCajaActualizado);
      } else {
        throw new Error('Ocurrio un error al actualizar el registro de caja');
      }

    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al actualizar el registro de caja.\n- Error: ${JSON.stringify(err, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'RegistroCajaController.actualizar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(err);
    }
  },
  eliminar: async function (req, res) {
    try {
      const registroCajaEliminado = await RegistroCaja.update({ id: req.params.id }).set({ deleted: true }).fetch();

      if (registroCajaEliminado) {
        // Generar log
        const descripcion = `Se elimino el registro de caja con los siguientes datos:\n${JSON.stringify(registroCajaEliminado, null, 2)}`;
        await sails.helpers.log({
          accion: 'DELETE',
          descripcion,
          origen: 'RegistroCajaController.eliminar',
          token: req.headers.authorization,
          elementId: req.params.id,
          success: true
        });

        return res.ok(registroCajaEliminado);
      } else {
        throw new Error('Ocurrio un error al eliminar el registro de caja');
      }

    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al eliminar el registro de caja.\n- Error: ${JSON.stringify(err, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'RegistroCajaController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(err);
    }
  },
  completar: async function (req, res) {
    try {
      let registroCajaActualizada = {};
      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      // verificar si tiene prefacturas pendientes
      const prefacturas = await PreFactura.find({ registroCajaId: id, estado: 'Abierta', deleted: false });
      if (prefacturas.length > 0) {
        return res.badRequest({ err: 'No se puede completar la caja, existen prefacturas pendientes' });
      }

      await Caja.getDatastore().transaction(async (db, proceed) => {
        const registroCaja = await RegistroCaja.findOne({ id: id, deleted: false }).usingConnection(db);

        if (!registroCaja) {
          return res.badRequest({ err: 'No existe el registro de caja' });
        }

        if (registroCaja.estado === 'completada') {
          return res.badRequest({ err: 'La caja ya se encuentra completada' });
        }

        const cajaActualizada = await Caja.updateOne({ id: registroCaja.cajaId }).set({ disponible: true }).usingConnection(db);

        if (!cajaActualizada) {
          return await proceed(new Error('Ocurrio un error al actualizar la caja'));
        }

        const registroCajaActualizado = await RegistroCaja.updateOne({ id: id, deleted: false }).set({ estado: 'completada', fechaCierre: new Date() }).usingConnection(db);

        if (!registroCajaActualizado) {
          return await proceed(new Error('Ocurrio un error al actualizar el registro de caja'));
        }

        registroCajaActualizada = registroCajaActualizado;

        // Generar log
        const descripcion = `Se completo el registro de caja con los siguientes datos:\n${JSON.stringify(registroCajaActualizado, null, 2)}`;
        await sails.helpers.log({
          accion: 'PUT',
          descripcion,
          origen: 'RegistroCajaController.completar',
          token: req.headers.authorization,
          elementId: id,
          success: true
        });

        return await proceed();
      });

      return res.ok(registroCajaActualizada);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al completar el registro de caja.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'RegistroCajaController.completar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Ocurrió un error al completar el registro de caja.'
      });
    }
  },
  cerrar: async function (req, res) {
    try {
      let registroCajaActualizada = {};
      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }
      await Caja.getDatastore().transaction(async (db, proceed) => {
        const registroCaja = await RegistroCaja.findOne({ id: id, deleted: false }).usingConnection(db);

        if (!registroCaja) {
          return res.badRequest({ err: 'No existe el registro de caja' });
        }

        if (registroCaja.estado === 'cerrada') {
          return res.badRequest({ err: 'La caja ya se encuentra cerrada' });
        }

        const cajaActualizada = await Caja.updateOne({ id: registroCaja.cajaId }).set({ disponible: true }).usingConnection(db);

        if (!cajaActualizada) {
          return await proceed(new Error('Ocurrio un error al actualizar la caja'));
        }

        const registroCajaActualizado = await RegistroCaja.updateOne({ id: id, deleted: false }).set({ estado: 'cerrada', fechaCierre: new Date() }).usingConnection(db);

        if (!registroCajaActualizado) {
          return await proceed(new Error('Ocurrio un error al actualizar el registro de caja'));
        }

        registroCajaActualizada = registroCajaActualizado;

        // Generar log
        const descripcion = `Se cerro el registro de caja con los siguientes datos:\n${JSON.stringify(registroCajaActualizado, null, 2)}`;
        await sails.helpers.log({
          accion: 'PUT',
          descripcion,
          origen: 'RegistroCajaController.cerrar',
          token: req.headers.authorization,
          elementId: id,
          success: true
        });

        return await proceed();
      });

      return res.ok(registroCajaActualizada);

    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al cerrar el registro de caja.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'RegistroCajaController.cerrar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Ocurrió un error al cerrar el registro de caja.'
      });

    }
  },
  imprimir: async function (req, res) {
    try {
      const id = req.params.id;
      const { efectivo, tarjeta, cheque, transferencia, user, fechaInicio, fechaFin } = req.allParams();
      const recibido = {
        efectivo: parseFloat(efectivo || 0.00),
        tarjeta: parseFloat(tarjeta || 0.00),
        cheque: parseFloat(cheque || 0.00),
        transferencia: parseFloat(transferencia || 0.00),
      };
      const registroCaja = await RegistroCaja.findOne({ id, deleted: false }).populate('cajaId');

      if (!registroCaja) {
        return res.badRequest({ err: 'No existe el registro de caja' });
      }

      if (registroCaja.estado === 'abierta') {
        return res.badRequest({ err: 'La caja se encuentra abierta' });
      }

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = new Date(fechaInicio);
      }
      if (fechaFin) {
        fechaFilter['<='] = new Date(fechaFin);
      }

      const facturasWhere = {
        registroCajaId: id,
        deleted: false,
        estado: 'Completada',
        fecha: fechaFilter
      };

      if (Object.keys(facturasWhere.fecha).length === 0) {
        delete facturasWhere.fecha;
      }

      const facturas = await Factura.find({ where: facturasWhere });

      // console.log(registroCaja);
      // console.log(recibido);
      // console.log(facturas);

      // Agrupa los pagos por metodo de pago
      const groupPaymentMethods = (payments) => {
        const grouped = payments.reduce((acc, curr) => {
          const { metodoPago, recibido } = curr;
          if (!acc[metodoPago]) {
            acc[metodoPago] = parseFloat(recibido);
          } else {
            acc[metodoPago] += parseFloat(recibido);
          }
          return acc;
        }, {});
        return grouped;
      };

      const getTotalFacturasCreditos = (bills) => {
        if (!bills) { return 0; }
        if (bills.length === 0) { return 0; }
        const total = bills.reduce((acc, bill) => {
          if (bill.isCredit) {
            return acc + bill.total;
          }
          return acc;
        }, 0);
        return total;
      };

      const calculateCashTotal = (payments, total) => {
        const grouped = groupPaymentMethods(payments);

        const nonCash = Object.keys(grouped).reduce((acc, curr) => {
          if (curr !== 'Efectivo') {
            return acc + grouped[curr];
          }
          return acc;
        }, 0);
        const cashTotal = total === nonCash ? 0 : total - nonCash;
        return cashTotal;
      };

      const grouped = facturas.filter(x => !x.isCredit).map((bill) => {
        const { pagos } = bill;
        const grouped = groupPaymentMethods(pagos);
        return { ...grouped, Efectivo: calculateCashTotal(pagos, bill.total) };
      });

      const groupedPayments = grouped.reduce((acc, curr) => {
        Object.keys(curr).forEach((key) => {
          if (!acc[key]) {
            acc[key] = curr[key];
          } else {
            acc[key] += curr[key];
          }
        });
        return acc;
      }, {});

      // const getTotal = (bills) => {
      //   if (!bills) {return 0;}
      //   if (bills.length === 0) {return 0;}

      //   const total = bills.reduce((acc, bill) => acc + bill.total, 0);
      //   return total;
      // };

      const getTotalDelivery = (bills) => {
        if (!bills) { return 0; }
        if (bills.length === 0) { return 0; }

        const total = bills.reduce((acc, bill) => acc + bill.delivery, 0);
        return total;
      };

      const numberFormat = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      });

      const formatCurrency = (value) => {
        return `${numberFormat.format(value)}`;
      };

      const efectivoInicial = registroCaja.efectivoInicial;
      const totalACredito = getTotalFacturasCreditos(facturas);
      const totalEnEfectivo = groupedPayments.Efectivo || 0.00;
      const totalConTarjeta = groupedPayments.Tarjeta || 0.00;
      const totalConCheque = groupedPayments.Cheque || 0.00;
      const totalConTransferencia = groupedPayments.Transferencia || 0.00;
      const totalFacturado = parseFloat(totalEnEfectivo) + parseFloat(totalConTarjeta) + parseFloat(totalConCheque) + parseFloat(totalConTransferencia);
      const ventasAlContado = totalFacturado;
      const efectivoEnCaja = efectivoInicial + totalEnEfectivo;
      const delivery = getTotalDelivery(facturas);
      const totalRecibido = parseFloat(recibido.efectivo || 0.00) + parseFloat(recibido.tarjeta || 0.00) + parseFloat(recibido.cheque || 0.00) + parseFloat(recibido.transferencia || 0.00);

      // console.log('***************************************');
      // console.log('Efectivo inicial', efectivoInicial);
      // console.log('Metodos de pago', groupedPayments);
      // console.log('Total a credito', totalACredito);
      // console.log('Total en efectivo', totalEnEfectivo);
      // console.log('Total con tarjeta', totalConTarjeta);
      // console.log('Total con cheque', totalConCheque);
      // console.log('Total con transferencia', totalConTransferencia);
      // console.log('Total facturado', totalFacturado);
      // console.log('Ventas al contado', ventasAlContado);
      // console.log('Efectivo en caja', efectivoEnCaja);
      // console.log('***************************************');

      const diferencia = {
        efectivo: parseFloat(efectivoEnCaja || 0.00) - parseFloat(recibido.efectivo || 0.00),
        tarjeta: parseFloat(totalConTarjeta || 0.00) - parseFloat(recibido.tarjeta || 0.00),
        cheque: parseFloat(totalConCheque || 0.00) - parseFloat(recibido.cheque || 0.00),
        transferencia: parseFloat(totalConTransferencia || 0.00) - parseFloat(recibido.transferencia || 0.00),
        total: (efectivoEnCaja - recibido.efectivo) + (totalConTarjeta - recibido.tarjeta) + (totalConCheque - recibido.cheque) + (totalConTransferencia - recibido.transferencia)
      };

      const datos = {
        registroCaja,
        fechaApertura: new Date(registroCaja.fechaApertura).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' }),
        fechaCierre: new Date(registroCaja.fechaCierre).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' }),
        fecha: new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' }),
        user: user.toUpperCase(),
        efectivoInicial: formatCurrency(parseFloat(efectivoInicial).toFixed(2)),
        totalACredito: formatCurrency(parseFloat(totalACredito).toFixed(2)),
        totalEnEfectivo: formatCurrency(parseFloat(totalEnEfectivo).toFixed(2)),
        totalConTarjeta: formatCurrency(parseFloat(totalConTarjeta).toFixed(2)),
        totalConCheque: formatCurrency(parseFloat(totalConCheque).toFixed(2)),
        totalConTransferencia: formatCurrency(parseFloat(totalConTransferencia).toFixed(2)),
        totalFacturado: formatCurrency(parseFloat(totalFacturado).toFixed(2)),
        ventasAlContado: formatCurrency(parseFloat(ventasAlContado).toFixed(2)),
        efectivoEnCaja: formatCurrency(parseFloat(efectivoEnCaja).toFixed(2)),
        delivery: formatCurrency(parseFloat(delivery).toFixed(2)),
        recibido: {
          efectivo: formatCurrency(parseFloat(recibido.efectivo || 0.00).toFixed(2)),
          tarjeta: formatCurrency(parseFloat(recibido.tarjeta || 0.00).toFixed(2)),
          cheque: formatCurrency(parseFloat(recibido.cheque || 0.00).toFixed(2)),
          transferencia: formatCurrency(parseFloat(recibido.transferencia || 0.00).toFixed(2)),
          total: formatCurrency(parseFloat(totalRecibido || 0.00).toFixed(2))
        },
        diferencia: {
          efectivo: formatCurrency(parseFloat(diferencia.efectivo).toFixed(2)),
          tarjeta: formatCurrency(parseFloat(diferencia.tarjeta).toFixed(2)),
          cheque: formatCurrency(parseFloat(diferencia.cheque).toFixed(2)),
          transferencia: formatCurrency(parseFloat(diferencia.transferencia).toFixed(2)),
          total: formatCurrency(parseFloat(diferencia.total).toFixed(2))
        },
        totalSistema: formatCurrency(parseFloat(efectivoInicial + totalFacturado).toFixed(2)),
      };

      // console.log('***************************************');
      // console.log(datos);
      // console.log('***************************************');

      // Generar log
      const descripcion = `Se genero el cierre de caja con el ID: ${id}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'RegistroCajaController.imprimir',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();

      // Ruta a la plantilla EJS
      const templateEjs = 'views/cierre.ejs';

      // Renderiza el archivo EJS
      const ejsTemplate = fs.readFileSync(templateEjs, 'utf-8');
      const html = ejs.render(ejsTemplate, datos);

      // Configura la página y genera el PDF
      await page.setContent(html);
      const pdfBuffer = await page.pdf({ format: 'Letter' }); // Ajusta el formato según tus necesidades

      // Cierra el navegador de Puppeteer
      await browser.close();

      // Envía el PDF como respuesta
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al imprimir el cierre de caja.\n- Error: ${JSON.stringify(err, null, 2)}\n- Params: ${JSON.stringify(req.params, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'RegistroCajaController.imprimir',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(err);
    }
  }
};

