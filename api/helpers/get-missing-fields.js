module.exports = {
  friendlyName: 'Get missing fields',

  description: 'Verifica y devuelve los campos faltantes en un objeto',

  inputs: {
    fields: {
      type: 'ref',
      required: true,
      description: 'Un objeto con los campos a validar',
    },
  },

  exits: {
    success: {
      description: 'Campos faltantes devueltos correctamente',
    },
  },

  fn: async function (inputs) {
    const missing = Object.entries(inputs.fields)
      .filter(([_, value]) => value === undefined || value === null || value === '')
      .map(([key]) => key);

    return missing;
  },
};
