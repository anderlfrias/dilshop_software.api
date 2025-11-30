/**
 * LoggedUsers.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'activity',
  attributes: {
    id: { type: 'string', columnName: '_id' },
    userId: {
      type: 'string',
      required: true,
      unique: true,
    },
    isLoggedIn: {
      type: 'boolean',
      required: true,
    },
  },

};

