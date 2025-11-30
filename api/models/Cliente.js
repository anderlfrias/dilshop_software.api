/**
 * Cliente.js
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
    codigoExterno: {
      type: 'string',
      required: false,
    },
    nombre: {
      type: 'string',
      required: true,
    },
    apellido: {
      type: 'string',
      required: false,
    },
    direccion: {
      type: 'json',
      required: false,
    },
    identificacion: {
      type: 'string',
      required: false,
    },
    tipoIdentificacion: {
      type: 'string',
      required: false,
    },
    telefono: {
      type: 'string',
      required: false,
    },
    celular: {
      type: 'string',
      required: false,
    },
    email: {
      type: 'string',
      required: false,
    },
    idCliente: {
      model: 'Cliente',
      required: false,
    },
    contacto: {
      type: 'boolean',
      defaultsTo: false,
    },
    tipoNCF : {
      type: 'string',
      required: false,
    },
    limiteCredito : {
      type: 'number',
      required: false,
    },
    condicionCredito : {
      type: 'number',
      required: false,
    },
    clasificacion : {
      type: 'string',
      required: false,
    },
    deleted: {
      type: 'boolean',
      defaultsTo: false,
    }
  },

};

