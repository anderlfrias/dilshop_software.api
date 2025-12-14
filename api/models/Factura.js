/**
 * Factura.js
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
    // codigo: {
    //   type: 'string',
    //   required: false,
    //   allowNull: true,
    // },
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
    registroCajaId: {
      model: 'registroCaja',
      required: false,
    },
    deleted: {
      type: 'boolean',
      defaultsTo: false,
    },
    porcientoDescuento: {
      type: 'number',
      required: false,
    },
    tipoFactura: {
      type: 'string',
      isIn: ['consumidores-finales', 'factura-credito-fiscal', 'regimen-especial', 'gubernamental'],
      required: false,
    },
    clienteRNC: {
      type: 'json',
      required: false,
    },
    pagos: {
      type: 'json',
      required: false
    },
    total: {
      type: 'number',
      required: false
    },
    subTotal: {
      type: 'number',
      required: false
    },
    impuesto: {
      type: 'number',
      required: false
    },
    delivery: {
      type: 'number',
      required: false
    },
    isCredit: {
      type: 'boolean',
      required: false
    },
    isCreditPayment: {
      type: 'boolean',
      required: false
    },
    cxcId: {
      model: 'cxC',
      required: false
    },
    ncf: {
      type: 'string',
      required: false,
    },
    descuento: {
      type: 'number',
      required: false,
      allowNull: true,
    },
    idLote: {
      type: 'string',
      required: false,
      allowNull: true,
    },
  },

  // beforeCreate: function (valuesToSet, proceed) {
  //   // Generate a unique code for bill ej. 0000001 -> 0000002 -> 0000003
  //   const generateCode = (code) => {
  //     const number = parseInt(code) + 1;
  //     const newCode = number.toString();

  //     return newCode.toString().padStart(7, '0');
  //   };

  //   Factura.find({}).sort('codigo DESC').limit(1).exec((err, factura) => {
  //     if (err) {
  //       return proceed(err);
  //     }
  //     if (factura.length > 0) {
  //       const newCode = generateCode(factura[0].codigo);
  //       valuesToSet.codigo = newCode;
  //     } else {
  //       valuesToSet.codigo = '0000001';
  //     }
  //     return proceed();
  //   });
  // },

};

