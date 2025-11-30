/**
 * Producto.js
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
    nombre: {
      type: 'string',
      required: true,
    },
    codigo: {
      type: 'string',
      required: true,
      unique: true,
    },
    codigoExterno: {
      type: 'string',
      required: false,
    },
    descripcion: {
      type: 'string',
      required: false,
    },
    idTipoProducto: {
      model: 'TipoProducto',
      required: false,
    },
    idMarca: {
      model: 'Marca',
      required: false,
    },
    idCategoria: {
      model: 'Categoria',
      required: false,
    },
    idSuplidor: {
      model: 'Suplidor',
      required: false,
    },
    idTipoImpuesto: {
      model: 'TipoImpuesto',
      required: true,
    },
    costo: {
      type: 'number',
      required: true,
    },
    precio: {
      type: 'number',
      required: true,
    },
    deleted: {
      type: 'boolean',
      defaultsTo: false,
    },
    cantidad: {
      type: 'number',
      required: false,
    },
    medida: {
      type: 'string',
      required: false,
    },
    estado: {
      type: 'boolean',
      defaultsTo: true,
    },
    otrosImpuestos: {
      type: 'json',
      required: false,
    },
    usoImpuesto: {
      type: 'string',
      required: false,
    },
    // preFacturas: {
    //   collection: 'PreFactura',
    //   via: 'productos'
    // }

  },

};

