
/**
 * FacturaController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const objId = require('mongodb').ObjectID;

const puppeteer = require('puppeteer');
const fs = require('fs');
const ejs = require('ejs');

// Precompilar plantillas EJS al iniciar la aplicación
const templatePathInvoice = 'views/invoice.ejs';
const templatePathCredit = 'views/invoice-credit.ejs';
const invoiceTemplate = ejs.compile(fs.readFileSync(templatePathInvoice, 'utf-8'));
const creditTemplate = ejs.compile(fs.readFileSync(templatePathCredit, 'utf-8'));

// Instancia global de Puppeteer (inicializar en el arranque de la app)
let browserPromise = null;
const getBrowser = async () => {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Mejora el rendimiento
    });
  }
  return browserPromise;
};

// const FACTURAS_CON_COMPROBANTE_FISCAL = ['factura-credito-fiscal', 'regimen-especial', 'gubernamental', 'consumidores-finales'];
const TIPO_FACTURA_MAP = {
  'factura-credito-fiscal': '01',
  'consumidores-finales': '02',
  'regimen-especial': '14',
  'gubernamental': '15',
};

const TIPO_FACTURA_PARA_IMPRECION = {
  ['consumidores-finales']: 'CONSUMIDORES FINALES',
  ['factura-credito-fiscal']: 'FACTURA CRÉDITO FISCAL',
  ['regimen-especial']: 'RÉGIMEN ESPECIAL',
  ['gubernamental']: 'GUBERNAMENTAL',
};

module.exports = {
  crear: async function (req, res) {
    try {
      const factura = {
        id: new objId().toString(),
        fecha: req.body.fecha,
        clienteId: req.body.clienteId || null,
        mesaId: req.body.mesaId || null,
        registroCajaId: req.body.registroCajaId,
        porcientoDescuento: req.body.porcientoDescuento || 0,
        tipoFactura: req.body.tipoFactura || '',
        clienteRNC: req.body.clienteRNC || '',
        pagos: req.body.pagos || [],
        subTotal: req.body.subTotal || 0,
        total: req.body.total || 0,
        delivery: req.body.delivery || 0,
        impuesto: req.body.impuesto || 0,
      };

      if (!factura.fecha) {
        return res.badRequest({ err: 'La fecha es requerida' });
      }

      if (!factura.registroCajaId) {
        return res.badRequest({ err: 'El registro de caja es requerido' });
      }

      const facturaCreada = await Factura.create(factura).fetch();

      if (!facturaCreada) {
        return res.serverError('No se pudo crear la factura');
      }

      // Generar log
      const descripcion = `Se creo una factura con los siguientes datos:\n${JSON.stringify(facturaCreada, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'FacturaController.crear',
        token: req.headers.authorization,
        elementId: facturaCreada.id,
        success: true
      });

      return res.ok(facturaCreada);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al crear la factura.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'FacturaController.crear',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  listar: async function (req, res) {
    try {
      const filter = req.query.filter || '';
      const facturas = await Factura.find({
        deleted: false,
        // contactos: false,
        or: [
          { fecha: { contains: filter } }, { estado: { contains: filter } }
        ]
      }).populate('clienteId').populate('registroCajaId').populate('clienteId').sort('createdAt DESC');

      return res.ok(facturas);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar las facturas.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'FacturaController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  actualizar: async function (req, res) {
    try {
      const facturaId = req.params.id;
      const factura = {
        fecha: req.body.fecha ? new Date(req.body.fecha) : null,
        ncf: req.body.ncf || '',
        clienteId: req.body.clienteId || null,
        isCredit: req.body.isCredit || false,
        isCreditPayment: req.body.isCreditPayment || false,
        subTotal: req.body.subTotal || 0,
        impuesto: req.body.impuesto || 0,
        delivery: req.body.delivery || 0,
        total: req.body.total || 0,
        pagos: req.body.pagos || [],
      };

      if (!facturaId) {
        return res.badRequest({ err: 'El ID de la factura es requerido' });
      }

      if (!factura.fecha) {
        return res.badRequest({ err: 'La fecha es requerida' });
      }

      if (!factura.ncf) {
        return res.badRequest({ err: 'El NCF es requerido' });
      }

      const facturaDesactalizada = await Factura.findOne({ id: facturaId });

      if (!facturaDesactalizada) {
        return res.badRequest({ err: 'La factura no existe' });
      }

      const facturaToCreate = {
        ...facturaDesactalizada,
        ...factura,
      };
      const facturaActualizada = await Factura.updateOne({ id: facturaId }).set(facturaToCreate);

      if (!facturaActualizada) {
        return res.serverError('No se pudo actualizar la factura');
      }

      // Generar log
      const descripcion = `Se actualizo la factura con los siguientes datos:\n- Datos anteriores: ${JSON.stringify(facturaDesactalizada, null, 2)}\n- Datos nuevos: ${JSON.stringify(facturaActualizada, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'FacturaController.actualizar',
        token: req.headers.authorization,
        elementId: facturaDesactalizada.id,
        success: true
      });

      return res.ok(facturaActualizada);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al actualizar la factura.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'FacturaController.actualizar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  agregarProductos: async function (req, res) {
    const facturaId = req.body.facturaId;
    const productos = req.body.productos;

    try {
      await Producto.getDatastore().transaction(async (db, proceed) => {
        const facturaProducto = [];

        const factura = await Factura.findOne({ id: facturaId }).usingConnection(db);

        if (!factura) {
          return await proceed(new Error('La Factura no existe'));
        }

        for (const producto of productos) {
          const productoEncontrado = await Producto.findOne({ id: producto.id }, { deleted: false }).usingConnection(db);

          if (!productoEncontrado) {
            return await proceed(new Error('El producto no existe'));
          }

          // const cantidad = productoEncontrado.cantidad - producto.cantidad;

          // await Producto.updateOne({ id: producto.id })
          //   .set({ cantidad: cantidad })
          //   .usingConnection(db);

          facturaProducto.push({
            id: new objId().toString(),
            facturaId: facturaId,
            productoId: producto.id,
            cantidad: producto.cantidad,
            precio: productoEncontrado.precio,
            costo: productoEncontrado.costo,
          });

        }

        if (!facturaId) {
          return await proceed(new Error('El ID de la Factura no está definido'));
        }

        await FacturaProducto.createEach(facturaProducto).usingConnection(db).catch(err => {
          sails.log.error(err);
          return proceed(new Error('Ocurrió un error al agregar los productos'));
        });


        // Si todo está bien, confirma la transacción
        return await proceed();
      });

      // ...

      // ...

      // Generar log
      const descripcion = `Se agregaron productos los productos: ${JSON.stringify(productos, null, 2)}\n a la factura con el ID: ${facturaId}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'FacturaController.agregarProductos',
        token: req.headers.authorization,
        elementId: facturaId,
        success: true
      });
      // Envía la respuesta al cliente
      return res.ok({ message: 'Productos agregados exitosamente' });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al agregar los productos a la factura con el ID: ${facturaId}.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'FacturaController.agregarProductos',
        token: req.headers.authorization,
        elementId: facturaId,
        success: false
      });

      // Si hay un error, deshace la transacción
      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Ocurrió un error al agregar los productos.'
      });
    }
  },
  agregarProductosPreFactura: async function (req, res) {
    const facturaId = req.body.facturaId;
    const preFacturaId = req.body.preFacturaId;

    try {
      await Producto.getDatastore().transaction(async (db, proceed) => {
        if (!preFacturaId) {
          return await proceed(new Error('El ID de la preFactura no está definido'));
        }

        if (!facturaId) {
          return await proceed(new Error('El ID de la Factura no está definido'));
        }

        const facturaProducto = [];

        const factura = await Factura.findOne({ id: facturaId }).usingConnection(db);

        if (!factura) {
          return await proceed(new Error('La Factura no existe'));
        }

        const preFactura = await PreFactura.findOne({ id: preFacturaId }).usingConnection(db);

        if (!preFactura) {
          return await proceed(new Error('La preFactura no existe'));
        }
        const productos = await PreFacturaProducto.find({ preFacturaId: preFacturaId, deleted: false }).usingConnection(db);

        if (!productos) {
          return await proceed(new Error('La preFactura no tiene productos'));
        }

        for (const producto of productos) {

          // await Producto.updateOne({ id: producto.id })
          //   .set({ cantidad: cantidad })
          //   .usingConnection(db);

          facturaProducto.push({
            id: new objId().toString(),
            facturaId: facturaId,
            productoId: producto.id,
            cantidad: producto.cantidad,
            precio: producto.precio,
            costo: producto.costo,
            impuesto: producto.impuesto,
            nombre: producto.nombre,
          });

        }

        if (!facturaId) {
          return await proceed(new Error('El ID de la Factura no está definido'));
        }

        await FacturaProducto.createEach(facturaProducto).usingConnection(db).catch(err => {
          sails.log.error(err);
          return proceed(new Error(`Ocurrió un error al agregar los productos`));
        });


        // Si todo está bien, confirma la transacción
        return await proceed();
      });

      // ...

      // ...

      // Generar log
      const descripcion = `Se agregaron productos de la preFactura con el ID: ${preFacturaId} a la factura con el ID: ${facturaId}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'FacturaController.agregarProductos',
        token: req.headers.authorization,
        elementId: facturaId,
        success: true
      });

      // Envía la respuesta al cliente
      return res.ok({ message: 'Productos agregados exitosamente' });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al agregar los productos a la factura con el ID: ${facturaId}.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'FacturaController.agregarProductos',
        token: req.headers.authorization,
        elementId: facturaId,
        success: false
      });
      // Si hay un error, deshace la transacción
      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Ocurrió un error al agregar los productos.'
      });
    }
  },
  crearFacturaConProductos: async function (req, res) {
    let facturaId;
    let cxcId; // ID de la CxC si es a crédito o abono a crédito
    const preFacturaId = req.params.prefacturaid;

    try {
      const factura = {
        id: new objId().toString(),
        fecha: new Date(),
        clienteId: req.body.clienteId || null,
        mesaId: req.body.mesaId || null,
        estado: 'Completada',
        registroCajaId: req.body.registroCajaId,
        porcientoDescuento: req.body.porcientoDescuento || 0,
        tipoFactura: req.body.tipoFactura || '',
        clienteRNC: req.body.clienteRNC || '',
        pagos: req.body.pagos || [],
        subTotal: req.body.subTotal || 0,
        total: req.body.total || 0,
        delivery: req.body.delivery || 0,
        impuesto: req.body.impuesto || 0,
        isCredit: req.body.isCredit || false,
      };

      if (!factura.registroCajaId) {
        return res.badRequest({ err: 'El registro de caja es requerido' });
      }

      await Factura.getDatastore().transaction(async (db, proceed) => {
        // Generar NCF
        const tipoComprobante = TIPO_FACTURA_MAP[factura.tipoFactura];

        if (!tipoComprobante) {
          return await proceed(new Error('El tipo de comprobante no es válido'));
        }
        // Construir la consulta SQL con el tipoComprobante como parte de la cadena de consulta
        const query = `
          SELECT * FROM ncf 
          WHERE deleted = false AND estado = "abierto" AND tipoComprobante = $1 
          ORDER BY fecha ASC 
          LIMIT 1 
          FOR UPDATE
        `;

        // // Ejecutar la consulta
        await NCF.getDatastore().sendNativeQuery(query, [tipoComprobante]).usingConnection(db);
        const nextNcfResp = await sails.helpers.getNextNcf(tipoComprobante, db);
        if (nextNcfResp.success) {
          factura.ncf = nextNcfResp.ncf;
        } else {
          return await proceed(new Error(nextNcfResp.message));
        }

        // Crear CxC si es a crédito
        if (factura.isCredit) {
          //Verificar si el cliente tiene una CxC abierta
          const cxcAbierta = await CxC.find({ clienteId: factura.clienteId, estado: 'Pendiente' }).usingConnection(db);

          if (cxcAbierta.length > 0) {
            // Verificar si la cxc excede el limite de credito
            const cliente = await Cliente.findOne({ id: factura.clienteId }).usingConnection(db);
            const restante = cxcAbierta[0].monto - cxcAbierta[0].totalAbonado;

            if (cliente.limiteCredito < (restante + factura.total)) {
              return await proceed(new Error('El monto de la factura excede el límite de crédito del cliente'));
            }

            // Si tiene una CxC abierta, se le agrega el monto a la CxC
            const cxc = await CxC.updateOne({ id: cxcAbierta[0].id }).set({ monto: cxcAbierta[0].monto + factura.total }).usingConnection(db);

            if (!cxc) {
              return await proceed(new Error('Ocurrió un error al editar la CxC'));
            }
            cxcId = cxc.id;
          } else {
            // Si no tiene una CxC abierta, se crea una nueva
            const cxc = {
              id: new objId().toString(),
              clienteId: factura.clienteId,
              monto: factura.total,
              fecha: factura.fecha,
              totalAbonado: 0,
              estado: 'Pendiente',
            };
            const cxcCreada = await CxC.create(cxc).fetch().usingConnection(db);
            if (!cxcCreada) {
              return await proceed(new Error('Ocurrió un error al crear la CxC'));
            }
            cxcId = cxcCreada.id;
          }

          // Editar la factura con el ID de la CxC si es a crédito
          factura.cxcId = cxcId;
        }

        const facturaCreada = await Factura.create(factura).fetch().usingConnection(db);
        if (!facturaCreada) {
          return res.serverError('No se pudo crear la factura');
        }

        facturaId = factura.id;

        if (!preFacturaId) {
          return await proceed(new Error('El ID de la preFactura no está definido'));
        }

        if (!facturaId) {
          return await proceed(new Error('El ID de la Factura no está definido'));
        }

        const facturaProducto = [];

        // const factura = await Factura.findOne({ id: facturaId }).usingConnection(db);

        if (!factura) {
          return await proceed(new Error('La Factura no existe'));
        }

        const preFactura = await PreFactura.findOne({ id: preFacturaId }).usingConnection(db);
        const preFacturaActualizada = await PreFactura.update({ id: preFacturaId }).set({ estado: 'Completada' }).usingConnection(db).fetch();

        if (!preFacturaActualizada) {
          return await proceed(new Error('No se pudo actualizar la preFactura'));
        }

        if (!preFactura) {
          return await proceed(new Error('La preFactura no existe'));
        }
        const productos = await PreFacturaProducto.find({ preFacturaId: preFacturaId, deleted: false }).usingConnection(db);

        if (!productos) {
          return await proceed(new Error('La preFactura no tiene productos'));
        }

        for (const producto of productos) {

          facturaProducto.push({
            id: new objId().toString(),
            facturaId: facturaId,
            productoId: producto.id,
            cantidad: producto.cantidad,
            precio: producto.precio,
            costo: producto.costo,
            impuesto: producto.impuesto,
            nombre: producto.nombre,
          });

        }

        if (!facturaId) {
          return await proceed(new Error('El ID de la Factura no está definido'));
        }

        await FacturaProducto.createEach(facturaProducto).usingConnection(db).catch(err => {
          sails.log.error(err);
          return proceed(new Error(`Ocurrió un error al completar la factura`));
        });

        // General log
        const descripcion = `Se completó la factura con el ID: ${facturaId} y los datos: ${JSON.stringify(facturaCreada, null, 2)}`;
        await sails.helpers.log({
          accion: 'POST',
          descripcion,
          origen: 'FacturaController.crearFacturaConProductos',
          token: req.headers.authorization,
          elementId: facturaId,
          success: true
        });
        // Si todo está bien, confirma la transacción
        return await proceed();
      });

      return res.ok({ message: 'Factura agregada exitosamente', factura });
    } catch (error) {
      const errorToReturn = {
        err: error.cause ? error.cause.message : error.message || 'Ocurrió un error al agregar la factura.',
        error
      };
      // Generar log
      const descripcion = `Ocurrio un error al crear la factura.\n- Error: ${JSON.stringify(errorToReturn, null, 2)}\n - Params: ${JSON.stringify(req.params, null, 2)}\n - Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'FacturaController.crearFacturaConProductos',
        token: req.headers.authorization,
        elementId: facturaId,
        success: false
      });

      return res.serverError(errorToReturn);
    }
  },
  cobroFactura: async function (req, res) {
    try {
      const factura = {
        id: new objId().toString(),
        fecha: new Date(),
        clienteId: req.body.clienteId || null,
        mesaId: req.body.mesaId || null,
        estado: 'Completada',
        registroCajaId: req.body.registroCajaId || null,
        porcientoDescuento: req.body.porcientoDescuento || 0,
        tipoFactura: req.body.tipoFactura || '',
        clienteRNC: req.body.clienteRNC || '',
        pagos: req.body.pagos || [],
        subTotal: req.body.subTotal || 0,
        total: req.body.total || 0,
        delivery: req.body.delivery || 0,
        impuesto: req.body.impuesto || 0,
        isCredit: false,
        isCreditPayment: true,
        cxcId: req.body.cxcId,
      };
      let nuevaFactura = {};

      // Validaciones
      if (!factura.cxcId) {
        return res.badRequest({ err: 'El ID de la CxC es requerido' });
      }

      if (!factura.clienteId) {
        return res.badRequest({ err: 'El ID del cliente es requerido' });
      }

      if (!factura.total) {
        return res.badRequest({ err: 'El monto es requerido' });
      }

      // Buscar la CxC
      const cxc = await CxC.findOne({ id: factura.cxcId, deleted: false });

      if (!cxc) {
        return res.badRequest({ err: 'La CxC no existe' });
      }

      // Buscar el cliente
      const cliente = await Cliente.findOne({ id: factura.clienteId, deleted: false });

      if (!cliente) {
        return res.badRequest({ err: 'El cliente no existe' });
      }

      // Actualizar la CxC
      await CxC.getDatastore().transaction(async (db, proceed) => {
        const cxcData = {
          totalAbonado: cxc.totalAbonado + factura.total,
          estado: cxc.totalAbonado + factura.total >= cxc.monto ? 'Pagada' : 'Pendiente',
        };
        const cxcActualizada = await CxC.updateOne({ id: factura.cxcId }).set(cxcData).usingConnection(db);

        if (!cxcActualizada) {
          return await proceed(new Error('Ocurrió un error al actualizar la CxC'));
        }

        // Crear factura de abono a crédito
        const facturaCreada = await Factura.create(factura).fetch().usingConnection(db);

        nuevaFactura = facturaCreada;
        if (!facturaCreada) {
          return await proceed(new Error('Ocurrió un error al crear la factura'));
        }

        // Generar log
        const descripcion = `Se realizó un cobro a la CxC con el ID: ${factura.cxcId} por un monto de ${factura.total}.\n- Datos del cobro: ${JSON.stringify(facturaCreada, null, 2)}`;
        await sails.helpers.log({
          accion: 'POST',
          descripcion,
          origen: 'FacturaController.cobroFactura',
          token: req.headers.authorization,
          elementId: facturaCreada.id,
          success: true
        });

        return await proceed();
      });

      return res.ok({ message: 'Cobro realizado exitosamente', factura: nuevaFactura });

    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al realizar el cobro de la factura.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'FacturaController.cobroFactura',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Error del servidor.'
      });
    }
  },
  cobroFacturaLote: async function (req, res) {
    try {
      const idLote = new objId().toString();
      const datos = req.body;

      if (!datos) {
        return res.badRequest({ err: 'Los datos son requeridos' });
      }

      if (!datos.length) {
        return res.badRequest({ err: 'Los datos no pueden estar vacíos' });
      }

      const facturasACrear = [];
      const facturasGeneradas = [];
      const facturasNoGeneradas = [];

      for (const item of datos) {
        const { id: cxcId, monto } = item;

        if (!cxcId) {
          facturasNoGeneradas.push({ cxcId, message: 'El ID de la cuenta por cobrar es requerido' });
          continue;
        }

        if (!monto) {
          facturasNoGeneradas.push({ cxcId, message: 'El monto es requerido' });
          continue;
        }

        // Buscar la CxC
        const cxc = await CxC.findOne({ id: cxcId, deleted: false });

        if (!cxc) {
          facturasNoGeneradas.push({ cxcId, message: 'La CxC no existe' });
          continue;
        }

        if (cxc.estado === 'Pagada') {
          facturasNoGeneradas.push({ cxcId, message: 'La CxC ya está pagada' });
          continue;
        }

        if (cxc.monto < cxc.totalAbonado + monto) {
          facturasNoGeneradas.push({ cxcId, message: 'El monto a abonar es mayor al monto de la CxC' });
          continue;
        }

        facturasACrear.push({
          id: new objId().toString(),
          fecha: new Date(),
          clienteId: cxc.clienteId,
          mesaId: null,
          estado: 'Completada',
          registroCajaId: null,
          porcientoDescuento: 0,
          tipoFactura: 'consumidores-finales',
          clienteRNC: '',
          pagos: [{ metodoPago: 'descuento-nomina', recibido: monto, tipoVerifone: 'N/A', tipoTarjeta: 'N/A' }],
          subTotal: 0,
          total: monto,
          delivery: 0,
          impuesto: 0,
          isCredit: false,
          isCreditPayment: true,
          idLote,
          cxcId,
        });
      }

      if (facturasACrear.length === 0) {
        return res.badRequest({ err: 'No se pudo realizar el cobro', facturasNoGeneradas });
      }

      const cxcAEditar = [];
      for (const factura of facturasACrear) {
        const cxc = await CxC.findOne({ id: factura.cxcId });
        cxcAEditar.push({
          id: cxc.id,
          totalAbonado: cxc.totalAbonado + factura.total,
          estado: cxc.totalAbonado + factura.total >= cxc.monto ? 'Pagada' : 'Pendiente',
        });
      }

      await Factura.getDatastore().transaction(async (db, proceed) => {
        const facturasCreadas = await Factura.createEach(facturasACrear).fetch().usingConnection(db);

        if (!facturasCreadas) {
          return await proceed(new Error('Ocurrió un error al crear las facturas'));
        }

        facturasGeneradas.push(...facturasCreadas);
        // console.log('facturasGeneradas', facturasGeneradas);
        // console.log('facturasNoGeneradas', facturasNoGeneradas);
        // console.log('cxcAEditar', cxcAEditar);

        for (const cxc of cxcAEditar) {
          const cxcActualizada = await CxC.updateOne({ id: cxc.id }).set({
            totalAbonado: cxc.totalAbonado,
            estado: cxc.estado,
          }).usingConnection(db);

          if (!cxcActualizada) {
            return await proceed(new Error('Ocurrió un error al actualizar las CxC'));
          }
        }

        // const cxcActualizadas = await CxC.update(cxcAEditar).usingConnection(db);

        // if (!cxcActualizadas) {
        //   return await proceed(new Error('Ocurrió un error al actualizar las CxC'));
        // }

        // Generar log
        const descripcion = `Se realizó un cobro de un lote de facturas con el siguiente ID de lote: \n${idLote}\n - Facturas generadas: ${JSON.stringify(facturasGeneradas, null, 2)}\n - Facturas no generadas: ${JSON.stringify(facturasNoGeneradas, null, 2)} - CxC actualizadas: ${JSON.stringify(cxcAEditar, null, 2)}`;
        await sails.helpers.log({
          accion: 'POST',
          descripcion,
          origen: 'FacturaController.cobroFacturaLote',
          token: req.headers.authorization,
          elementId: idLote,
          success: true
        });

        return await proceed();
      });

      return res.ok({ message: 'Cobro realizado exitosamente', facturas: facturasGeneradas, facturasNoGeneradas, idLote });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al realizar el cobro de un lote de facturas.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'FacturaController.cobroFacturaLote',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Error del servidor.'
      });
    }
  },
  obtenerPorRegistroCaja: async function (req, res) {
    try {
      const registroCajaId = req.params.registroCajaId;
      const params = req.allParams();

      const fechaFilter = {};
      if (params.fechaInicio) {
        fechaFilter['>='] = new Date(params.fechaInicio);
      }
      if (params.fechaFin) {
        fechaFilter['<='] = new Date(params.fechaFin);
      }

      const whereClause = {
        deleted: false,
        registroCajaId: registroCajaId,
        fecha: fechaFilter,
      };

      if (Object.keys(whereClause.fecha).length === 0) {
        delete whereClause.fecha;
      }

      if (!registroCajaId) {
        return res.badRequest({ err: 'El ID del registro de caja es requerido' });
      }

      const facturas = await Factura.find({ where: whereClause }).sort('createdAt DESC').populate('clienteId');

      return res.ok(facturas);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener las facturas por el ID del registro de caja.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'FacturaController.obtenerPorRegistroCaja',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  obtenerPorId: async function (req, res) {
    try {
      const facturaId = req.params.id;

      if (!facturaId) {
        return res.badRequest({ err: 'El ID de la factura es requerido' });
      }

      const query = `
        SELECT 
          f.id AS factura_id,
          f.fecha,
          f.ncf,
          f.subTotal,
          f.impuesto,
          f.delivery,
          f.total,
          f.isCredit,
          f.tipoFactura,
          f.clienteRNC,
          f.pagos AS pagos_json,
          c.id AS cliente_id,
          c.nombre AS cliente_nombre,
          c.apellido AS cliente_apellido,
          rc.id AS registroCaja_id,
          rc.userId AS registroCaja_userId,
          fp.id AS producto_id,
          fp.cantidad,
          fp.nombre AS producto_nombre,
          fp.precio,
          fp.costo,
          fp.impuesto AS producto_impuesto,
          fp.deleted AS producto_deleted,
          p.id AS producto_productoId,
          p.codigo AS producto_codigo
        FROM factura f
        LEFT JOIN cliente c ON f.clienteId = c.id
        LEFT JOIN registrocaja rc ON f.registroCajaId = rc.id
        LEFT JOIN facturaproducto fp ON f.id = fp.facturaId AND fp.deleted = FALSE
        LEFT JOIN producto p ON fp.productoId = p.id
        WHERE f.id = $1 AND f.deleted = FALSE;
      `;

      const result = await sails.sendNativeQuery(query, [facturaId]);

      // Verificar si existe la factura
      if (!result.rows || result.rows.length === 0) {
        return res.badRequest({ err: 'La factura no existe' });
      }

      // Estructurar la respuesta
      const facturaData = result.rows[0];
      const factura = {
        id: facturaData.factura_id,
        fecha: facturaData.fecha,
        ncf: facturaData.ncf,
        subTotal: facturaData.subTotal,
        impuesto: facturaData.impuesto,
        delivery: facturaData.delivery,
        total: facturaData.total,
        isCredit: facturaData.isCredit,
        tipoFactura: facturaData.tipoFactura,
        clienteRNC: facturaData.clienteRNC ? JSON.parse(facturaData.clienteRNC) : null,
        pagos: facturaData.pagos_json ? JSON.parse(facturaData.pagos_json) : [],
        clienteId: facturaData.cliente_id
          ? {
            id: facturaData.cliente_id,
            nombre: facturaData.cliente_nombre,
            apellido: facturaData.cliente_apellido,
          }
          : null,
        registroCajaId: facturaData.registroCaja_id
          ? {
            id: facturaData.registroCaja_id,
            userId: facturaData.registroCaja_userId,
            campo1: facturaData.registroCaja_campo1, // Ajusta según los campos reales
          }
          : null,
        productos: result.rows
          .filter(row => row.producto_id)
          .map(row => ({
            id: row.producto_id,
            cantidad: row.cantidad,
            nombre: row.producto_nombre,
            precio: row.precio,
            costo: row.costo,
            impuesto: row.producto_impuesto,
            deleted: row.producto_deleted,
            productoId: {
              id: row.producto_productoId,
              codigo: row.producto_codigo,
            },
          })),
      };

      return res.ok(factura);

      // const factura = await Factura.findOne({ id: facturaId, deleted: false }).populate('clienteId').populate('registroCajaId');

      // if (!factura) {
      //   return res.badRequest({ err: 'La factura no existe' });
      // }

      // const facturaProductos = await FacturaProducto.find({ facturaId: facturaId, deleted: false }).populate('productoId');

      // factura.productos = facturaProductos;

      // return res.ok(factura);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener la factura por el ID: ${req.params.id}.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'FacturaController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(error);
    }
  },
  obtenerPorCxCId: async function (req, res) {
    try {
      const cxcId = req.params.cxcId;

      if (!cxcId) {
        return res.badRequest({ err: 'El ID de la CxC es requerido' });
      }

      const cxc = await CxC.findOne({ id: cxcId, deleted: false });

      if (!cxc) {
        return res.badRequest({ err: 'La CxC no existe' });
      }

      const factura = await Factura.find({ cxcId: cxc.id, deleted: false }).populate('clienteId').sort('createdAt DESC');

      if (!factura) {
        return res.badRequest({ err: 'La factura no existe' });
      }

      return res.ok(factura);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener la factura por el ID de la CxC: ${req.params.cxcId}.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'FacturaController.obtenerPorCxCId',
        token: req.headers.authorization,
        elementId: req.params.cxcId,
        success: false
      });

      return res.serverError(error);
    }
  },
  imprimir: async function (req, res) {
    try {
      const facturaId = req.params.id;
      const token = req.headers.authorization;

      const query = `
        SELECT 
          f.id AS factura_id,
          f.fecha,
          f.ncf,
          f.subTotal,
          f.impuesto,
          f.delivery,
          f.total,
          f.isCredit,
          f.tipoFactura,
          f.clienteRNC,
          f.pagos AS pagos_json,
          c.id AS cliente_id,
          c.nombre AS cliente_nombre,
          c.apellido AS cliente_apellido,
          rc.id AS registroCaja_id,
          rc.userId,
          fp.id AS producto_id,
          fp.cantidad,
          fp.nombre AS producto_nombre,
          fp.precio,
          fp.costo,
          fp.impuesto AS producto_impuesto,
          fp.deleted AS producto_deleted,
          p.id AS producto_productoId,
          p.codigo AS producto_codigo
        FROM factura f
        LEFT JOIN cliente c ON f.clienteId = c.id
        LEFT JOIN registrocaja rc ON f.registroCajaId = rc.id
        LEFT JOIN facturaproducto fp ON f.id = fp.facturaId AND fp.deleted = FALSE
        LEFT JOIN producto p ON fp.productoId = p.id
        WHERE f.id = $1 AND f.deleted = FALSE;
      `;

      const result = await sails.sendNativeQuery(query, [facturaId]);

      // Verificar si existe la factura
      if (!result.rows || result.rows.length === 0) {
        return res.badRequest({ err: 'No existe la factura' });
      }

      // Estructurar los datos
      const facturaData = result.rows[0];
      const userId = facturaData.userId;

      // Obtener el nombre del usuario (con caché)
      let nameToDisplay = userId;
      if (userId) {
        const user = await sails.helpers.getUserById(userId, token);
        nameToDisplay = user ? `${user.name} ${user.firstSurName || ''} ${user.secondSurName || ''}` : userId;
      }

      // Parsear pagos JSON y calcular totalRecibido en JavaScript
      let pagos = [];
      let totalRecibido = 0;
      try {
        pagos = facturaData.pagos_json ? JSON.parse(facturaData.pagos_json) : [];
        totalRecibido = pagos.reduce((acc, pago) => acc + (parseFloat(pago.recibido) || 0), 0);
      } catch (err) {
        sails.log.error('Error al parsear pagos JSON:', err);
        pagos = [];
        totalRecibido = 0;
      }

      // Obtener datos del cliente (sin operador ?.)
      const getCliente = () => {
        if (facturaData.clienteRNC && facturaData.clienteRNC !== '""') {
          let rnc;
          try {
            rnc = JSON.parse(facturaData.clienteRNC);
          } catch (err) {
            sails.log.error('Error al parsear clienteRNC JSON:', err);
            rnc = {};
          }
          return rnc['Nombre Comercial'] && rnc['Nombre Comercial'].trim()
            ? rnc['Nombre Comercial'].trim()
            : rnc['Nombre/Razón Social'] || '';
        }
        return facturaData.cliente_id
          ? `${facturaData.cliente_nombre || ''} ${facturaData.cliente_apellido || ''}`.trim()
          : '';
      };

      // Estructurar datos para la plantilla
      const datosFactura = {
        numero: facturaData.factura_id,
        cliente: getCliente(),
        fecha: new Date(facturaData.fecha).toLocaleString(),
        productos: result.rows
          .filter(row => row.producto_id)
          .map(row => ({
            id: row.producto_id,
            codigo: row.producto_codigo,
            productoId: row.producto_productoId,
            cantidad: row.cantidad,
            nombre: row.producto_nombre,
            precio: row.precio,
            costo: row.costo,
            impuesto: row.producto_impuesto,
            deleted: row.producto_deleted,
          })),
        ncf: facturaData.ncf,
        subTotal: facturaData.subTotal,
        impuesto: facturaData.impuesto,
        delivery: facturaData.delivery,
        total: facturaData.total,
        rnc: facturaData.clienteRNC ? JSON.parse(facturaData.clienteRNC)['Cédula/RNC'] || '' : '',
        pagos,
        tipoFactura: TIPO_FACTURA_PARA_IMPRECION[facturaData.tipoFactura] || 'CONSUMIDORES FINALES',
        modoFactura: facturaData.isCredit ? 'CRÉDITO' : 'CONTADO',
        usuario: nameToDisplay,
        totalRecibido,
        cambio: Math.max(totalRecibido - facturaData.total, 0),
      };

      // Generar HTML con la plantilla precompilada
      const ejsTemplate = facturaData.isCredit ? creditTemplate : invoiceTemplate;
      const html = ejsTemplate(datosFactura);

      // Generar PDF con Puppeteer
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
      });

      // Cierra la página
      await page.close();

      // Enviar el PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=factura-${facturaId}.pdf`);
      res.send(pdfBuffer);

      // const factura = await Factura.findOne({ id: facturaId, deleted: false }).populate('clienteId').populate('registroCajaId');
      // const facturaProductos = await FacturaProducto.find({ facturaId: facturaId, deleted: false }).populate('productoId');

      // factura.productos = facturaProductos;
      // const userId = factura && factura.registroCajaId && factura.registroCajaId.userId;

      // let nameToDisplay = '';
      // if (userId) {
      //   const user = await sails.helpers.getUserById(userId, token);
      //   nameToDisplay = user ? `${user.name} ${user.firstSurName || ''} ${user.secondSurName || ''}` : userId;
      // }

      // const getCliente = () => {
      //   if (factura.clienteRNC) {
      //     return factura.clienteRNC['Nombre Comercial'].trim() ?
      //       factura.clienteRNC['Nombre Comercial'] :
      //       factura.clienteRNC['Nombre/Razón Social'];
      //   }

      //   if (factura.clienteId) {
      //     return `${factura.clienteId.nombre || ''} ${factura.clienteId.apellido || ''}`;
      //   }

      //   return '';
      // };

      // const totalRecibido = parseFloat(factura.pagos.reduce((acc, pago) => acc + pago.recibido, 0));
      // const cambio = totalRecibido - factura.total;
      // const datosFactura = {
      //   numero: factura.id,
      //   cliente: getCliente(),
      //   fecha: new Date(factura.fecha).toLocaleString(),
      //   productos: factura.productos,
      //   ncf: factura.ncf,
      //   subTotal: factura.subTotal,
      //   impuesto: factura.impuesto,
      //   delivery: factura.delivery,
      //   total: factura.total,
      //   rnc: factura.clienteRNC ? factura.clienteRNC['Cédula/RNC'] : '',
      //   pagos: factura.pagos,
      //   tipoFactura: TIPO_FACTURA_PARA_IMPRECION[factura.tipoFactura] || 'CONSUMIDORES FINALES',
      //   modoFactura: (factura.isCredit)  ? 'CRÉDITO' : 'CONTADO',
      //   usuario: nameToDisplay,
      //   totalRecibido,
      //   cambio: cambio > 0 ? cambio : 0,
      // };

      // const browser = await puppeteer.launch();
      // const page = await browser.newPage();

      // const templatePathInvoice = 'views/invoice.ejs';
      // const templatePathCredit = 'views/invoice-credit.ejs';

      // const ejsTemplate = !factura.isCredit ? fs.readFileSync(templatePathInvoice, 'utf-8') : fs.readFileSync(templatePathCredit, 'utf-8');
      // const html = ejs.render(ejsTemplate, datosFactura);

      // await page.setContent(html);
      // const pdfBuffer = await page.pdf({ format: 'Letter' }); // Ajusta el formato según tus necesidades

      // await browser.close();

      // res.setHeader('Content-Type', 'application/pdf');
      // res.send(pdfBuffer);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al imprimir la factura con el ID: ${req.params.id}.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'FacturaController.imprimir',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(error);
    }
  },
  anular: async function (req, res) {
    try {
      const facturaId = req.params.id;

      if (!facturaId) {
        return res.badRequest({ err: 'El ID de la factura es requerido' });
      }

      const factura = await Factura.findOne({ id: facturaId, deleted: false });

      if (!factura) {
        return res.badRequest({ err: 'La factura no existe' });
      }

      // Iniciar transacción para anular la factura
      // y , si es a crédito, reducir monto de la CxC
      let facturaActualizada;
      await Factura.getDatastore().transaction(async (db, proceed) => {
        facturaActualizada = await Factura.updateOne({ id: facturaId }).set({ estado: 'Cancelada', deleted: true }).usingConnection(db);

        if (!facturaActualizada) {
          return await proceed(new Error('No se pudo cancelar la factura'));
        }

        if (factura.cxcId) {
          const cxc = await CxC.findOne({ id: factura.cxcId, deleted: false }).usingConnection(db);

          if (!cxc) {
            return await proceed(new Error('La CxC no existe'));
          }

          if (cxc.estado === 'Pendiente') {
            const nuevoMonto = cxc.monto - factura.total;
            if (nuevoMonto > 0) {
              const cxcActualizada = await CxC.updateOne({ id: cxc.id }).set({ monto: nuevoMonto }).usingConnection(db);

              if (!cxcActualizada) {
                return await proceed(new Error('Ocurrió un error al editar la CxC'));
              }
            } else {
              const cxcActualizada = await CxC.updateOne({ id: cxc.id }).set({ monto: 0, estado: 'Cancelada' }).usingConnection(db);

              if (!cxcActualizada) {
                return await proceed(new Error('Ocurrió un error al editar la CxC'));
              }
            }
          }
        }

        // Generar log
        const descripcion = `Se anuló la factura con el ID: ${facturaId}`;
        await sails.helpers.log({
          accion: 'DELETE',
          descripcion,
          origen: 'FacturaController.anular',
          token: req.headers.authorization,
          elementId: facturaId,
          success: true
        });

        return await proceed();
      });
      // const facturaActualizada = await Factura.updateOne({ id: facturaId }).set({ estado: 'Cancelada', deleted: true });

      // if (!facturaActualizada) {
      //   return res.serverError('No se pudo cancelar la factura');
      // }

      // Generar log
      // const descripcion = `Se anuló la factura con el ID: ${facturaId}`;
      // await sails.helpers.log({
      //   accion: 'DELETE',
      //   descripcion,
      //   origen: 'FacturaController.anular',
      //   token: req.headers.authorization,
      //   elementId: facturaId,
      //   success: true
      // });

      return res.ok(facturaActualizada);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al anular la factura con el ID: ${req.params.id}.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'FacturaController.anular',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(error);
    }
  }
};

process.on('SIGTERM', async () => {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
  }
});

