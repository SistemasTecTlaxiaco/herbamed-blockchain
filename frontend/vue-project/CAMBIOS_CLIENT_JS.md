# 📋 Cambios Necesarios en client.js

**Estado:** Pendiente de aplicación manual  
**Razón:** `replace_string_in_file` deshabilitado

---

## 🎯 Objetivo
Eliminar TODAS las referencias a localStorage (excepto `soroban_auth`) y agregar links de Stellar Expert a todas las transacciones.

---

## 📦 Imports a Agregar (línea ~1-20)

```javascript
import { getTransactionUrl, getAccountUrl } from './stellar-expert.js'
import { queryPlant, queryPlantVotes, queryListing } from './queries.js'
```

---

## ❌ ELIMINAR FUNCIONES (líneas ~370-415)

**Borrar completamente estas funciones:**

```javascript
// ❌ ELIMINAR getRegisteredPlantIds() (líneas ~372-380)
function getRegisteredPlantIds() {
  const stored = localStorage.getItem('registeredPlantIds')
  return stored ? JSON.parse(stored) : []
}

// ❌ ELIMINAR addRegisteredPlantId() (líneas ~382-390)
function addRegisteredPlantId(id) {
  const ids = getRegisteredPlantIds()
  if (!ids.includes(id)) {
    ids.push(id)
    localStorage.setItem('registeredPlantIds', JSON.stringify(ids))
  }
}

// ❌ ELIMINAR savePlantToLocalCache() (líneas ~392-400)
function savePlantToLocalCache(plantObject) {
  const cacheKey = `plant_${plantObject.id}`
  localStorage.setItem(cacheKey, JSON.stringify(plantObject))
}

// ❌ ELIMINAR getPlantFromLocalCache() (líneas ~402-415)
function getPlantFromLocalCache(plantId) {
  const cacheKey = `plant_${plantId}`
  const cached = localStorage.getItem(cacheKey)
  return cached ? JSON.parse(cached) : null
}
```

---

## ✏️ MODIFICAR registerPlant() (líneas ~332-365)

**ANTES:**
```javascript
export async function registerPlant(plantData) {
  const { id, name, scientificName, properties } = plantData
  
  console.log('[client] Registrando planta:', { id, name, scientificName, properties })
  
  const operation = {
    method: 'register_plant',
    args: [
      nativeToScVal(id, { type: 'string' }),
      nativeToScVal(name, { type: 'string' }),
      nativeToScVal(scientificName, { type: 'string' }),
      nativeToScVal(properties, { type: ['string'] })
    ]
  }
  
  const resp = await submitOperation(operation)
  
  console.log('[client] Planta registrada exitosamente:', resp)
  
  // ❌ ELIMINAR ESTO:
  addRegisteredPlantId(id)
  
  const plantObject = {
    id,
    name,
    scientific_name: scientificName,
    properties,
    validated: false,
    votes: 0
  }
  
  // ❌ ELIMINAR ESTO:
  savePlantToLocalCache(plantObject)
  
  return {
    success: true,
    plantId: id,
    transactionHash: resp?.hash || resp?.id || 'pending'
  }
}
```

**DESPUÉS:**
```javascript
export async function registerPlant(plantData) {
  const { id, name, scientificName, properties } = plantData
  
  console.log('[client] Registrando planta:', { id, name, scientificName, properties })
  
  const operation = {
    method: 'register_plant',
    args: [
      nativeToScVal(id, { type: 'string' }),
      nativeToScVal(name, { type: 'string' }),
      nativeToScVal(scientificName, { type: 'string' }),
      nativeToScVal(properties, { type: ['string'] })
    ]
  }
  
  const resp = await submitOperation(operation)
  
  console.log('[client] Planta registrada exitosamente:', resp)
  
  const txHash = resp?.hash || resp?.id || 'pending'
  
  // ✅ AGREGAR sessionStorage temporal para current session
  const sessionPlants = JSON.parse(sessionStorage.getItem('currentSessionPlants') || '[]')
  if (!sessionPlants.includes(id)) {
    sessionPlants.push(id)
    sessionStorage.setItem('currentSessionPlants', JSON.stringify(sessionPlants))
  }
  
  return {
    success: true,
    plantId: id,
    transactionHash: txHash,
    explorerUrl: getTransactionUrl(txHash) // ✅ NUEVO
  }
}
```

---

## ✏️ MODIFICAR voteForPlant() (líneas ~550-565)

**ANTES:**
```javascript
export async function voteForPlant(plantId) {
  console.log('[client] Votando por planta:', plantId)
  
  const operation = {
    method: 'vote_for_plant',
    args: [
      nativeToScVal(plantId, { type: 'string' }),
      nativeToScVal(getPublicKey(), { type: 'address' })
    ]
  }
  
  const resp = await submitOperation(operation)
  
  console.log('[client] Voto registrado:', resp)
  
  return {
    success: true,
    transactionHash: resp?.hash || resp?.id || 'pending'
  }
}
```

**DESPUÉS:**
```javascript
export async function voteForPlant(plantId) {
  console.log('[client] Votando por planta:', plantId)
  
  const operation = {
    method: 'vote_for_plant',
    args: [
      nativeToScVal(plantId, { type: 'string' }),
      nativeToScVal(getPublicKey(), { type: 'address' })
    ]
  }
  
  const resp = await submitOperation(operation)
  
  console.log('[client] Voto registrado:', resp)
  
  const txHash = resp?.hash || resp?.id || 'pending'
  
  return {
    success: true,
    transactionHash: txHash,
    explorerUrl: getTransactionUrl(txHash) // ✅ NUEVO
  }
}
```

---

## ✏️ MODIFICAR listForSale() (líneas ~580-600)

**ANTES:**
```javascript
export async function listForSale(plantId, price) {
  console.log('[client] Listando planta para venta:', { plantId, price })
  
  const operation = {
    method: 'list_for_sale',
    args: [
      nativeToScVal(plantId, { type: 'string' }),
      nativeToScVal(getPublicKey(), { type: 'address' }),
      nativeToScVal(BigInt(price * 10000000), { type: 'i128' })
    ]
  }
  
  const resp = await submitOperation(operation)
  
  return {
    success: true,
    transactionHash: resp?.hash || 'pending'
  }
}
```

**DESPUÉS:**
```javascript
export async function listForSale(plantId, price) {
  console.log('[client] Listando planta para venta:', { plantId, price })
  
  const operation = {
    method: 'list_for_sale',
    args: [
      nativeToScVal(plantId, { type: 'string' }),
      nativeToScVal(getPublicKey(), { type: 'address' }),
      nativeToScVal(BigInt(price * 10000000), { type: 'i128' })
    ]
  }
  
  const resp = await submitOperation(operation)
  
  const txHash = resp?.hash || resp?.id || 'pending'
  
  return {
    success: true,
    transactionHash: txHash,
    seller: getPublicKey(), // ✅ NUEVO
    explorerUrl: getTransactionUrl(txHash) // ✅ NUEVO
  }
}
```

---

## ✏️ MODIFICAR buyListing() (líneas ~620-640)

**ANTES:**
```javascript
export async function buyListing(listingId) {
  console.log('[client] Comprando listing:', listingId)
  
  const operation = {
    method: 'buy_listing',
    args: [
      nativeToScVal(listingId, { type: 'string' }),
      nativeToScVal(getPublicKey(), { type: 'address' })
    ]
  }
  
  const resp = await submitOperation(operation)
  
  return {
    success: true,
    transactionHash: resp?.hash || 'pending'
  }
}
```

**DESPUÉS:**
```javascript
export async function buyListing(listingId) {
  console.log('[client] Comprando listing:', listingId)
  
  const operation = {
    method: 'buy_listing',
    args: [
      nativeToScVal(listingId, { type: 'string' }),
      nativeToScVal(getPublicKey(), { type: 'address' })
    ]
  }
  
  const resp = await submitOperation(operation)
  
  const txHash = resp?.hash || resp?.id || 'pending'
  
  return {
    success: true,
    transactionHash: txHash,
    explorerUrl: getTransactionUrl(txHash) // ✅ NUEVO
  }
}
```

---

## ✏️ REEMPLAZAR getPlantVotes() (líneas ~730-740)

**ANTES:**
```javascript
export async function getPlantVotes(plantId) {
  // TODO: Implementar query real al contrato
  console.log('[client] getPlantVotes stub:', plantId)
  return 0
}
```

**DESPUÉS:**
```javascript
export async function getPlantVotes(plantId) {
  console.log('[client] Obteniendo votos de planta:', plantId)
  return await queryPlantVotes(plantId)
}
```

---

## ✏️ REEMPLAZAR getListing() (líneas ~720-730)

**ANTES:**
```javascript
export async function getListing(plantId) {
  // TODO: Implementar query real al contrato
  console.log('[client] getListing stub:', plantId)
  return {
    plant_id: plantId,
    price: 0,
    available: false,
    seller: ''
  }
}
```

**DESPUÉS:**
```javascript
export async function getListing(plantId) {
  console.log('[client] Obteniendo listing:', plantId)
  return await queryListing(plantId)
}
```

---

## ✏️ MODIFICAR getAllPlants() (líneas ~410-450)

**ANTES:**
```javascript
export async function getAllPlants() {
  console.log('[client] Obteniendo todas las plantas registradas')
  
  const plantIds = getRegisteredPlantIds() // ❌ USA localStorage
  
  if (plantIds.length === 0) {
    console.log('[client] No hay plantas registradas en localStorage')
    return []
  }
  
  console.log('[client] IDs de plantas encontrados:', plantIds)
  
  const plants = []
  for (const id of plantIds) {
    const cached = getPlantFromLocalCache(id) // ❌ USA localStorage
    if (cached) {
      plants.push(cached)
    }
  }
  
  return plants
}
```

**DESPUÉS:**
```javascript
export async function getAllPlants() {
  console.log('[client] Obteniendo plantas de sesión actual')
  
  // ✅ USAR sessionStorage temporal
  const sessionPlants = JSON.parse(sessionStorage.getItem('currentSessionPlants') || '[]')
  
  if (sessionPlants.length === 0) {
    console.log('[client] No hay plantas en sesión actual')
    return []
  }
  
  console.log('[client] IDs de plantas en sesión:', sessionPlants)
  
  const plants = []
  for (const id of sessionPlants) {
    try {
      const plant = await queryPlant(id)
      if (plant) {
        const votes = await queryPlantVotes(id)
        plant.votes = votes
        plants.push(plant)
      }
    } catch (error) {
      console.warn(`[client] Error al cargar planta ${id}:`, error)
    }
  }
  
  return plants
}
```

---

## 📊 Resumen de Cambios

| Acción | Líneas | Función | Cambio |
|--------|--------|---------|--------|
| ➕ Agregar imports | ~1-20 | - | queries.js, stellar-expert.js |
| ❌ Eliminar | ~372-380 | `getRegisteredPlantIds()` | Completa |
| ❌ Eliminar | ~382-390 | `addRegisteredPlantId()` | Completa |
| ❌ Eliminar | ~392-400 | `savePlantToLocalCache()` | Completa |
| ❌ Eliminar | ~402-415 | `getPlantFromLocalCache()` | Completa |
| ✏️ Modificar | ~332-365 | `registerPlant()` | Eliminar localStorage, agregar explorerUrl |
| ✏️ Modificar | ~410-450 | `getAllPlants()` | Usar sessionStorage + queryPlant |
| ✏️ Modificar | ~550-565 | `voteForPlant()` | Agregar explorerUrl |
| ✏️ Modificar | ~580-600 | `listForSale()` | Agregar explorerUrl |
| ✏️ Modificar | ~620-640 | `buyListing()` | Agregar explorerUrl |
| ✏️ Reemplazar | ~720-730 | `getListing()` | Usar queryListing |
| ✏️ Reemplazar | ~730-740 | `getPlantVotes()` | Usar queryPlantVotes |

---

## ✅ Verificación

Después de aplicar cambios, buscar en client.js:

```bash
grep -n "localStorage.getItem.*plant" client.js  # No debe retornar nada
grep -n "localStorage.setItem.*plant" client.js  # No debe retornar nada
grep -n "explorerUrl" client.js  # Debe aparecer en registerPlant, voteForPlant, listForSale, buyListing
```

El único localStorage permitido es `soroban_auth` (autenticación).

---

## 📝 Notas

- **sessionStorage** se usa temporalmente para plantas de la sesión actual
- Los usuarios deben recordar/anotar IDs de plantas o usar búsqueda manual
- Solución futura: agregar `get_all_plants()` al contrato Rust
- Todos los componentes Vue actualizados usan búsqueda manual por ID
