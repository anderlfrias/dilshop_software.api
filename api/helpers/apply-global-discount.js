/**
 * applyGlobalDiscount.js
 *
 * Service para aplicar descuento global a una PreFactura de forma fiscalmente correcta.
 * 
 * REGLAS DE NEGOCIO:
 * 1. El descuento por línea se aplica antes del impuesto
 * 2. El descuento global se calcula sobre el subtotal después de descuentos por línea
 * 3. El descuento global se prorratea proporcionalmente entre todas las líneas
 * 4. El impuesto se recalcula después de aplicar todos los descuentos
 * 5. Nunca se modifica el precio base del producto
 * 6. Todo se ejecuta en una transacción atómica
 */

module.exports = {
  friendlyName: 'Apply global discount',

  description: 'Aplica un descuento global a una PreFactura y recalcula todos los totales',

  inputs: {
    preFacturaId: {
      type: 'string',
      required: true,
      description: 'ID de la PreFactura a la que se aplicará el descuento'
    },
    descuento: {
      type: 'json',
      required: true,
      description: 'Objeto con tipo y valor del descuento: { tipo: "PORCENTAJE"|"MONTO", valor: number }'
    }
  },

  exits: {
    success: {
      description: 'Descuento aplicado correctamente'
    },
    notFound: {
      description: 'PreFactura no encontrada'
    },
    invalidState: {
      description: 'PreFactura no está en estado válido para aplicar descuentos'
    },
    invalidInput: {
      description: 'Datos de entrada inválidos'
    }
  },

  fn: async function ({ preFacturaId, descuento }) {
    // ============================================================
    // VALIDACIONES DE ENTRADA
    // ============================================================

    if (!descuento || !descuento.tipo || descuento.valor === undefined) {
      throw {
        invalidInput: {
          message: 'El descuento debe tener tipo y valor',
          details: { descuento }
        }
      };
    }

    if (!['PORCENTAJE', 'MONTO'].includes(descuento.tipo)) {
      throw {
        invalidInput: {
          message: 'El tipo de descuento debe ser PORCENTAJE o MONTO',
          details: { tipo: descuento.tipo }
        }
      };
    }

    if (descuento.valor < 0) {
      throw {
        invalidInput: {
          message: 'El valor del descuento no puede ser negativo',
          details: { valor: descuento.valor }
        }
      };
    }

    if (descuento.tipo === 'PORCENTAJE' && descuento.valor > 100) {
      throw {
        invalidInput: {
          message: 'El porcentaje de descuento no puede ser mayor a 100',
          details: { valor: descuento.valor }
        }
      };
    }

    // ============================================================
    // EJECUCIÓN EN TRANSACCIÓN
    // ============================================================

    let preFacturaActualizada;

    await sails.getDatastore().transaction(async (db) => {
      // Cargar PreFactura
      const preFactura = await PreFactura.findOne({
        id: preFacturaId,
        deleted: false
      }).usingConnection(db);

      if (!preFactura) {
        throw {
          notFound: {
            message: 'PreFactura no encontrada',
            details: { preFacturaId }
          }
        };
      }

      if (preFactura.estado !== 'Abierta') {
        throw {
          invalidState: {
            message: 'Solo se pueden aplicar descuentos a PreFacturas en estado Abierta',
            details: { estado: preFactura.estado }
          }
        };
      }

      // Cargar todas las líneas activas
      const lineas = await PreFacturaProducto.find({
        preFacturaId: preFacturaId,
        deleted: false
      }).usingConnection(db);

      if (!lineas || lineas.length === 0) {
        throw {
          invalidInput: {
            message: 'La PreFactura no tiene productos',
            details: { preFacturaId }
          }
        };
      }

      // ============================================================
      // CÁLCULO DE SUBTOTAL BASE
      // IMPORTANTE: Si ya existe un descuento global, lo ignoramos
      // y calculamos sobre el subtotal original (precio * cantidad)
      // ============================================================

      // Verificar si hay descuento global previo
      const tieneDescuentoGlobalPrevio = preFactura.descuentoGlobalMonto && preFactura.descuentoGlobalMonto > 0;

      let subtotalBase = 0;
      const lineasConCalculos = lineas.map(linea => {
        // Subtotal de la línea (precio * cantidad)
        const subtotalLinea = linea.precio * linea.cantidad;

        // Si ya hay un descuento global, el descuentoMonto incluye:
        // descuentoLínea + descuentoGlobalPrevio
        // Necesitamos separar solo el descuento de línea
        let descuentoLineaSolo = 0;

        if (tieneDescuentoGlobalPrevio) {
          // Si el descuentoTipo de la línea es igual al global previo,
          // significa que es descuento global prorrateado, no descuento de línea
          if (linea.descuentoTipo === preFactura.descuentoGlobalTipo) {
            // Es descuento global prorrateado, ignorarlo
            descuentoLineaSolo = 0;
          } else {
            // Es descuento de línea real
            descuentoLineaSolo = linea.descuentoMonto || 0;
          }
        } else {
          // No hay descuento global previo, usar descuento actual
          descuentoLineaSolo = linea.descuentoMonto || 0;
        }

        // Base imponible de la línea (después de descuento por línea, SIN descuento global)
        const baseImponibleLinea = subtotalLinea - descuentoLineaSolo;

        subtotalBase += baseImponibleLinea;

        return {
          ...linea,
          subtotalLinea,
          descuentoLineaSolo, // Solo descuento de línea, sin global
          baseImponibleLinea
        };
      });

      // ============================================================
      // CÁLCULO DEL DESCUENTO GLOBAL
      // ============================================================

      let descuentoGlobalMonto = 0;

      if (descuento.valor > 0) {
        if (descuento.tipo === 'PORCENTAJE') {
          descuentoGlobalMonto = (subtotalBase * descuento.valor) / 100;
        } else {
          descuentoGlobalMonto = descuento.valor;
        }

        // Validar que el descuento no exceda el subtotal
        if (descuentoGlobalMonto > subtotalBase) {
          throw {
            invalidInput: {
              message: 'El descuento global no puede ser mayor al subtotal',
              details: {
                descuentoGlobalMonto,
                subtotalBase
              }
            }
          };
        }
      }

      // ============================================================
      // PRORRATEO DEL DESCUENTO GLOBAL ENTRE LÍNEAS
      // ============================================================

      let subtotalFinal = 0;
      let impuestoTotal = 0;
      let descuentoGlobalAplicado = 0;

      const lineasActualizadas = lineasConCalculos.map((linea, index) => {
        // Calcular proporción de esta línea respecto al subtotal
        const proporcion = subtotalBase > 0
          ? linea.baseImponibleLinea / subtotalBase
          : 0;

        // Prorratear descuento global
        let descuentoGlobalLinea = descuentoGlobalMonto * proporcion;

        // En la última línea, ajustar por redondeo
        if (index === lineasConCalculos.length - 1) {
          descuentoGlobalLinea = descuentoGlobalMonto - descuentoGlobalAplicado;
        }

        // Base imponible final (después de ambos descuentos)
        const baseImponibleFinal = linea.baseImponibleLinea - descuentoGlobalLinea;

        // Calcular impuesto sobre la base imponible final
        // IMPORTANTE: linea.impuesto es la TASA (porcentaje), no el monto
        const tasaImpuesto = linea.impuesto || 0;
        const impuestoLinea = tasaImpuesto > 0 ? (baseImponibleFinal * tasaImpuesto) / 100 : 0;

        // Acumular totales
        subtotalFinal += baseImponibleFinal;
        impuestoTotal += impuestoLinea;
        descuentoGlobalAplicado += descuentoGlobalLinea;

        // Redondear a 2 decimales
        const round = (num) => Math.round(num * 100) / 100;

        return {
          id: linea.id,
          descuentoMonto: round(linea.descuentoLineaSolo + descuentoGlobalLinea)
          // NO retornamos impuesto porque no lo vamos a actualizar
        };
      });

      // Redondear totales finales
      const round = (num) => Math.round(num * 100) / 100;
      subtotalFinal = round(subtotalFinal);
      impuestoTotal = round(impuestoTotal);
      descuentoGlobalMonto = round(descuentoGlobalMonto);
      const totalFinal = round(subtotalFinal + impuestoTotal);

      // ============================================================
      // PERSISTIR CAMBIOS
      // ============================================================

      // Actualizar cada línea (solo descuento, NO impuesto)
      for (const lineaActualizada of lineasActualizadas) {
        await PreFacturaProducto.updateOne({ id: lineaActualizada.id })
          .set({
            descuentoTipo: descuento.tipo,
            descuentoValor: descuento.valor,
            descuentoMonto: lineaActualizada.descuentoMonto
            // impuesto: NO SE MODIFICA, mantiene la tasa original
          })
          .usingConnection(db);
      }

      // Actualizar PreFactura
      preFacturaActualizada = await PreFactura.updateOne({ id: preFacturaId })
        .set({
          descuentoGlobalTipo: descuento.tipo,
          descuentoGlobalValor: descuento.valor,
          descuentoGlobalMonto: descuentoGlobalMonto,
          subTotal: subtotalFinal,
          impuesto: impuestoTotal,
          total: totalFinal
        })
        .usingConnection(db);

      // sails.log.info('Descuento global aplicado correctamente', {
      //   preFacturaId,
      //   descuento,
      //   subtotalFinal,
      //   impuestoTotal,
      //   totalFinal
      // });
    });

    // Recargar con productos para retornar
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
        total: preFacturaCompleta.total,
        descuentoGlobalMonto: preFacturaCompleta.descuentoGlobalMonto
      }
    };
  }
};
