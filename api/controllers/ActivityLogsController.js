/**
 * ActicityLogsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  listar: async function (req, res) {
    try {
      const {
        autor,
        accion,
        origen,
        elementId,
        success,
        fechaInicio,
        fechaFin,
        page = 0,
        top = 100
      } = req.allParams();

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = new Date(fechaInicio);
      }
      if (fechaFin) {
        fechaFilter['<='] = new Date(fechaFin);
      }

      const whereClause = {
        createdAt: fechaFilter,
        autor: autor || null,
        elementId: elementId ? { contains: elementId } : null,
        origen: origen ? { contains: origen } : null,
        success: success === 'true' ? true : success === 'false' ? false : null,
        or: accion ? [
          { accion: { in: accion.split(',')} },
        ]: null,
      };

      if (Object.keys(whereClause.createdAt).length === 0) {
        delete whereClause.createdAt;
      }

      for (const key in whereClause) {
        if (whereClause[key] === null) {
          delete whereClause[key];
        }
      }

      const cantidadLogs = await ActivityLogs.count(whereClause);
      const logs = await ActivityLogs.find()
        .where(whereClause)
        .limit(top)
        .skip(top * page)
        .sort('createdAt DESC')
        .select(['id', 'fecha', 'autor', 'accion', 'origen', 'elementId', 'success']);

      return res.ok({
        logs,
        cantidadLogs,
      });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los logs.\n- Error: ${JSON.stringify(error, null, 2)}\n - Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ActivityLogsController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  obtenerPorId: async function(req, res) {
    try {
      const { id } = req.params;

      const log = await ActivityLogs.findOne({ id });

      if (!log) {
        return res.badRequest({ err: 'No se encontro el log' });
      }

      return res.ok(log);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el log.\n- Error: ${JSON.stringify(error, null, 2)}\n- Id: ${req.params.id}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ActivityLogsController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },

};

