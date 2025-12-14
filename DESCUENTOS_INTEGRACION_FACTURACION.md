# Integración de Descuentos con Facturación

## 📋 Resumen

Se ha integrado completamente el sistema de descuentos con el proceso de facturación. Ahora cuando una PreFactura con descuentos se convierte en Factura, **todos los campos de descuento se copian automáticamente**, creando un snapshot contable completo e inmutable.

## 🔄 Flujo Completo

### 1. Crear PreFactura
```javascript
POST /api/v1/preFactura
Body: { registroCajaId: "..." }
```

### 2. Agregar Productos
```javascript
POST /api/v1/preFactura/agregarProducto
Body: {
  preFacturaId: "...",
  producto: { id: "...", cantidad: 2 }
}
```

### 3. Aplicar Descuento Global (Opcional)
```javascript
POST /api/v1/preFactura/:id/aplicar-descuento-global
Body: {
  tipo: "PORCENTAJE",
  valor: 10
}
```

**Resultado:**
- ✅ Descuento se prorratea entre productos
- ✅ Impuestos se recalculan
- ✅ Totales se actualizan en PreFactura
- ✅ Cada línea guarda: `descuentoTipo`, `descuentoValor`, `descuentoMonto`

### 4. Convertir a Factura
```javascript
POST /api/v1/factura/crearFacturaConProductos/:prefacturaId
Body: {
  registroCajaId: "...",
  tipoFactura: "consumidores-finales",
  pagos: [...],
  subTotal: 450.00,
  impuesto: 81.00,
  total: 531.00
}
```

**Proceso automático:**
1. ✅ Se carga la PreFactura
2. ✅ Se copian campos de descuento global a Factura:
   - `descuentoGlobalTipo`
   - `descuentoGlobalValor`
   - `descuentoGlobalMonto`
3. ✅ Se copian productos con sus descuentos:
   - `descuentoTipo`
   - `descuentoValor`
   - `descuentoMonto`
4. ✅ PreFactura cambia a estado "Completada"
5. ✅ Factura queda inmutable

## 📊 Estructura de Datos

### PreFactura (Editable)
```javascript
{
  id: "ABC123",
  estado: "Abierta",
  descuentoGlobalTipo: "PORCENTAJE",
  descuentoGlobalValor: 10,
  descuentoGlobalMonto: 50.00,
  subTotal: 450.00,
  impuesto: 81.00,
  total: 531.00
}
```

### PreFacturaProducto (Editable)
```javascript
{
  id: "PROD1",
  precio: 100.00,
  cantidad: 2,
  descuentoTipo: "PORCENTAJE",
  descuentoValor: 10,
  descuentoMonto: 20.00,  // Prorrateado
  impuesto: 32.40         // Recalculado
}
```

### Factura (Inmutable - Snapshot)
```javascript
{
  id: "FACT456",
  estado: "Completada",
  descuentoGlobalTipo: "PORCENTAJE",    // ← Copiado de PreFactura
  descuentoGlobalValor: 10,              // ← Copiado de PreFactura
  descuentoGlobalMonto: 50.00,           // ← Copiado de PreFactura
  subTotal: 450.00,
  impuesto: 81.00,
  total: 531.00
}
```

### FacturaProducto (Inmutable - Snapshot)
```javascript
{
  id: "FPROD1",
  precio: 100.00,
  cantidad: 2,
  descuentoTipo: "PORCENTAJE",   // ← Copiado de PreFacturaProducto
  descuentoValor: 10,             // ← Copiado de PreFacturaProducto
  descuentoMonto: 20.00,          // ← Copiado de PreFacturaProducto
  impuesto: 32.40
}
```

## 🔍 Comportamiento de Descuentos

### Caso 1: Sin Descuento Previo
```javascript
// Estado inicial
Subtotal: $500
Descuento: ninguno

// Aplicar 10%
POST /aplicar-descuento-global
Body: { tipo: "PORCENTAJE", valor: 10 }

// Resultado
Subtotal: $500
Descuento: 10% = $50
Total: $450 + impuestos
```

### Caso 2: Cambiar Descuento
```javascript
// Estado actual
Subtotal: $500
Descuento: 10% = $50

// Cambiar a 20%
POST /aplicar-descuento-global
Body: { tipo: "PORCENTAJE", valor: 20 }

// Resultado
Subtotal: $500
Descuento: 20% = $100  // ← Reemplaza el 10%
Total: $400 + impuestos
```

**⚠️ IMPORTANTE:** El descuento anterior se **reemplaza**, no se acumula.

### Caso 3: Eliminar Descuento
```javascript
// Estado actual
Subtotal: $500
Descuento: 10% = $50

// Eliminar descuento
DELETE /eliminar-descuento-global

// Resultado
Subtotal: $500
Descuento: ninguno
Total: $500 + impuestos
```

## 🔐 Garantías del Sistema

### ✅ Integridad Contable
- Factura es un **snapshot inmutable** de la PreFactura
- Todos los campos de descuento se copian
- No se puede modificar una Factura emitida
- Trazabilidad completa para auditorías

### ✅ Cálculos Correctos
- Descuento se aplica antes del impuesto
- Prorrateo proporcional entre líneas
- Redondeo consistente a 2 decimales
- Suma de descuentos = descuento global exacto

### ✅ Backward Compatibility
- Facturas antiguas sin descuentos siguen funcionando
- Campo `porcientoDescuento` se mantiene para compatibilidad
- Nuevos campos son opcionales

## 📝 Ejemplo Completo

### Paso 1: Crear PreFactura y Agregar Productos
```bash
# Crear PreFactura
curl -X POST "http://localhost:1337/api/v1/preFactura" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"registroCajaId": "CAJA123"}'

# Respuesta: { id: "PRE001", ... }

# Agregar Producto A (2 x $100)
curl -X POST "http://localhost:1337/api/v1/preFactura/agregarProducto" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preFacturaId": "PRE001",
    "producto": {"id": "PROD_A", "cantidad": 2}
  }'

# Agregar Producto B (3 x $100)
curl -X POST "http://localhost:1337/api/v1/preFactura/agregarProducto" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preFacturaId": "PRE001",
    "producto": {"id": "PROD_B", "cantidad": 3}
  }'

# Estado actual:
# Producto A: 2 x $100 = $200
# Producto B: 3 x $100 = $300
# Subtotal: $500
```

### Paso 2: Aplicar Descuento Global del 10%
```bash
curl -X POST "http://localhost:1337/api/v1/preFactura/PRE001/aplicar-descuento-global" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tipo": "PORCENTAJE", "valor": 10}'

# Resultado:
# Descuento global: $50
# Prorrateo:
#   Producto A: $50 × (200/500) = $20
#   Producto B: $50 × (300/500) = $30
# Bases imponibles:
#   Producto A: $200 - $20 = $180
#   Producto B: $300 - $30 = $270
# Impuestos (18%):
#   Producto A: $180 × 18% = $32.40
#   Producto B: $270 × 18% = $48.60
# Totales:
#   Subtotal: $450
#   Impuesto: $81.00
#   Total: $531.00
```

### Paso 3: Convertir a Factura
```bash
curl -X POST "http://localhost:1337/api/v1/factura/crearFacturaConProductos/PRE001" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registroCajaId": "CAJA123",
    "tipoFactura": "consumidores-finales",
    "pagos": [{"metodoPago": "efectivo", "recibido": 600}],
    "subTotal": 450.00,
    "impuesto": 81.00,
    "total": 531.00
  }'

# Resultado:
# ✅ Factura creada con ID: FACT001
# ✅ Campos de descuento copiados:
#    - descuentoGlobalTipo: "PORCENTAJE"
#    - descuentoGlobalValor: 10
#    - descuentoGlobalMonto: 50.00
# ✅ Productos copiados con descuentos:
#    - Producto A: descuentoMonto = 20.00
#    - Producto B: descuentoMonto = 30.00
# ✅ PreFactura cambia a estado "Completada"
# ✅ Factura es inmutable
```

## 🐛 Troubleshooting

### Problema: Descuentos no aparecen en Factura
**Causa:** Los campos no se están copiando correctamente.
**Solución:** Verificar que la versión del código incluye las modificaciones en `crearFacturaConProductos`.

### Problema: Totales no cuadran
**Causa:** Posible error en el cálculo o prorrateo.
**Solución:** 
1. Verificar que el descuento se aplicó correctamente en PreFactura
2. Revisar que los totales en el body del POST coinciden con los de PreFactura
3. Consultar logs del servidor

### Problema: No se puede aplicar descuento después de facturar
**Causa:** La PreFactura está en estado "Completada".
**Solución:** Los descuentos solo se pueden aplicar a PreFacturas en estado "Abierta". Crear una nueva PreFactura si se necesita.

## 📊 Reportes y Consultas

### Consultar Facturas con Descuento
```sql
SELECT 
  f.id,
  f.fecha,
  f.total,
  f.descuentoGlobalTipo,
  f.descuentoGlobalValor,
  f.descuentoGlobalMonto
FROM factura f
WHERE f.descuentoGlobalMonto > 0
  AND f.deleted = false
ORDER BY f.fecha DESC;
```

### Consultar Productos con Descuento en Factura
```sql
SELECT 
  fp.id,
  fp.nombre,
  fp.precio,
  fp.cantidad,
  fp.descuentoTipo,
  fp.descuentoMonto,
  fp.impuesto
FROM facturaproducto fp
WHERE fp.facturaId = 'FACT001'
  AND fp.deleted = false;
```

## ✅ Checklist de Validación

- [ ] PreFactura permite aplicar descuento global
- [ ] Descuento se prorratea correctamente
- [ ] Impuestos se recalculan correctamente
- [ ] Totales cuadran en PreFactura
- [ ] Factura copia campos de descuento global
- [ ] FacturaProducto copia campos de descuento por línea
- [ ] PreFactura cambia a "Completada"
- [ ] Factura es inmutable
- [ ] Reportes muestran descuentos correctamente
- [ ] Auditoría tiene trazabilidad completa

---

**Versión:** 1.0  
**Fecha:** 2025-12-13  
**Estado:** ✅ Producción Ready
