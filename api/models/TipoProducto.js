/**
 * TipoProducto.js
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
    descripcion: {
      type: 'string',
      required: false,
    },
    deleted: {
      type: 'boolean',
      defaultsTo: false,
    }
  },
};

