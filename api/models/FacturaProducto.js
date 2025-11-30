/**
 * FacturaProducto.js
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
    facturaId: {
      model: 'preFactura',
      required: true,
    },
    productoId: {
      model: 'producto',
      required: true,
    },
    cantidad: {
      type: 'number',
      required: true,
    },
    precio: {
      type: 'number',
      required: true,
    },
    costo: {
      type: 'number',
      required: true,
    },
    impuesto: {
      type: 'number',
      required: true,
    },
    nombre: {
      type: 'string',
      required: true,
    },
    deleted: {
      type: 'boolean',
      defaultsTo: false,
    }

  },

};

