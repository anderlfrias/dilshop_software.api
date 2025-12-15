/**
 * CategoriaController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  crear: async function (req, res) {
    try {
      const categoria = {
        id: await sails.helpers.objectId(),
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
      };

      if (!categoria.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      const categoriaCreada = await Categoria.create(categoria).fetch();

      if (!categoriaCreada) {
        throw new Error('Ocurrio un error al crear la categoria');
      }

      // Generar log
      const descripcion = `Se creo una categoria con los siguientes datos:\n${JSON.stringify(categoriaCreada, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'CategoriaController.crear',
        token: req.headers.authorization,
        elementId: categoriaCreada.id,
        success: true
      });

      return res.ok(categoriaCreada);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al crear la categoria.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'CategoriaController.crear',
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
      const categorias = await Categoria.find({
        deleted: false,
        or: [
          { nombre: { contains: filter } }, { descripcion: { contains: filter } }
        ]
      })
        .meta({ makeLikeModifierCaseInsensitive: true })
        .sort('nombre ASC');
      return res.ok(categorias);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar las categorias.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CategoriaController.listar',
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
      const categoria = await Categoria.findOne({ id: id, deleted: false });
      if (!categoria) {
        return res.badRequest({ err: 'No existe la categoria' });
      }
      return res.ok(categoria);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener la categoria.\n- Error: ${JSON.stringify(error, null, 2)}\n- Id: ${req.params.id}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CategoriaController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  actualizar: async function (req, res) {
    try {
      const categoria = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
      };

      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      if (!categoria.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      const categoriaDesactualizada = await Categoria.findOne({ id: id, deleted: false });

      if (!categoriaDesactualizada) {
        return res.badRequest({ err: 'No existe la categoria' });
      }

      const categoriaActualizada = await Categoria.updateOne({ id: id, deleted: false }, categoria);

      if (!categoriaActualizada) {
        throw new Error('Ocurrio un error al actualizar la categoria');
      }

      // Generar log
      const descripcion = `Actualizacion de categoria:\n- Datos anteriores: ${JSON.stringify(categoriaDesactualizada, null, 2)}\n- Datos nuevos: ${JSON.stringify(categoriaActualizada, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'CategoriaController.actualizar',
        token: req.headers.authorization,
        elementId: categoriaActualizada.id,
        success: true
      });
      return res.ok(categoriaActualizada);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al actualizar la categoria.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'CategoriaController.actualizar',
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

      const categoriaEliminada = await Categoria.updateOne({ id: id, deleted: false }, { deleted: true });

      if (!categoriaEliminada) {
        throw new Error('Ocurrio un error al eliminar la categoria');
      }

      // Generar log
      const descripcion = `Se elimino la categoria con los siguientes datos:\n${JSON.stringify(categoriaEliminada, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'CategoriaController.eliminar',
        token: req.headers.authorization,
        elementId: categoriaEliminada.id,
        success: true
      });
      return res.ok(categoriaEliminada);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al eliminar la categoria.\n- Error: ${JSON.stringify(error, null, 2)}\n- Id: ${req.params.id}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'CategoriaController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  }
};

