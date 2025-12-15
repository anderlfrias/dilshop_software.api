/**
 * DocController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  info: function (req, res) {
    res.json({
      name: 'Restaurante API',
      version: '1.0.0',
    }
    );
  },
};

