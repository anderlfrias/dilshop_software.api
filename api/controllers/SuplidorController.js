/**
 * SuplidorController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  crear: async function (req, res) {
    try {
      const suplidor = {
        id: await sails.helpers.objectId(),
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
        email: req.body.email,
      };

      if (!suplidor.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      const suplidorCreado = await Suplidor.create(suplidor).fetch();

      if (!suplidorCreado) {
        throw new Error('Ocurrio un error al crear el suplidor');
      }

      // Generar log
      const descripcion = `Se creo un suplidor con los siguientes datos:\n${JSON.stringify(suplidorCreado, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'SuplidorController.crear',
        token: req.headers.authorization,
        elementId: suplidorCreado.id,
        success: true
      });

      return res.ok(suplidorCreado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al crear el suplidor.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'SuplidorController.crear',
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
      const suplidores = await Suplidor.find({
        deleted: false,
        or: [
          { nombre: { contains: filter } },
          { descripcion: { contains: filter } },
          { telefono: { contains: filter } },
          { direccion: { contains: filter } },
          { email: { contains: filter } }
        ]
      })
        .meta({ makeLikeModifierCaseInsensitive: true })
        .sort('nombre ASC');
      return res.ok(suplidores);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los suplidores.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'SuplidorController.listar',
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
      const suplidor = await Suplidor.findOne({ id: id, deleted: false });
      if (!suplidor) {
        return res.badRequest({ err: 'No existe el suplidor' });
      }
      return res.ok(suplidor);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el suplidor.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'SuplidorController.obtenerPorId',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  actualizar: async function (req, res) {
    try {
      const suplidor = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
        email: req.body.email,
      };

      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      if (!suplidor.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      const suplidorDesctualizado = await Suplidor.findOne({ id: id, deleted: false });

      if (!suplidorDesctualizado) {
        return res.badRequest({ err: 'No existe el suplidor' });
      }

      const suplidorActualizado = await Suplidor.update({ id: id }).set(suplidor).fetch();

      if (!suplidorActualizado) {
        throw new Error('Ocurrio un error al actualizar el suplidor');
      }

      // Generar log
      const descripcion = `Se actualizo el suplidor con los siguientes datos:\n- Datos anteriores${JSON.stringify(suplidorActualizado, null, 2)}\n- Datos nuevos: ${JSON.stringify(suplidorActualizado, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'SuplidorController.actualizar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(suplidorActualizado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al actualizar el suplidor.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${req.body}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'SuplidorController.actualizar',
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

      const suplidorEliminado = await Suplidor.update({ id: id }).set({ deleted: true }).fetch();

      if (!suplidorEliminado) {
        return res.serverError('No se pudo eliminar el suplidor');
      }

      // Generar log
      const descripcion = `Se elimino el suplidor con los siguientes datos:\n${JSON.stringify(suplidorEliminado, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'SuplidorController.eliminar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });
      return res.ok(suplidorEliminado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al eliminar el suplidor.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'SuplidorController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  }
};

