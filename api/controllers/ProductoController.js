/**
 * ProductoController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  crear: async function (req, res) {
    try {
      const producto = {
        id: await sails.helpers.objectId(),
        nombre: req.body.nombre,
        codigo: req.body.codigo,
        codigoExterno: req.body.codigoExterno,
        descripcion: req.body.descripcion,
        idTipoProducto: req.body.idTipoProducto,
        idMarca: req.body.idMarca,
        idCategoria: req.body.idCategoria,
        idSuplidor: req.body.idSuplidor || null,
        costo: req.body.costo,
        precio: req.body.precio,
        cantidad: req.body.cantidad,
        medida: req.body.medida,
        estado: req.body.estado,
        idTipoImpuesto: req.body.idTipoImpuesto,
        usoImpuesto: req.body.usoImpuesto,
        otrosImpuestos: req.body.otrosImpuestos,
      };

      if (!producto.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      if (!producto.idTipoProducto) {
        return res.badRequest({ err: 'El tipo de producto es requerido' });
      }

      if (!producto.idMarca) {
        return res.badRequest({ err: 'La marca es requerida' });
      }

      if (!producto.idCategoria) {
        return res.badRequest({ err: 'La categoria es requerida' });
      }

      if (!producto.costo) {
        return res.badRequest({ err: 'El costo es requerido' });
      }

      if (!producto.precio) {
        return res.badRequest({ err: 'El precio es requerido' });
      }

      if (!producto.codigo) {
        return res.badRequest({ err: 'El codigo es requerido' });
      }

      if (!producto.idTipoImpuesto) {
        return res.badRequest({ err: 'El tipo de impuesto es requerido' });
      }

      const productoCreado = await Producto.create(producto).fetch().catch(
        (err) => {
          if (err.code === 'E_UNIQUE') {
            return res.badRequest({ err: 'El codigo ya existe' });
          }
          throw new Error(err);
        }
      );

      if (!productoCreado) {
        throw new Error('No se pudo crear el producto');
      }

      // Generar log
      const descripcion = `Creacion de producto:\n- Datos: ${JSON.stringify(productoCreado, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'ProductoController.crear',
        token: req.headers.authorization,
        elementId: productoCreado.id,
        success: true
      });

      return res.ok(productoCreado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al crear el producto.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'ProductoController.crear',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      if (
        error.code === 'E_UNIQUE' &&
        error.message.includes('codigo')
      ) {

        return res.badRequest({ err: 'El codigo ya existe' });
      }
      return res.serverError(error);
    }
  },
  listarTodos: async function (req, res) {
    try {
      const { top = 10, page = 0, filter = '' } = req.query;

      const cantidadProductos = await Producto.count({
        deleted: false,
        or: [
          { nombre: { contains: filter } }, { descripcion: { contains: filter } }, { codigo: { contains: filter } }
        ]
      });

      const productos = await Producto.find({
        deleted: false,
        or: [
          { nombre: { contains: filter } }, { descripcion: { contains: filter } }, { codigo: { contains: filter } }
        ]
      })
        .populate('idTipoProducto')
        .populate('idMarca')
        .populate('idCategoria')
        .populate('idSuplidor')
        .populate('idTipoImpuesto')
        .meta({ makeLikeModifierCaseInsensitive: true })
        .sort('nombre ASC')
        .limit(top)
        .skip(page * top);

      return res.ok({ productos, cantidadProductos });
    }
    catch (error) {
      const descripcion = `Ocurrio un error al listar los productos.\n- Error: ${JSON.stringify(error, null, 2)}\n - Query: ${JSON.stringify(req.query, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ProductoController.listarTodos',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  listar: async function (req, res) {
    try {
      const { top = 10, page = 0, filter = '' } = req.query;

      const cantidadProductos = await Producto.count({
        deleted: false,
        estado: true,
        or: [
          { nombre: { contains: filter } }, { descripcion: { contains: filter } }, { codigo: { contains: filter } }
        ]
      });

      const productos = await Producto.find({
        deleted: false,
        estado: true,
        or: [
          { nombre: { contains: filter } }, { descripcion: { contains: filter } }, { codigo: { contains: filter } }
        ]
      })
        .populate('idTipoProducto')
        .populate('idMarca')
        .populate('idCategoria')
        .populate('idSuplidor')
        .populate('idTipoImpuesto')
        .meta({ makeLikeModifierCaseInsensitive: true })
        .sort('nombre ASC')
        .limit(top)
        .skip(page * top);

      return res.ok({ productos, cantidadProductos });
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los productos.\n- Error: ${JSON.stringify(error, null, 2)}\n - Query: ${JSON.stringify(req.query, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ProductoController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  reporteCSV: async function (req, res) {
    try {
      const productos = await Producto.find({ deleted: false })
        .populate('idTipoProducto')
        .populate('idMarca')
        .populate('idCategoria')
        .populate('idSuplidor')
        .populate('idTipoImpuesto')
        .sort('nombre ASC');

      const data = productos.map(producto => {
        return {
          id: producto.id,
          nombre: producto.nombre || '',
          codigo: producto.codigo.toString(),
          codigoExterno: producto.codigoExterno.toString() || '',
          descripcion: producto.descripcion,
          tipoProducto: producto.idTipoProducto ? producto.idTipoProducto.nombre : '',
          marca: producto.idMarca ? producto.idMarca.nombre : '',
          categoria: producto.idCategoria ? producto.idCategoria.nombre : '',
          suplidor: producto.idSuplidor ? producto.idSuplidor.nombre : '',
          costo: producto.costo,
          precio: producto.precio,
          cantidad: producto.cantidad,
          medida: producto.medida,
        };
      });

      const { path } = await sails.helpers.generateReport(data);
      res.download(path);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el reporte de productos.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ProductoController.reporte',
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

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }
      const producto = await Producto.findOne({ id: id, deleted: false });
      if (!producto) {
        return res.badRequest({ err: 'No existe el producto' });
      }
      return res.ok(producto);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el producto por id.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ProductoController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  actualizar: async function (req, res) {
    try {
      const id = req.params.id;
      const producto = {
        nombre: req.body.nombre,
        codigo: req.body.codigo,
        codigoExterno: req.body.codigoExterno,
        descripcion: req.body.descripcion,
        idTipoProducto: req.body.idTipoProducto,
        idMarca: req.body.idMarca,
        idCategoria: req.body.idCategoria,
        idSuplidor: req.body.idSuplidor,
        costo: req.body.costo,
        precio: req.body.precio,
        cantidad: req.body.cantidad,
        medida: req.body.medida,
        estado: req.body.estado,
        idTipoImpuesto: req.body.idTipoImpuesto,
        usoImpuesto: req.body.usoImpuesto,
        otrosImpuestos: req.body.otrosImpuestos,
      };

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      if (!producto.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      if (!producto.idTipoProducto) {
        return res.badRequest({ err: 'El tipo de producto es requerido' });
      }

      if (!producto.idMarca) {
        return res.badRequest({ err: 'La marca es requerida' });
      }

      if (!producto.idCategoria) {
        return res.badRequest({ err: 'La categoria es requerida' });
      }

      if (!producto.costo) {
        return res.badRequest({ err: 'El costo es requerido' });
      }

      if (!producto.precio) {
        return res.badRequest({ err: 'El precio es requerido' });
      }

      const productoDesactualizado = await Producto.findOne({ id: id, deleted: false });

      if (!productoDesactualizado) {
        return res.badRequest({ err: 'No existe el producto' });
      }

      const productoActualizado = await Producto.update({ id: id }).set(producto).fetch();

      if (!productoActualizado) {
        return res.serverError('No se pudo actualizar el producto');
      }

      // Generar log
      const descripcion = `Actualzacion de producto:\n- Datos anteriores: ${JSON.stringify(productoDesactualizado, null, 2)}\n- Datos nuevos: ${JSON.stringify(productoActualizado, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ProductoController.actualizar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(productoActualizado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al actualizar el producto.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ProductoController.actualizar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  eliminar: async function (req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      const productoEliminado = await Producto.updateOne({ id: id }).set({ deleted: true });

      if (!productoEliminado) {
        return res.serverError('No se pudo eliminar el producto');
      }

      // Generar log
      const descripcion = `Producto eliminado:\n- Datos: ${JSON.stringify(productoEliminado, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'ProductoController.eliminar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(productoEliminado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al eliminar el producto.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'ProductoController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(error);
    }
  },
  aumentarCantidad: async function (req, res) {
    try {
      const id = req.params.id;
      const cantidad = req.body.cantidad;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      if (!cantidad) {
        return res.badRequest({ err: 'La cantidad es requerida' });
      }

      const producto = await Producto.findOne({ id: id, deleted: false });

      if (!producto) {
        return res.badRequest({ err: 'No existe el producto' });
      }

      const cantidadActualizada = producto.cantidad + cantidad;

      const productoActualizado = await Producto.update({ id: id }).set({ cantidad: cantidadActualizada }).fetch();

      if (!productoActualizado) {
        return res.serverError('No se pudo actualizar la cantidad del producto');
      }

      // Generar log
      const descripcion = `Se aumento la cantidad del producto con id ${id} a ${cantidadActualizada}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ProductoController.aumentarCantidad',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(productoActualizado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al aumentar la cantidad del producto.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ProductoController.aumentarCantidad',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(error);
    }
  },
  disminuirCantidad: async function (req, res) {
    try {
      const id = req.params.id;
      const cantidad = req.body.cantidad;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      if (!cantidad) {
        return res.badRequest({ err: 'La cantidad es requerida' });
      }

      const producto = await Producto.findOne({ id: id, deleted: false });

      if (!producto) {
        return res.badRequest({ err: 'No existe el producto' });
      }

      const cantidadActualizada = producto.cantidad - cantidad;

      const productoActualizado = await Producto.update({ id: id }).set({ cantidad: cantidadActualizada }).fetch();

      if (!productoActualizado) {
        return res.serverError('No se pudo actualizar la cantidad del producto');
      }

      // Generar log
      const descripcion = `Se disminuyo la cantidad del producto con id ${id} a ${cantidadActualizada}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ProductoController.disminuirCantidad',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(productoActualizado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al disminuir la cantidad del producto.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ProductoController.disminuirCantidad',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(error);
    }
  },
  cambiarEstado: async function (req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      const producto = await Producto.findOne({ id: id, deleted: false });

      if (!producto) {
        return res.badRequest({ err: 'No existe el producto' });
      }

      const estadoActualizado = producto.estado === true ? false : true;

      const productoActualizado = await Producto.update({ id: id }).set({ estado: estadoActualizado }).fetch();

      if (!productoActualizado) {
        return res.serverError('No se pudo actualizar el estado del producto');
      }

      // Generar log
      const descripcion = `Se cambio el estado del producto con id ${id} a ${estadoActualizado}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ProductoController.cambiarEstado',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(productoActualizado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al cambiar el estado del producto.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${JSON.stringify(req.params, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ProductoController.cambiarEstado',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(error);
    }
  },
};

