/**
 * CobrosController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const csvWriteStream = require('csv-write-stream');
const fs = require('fs');

const CLASIFICACION_CLIENTE = [
  { "value": "cooporativos", "label": "Cooporativos" },
  { "value": "tenicos", "label": "Ténicos" },
  { "value": "familiares", "label": "Familiares" },
  { "value": "ocacionales", "label": "Ocacionales" },
  { "value": "gubernamentales", "label": "Gubernamentales" },
  { "value": "empleados", "label": "Empleados" },
  { "value": "doctores", "label": "Doctores" },
  { "value": "empresas-relacionadas", "label": "Empresas Relacionadas" }
]

const getFechaComprobante = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}${month < 10 ? `0${month}` : month}${day < 10 ? `0${day}` : day}`;
};

module.exports = {
  listar: async function (req, res) {
    try {
      const { clienteId, fechaInicio, fechaFin, page = 0, top = 10 } = req.allParams();

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = new Date(fechaInicio);
      }
      if (fechaFin) {
        fechaFilter['<='] = new Date(fechaFin);
      }

      const whereClause = {
        fecha: fechaFilter,
        isCreditPayment: true,
        deleted: false,
      };

      clienteId && (whereClause.clienteId = clienteId);
      if (Object.keys(whereClause.fecha).length === 0) {
        delete whereClause.fecha;
      }

      const cantidadCobros = await Factura.count(whereClause);
      const montoTotal = await Factura.sum('total', whereClause);
      const cobros = await Factura.find()
        .where(whereClause)
        .populate('clienteId')
        .limit(top)
        .skip(top * page)
        .sort('fecha DESC')
        .meta({enableExperimentalDeepTargets:true});

      return res.ok({
        cobros,
        cantidadCobros,
        total: montoTotal,
      });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los cobros.\n- Error: ${JSON.stringify(error, null, 2)}\n - Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CobrosController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  cobrosCSV: async function (req, res) {
    try {
      const { clienteId, fechaInicio, fechaFin } = req.allParams();

      const fechaFilter = {};
      if (fechaInicio) {
        fechaFilter['>='] = new Date(fechaInicio);
      }
      if (fechaFin) {
        fechaFilter['<='] = new Date(fechaFin);
      }

      const whereClause = {
        fecha: fechaFilter,
        isCreditPayment: true,
        deleted: false,
      };

      clienteId && (whereClause.clienteId = clienteId);
      if (Object.keys(whereClause.fecha).length === 0) {
        delete whereClause.fecha;
      }

      const cobros = await Factura.find()
        .where(whereClause)
        .populate('clienteId')
        .sort('fecha DESC')
        .meta({enableExperimentalDeepTargets:true});

      const data = cobros.map((cobro) => {
        return {
          'CXC ID': cobro.cxcId,
          'No. de Factura': cobro.id,
          'Fecha': getFechaComprobante(new Date(cobro.fecha)),
          'Cliente': `${cobro.clienteId.nombre} ${cobro.clienteId.apellido}`,
          'Tipo de cliente': CLASIFICACION_CLIENTE.find(x => x.value === cobro.clienteId.clasificacion)?.label || '',
          'Monto': cobro.total,
        };
      });

      const csvWriter = csvWriteStream();
      const writableStream = fs.createWriteStream('.tmp/cobros.csv');
      csvWriter.pipe(writableStream);
      data.forEach((cobro) => {
        csvWriter.write(cobro);
      });

      csvWriter.end();

      writableStream.on('finish', () => {
        return res.download('.tmp/cobros.csv');
      });
      
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al exportar los cobros.\n- Error: ${JSON.stringify(error, null, 2)}\n - Params: ${JSON.stringify(req.allParams(), null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CobrosController.cobrosCSV',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  cobrosCaja: async function (req, res) {
    try {
      const { clienteId, fechaInicio, fechaFin } = req.allParams();

      const SELECT_VISTA_COBROS_CAJA = 'SELECT * FROM cobros_caja';
      let whereClause = '';
      let params = [];
      let count = 1;
      if (clienteId) {
        whereClause += ` WHERE idCliente = $${count}`;
        params.push(clienteId);
        count++;
      }
      if (fechaInicio) {
        whereClause += whereClause ? ` AND fecha >= $${count}` : ` WHERE fecha >= $${count}`;
        params.push(new Date(fechaInicio));
        count++;
      }
      if (fechaFin) {
        whereClause += whereClause ? ` AND fecha <= $${count}` : ` WHERE fecha <= $${count}`;
        params.push(new Date(fechaFin));
      }

      await sails.sendNativeQuery(`${SELECT_VISTA_COBROS_CAJA}${whereClause}`, params, (err, result) => {
        if (err) {
          throw new Error(err);
        }
        return res.ok(result.rows);
      });

    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los cobros de caja.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CobrosController.cobrosCaja',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  cobrosCajaCSV: async function (req, res) {
    try {
      const { clienteId, fechaInicio, fechaFin } = req.allParams();

      const SELECT_VISTA_COBROS_CAJA = 'SELECT * FROM cobros_caja';
      let whereClause = '';
      let params = [];
      let count = 1;
      if (clienteId) {
        whereClause += ` WHERE idCliente = $${count}`;
        params.push(clienteId);
        count++;
      }
      if (fechaInicio) {
        whereClause += whereClause ? ` AND fecha >= $${count}` : ` WHERE fecha >= $${count}`;
        params.push(new Date(fechaInicio));
        count++;
      }
      if (fechaFin) {
        whereClause += whereClause ? ` AND fecha <= $${count}` : ` WHERE fecha <= $${count}`;
        params.push(new Date(fechaFin));
      }

      await sails.sendNativeQuery(`${SELECT_VISTA_COBROS_CAJA}${whereClause}`, params, (err, result) => {
        if (err) {
          throw new Error(err);
        }

        const data = result.rows.map((cobro) => {
          return {
            'CXC ID': cobro.cxcId,
            'No. de Factura': cobro.id,
            'Fecha': getFechaComprobante(new Date(cobro.fecha)),
            'Cliente': `${cobro.nombre} ${cobro.apellido}`,
            'Tipo de cliente': CLASIFICACION_CLIENTE.find(x => x.value === cobro.clasificacion)?.label || '',
            'Monto': cobro.total,
          };
        });

        const csvWriter = csvWriteStream();
        const writableStream = fs.createWriteStream('.tmp/cobros_caja.csv');
        csvWriter.pipe(writableStream);
        data.forEach((cobro) => {
          csvWriter.write(cobro);
        });

        csvWriter.end();

        writableStream.on('finish', () => {
          return res.download('.tmp/cobros_caja.csv');
        });
      });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al exportar los cobros de caja.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CobrosController.cobrosCajaCSV',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  cobrosNomina: async function (req, res) {
    try {
      const { clienteId, fechaInicio, fechaFin } = req.allParams();

      const SELECT_VISTA_COBROS_NOMINA = 'SELECT * FROM cobros_nomina';
      let whereClause = '';
      let params = [];
      let count = 1;
      if (clienteId) {
        whereClause += ` WHERE idCliente = $${count}`;
        params.push(clienteId);
        count++;
      }
      if (fechaInicio) {
        whereClause += whereClause ? ` AND fecha >= $${count}` : ` WHERE fecha >= $${count}`;
        params.push(new Date(fechaInicio));
        count++;
      }
      if (fechaFin) {
        whereClause += whereClause ? ` AND fecha <= $${count}` : ` WHERE fecha <= $${count}`;
        params.push(new Date(fechaFin));
      }

      await sails.sendNativeQuery(`${SELECT_VISTA_COBROS_NOMINA}${whereClause}`, params, (err, result) => {
        if (err) {
          throw new Error(err);
        }
        return res.ok(result.rows);
      });

    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los cobros de nomina.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CobrosController.cobrosNomina',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  cobrosNominaCSV: async function (req, res) {
    try {
      const { clienteId, fechaInicio, fechaFin } = req.allParams();

      const SELECT_VISTA_COBROS_NOMINA = 'SELECT * FROM cobros_nomina';
      let whereClause = '';
      let params = [];
      let count = 1;
      if (clienteId) {
        whereClause += ` WHERE idCliente = $${count}`;
        params.push(clienteId);
        count++;
      }
      if (fechaInicio) {
        whereClause += whereClause ? ` AND fecha >= $${count}` : ` WHERE fecha >= $${count}`;
        params.push(new Date(fechaInicio));
        count++;
      }
      if (fechaFin) {
        whereClause += whereClause ? ` AND fecha <= $${count}` : ` WHERE fecha <= $${count}`;
        params.push(new Date(fechaFin));
      }

      await sails.sendNativeQuery(`${SELECT_VISTA_COBROS_NOMINA}${whereClause}`, params, (err, result) => {
        if (err) {
          throw new Error(err);
        }

        const data = result.rows.map((cobro) => {
          return {
            'CXC ID': cobro.cxcId,
            'No. de Factura': cobro.id,
            'Fecha': getFechaComprobante(new Date(cobro.fecha)),
            'Cliente': `${cobro.nombre} ${cobro.apellido}`,
            'Tipo de cliente': CLASIFICACION_CLIENTE.find(x => x.value === cobro.clasificacion)?.label || '',
            'Monto': cobro.total,
          };
        });

        const csvWriter = csvWriteStream();
        const writableStream = fs.createWriteStream('.tmp/cobros_caja.csv');
        csvWriter.pipe(writableStream);
        data.forEach((cobro) => {
          csvWriter.write(cobro);
        });

        csvWriter.end();

        writableStream.on('finish', () => {
          return res.download('.tmp/cobros_caja.csv');
        });
      });
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al exportar los cobros de nomina.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'CobrosController.cobrosNominaCSV',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },

};

