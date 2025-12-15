/**
 * ClienteController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  crear: async function (req, res) {
    try {
      const cliente = {
        id: await sails.helpers.objectId(),
        codigoExterno: req.body.codigoExterno,
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        direccion: req.body.direccion,
        identificacion: req.body.identificacion,
        telefono: req.body.telefono,
        celular: req.body.celular,
        email: req.body.email,
        contacto: req.body.contacto,
        idCliente: req.body.idCliente || null,
        tipoNCF: req.body.tipoNCF,
        limiteCredito: req.body.limiteCredito,
        condicionCredito: req.body.condicionCredito,
        clasificacion: req.body.clasificacion,
        tipoIdentificacion: req.body.tipoIdentificacion,

      };

      if (cliente.limiteCredito === '' || cliente.limiteCredito === null || cliente.limiteCredito === undefined) {
        cliente.limiteCredito = 0;
      }
      if (cliente.condicionCredito === '' || cliente.condicionCredito === null || cliente.condicionCredito === undefined) {
        cliente.condicionCredito = 0;
      }
      if (!cliente.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      if (!cliente.apellido) {
        return res.badRequest({ err: 'El apellido es requerido' });
      }

      const clienteCreado = await Cliente.create(cliente).fetch();

      if (!clienteCreado) {
        throw new Error('Ocurrio un error al crear el cliente');
      }

      // Generar log
      const descripcion = `Se creo un cliente con los siguientes datos:\n${JSON.stringify(clienteCreado, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'ClienteController.crear',
        token: req.headers.authorization,
        elementId: clienteCreado.id,
        success: true
      });
      return res.ok(clienteCreado);

    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al crear el cliente.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion,
        origen: 'ClienteController.crear',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  listar: async function (req, res) {
    try {
      const { top = 10, page = 0, filter = '' } = req.query;

      const cantidadClientes = await Cliente.count({
        deleted: false,
        or: [
          { nombre: { contains: filter } }, { apellido: { contains: filter } }
        ]
      });

      const clientes = await Cliente.find({
        deleted: false,
        or: [
          { nombre: { contains: filter } },
          { apellido: { contains: filter } },
          { identificacion: { contains: filter } },
          { telefono: { contains: filter } },
          { celular: { contains: filter } },
          { email: { contains: filter } },
        ]
      })
        .populate('idCliente')
        .meta({ makeLikeModifierCaseInsensitive: true, })
        .sort([{ nombre: 'ASC' }])
        .limit(top)
        .skip(page * top);

      return res.ok({ clientes, cantidadClientes });
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los clientes.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ClienteController.listar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  listarTodos: async function (req, res) {
    try {
      const { top = 10, page = 0, filter = '' } = req.query;

      const cantidadClientes = await Cliente.count()
        .where({
          or: [
            { nombre: { contains: filter } }, { apellido: { contains: filter } }
          ],
          deleted: false
        });

      const clientes = await Cliente.find()
        .where({
          or: [
            { nombre: { contains: filter } },
            { apellido: { contains: filter } },
            { identificacion: { contains: filter } },
            { telefono: { contains: filter } },
            { celular: { contains: filter } },
            { email: { contains: filter } },
          ],
          deleted: false
        })
        .populate('idCliente')
        .meta({ makeLikeModifierCaseInsensitive: true, })
        .sort([{ nombre: 'ASC' }])
        .limit(top)
        .skip(page * top);

      return res.ok({ clientes, cantidadClientes });
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al listar los clientes.\n- Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ClienteController.listarTodos',
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
      const cliente = await Cliente.findOne({ id: id, deleted: false });
      if (!cliente) {
        return res.badRequest({ err: 'No existe el cliente' });
      }
      return res.ok(cliente);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al obtener el cliente.\n- Error: ${JSON.stringify(error, null, 2)}\n- Id: ${req.params.id}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'ClienteController.obtenerPorId',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  },
  actualizar: async function (req, res) {
    try {
      const cliente = {
        codigoExterno: req.body.codigoExterno,
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        direccion: req.body.direccion,
        identificacion: req.body.identificacion,
        telefono: req.body.telefono,
        celular: req.body.celular,
        email: req.body.email,
        contacto: req.body.contacto,
        idCliente: req.body.idCliente || null,
        tipoNCF: req.body.tipoNCF,
        limiteCredito: req.body.limiteCredito,
        condicionCredito: req.body.condicionCredito,
        clasificacion: req.body.clasificacion,
        tipoIdentificacion: req.body.tipoIdentificacion,
      };

      if (!cliente.nombre) {
        return res.badRequest({ err: 'El nombre es requerido' });
      }

      if (!cliente.apellido) {
        return res.badRequest({ err: 'El apellido es requerido' });
      }

      if (cliente.limiteCredito === '' || cliente.limiteCredito === null || cliente.limiteCredito === undefined) {
        cliente.limiteCredito = 0;
      }
      if (cliente.condicionCredito === '' || cliente.condicionCredito === null || cliente.condicionCredito === undefined) {
        cliente.condicionCredito = 0;
      }

      const clienteDesactualizado = await Cliente.findOne({ id: req.params.id });

      if (!clienteDesactualizado) {
        return res.badRequest({ err: 'No existe el cliente' });
      }

      const clienteActualizado = await Cliente.updateOne({ id: req.params.id }).set(cliente);

      if (!clienteActualizado) {
        throw new Error('Ocurrio un error al actualizar el cliente');
      }

      // Generar log
      const descripcion = `Actualizacion de cliente:\n- Datos anteriores: ${JSON.stringify(clienteDesactualizado, null, 2)}\n- Datos nuevos: ${JSON.stringify(clienteActualizado, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ClienteController.actualizar',
        token: req.headers.authorization,
        elementId: clienteDesactualizado.id,
        success: true
      });

      return res.ok(clienteActualizado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al actualizar el cliente.\n- Error: ${JSON.stringify(error, null, 2)}\n- Body: ${JSON.stringify(req.body, null, 2)}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ClienteController.actualizar',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  activar: async function (req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.badRequest({ err: 'El id es requerido' });
      }
      const clienteActivado = await Cliente.updateOne({ id: id }).set({ deleted: false });

      if (!clienteActivado) {
        throw new Error('Ocurrio un error al activar el cliente');
      }

      // Generar log
      const descripcion = `Se activo el cliente con nombre ${clienteActivado.nombre}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ClienteController.activar',
        token: req.headers.authorization,
        elementId: clienteActivado.id,
        success: true
      });

      return res.ok(clienteActivado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al activar el cliente.\n- Error: ${JSON.stringify(error, null, 2)}\n- Params: ${req.params}`;
      await sails.helpers.log({
        accion: 'PUT',
        descripcion,
        origen: 'ClienteController.activar',
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
      const clienteEliminado = await Cliente.updateOne({ id: id }).set({ deleted: true });

      if (!clienteEliminado) {
        throw new Error('Ocurrio un error al eliminar el cliente');
      }
      // Generar log
      const descripcion = `Se elimino el cliente con los siguientes datos:\n${JSON.stringify(clienteEliminado, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'ClienteController.eliminar',
        token: req.headers.authorization,
        elementId: clienteEliminado.id,
        success: true
      });

      return res.ok(clienteEliminado);
    }
    catch (error) {
      // Generar log
      const descripcion = `Ocurrio un error al eliminar el cliente.\n- Error: ${JSON.stringify(error, null, 2)}\n- Id: ${req.params.id}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion,
        origen: 'ClienteController.eliminar',
        token: req.headers.authorization,
        elementId: req.params.id,
        success: false
      });
      return res.serverError(error);
    }
  }
};

