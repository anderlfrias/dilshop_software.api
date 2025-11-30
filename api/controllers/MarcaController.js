/**
 * MarcaController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const objId = require('mongodb').ObjectID;

module.exports = {
  crear: async function (req, res) {
    try {
      const marca = {
        id: new objId().toString(),
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
      };

      if (!marca.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      const marcaCreada = await Marca.create(marca).fetch();

      if (!marcaCreada) {
        return res.serverError('No se pudo crear la marca');
      }

      const descripcion = `Se creo una marca con los siguientes datos:\n${JSON.stringify(marcaCreada, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'MarcaController.crear',
        token: req.headers.authorization,
        elementId: marcaCreada.id,
        success: true
      });
      return res.ok(marcaCreada);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al crear la marca.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'MarcaController.crear',
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
      const marcas = await Marca.find({
        deleted: false,
        or: [
          { nombre: { contains: filter } }, { descripcion: { contains: filter } }
        ]
      })
        .meta({ makeLikeModifierCaseInsensitive: true })
        .sort('nombre ASC');
      return res.ok(marcas);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar las marcas.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'MarcaController.listar',
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
      const marca = await Marca.findOne({ id: id, deleted: false });
      if (!marca) {
        return res.badRequest({ err: 'No existe la marca' });
      }
      return res.ok(marca);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener la marca por id.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'MarcaController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(error);
    }
  },
  actualizar: async function (req, res) {
    try {
      const marca = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
      };

      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      if (!marca.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      const marcaDesactualizada = await Marca.findOne({ id: id, deleted: false });

      if (!marcaDesactualizada) {
        return res.badRequest({ err: 'No existe la marca' });
      }

      const marcaActualizada = await Marca.update({ id: id }, marca).fetch();

      if (!marcaActualizada) {
        return res.serverError('No se pudo actualizar la marca');
      }

      // Generar log
      const descripcion = `Actualzacion de marca:\n- Datos anteriores: ${JSON.stringify(marcaDesactualizada, null, 2)}\n- Datos nuevos: ${JSON.stringify(marcaActualizada, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'MarcaController.actualizar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(marcaActualizada);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al actualizar la marca.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'MarcaController.actualizar',
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

      const marcaEliminada = await Marca.update({ id: id }, { deleted: true }).fetch();

      if (!marcaEliminada) {
        return res.serverError('No se pudo eliminar la marca');
      }

      // Generar log
      const descripcion = `Se elimino la marca con los siguientes datos:\n${JSON.stringify(marcaEliminada, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'MarcaController.eliminar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(marcaEliminada);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al eliminar la marca.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'MarcaController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  }
};

