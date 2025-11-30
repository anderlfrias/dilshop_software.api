/**
 * NCF.js
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
    serie: {
      type : 'string',
      required : true
    },
    tipoComprobante: {
      type : 'string',
      required : true
    },
    secuencialInicial: {
      type : 'string',
      required : true
    },
    secuencialFinal: {
      type : 'string',
      required : true
    },
    fecha: {
      type : 'ref',
      columnType : 'datetime',
      required: true,
    },
    fechaVencimiento: {
      type : 'ref',
      columnType : 'datetime',
      required: true,
    },
    estado: {
      type: 'string',
      defaultsTo: 'abierto',
      isIn: ['abierto', 'cerrado'],
    },
    cantidadAprobada: {
      type: 'number',
      required: true,
    },
    cantidadUsada: {
      type: 'number',
      required: true,
    },
    numeroAutorizacion: {
      type: 'string',
      required: true,
    },
    deleted: {
      type: 'boolean',
      defaultsTo: false,
    },
  },

};

