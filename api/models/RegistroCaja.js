/**
 * RegistroCaja.js
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
    cajaId: {
      model: 'caja',
      required: true,
    },
    fechaApertura: {
      type: 'ref',
      columnType: 'datetime',
      required: true
    },
    fechaCierre: {
      type: 'ref',
      columnType: 'datetime',
      required: false
    },
    efectivoInicial: {
      type: 'number',
      required: true,
    },
    efectivoFinal: {
      type: 'number',
      required: false,
    },
    tarjetas: {
      type: 'json',
      required: false,
    },
    otrosMetodos: {
      type: 'json',
      required: false,
    },
    estado: {
      type: 'string',
      required: true,
      isIn: ['abierta', 'completada' ,'cerrada'],
    },
    userId: {
      type: 'string',
      required: true,
    },
    deleted: {
      type: 'boolean',
      defaultsTo: false,
    }
  },

};

