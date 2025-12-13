/**
 * recalculatePreFacturaTotals.js
 *
 * Helper para recalcular los totales de una PreFactura.
 * Se usa cuando se agregan o eliminan productos.
 */

module.exports = {
  friendlyName: 'Recalculate PreFactura totals',

  description: 'Recalcula subtotal, impuesto y total de una PreFactura basándose en sus productos',

  inputs: {
    preFacturaId: {
      type: 'string',
      required: true,
      description: 'ID de la PreFactura'
    },
    connection: {
      type: 'ref',
      required: false,
      description: 'Conexión de base de datos (para usar dentro de transacciones)'
    }
  },

  exits: {
    success: {
      description: 'Totales recalculados correctamente'
    }
  },

  fn: async function ({ preFacturaId, connection }) {
    const db = connection || sails.getDatastore();

    // Cargar PreFactura
    const preFactura = await PreFactura.findOne({
      id: preFacturaId,
      deleted: false
    }).usingConnection(db);

    if (!preFactura) {
      throw new Error('PreFactura no encontrada');
    }

    // Cargar líneas activas
    const lineas = await PreFacturaProducto.find({
      preFacturaId: preFacturaId,
      deleted: false
    }).usingConnection(db);

    const round = (num) => Math.round(num * 100) / 100;

    let subtotal = 0;
    let impuestoTotal = 0;

    // Calcular totales
    for (const linea of lineas) {
      const subtotalLinea = linea.precio * linea.cantidad;
      const descuentoLinea = linea.descuentoMonto || 0;
      const baseImponible = subtotalLinea - descuentoLinea;

      // El campo impuesto en la línea ya contiene el monto calculado
      const impuestoLinea = linea.impuesto || 0;

      subtotal += baseImponible;
      impuestoTotal += impuestoLinea;
    }

    subtotal = round(subtotal);
    impuestoTotal = round(impuestoTotal);
    const total = round(subtotal + impuestoTotal);

    // Actualizar PreFactura
    const preFacturaActualizada = await PreFactura.updateOne({ id: preFacturaId })
      .set({
        subTotal: subtotal,
        impuesto: impuestoTotal,
        total: total
      })
      .usingConnection(db);

    return {
      subTotal: subtotal,
      impuesto: impuestoTotal,
      total: total
    };
  }
};
