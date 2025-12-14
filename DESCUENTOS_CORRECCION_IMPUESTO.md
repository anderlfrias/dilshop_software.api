# Corrección Crítica: Campo Impuesto en PreFacturaProducto

## ⚠️ Problema Identificado

El campo `impuesto` en `PreFacturaProducto` almacena la **TASA de impuesto** (porcentaje) que proviene de la relación con `tipoImpuesto`, **NO el monto calculado del impuesto**.

### ❌ Error Anterior

```javascript
// INCORRECTO: Sobrescribía la tasa con el monto calculado
await PreFacturaProducto.updateOne({ id: prod.id })
  .set({
    descuentoMonto: 20.00,
    impuesto: 32.40  // ❌ Esto es un MONTO, no una TASA
  });

// Resultado: Se perdía la tasa original (18%)
// En la siguiente operación, el cálculo sería incorrecto
```

### ✅ Corrección Aplicada

```javascript
// CORRECTO: NO se modifica el campo impuesto
await PreFacturaProducto.updateOne({ id: prod.id })
  .set({
    descuentoMonto: 20.00
    // impuesto: NO SE MODIFICA, mantiene la tasa original (18%)
  });

// El campo impuesto siempre mantiene la tasa del tipoImpuesto
```

---

## 🔍 Estructura de Datos Correcta

### PreFacturaProducto

```javascript
{
  id: "PROD001",
  precio: 100.00,
  cantidad: 2,
  costo: 50.00,
  impuesto: 18.00,  // ← TASA (porcentaje), NO monto
  descuentoMonto: 20.00,
  // ... otros campos
}
```

### Cálculo del Impuesto (en tiempo real)

```javascript
// Subtotal
const subtotal = precio * cantidad;  // 100 * 2 = 200

// Descuento
const descuento = descuentoMonto;  // 20

// Base imponible
const baseImponible = subtotal - descuento;  // 200 - 20 = 180

// Impuesto (usando la TASA)
const tasaImpuesto = producto.impuesto;  // 18 (porcentaje)
const montoImpuesto = (baseImponible * tasaImpuesto) / 100;  // 180 * 18% = 32.40
```

---

## 📊 Flujo Correcto

```
┌─────────────────────────────────────────────────────────┐
│           CAMPO IMPUESTO: TASA vs MONTO                 │
└─────────────────────────────────────────────────────────┘

Producto.idTipoImpuesto
  ├─> TipoImpuesto.porcentaje = 18%
  │
  ▼
PreFacturaProducto.impuesto = 18  ← TASA (se guarda al crear)
  │
  │ (NUNCA SE MODIFICA)
  │
  ▼
Cálculo en tiempo real:
  ├─> baseImponible = (precio * cantidad) - descuento
  ├─> montoImpuesto = (baseImponible * 18) / 100
  └─> Este monto se usa para totales, pero NO se guarda
```

---

## ✅ Archivos Corregidos

### 1. `api/helpers/apply-global-discount.js`

**Antes:**
```javascript
await PreFacturaProducto.updateOne({ id: linea.id })
  .set({
    descuentoMonto: round(descuentoProd),
    impuesto: round(impuestoLinea)  // ❌ Sobrescribía la tasa
  });
```

**Ahora:**
```javascript
await PreFacturaProducto.updateOne({ id: linea.id })
  .set({
    descuentoMonto: round(descuentoProd)
    // impuesto: NO SE MODIFICA ✅
  });
```

---

### 2. `api/helpers/remove-global-discount.js`

**Antes:**
```javascript
await PreFacturaProducto.updateOne({ id: linea.id })
  .set({
    descuentoMonto: 0,
    impuesto: round(impuestoLinea),  // ❌ Sobrescribía la tasa
    descuentoTipo: null
  });
```

**Ahora:**
```javascript
await PreFacturaProducto.updateOne({ id: linea.id })
  .set({
    descuentoMonto: 0,
    descuentoTipo: null
    // impuesto: NO SE MODIFICA ✅
  });
```

---

### 3. `api/controllers/PreFacturaController.js` (agregarProducto)

**Antes:**
```javascript
await PreFacturaProducto.updateOne({ id: prod.id })
  .set({
    descuentoMonto: round(descuentoProd),
    impuesto: round(impuestoProd)  // ❌ Sobrescribía la tasa
  });
```

**Ahora:**
```javascript
await PreFacturaProducto.updateOne({ id: prod.id })
  .set({
    descuentoMonto: round(descuentoProd)
    // impuesto: NO SE MODIFICA ✅
  });
```

---

## 🎯 Validación de Productos sin Impuesto

### Manejo Correcto de Productos Exentos

```javascript
// Producto sin impuesto (exento)
const tasaImpuesto = producto.impuesto || 0;  // 0

// Validar antes de calcular
const montoImpuesto = tasaImpuesto > 0 
  ? (baseImponible * tasaImpuesto) / 100 
  : 0;

// Si tasa = 0, monto = 0 ✅
```

---

## 📝 Ejemplo Completo

### Escenario

**Producto con impuesto:**
- Precio: $100
- Cantidad: 2
- Tasa impuesto: 18% (viene de tipoImpuesto)
- Descuento global: 10%

### Datos en Base de Datos

```javascript
// PreFacturaProducto (guardado en DB)
{
  precio: 100.00,
  cantidad: 2,
  impuesto: 18.00,  // ← TASA (porcentaje)
  descuentoMonto: 20.00
}
```

### Cálculos en Tiempo Real

```javascript
// Al mostrar en UI o generar factura
const subtotal = 100 * 2 = 200;
const descuento = 20;
const baseImponible = 200 - 20 = 180;
const tasaImpuesto = 18;  // ← Leído de DB
const montoImpuesto = (180 * 18) / 100 = 32.40;  // ← Calculado

// Respuesta al frontend
{
  subtotal: 200.00,
  descuento: 20.00,
  baseImponible: 180.00,
  tasaImpuesto: 18.00,  // ← Para mostrar "18%"
  montoImpuesto: 32.40,  // ← Para mostrar "$32.40"
  total: 212.40
}
```

---

## 🔄 Impacto en Otros Endpoints

### `obtenerPorIdConDetalle`

**Correcto:** El endpoint ya calcula el impuesto en tiempo real en la consulta SQL:

```sql
SELECT
  pfp.impuesto,  -- Tasa (18)
  (pfp.cantidad * pfp.precio) - ((pfp.cantidad * pfp.precio) / (pfp.impuesto / 100 + 1)) AS itbis
```

✅ No requiere cambios

---

### `crearFacturaConProductos`

**Correcto:** Copia la tasa original:

```javascript
{
  impuesto: producto.impuesto,  // Copia la TASA, no el monto
  descuentoMonto: producto.descuentoMonto
}
```

✅ No requiere cambios

---

## ⚠️ Importante para el Frontend

### Cálculo de Totales en UI

```javascript
// CORRECTO: Calcular impuesto en tiempo real
function calcularImpuesto(producto) {
  const subtotal = producto.precio * producto.cantidad;
  const baseImponible = subtotal - (producto.descuentoMonto || 0);
  const tasaImpuesto = producto.impuesto || 0;
  
  return tasaImpuesto > 0 
    ? (baseImponible * tasaImpuesto) / 100 
    : 0;
}

// INCORRECTO: Asumir que producto.impuesto es el monto
// const montoImpuesto = producto.impuesto;  // ❌ NUNCA HACER ESTO
```

---

## ✅ Beneficios de la Corrección

### 1. **Integridad de Datos**
- ✅ La tasa de impuesto siempre refleja el tipoImpuesto original
- ✅ No se pierde información al aplicar/eliminar descuentos
- ✅ Auditoría correcta de tasas de impuesto

### 2. **Cálculos Correctos**
- ✅ Impuesto siempre se calcula sobre base imponible actual
- ✅ Cambios en descuentos no afectan la tasa
- ✅ Productos exentos (tasa 0) se manejan correctamente

### 3. **Flexibilidad**
- ✅ Se pueden aplicar/eliminar descuentos múltiples veces
- ✅ La tasa original siempre está disponible
- ✅ Fácil recalcular totales en cualquier momento

---

## 🐛 Troubleshooting

### Problema: Impuestos incorrectos después de aplicar descuento

**Causa:** Campo impuesto fue sobrescrito con un monto.

**Solución:**
1. Verificar que `producto.impuesto` sea un porcentaje (ej: 18, no 32.40)
2. Si es un monto, restaurar desde `Producto.idTipoImpuesto.porcentaje`
3. Reaplicar descuento

### Problema: Productos sin impuesto muestran error

**Causa:** División por cero o cálculo sin validar.

**Solución:**
```javascript
const tasaImpuesto = producto.impuesto || 0;
const monto = tasaImpuesto > 0 ? (base * tasaImpuesto) / 100 : 0;
```

---

## 📋 Checklist de Validación

- [x] Campo `impuesto` mantiene la tasa original
- [x] Descuentos NO modifican el campo `impuesto`
- [x] Productos sin impuesto (tasa 0) se manejan correctamente
- [x] Cálculos usan la tasa, no un monto guardado
- [x] Totales cuadran correctamente
- [x] Auditoría preserva tasas originales

---

**Versión:** 1.0  
**Fecha:** 2025-12-13  
**Estado:** ✅ Corregido y Validado
