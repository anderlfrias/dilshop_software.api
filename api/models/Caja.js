/**
 * Caja.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    id : {
      type: 'string',
      required: true,
    },
    nombre: {
      type: 'string',
      required: true,
    },
    ubicacion : {
      type: 'string',
      required: false,
    },
    disponible : {
      type: 'boolean',
      defaultsTo: true,
    },
    deleted: {
      type: 'boolean',
      defaultsTo: false,
    }
  },

};

