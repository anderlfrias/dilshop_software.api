# Cálculo Automático de Totales en Facturación

## 📊 Resumen

El sistema ahora **calcula automáticamente** los totales de la Factura desde los productos de la PreFactura, garantizando que:
- ✅ Los descuentos se aplican correctamente
- ✅ Los impuestos se calculan **después** de los descuentos
- ✅ Los totales siempre cuadran
- ✅ No hay discrepancias entre PreFactura y Factura

## 🔢 Fórmulas de Cálculo

### Por Cada Producto

```javascript
// 1. Subtotal de línea (antes de descuento)
subtotalLinea = precio × cantidad

// 2. Descuento de línea (incluye descuento global prorrateado)
descuentoLinea = descuentoMonto

// 3. Base imponible (después de descuento)
baseImponible = subtotalLinea - descuentoLinea

// 4. Impuesto (YA calculado en la línea, después de descuento)
impuestoLinea = campo 'impuesto' del producto
```

### Totales de la Factura

```javascript
// 1. Subtotal (suma de bases imponibles)
subtotal = Σ baseImponible

// 2. Impuesto total (suma de impuestos por línea)
impuesto = Σ impuestoLinea

// 3. Total final
total = subtotal + impuesto + delivery
```

## 📝 Ejemplo Completo

### Datos de Entrada

**PreFactura con descuento global del 10%:**

| Producto | Precio | Cant | Subtotal | Desc. | Base Imp. | Imp. (18%) |
|----------|--------|------|----------|-------|-----------|------------|
| A        | $100   | 2    | $200     | $20   | $180      | $32.40     |
| B        | $100   | 3    | $300     | $30   | $270      | $48.60     |

**Delivery:** $10

### Cálculo Paso a Paso

```javascript
// Producto A
subtotalLinea_A = 100 × 2 = 200
descuentoLinea_A = 20  // Prorrateado del 10%
baseImponible_A = 200 - 20 = 180
impuestoLinea_A = 32.40  // Ya calculado en PreFacturaProducto

// Producto B
subtotalLinea_B = 100 × 3 = 300
descuentoLinea_B = 30  // Prorrateado del 10%
baseImponible_B = 300 - 30 = 270
impuestoLinea_B = 48.60  // Ya calculado en PreFacturaProducto

// Totales
subtotal = 180 + 270 = 450.00
impuesto = 32.40 + 48.60 = 81.00
total = 450.00 + 81.00 + 10.00 = 541.00
```

### Factura Resultante

```javascript
{
  id: "FACT001",
  subTotal: 450.00,      // ← Calculado automáticamente
  impuesto: 81.00,       // ← Calculado automáticamente
  delivery: 10.00,       // ← Del body
  total: 541.00,         // ← Calculado automáticamente
  descuentoGlobalTipo: "PORCENTAJE",
  descuentoGlobalValor: 10,
  descuentoGlobalMonto: 50.00
}
```

## 🔍 Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│              CÁLCULO DE TOTALES                          │
└─────────────────────────────────────────────────────────┘

PreFacturaProducto (con descuentos aplicados)
  ├─> precio: 100
  ├─> cantidad: 2
  ├─> descuentoMonto: 20  (ya prorrateado)
  └─> impuesto: 32.40     (ya calculado después de descuento)
      │
      ▼
Cálculo en crearFacturaConProductos()
  ├─> subtotalLinea = precio × cantidad = 200
  ├─> baseImponible = 200 - 20 = 180
  ├─> subtotalCalculado += 180
  └─> impuestoCalculado += 32.40
      │
      ▼
Factura (totales correctos)
  ├─> subTotal: 450.00
  ├─> impuesto: 81.00
  └─> total: 541.00
```

## ⚙️ Implementación Técnica

### Código en `crearFacturaConProductos`

```javascript
// 1. Cargar productos de PreFactura
const productosPreFactura = await PreFacturaProducto.find({ 
  preFacturaId: preFacturaId, 
  deleted: false 
});

// 2. Calcular totales
const round = (num) => Math.round(num * 100) / 100;

let subtotalCalculado = 0;
let impuestoCalculado = 0;

for (const producto of productosPreFactura) {
  // Subtotal de la línea
  const subtotalLinea = producto.precio * producto.cantidad;
  
  // Descuento (incluye global prorrateado)
  const descuentoLinea = producto.descuentoMonto || 0;
  
  // Base imponible
  const baseImponible = subtotalLinea - descuentoLinea;
  
  // Impuesto (ya calculado)
  const impuestoLinea = producto.impuesto || 0;
  
  subtotalCalculado += baseImponible;
  impuestoCalculado += impuestoLinea;
}

// 3. Redondear y calcular total
subtotalCalculado = round(subtotalCalculado);
impuestoCalculado = round(impuestoCalculado);
const totalCalculado = round(subtotalCalculado + impuestoCalculado + delivery);

// 4. Crear factura con totales calculados
const factura = {
  subTotal: subtotalCalculado,
  impuesto: impuestoCalculado,
  total: totalCalculado,
  // ... otros campos
};
```

## ✅ Ventajas del Cálculo Automático

### 1. **Garantía de Consistencia**
- Los totales siempre coinciden con los productos
- No hay discrepancias entre PreFactura y Factura
- Elimina errores humanos

### 2. **Descuentos Correctos**
- Los descuentos ya están aplicados en PreFacturaProducto
- Los impuestos ya están calculados después de descuentos
- Solo se suman los valores correctos

### 3. **Trazabilidad**
- Cada línea tiene su descuento y su impuesto
- Se puede auditar producto por producto
- Cumplimiento fiscal garantizado

### 4. **Simplicidad en el Frontend**
- El frontend no necesita calcular totales
- Solo envía datos básicos (pagos, delivery, etc.)
- Menos posibilidad de errores

## 📋 Campos del Body (Request)

### ✅ Campos Requeridos
```javascript
{
  registroCajaId: string,     // Requerido
  tipoFactura: string,        // Requerido
  pagos: array,               // Requerido
}
```

### ✅ Campos Opcionales
```javascript
{
  clienteId: string,          // Opcional
  mesaId: string,             // Opcional
  clienteRNC: json,           // Opcional
  delivery: number,           // Opcional (default: 0)
  isCredit: boolean,          // Opcional (default: false)
  porcientoDescuento: number  // Opcional (legacy, default: 0)
}
```

### ❌ Campos Ignorados (Calculados Automáticamente)
```javascript
{
  subTotal: number,   // ❌ Ignorado - Se calcula
  impuesto: number,   // ❌ Ignorado - Se calcula
  total: number       // ❌ Ignorado - Se calcula
}
```

## 🔄 Comparación: Antes vs Ahora

### ❌ Antes (Incorrecto)
```javascript
// Frontend calculaba y enviaba
POST /factura/crearFacturaConProductos/:id
{
  subTotal: 450.00,  // ← Podía estar mal
  impuesto: 81.00,   // ← Podía estar mal
  total: 531.00      // ← Podía estar mal
}

// Backend usaba valores del body sin validar
factura.subTotal = req.body.subTotal;  // ❌ Confiaba en frontend
```

### ✅ Ahora (Correcto)
```javascript
// Frontend solo envía datos básicos
POST /factura/crearFacturaConProductos/:id
{
  pagos: [...],
  delivery: 10.00
}

// Backend calcula desde PreFacturaProducto
const productos = await PreFacturaProducto.find(...);
for (const producto of productos) {
  subtotal += (producto.precio * producto.cantidad) - producto.descuentoMonto;
  impuesto += producto.impuesto;
}
factura.subTotal = subtotal;  // ✅ Calculado correctamente
```

## 🐛 Casos Especiales

### Caso 1: Sin Descuentos
```javascript
// Producto sin descuento
descuentoMonto = 0
baseImponible = precio × cantidad - 0
impuesto = baseImponible × (tasa/100)

// Funciona correctamente ✅
```

### Caso 2: Con Descuento Global
```javascript
// Producto con descuento global prorrateado
descuentoMonto = 20  // Ya incluye prorrateo
baseImponible = 200 - 20 = 180
impuesto = 32.40  // Ya calculado en apply-global-discount

// Funciona correctamente ✅
```

### Caso 3: Con Delivery
```javascript
// Delivery se suma al final
subtotal = 450.00
impuesto = 81.00
delivery = 10.00
total = 450.00 + 81.00 + 10.00 = 541.00

// Funciona correctamente ✅
```

### Caso 4: Productos con Impuesto 0
```javascript
// Producto exento
impuesto = 0
baseImponible = precio × cantidad - descuento
impuestoLinea = 0

// Funciona correctamente ✅
```

## 📊 Validación de Totales

### Fórmula de Verificación

```javascript
// Verificar que los totales cuadran
const verificacion = {
  subtotalEsperado: Σ(precio × cantidad - descuento),
  impuestoEsperado: Σ(impuesto_por_linea),
  totalEsperado: subtotal + impuesto + delivery
};

// Debe cumplir:
factura.subTotal === verificacion.subtotalEsperado  // ✅
factura.impuesto === verificacion.impuestoEsperado  // ✅
factura.total === verificacion.totalEsperado        // ✅
```

## 🎯 Resumen

### ✅ Lo que hace el sistema:
1. Carga productos de PreFactura
2. Suma bases imponibles (precio × cantidad - descuento)
3. Suma impuestos (ya calculados por línea)
4. Calcula total (subtotal + impuesto + delivery)
5. Crea Factura con totales correctos

### ✅ Garantías:
- Totales siempre correctos
- Descuentos aplicados correctamente
- Impuestos después de descuentos
- Redondeo consistente (2 decimales)
- Trazabilidad completa

---

**Versión:** 1.0  
**Fecha:** 2025-12-13  
**Estado:** ✅ Producción Ready
