# 🛠️ Instrucciones Paso a Paso para Modificar client.js

## Abrir el archivo
Abre: `/home/ricardo_1/herbamed-blockchain/frontend/vue-project/src/soroban/client.js`

---

## PASO 1: Agregar Imports (después de línea 13)

**Ubicación:** Después de `const xdr = stellar.xdr` (línea ~13)

**Agregar estas 2 líneas:**
```javascript
import { getTransactionUrl, getAccountUrl } from './stellar-expert.js'
import { queryPlant, queryPlantVotes, queryListing } from './queries.js'
```

---

## PASO 2: Modificar registerPlant() (líneas 332-362)

**Buscar esta sección:**
```javascript
  // Guardar ID en localStorage para poder listar después
  addRegisteredPlantId(id)
  
  // Guardar planta completa en caché local como fallback
  const plantObject = {
    id,
    name,
    scientific_name: scientificName,
    properties,
    validated: false,
    validator: ''
  }
  savePlantToLocalCache(plantObject)
  
  return { success: true, plantId: id, transactionHash: resp?.hash || 'pending' }
```

**Reemplazar con:**
```javascript
  // Guardar ID en sessionStorage temporal
  const sessionPlants = JSON.parse(sessionStorage.getItem('currentSessionPlants') || '[]')
  if (!sessionPlants.includes(id)) {
    sessionPlants.push(id)
    sessionStorage.setItem('currentSessionPlants', JSON.stringify(sessionPlants))
  }
  
  const txHash = resp?.hash || resp?.id || 'pending'
  
  return { 
    success: true, 
    plantId: id, 
    transactionHash: txHash,
    explorerUrl: getTransactionUrl(txHash)
  }
```

---

## PASO 3: ELIMINAR Funciones de localStorage (líneas 365-419)

**BORRAR COMPLETAMENTE estas 4 funciones:**

Desde línea ~365:
```javascript
// LocalStorage helpers para rastrear plantas registradas (caché local)
function getRegisteredPlantIds() {
  try {
    const ids = localStorage.getItem('herbamed_plant_ids')
    return ids ? JSON.parse(ids) : []
  } catch (e) {
    console.error('[getRegisteredPlantIds] Error:', e)
    return []
  }
}

function addRegisteredPlantId(plantId) {
  try {
    const ids = getRegisteredPlantIds()
    if (!ids.includes(plantId)) {
      ids.push(plantId)
      localStorage.setItem('herbamed_plant_ids', JSON.stringify(ids))
      console.log('[addRegisteredPlantId] Planta agregada al registro local:', plantId)
    }
  } catch (e) {
    console.error('[addRegisteredPlantId] Error:', e)
  }
}

// Guardar planta en caché local (como fallback si el contrato no persiste)
function savePlantToLocalCache(plant) {
  try {
    const cacheKey = `herbamed_plant_${plant.id}`
    localStorage.setItem(cacheKey, JSON.stringify(plant))
    console.log('[savePlantToLocalCache] Planta guardada en caché local:', plant.id)
  } catch (e) {
    console.error('[savePlantToLocalCache] Error:', e)
  }
}

// Obtener planta del caché local
function getPlantFromLocalCache(plantId) {
  try {
    const cacheKey = `herbamed_plant_${plantId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      console.log('[getPlantFromLocalCache] Planta encontrada en caché:', plantId)
      return JSON.parse(cached)
    }
  } catch (e) {
    console.error('[getPlantFromLocalCache] Error:', e)
  }
  return null
}
```

**RESULTADO: Después de eliminar, la función `getAllPlants()` debe empezar inmediatamente después del `return` de `registerPlant()`**

---

## PASO 4: Modificar getAllPlants() (línea ~420 después de eliminar)

**Buscar:**
```javascript
export async function getAllPlants() {
  // Query contract for all registered plants
  // Como el contrato tiene problemas de persistencia en testnet, usamos caché local
  const plantIds = getRegisteredPlantIds()
  console.log('[getAllPlants] IDs registrados localmente:', plantIds)
```

**Reemplazar TODO el contenido de la función con:**
```javascript
export async function getAllPlants() {
  console.log('[getAllPlants] Obteniendo plantas de sesión actual')
  
  const sessionPlants = JSON.parse(sessionStorage.getItem('currentSessionPlants') || '[]')
  
  if (sessionPlants.length === 0) {
    console.log('[getAllPlants] No hay plantas en sesión actual')
    return []
  }
  
  console.log('[getAllPlants] IDs en sesión:', sessionPlants)
  
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
      console.warn(`[getAllPlants] Error al cargar planta ${id}:`, error)
    }
  }
  
  return plants
}
```

---

## PASO 5: Modificar voteForPlant() (líneas ~563)

**Buscar:**
```javascript
  return { success: true, plantId, transactionHash: resp?.hash || 'pending' }
}
```

**Reemplazar con:**
```javascript
  const txHash = resp?.hash || resp?.id || 'pending'
  
  return { 
    success: true, 
    plantId, 
    transactionHash: txHash,
    explorerUrl: getTransactionUrl(txHash)
  }
}
```

---

## PASO 6: Modificar listForSale() (buscar después de voteForPlant)

**Buscar el return de listForSale:**
```javascript
  return { success: true, transactionHash: resp?.hash || 'pending' }
```

**Reemplazar con:**
```javascript
  const txHash = resp?.hash || resp?.id || 'pending'
  
  return { 
    success: true, 
    transactionHash: txHash,
    seller: publicKey,
    explorerUrl: getTransactionUrl(txHash)
  }
```

---

## PASO 7: Modificar buyListing() (buscar después de listForSale)

**Buscar el return de buyListing:**
```javascript
  return { success: true, plantId, transactionHash: resp?.hash || 'pending' }
```

**Reemplazar con:**
```javascript
  const txHash = resp?.hash || resp?.id || 'pending'
  
  return { 
    success: true, 
    plantId, 
    transactionHash: txHash,
    explorerUrl: getTransactionUrl(txHash)
  }
```

---

## PASO 8: Reemplazar getListing() (líneas ~726)

**Buscar TODO el contenido de getListing:**
```javascript
export async function getListing(plantId) {
  // Query contract for listing details
  // Contract signature: get_listing implícito via DataKey::Listing
  try {
    console.log('[getListing] Consultando listing:', plantId)
    // Por ahora retorna estructura básica - TODO: implementar query real
    return { plantId, available: false, price: null, seller: null }
  } catch (e) {
    console.error('[getListing] Error:', e)
    return { plantId, available: false, price: null, seller: null }
  }
}
```

**Reemplazar con:**
```javascript
export async function getListing(plantId) {
  console.log('[getListing] Obteniendo listing:', plantId)
  return await queryListing(plantId)
}
```

---

## PASO 9: Reemplazar getPlantVotes() (líneas ~738)

**Buscar TODO el contenido de getPlantVotes:**
```javascript
export async function getPlantVotes(plantId) {
  // Query contract for vote count
  // El contrato almacena votos en DataKey::PlantVotes(plant_id)
  try {
    console.log('[getPlantVotes] Consultando votos:', plantId)
    // Por ahora retorna 0 - TODO: implementar query real con RPC
    return 0
  } catch (e) {
    console.error('[getPlantVotes] Error:', e)
    return 0
  }
}
```

**Reemplazar con:**
```javascript
export async function getPlantVotes(plantId) {
  console.log('[getPlantVotes] Obteniendo votos de planta:', plantId)
  return await queryPlantVotes(plantId)
}
```

---

## ✅ VERIFICACIÓN

Después de completar todos los pasos, ejecuta:

```bash
cd /home/ricardo_1/herbamed-blockchain/frontend/vue-project
./verify_migration.sh
```

Debe mostrar:
- ✅ No hay localStorage para plantas
- ✅ Import de stellar-expert encontrado
- ✅ Import de queries encontrado
- ✅ explorerUrl implementado
- ✅ queryPlantVotes implementado
- ✅ queryListing implementado

---

## 🎯 Resumen de Cambios

| Paso | Acción | Líneas Aprox |
|------|--------|--------------|
| 1 | Agregar imports | ~14-15 |
| 2 | Modificar registerPlant return | ~350-362 |
| 3 | **ELIMINAR** 4 funciones localStorage | ~365-419 |
| 4 | Reemplazar getAllPlants completa | ~420-450 |
| 5 | Modificar voteForPlant return | ~563 |
| 6 | Modificar listForSale return | ~700 |
| 7 | Modificar buyListing return | ~715 |
| 8 | Reemplazar getListing completa | ~726 |
| 9 | Reemplazar getPlantVotes completa | ~738 |

**Total: ~50 líneas eliminadas, ~40 líneas modificadas/agregadas**
