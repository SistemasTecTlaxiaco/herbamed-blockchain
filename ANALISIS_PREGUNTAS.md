# 📋 Análisis de Preguntas y Soluciones - HerbaMed DApp

**Fecha:** 10 de Diciembre, 2025

---

## ❓ PREGUNTA 1: ¿Qué significa el mensaje "Votos: {...}"?

**Respuesta:**
El mensaje que ves en la pantalla de Validadores es el **resultado bruto de la función `voteForPlant()`**. Es decir, está mostrando la estructura JSON completa de la respuesta:

```json
{
  "success": true,
  "plantId": "TEST-001",
  "transactionHash": "3105f498b48a1ab661e9effdf310c0df61"
}
```

**Causa:** En ValidatorDashboard.vue, después de votar, estamos asignando el resultado completo al contador de votos:

```javascript
// CÓDIGO ACTUAL (INCORRECTO):
const votes = await soroban.voteForPlant(plantId, validatorAddress)
plant.votes = votes  // ← Aquí se asigna el OBJETO completo
```

**Solución:** 
1. La función `voteForPlant()` debería retornar solo el número de votos
2. O debemos consultar `getPlantVotes(plantId)` después de votar

---

## ❓ PREGUNTA 2: ¿Por qué después de votar muestra 0 votos en "Validadores"?

**Respuesta:**
Hay 2 problemas combinados:

### Problema 1: Función `voteForPlant()` no retorna votos
El contrato retorna `i128` (número de votos), pero en frontend estamos retornando el objeto `submitOperation`:

```javascript
// client.js (línea 565)
const resp = await submitOperation({ ... })
return { success: true, plantId, transactionHash: resp?.hash || 'pending' }
// ← No estamos retornando el número de votos del contrato
```

### Problema 2: `getPlantVotes()` no está implementada
**Esta función NO EXISTE en frontend**. Necesitamos:
- Consultar al contrato para obtener votos
- Parsear la respuesta `i128` del contrato

### Problema 3: ValidatorDashboard no actualiza votos correctamente
```javascript
// ValidatorDashboard.vue (línea ~50)
plant.votes = votes  // Asigna el objeto en lugar del número
```

**Solución Completa:**
1. Implementar `getPlantVotes(plantId)` en client.js
2. Hacer que `voteForPlant()` retorne el número de votos
3. Actualizar ValidatorDashboard para consultar votos después de votar

---

## ❓ PREGUNTA 3: ¿Por qué no se refleja el listado de plantas en venta?

**Respuesta:**
Hay 3 problemas:

### Problema 1: `listForSale()` NO está implementada en frontend
**Esta función NO EXISTE en client.js**. El marketplace intenta llamarla pero no existe:

```javascript
// No existe en client.js:
export async function listForSale(plantId, price) { ... }
```

### Problema 2: `getListing()` / `getAllListings()` NO existen
No hay forma de **consultar** la lista de plantas en venta. Necesitamos:
- `getListing(plantId)` - obtener un listado específico
- `getAllListings()` - obtener todos los listados

### Problema 3: No hay persistencia de listados
El contrato almacena listados, pero no tenemos forma de consultarlos y mostrarlos en el marketplace.

**Solución Completa:**
1. Implementar `listForSale(plantId, seller, price)` en client.js
2. Implementar `getListing(plantId)` en client.js (query)
3. Implementar `getAllListings()` en client.js (listar todos)
4. Actualizar MarketPlace.vue para mostrar listados dinámicamente

---

## 🛠️ ARQUITECTURA DE SOLUCIÓN

### En el CONTRATO (Rust - lib.rs):
```
✅ register_plant()       - Ya existe
✅ vote_for_plant()       - Ya existe
✅ list_for_sale()        - Ya existe
✅ buy_listing()          - Ya existe
✅ get_plant()            - Ya existe
❌ get_plant_votes()      - FALTA AGREGAR
❌ get_all_plants()       - FALTA AGREGAR (opcional)
❌ get_listing()          - FALTA AGREGAR
❌ get_all_listings()     - FALTA AGREGAR (opcional)
```

### En el FRONTEND (client.js):
```
✅ registerPlant()        - Implementado
⚠️  voteForPlant()        - Necesita retornar votos, no objeto
❌ getPlantVotes()        - FALTA AGREGAR
✅ submitOperation()      - Implementado
❌ listForSale()          - FALTA AGREGAR
❌ getListing()           - FALTA AGREGAR
❌ getAllListings()       - FALTA AGREGAR
❌ buyListing()           - FALTA AGREGAR
```

---

## 📱 FLUJO DE VOTACIÓN (CORRECTO)

```
Usuario Click "Votar" en Validadores
    ↓
ValidatorDashboard.votePlant(plantId)
    ↓
soroban.voteForPlant(plantId)
    ├─ Construye transacción vote_for_plant
    ├─ Firma y envía a blockchain
    ├─ El contrato retorna: i128 (número de votos)
    └─ Frontend retorna: { success, plantId, transactionHash }
    
ValidatorDashboard recibe respuesta
    ↓
Consulta soroban.getPlantVotes(plantId)  ← NUEVA FUNCIÓN
    ├─ Construye transacción get_plant_votes
    ├─ Simula (read-only)
    └─ Retorna: i128 (número de votos)
    
ValidatorDashboard.plant.votes = votesCount  ← Ahora es un número
    ↓
UI actualiza: "Votos: 3" en lugar de "Votos: {object}"
```

---

## 💾 SOBRE LOCALSTORAGE

**Situación Actual:**
```
localStorage.herbamed_plant_ids      = ["001", "002", ...]
localStorage.herbamed_plant_001      = {...datos planta...}
localStorage.herbamed_plant_002      = {...datos planta...}
localStorage.soroban_auth            = {...auth data...}
```

**Propuesta:**
```
✅ Mantener: herbamed_plant_ids, herbamed_plant_*, soroban_auth (temporal)
❌ Limpiar: Datos innecesarios en localStorage
✅ Explicitar: localStorage es solo para datos transitivos/caché

Nota: Para producción, estos datos deberían venir del blockchain,
no del localStorage (que es vulnerable y temporal).
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Fase 1: Agregar Funciones al Contrato (Rust)
```rust
// En contracts/medicinal-plants/src/lib.rs

pub fn get_plant_votes(env: &Env, plant_id: String) -> i128 {
    env.storage().instance().get(&DataKey::PlantVotes(plant_id)).unwrap_or(0i128)
}

pub fn get_listing(env: &Env, plant_id: String) -> Option<Listing> {
    env.storage().instance().get(&DataKey::Listing(plant_id))
}
```

### Fase 2: Implementar Funciones en Frontend
```javascript
// En client.js

export async function getPlantVotes(plantId) { ... }
export async function listForSale(plantId, seller, price) { ... }
export async function getListing(plantId) { ... }
export async function getAllListings() { ... }
export async function buyListing(listingId, price) { ... }
```

### Fase 3: Actualizar Componentes
```vue
<!-- ValidatorDashboard.vue -->
Después de votar:
  const votes = await soroban.getPlantVotes(plantId)
  plant.votes = votes

<!-- MarketPlace.vue -->
Al cargar:
  const listings = await soroban.getAllListings()
```

---

## ✅ CHECKLIST DE FIXES

- [ ] Agregar `get_plant_votes()` al contrato Rust
- [ ] Agregar `get_listing()` al contrato Rust  
- [ ] Agregar `getPlantVotes()` a client.js
- [ ] Implementar `listForSale()` en client.js
- [ ] Implementar `getListing()` en client.js
- [ ] Implementar `getAllListings()` en client.js
- [ ] Implementar `buyListing()` en client.js
- [ ] Actualizar `voteForPlant()` para retornar votos
- [ ] Actualizar ValidatorDashboard.vue (actualizar votos después)
- [ ] Actualizar MarketPlace.vue (mostrar listados)
- [ ] Documentar en TRANSACCIONES_GUIA.md
- [ ] Commit y push

---

**Estado:** Listo para implementación  
**Prioridad:** Alta - Estas funciones son críticas para MVPfuncional  
**Complejidad:** Media - Requiere cambios en contrato + frontend

