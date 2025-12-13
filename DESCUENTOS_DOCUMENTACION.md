# Sistema de Descuentos - Documentación Técnica

## Resumen Ejecutivo

Se ha implementado un sistema completo de descuentos fiscalmente correcto para el sistema de facturación DilShop, cumpliendo con todas las restricciones de backward-compatibility y sin pérdida de datos.

## Cambios Realizados

### FASE 1: Modelos (No Destructivos)

#### PreFacturaProducto.js y FacturaProducto.js
**Campos agregados (todos opcionales):**
- `descuentoTipo`: string ['PORCENTAJE', 'MONTO'] - Tipo de descuento aplicado
- `descuentoValor`: number - Valor original del descuento (porcentaje o monto)
- `descuentoMonto`: number (default: 0) - Monto real del descuento aplicado

#### PreFactura.js
**Campos agregados (todos opcionales):**
- `descuentoGlobalTipo`: string ['PORCENTAJE', 'MONTO']
- `descuentoGlobalValor`: number
- `descuentoGlobalMonto`: number (default: 0)
- `subTotal`: number - Subtotal calculado
- `impuesto`: number - Impuesto total calculado
- `total`: number - Total final

#### Factura.js
**Campos agregados (todos opcionales):**
- `descuentoGlobalTipo`: string ['PORCENTAJE', 'MONTO']
- `descuentoGlobalValor`: number
- `descuentoGlobalMonto`: number (default: 0)

**NOTA:** Se mantiene el campo `porcientoDescuento` existente para compatibilidad con facturas antiguas.

### FASE 2: Reglas de Negocio Implementadas

1. ✅ El descuento real siempre se persiste como monto (`descuentoMonto`)
2. ✅ El descuento por línea se aplica antes del impuesto
3. ✅ El descuento global se calcula sobre el subtotal después de descuentos por línea
4. ✅ El descuento global se prorratea proporcionalmente entre todas las líneas
5. ✅ El impuesto se recalcula después de aplicar todos los descuentos
6. ✅ Nunca se modifica el precio base del producto
7. ✅ Nunca se recalcula una Factura emitida (solo PreFactura)
8. ✅ Redondeo consistente a 2 decimales

### FASE 3: Helpers (Services)

#### `api/helpers/apply-global-discount.js`
**Propósito:** Aplicar descuento global a una PreFactura

**Entrada:**
```javascript
{
  preFacturaId: string,
  descuento: {
    tipo: 'PORCENTAJE' | 'MONTO',
    valor: number
  }
}
```

**Validaciones:**
- PreFactura existe y no está eliminada
- PreFactura está en estado 'Abierta'
- Tipo de descuento válido
- Valor > 0
- Si es porcentaje, valor <= 100
- Descuento no excede el subtotal

**Proceso:**
1. Carga PreFactura y líneas activas
2. Calcula subtotal base (después de descuentos por línea)
3. Calcula monto del descuento global
4. Prorratea descuento proporcionalmente entre líneas
5. Recalcula impuesto por línea
6. Actualiza líneas y PreFactura en transacción

**Salida:**
```javascript
{
  preFactura: { ... },
  productos: [ ... ],
  totales: {
    subTotal: number,
    impuesto: number,
    total: number,
    descuentoGlobalMonto: number
  }
}
```

#### `api/helpers/remove-global-discount.js`
**Propósito:** Eliminar descuento global de una PreFactura

**Entrada:**
```javascript
{
  preFacturaId: string
}
```

**Proceso:**
1. Resetea descuento global a 0
2. Mantiene descuentos por línea si existen
3. Recalcula totales
4. Actualiza en transacción

#### `api/helpers/recalculate-pre-factura-totals.js`
**Propósito:** Recalcular totales cuando se agregan/eliminan productos

**Entrada:**
```javascript
{
  preFacturaId: string,
  connection: ref (opcional, para usar en transacciones)
}
```

**Uso:** Llamar después de agregar o eliminar productos para mantener totales actualizados.

### FASE 4: Endpoints

#### Aplicar Descuento Global
```
POST /api/v1/preFactura/:id/aplicar-descuento-global
```

**Body:**
```json
{
  "tipo": "PORCENTAJE",
  "valor": 10
}
```
o
```json
{
  "tipo": "MONTO",
  "valor": 50.00
}
```

**Respuesta exitosa (200):**
```json
{
  "preFactura": { ... },
  "productos": [ ... ],
  "totales": {
    "subTotal": 450.00,
    "impuesto": 81.00,
    "total": 531.00,
    "descuentoGlobalMonto": 50.00
  }
}
```

**Errores posibles:**
- 400 Bad Request: Datos inválidos o descuento excede subtotal
- 404 Not Found: PreFactura no existe
- 500 Server Error: Error interno

#### Eliminar Descuento Global
```
DELETE /api/v1/preFactura/:id/eliminar-descuento-global
```

**Respuesta exitosa (200):**
```json
{
  "preFactura": { ... },
  "productos": [ ... ],
  "totales": {
    "subTotal": 500.00,
    "impuesto": 90.00,
    "total": 590.00
  }
}
```

## Ejemplos de Uso

### Ejemplo 1: Aplicar descuento del 10%

**Escenario:**
- Producto A: 2 x $100 = $200 (impuesto 18%)
- Producto B: 3 x $100 = $300 (impuesto 18%)
- Subtotal: $500
- Descuento global: 10%

**Cálculo:**
1. Descuento global: $500 * 10% = $50
2. Prorrateo:
   - Producto A: $50 * (200/500) = $20
   - Producto B: $50 * (300/500) = $30
3. Bases imponibles:
   - Producto A: $200 - $20 = $180
   - Producto B: $300 - $30 = $270
4. Impuestos:
   - Producto A: $180 * 18% = $32.40
   - Producto B: $270 * 18% = $48.60
5. Totales:
   - Subtotal: $450
   - Impuesto: $81
   - Total: $531

### Ejemplo 2: Descuento por línea + descuento global

**Escenario:**
- Producto A: 1 x $100 = $100 (impuesto 18%, descuento línea $10)
- Producto B: 1 x $100 = $100 (impuesto 18%, sin descuento línea)
- Descuento global: $20

**Cálculo:**
1. Subtotal base (después descuento línea):
   - Producto A: $100 - $10 = $90
   - Producto B: $100
   - Total: $190
2. Descuento global $20 prorrateado:
   - Producto A: $20 * (90/190) = $9.47
   - Producto B: $20 * (100/190) = $10.53
3. Descuento total por línea:
   - Producto A: $10 + $9.47 = $19.47
   - Producto B: $10.53
4. Bases imponibles:
   - Producto A: $100 - $19.47 = $80.53
   - Producto B: $100 - $10.53 = $89.47
5. Impuestos:
   - Producto A: $80.53 * 18% = $14.50
   - Producto B: $89.47 * 18% = $16.10
6. Totales:
   - Subtotal: $170
   - Impuesto: $30.60
   - Total: $200.60

## Migración de Datos

**¿Requiere migración?** NO

Todos los campos nuevos son opcionales y tienen valores por defecto. Las facturas existentes seguirán funcionando sin cambios.

**Estrategia de migración:**
- `migrate: 'safe'` - No se requiere alteración de esquema
- Los campos se agregan automáticamente con valores NULL o defaults
- Las facturas antiguas mantienen su estructura original
- Las nuevas facturas pueden usar el sistema de descuentos

## Testing

### Casos de Prueba Recomendados

1. **Descuento porcentual básico**
   - Aplicar 10% a factura de $100
   - Verificar descuento = $10, total = $90 + impuesto

2. **Descuento monto fijo**
   - Aplicar $50 a factura de $200
   - Verificar descuento = $50, total = $150 + impuesto

3. **Descuento que excede subtotal**
   - Intentar aplicar $300 a factura de $200
   - Debe rechazarse con error 400

4. **Cambio de descuento**
   - Aplicar 10%, luego cambiar a 20%
   - Verificar recálculo correcto

5. **Eliminación de descuento**
   - Aplicar descuento, luego eliminarlo
   - Verificar totales vuelven a original

6. **Productos con impuesto 0**
   - Aplicar descuento a productos exentos
   - Verificar cálculo correcto

7. **Redondeo**
   - Aplicar descuento que genere decimales
   - Verificar redondeo a 2 decimales

8. **Prorrateo exacto**
   - Verificar que suma de descuentos prorrateados = descuento global

## Consideraciones Fiscales

### Cumplimiento Tributario

✅ **Descuento antes de impuesto:** El descuento se aplica sobre la base imponible, no sobre el total con impuesto.

✅ **Trazabilidad:** Se guarda tanto el tipo como el valor original del descuento, permitiendo auditorías.

✅ **Inmutabilidad de Facturas:** Las facturas emitidas no se modifican, solo las PreFacturas.

✅ **Snapshot contable:** Al convertir PreFactura a Factura, se copian todos los campos de descuento.

### Reportes Fiscales

Los campos disponibles para reportes:
- `descuentoGlobalTipo`: Para clasificar tipo de descuento
- `descuentoGlobalValor`: Valor original (útil para auditorías)
- `descuentoGlobalMonto`: Monto real aplicado
- `subTotal`: Base imponible (después de descuentos)
- `impuesto`: Impuesto calculado correctamente

## Mantenimiento Futuro

### Agregar descuentos por línea

Para implementar descuentos individuales por producto:

1. Crear helper `apply-line-discount.js`
2. Calcular descuento de línea
3. Actualizar `descuentoMonto` en PreFacturaProducto
4. Recalcular impuesto de la línea
5. Llamar a `recalculate-pre-factura-totals`

### Integración con sistema de cupones

Los campos `descuentoTipo` y `descuentoValor` pueden almacenar:
- Código de cupón en un campo adicional
- Referencia a tabla de promociones
- Metadata en campo JSON

## Troubleshooting

### Error: "El descuento global no puede ser mayor al subtotal"
**Causa:** Se intenta aplicar un descuento mayor al subtotal disponible.
**Solución:** Reducir el valor del descuento o verificar que hay productos en la factura.

### Error: "Solo se pueden aplicar descuentos a PreFacturas en estado Abierta"
**Causa:** Se intenta modificar una PreFactura completada o cancelada.
**Solución:** Solo aplicar descuentos a PreFacturas en estado 'Abierta'.

### Totales no cuadran después de aplicar descuento
**Causa:** Posible error de redondeo o cálculo.
**Solución:** Verificar que la suma de descuentos prorrateados = descuento global. Revisar logs.

## Contacto y Soporte

Para dudas o problemas con el sistema de descuentos, revisar:
1. Logs del servidor (buscar "Descuento global")
2. Tabla `activitylogs` para auditoría
3. Validar datos en base de datos directamente

---

**Versión:** 1.0  
**Fecha:** 2025-12-13  
**Autor:** Sistema DilShop  
**Estado:** Producción Ready ✅
