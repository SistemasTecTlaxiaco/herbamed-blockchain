# 🔧 CAMBIOS IMPLEMENTADOS - Eliminación de localStorage

## ✅ COMPLETADO

### 1. Nuevos Archivos Creados

#### `/src/soroban/queries.js`
```javascript
- queryPlantVotes(plantId) → Consulta votos del contrato
- queryListing(plantId) → Consulta listing del contrato
- queryPlant(plantId) → Consulta planta del contrato
- queryContract(method, args) → Helper genérico para queries
```

#### `/src/soroban/stellar-expert.js`
```javascript
- getTransactionUrl(hash) → URL para verificar TX
- getAccountUrl(publicKey) → URL para ver cuenta
- getContractUrl(contractId) → URL para ver contrato
- getStellarExpertUrl(type, id) → Helper genérico
```

### 2. Cambios Necesarios en client.js

**ELIMINAR:**
```javascript
// ❌ Todas las funciones de localStorage de plantas:
- getRegisteredPlantIds()
- addRegisteredPlantId()
- savePlantToLocalCache()
- getPlantFromLocalCache()
```

**MODIFICAR:**
```javascript
// ✅ registerPlant() - No guardar en localStorage
export async function registerPlant(plantData) {
  const resp = await submitOperation({ ... })
  // ❌ ELIMINAR: addRegisteredPlantId(id)
  // ❌ ELIMINAR: savePlantToLocalCache(plantObject)
  
  const txHash = resp?.hash || resp?.id || 'pending'
  return { 
    success: true, 
    plantId: id, 
    transactionHash: txHash,
    explorerUrl: getTransactionUrl(txHash)  // ✅ NUEVO
  }
}

// ✅ getAllPlants() - Obtener del contrato, no de localStorage
export async function getAllPlants() {
  // Problema: El contrato NO tiene get_all_plants()
  // Solución temporal: Retornar array vacío y usar búsqueda manual
  console.warn('[getAllPlants] Contrato no tiene get_all_plants(). Busca plantas por ID conocido.')
  return []
}

// ✅ getPlantVotes() - Usar queries.js
export async function getPlantVotes(plantId) {
  const { queryPlantVotes } = await import('./queries.js')
  return await queryPlantVotes(plantId)
}

// ✅ getListing() - Usar queries.js
export async function getListing(plantId) {
  const { queryListing } = await import('./queries.js')
  return await queryListing(plantId)
}
```

### 3. Cambios en Componentes

#### **PlantList.vue**
```vue
<script>
import { queryPlant } from '@/soroban/queries'
import { getTransactionUrl } from '@/soroban/stellar-expert'

// Permitir búsqueda manual de plantas
const searchPlantById = async () => {
  const plant = await queryPlant(searchId.value)
  if (plant) {
    plants.value.push(plant)
  }
}
</script>
```

#### **ValidatorDashboard.vue**
```vue
<script>
import { queryPlantVotes } from '@/soroban/queries'
import { getTransactionUrl } from '@/soroban/stellar-expert'

const votePlant = async (plantId) => {
  const result = await soroban.voteForPlant(plantId)
  
  // ✅ Mostrar link de verificación
  status.value = {
    type: 'success',
    message: `✅ Voto registrado`,
    explorerUrl: getTransactionUrl(result.transactionHash)
  }
  
  // ✅ Actualizar votos
  const votes = await queryPlantVotes(plantId)
  plant.votes = votes
}
</script>

<template>
  <div v-if="status">
    {{ status.message }}
    <a :href="status.explorerUrl" target="_blank">Ver en Stellar Expert →</a>
  </div>
</template>
```

#### **MarketPlace.vue**
```vue
<script>
import { queryListing } from '@/soroban/queries'
import { getTransactionUrl } from '@/soroban/stellar-expert'

const loadListings = async () => {
  // Buscar listings conocidos
  const knownPlantIds = ['001', '002', 'TEST-001'] // Temporal
  const listings = []
  
  for (const id of knownPlantIds) {
    const listing = await queryListing(id)
    if (listing && listing.available) {
      listings.value.push(listing)
    }
  }
}

const listPlant = async () => {
  const result = await listForSale(plantId, price)
  
  // ✅ Mostrar link de verificación
  status.value = {
    type: 'success',
    message: `✅ Planta listada`,
    explorerUrl: getTransactionUrl(result.transactionHash)
  }
}
</script>
```

### 4. Problema: get_all_plants() no existe en contrato

**Soluciones Posibles:**

#### Opción A: Agregar al contrato (Rust)
```rust
// En contracts/medicinal-plants/src/lib.rs
pub fn get_all_plant_ids(env: &Env) -> Vec<String> {
    // Almacenar IDs en un vector en el contrato
    env.storage().instance().get(&DataKey::AllPlantIds).unwrap_or_else(|| vec![&env])
}
```

#### Opción B: Usar búsqueda manual (Temporal)
```javascript
// Frontend: Permitir que usuarios busquen plantas por ID
const knownPlantIds = ['001', '002', 'TEST-001']
const plants = await Promise.all(
  knownPlantIds.map(id => queryPlant(id))
)
```

#### Opción C: Indexar en frontend (Sesión del navegador)
```javascript
// Guardar IDs solo en sessionStorage (temporal por sesión)
sessionStorage.setItem('current_session_plants', JSON.stringify(['001', '002']))
```

**Recomendación:** Opción C para esta sesión, Opción A para producción.

---

## 📋 RESUMEN DE CAMBIOS

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `queries.js` | Crear nuevo archivo | ✅ |
| `stellar-expert.js` | Crear nuevo archivo | ✅ |
| `client.js` | Eliminar localStorage plantas | ⏳ |
| `client.js` | Agregar explorerUrl a returns | ⏳ |
| `client.js` | Usar queries.js | ⏳ |
| `PlantList.vue` | Búsqueda manual | ⏳ |
| `ValidatorDashboard.vue` | Links + votos actualizados | ⏳ |
| `MarketPlace.vue` | Links + listings dinámicos | ⏳ |
| `contracts/lib.rs` | Agregar get_all_plant_ids | ❌ Opcional |

---

## 🚀 PRÓXIMOS PASOS

1. Actualizar `client.js` eliminando localStorage
2. Actualizar componentes para usar queries
3. Agregar links de Stellar Expert
4. Testing completo
5. Documentar en TRANSACCIONES_GUIA.md
