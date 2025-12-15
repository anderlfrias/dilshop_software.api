/**
 * CajaController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  crear: async function (req, res) {
    try {
      const caja = {
        id: await sails.helpers.objectId(),
        nombre: req.body.nombre,
        ubicacion: req.body.ubicacion,
        disponible: req.body.disponible,
      };

      if (!caja.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      const cajaCreada = await Caja.create(caja).fetch();

      if (cajaCreada) {
        // Generar log
        await sails.helpers.log({
          accion: 'POST',
          descripcion: 'Se creo una caja con nombre ' + cajaCreada.nombre,
          origen: 'CajaController.crear',
          token: req.headers.authorization,
          elementId: cajaCreada.id,
          success: true
        });
        return res.ok(cajaCreada);
      } else {
        return res.serverError('Ocurrio un error al crear la caja');
      }

    } catch (err) {
      await sails.helpers.log({
        accion: 'POST',
        descripcion: 'Ocurrio un error al crear la caja',
        origen: 'CajaController.crear',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(err);
    }
  },
  listar: async function (req, res) {
    try {
      const filter = req.query.filter || '';
      const cajas = await Caja.find(
        {
          deleted: false,
          or: [
            { nombre: { contains: filter } },
            { ubicacion: { contains: filter } }
          ]
        }
      )
        .meta({ makeLikeModifierCaseInsensitive: true });
      return res.ok(cajas);
    } catch (err) {
      return res.serverError(err);
    }
  },
  obtenerPorId: async function (req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      const caja = await Caja.findOne({ id: id });
      if (!caja) {
        return res.badRequest({ err: 'No existe la caja' });
      } else {
        return res.ok(caja);
      }
    } catch (err) {
      return res.serverError(err);
    }
  },
  actualizar: async function (req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      const caja = {
        nombre: req.body.nombre,
        ubicacion: req.body.ubicacion,
        disponible: req.body.disponible,
      };

      if (!caja.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      let cajaDesactualizada = await Caja.findOne({ id: id });

      if (!cajaDesactualizada) {
        return res.badRequest({ err: 'No existe la caja' });
      }

      // verificar que los campos no sean iguales
      if (cajaDesactualizada.nombre === caja.nombre && cajaDesactualizada.ubicacion === caja.ubicacion && cajaDesactualizada.disponible === caja.disponible) {
        return res.ok(cajaDesactualizada);
      }

      const cajaActualizada = await Caja.updateOne({ id: id }).set(caja);

      if (cajaActualizada) {
        // Generar log
        const descripcion = `Actualzacion de caja:\n- Datos anteriores: ${JSON.stringify(cajaDesactualizada, null, 2)}\n- Datos nuevos: ${JSON.stringify(cajaActualizada, null, 2)}`;

        await sails.helpers.log({
          accion: 'PUT',
          descripcion,
          origen: 'CajaController.actualizar',
          token: req.headers.authorization,
          elementId: cajaDesactualizada.id,
          success: true
        });

        return res.ok(cajaActualizada);
      } else {
        throw new Error('Ocurrio un error al actualizar la caja');
      }

    } catch (err) {
      await sails.helpers.log({
        accion: 'PUT',
        descripcion: 'Ocurrio un error al actualizar la caja',
        origen: 'CajaController.actualizar',
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

      let cajaDesactualizada = await Caja.findOne({ id: id });

      if (!cajaDesactualizada) {
        return res.badRequest({ err: 'No existe la caja' });
      }

      const cajaEliminada = await Caja.updateOne({ id: id }).set({ deleted: true });

      if (cajaEliminada) {
        // Generar log
        await sails.helpers.log({
          accion: 'DELETE',
          descripcion: `Se elimino la caja con nombre ${cajaEliminada.nombre}`,
          origen: 'CajaController.eliminar',
          token: req.headers.authorization,
          elementId: cajaDesactualizada.id,
          success: true
        });
        return res.ok(cajaEliminada);
      } else {
        throw new Error('Ocurrio un error al eliminar la caja');
      }

    } catch (err) {
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion: 'Ocurrio un error al eliminar la caja',
        origen: 'CajaController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(err);
    }
  }
};

