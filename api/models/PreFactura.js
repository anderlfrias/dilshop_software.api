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
    deleted: {
      type: 'boolean',
      defaultsTo: false,
    },
    // Campos de descuento global (opcionales, backward-compatible)
    descuentoGlobalTipo: {
      type: 'string',
      isIn: ['PORCENTAJE', 'MONTO'],
      required: false,
      allowNull: true,
    },
    descuentoGlobalValor: {
      type: 'number',
      required: false,
      allowNull: true,
    },
    descuentoGlobalMonto: {
      type: 'number',
      required: false,
      allowNull: true,
      defaultsTo: 0,
    },
    // Totales calculados (opcionales)
    // subTotal: {
    //   type: 'number',
    //   required: false,
    //   allowNull: true,
    // },
    // impuesto: {
    //   type: 'number',
    //   required: false,
    //   allowNull: true,
    // },
    // total: {
    //   type: 'number',
    //   required: false,
    //   allowNull: true,
    // }
  },
};

