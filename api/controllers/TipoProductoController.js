/**
 * TipoProductoController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const objId = require('mongodb').ObjectID;

module.exports = {
  crear: async function (req, res) {
    try {
      const tipoProducto = {
        id: new objId().toString(),
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
      };

      if (!tipoProducto.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      const tipoProductoCreado = await TipoProducto.create(tipoProducto).fetch();

      if (!tipoProductoCreado) {
        return res.serverError('No se pudo crear el tipo de producto');
      }

      // Generar log
      const descripcion = `Se creo un tipo de producto con los siguientes datos:\n${JSON.stringify(tipoProductoCreado, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'TipoProductoController.crear',
        token: req.headers.authorization,
        elementId: tipoProductoCreado.id,
        success: true
      });

      return res.ok(tipoProductoCreado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al crear el tipo de producto.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'TipoProductoController.crear',
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
      const tipoProductos = await TipoProducto.find({
        deleted: false,
        or: [
          { nombre: { contains: filter } },
          { descripcion: { contains: filter } }
        ]
      })
        .meta({ makeLikeModifierCaseInsensitive: true })
        .sort([{ nombre: 'ASC' }]);
      return res.ok(tipoProductos);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los tipos de productos.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'TipoProductoController.listar',
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
      const tipoProducto = await TipoProducto.findOne({ id: id, deleted: false });
      if (!tipoProducto) {
        return res.badRequest({ err: 'No existe el tipo de producto' });
      }
      return res.ok(tipoProducto);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el tipo de producto.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'TipoProductoController.obtenerPorId',
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

      const tipoProducto = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
      };

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      if (!tipoProducto.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      const tipoProductoDesactualizado = await TipoProducto.findOne({ id: id, deleted: false });

      if (!tipoProductoDesactualizado) {
        return res.badRequest({ err: 'No existe el tipo de producto' });
      }

      const tipoProductoActualizado = await TipoProducto.update({ id: id }, tipoProducto).fetch();

      if (!tipoProductoActualizado) {
        return res.serverError('No se pudo actualizar el tipo de producto');
      }

      // Generar log
      const descripcion = `Se actualizo el tipo de producto con los siguientes datos:\n- Datos anteriores${JSON.stringify(tipoProductoDesactualizado, null, 2)}\n- Datos nuevos: ${JSON.stringify(tipoProductoActualizado, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'TipoProductoController.actualizar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(tipoProductoActualizado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al actualizar el tipo de producto.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'TipoProductoController.actualizar',
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

      const tipoProductoEliminado = await TipoProducto.update({ id: id }, { deleted: true }).fetch();

      if (!tipoProductoEliminado) {
        return res.serverError('No se pudo eliminar el tipo de producto');
      }

      // Generar log
      const descripcion = `Se elimino el tipo de producto con los siguientes datos:\n${JSON.stringify(tipoProductoEliminado, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'TipoProductoController.eliminar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });
      return res.ok(tipoProductoEliminado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al eliminar el tipo de producto.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'TipoProductoController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  }
};

