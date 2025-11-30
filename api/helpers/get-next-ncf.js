module.exports = {


  friendlyName: 'Get next ncf',


  description: '',


  inputs: {
    tipoComprobante: {
      type: 'string',
      required: true
    },
    db: {
      type: 'ref',
      required: true
    }
  },


  exits: {

    success: {
      outputFriendlyName: 'Next ncf',
    },

  },


  fn: async function (inputs) {

    let intentos = 0;
    const generateNextNcf = async (tipoComprobante, db) => {
      if (intentos >= 10) {
        return { success: false, ncf: null, message: 'Demasiados intentos al generar NCF. Posible conflicto o falta de NCFs.' };
      }
      const ncfEncontrado = await NCF.find({ deleted: false, estado: 'abierto', tipoComprobante }).limit(1).usingConnection(db);
      const ncf = ncfEncontrado[0];

      if (!ncf) {
        return { success: false, ncf: null, message: 'No hay Numero de Comprobantes Fiscales (NCF) disponibles para este tipo de factura' };
      }

      // Se aumenta la cantidad usada del NCF y se cambia el estado a cerrado si ya se usaron todos los NCFs
      const nuevoEstadoNCF = ncf.cantidadUsada + 1 >= ncf.cantidadAprobada ? 'cerrado' : 'abierto';
      const ncfActualizado = await NCF.updateOne({ id: ncf.id }).set({ cantidadUsada: ncf.cantidadUsada + 1, estado: nuevoEstadoNCF }).usingConnection(db);

      if (!ncfActualizado) {
        return { success: false, ncf: null, message: 'Ocurrió un error al actualizar el NCF' };
      }

      // Obtenemos el secuencial del NCF que son los últimos 8 dígitos
      const secuencialInicial = parseInt(ncf.secuencialInicial, 10);
      const secuencial = (secuencialInicial + ncf.cantidadUsada).toString().padStart(8, '0');
      const nuevoNCF = `${ncf.serie}${ncf.tipoComprobante}${secuencial}`;

      // Revise si el NCF generado ya existe en la base de datos
      const ncfExistente = await Factura.find({ ncf: nuevoNCF }).limit(1).usingConnection(db);
      if (ncfExistente.length > 0) {
        intentos++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return await generateNextNcf(tipoComprobante, db);
      }

      // return nuevoNCF;
      intentos=0;
      return { success: true, ncf: nuevoNCF, message: 'Ok.' };
    };

    return await generateNextNcf(inputs.tipoComprobante, inputs.db);
  }


};

