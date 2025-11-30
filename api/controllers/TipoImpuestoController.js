/**
 * TipoImpuestoController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const objId = require('mongodb').ObjectID;
module.exports = {
  crear: async function (req, res) {
    try {
      const tipoImpuesto = {
        id: new objId().toString(),
        descripcion: req.body.descripcion,
        porcentaje: req.body.porcentaje,
      };

      if (!tipoImpuesto.descripcion) {
        return res.badRequest({ err: 'La descripcion es requerida' });
      }

      if (tipoImpuesto.porcentaje === undefined || tipoImpuesto.porcentaje === null) {
        return res.badRequest({ err: 'El porcentaje es requerido' });
      }

      const tipoImpuestoCreado = await TipoImpuesto.create(tipoImpuesto).fetch();

      if (tipoImpuestoCreado) {
        // Generar log
        const descripcion = `Se creo un tipo de impuesto con los siguientes datos:\n${JSON.stringify(tipoImpuestoCreado, null, 2)}`;
        await sails.helpers.log({
          accion: 'POST',
          descripcion,
          origen: 'TipoImpuestoController.crear',
          token: req.headers.authorization,
          elementId: tipoImpuestoCreado.id,
          success: true
        });

        return res.ok(tipoImpuestoCreado);
      }
      else {
        throw new Error('Ocurrio un error al crear el tipo de impuesto');
      }

    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al crear el tipo de impuesto.\n- Error: ${JSON.stringify(err, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'TipoImpuestoController.crear',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(err);
    }
  },
  listar: async function (req, res) {
    try {
      const tipoImpuestos = await TipoImpuesto.find().where({ deleted: false });
      return res.ok(tipoImpuestos);
    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los tipos de impuestos.\n- Error: ${JSON.stringify(err, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'TipoImpuestoController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(err);
    }
  },
  obtenerPorId: async function (req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      const tipoImpuesto = await TipoImpuesto.findOne({ id: id });
      if (!tipoImpuesto) {
        return res.badRequest({ err: 'No existe el tipo de impuesto' });
      } else {
        return res.ok(tipoImpuesto);
      }
    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el tipo de impuesto.\n- Error: ${JSON.stringify(err, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'TipoImpuestoController.obtenerPorId',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(err);
    }
  },
  actualizar: async function (req, res) {
    try {
      const tipoImpuesto = {
        descripcion: req.body.descripcion,
        porcentaje: req.body.porcentaje,
      };

      if (!tipoImpuesto.descripcion) {
        return res.badRequest({ err: 'La descripcion es requerida' });
      }

      if (tipoImpuesto.porcentaje === undefined || tipoImpuesto.porcentaje === null) {
        return res.badRequest({ err: 'El porcentaje es requerido' });
      }

      const impuestoDesactualizado = await TipoImpuesto.findOne({ id: req.params.id , deleted: false});

      if (!impuestoDesactualizado) {
        return res.badRequest({ err: 'No existe el tipo de impuesto' });
      }

      const tipoImpuestoActualizado = await TipoImpuesto.updateOne({ id: req.params.id }).set(tipoImpuesto).catch(
        (err) => {
          if (err.code === 'E_UNIQUE') {
            return res.badRequest({ err: 'El tipo de impuesto ya existe' });
          } else {
            return res.serverError(err);
          }
        }
      );

      if (tipoImpuestoActualizado) {
        // Generar log
        const descripcion = `Se actualizo el tipo de impuesto con los siguientes datos:\n- Datos anteriores${JSON.stringify(impuestoDesactualizado, null, 2)}\n- Datos nuevos: ${JSON.stringify(tipoImpuestoActualizado, null, 2)}`;
        await sails.helpers.log({
          accion: 'PUT',
          descripcion,
          origen: 'TipoImpuestoController.actualizar',
          token: req.headers.authorization,
          elementId: tipoImpuestoActualizado.id,
          success: true
        });
        return res.ok(tipoImpuestoActualizado);
      }

    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al actualizar el tipo de impuesto.\n- Error: ${JSON.stringify(err, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'TipoImpuestoController.actualizar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(err);
    }
  },
  eliminar: async function (req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      const tipoImpuestoEliminado = await TipoImpuesto.updateOne({ id: id }).set({ deleted: true });

      if (!tipoImpuestoEliminado) {
        return res.badRequest({ err: 'No existe el tipo de impuesto' });
      }

      // Generar log
      const descripcion = `Se elimino el tipo de impuesto con los siguientes datos:\n${JSON.stringify(tipoImpuestoEliminado, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'TipoImpuestoController.eliminar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(tipoImpuestoEliminado);

    } catch (err) {
      // Generar log
      const descripcion = `Ocurrio un error al eliminar el tipo de impuesto.\n- Error: ${JSON.stringify(err, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'TipoImpuestoController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(err);
    }
  }
};

