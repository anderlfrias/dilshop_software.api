/**
 * removeGlobalDiscount.js
 *
 * Service para eliminar el descuento global de una PreFactura y recalcular totales.
 */

module.exports = {
  friendlyName: 'Remove global discount',

  description: 'Elimina el descuento global de una PreFactura y recalcula todos los totales',

  inputs: {
    preFacturaId: {
      type: 'string',
      required: true,
      description: 'ID de la PreFactura'
    }
  },

  exits: {
    success: {
      description: 'Descuento eliminado correctamente'
    },
    notFound: {
      description: 'PreFactura no encontrada'
    },
    invalidState: {
      description: 'PreFactura no está en estado válido'
    }
  },

  fn: async function ({ preFacturaId }) {
    let preFacturaActualizada;

    await sails.getDatastore().transaction(async (db) => {
      const preFactura = await PreFactura.findOne({
        id: preFacturaId,
        deleted: false
      }).usingConnection(db);

      if (!preFactura) {
        throw { notFound: { message: 'PreFactura no encontrada' } };
      }

      if (preFactura.estado !== 'Abierta') {
        throw { invalidState: { message: 'Solo se pueden modificar PreFacturas en estado Abierta' } };
      }

      // Cargar líneas
      const lineas = await PreFacturaProducto.find({
        preFacturaId: preFacturaId,
        deleted: false
      }).usingConnection(db);

      // Recalcular sin descuento global
      let subtotalFinal = 0;
      let impuestoTotal = 0;

      const round = (num) => Math.round(num * 100) / 100;

      for (const linea of lineas) {
        // Subtotal de línea
        const subtotalLinea = linea.precio * linea.cantidad;

        // Descuento por línea (mantener si existe)
        const descuentoLineaExistente = linea.descuentoMonto || 0;

        // Base imponible (solo con descuento de línea, sin descuento global)
        const baseImponible = subtotalLinea - descuentoLineaExistente;

        // Recalcular impuesto sobre precio original del producto
        const tasaImpuesto = linea.impuesto; // Guardar tasa original
        const impuestoLinea = (baseImponible * tasaImpuesto) / 100;

        subtotalFinal += baseImponible;
        impuestoTotal += impuestoLinea;

        // Actualizar línea (resetear descuento global, mantener descuento de línea)
        await PreFacturaProducto.updateOne({ id: linea.id })
          .set({
            descuentoMonto: 0, // Solo descuento de línea
            impuesto: round(impuestoLinea),
            descuentoTipo: null,
            descuentoValor: null
          })
          .usingConnection(db);
      }

      subtotalFinal = round(subtotalFinal);
      impuestoTotal = round(impuestoTotal);
      const totalFinal = round(subtotalFinal + impuestoTotal);

      // Actualizar PreFactura (eliminar descuento global)
      preFacturaActualizada = await PreFactura.updateOne({ id: preFacturaId })
        .set({
          descuentoGlobalTipo: null,
          descuentoGlobalValor: null,
          descuentoGlobalMonto: 0,
          subTotal: subtotalFinal,
          impuesto: impuestoTotal,
          total: totalFinal
        })
        .usingConnection(db);

      // sails.log.info('Descuento global eliminado correctamente', {
      //   preFacturaId,
      //   subtotalFinal,
      //   impuestoTotal,
      //   totalFinal
      // });
    });

    const preFacturaCompleta = await PreFactura.findOne({ id: preFacturaId });
    const productos = await PreFacturaProducto.find({
      preFacturaId: preFacturaId,
      deleted: false
    });

    return {
      preFactura: preFacturaCompleta,
      productos,
      totales: {
        subTotal: preFacturaCompleta.subTotal,
        impuesto: preFacturaCompleta.impuesto,
        total: preFacturaCompleta.total
      }
    };
  }
};
