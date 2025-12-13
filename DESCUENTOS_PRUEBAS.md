# Guía de Pruebas del Sistema de Descuentos

## Configuración Inicial

Antes de ejecutar las pruebas, asegúrate de tener:
- Servidor Sails.js corriendo
- Base de datos configurada
- Token de autenticación válido
- Al menos una caja registradora abierta

## Variables de Entorno para Pruebas

```bash
export API_URL="http://localhost:1337"
export AUTH_TOKEN="tu-token-aqui"
```

## Prueba 1: Crear PreFactura con Productos

### Paso 1.1: Crear PreFactura
```bash
curl -X POST "$API_URL/api/v1/preFactura" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registroCajaId": "ID_CAJA_REGISTRADORA"
  }'
```

**Resultado esperado:** PreFactura creada con ID único

### Paso 1.2: Agregar Productos
```bash
curl -X POST "$API_URL/api/v1/preFactura/agregarProducto" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preFacturaId": "ID_PREFACTURA",
    "producto": {
      "id": "ID_PRODUCTO",
      "cantidad": 2
    }
  }'
```

**Resultado esperado:** Producto agregado con precio, costo e impuesto calculados

## Prueba 2: Aplicar Descuento Global Porcentual

```bash
curl -X POST "$API_URL/api/v1/preFactura/ID_PREFACTURA/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PORCENTAJE",
    "valor": 10
  }'
```

**Validaciones:**
- ✅ `descuentoGlobalTipo` = "PORCENTAJE"
- ✅ `descuentoGlobalValor` = 10
- ✅ `descuentoGlobalMonto` = subtotal * 0.10
- ✅ `total` = (subtotal - descuento) + impuesto
- ✅ Suma de `descuentoMonto` en líneas = `descuentoGlobalMonto`

## Prueba 3: Aplicar Descuento Global Monto Fijo

```bash
curl -X POST "$API_URL/api/v1/preFactura/ID_PREFACTURA/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "MONTO",
    "valor": 50.00
  }'
```

**Validaciones:**
- ✅ `descuentoGlobalTipo` = "MONTO"
- ✅ `descuentoGlobalValor` = 50.00
- ✅ `descuentoGlobalMonto` = 50.00
- ✅ Descuento prorrateado correctamente entre líneas

## Prueba 4: Cambiar Descuento Global

### Paso 4.1: Aplicar primer descuento (10%)
```bash
curl -X POST "$API_URL/api/v1/preFactura/ID_PREFACTURA/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PORCENTAJE",
    "valor": 10
  }'
```

### Paso 4.2: Cambiar a 20%
```bash
curl -X POST "$API_URL/api/v1/preFactura/ID_PREFACTURA/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PORCENTAJE",
    "valor": 20
  }'
```

**Validaciones:**
- ✅ Descuento anterior se reemplaza completamente
- ✅ Totales recalculados con nuevo descuento
- ✅ No hay acumulación de descuentos

## Prueba 5: Eliminar Descuento Global

```bash
curl -X DELETE "$API_URL/api/v1/preFactura/ID_PREFACTURA/eliminar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Validaciones:**
- ✅ `descuentoGlobalTipo` = null
- ✅ `descuentoGlobalValor` = null
- ✅ `descuentoGlobalMonto` = 0
- ✅ Totales vuelven a valores originales
- ✅ Descuentos por línea se mantienen (si existían)

## Prueba 6: Validaciones de Entrada

### Prueba 6.1: Descuento mayor al subtotal
```bash
curl -X POST "$API_URL/api/v1/preFactura/ID_PREFACTURA/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "MONTO",
    "valor": 999999
  }'
```

**Resultado esperado:** Error 400 - "El descuento global no puede ser mayor al subtotal"

### Prueba 6.2: Porcentaje mayor a 100
```bash
curl -X POST "$API_URL/api/v1/preFactura/ID_PREFACTURA/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PORCENTAJE",
    "valor": 150
  }'
```

**Resultado esperado:** Error 400 - "El porcentaje de descuento no puede ser mayor a 100"

### Prueba 6.3: Tipo inválido
```bash
curl -X POST "$API_URL/api/v1/preFactura/ID_PREFACTURA/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "INVALIDO",
    "valor": 10
  }'
```

**Resultado esperado:** Error 400 - "El tipo de descuento debe ser PORCENTAJE o MONTO"

### Prueba 6.4: Valor negativo
```bash
curl -X POST "$API_URL/api/v1/preFactura/ID_PREFACTURA/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PORCENTAJE",
    "valor": -10
  }'
```

**Resultado esperado:** Error 400 - "El valor del descuento no puede ser negativo"

## Prueba 7: Estados de PreFactura

### Prueba 7.1: Aplicar descuento a PreFactura Completada
```bash
# Primero completar la PreFactura
curl -X POST "$API_URL/api/v1/factura/crearFacturaConProductos/ID_PREFACTURA" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registroCajaId": "ID_CAJA",
    "tipoFactura": "consumidores-finales",
    "pagos": [{"metodoPago": "efectivo", "recibido": 100}]
  }'

# Intentar aplicar descuento
curl -X POST "$API_URL/api/v1/preFactura/ID_PREFACTURA/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PORCENTAJE",
    "valor": 10
  }'
```

**Resultado esperado:** Error 400 - "Solo se pueden aplicar descuentos a PreFacturas en estado Abierta"

## Prueba 8: Verificación de Prorrateo

### Escenario:
- Producto A: 2 x $100 = $200
- Producto B: 3 x $100 = $300
- Subtotal: $500
- Descuento global: $50

### Cálculo esperado:
- Descuento Producto A: $50 * (200/500) = $20.00
- Descuento Producto B: $50 * (300/500) = $30.00
- Total descuentos: $20.00 + $30.00 = $50.00 ✅

### Verificación:
```bash
curl -X GET "$API_URL/api/v1/preFactura/obtenerPorIdConDetalle/ID_PREFACTURA" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Validar en respuesta:**
```javascript
// Producto A
productos[0].descuentoMonto === 20.00

// Producto B
productos[1].descuentoMonto === 30.00

// Suma
productos[0].descuentoMonto + productos[1].descuentoMonto === 50.00
```

## Prueba 9: Redondeo Correcto

### Escenario con decimales:
- Producto A: 1 x $33.33 = $33.33
- Producto B: 1 x $66.67 = $66.67
- Subtotal: $100.00
- Descuento global: 15%

### Cálculo esperado:
- Descuento global: $100 * 15% = $15.00
- Descuento Producto A: $15.00 * (33.33/100) = $5.00 (redondeado)
- Descuento Producto B: $15.00 * (66.67/100) = $10.00 (redondeado)
- **Ajuste en última línea para compensar redondeo**

### Verificación:
```bash
curl -X POST "$API_URL/api/v1/preFactura/ID_PREFACTURA/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PORCENTAJE",
    "valor": 15
  }'
```

**Validar:**
- ✅ Todos los montos tienen máximo 2 decimales
- ✅ Suma de descuentos prorrateados = descuento global exacto

## Prueba 10: Integración con Facturación

### Paso 10.1: Crear PreFactura con descuento
```bash
# Crear PreFactura
PREFACTURA_ID=$(curl -X POST "$API_URL/api/v1/preFactura" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"registroCajaId": "ID_CAJA"}' | jq -r '.id')

# Agregar producto
curl -X POST "$API_URL/api/v1/preFactura/agregarProducto" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"preFacturaId\": \"$PREFACTURA_ID\",
    \"producto\": {\"id\": \"ID_PRODUCTO\", \"cantidad\": 2}
  }"

# Aplicar descuento
curl -X POST "$API_URL/api/v1/preFactura/$PREFACTURA_ID/aplicar-descuento-global" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tipo": "PORCENTAJE", "valor": 10}'
```

### Paso 10.2: Convertir a Factura
```bash
curl -X POST "$API_URL/api/v1/factura/crearFacturaConProductos/$PREFACTURA_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registroCajaId": "ID_CAJA",
    "tipoFactura": "consumidores-finales",
    "pagos": [{"metodoPago": "efectivo", "recibido": 200}],
    "subTotal": SUBTOTAL_CALCULADO,
    "impuesto": IMPUESTO_CALCULADO,
    "total": TOTAL_CALCULADO
  }'
```

**Validaciones:**
- ✅ Factura creada con totales correctos
- ✅ FacturaProducto tiene campos de descuento copiados
- ✅ PreFactura cambia a estado "Completada"
- ✅ Factura es inmutable (no se puede modificar)

## Checklist de Validación Completa

- [ ] Descuento porcentual se aplica correctamente
- [ ] Descuento monto fijo se aplica correctamente
- [ ] Descuento se puede cambiar
- [ ] Descuento se puede eliminar
- [ ] Validación de descuento > subtotal funciona
- [ ] Validación de porcentaje > 100 funciona
- [ ] Validación de valor negativo funciona
- [ ] Validación de tipo inválido funciona
- [ ] Solo PreFacturas "Abierta" permiten descuentos
- [ ] Prorrateo es proporcional y exacto
- [ ] Redondeo a 2 decimales es consistente
- [ ] Impuestos se recalculan correctamente
- [ ] Totales cuadran (subtotal - descuento + impuesto = total)
- [ ] Logs se generan correctamente
- [ ] Transacciones son atómicas (todo o nada)
- [ ] Facturas antiguas siguen funcionando
- [ ] Integración con facturación funciona

## Notas Importantes

1. **Transacciones:** Todos los cambios son atómicos. Si algo falla, nada se guarda.

2. **Logs:** Cada operación genera un log en `activitylogs` para auditoría.

3. **Backward Compatibility:** Las facturas antiguas sin descuentos siguen funcionando normalmente.

4. **Performance:** El cálculo es eficiente incluso con muchas líneas de productos.

5. **Precisión:** Se usa redondeo a 2 decimales con ajuste en última línea para evitar diferencias.

---

**Última actualización:** 2025-12-13
