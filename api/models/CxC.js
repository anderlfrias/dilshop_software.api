/**
 * CxC.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    id: {
      type : 'string',
      required : true
    },
    clienteId : {
      model : 'cliente',
      required : true
    },
    monto : {
      type : 'number',
      required : true
    },
    fecha : {
      type : 'ref',
      columnType : 'datetime',
      required : true
    },
    totalAbonado : {
      type : 'number',
      required : true
    },
    estado : {
      type : 'string',
      isIn : ['Pendiente', 'Pagada', 'Cancelada'],
      defaultsTo : 'Pendiente'
    },
    deleted : {
      type : 'boolean',
      defaultsTo : false
    },
  },
};

