# 📋 PLAN DE TRABAJO - 11 Diciembre 2025

**Objetivo:** Eliminar dependencia de localStorage, agregar funciones faltantes al contrato, y mejorar trazabilidad de transacciones

---

## 🎯 RESUMEN DE REQUISITOS

### 1. ✅ Estado Actual Confirmado
- Las plantas se visualizan correctamente en la lista
- Las transacciones se envían exitosamente a blockchain
- Sistema de caché local funciona como fallback

### 2. 🔧 Cambios Solicitados

#### A. Contrato (Rust)
- [ ] Agregar función `get_all_plants()` para obtener todas las plantas
- [ ] Revisar si faltan otras funciones necesarias
- [ ] Recompilar y redesplegar contrato

#### B. Frontend
- [ ] **ELIMINAR localStorage** excepto autenticación temporal
- [ ] Agregar **enlaces a Stellar Explorer** para verificar transacciones
- [ ] Sincronizar contador de votos desde blockchain
- [ ] Sincronizar listados de marketplace desde blockchain

#### C. Documentación
- [ ] Actualizar TRANSACCIONES_GUIA.md con nuevos flujos
- [ ] Actualizar USER_MANUAL.md
- [ ] Documentar respuestas a las 3 preguntas

### 3. ❓ Preguntas a Resolver

**Pregunta 1:** ¿Qué significa el mensaje de votos?
```json
{
  "success": true,
  "plantId": "TEST-001",
  "transactionHash": "3105f498b48a1ab661e9effdf310c0df61"
}
```
**Respuesta:** Es la confirmación de que la transacción de voto se envió exitosamente. El `transactionHash` es el identificador único de la transacción en blockchain.

**Pregunta 2:** ¿Por qué el contador de votos muestra 0?
**Causa:** El frontend no está consultando el contador de votos desde el contrato (función `get_plant_votes`), solo muestra un valor hardcoded.

**Pregunta 3:** ¿Por qué las plantas listadas no aparecen?
**Causa:** No hay función en el contrato para obtener todos los listings. Solo hay `get_listing(plant_id)` individual.

---

## 📊 ANÁLISIS DETALLADO

### Estado del Contrato Actual

**Funciones Existentes:**
```rust
✅ init(env)
✅ register_plant(id, name, scientific_name, properties) -> String
✅ add_validator(validator)
✅ is_validator(validator) -> bool
✅ vote_for_plant(plant_id, validator) -> i128
✅ get_plant(id) -> Option<MedicinalPlant>
✅ list_for_sale(plant_id, seller, price)
✅ buy_listing(plant_id, buyer) -> Result<bool, Error>
✅ get_listing(plant_id) -> Option<Listing>
```

**Funciones FALTANTES Identificadas:**
```rust
❌ get_all_plants() -> Vec<MedicinalPlant>
❌ get_all_listings() -> Vec<Listing>
❌ get_plant_votes(plant_id) -> i128
❌ get_validators() -> Vec<Address>
```

### Análisis de localStorage Actual

**Datos Guardados Actualmente:**
```javascript
✅ MANTENER: 'soroban_auth' → Datos de autenticación
❌ ELIMINAR: 'herbamed_plant_ids' → Array de IDs
❌ ELIMINAR: 'herbamed_plant_[ID]' → Caché de plantas
❌ ELIMINAR: Cualquier otro dato de negocio
```

### Análisis de Flujos de Transacción

**Acciones que DEBEN mostrar enlace a Stellar Explorer:**

1. **Registro de Planta** (`register_plant`)
   - ✅ Ya genera transacción
   - ❌ Falta enlace a Explorer

2. **Votar por Planta** (`vote_for_plant`)
   - ✅ Ya genera transacción
   - ❌ Falta enlace a Explorer
   - ❌ No muestra contador actualizado

3. **Listar para Venta** (`list_for_sale`)
   - ✅ Ya genera transacción
   - ❌ Falta enlace a Explorer
   - ❌ No se sincroniza con lista de marketplace

4. **Comprar Planta** (`buy_listing`)
   - ✅ Ya genera transacción
   - ❌ Falta enlace a Explorer

---

## 🗂️ PLAN DE EJECUCIÓN (Orden Cronológico)

### FASE 1: ANÁLISIS Y PREPARACIÓN (30 min)

#### Task 1.1: Revisar Contrato Completo
```bash
# Archivo: contracts/medicinal-plants/src/lib.rs
- Leer línea por línea
- Identificar DataKey enums
- Identificar estructuras de datos
- Confirmar funciones faltantes
```

**Entregable:**
- Lista completa de funciones existentes
- Lista de funciones a agregar
- Plan de storage para get_all_plants

#### Task 1.2: Analizar Dependencias de localStorage
```bash
# Buscar todos los usos de localStorage
grep -r "localStorage" frontend/vue-project/src/
```

**Entregable:**
- Lista de archivos que usan localStorage
- Estrategia de migración para cada uso

---

### FASE 2: MODIFICAR CONTRATO (1-2 horas)

#### Task 2.1: Agregar Función `get_all_plants()`

**Problema:** No hay forma de iterar sobre storage en Soroban

**Solución:** Mantener un Vec<String> con todos los IDs de plantas

**Implementación:**
```rust
// Agregar a DataKey enum
#[contracttype]
pub enum DataKey {
    Plant(String),
    PlantIds,  // ← NUEVO: Vector de todos los IDs
    Validators,
    PlantVotes(String),
    Voted(String, Address),
    Listing(String),
    ListingIds, // ← NUEVO: Vector de IDs listados
}

// Función nueva
pub fn get_all_plants(env: &Env) -> Vec<MedicinalPlant> {
    let plant_ids: Vec<String> = env.storage()
        .instance()
        .get(&DataKey::PlantIds)
        .unwrap_or_else(|| vec![&env]);
    
    let mut plants = vec![&env];
    for id in plant_ids.iter() {
        if let Some(plant) = env.storage().instance().get(&DataKey::Plant(id.clone())) {
            plants.push_back(plant);
        }
    }
    plants
}

// Modificar register_plant para agregar ID a lista
pub fn register_plant(...) -> String {
    // ... código existente ...
    env.storage().instance().set(&DataKey::Plant(id.clone()), &plant);
    
    // AGREGAR ID a lista global
    let mut plant_ids: Vec<String> = env.storage()
        .instance()
        .get(&DataKey::PlantIds)
        .unwrap_or_else(|| vec![&env]);
    plant_ids.push_back(id.clone());
    env.storage().instance().set(&DataKey::PlantIds, &plant_ids);
    
    id
}
```

#### Task 2.2: Agregar Función `get_all_listings()`

```rust
pub fn get_all_listings(env: &Env) -> Vec<Listing> {
    let listing_ids: Vec<String> = env.storage()
        .instance()
        .get(&DataKey::ListingIds)
        .unwrap_or_else(|| vec![&env]);
    
    let mut listings = vec![&env];
    for id in listing_ids.iter() {
        if let Some(listing) = env.storage().instance().get(&DataKey::Listing(id.clone())) {
            if listing.available {  // Solo listings activos
                listings.push_back(listing);
            }
        }
    }
    listings
}

// Modificar list_for_sale
pub fn list_for_sale(...) {
    // ... código existente ...
    env.storage().instance().set(&DataKey::Listing(plant_id.clone()), &listing);
    
    // AGREGAR ID a lista de listings
    let mut listing_ids: Vec<String> = env.storage()
        .instance()
        .get(&DataKey::ListingIds)
        .unwrap_or_else(|| vec![&env]);
    if !listing_ids.contains(&plant_id) {
        listing_ids.push_back(plant_id.clone());
        env.storage().instance().set(&DataKey::ListingIds, &listing_ids);
    }
}
```

#### Task 2.3: Agregar Funciones de Query

```rust
// Ya existe vote_for_plant que retorna i128 (votos)
// Solo necesitamos get_plant_votes como query sin transacción

pub fn get_plant_votes(env: &Env, plant_id: String) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::PlantVotes(plant_id))
        .unwrap_or(0i128)
}

pub fn get_validators(env: &Env) -> Vec<Address> {
    env.storage()
        .instance()
        .get(&DataKey::Validators)
        .unwrap_or_else(|| vec![&env])
}
```

#### Task 2.4: Compilar y Redesplegar

```bash
cd contracts/medicinal-plants
cargo build --target wasm32-unknown-unknown --release

# Redesplegar con soroban CLI
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/medicinal_plants.wasm \
  --source [KEYPAIR] \
  --network testnet

# IMPORTANTE: Guardar nuevo CONTRACT_ADDRESS
```

**⚠️ CRITICAL:** Actualizar CONTRACT_ADDRESS en frontend

---

### FASE 3: MODIFICAR FRONTEND (2-3 horas)

#### Task 3.1: Eliminar localStorage (excepto auth)

**Archivos a modificar:**
1. `frontend/vue-project/src/soroban/client.js`
2. `frontend/vue-project/src/views/plants/PlantList.vue`
3. `frontend/vue-project/src/views/plants/PlantRegistration.vue`
4. `frontend/vue-project/src/components/plants/MarketPlace.vue`

**Cambios en client.js:**

```javascript
// ELIMINAR COMPLETAMENTE:
// - function getRegisteredPlantIds()
// - function addRegisteredPlantId()
// - function savePlantToLocalCache()
// - function getPlantFromLocalCache()

// REEMPLAZAR getAllPlants() con llamada al contrato
export async function getAllPlants() {
  try {
    console.log('[getAllPlants] Consultando contrato...')
    
    // Llamar a get_all_plants del contrato
    const server = new rpc.Server(RPC_URL)
    const contract = new Contract(CONTRACT_ADDRESS)
    let publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
    
    if (!publicKey) {
      publicKey = Keypair.random().publicKey()
    }
    
    const account = await server.getAccount(publicKey)
    const contractOperation = contract.call('get_all_plants')
    
    const txBuilder = new TransactionBuilder(account, {
      fee: stellar.BASE_FEE,
      networkPassphrase
    })
      .addOperation(contractOperation)
      .setTimeout(30)
    
    const transaction = txBuilder.build()
    const simulateResponse = await server.simulateTransaction(transaction)
    
    if (rpc.Api.isSimulationError(simulateResponse)) {
      console.error('[getAllPlants] Error:', simulateResponse)
      return []
    }
    
    if (!simulateResponse.result || !simulateResponse.result.retval) {
      return []
    }
    
    const plants = scValToNative(simulateResponse.result.retval)
    console.log('[getAllPlants] Plantas obtenidas:', plants.length)
    return Array.isArray(plants) ? plants : []
  } catch (e) {
    console.error('[getAllPlants] Error:', e)
    return []
  }
}

// Modificar registerPlant para NO guardar en localStorage
export async function registerPlant(plantData) {
  // ... código existente de submitOperation ...
  
  // ELIMINAR:
  // addRegisteredPlantId(id)
  // savePlantToLocalCache(plantObject)
  
  return { success: true, plantId: id, transactionHash: resp?.hash || 'pending' }
}
```

#### Task 3.2: Agregar Funciones de Query Nuevas

```javascript
export async function getAllListings() {
  // Similar a getAllPlants pero llamando a get_all_listings
  try {
    const server = new rpc.Server(RPC_URL)
    const contract = new Contract(CONTRACT_ADDRESS)
    let publicKey = getConnectedPublicKey() || Keypair.random().publicKey()
    
    const account = await server.getAccount(publicKey)
    const contractOperation = contract.call('get_all_listings')
    
    const txBuilder = new TransactionBuilder(account, {
      fee: stellar.BASE_FEE,
      networkPassphrase
    }).addOperation(contractOperation).setTimeout(30)
    
    const transaction = txBuilder.build()
    const simulateResponse = await server.simulateTransaction(transaction)
    
    if (rpc.Api.isSimulationError(simulateResponse)) {
      return []
    }
    
    const listings = scValToNative(simulateResponse.result.retval)
    return Array.isArray(listings) ? listings : []
  } catch (e) {
    console.error('[getAllListings] Error:', e)
    return []
  }
}

export async function getPlantVotes(plantId) {
  // Query para obtener votos de una planta
  try {
    const server = new rpc.Server(RPC_URL)
    const contract = new Contract(CONTRACT_ADDRESS)
    let publicKey = getConnectedPublicKey() || Keypair.random().publicKey()
    
    const account = await server.getAccount(publicKey)
    const args = [nativeToScVal(plantId, {type: 'string'})]
    const contractOperation = contract.call('get_plant_votes', ...args)
    
    const txBuilder = new TransactionBuilder(account, {
      fee: stellar.BASE_FEE,
      networkPassphrase
    }).addOperation(contractOperation).setTimeout(30)
    
    const transaction = txBuilder.build()
    const simulateResponse = await server.simulateTransaction(transaction)
    
    if (rpc.Api.isSimulationError(simulateResponse)) {
      return 0
    }
    
    const votes = scValToNative(simulateResponse.result.retval)
    return typeof votes === 'number' ? votes : 0
  } catch (e) {
    console.error('[getPlantVotes] Error:', e)
    return 0
  }
}
```

#### Task 3.3: Agregar Enlaces a Stellar Explorer

**Crear helper function:**

```javascript
// En client.js
export function getStellarExplorerLink(transactionHash) {
  const network = NETWORK === 'testnet' ? 'testnet' : 'public'
  return `https://stellar.expert/explorer/${network}/tx/${transactionHash}`
}
```

**Modificar componentes para mostrar enlace:**

**PlantRegistration.vue:**
```vue
<template>
  <!-- ... formulario ... -->
  
  <div v-if="transactionHash" class="alert alert-success mt-3">
    ✅ Planta registrada exitosamente
    <br>
    <a :href="explorerLink" target="_blank" class="btn btn-sm btn-outline-primary mt-2">
      🔍 Ver en Stellar Explorer
    </a>
  </div>
</template>

<script>
import { getStellarExplorerLink } from '../../soroban/client'

const transactionHash = ref(null)
const explorerLink = computed(() => {
  return transactionHash.value ? getStellarExplorerLink(transactionHash.value) : ''
})

const registerPlant = async () => {
  try {
    const result = await soroban.registerPlant({...})
    transactionHash.value = result.transactionHash
    
    // Mostrar mensaje con enlace antes de navegar
    await new Promise(resolve => setTimeout(resolve, 3000))
    router.push('/plants')
  } catch (error) {
    // ...
  }
}
</script>
```

**Aplicar patrón similar en:**
- PlantList.vue (votos)
- MarketPlace.vue (listar/comprar)
- ValidatorDashboard.vue (votos de validadores)

#### Task 3.4: Actualizar PlantList para Sincronizar Votos

```javascript
const loadPlants = async () => {
  try {
    const result = await soroban.getAllPlants()
    plants.value = Array.isArray(result) ? result : []
    
    // Cargar votos para cada planta DESDE EL CONTRATO
    for (const plant of plants.value) {
      try {
        const votes = await soroban.getPlantVotes(plant.id)
        plant.votes = votes || 0
      } catch (e) {
        plant.votes = 0
      }
    }
    
    console.log('[PlantList] Plantas cargadas:', plants.value.length)
  } catch (error) {
    console.error('[PlantList] Error:', error)
    plants.value = []
  }
}
```

#### Task 3.5: Actualizar MarketPlace para Sincronizar Listings

```javascript
const loadListings = async () => {
  try {
    const result = await soroban.getAllListings()
    listings.value = Array.isArray(result) ? result : []
    console.log('[MarketPlace] Listings cargados:', listings.value.length)
  } catch (error) {
    console.error('[MarketPlace] Error:', error)
    listings.value = []
  }
}
```

---

### FASE 4: TESTING Y VALIDACIÓN (1-2 horas)

#### Task 4.1: Test de Contrato

```bash
# Test unitarios en Rust
cd contracts/medicinal-plants
cargo test

# Test de funciones nuevas específicamente
# Verificar que:
# - get_all_plants() retorna Vec vacío inicialmente
# - register_plant agrega a PlantIds
# - get_all_plants() retorna plantas después de registro
# - get_all_listings() funciona similar
```

#### Task 4.2: Test de Frontend (Manual)

**Checklist:**

1. **Registro de Plantas**
   - [ ] Registrar planta "TEST-001"
   - [ ] Verificar que aparece enlace a Stellar Explorer
   - [ ] Click en enlace y verificar transacción en Explorer
   - [ ] Verificar que planta aparece en lista sin recargar página
   - [ ] Recargar página (F5) y verificar que planta sigue apareciendo

2. **Votación**
   - [ ] Ir a /validators
   - [ ] Votar por planta "TEST-001"
   - [ ] Verificar enlace a Explorer
   - [ ] Verificar que contador de votos se actualiza (debe mostrar 1)
   - [ ] Intentar votar de nuevo (debe fallar con "Already voted")

3. **Marketplace**
   - [ ] Listar planta "TEST-001" con precio 100
   - [ ] Verificar enlace a Explorer
   - [ ] Verificar que planta aparece en lista de "Plantas disponibles"
   - [ ] Comprar planta (desde otra cuenta si es posible)
   - [ ] Verificar que planta desaparece de listings

4. **localStorage Limpieza**
   - [ ] Abrir DevTools → Application → LocalStorage
   - [ ] Verificar que SOLO existe 'soroban_auth'
   - [ ] NO debe haber 'herbamed_plant_ids'
   - [ ] NO debe haber 'herbamed_plant_[ID]'

#### Task 4.3: Test de Persistencia

```bash
# 1. Registrar 3 plantas
# 2. Cerrar navegador completamente
# 3. Abrir de nuevo y verificar que las 3 plantas aparecen
# 4. Listar 2 plantas para venta
# 5. Recargar página
# 6. Verificar que las 2 listings aparecen
```

---

### FASE 5: DOCUMENTACIÓN (30 min)

#### Task 5.1: Actualizar TRANSACCIONES_GUIA.md

Agregar secciones:
- Función `get_all_plants()`
- Función `get_all_listings()`
- Función `get_plant_votes()`
- Enlaces a Stellar Explorer
- Respuestas a las 3 preguntas

#### Task 5.2: Actualizar USER_MANUAL.md

Actualizar:
- Eliminar referencias a localStorage de plantas
- Agregar sección "Verificar Transacciones en Stellar Explorer"
- Actualizar flujos de usuario con nuevos pasos

#### Task 5.3: Crear Documento de Respuestas

**RESPUESTAS_PREGUNTAS.md**

```markdown
# Respuestas a Preguntas Frecuentes

## Pregunta 1: ¿Qué significa el mensaje de votos?

Cuando votas por una planta, recibes:
{
  "success": true,
  "plantId": "TEST-001",
  "transactionHash": "3105f498b..."
}

**Significado:**
- `success: true` → La transacción se envió exitosamente
- `plantId` → ID de la planta votada
- `transactionHash` → Identificador único de la transacción en blockchain

**Verificación:**
Puedes verificar la transacción en:
https://stellar.expert/explorer/testnet/tx/3105f498b...

## Pregunta 2: ¿Por qué el contador mostraba 0?

**Problema:** El frontend no consultaba el contador real del contrato.

**Solución Implementada:**
- Agregamos función `getPlantVotes(plantId)` que consulta el contrato
- PlantList ahora carga votos reales después de cargar plantas
- El contador se actualiza en tiempo real

## Pregunta 3: ¿Por qué las plantas listadas no aparecían?

**Problema:** El contrato no tenía función para obtener todos los listings.

**Solución Implementada:**
- Agregamos `get_all_listings()` al contrato
- MarketPlace ahora consulta esta función
- Las plantas listadas aparecen automáticamente
```

---

## 🔄 ORDEN DE EJECUCIÓN FINAL

```
1. ANÁLISIS (30 min)
   ├─ Revisar contrato completo
   └─ Identificar usos de localStorage

2. CONTRATO (2 horas)
   ├─ Modificar lib.rs
   ├─ Agregar get_all_plants()
   ├─ Agregar get_all_listings()
   ├─ Agregar get_plant_votes()
   ├─ Compilar
   └─ Redesplegar

3. FRONTEND (3 horas)
   ├─ Eliminar localStorage de plantas
   ├─ Actualizar getAllPlants()
   ├─ Agregar getAllListings()
   ├─ Agregar getPlantVotes()
   ├─ Agregar enlaces Explorer
   ├─ Actualizar componentes
   └─ Verificar errores

4. TESTING (2 horas)
   ├─ Test unitarios contrato
   ├─ Test manual frontend
   └─ Test de persistencia

5. DOCUMENTACIÓN (30 min)
   ├─ TRANSACCIONES_GUIA.md
   ├─ USER_MANUAL.md
   └─ RESPUESTAS_PREGUNTAS.md

6. COMMIT FINAL
   └─ Push a GitHub
```

**Tiempo Total Estimado:** 7-8 horas

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgo 1: Redespliegue de Contrato
**Problema:** Perder datos existentes
**Mitigación:** 
- Hacer backup del CONTRACT_ADDRESS actual
- Documentar todas las plantas/listings de testnet
- Considerar migración de datos si es crítico

### Riesgo 2: Breaking Changes
**Problema:** Frontend deja de funcionar con nuevo contrato
**Mitigación:**
- Branch separado para cambios
- Testing exhaustivo antes de merge
- Rollback plan preparado

### Riesgo 3: Performance
**Problema:** get_all_plants puede ser lento con muchas plantas
**Mitigación:**
- Implementar paginación en futuras versiones
- Limitar a primeras 100 plantas
- Cache en memoria (NO localStorage)

---

## ✅ CRITERIOS DE ÉXITO

1. [ ] Contrato tiene funciones get_all_plants y get_all_listings
2. [ ] Frontend NO usa localStorage excepto auth
3. [ ] Todas las transacciones muestran enlace a Stellar Explorer
4. [ ] Contador de votos se sincroniza correctamente
5. [ ] Plantas listadas aparecen en marketplace
6. [ ] Tests pasan exitosamente
7. [ ] Documentación actualizada
8. [ ] Código en GitHub

---

**Creado:** 11 de Diciembre, 2025  
**Estado:** PENDIENTE DE EJECUCIÓN
