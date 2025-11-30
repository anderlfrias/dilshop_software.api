const jwt = require('jsonwebtoken');
module.exports = {


  friendlyName: 'Log',


  description: 'Log something.',


  inputs: {
    data: { type: {}, required: true },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs) {
    // TODO
    try {
      const { data } = inputs;

      const user = data.token ? jwt.verify(data.token, sails.config.session.secret) : { nameid: 'system' };
      await ActivityLogs.create({
        ...data,
        fecha: new Date().toISOString(),
        autor: user.nameid,
        elementId: data.elementId || '',
      }).fetch();
    } catch (error) {
      console.error(
        `Error al generar log.\n- Data: ${JSON.stringify(inputs.data, null, 2)}`,
        error
      );
    }
  }


};

