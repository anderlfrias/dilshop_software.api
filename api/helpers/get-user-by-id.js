
const URL_XUSER = 'https://xuser-api.cmsiglo21.app/api';

module.exports = {


  friendlyName: 'Get user by id',


  description: '',


  inputs: {
    id: {
      type: 'string',
      required: true
    },
    token: {
      type: 'string',
      required: true
    }
  },


  exits: {

    success: {
      outputFriendlyName: 'User by id',
    },
    error: {
      description: 'Something went wrong',
    }

  },


  fn: async function (inputs, exits) {
    try {
      const { id, token } = inputs;
      fetch(`${URL_XUSER}/User/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          return exits.success(data);
        })
        .catch(async err => {
          // Generar log
          const descripcion = `Error al obtener el usuario con id ${id}. \n- Descripcion del error: ${JSON.stringify(err, null, 2)}`;
          await sails.helpers.log({
            accion: 'GET',
            descripcion,
            origen: 'Helper.getUserById',
            token: token,
            elementId: id,
            success: false
          });
          console.log(err);
          // return exits.error(err);
          return exits.success(null);
        });
    } catch (error) {
      console.log(error);
      const descripcion = `Error al obtener el usuario con id ${id}. \n- Descripcion del error: ${JSON.stringify(err, null, 2)}`;
      await sails.helpers.log({
        accion: 'GET',
        descripcion,
        origen: 'Helper.getUserById',
        token: token,
        elementId: id,
        success: false
      });
      // return exits.error(error);
      return exits.success(null);
    }
  }


};

