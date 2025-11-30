/**
 * LoggedUsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  get: async function (req, res) {
    try {
      const loggedUsers = await LoggedUsers.find();

      return res.ok(loggedUsers);
    } catch (error) {
      const description = `Error en el controlador LoggedUsersController en la función get. Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion: description,
        origen: 'LoggedUsersController.get',
        token: req.headers.authorization,
        elementId: '',
        success: false
      });
      return res.serverError(error);
    }
  },
  login: async function (req, res) {
    const { userId } = req.allParams();
    try {
      if (!userId) {
        return res.badRequest({ err: 'El id del usuario es requerido.' });
      }

      const userAccess = await LoggedUsers.find().where({ userId }).limit(1);
      const userLogged = userAccess[0];

      if (!userLogged) {
        await LoggedUsers.create({ userId, isLoggedIn: true });
      } else if (userLogged.isLoggedIn) {
        return res.badRequest({ err: 'El usuario ya se encuentra logueado.' });
      } else {
        await LoggedUsers.updateOne({ id: userLogged.id }).set({ isLoggedIn: true });
      }

      const description = `El usuario con id ${userId} se logueo correctamente.`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion: description,
        origen: 'LoggedUsersController.login',
        token: null,
        elementId: userId,
        success: true
      });

      return res.ok();
    } catch (error) {
      const description = `Error en el controlador LoggedUsersController en la función login. Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion: description,
        origen: 'LoggedUsersController.login',
        token: req.headers.authorization,
        elementId: userId || '',
        success: false
      });
      return res.serverError(error);
    }
  },
  logout: async function (req, res) {
    const { userId } = req.allParams();
    try {

      if (!userId) {
        return res.badRequest({ err: 'El id del usuario es requerido.' });
      }

      const user = await LoggedUsers.findOne().where({ userId, isLoggedIn: true });

      if (user) {
        await LoggedUsers.updateOne({ id: user.id }).set({ isLoggedIn: false });
      } else {
        await LoggedUsers.create({ userId, isLoggedIn: false });
      }

      const description = `El usuario con id ${userId} se deslogueo correctamente.`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion: description,
        origen: 'LoggedUsersController.logout',
        token: req.headers.authorization,
        elementId: userId,
        success: true
      });

      return res.ok();
    } catch (error) {
      const description = `Error en el controlador LoggedUsersController en la función logout. Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'POST',
        descripcion: description,
        origen: 'LoggedUsersController.logout',
        token: req.headers.authorization,
        elementId: userId || '',
        success: false
      });
      return res.serverError(error);
    }
  },
  delete: async function (req, res) {
    const { id } = req.allParams();
    try {
      if (!id) {
        return res.badRequest({ err: 'El id del usuario es requerido.' });
      }

      const userAccess = await LoggedUsers.findOne().where({ id });

      if (!userAccess) {
        return res.badRequest({ err: 'El usuario no se encuentra logueado.' });
      }

      const accessDeleted = await LoggedUsers.destroyOne({ id });

      const description = `El usuario con id ${id} se elimino correctamente. Datos: ${JSON.stringify(accessDeleted, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion: description,
        origen: 'LoggedUsersController.delete',
        token: req.headers.authorization,
        elementId: id,
        success: true
      });

      return res.ok();
    } catch (error) {
      const description = `Error en el controlador LoggedUsersController en la función delete. Error: ${JSON.stringify(error, null, 2)}`;
      await sails.helpers.log({
        accion: 'DELETE',
        descripcion: description,
        origen: 'LoggedUsersController.delete',
        token: req.headers.authorization,
        elementId: id || '',
        success: false
      });
      return res.serverError(error);
    }
  }
};

