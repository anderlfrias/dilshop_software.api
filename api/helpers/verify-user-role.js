module.exports = {


  friendlyName: 'Verify user role',


  description: '',


  inputs: {
    user: {
      type: 'ref',
      required: true
    },
    role: {
      type: 'string',
      required: true
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs) {
    // TODO
    const { user, role } = inputs;

    if(!user.role){
      return false;
    }

    if(typeof(user.role) === 'string'){
      if(user.role !== role){
        return false;
      }
    }

    if (typeof(user.role) === 'object' || typeof(user.role) === 'array'){
      if(!user.role.includes(role)){
        return false;
      }
    }

    return true;
  }
};

