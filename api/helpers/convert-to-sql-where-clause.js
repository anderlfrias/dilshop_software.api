module.exports = {


  friendlyName: 'Convert to sql where clause',


  description: '',


  inputs: {
    obj: {
      type: 'ref',
      required: true
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs) {
    // TODO
    const obj = inputs.obj;
    let sqlConditions = [];
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        for (const subKey in obj[key]) {
          if (Object.hasOwnProperty.call(obj[key], subKey)) {
            const element = obj[key][subKey];
            sqlConditions = [...sqlConditions, `${key} ${subKey} ${typeof element === 'string' ? `'${element}'` : element}`];
          }
        }
        continue;
      }

      sqlConditions = [...sqlConditions, `${key} = ${typeof obj[key] === 'string' ? `'${obj[key]}'` : obj[key]}`];
    }

    const sqlWhereClause = sqlConditions.length > 0 ? `WHERE ${sqlConditions.join(' AND ')}` : '';
    return sqlWhereClause;
  }


};

