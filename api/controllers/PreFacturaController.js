// const PreFacturaProducto = require('../models/PreFacturaProducto');

/**
 * PreFacturaController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const objId = require('mongodb').ObjectID;

const puppeteer = require('puppeteer');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');

// Función helper para convertir imagen a base64
const getLogoBase64 = () => {
  try {
    const logoPath = path.join(__dirname, '../../assets/images/dilshop-logo.png');
    const imageBuffer = fs.readFileSync(logoPath);
    const base64Image = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64Image}`;
  } catch (err) {
    sails.log.error('Error al leer el logo:', err);
    return '';
  }
};

module.exports = {
  crear: async function (req, res) {
    try {
      const preFactura = {
        id: new objId().toString(),
        fecha: new Date(),
        clienteId: req.body.clienteId || null,
        mesaId: req.body.mesaId || null,
        registroCajaId: req.body.registroCajaId,
        comentario: req.body.comentario || null,
      };

      if (!preFactura.registroCajaId) {
        return res.badRequest({ err: 'El registro de caja es requerido' });
      }

      const registroCaja = await RegistroCaja.findOne({ id: preFactura.registroCajaId });

      if (!registroCaja) {
        return res.badRequest({ err: 'El registro de caja no existe' });
      }

      const preFacturaCreada = await PreFactura.create(preFactura).fetch();

      if (!preFacturaCreada) {
        return res.serverError('No se pudo crear la pre-factura');
      }

      //Generar log
      const descripcion = `Se creo una pre-factura con los siguientes datos:\n${JSON.stringify(preFacturaCreada, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'PreFacturaController.crear',
        token: req.headers.authorization,
        elementId: preFacturaCreada.id,
        success: true
      });

      return res.ok(preFacturaCreada);
    }
    catch (error) {
      //Generar log
      const descripcion = `Ocurrio un error al crear la pre-factura.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'PreFacturaController.crear',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      return res.serverError(error);
    }
  },
  actualizar: async function (req, res) {
    try {
      const id = req.params.id;

      const preFacturaToUpdate = await PreFactura.findOne({ id: id }, { deleted: false });

      if (!preFacturaToUpdate) {
        return res.badRequest({ err: 'No existe la pre-factura' });
      }
      const preFactura = {
        clienteId: req.body.clienteId || null,
        mesaId: req.body.mesaId || null,
        estado: req.body.estado || preFacturaToUpdate.estado,
        comentario: req.body.comentario || null,
      };

      const preFacturaActualizada = await PreFactura.updateOne({ id: id })
        .set(preFactura);

      if (!preFacturaActualizada) {
        return res.serverError('No se pudo actualizar la pre-factura');
      }

      //Generar log
      const descripcion = `Se actualizo la pre-factura con los siguientes datos:\n${JSON.stringify(preFacturaActualizada, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'PreFacturaController.actualizar',
        token: req.headers.authorization,
        elementId: preFacturaActualizada.id,
        success: true
      });

      return res.ok(preFacturaActualizada);
    }
    catch (error) {
      //Generar log
      const descripcion = `Ocurrio un error al actualizar la pre-factura.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'PreFacturaController.actualizar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  listar: async function (req, res) {
    try {
      const { userId, estados, fechaInicio, fechaFin, top = 10, page = 0 } = req.allParams();

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = new Date(fechaInicio);
      }
      if (fechaFin) {
        fechaFilter['<='] = new Date(fechaFin);
      }

      const whereClause = {
        fecha: fechaFilter,
        deleted: false,
        or: estados ? [
          { estado: { in: estados.split(',') } },
        ] : null,
      };

      if (Object.keys(whereClause.fecha).length === 0) {
        delete whereClause.fecha;
      }

      if (userId) {
        const registrosCajaUsuario = await RegistroCaja.find()
          .where({ userId, deleted: false })
          .select(['id']);

        whereClause.registroCajaId = registrosCajaUsuario.length > 0 ?
          { in: registrosCajaUsuario.map(r => r.id) }
          : null;
      }

      for (const key in whereClause) {
        if (whereClause[key] === null) {
          delete whereClause[key];
        }
      }

      const cantidadPreFacturas = await PreFactura.count(whereClause);
      const preFacturas = await PreFactura.find()
        .where(whereClause)
        .meta({ makeLikeModifierCaseInsensitive: true })
        .populate('clienteId')
        .populate('mesaId')
        .populate('registroCajaId')
        .sort('createdAt DESC')
        .limit(top)
        .skip(page * top);

      return res.ok({ cantidadPreFacturas, preFacturas });
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar las pre-facturas.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'PreFacturaController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  obtenerPorId: async function (req, res) {
    try {
      const id = req.params.id;
      const preFactura = await PreFactura.findOne({ id: id }).populate('registroCajaId');

      if (!preFactura) {
        return res.badRequest({ err: 'No existe la pre-factura' });
      }

      return res.ok(preFactura);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener la pre-factura por id.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'PreFacturaController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  obtenerPorEstado: async function (req, res) {
    try {
      const estado = req.params.estado;

      if (!estado) {
        return res.badRequest({ err: 'El estado es requerido' });
      }

      const preFacturas = await PreFactura.find({ estado, deleted: false });
      return res.ok(preFacturas);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener la pre-factura por estado.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'PreFacturaController.obtenerPorEstado',
        token: req.headers.authorization,
        elementId: req.params.estado,
        success: false
      });

      return res.serverError(error);
    }
  },
  obtenerPorIdConDetalle: async function (req, res) {
    try {
      const id = req.params.id;

      const query = `
        SELECT
          pf.*,
          pfp.id AS producto_id,
          pfp.cantidad,
          pfp.nombre,
          pfp.precio,
          pfp.costo,
          pfp.impuesto,
          pfp.deleted,
          pfp.descuentoTipo,
          pfp.descuentoValor,
          pfp.descuentoMonto,
          p.codigo AS producto_codigo,
          p.id AS producto_productoId,
          (pfp.cantidad * pfp.precio) AS subtotal,
          (pfp.cantidad * pfp.precio) - ((pfp.cantidad * pfp.precio) / (pfp.impuesto / 100 + 1)) AS itbis,
          ((pfp.cantidad * pfp.precio) - ((pfp.cantidad * pfp.precio) - ((pfp.cantidad * pfp.precio) / (pfp.impuesto / 100 + 1)))) AS totalSinImpuesto,
          ((pfp.cantidad * pfp.precio) - ((pfp.cantidad * pfp.precio) / (pfp.impuesto / 100 + 1))) - (pfp.cantidad * pfp.costo) AS ganancia
        FROM prefactura pf
        LEFT JOIN prefacturaproducto pfp ON pf.id = pfp.preFacturaId
        LEFT JOIN producto p ON pfp.productoId = p.id
        WHERE pf.id = $1;
      `;

      const result = await sails.sendNativeQuery(query, [id]);

      if (!result.rows || result.rows.length === 0) {
        return res.badRequest({ err: 'No existe la pre-factura' });
      }

      const preFactura = {
        id: result.rows[0].id,
        fecha: result.rows[0].fecha,
        clienteId: result.rows[0].clienteId,
        mesaId: result.rows[0].mesaId,
        estado: result.rows[0].estado,
        comentario: result.rows[0].comentario,
        registroCajaId: result.rows[0].registroCajaId,
        deleted: result.rows[0].deleted,
        // Campos de descuento global
        descuentoGlobalTipo: result.rows[0].descuentoGlobalTipo || null,
        descuentoGlobalValor: result.rows[0].descuentoGlobalValor || null,
        descuentoGlobalMonto: result.rows[0].descuentoGlobalMonto || 0,
        // Totales calculados
        subTotal: result.rows[0].subTotal || null,
        impuesto: result.rows[0].impuesto || null,
        total: result.rows[0].total || null,
        productos: result.rows
          .filter(row => row.producto_id)
          .filter(row => !row.deleted)
          .map(row => ({
            id: row.producto_id,
            codigo: row.producto_codigo,
            productoId: row.producto_productoId,
            cantidad: row.cantidad,
            nombre: row.nombre,
            precio: row.precio,
            costo: row.costo,
            impuesto: row.impuesto,
            deleted: row.deleted,
            // Campos de descuento por línea
            descuentoTipo: row.descuentoTipo || null,
            descuentoValor: row.descuentoValor || null,
            descuentoMonto: row.descuentoMonto || 0,
            // Cálculos
            subtotal: row.subtotal,
            itbis: row.itbis,
            totalSinImpuesto: row.totalSinImpuesto,
            ganancia: row.ganancia,
          })),
      };

      return res.ok(preFactura);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener la pre-factura por id con detalle.\\n- Error: ${JSON.stringify(error, null, 2)}\\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'PreFacturaController.obtenerPorIdConDetalle',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  obtenerPorIdConDetalleEliminados: async function (req, res) {
    try {
      const id = req.params.id;
      const preFactura = await PreFactura.findOne({ id: id }).populate('registroCajaId');

      if (!preFactura) {
        return res.badRequest({ err: 'No existe la pre-factura' });
      }

      const preFacturaProductos = await PreFacturaProducto.find({ preFacturaId: id, deleted: true })
        .populate('productoId')
        .select(['id', 'cantidad', 'productoId', 'precio', 'costo', 'impuesto', 'nombre', 'deleted']);

      preFactura.productos = preFacturaProductos.map(p => {
        return {
          codigo: p.productoId.codigo,
          id: p.id,
          productoId: p.productoId.id,
          cantidad: p.cantidad,
          nombre: p.nombre,
          precio: p.precio,
          costo: p.costo,
          impuesto: p.impuesto,
          deleted: p.deleted,

          subtotal: p.cantidad * p.precio,
          itbis: (p.cantidad * p.precio) - ((p.cantidad * p.precio) / ((p.impuesto / 100) + 1)),
          totalSinImpuesto: (p.cantidad * p.precio) - ((p.cantidad * p.precio) - ((p.cantidad * p.precio) / ((p.impuesto / 100) + 1))),
          ganancia: ((p.cantidad * p.precio) - ((p.cantidad * p.precio) - ((p.cantidad * p.precio) / ((p.impuesto / 100) + 1)))) - (p.cantidad * p.costo),
        };
      });

      return res.ok(preFactura);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener la pre-factura por id con detalle.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'PreFacturaController.obtenerPorIdConDetalleEliminados',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  obtenerAbiertasPorUserId: async function (req, res) {
    try {
      const userId = req.params.userId;

      const registrosCajaUsuario = await RegistroCaja.find({ userId, deleted: false }).select(['id']);
      const preFacturas = await PreFactura.find({ registroCajaId: { in: registrosCajaUsuario.map(r => r.id) }, deleted: false, estado: 'Abierta' });

      return res.ok(preFacturas);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener la pre-factura por userId.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'PreFacturaController.obtenerPorUserId',
        token: req.headers.authorization,
        elementId: req.params.userId,
        success: false
      });
      return res.serverError(error);
    }
  },
  agregarProducto: async function (req, res) {
    const preFacturaId = req.body.preFacturaId;
    const producto = req.body.producto;

    if (!preFacturaId) {
      return res.badRequest({ err: 'El ID de la preFactura no está definido' });
    }

    if (!producto) {
      return res.badRequest({ err: 'El producto no está definido' });
    }

    if (!producto.id) {
      return res.badRequest({ err: 'El ID del producto no está definido' });
    }

    if (!producto.cantidad) {
      return res.badRequest({ err: 'La cantidad del producto no está definida' });
    }

    try {
      let preFacturaProducto = null;
      let productoEncontrado = null;
      let preFacturaActualizada = null;

      await Producto.getDatastore().transaction(async (db, proceed) => {

        const preFactura = await PreFactura.findOne({ id: preFacturaId }).usingConnection(db);

        if (!preFactura) {
          return await proceed(new Error('La pre-factura no existe'));
        }

        // Verificar si la prefactura no esta abierta
        if (preFactura.estado !== 'Abierta') {
          return await proceed(new Error('La pre-factura no está disponible para agregar productos'));
        }

        productoEncontrado = await Producto.findOne({ id: producto.id }, { deleted: false }).usingConnection(db).populate('idTipoImpuesto');

        if (!productoEncontrado || productoEncontrado.length === 0) {
          return await proceed(new Error('El producto no existe'));
        }

        const cantidad = productoEncontrado.cantidad - producto.cantidad;

        await Producto.updateOne({ id: producto.id })
          .set({ cantidad: cantidad })
          .usingConnection(db);

        // Crear producto en PreFactura
        preFacturaProducto = {
          id: new objId().toString(),
          preFacturaId: preFacturaId,
          productoId: producto.id,
          cantidad: producto.cantidad,
          precio: productoEncontrado.precio,
          costo: productoEncontrado.costo,
          impuesto: productoEncontrado.idTipoImpuesto.porcentaje,
          nombre: productoEncontrado.nombre,
        };

        await PreFacturaProducto.create(preFacturaProducto).usingConnection(db);

        // ============================================================
        // RECALCULAR DESCUENTOS SI EXISTE DESCUENTO GLOBAL
        // ============================================================
        const tieneDescuentoGlobal = preFactura.descuentoGlobalMonto && preFactura.descuentoGlobalMonto > 0;

        if (tieneDescuentoGlobal) {
          // Cargar todos los productos (incluyendo el recién agregado)
          const todosLosProductos = await PreFacturaProducto.find({
            preFacturaId: preFacturaId,
            deleted: false
          }).usingConnection(db);
          console.log(todosLosProductos);

          // Calcular subtotal base (sin descuentos)
          let subtotalBase = 0;
          for (const prod of todosLosProductos) {
            subtotalBase += prod.precio * prod.cantidad;
          }

          // Calcular descuento global
          let descuentoGlobalMonto = 0;
          if (preFactura.descuentoGlobalTipo === 'PORCENTAJE') {
            descuentoGlobalMonto = (subtotalBase * preFactura.descuentoGlobalValor) / 100;
          } else {
            descuentoGlobalMonto = preFactura.descuentoGlobalValor;
          }

          const round = (num) => Math.round(num * 100) / 100;
          descuentoGlobalMonto = round(descuentoGlobalMonto);

          // Prorratear descuento entre todos los productos
          let subtotalFinal = 0;
          let impuestoTotal = 0;
          let descuentoAplicado = 0;

          for (let i = 0; i < todosLosProductos.length; i++) {
            const prod = todosLosProductos[i];
            const subtotalProd = prod.precio * prod.cantidad;
            const proporcion = subtotalBase > 0 ? subtotalProd / subtotalBase : 0;

            // Prorratear descuento
            let descuentoProd = descuentoGlobalMonto * proporcion;

            // Ajustar último producto por redondeo
            if (i === todosLosProductos.length - 1) {
              descuentoProd = descuentoGlobalMonto - descuentoAplicado;
            }

            // Base imponible después de descuento
            const baseImponible = subtotalProd - descuentoProd;

            // Calcular impuesto DESPUÉS del descuento
            // IMPORTANTE: prod.impuesto es la TASA (porcentaje), no el monto
            const tasaImpuesto = prod.impuesto || 0;
            const impuestoProd = tasaImpuesto > 0 ? (baseImponible * tasaImpuesto) / 100 : 0;

            subtotalFinal += baseImponible;
            impuestoTotal += impuestoProd;
            descuentoAplicado += descuentoProd;

            // Actualizar producto con descuento
            // NO modificamos el campo impuesto (debe mantener la tasa original)
            await PreFacturaProducto.updateOne({ id: prod.id })
              .set({
                descuentoTipo: preFactura.descuentoGlobalTipo,
                descuentoValor: preFactura.descuentoGlobalValor,
                descuentoMonto: round(descuentoProd)
                // impuesto: NO SE MODIFICA, mantiene la tasa original
              })
              .usingConnection(db);
          }

          // Actualizar totales de PreFactura
          preFacturaActualizada = await PreFactura.updateOne({ id: preFacturaId })
            .set({
              descuentoGlobalMonto: round(descuentoGlobalMonto),
              subTotal: round(subtotalFinal),
              impuesto: round(impuestoTotal),
              total: round(subtotalFinal + impuestoTotal)
            })
            .usingConnection(db);
        }

        // Generar log
        const descripcion = `Se agrego el producto con ID ${productoEncontrado.id} a la pre-factura con ID ${preFacturaId}${tieneDescuentoGlobal ? ' (con recálculo de descuentos)' : ''}`;
        await sails.helpers.log({
          accion: 'POST',
          descripcion,
          origen: 'PreFacturaController.agregarProducto',
          token: req.headers.authorization,
          elementId: preFacturaProducto.id,
          success: true
        });

        return await proceed();
      });

      // Preparar respuesta
      const response = {
        message: 'Producto agregado exitosamente',
        producto: {
          id: preFacturaProducto.id,
          codigo: productoEncontrado.codigo,
          productoId: preFacturaProducto.productoId,
          cantidad: preFacturaProducto.cantidad,
          nombre: preFacturaProducto.nombre,
          precio: preFacturaProducto.precio,
          costo: preFacturaProducto.costo,
          impuesto: productoEncontrado.idTipoImpuesto.porcentaje,
          deleted: preFacturaProducto.deleted ? 1 : 0,
          subtotal: preFacturaProducto.precio * preFacturaProducto.cantidad,
          itbis: (preFacturaProducto.precio * preFacturaProducto.cantidad) * (productoEncontrado.idTipoImpuesto.porcentaje / 100),
          totalSinImpuesto: ((preFacturaProducto.precio * preFacturaProducto.cantidad) - ((preFacturaProducto.precio * preFacturaProducto.cantidad) * (productoEncontrado.idTipoImpuesto.porcentaje / 100))),
        }
      };

      // Si se recalcularon totales, incluirlos en la respuesta
      if (preFacturaActualizada) {
        response.preFacturaActualizada = {
          subTotal: preFacturaActualizada.subTotal,
          impuesto: preFacturaActualizada.impuesto,
          total: preFacturaActualizada.total,
          descuentoGlobalMonto: preFacturaActualizada.descuentoGlobalMonto
        };
      }

      return res.ok(response);

    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al agregar el producto a la pre-factura.\\n- Error: ${JSON.stringify(error, null, 2)}\\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'PreFacturaController.agregarProducto',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: error.message || 'Ocurrió un error al agregar los producto.'
      });
    }
  },
  agregarProductos: async function (req, res) {
    const preFacturaId = req.body.preFacturaId;
    const productos = req.body.productos;

    if (!preFacturaId) {
      return badRequest(res, 'El ID de la preFactura no está definido');
    }

    if (!productos) {
      return badRequest(res, 'Los productos no están definidos');
    }

    try {
      await Producto.getDatastore().transaction(async (db, proceed) => {
        const preFacturaProducto = [];

        const preFactura = await PreFactura.findOne({ id: preFacturaId }).usingConnection(db);

        if (!preFactura) {
          return await proceed(new Error('La pre-factura no existe'));
        }

        for (const producto of productos) {
          const productoEncontrado = await Producto.find({ id: producto.id }, { deleted: false }).usingConnection(db);

          if (!productoEncontrado) {
            return await proceed(new Error('El producto no existe'));
          }

          const cantidad = productoEncontrado.cantidad - producto.cantidad;

          // if (cantidad < 0) {
          //   await proceed(new Error('No hay suficiente cantidad'));
          //   return; // Cancela la transacción
          // }

          await Producto.updateOne({ id: producto.id })
            .set({ cantidad: cantidad })
            .usingConnection(db);

          preFacturaProducto.push({
            id: new objId().toString(),
            preFacturaId: preFacturaId,
            productoId: producto.id,
            cantidad: producto.cantidad,
          });
        }

        if (!preFacturaId) {
          return await proceed(new Error('El ID de la preFactura no está definido'));
        }

        await PreFacturaProducto.createEach(preFacturaProducto).usingConnection(db).catch(err => {
          sails.log.error(err);
          return proceed(new Error('Ocurrió un error al agregar los productos. prueba'));
        });


        // Generar log
        const descripcion = `Se agregaron los productos:\n${JSON.stringify(productos, null, 2)}\nA la pre-factura con ID ${preFacturaId}`;
        await sails.helpers.log({
          accion: 'POST',
          descripcion,
          origen: 'PreFacturaController.agregarProductos',
          token: req.headers.authorization,
          elementId: preFacturaId,
          success: true
        });

        // Si todo está bien, confirma la transacción
        return await proceed();
      });

      // ...

      // ...

      // Envía la respuesta al cliente
      return res.ok({ message: 'Productos agregados exitosamente' });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al agregar los productos a la pre-factura.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'PreFacturaController.agregarProductos',
        token: req.headers.authorization,
        elementId: '',
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
  eliminarProducto: async function (req, res) {
    const preFacturaId = req.body.preFacturaId;
    const productoId = req.body.productoId;
    const id = req.body.id;

    // console.log(preFacturaId);
    // console.log(productoId);
    // console.log(id);

    if (!preFacturaId) {
      return res.badRequest(res, 'El ID de la preFactura no está definido');
    }

    if (!productoId) {
      return res.badRequest(res, 'Los productos no están definidos');
    }

    try {
      await Producto.getDatastore().transaction(async (db, proceed) => {
        const preFactura = await PreFactura.findOne({ id: preFacturaId }).usingConnection(db);

        if (!preFactura) {
          return await proceed(new Error('La pre-factura no existe'));
        }

        const productoEnPrefactura = await PreFacturaProducto.findOne({ id, preFacturaId: preFacturaId, productoId: productoId }).usingConnection(db);

        if (!productoEnPrefactura || productoEnPrefactura.length > 0) {
          return await proceed(new Error('El producto no existe en la pre-factura'));
        }

        const productoEncontrado = await Producto.findOne({ id: productoId }, { deleted: false }).usingConnection(db);

        if (!productoEncontrado || productoEncontrado.length > 0) {
          return await proceed(new Error('El producto no existe'));
        }

        const cantidad = productoEnPrefactura.cantidad + productoEncontrado.cantidad;

        const productoActualizado = await Producto.updateOne({ id: productoId }).set({ cantidad: cantidad }).usingConnection(db);

        if (!productoActualizado) {
          return await proceed(new Error('Ocurrió un error al actualizar el producto'));
        }

        const productoEliminado = await PreFacturaProducto.updateOne({ id: productoEnPrefactura.id, productoId: productoId })
          .set({ deleted: true })
          .usingConnection(db);

        if (!productoEliminado) {
          return await proceed(new Error('Ocurrió un error al eliminar el producto'));
        }

        // Generar log
        const descripcion = `Se eliminó el producto con ID ${productoId} de la pre-factura con ID ${preFacturaId}`;
        await sails.helpers.log({
          accion: 'DELETE',
          descripcion,
          origen: 'PreFacturaController.eliminarProducto',
          token: req.headers.authorization,
          elementId: productoId,
          success: true
        });

        return await proceed();
      });

      return res.ok({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al eliminar el producto de la pre-factura.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'PreFacturaController.eliminarProducto',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      // Si hay un error, deshace la transacción
      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Ocurrió un error al eliminar los productos.'
      });
    }
  },
  listarPorRegistroCaja: async function (req, res) {
    const registroCajaId = req.params.id;
    const estados = req.query.estados ? req.query.estados.split(',') : ['Abierta'];

    try {
      const preFacturas = await PreFactura.find()
        .where({ registroCajaId, estado: estados, deleted: false })
        .sort('createdAt DESC');

      return res.ok(preFacturas);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar las pre-facturas por registro de caja.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'PreFacturaController.listarPorRegistroCaja',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      return res.serverError(error);
    }
  },
  anularPreFactura: async function (req, res) {
    const preFacturaId = req.params.id;

    if (!preFacturaId) {
      return res.badRequest(res, 'El ID de la preFactura no está definido');
    }

    try {
      await Producto.getDatastore().transaction(async (db, proceed) => {


        const preFactura = await PreFactura.findOne({ id: preFacturaId }).usingConnection(db);

        if (!preFactura) {
          return await proceed(new Error('La pre-factura no existe'));
        }

        const productosEnPrefactura = await PreFacturaProducto.find({ preFacturaId: preFacturaId }).usingConnection(db);

        if (productosEnPrefactura || productosEnPrefactura.length > 0) {

          // console.log(productosEnPrefactura);

          productosEnPrefactura.forEach(async productoEnPrefactura => {
            let cantidad = productoEnPrefactura.cantidad;
            let cantidadNueva = 0;
            // console.log('-----------------',productoEnPrefactura);
            const productoEncontrado = await Producto.findOne({ id: productoEnPrefactura.productoId }, { deleted: false }).usingConnection(db);
            cantidadNueva = productoEncontrado.cantidad + cantidad;

            const productoActualizado = await Producto.updateOne({ id: productoEnPrefactura.productoId }).set({ cantidad: cantidadNueva }).usingConnection(db);

            // console.log("actializadp",productoActualizado);
            if (!productoActualizado) {
              return await proceed(new Error('Ocurrió un error al actualizar el producto'));
            }

            const productoEliminado = await PreFacturaProducto.updateOne({ id: productoEnPrefactura.id, productoId: productoEnPrefactura.productoId }).set({ deleted: true }).usingConnection(db);

            if (!productoEliminado) {
              return await proceed(new Error('Ocurrió un error al eliminar el producto'));
            }
          }
          );
        }

        const preFacturaActualizada = await PreFactura.updateOne({ id: preFacturaId }).set({ estado: 'Cancelada' }).usingConnection(db);

        // console.log('---------------',preFacturaActualizada);

        if (!preFacturaActualizada) {
          return await proceed(new Error('Ocurrió un error al actualizar la pre-factura'));
        }

        // Generar log
        const descripcion = `Se anuló la pre-factura con ID ${preFacturaId}`;
        await sails.helpers.log({
          accion: 'PUT',
          descripcion,
          origen: 'PreFacturaController.anularPreFactura',
          token: req.headers.authorization,
          elementId: preFacturaId,
          success: true
        });

        return await proceed();
      });

      return res.ok({ message: 'Factura cancelada exitosamente' });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al anular la pre-factura.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'PreFacturaController.anularPreFactura',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      // Si hay un error, deshace la transacción
      sails.log.error(error);
      return res.serverError({
        error: error.cause ? error.cause.message : error.message || error,
        err: 'Ocurrió un error al eliminar los productos.'
      });
    }
  },
  imprimir: async function (req, res) {
    try {
      const prefacturaId = req.params.id;
      const token = req.headers.authorization;

      const prefactura = await PreFactura.findOne({ id: prefacturaId, deleted: false }).populate('clienteId').populate('registroCajaId');
      const prefacturaProductos = await PreFacturaProducto.find({ preFacturaId: prefacturaId, deleted: false }).populate('productoId');

      const userId = prefactura.registroCajaId.userId;

      const user = await sails.helpers.getUserById(userId, token);
      const nameToDisplay = user ? `${user.name} ${user.firstSurName || ''} ${user.secondSurName || ''}` : userId;
      // console.log(prefactura);
      // console.log(prefacturaProductos);
      prefactura.productos = prefacturaProductos;
      // console.log(prefactura);
      // Código para generar la factura en HTML
      const getCliente = () => {
        if (prefactura.clienteId) {
          return `${prefactura.clienteId.nombre} ${prefactura.clienteId.apellido}`;
        }

        return '';
      };

      const subTotal = prefacturaProductos.reduce((acc, p) => acc + ((p.cantidad * p.precio) - ((p.cantidad * p.precio) - ((p.cantidad * p.precio) / ((p.impuesto / 100) + 1)))), 0);
      const impuesto = prefacturaProductos.reduce((acc, p) => acc + ((p.cantidad * p.precio) - ((p.cantidad * p.precio) / ((p.impuesto / 100) + 1))), 0);
      const total = prefacturaProductos.reduce((acc, p) => acc + (p.cantidad * p.precio), 0);

      const datosPreFactura = {
        numero: prefactura.id,
        cliente: getCliente(),
        fecha: new Date(prefactura.fecha).toLocaleString(),
        productos: prefactura.productos,
        usuario: nameToDisplay,
        subTotal,
        impuesto,
        total,
        logoBase64: getLogoBase64(),
      };

      // console.log(datosPreFactura);
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();

      // Ruta a la plantilla EJS
      const templatePath = 'views/prebill.ejs';

      // Renderiza el archivo EJS
      const ejsTemplate = fs.readFileSync(templatePath, 'utf-8');
      const html = ejs.render(ejsTemplate, datosPreFactura);

      // Configura la página y genera el PDF
      await page.setContent(html);
      const pdfBuffer = await page.pdf({ format: 'Letter' }); // Ajusta el formato según tus necesidades

      // Cierra el navegador de Puppeteer
      await browser.close();

      // Envía el PDF como respuesta
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al imprimir la pre-factura.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'PreFacturaController.imprimir',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },

  /**
   * Aplicar descuento global a una PreFactura
   * POST /api/v1/preFactura/:id/aplicar-descuento-global
   */
  aplicarDescuentoGlobal: async function (req, res) {
    try {
      const preFacturaId = req.params.id;
      const { tipo, valor } = req.body;

      // Validar entrada
      if (!tipo || valor === undefined) {
        return res.badRequest({
          err: 'Se requiere tipo y valor del descuento',
          details: { tipo, valor }
        });
      }
      // console.log('Aplicando descuento:', { tipo, valor, preFacturaId });

      // Llamar al helper con sintaxis correcta de Sails.js
      const resultado = await sails.helpers.applyGlobalDiscount.with({
        preFacturaId: preFacturaId,
        descuento: { tipo, valor }
      });

      // Generar log
      const descripcion = `Se aplicó descuento global a la PreFactura ${preFacturaId}.\n- Tipo: ${tipo}\n- Valor: ${valor}\n- Monto: ${resultado.totales.descuentoGlobalMonto}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'PreFacturaController.aplicarDescuentoGlobal',
        token: req.headers.authorization,
        elementId: preFacturaId,
        success: true
      });

      return res.ok(resultado);

    } catch (error) {
      // Manejar errores específicos del helper
      if (error.notFound) {
        return res.notFound(error.notFound);
      }
      if (error.invalidState) {
        return res.badRequest(error.invalidState);
      }
      if (error.invalidInput) {
        return res.badRequest(error.invalidInput);
      }

      // Generar log de error
      const descripcion = `Error al aplicar descuento global a PreFactura ${req.params.id}.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'PreFacturaController.aplicarDescuentoGlobal',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(error);
    }
  },

  /**
   * Eliminar descuento global de una PreFactura
   * DELETE /api/v1/preFactura/:id/eliminar-descuento-global
   */
  eliminarDescuentoGlobal: async function (req, res) {
    try {
      const preFacturaId = req.params.id;

      // Llamar al helper con sintaxis correcta de Sails.js
      const resultado = await sails.helpers.removeGlobalDiscount.with({
        preFacturaId: preFacturaId
      });

      // Generar log
      const descripcion = `Se eliminó descuento global de la PreFactura ${preFacturaId}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'PreFacturaController.eliminarDescuentoGlobal',
        token: req.headers.authorization,
        elementId: preFacturaId,
        success: true
      });

      return res.ok(resultado);

    } catch (error) {
      // Manejar errores específicos del helper
      if (error.notFound) {
        return res.notFound(error.notFound);
      }
      if (error.invalidState) {
        return res.badRequest(error.invalidState);
      }

      // Generar log de error
      const descripcion = `Error al eliminar descuento global de PreFactura ${req.params.id}.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'PreFacturaController.eliminarDescuentoGlobal',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(error);
    }
  },
};

