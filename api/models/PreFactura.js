/**
 * PreFactura.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    id: {
      type: 'string',
      required: true,
    },
    fecha: {
      type: 'ref',
      columnType: 'datetime',
      required: true
    },
    clienteId: {
      model: 'cliente',
      required: false,
    },
    mesaId: {
      model: 'mesa',
      required: false,
    },
    estado: {
      type: 'string',
      isIn: ['Pendiente', 'Abierta', 'Cancelada', 'Completada'],
      defaultsTo: 'Abierta',
    },
    comentario: {
      type: 'string',
      required: false,
      allowNull: true,
    },
    registroCajaId: {
      model: 'registroCaja',
      required: false,
    },
    descuento: {
      type: 'number',
      required: false,
      allowNull: true,
    },
    deleted: {
      type: 'boolean',
      defaultsTo: false,
    }
  },
};

