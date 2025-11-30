/**
 * MesaController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const objId = require('mongodb').ObjectID;

module.exports = {
  crear : async function(req, res){
    try{
      const mesa = {
        id: new objId().toString(),
        nombre: req.body.nombre,
        ubicacion: req.body.ubicacion,
        disponible: req.body.disponible ||   true,
        estado: req.body.estado || 'disponible',
      };

      if(!mesa.nombre){
        return res.badRequest({err: 'El nombre es requerido'});
      }

      const mesaCreada = await Mesa.create(mesa).fetch();

      if(mesaCreada){
        // Generar log
        const descripcion = `Se creo una mesa con los siguientes datos:\n${JSON.stringify(mesaCreada, null, 2)}`;
        await sails.helpers.log({
          accion: 'POST',
          descripcion,
          origen: 'MesaController.crear',
          token: req.headers.authorization,
          elementId: mesaCreada.id,
          success: true
        });
        return res.ok(mesaCreada);
      }else{
        throw new Error('Ocurrio un error al crear la mesa');
      }

    }catch(err){
      // Generar log
      const descripcion = `Ocurrio un error al crear la mesa.\n- Error: ${JSON.stringify(err, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'MesaController.crear',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      return res.serverError(err);
    }
  },
  listar : async function(req, res){
    try{
      const filter = req.query.filter || '';
      const mesas = await Mesa.find(
        {
          deleted: false,
          or: [
            {nombre: {contains: filter}},
            {ubicacion: {contains: filter}}
          ]
        }
      )
      .meta({makeLikeModifierCaseInsensitive: true});
      return res.ok(mesas);
    }catch(err){
      // Generar log
      const descripcion = `Ocurrio un error al listar las mesas.\n- Error: ${JSON.stringify(err, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'MesaController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });

      return res.serverError(err);
    }
  },
  obtenerPorId : async function(req, res){
    try{
      const id = req.params.id;

      if(!id){
        return res.badRequest({err: 'El id es requerido'});
      }

      const mesa = await Mesa.findOne({id: id, deleted: false});
      if(!mesa){
        return res.badRequest({err: 'No existe la mesa'});
      }
      return res.ok(mesa);
    }catch(err){
      // Generar log
      const descripcion = `Ocurrio un error al obtener la mesa por id.\n- Error: ${JSON.stringify(err, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'MesaController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(err);
    }
  },
  actualizar : async function(req, res){
    try{
      const id = req.params.id;
      const mesa = {
        nombre: req.body.nombre,
        ubicacion: req.body.ubicacion,
        disponible: req.body.disponible,
      };

      if(!id){
        return res.badRequest({err: 'El id es requerido'});
      }

      if(!mesa.nombre){
        return res.badRequest({err: 'El nombre es requerido'});
      }

      const mesaDesactualizada = await Mesa.findOne({id: id, deleted: false});

      if(!mesaDesactualizada){
        return res.badRequest({err: 'No existe la mesa'});
      }

      const mesaActualizada = await Mesa.updateOne({id: id, deleted: false})
      .set(mesa);

      if(!mesaActualizada){
        return res.badRequest({err: 'No existe la mesa'});
      }

      // Generar log
      const descripcion = `Actualzacion de mesa:\n- Datos anteriores: ${JSON.stringify(mesaDesactualizada, null, 2)}\n- Datos nuevos: ${JSON.stringify(mesaActualizada, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'MesaController.actualizar',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(mesaActualizada);
    }catch(err){
      // Generar log
      const descripcion = `Ocurrio un error al actualizar la mesa.\n- Error: ${JSON.stringify(err, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'MesaController.actualizar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });

      return res.serverError(err);
    }
  },
  cambiarEstado: async function(req, res) {
    const { id, estado } = req.allParams();
    try {
      if (!id || !estado) {
        return res.badRequest({ err: 'El id es requerido' });
      }

      const mesa = await Mesa.findOne({ id, deleted: false });
      if (!mesa) {
        return res.badRequest({ err: 'No existe la mesa' });
      }

      const mesaActualizada = await Mesa.updateOne({ id, deleted: false })
        .set({ estado });

      if (!mesaActualizada) {
        return res.badRequest({ err: 'Ocurrio un error al actualizar la mesa' });
      }

      // Generar log
      const descripcion = `Se cambio el estado de la mesa con id ${id} a ${estado}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'MesaController.cambiarEstado',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok(mesaActualizada);
    } catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al cambiar el estado de la mesa.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'MesaController.cambiarEstado',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      res.serverError(error);
    }
  },
  eliminar : async function(req, res){
    try{
      const id = req.params.id;

      if(!id){
        return res.badRequest({err: 'El id es requerido'});
      }

      const mesaEliminada = await Mesa.updateOne({id: id})
      .set({deleted: true});

      if(!mesaEliminada){
        return res.badRequest({err: 'No existe la mesa'});
      }

      // Generar log
      const descripcion = `Se elimino la mesa con los siguientes datos:\n${JSON.stringify(mesaEliminada, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'MesaController.eliminar',
        token: req.headers.authorization,
        elementId: mesaEliminada.id,
        success: true
      });

      return res.ok(mesaEliminada);
    }catch(err){
      // Generar log
      const descripcion = `Ocurrio un error al eliminar la mesa.\n- Error: ${JSON.stringify(err, null, 2)}\n - Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'MesaController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(err);
    }
  }
};

