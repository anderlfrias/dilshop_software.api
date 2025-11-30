/**
 * CxCController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const csvWriteStream = require('csv-write-stream');
const fs = require('fs');

module.exports = {
  listar: async function(req, res){
    try {
      const { fechaInicio, fechaFin, clienteId, estado, page = 0, top = 10 } = req.allParams();

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = new Date(fechaInicio);
      }
      if (fechaFin) {
        fechaFilter['<='] = new Date(fechaFin);
      }

      const whereClause = {
        fecha: fechaFilter,
        estado,
        deleted: false,
      };

      clienteId && (whereClause.clienteId = clienteId);
      estado && (whereClause.estado = estado);

      if (Object.keys(whereClause.fecha).length === 0) {
        delete whereClause.fecha;
      }

      const cantidadDeCxC = await CxC.count(whereClause);
      const cxc = await CxC.find()
        .where(whereClause)
        .populate('clienteId')
        .limit(top)
        .skip(top * page)
        .sort('fecha DESC')
        .meta({enableExperimentalDeepTargets:true});

      return res.ok({ cxcs: cxc, cantidadDeCxC });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar las CxC.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CxCController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  listaIds: async function (req, res) {
    try {
      const cxc = await CxC.find({ deleted: false, estado: 'Pendiente' }).select(['id']);
      const data = cxc.map(c => c.id);
      return res.ok(data);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los ids de CxC.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CxCController.listaIds',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  obtenerPorId: async function(req, res){
    try {
      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El ID es requerido.' });
      }
      const cxc = await CxC.findOne({ id, deleted: false })
        .populate('clienteId');

      return res.ok(cxc);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener la CxC por id.\n- Error: ${JSON.stringify(error, null, 2)}\n- Id: ${req.params.id}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CxCController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  obtenerPorClienteId: async function(req, res){
    try {
      const clienteId = req.params.id;

      if (!clienteId) {
        return res.badRequest({ err: 'El ID es requerido.' });
      }
      const cxc = await CxC.find({ clienteId, estado: 'Pendiente', deleted: false })
        .populate('clienteId');

      return res.ok(cxc);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener las CxC por clienteId.\n- Error: ${JSON.stringify(error, null, 2)}\n- Id: ${req.params.id}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CxCController.obtenerPorClienteId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  exportCsv: async function(req, res){
    try {
      const { fechaInicio, fechaFin, estado, clienteId } = req.allParams();

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = new Date(fechaInicio);
      }
      if (fechaFin) {
        fechaFilter['<='] = new Date(fechaFin);
      }

      const whereClause = {
        fecha: fechaFilter,
        estado,
        deleted: false,
      };

      if (Object.keys(whereClause.fecha).length === 0) {
        delete whereClause.fecha;
      }

      clienteId && (whereClause.clienteId = clienteId);
      estado && (whereClause.estado = estado);

      const cxc = await CxC.find()
        .where(whereClause)
        .populate('clienteId')
        .sort('fecha DESC')
        .meta({enableExperimentalDeepTargets:true});

      const cxcPendiente = cxc.filter(c => c.estado === 'Pendiente');
      const cxcPagada = cxc.filter(c => c.estado === 'Pagada');
      const cxcCancelada = cxc.filter(c => c.estado === 'Cancelada');

      const cxcs = [...cxcPendiente, ...cxcPagada, ...cxcCancelada ];

      const data = cxcs.map(c => ({
        ['No. CxC']: c.id,
        ['Cliente']: `${c.clienteId.nombre || ''} ${c.clienteId.apellido || ''}`,
        ['Fecha']: new Date(c.fecha).toLocaleString(),
        ['Saldo']: c.monto,
        ['Total Abonado']: c.totalAbonado,
        ['Resatante']: c.monto - c.totalAbonado,
        ['Estado']: c.estado,
      }));

      const writer = csvWriteStream();
      const writableStream = fs.createWriteStream('.tmp/data.csv');

      console.log('GERERANDO CSV');
      // Generar log
      await sails.helpers.log({
        accion: 'GET',
        descripcion: 'Se exporto el listado de CxC a CSV',
        origen: 'CxCController.exportCsv',
        token: req.headers.authorization,
        elementId: '',
        success: true
      });

      // Encabezados del CSV
      writer.pipe(writableStream);

      data.forEach(item => {
        writer.write(item);
      });

      writer.end();

      writableStream.on('finish', () => {
        // Configura la respuesta para descargar el archivo CSV.
        res.download('.tmp/data.csv');
      });
    } catch (error) {
      // Generar log
      await sails.helpers.log({
        accion: 'GET',
        descripcion: 'Ocurrio un error al exportar el listado de CxC a CSV',
        origen: 'CxCController.exportCsv',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },

};

