/**
 * NCFController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  crear: async function (req, res) {
    try {
      const ncf = {
        id: await sails.helpers.objectId(),
        serie: req.body.serie,
        tipoComprobante: req.body.tipoComprobante,
        secuencialInicial: req.body.secuencialInicial,
        secuencialFinal: req.body.secuencialFinal,
        fecha: new Date(),
        fechaVencimiento: new Date(req.body.fechaVencimiento),
        estado: 'abierto',
        cantidadAprobada: req.body.cantidadAprobada,
        cantidadUsada: 0,
        deleted: false,
        numeroAutorizacion: req.body.numeroAutorizacion,
      };

      if (!ncf.serie || !ncf.tipoComprobante || !ncf.secuencialInicial || !ncf.secuencialFinal || !ncf.fechaVencimiento || !ncf.cantidadAprobada || !ncf.numeroAutorizacion) {
        return res.badRequest({ err: 'Faltan datos.' });
      }

      // Validar que los ncf sean validos
      if (ncf.secuencialInicial >= ncf.secuencialFinal) {
        return res.badRequest({ err: 'El NCF inicial debe ser menor al NCF final.' });
      }

      // Validar que la cantidad aprobada sea valida
      if (ncf.cantidadAprobada <= 0) {
        return res.badRequest({ err: 'La cantidad aprobada debe ser mayor a 0.' });
      }

      // Validar que la fecha de vencimiento sea valida.
      if (ncf.fechaVencimiento <= ncf.fecha) {
        return res.badRequest({ err: 'La fecha de vencimiento debe ser mayor a la fecha actual.' });
      }

      const ncfExiste = await NCF.findOne({ tipoComprobante: ncf.tipoComprobante, deleted: false, estado: 'abierto' });

      if (ncfExiste) {
        return res.badRequest({ err: 'Ya existe un NCF abierto para este tipo de comprobante.' });
      }

      const ncfCreado = await NCF.create(ncf).fetch();

      if (!ncfCreado) {
        return res.badRequest('Ocurrio un error al crear el NCF');
      }

      // Generar log
      const descripcion = `Se creo un NCF con los siguientes datos:\n${JSON.stringify(ncfCreado, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'NCFController.crear',
        token: req.headers.authorization,
        elementId: ncfCreado.id,
        success: true
      });

      return res.ok(ncfCreado);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al crear el NCF.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'NCFController.crear',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  listar: async function (req, res) {
    try {
      const ncf = await NCF.find({ deleted: false })
        .sort([
          { estado: 'ASC' },
          { fechaVencimiento: 'ASC' },
          { fecha: 'DESC' }
        ]);

      return res.ok(ncf);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los NCF.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'NCFController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      return res.serverError(error);
    }
  },
  obtenerPorId: async function (req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido.' });
      }

      const ncf = await NCF.findOne({ id, deleted: false });
      if (!ncf) {
        return res.notFound('No existe el NCF');
      }

      return res.ok(ncf);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el NCF por id.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'NCFController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  eliminar: async function (req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido.' });
      }

      const ncf = await NCF.findOne({ id, deleted: false });
      if (!ncf) {
        return res.notFound('No existe el NCF');
      }

      const ncfEliminado = await NCF.updateOne({ id, deleted: false })
        .set({ deleted: true });

      if (!ncfEliminado) {
        return res.badRequest('Ocurrio un error al eliminar el NCF');
      }

      // Generar log
      const descripcion = `Se elimino el NCF con los siguientes datos:\n${JSON.stringify(ncfEliminado, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'NCFController.eliminar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(ncfEliminado);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al eliminar el NCF.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'NCFController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false,
      });
      return res.serverError(error);
    }
  }

};

