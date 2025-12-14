# Agregar Producto con Recálculo Automático de Descuentos

## 📋 Descripción

El endpoint `agregarProducto` ahora **recalcula automáticamente** los descuentos y totales cuando se agrega un producto a una PreFactura que ya tiene un descuento global aplicado.

---

## 🔄 Flujo Automático

```
1. Usuario agrega producto a PreFactura
   ↓
2. Sistema detecta si hay descuento global
   ↓
3. SI HAY DESCUENTO:
   ├─> Recalcula subtotal base (con nuevo producto)
   ├─> Recalcula descuento global
   ├─> Prorratea descuento entre TODOS los productos
   ├─> Recalcula impuestos DESPUÉS del descuento
   └─> Actualiza totales de PreFactura
   ↓
4. Retorna producto agregado + totales actualizados
```

---

## 🎯 Endpoint

```
POST /api/v1/preFactura/agregarProducto
```

---

## 📥 Request

### Body
```javascript
{
  "preFacturaId": "string",
  "producto": {
    "id": "string",
    "cantidad": number
  }
}
```

---

## 📤 Response

### Sin Descuento Global

```javascript
{
  "message": "Producto agregado exitosamente",
  "producto": {
    "id": "PROD001",
    "codigo": "P001",
    "productoId": "PROD_A",
    "cantidad": 2,
    "nombre": "Producto A",
    "precio": 100.00,
    "costo": 50.00,
    "impuesto": 18.00,
    "deleted": 0,
    "subtotal": 200.00,
    "itbis": 36.00,
    "totalSinImpuesto": 164.00
  }
}
```

### Con Descuento Global (Recálculo Automático)

```javascript
{
  "message": "Producto agregado exitosamente",
  "producto": {
    "id": "PROD003",
    "codigo": "P003",
    "productoId": "PROD_C",
    "cantidad": 1,
    "nombre": "Producto C",
    "precio": 50.00,
    "costo": 25.00,
    "impuesto": 18.00,
    "deleted": 0,
    "subtotal": 50.00,
    "itbis": 9.00,
    "totalSinImpuesto": 41.00
  },
  // ✅ TOTALES RECALCULADOS AUTOMÁTICAMENTE
  "preFacturaActualizada": {
    "subTotal": 495.00,      // Actualizado
    "impuesto": 89.10,       // Recalculado
    "total": 584.10,         // Actualizado
    "descuentoGlobalMonto": 55.00  // Recalculado
  }
}
```

---

## 📝 Ejemplo Completo

### Escenario

**PreFactura inicial:**
- Producto A: 2 x $100 = $200
- Producto B: 3 x $100 = $300
- Subtotal: $500
- Descuento global: 10% = $50
- Subtotal con descuento: $450
- Impuesto (18%): $81
- Total: $531

**Acción:** Agregar Producto C (1 x $50)

---

### Request

```bash
POST /api/v1/preFactura/agregarProducto
Authorization: Bearer <token>
Content-Type: application/json

{
  "preFacturaId": "PRE001",
  "producto": {
    "id": "PROD_C",
    "cantidad": 1
  }
}
```

---

### Proceso Interno (Automático)

```javascript
// 1. Agregar producto
await PreFacturaProducto.create({
  precio: 50.00,
  cantidad: 1,
  impuesto: 18.00  // Tasa original
});

// 2. Detectar descuento global
const tieneDescuento = preFactura.descuentoGlobalMonto > 0;  // true

// 3. Recalcular subtotal base
const subtotalBase = 200 + 300 + 50 = 550;

// 4. Recalcular descuento global (10%)
const descuentoGlobal = 550 * 0.10 = 55.00;

// 5. Prorratear descuento
Producto A: 55 * (200/550) = 20.00
Producto B: 55 * (300/550) = 30.00
Producto C: 55 * (50/550) = 5.00

// 6. Calcular bases imponibles
Producto A: 200 - 20 = 180
Producto B: 300 - 30 = 270
Producto C: 50 - 5 = 45

// 7. Recalcular impuestos (DESPUÉS del descuento)
Producto A: 180 * 18% = 32.40
Producto B: 270 * 18% = 48.60
Producto C: 45 * 18% = 8.10

// 8. Totales finales
Subtotal: 180 + 270 + 45 = 495.00
Impuesto: 32.40 + 48.60 + 8.10 = 89.10
Total: 495.00 + 89.10 = 584.10
```

---

### Response

```json
{
  "message": "Producto agregado exitosamente",
  "producto": {
    "id": "PROD003",
    "codigo": "C001",
    "productoId": "PROD_C",
    "cantidad": 1,
    "nombre": "Producto C",
    "precio": 50.00,
    "costo": 25.00,
    "impuesto": 18.00,
    "deleted": 0,
    "subtotal": 50.00,
    "itbis": 9.00,
    "totalSinImpuesto": 41.00
  },
  "preFacturaActualizada": {
    "subTotal": 495.00,
    "impuesto": 89.10,
    "total": 584.10,
    "descuentoGlobalMonto": 55.00
  }
}
```

---

## 🔍 Detalles Técnicos

### Cálculo de Descuento

```javascript
// Si es PORCENTAJE
descuentoGlobal = subtotalBase * (valor / 100);

// Si es MONTO
descuentoGlobal = valor;
```

### Prorrateo Proporcional

```javascript
for (const producto of productos) {
  const subtotalProducto = producto.precio * producto.cantidad;
  const proporcion = subtotalProducto / subtotalBase;
  const descuentoProducto = descuentoGlobal * proporcion;
  
  // Guardar en producto
  producto.descuentoMonto = descuentoProducto;
}
```

### Cálculo de Impuesto

```javascript
// IMPORTANTE: Impuesto DESPUÉS del descuento
const baseImponible = subtotalProducto - descuentoProducto;
const impuesto = (baseImponible * tasaImpuesto) / 100;

// NO calcular impuesto antes del descuento ❌
// const impuesto = (subtotalProducto * tasaImpuesto) / 100;
```

---

## ✅ Garantías

### 1. **Precisión Matemática**
- ✅ Descuento siempre se aplica antes del impuesto
- ✅ Prorrateo proporcional exacto
- ✅ Redondeo consistente a 2 decimales
- ✅ Ajuste en último producto para compensar redondeo

### 2. **Consistencia**
- ✅ Todos los productos tienen el mismo `descuentoTipo` y `descuentoValor`
- ✅ Suma de descuentos por producto = descuento global
- ✅ Totales siempre cuadran

### 3. **Transaccionalidad**
- ✅ Todo se ejecuta en una transacción
- ✅ Si algo falla, nada se guarda
- ✅ Estado consistente garantizado

---

## 🎯 Casos de Uso

### Caso 1: Agregar a PreFactura SIN Descuento

```javascript
// Request
POST /agregarProducto
{
  "preFacturaId": "PRE001",
  "producto": { "id": "PROD_A", "cantidad": 2 }
}

// Response
{
  "message": "Producto agregado exitosamente",
  "producto": { ... }
  // NO hay preFacturaActualizada
}
```

### Caso 2: Agregar a PreFactura CON Descuento

```javascript
// Request
POST /agregarProducto
{
  "preFacturaId": "PRE002",  // Tiene descuento 10%
  "producto": { "id": "PROD_B", "cantidad": 1 }
}

// Response
{
  "message": "Producto agregado exitosamente",
  "producto": { ... },
  // ✅ Incluye totales recalculados
  "preFacturaActualizada": {
    "subTotal": 495.00,
    "impuesto": 89.10,
    "total": 584.10,
    "descuentoGlobalMonto": 55.00
  }
}
```

---

## 💡 Recomendaciones para el Frontend

### 1. Detectar Recálculo

```javascript
const response = await agregarProducto(preFacturaId, producto);

if (response.preFacturaActualizada) {
  // Hubo recálculo de descuentos
  console.log('Totales actualizados:', response.preFacturaActualizada);
  
  // Actualizar UI con nuevos totales
  updateTotales(response.preFacturaActualizada);
}
```

### 2. Mostrar Notificación

```javascript
if (response.preFacturaActualizada) {
  showNotification(
    'Producto agregado. Descuentos recalculados automáticamente.',
    'info'
  );
}
```

### 3. Actualizar Lista de Productos

```javascript
// Después de agregar, recargar la PreFactura completa
const preFacturaActualizada = await obtenerPorIdConDetalle(preFacturaId);

// Ahora todos los productos tienen descuentos actualizados
preFacturaActualizada.productos.forEach(p => {
  console.log(`${p.nombre}: Descuento $${p.descuentoMonto}`);
});
```

---

## 🐛 Troubleshooting

### Problema: Totales no cuadran después de agregar producto

**Causa:** Posible error en el prorrateo o redondeo.

**Solución:**
1. Verificar que `descuentoGlobalMonto` sea correcto
2. Sumar `descuentoMonto` de todos los productos
3. Debe ser igual a `descuentoGlobalMonto`

### Problema: Impuestos incorrectos

**Causa:** Impuesto calculado antes del descuento.

**Solución:**
- Verificar que el código calcula: `(baseImponible * tasa) / 100`
- NO: `(subtotal * tasa) / 100`

---

## 📊 Comparación: Antes vs Ahora

### ❌ Antes

```javascript
// Agregar producto
await PreFacturaProducto.create(producto);

// ❌ Descuentos NO se recalculaban
// ❌ Totales quedaban desactualizados
// ❌ Usuario tenía que reaplicar descuento manualmente
```

### ✅ Ahora

```javascript
// Agregar producto
await PreFacturaProducto.create(producto);

// ✅ Detecta descuento global automáticamente
// ✅ Recalcula y prorratea descuentos
// ✅ Actualiza impuestos correctamente
// ✅ Actualiza totales de PreFactura
// ✅ Todo en una transacción
```

---

**Versión:** 1.0  
**Fecha:** 2025-12-13  
**Estado:** ✅ Implementado con recálculo automático
