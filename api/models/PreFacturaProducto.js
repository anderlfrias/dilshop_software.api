/**
 * PreFacturaProducto.js
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
    preFacturaId: {
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
    },
    // Campos de descuento por línea (opcionales, backward-compatible)
    descuentoTipo: {
      type: 'string',
      isIn: ['PORCENTAJE', 'MONTO'],
      required: false,
      allowNull: true,
    },
    descuentoValor: {
      type: 'number',
      required: false,
      allowNull: true,
    },
    descuentoMonto: {
      type: 'number',
      required: false,
      allowNull: true,
      defaultsTo: 0,
    }

  },

};



