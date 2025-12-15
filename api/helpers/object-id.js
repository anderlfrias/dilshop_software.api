const { ObjectId } = require('bson');

module.exports = {


  friendlyName: 'Object id',


  description: '',


  inputs: {

  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs) {
    return new ObjectId().toHexString();
  }


};

