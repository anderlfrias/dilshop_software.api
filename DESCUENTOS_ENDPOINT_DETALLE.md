# Endpoint: obtenerPorIdConDetalle - Documentación

## 📋 Descripción

El endpoint `obtenerPorIdConDetalle` ahora incluye **información completa de descuentos** tanto a nivel de PreFactura (descuento global) como a nivel de productos (descuento por línea).

---

## 🔗 Endpoint

```
GET /api/v1/preFactura/obtenerPorIdConDetalle/:id
```

---

## 📥 Request

### Headers
```javascript
{
  "Authorization": "Bearer <token>"
}
```

### Params
```javascript
{
  "id": "string" // ID de la PreFactura
}
```

---

## 📤 Response

### Estructura Completa

```javascript
{
  // Información básica de la PreFactura
  "id": "string",
  "fecha": "datetime",
  "clienteId": "string | null",
  "mesaId": "string | null",
  "estado": "string", // 'Abierta' | 'Completada' | 'Cancelada'
  "comentario": "string | null",
  "registroCajaId": "string",
  "deleted": boolean,
  
  // ============================================================
  // INFORMACIÓN DE DESCUENTO GLOBAL (NUEVO)
  // ============================================================
  "descuentoGlobalTipo": "PORCENTAJE" | "MONTO" | null,
  "descuentoGlobalValor": number | null,
  "descuentoGlobalMonto": number, // Monto real del descuento
  
  // ============================================================
  // TOTALES CALCULADOS (NUEVO)
  // ============================================================
  "subTotal": number | null,  // Subtotal después de descuentos
  "impuesto": number | null,  // Impuesto total
  "total": number | null,     // Total final
  
  // ============================================================
  // PRODUCTOS
  // ============================================================
  "productos": [
    {
      "id": "string",
      "codigo": "string",
      "productoId": "string",
      "cantidad": number,
      "nombre": "string",
      "precio": number,
      "costo": number,
      "impuesto": number,
      "deleted": boolean,
      
      // INFORMACIÓN DE DESCUENTO POR LÍNEA (NUEVO)
      "descuentoTipo": "PORCENTAJE" | "MONTO" | null,
      "descuentoValor": number | null,
      "descuentoMonto": number, // Monto real del descuento
      
      // CÁLCULOS
      "subtotal": number,
      "itbis": number,
      "totalSinImpuesto": number,
      "ganancia": number
    }
  ]
}
```

---

## 📝 Ejemplos

### Ejemplo 1: PreFactura SIN Descuento

**Request:**
```bash
GET /api/v1/preFactura/obtenerPorIdConDetalle/ABC123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "ABC123",
  "fecha": "2025-12-13T20:00:00.000Z",
  "clienteId": "CLI001",
  "mesaId": null,
  "estado": "Abierta",
  "comentario": null,
  "registroCajaId": "CAJA001",
  "deleted": false,
  
  "descuentoGlobalTipo": null,
  "descuentoGlobalValor": null,
  "descuentoGlobalMonto": 0,
  
  "subTotal": null,
  "impuesto": null,
  "total": null,
  
  "productos": [
    {
      "id": "PROD001",
      "codigo": "P001",
      "productoId": "PROD_A",
      "cantidad": 2,
      "nombre": "Producto A",
      "precio": 100.00,
      "costo": 50.00,
      "impuesto": 18.00,
      "deleted": false,
      
      "descuentoTipo": null,
      "descuentoValor": null,
      "descuentoMonto": 0,
      
      "subtotal": 200.00,
      "itbis": 30.51,
      "totalSinImpuesto": 169.49,
      "ganancia": 100.00
    }
  ]
}
```

---

### Ejemplo 2: PreFactura CON Descuento Global del 10%

**Request:**
```bash
GET /api/v1/preFactura/obtenerPorIdConDetalle/DEF456
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "DEF456",
  "fecha": "2025-12-13T20:30:00.000Z",
  "clienteId": "CLI002",
  "mesaId": "MESA05",
  "estado": "Abierta",
  "comentario": "Descuento especial",
  "registroCajaId": "CAJA001",
  "deleted": false,
  
  "descuentoGlobalTipo": "PORCENTAJE",
  "descuentoGlobalValor": 10,
  "descuentoGlobalMonto": 50.00,
  
  "subTotal": 450.00,
  "impuesto": 81.00,
  "total": 531.00,
  
  "productos": [
    {
      "id": "PROD002",
      "codigo": "P002",
      "productoId": "PROD_A",
      "cantidad": 2,
      "nombre": "Producto A",
      "precio": 100.00,
      "costo": 50.00,
      "impuesto": 32.40,
      "deleted": false,
      
      "descuentoTipo": "PORCENTAJE",
      "descuentoValor": 10,
      "descuentoMonto": 20.00,
      
      "subtotal": 200.00,
      "itbis": 30.51,
      "totalSinImpuesto": 169.49,
      "ganancia": 80.00
    },
    {
      "id": "PROD003",
      "codigo": "P003",
      "productoId": "PROD_B",
      "cantidad": 3,
      "nombre": "Producto B",
      "precio": 100.00,
      "costo": 60.00,
      "impuesto": 48.60,
      "deleted": false,
      
      "descuentoTipo": "PORCENTAJE",
      "descuentoValor": 10,
      "descuentoMonto": 30.00,
      
      "subtotal": 300.00,
      "itbis": 45.76,
      "totalSinImpuesto": 254.24,
      "ganancia": 90.00
    }
  ]
}
```

---

### Ejemplo 3: PreFactura CON Descuento Monto Fijo

**Request:**
```bash
GET /api/v1/preFactura/obtenerPorIdConDetalle/GHI789
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "GHI789",
  "fecha": "2025-12-13T21:00:00.000Z",
  "clienteId": null,
  "mesaId": null,
  "estado": "Abierta",
  "comentario": null,
  "registroCajaId": "CAJA002",
  "deleted": false,
  
  "descuentoGlobalTipo": "MONTO",
  "descuentoGlobalValor": 25.00,
  "descuentoGlobalMonto": 25.00,
  
  "subTotal": 175.00,
  "impuesto": 31.50,
  "total": 206.50,
  
  "productos": [
    {
      "id": "PROD004",
      "codigo": "P004",
      "productoId": "PROD_C",
      "cantidad": 1,
      "nombre": "Producto C",
      "precio": 200.00,
      "costo": 100.00,
      "impuesto": 31.50,
      "deleted": false,
      
      "descuentoTipo": "MONTO",
      "descuentoValor": 25.00,
      "descuentoMonto": 25.00,
      
      "subtotal": 200.00,
      "itbis": 30.51,
      "totalSinImpuesto": 169.49,
      "ganancia": 75.00
    }
  ]
}
```

---

## 🔍 Campos de Descuento Explicados

### A Nivel de PreFactura (Descuento Global)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `descuentoGlobalTipo` | string \| null | Tipo de descuento: "PORCENTAJE" o "MONTO" |
| `descuentoGlobalValor` | number \| null | Valor original del descuento (10 para 10%, o 50 para $50) |
| `descuentoGlobalMonto` | number | Monto real del descuento aplicado en dinero |

### A Nivel de Producto (Descuento por Línea)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `descuentoTipo` | string \| null | Tipo de descuento (puede ser diferente al global si hay descuento de línea) |
| `descuentoValor` | number \| null | Valor original del descuento |
| `descuentoMonto` | number | Monto del descuento prorrateado para esta línea |

### Totales Calculados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `subTotal` | number \| null | Subtotal después de aplicar descuentos |
| `impuesto` | number \| null | Impuesto total calculado después de descuentos |
| `total` | number \| null | Total final (subtotal + impuesto) |

---

## 💡 Casos de Uso

### 1. Mostrar Descuento en UI
```javascript
if (preFactura.descuentoGlobalTipo) {
  const descuentoTexto = preFactura.descuentoGlobalTipo === 'PORCENTAJE'
    ? `${preFactura.descuentoGlobalValor}%`
    : `$${preFactura.descuentoGlobalMonto.toFixed(2)}`;
  
  console.log(`Descuento aplicado: ${descuentoTexto}`);
}
```

### 2. Calcular Ahorro Total
```javascript
const ahorroTotal = preFactura.descuentoGlobalMonto || 0;
console.log(`Cliente ahorra: $${ahorroTotal.toFixed(2)}`);
```

### 3. Mostrar Descuento por Producto
```javascript
preFactura.productos.forEach(producto => {
  if (producto.descuentoMonto > 0) {
    console.log(`${producto.nombre}: -$${producto.descuentoMonto.toFixed(2)}`);
  }
});
```

### 4. Verificar si tiene Descuento
```javascript
const tieneDescuento = preFactura.descuentoGlobalMonto > 0;
if (tieneDescuento) {
  console.log('Esta factura tiene descuento aplicado');
}
```

---

## 🎯 Notas Importantes

### ⚠️ Valores NULL vs 0

- **`null`**: No se ha aplicado ningún descuento
- **`0`**: Se aplicó un descuento de $0 (o se eliminó)

### 🔄 Descuento Prorrateado

Cuando hay un descuento global:
- Cada producto tiene su `descuentoMonto` prorrateado proporcionalmente
- La suma de todos los `descuentoMonto` de productos = `descuentoGlobalMonto`

### 📊 Totales

Los campos `subTotal`, `impuesto` y `total` solo tienen valores cuando:
- Se ha aplicado un descuento global, O
- Se han calculado explícitamente

Si son `null`, significa que aún no se han calculado.

---

## ✅ Validaciones

El endpoint retorna error si:
- La PreFactura no existe: `400 Bad Request`
- Hay un error en la consulta: `500 Server Error`

---

## 🔐 Seguridad

- Requiere autenticación (token en header)
- Solo retorna PreFacturas no eliminadas
- Solo retorna productos no eliminados

---

**Versión:** 1.0  
**Fecha:** 2025-12-13  
**Estado:** ✅ Actualizado con información de descuentos
