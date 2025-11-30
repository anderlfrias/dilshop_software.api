/**
 * ReporteController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const csvWriteStream = require('csv-write-stream');
const fs = require('fs');

const SELECT_VISTA_FACTURAS = `SELECT * FROM vista_facturas`;

function convertirFechaAMySQLFormat(fecha) {
  // Obtener los componentes de la fecha
  const year = fecha.getFullYear();
  const month = ('0' + (fecha.getMonth() + 1)).slice(-2); // Los meses van de 0 a 11, por eso se suma 1
  const day = ('0' + fecha.getDate()).slice(-2);
  const hours = ('0' + fecha.getHours()).slice(-2);
  const minutes = ('0' + fecha.getMinutes()).slice(-2);
  const seconds = ('0' + fecha.getSeconds()).slice(-2);
  const milliseconds = ('00' + fecha.getMilliseconds()).slice(-3);

  // Formatear la fecha en el formato de MySQL
  const mysqlFormat = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;

  return mysqlFormat;
}

// funcion para devolver fecha en formato AAAAMMDD
const getFechaComprobante = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}${month < 10 ? `0${month}` : month}${day < 10 ? `0${day}` : day}`;
}

const agruparPorMetodoDepago = (payments) => {
  const grouped = payments.reduce((acc, curr) => {
    const { metodoPago, recibido } = curr
    if (!acc[metodoPago]) {
      acc[metodoPago] = recibido
    } else {
      acc[metodoPago] += recibido
    }
    return acc
  }, {})
  return grouped;
}

const getPaymentMethods = (pagos) => {
  if (!pagos) return 'Credito'
  if (pagos.length === 0) return 'Credito'

  let paymentMethods = [];

  for (let i = 0; i < pagos.length; i++) {
    const { metodoPago } = pagos[i];
    paymentMethods = [...paymentMethods, metodoPago]
  }

  return paymentMethods.join(', ')
}

const getClienteLabel = (bill) => {
  if (bill.clienteRNC) {
    const nombreCliente = bill.clienteRNC['Nombre Comercial']
      ? bill.clienteRNC['Nombre Comercial'].trim()
      : bill.clienteRNC['Nombre/Razón Social'] || '';

    return nombreCliente;
  }

  if (bill.clienteId) {
    return `${bill.clienteId.nombre || ''} ${bill.clienteId.apellido || ''}`
  }

  return 'Ocasionales'
};

const getTotalPorMetododePago = (pagos, metodo) => {
  return agruparPorMetodoDepago(pagos)[metodo] || 0.00
};

const getCliente = (factura) => {
  if (factura.clienteRNC) {
    const identificacion = factura.clienteRNC['Cédula/RNC'].toString().trim().replace(/-/g, '');
    const codigo = identificacion.length === 11 ? 2 : 1;
    return {
      identificacion,
      codigo,
    };
  }

  if (factura.clienteId) {
    return {
      identificacion: factura.clienteId.identificacion.toString().trim().replace(/-/g, ''),
      codigo: 2,
    };
  }

  return {
    identificacion: '',
    codigo: 0,
  };
};

function AddDays(date, days) {
  const newDate = date.setDate(date.getDate() + days);
  return new Date(newDate).toISOString();
}

module.exports = {
  resumenDeVentas: async function (req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        tipoFactura,
        factura,
        id,
        clienteId,
      } = req.allParams();

      let query = `
        SELECT
          SUM(subTotal) as subTotal,
          SUM(impuesto) as impuesto,
          SUM(total) as total,
          SUM(delivery) as delivery,
          SUM(CASE WHEN isCredit = 1 THEN total ELSE 0 END) as credito,
          SUM(CASE WHEN isCredit = 0 THEN total ELSE 0 END) as contado
        FROM factura
      `;

      const conditions = ['deleted = false', 'estado = \'Completada\'', 'isCreditPayment = 0'];
      const params = [];
      let count = 1;

      if (fechaInicio) {
        conditions.push(`fecha >= $${count}`);
        params.push(new Date(fechaInicio));
        count++;
      }
      if (fechaFin) {
        conditions.push(`fecha <= $${count}`);
        params.push(new Date(fechaFin));
        count++;
      }
      if (tipoFactura) {
        conditions.push(`tipoFactura = $${count}`);
        params.push(tipoFactura);
        count++;
      }
      if (typeof factura !== 'undefined') {
        conditions.push(`isCredit = $${count}`);
        params.push(factura === 'credito' ? 1 : 0);
        count++;
      }
      if (id) {
        conditions.push(`id LIKE $${count}`);
        params.push(`%${id}%`);
        count++;
      }
      if (clienteId) {
        conditions.push(`clienteId = $${count}`);
        params.push(clienteId);
        count++;
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await sails.sendNativeQuery(query, params);
      return res.ok(result.rows[0]);

      // return res.ok(total)
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el resumen de ventas de las facturas.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ReporteController.resumenDeVentas',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  ventas: async function (req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        tipoFactura,
        factura,
        id,
        clienteId,
        page = 0,
        top = 10
      } = req.allParams();

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = new Date(fechaInicio);
      }
      if (fechaFin) {
        fechaFilter['<='] = new Date(fechaFin);
      }

      const whereClause = {
        deleted: false,
        estado: 'Completada',
        fecha: fechaFilter,
        tipoFactura: tipoFactura,
        isCredit: factura === 'credito' ? true : false,
        isCreditPayment: false,
      };

      id && (whereClause.id = { contains: id });
      clienteId && (whereClause.clienteId = clienteId);

      if (Object.keys(whereClause.fecha).length === 0) {
        delete whereClause.fecha;
      }

      !whereClause.tipoFactura && delete whereClause.tipoFactura;
      typeof factura === 'undefined' && delete whereClause.isCredit;

      const [facturas, catidadFacturas] = await Promise.all([
        Factura.find({
          where: whereClause,
        })
          .populate('clienteId')
          .limit(top)
          .skip(page * top)
          .sort('fecha DESC'),
        Factura.count(whereClause)
      ]);

      return res.ok({ facturas, catidadFacturas });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar las facturas.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ReporteController.ventas',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  ventasCSV: async function (req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        tipoFactura,
        factura,
        id,
        clienteId,
      } = req.allParams();

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = convertirFechaAMySQLFormat(new Date(fechaInicio));
      }
      if (fechaFin) {
        fechaFilter['<='] = convertirFechaAMySQLFormat(new Date(fechaFin));
      }

      const whereClause = {
        deleted: false,
        estado: 'Completada',
        fecha: fechaFilter,
        tipoFactura: tipoFactura,
        isCredit: factura === 'credito' ? true : false,
        isCreditPayment: false,
      };

      if (Object.keys(whereClause.fecha).length === 0) {
        delete whereClause.fecha;
      }

      id && (whereClause.id = { 'LIKE': id });
      clienteId && (whereClause.clienteId = clienteId);

      !whereClause.tipoFactura && delete whereClause.tipoFactura;
      typeof factura === 'undefined' && delete whereClause.isCredit;

      const sqlWhereClause = await sails.helpers.convertToSqlWhereClause(whereClause);

      await sails.sendNativeQuery(`${SELECT_VISTA_FACTURAS} ${sqlWhereClause}`, [], (err, result) => {
        if (err) {
          throw new Error(err);
        }
        const data = result.rows.map(factura => {
          const clienteRNC = factura.clienteRNC ? JSON.parse(factura.clienteRNC) : null;
          let clienteId = factura.nombre ? { nombre: factura.nombre, apellido: factura.apellido } : null;

          return {
            ['No. Factura']: factura.id || '',
            ['NCF']: factura.ncf || '',
            ['Fecha']: new Date(factura.fecha).toLocaleDateString('es-DO'),
            ['Tipo Documente']: factura.isCredit ? 'Credito' : 'Contado',
            ['Tipo de factura']: factura.tipoFactura || '',
            ['Cedula/RNC']: (clienteRNC && clienteRNC['Cédula/RNC']) || factura.identificacion || '',
            ['Cliente']: getClienteLabel({ clienteRNC, clienteId }),
            ['Metodo de pago']: getPaymentMethods(JSON.parse(factura.pagos || '[]')), // Assuming pagos could be null/undefined
            ['SubTotal']: (factura.subTotal !== null && factura.subTotal !== undefined) ? factura.subTotal.toFixed(2) : 0.00,
            ['ITBIS']: (factura.impuesto !== null && factura.impuesto !== undefined) ? factura.impuesto.toFixed(2) : 0.00,
            ['Total']: (factura.total !== null && factura.total !== undefined) ? factura.total.toFixed(2) : 0.00,

          };
        });
        // Crea un archivo de escritura CSV.

        const writer = csvWriteStream();
        const writableStream = fs.createWriteStream('.tmp/data.csv');

        // Encabezados del CSV
        writer.pipe(writableStream);

        data.forEach(item => {
          writer.write(item);
        });

        writer.end();

        writableStream.on('finish', function () {
          // Configura la respuesta para descargar el archivo CSV.
          res.download('.tmp/data.csv');
        });
      });


    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al exportar las facturas a CSV.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ReporteController.ventasCSV',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  reporte607: async function (req, res) {
    try {
      const { fechaInicio, fechaFin, page = 0, top = 10 } = req.allParams();

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = new Date(fechaInicio);
      }
      if (fechaFin) {
        fechaFilter['<='] = new Date(fechaFin);
      }

      const whereClause = {
        deleted: false,
        estado: 'Completada',
        fecha: fechaFilter,
        isCreditPayment: false,
      };

      if (Object.keys(whereClause.fecha).length === 0) {
        delete whereClause.fecha;
      }

      const cantidadFacturas = await Factura.count(whereClause);
      const facturas = await Factura.find(whereClause)
        .populate('clienteId')
        .limit(top)
        .skip(page * top);

      const data = facturas.map(factura => {
        const cliente = getCliente(factura);
        const Efectivo = getTotalPorMetododePago(factura.pagos, 'Efectivo') ? getTotalPorMetododePago(factura.pagos, 'Efectivo') : 0.00;
        const Cheque = getTotalPorMetododePago(factura.pagos, 'Cheque') ? getTotalPorMetododePago(factura.pagos, 'Cheque') : 0.00;
        const Tarjeta = getTotalPorMetododePago(factura.pagos, 'Tarjeta') ? getTotalPorMetododePago(factura.pagos, 'Tarjeta') : 0.00;
        const Transferencia = getTotalPorMetododePago(factura.pagos, 'Transferencia') ? getTotalPorMetododePago(factura.pagos, 'Transferencia') : 0.00;

        const totalRecibido = parseFloat(factura.pagos.reduce((acc, pago) => acc + pago.recibido, 0));
        const cambio = totalRecibido - factura.total;

        const efectivoFinal = Efectivo ? cambio > 0 ? Efectivo - cambio : Efectivo : 0.00;

        return {
          RNC: cliente.identificacion,
          Tipo: cliente.codigo,
          NCF: factura.ncf,
          Modificado: '',
          TipoIngreso: 1,
          Fecha: getFechaComprobante(factura.fecha),
          FechaRetencion: '',
          Monto: factura.subTotal.toFixed(2),
          ITBIS: factura.impuesto.toFixed(2),
          ITBISRetenido: 0.00,
          ITBISPercibido: 0.00,
          RetencionRenta: 0.00,
          ISRPercibido: 0.00,
          ISC: 0.00,
          OI: 0.00,
          Ley: 0.00,
          Efectivo: efectivoFinal,
          Cheque,
          Tarjeta,
          Transferencia,
          Credito: factura.isCredit ? factura.total.toFixed(2) : 0.00,
          Bono: 0.00,
          Permuta: 0.00,
          OFV: 0.00,
          idEmpresa: 2,
          ITBIS_R: factura.impuesto,
          ITBIS_NR: 0.00,
        }
      });

      return res.ok({ data, cantidadFacturas });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar las facturas para el reporte 607.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ReporteController.reporte607',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  reporte607CSV: async function (req, res) {
    try {
      const { fechaInicio, fechaFin } = req.allParams();

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = convertirFechaAMySQLFormat(new Date(fechaInicio));
      }
      if (fechaFin) {
        fechaFilter['<='] = convertirFechaAMySQLFormat(new Date(fechaFin));
      }

      const whereClause = {
        deleted: false,
        estado: 'Completada',
        fecha: fechaFilter,
        isCreditPayment: false,
      };

      if (Object.keys(whereClause.fecha).length === 0) {
        delete whereClause.fecha;
      }

      // const facturas = await Factura.find(whereClause).populate('clienteId');
      const sqlWhereClause = await sails.helpers.convertToSqlWhereClause(whereClause);

      await sails.sendNativeQuery(`${SELECT_VISTA_FACTURAS} ${sqlWhereClause}`, [], (err, result) => {
        if (err) {
          throw new Error(err);
        }
        const facturas = result.rows;
        const data = facturas.map(factura => {
          const pagos = JSON.parse(factura.pagos);
          const clienteRNC = factura.clienteRNC ? JSON.parse(factura.clienteRNC) : null;
          let clienteId = factura.nombre ? { nombre: factura.nombre, apellido: factura.apellido, identificacion: factura.identificacion } : null;

          const cliente = getCliente({ clienteRNC, clienteId });
          const Efectivo = getTotalPorMetododePago(pagos, 'Efectivo') ? getTotalPorMetododePago(pagos, 'Efectivo') : 0.00;
          const Cheque = getTotalPorMetododePago(pagos, 'Cheque') ? getTotalPorMetododePago(pagos, 'Cheque') : 0.00;
          const Tarjeta = getTotalPorMetododePago(pagos, 'Tarjeta') ? getTotalPorMetododePago(pagos, 'Tarjeta') : 0.00;
          const Transferencia = getTotalPorMetododePago(pagos, 'Transferencia') ? getTotalPorMetododePago(pagos, 'Transferencia') : 0.00;

          const totalRecibido = parseFloat(pagos.reduce((acc, pago) => acc + pago.recibido, 0));
          const cambio = totalRecibido - factura.total;

          const efectivoFinal = Efectivo ? cambio > 0 ? Efectivo - cambio : Efectivo : 0.00;

          return {
            RNC: cliente.identificacion,
            Tipo: cliente.codigo,
            NCF: factura.ncf,
            Modificado: '',
            TipoIngreso: 1,
            Fecha: getFechaComprobante(factura.fecha),
            FechaRetencion: '',
            Monto: factura.subTotal.toFixed(2),
            ITBIS: factura.impuesto.toFixed(2),
            ITBISRetenido: 0.00,
            ITBISPercibido: 0.00,
            RetencionRenta: 0.00,
            ISRPercibido: 0.00,
            ISC: 0.00,
            OI: 0.00,
            Ley: 0.00,
            Efectivo: efectivoFinal,
            Cheque,
            Tarjeta,
            Transferencia,
            Credito: factura.isCredit ? factura.total : 0.00,
            Bono: 0.00,
            Permuta: 0.00,
            OFV: 0.00,
            idEmpresa: 2,
            ITBIS_R: factura.impuesto,
            ITBIS_NR: 0.00,
          }
        });

        // Crea un archivo de escritura CSV.
        const writer = csvWriteStream();
        const writableStream = fs.createWriteStream('.tmp/data.csv');

        // Encabezados del CSV
        writer.pipe(writableStream);

        data.forEach(item => {
          writer.write(item);
        });

        writer.end();

        writableStream.on('finish', function () {
          // Configura la respuesta para descargar el archivo CSV.
          res.download('.tmp/data.csv');
        });
      });


    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al exportar las facturas para el reporte 607 a CSV.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ReporteController.reporte607CSV',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  analisisActiguedadSaldos: async function (req, res) {
    try {
      const { page = 0, top = 10 } = req.allParams();
      const cxc = await CxC.find().where({ deleted: false, estado: 'Pendiente' })
        .populate('clienteId')
      // .limit(top)
      // .skip(page*top);

      const date30Days = AddDays(new Date(), -30);
      const date60Days = AddDays(new Date(), -60);
      const date90Days = AddDays(new Date(), -90);
      const select = ['id', 'fecha', 'pagos', 'subTotal', 'impuesto', 'total', 'delivery', 'isCredit'];
      // console.log(date30Days, date60Days, date90Days);

      for (let i = 0; i < cxc.length; i++) {
        const item = cxc[i];
        const where = { cxcId: item.id, deleted: false, estado: 'Completada' };

        const facturas30Dias = await Factura.find().where({ ...where, fecha: { '>=': date30Days } }).select(select);
        const facturas60Dias = await Factura.find().where({ ...where, fecha: { '<': date30Days, '>=': date60Days, } }).select(select);
        const facturas90Dias = await Factura.find().where({ ...where, fecha: { '<': date60Days, '>=': date90Days, } }).select(select);
        const facturasMas90Dias = await Factura.find().where({ ...where, fecha: { '<': date90Days } }).select(select);

        const facturas = {
          facturas30Dias,
          facturas60Dias,
          facturas90Dias,
          facturasMas90Dias,
        };

        cxc[i].facturas = facturas;
      }

      return res.ok({ data: cxc });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar las CxC para el analisis de antiguedad de saldos.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ReporteController.analisisActiguedadSaldos',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },

};

