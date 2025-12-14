# Endpoints de Descuento para PreFactura

## 📋 Descripción

Dos endpoints simples para manejar descuentos en PreFactura:
1. **Agregar descuento**: Establece un monto de descuento
2. **Eliminar descuento**: Pone el campo descuento en `null`

Ambos endpoints solo funcionan si la PreFactura está en estado **Abierta** o **Pendiente**.

---

## 🔗 Endpoints

### 1. Agregar Descuento

```
PUT /api/v1/preFactura/:id/descuento
```

#### Request

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "descuento": 50.00
}
```

#### Response Exitosa (200 OK)

```json
{
  "message": "Descuento agregado exitosamente",
  "preFactura": {
    "id": "PRE001",
    "fecha": "2025-12-13T22:00:00.000Z",
    "clienteId": "CLI001",
    "estado": "Abierta",
    "descuento": 50.00,
    "registroCajaId": "CAJA001",
    "deleted": false
  }
}
```

#### Errores Posibles

**400 Bad Request - Descuento no enviado:**
```json
{
  "err": "El monto de descuento es requerido"
}
```

**400 Bad Request - Descuento inválido:**
```json
{
  "err": "El descuento debe ser un número mayor o igual a 0"
}
```

**400 Bad Request - Descuento excede el total:**
```json
{
  "err": "El descuento no puede ser mayor al total de la PreFactura",
  "descuento": 600.00,
  "totalPreFactura": 500.00
}
```

**400 Bad Request - Sin productos:**
```json
{
  "err": "La PreFactura no tiene productos"
}
```

**400 Bad Request - Estado incorrecto:**
```json
{
  "err": "Solo se puede agregar descuento a PreFacturas en estado Abierta o Pendiente",
  "estado": "Completada"
}
```

**404 Not Found:**
```json
{
  "err": "La PreFactura no existe"
}
```

---

### 2. Eliminar Descuento

```
DELETE /api/v1/preFactura/:id/descuento
```

#### Request

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Body:** No requiere body

#### Response Exitosa (200 OK)

```json
{
  "message": "Descuento eliminado exitosamente",
  "preFactura": {
    "id": "PRE001",
    "fecha": "2025-12-13T22:00:00.000Z",
    "clienteId": "CLI001",
    "estado": "Abierta",
    "descuento": null,
    "registroCajaId": "CAJA001",
    "deleted": false
  }
}
```

#### Errores Posibles

**400 Bad Request - Estado incorrecto:**
```json
{
  "err": "Solo se puede eliminar descuento de PreFacturas en estado Abierta o Pendiente",
  "estado": "Completada"
}
```

**404 Not Found:**
```json
{
  "err": "La PreFactura no existe"
}
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Agregar Descuento de $50

```bash
curl -X PUT "http://localhost:1337/api/v1/preFactura/PRE001/descuento" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "descuento": 50.00
  }'
```

**Respuesta:**
```json
{
  "message": "Descuento agregado exitosamente",
  "preFactura": {
    "id": "PRE001",
    "descuento": 50.00,
    "estado": "Abierta"
  }
}
```

---

### Ejemplo 2: Cambiar Descuento (de $50 a $75)

```bash
curl -X PUT "http://localhost:1337/api/v1/preFactura/PRE001/descuento" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "descuento": 75.00
  }'
```

**Respuesta:**
```json
{
  "message": "Descuento agregado exitosamente",
  "preFactura": {
    "id": "PRE001",
    "descuento": 75.00,
    "estado": "Abierta"
  }
}
```

---

### Ejemplo 3: Eliminar Descuento

```bash
curl -X DELETE "http://localhost:1337/api/v1/preFactura/PRE001/descuento" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta:**
```json
{
  "message": "Descuento eliminado exitosamente",
  "preFactura": {
    "id": "PRE001",
    "descuento": null,
    "estado": "Abierta"
  }
}
```

---

### Ejemplo 4: Poner Descuento en 0

```bash
curl -X PUT "http://localhost:1337/api/v1/preFactura/PRE001/descuento" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "descuento": 0
  }'
```

**Respuesta:**
```json
{
  "message": "Descuento agregado exitosamente",
  "preFactura": {
    "id": "PRE001",
    "descuento": 0,
    "estado": "Abierta"
  }
}
```

---

## ✅ Validaciones

### Estados Permitidos
- ✅ **Abierta**: Se puede agregar/eliminar descuento
- ✅ **Pendiente**: Se puede agregar/eliminar descuento
- ❌ **Completada**: NO se puede modificar
- ❌ **Cancelada**: NO se puede modificar

### Validaciones de Descuento
- ✅ Debe ser un número
- ✅ Debe ser mayor o igual a 0
- ✅ **No puede ser mayor al total de la PreFactura**
- ✅ Puede ser 0 (sin descuento)
- ❌ No puede ser negativo
- ❌ No puede ser null al agregar (usar DELETE para eliminar)
- ❌ PreFactura debe tener productos

### Cálculo del Total
El total se calcula como:
```javascript
total = Σ (precio × cantidad) de todos los productos
```

---

## 🔄 Flujo de Uso

```
1. Crear PreFactura
   └─> Estado: "Abierta"

2. Agregar productos
   └─> PreFactura con productos

3. Agregar descuento (opcional)
   └─> PUT /preFactura/:id/descuento
       Body: { descuento: 50.00 }

4. Modificar descuento (opcional)
   └─> PUT /preFactura/:id/descuento
       Body: { descuento: 75.00 }

5. Eliminar descuento (opcional)
   └─> DELETE /preFactura/:id/descuento

6. Completar PreFactura
   └─> Estado: "Completada"
   └─> Ya NO se puede modificar descuento
```

---

## 💡 Casos de Uso

### Caso 1: Descuento Fijo

```javascript
// Cliente tiene cupón de $50
await fetch('/api/v1/preFactura/PRE001/descuento', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ descuento: 50.00 })
});
```

### Caso 2: Sin Descuento

```javascript
// Cliente no tiene descuento
await fetch('/api/v1/preFactura/PRE001/descuento', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer TOKEN'
  }
});
```

### Caso 3: Cambiar Descuento

```javascript
// Cambiar de $50 a $100
await fetch('/api/v1/preFactura/PRE001/descuento', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ descuento: 100.00 })
});
```

---

## 🎯 Notas Importantes

### 1. Descuento vs null vs 0

- **`descuento: 50`**: Hay un descuento de $50
- **`descuento: 0`**: Sin descuento (equivalente a null)
- **`descuento: null`**: Sin descuento

### 2. Estados

Solo se puede modificar descuento en estados:
- `Abierta`
- `Pendiente`

Una vez `Completada` o `Cancelada`, no se puede modificar.

### 3. Logging

Todas las operaciones se registran en el log del sistema:
- Agregar descuento: `PUT` con monto
- Eliminar descuento: `DELETE`

---

## 🐛 Troubleshooting

### Error: "Solo se puede agregar descuento a PreFacturas en estado Abierta o Pendiente"

**Causa:** La PreFactura ya está Completada o Cancelada.

**Solución:** No se puede modificar. Crear una nueva PreFactura si es necesario.

---

### Error: "El descuento debe ser un número mayor o igual a 0"

**Causa:** Se envió un valor negativo o no numérico.

**Solución:** Enviar un número válido >= 0.

```javascript
// ❌ Incorrecto
{ descuento: -50 }
{ descuento: "cincuenta" }

// ✅ Correcto
{ descuento: 50 }
{ descuento: 0 }
```

---

### Error: "El descuento no puede ser mayor al total de la PreFactura"

**Causa:** El descuento ingresado es mayor que la suma de todos los productos.

**Solución:** Verificar el total de la PreFactura y ajustar el descuento.

**Ejemplo:**
```javascript
// PreFactura con productos:
// - Producto A: 2 × $100 = $200
// - Producto B: 1 × $150 = $150
// Total: $350

// ❌ Incorrecto - Descuento mayor al total
{ descuento: 400 }  // Error: 400 > 350

// ✅ Correcto - Descuento menor o igual al total
{ descuento: 350 }  // OK: Descuento del 100%
{ descuento: 175 }  // OK: Descuento del 50%
{ descuento: 50 }   // OK: Descuento fijo
```

**Respuesta de error:**
```json
{
  "err": "El descuento no puede ser mayor al total de la PreFactura",
  "descuento": 400.00,
  "totalPreFactura": 350.00
}
```

---

**Versión:** 1.0  
**Fecha:** 2025-12-13  
**Estado:** ✅ Implementado

