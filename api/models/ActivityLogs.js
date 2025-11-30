/**
 * ActivityLogs.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'activity',
  attributes: {
    id: { type: 'string', columnName: '_id' },
    fecha: { type: 'string', required: true },
    accion: {
      type: 'string',
      required: true,
      isIn: ['POST', 'PUT', 'DELETE', 'GET']
    },
    descripcion: { type: 'string', required: true },
    origen: { type: 'string', required: true },
    autor: { type: 'string', required: true },
    elementId: { type: 'string' },
    success: { type: 'boolean', required: true },
  }
};
