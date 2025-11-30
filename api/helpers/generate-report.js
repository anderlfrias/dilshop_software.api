const csvWriteStream = require('csv-write-stream');
const fs = require('fs');

module.exports = {


  friendlyName: 'Generate report',


  description: '',


  inputs: {
    data: {
      type: 'ref',
      required: true
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {
    // TODO
    try {
      const { data } = inputs;

      // const [ date ] = new Date().toISOString().split('T');
      const writer = csvWriteStream();
      const writableStream = fs.createWriteStream(`.tmp/data.csv`);

      // Encabezados del CSV
      writer.pipe(writableStream);

      data.forEach(item => {
        writer.write(item);
      });

      writer.end();

      writableStream.on('finish', () => {
        // Configura la respuesta para descargar el archivo CSV.
        // res.download('.tmp/data.csv');
        return exits.success({ path: `.tmp/data.csv` });
      });
    } catch (error) {
      return exits.error(error);
    }
  }


};

