# 📖 RESPUESTAS A PREGUNTAS FRECUENTES

Este documento responde las 3 preguntas principales identificadas durante el desarrollo del proyecto HerbaMed Blockchain.

---

## ❓ Pregunta 1: ¿Qué significa el mensaje de votos?

### Contexto
Al votar por una planta, el sistema muestra un mensaje como:
```json
{
  "success": true,
  "plantId": "TEST-001",
  "transactionHash": "3105f498b9e8c78f4d2a3b1e5c9a7f0d8e4b2c6a9d5e1f7a3c8b4e0d6f2a8c5b"
}
```

### Respuesta

Este es el **mensaje de confirmación de transacción blockchain**. Cada campo significa:

| Campo | Significado | Ejemplo |
|-------|-------------|---------|
| `success` | La transacción se envió correctamente al blockchain | `true` |
| `plantId` | ID de la planta que recibió el voto | `"TEST-001"` |
| `transactionHash` | Identificador único de la transacción en Stellar | `"3105f498..."` (64 caracteres hex) |

### ¿Qué es el transactionHash?

El **transactionHash** (también llamado TX Hash o Transaction ID) es:

1. **Identificador único**: Como una huella digital de la transacción
2. **Inmutable**: Una vez registrado, no puede cambiarse
3. **Verificable**: Puedes consultar la transacción en Stellar Explorer
4. **Prueba de ejecución**: Demuestra que la transacción se procesó en el blockchain

### Cómo verificar una transacción

Desde la **versión actual**, todos los mensajes de éxito incluyen un enlace directo:

```vue
<div class="alert alert-success">
  ✅ Voto registrado para TEST-001
  <a href="https://stellar.expert/explorer/testnet/tx/3105f498..." target="_blank">
    Ver en Stellar Explorer →
  </a>
</div>
```

Al hacer clic, puedes ver:
- ✅ Timestamp exacto de la transacción
- ✅ Cuenta que ejecutó la operación
- ✅ Operaciones realizadas (invoke_contract)
- ✅ Fee pagado
- ✅ Estado (success/failed)

---

## ❓ Pregunta 2: ¿Por qué después de votar el contador muestra cero votos?

### Contexto
Después de votar exitosamente por una planta, el contador de votos permanecía en 0, aunque la transacción se confirmó con `success: true`.

### Problema Identificado

**Causa raíz**: El frontend **no consultaba** el contrato para obtener el número de votos real.

#### Análisis técnico:

1. **Lo que estaba pasando**:
   ```javascript
   // ❌ ANTES: Votar enviaba transacción pero no leía el resultado
   const result = await soroban.voteForPlant(plantId)
   // success: true, pero ¿cuántos votos hay? 🤷
   ```

2. **Lo que faltaba**:
   - El contrato **SÍ guardaba** los votos correctamente en `PlantVotes(plant_id)`
   - El contrato **NO RETORNABA** el contador actualizado
   - El frontend **NO CONSULTABA** el contador después de votar

### Solución Implementada

#### 1. Nueva función en el contrato (lib.rs)

```rust
pub fn get_plant_votes(env: Env, plant_id: String) -> i128 {
    let key = DataKey::PlantVotes(plant_id.clone());
    env.storage().instance().get(&key).unwrap_or(0)
}
```

Esta función **solo lee** los votos, sin modificar el estado (read-only).

#### 2. Nueva función en el cliente (client.js)

```javascript
async getPlantVotes(plantId) {
  console.log('[Soroban] Consultando votos para:', plantId)
  
  const args = [nativeToScVal(plantId, { type: 'string' })]
  
  const result = await this.rpc.simulateTransaction(
    new TransactionBuilder(/* ... */)
      .addOperation(
        contract.call('get_plant_votes', ...args)
      )
      .build()
  )
  
  const votes = scValToNative(result.result.retval)
  console.log('[Soroban] Votos obtenidos:', votes)
  
  return votes // Retorna número entero (i128)
}
```

#### 3. Uso en componentes Vue

**ValidatorDashboard.vue** - Actualiza votos después de votar:
```vue
<script>
const votePlant = async (plantId) => {
  const result = await soroban.voteForPlant(plantId)
  
  // ✅ AHORA: Consultar votos después de votar
  await refreshVotes(plantId)
  
  status.value = {
    type: 'success',
    message: `✅ Voto registrado para ${plantId}`,
    explorerUrl: soroban.getStellarExplorerLink(result.transactionHash)
  }
}

const refreshVotes = async (plantId) => {
  const votes = await soroban.getPlantVotes(plantId)
  const plant = pendingPlants.value.find(p => p.id === plantId)
  plant.votes = votes // Actualiza UI
}
</script>
```

**PlantList.vue** - Muestra votos al cargar:
```vue
<script>
const loadPlants = async () => {
  const plants = await soroban.getAllPlants()
  
  for (const plant of plants) {
    // ✅ Consultar votos de cada planta
    const votes = await soroban.getPlantVotes(plant.id)
    plant.votes = votes
  }
  
  allPlants.value = plants
}
</script>

<template>
  <span class="badge bg-info">
    {{ plant.votes || 0 }} votos
  </span>
</template>
```

### Resultado

| Antes | Después |
|-------|---------|
| ❌ Contador siempre en 0 | ✅ Contador muestra votos reales |
| ❌ Sin función de consulta | ✅ `get_plant_votes()` disponible |
| ❌ UI no se actualiza | ✅ UI se sincroniza automáticamente |

---

## ❓ Pregunta 3: ¿Por qué al listar una planta no se refleja en el marketplace?

### Contexto
Al poner una planta en venta usando `listForSale()`, la transacción se confirmaba con éxito, pero la planta **no aparecía** en la lista del marketplace.

### Problema Identificado

**Causa raíz**: El contrato **no tenía función** para obtener todos los listings.

#### Análisis técnico:

1. **Lo que estaba pasando**:
   ```javascript
   // ❌ ANTES: Crear listing
   await soroban.listForSale('PLANT-001', 10)
   // success: true, guardado en DataKey::Listing(plant_id)
   
   // ❌ PROBLEMA: ¿Cómo listar TODOS los listings?
   // No existía get_all_listings()
   ```

2. **Intento de solución temporal**:
   - Se intentó usar **localStorage** para cachear listings localmente
   - Esto funcionaba solo en el navegador actual
   - Al recargar o cambiar de dispositivo, se perdían los datos

### Solución Implementada

#### 1. Agregar tracking de IDs en el contrato

**DataKey enum** - Nueva variante para tracking:
```rust
pub enum DataKey {
    PlantIds,      // Vec<String> - IDs de todas las plantas
    ListingIds,    // Vec<String> - IDs de plantas listadas
    Listing(String),
    Plant(String),
    // ...
}
```

**Modificar list_for_sale()** - Agregar ID al vector:
```rust
pub fn list_for_sale(
    env: Env,
    seller: Address,
    plant_id: String,
    price: i128
) -> Result<(), Error> {
    // Verificar que planta existe
    if !env.storage().instance().has(&DataKey::Plant(plant_id.clone())) {
        return Err(Error::PlantNotFound);
    }
    
    // Crear listing
    let listing = Listing {
        plant_id: plant_id.clone(),
        seller: seller.clone(),
        price,
        available: true,
    };
    env.storage().instance().set(&DataKey::Listing(plant_id.clone()), &listing);
    
    // ✅ NUEVO: Agregar a tracking de listings
    let mut listing_ids: Vec<String> = env.storage()
        .instance()
        .get(&DataKey::ListingIds)
        .unwrap_or(Vec::new(&env));
    
    if !listing_ids.contains(&plant_id) {
        listing_ids.push_back(plant_id.clone());
        env.storage().instance().set(&DataKey::ListingIds, &listing_ids);
    }
    
    Ok(())
}
```

#### 2. Nueva función get_all_listings()

```rust
pub fn get_all_listings(env: Env) -> Vec<Listing> {
    let listing_ids: Vec<String> = env.storage()
        .instance()
        .get(&DataKey::ListingIds)
        .unwrap_or(Vec::new(&env));
    
    let mut listings = Vec::new(&env);
    
    for id in listing_ids.iter() {
        let id_str = id.clone();
        if let Some(listing) = env.storage().instance().get(&DataKey::Listing(id_str)) {
            // ✅ Solo retornar listings disponibles
            if listing.available {
                listings.push_back(listing);
            }
        }
    }
    
    listings
}
```

#### 3. Función helper en client.js

```javascript
async getAllListings() {
  console.log('[Soroban] Obteniendo todos los listings...')
  
  const result = await this.rpc.simulateTransaction(
    new TransactionBuilder(/* ... */)
      .addOperation(
        contract.call('get_all_listings')
      )
      .build()
  )
  
  const listings = scValToNative(result.result.retval)
  console.log('[Soroban] Listings obtenidos:', listings.length)
  
  return listings.filter(l => l.available) // Doble filtro de seguridad
}
```

#### 4. Uso en MarketPlace.vue

```vue
<script>
import { onMounted, ref } from 'vue'
import soroban from '../../soroban/client'

const listings = ref([])
const loading = ref(false)

// ✅ Cargar automáticamente al montar
const loadListings = async () => {
  try {
    loading.value = true
    const allListings = await soroban.getAllListings()
    
    // Enriquecer con info de plantas
    for (const listing of allListings) {
      try {
        const plantInfo = await soroban.getPlant(listing.plant_id)
        listing.plantInfo = plantInfo
      } catch (error) {
        console.warn('No se pudo obtener planta:', error)
      }
    }
    
    listings.value = allListings
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadListings()
})

// ✅ Recargar después de crear listing
const createListing = async () => {
  const result = await soroban.listForSale(newListing.plantId, newListing.price)
  await loadListings() // Sincronizar con blockchain
  
  status.value = {
    type: 'success',
    message: '✅ Planta puesta en venta',
    explorerUrl: soroban.getStellarExplorerLink(result.transactionHash)
  }
}

// ✅ Recargar después de comprar
const buyListing = async (plantId) => {
  const result = await soroban.buyListing(plantId)
  await loadListings() // Listing desaparecerá (available: false)
}
</script>

<template>
  <div v-if="loading">⏳ Cargando listings desde blockchain...</div>
  
  <div v-else-if="listings.length === 0">
    📭 No hay plantas en venta
  </div>
  
  <div v-else class="row">
    <div v-for="listing in listings" :key="listing.plant_id" class="col-md-6">
      <div class="card">
        <h5>{{ listing.plantInfo?.name }}</h5>
        <p>Precio: {{ listing.price }} XLM</p>
        <button @click="buyListing(listing.plant_id)">
          🛒 Comprar
        </button>
      </div>
    </div>
  </div>
</template>
```

### Resultado

| Antes | Después |
|-------|---------|
| ❌ Listings solo en localStorage | ✅ Listings en blockchain |
| ❌ Se pierden al recargar | ✅ Persisten permanentemente |
| ❌ No hay función get_all_listings | ✅ `get_all_listings()` implementada |
| ❌ Marketplace vacío | ✅ Marketplace carga automáticamente |
| ❌ Sin tracking de IDs | ✅ `ListingIds` vector de tracking |

---

## 📊 Resumen de Cambios Arquitecturales

### Flujo de Datos ANTES

```
Usuario → Frontend → localStorage
                         ↓
                    Caché local
                    (se pierde al recargar)
```

### Flujo de Datos AHORA

```
Usuario → Frontend → client.js → RPC → Stellar Testnet → Smart Contract
                                                                ↓
                                                          Blockchain Storage
                                                          (persistente, inmutable)
                         ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←
                      getAllPlants()
                      getAllListings()
                      getPlantVotes()
```

### Funciones Agregadas al Contrato

| Función | Propósito | Retorno |
|---------|-----------|---------|
| `get_all_plants()` | Listar todas las plantas registradas | `Vec<MedicinalPlant>` |
| `get_all_listings()` | Listar todas las plantas en venta | `Vec<Listing>` |
| `get_plant_votes(plant_id)` | Consultar votos de una planta | `i128` |
| `get_validators()` | Listar todos los validadores | `Vec<Address>` |
| `get_listing(plant_id)` | Consultar listing específico | `Option<Listing>` |

### Funciones Agregadas al Cliente

| Función | Propósito | Uso |
|---------|-----------|-----|
| `getAllPlants()` | Consultar plantas desde contrato | PlantList.vue |
| `getAllListings()` | Consultar listings desde contrato | MarketPlace.vue |
| `getPlantVotes(plantId)` | Consultar votos | ValidatorDashboard.vue |
| `getStellarExplorerLink(txHash)` | Generar URL de verificación | Todos los componentes |

---

## ✅ Verificación de Transacciones

### ¿Cómo saber si una transacción se ejecutó correctamente?

**Método 1: Mensaje de éxito en la UI**
```
✅ Planta registrada exitosamente!
ID: ALBACA-001

Verificar transacción en Stellar Explorer:
[3105f498b9e8c78f4d2a3b1e5c9a7f0d...] →
```

**Método 2: Consola del navegador**
```javascript
[Soroban] Planta registrada: ALBACA-001
[Soroban] Transaction hash: 3105f498b9e8c78f4d2a3b1e5c9a7f0d...
```

**Método 3: Stellar Explorer**
1. Clic en el enlace de la UI
2. Verifica que `Status: success`
3. Revisa las operaciones ejecutadas
4. Confirma el timestamp

---

## 🔐 localStorage: Solo Autenticación

### ¿Qué se guarda ahora en localStorage?

**ÚNICAMENTE datos de autenticación temporal**:

| Clave | Propósito | Duración |
|-------|-----------|----------|
| `soroban_auth` | Token de sesión de Freighter | Sesión actual |
| `wc_session_topic` | Sesión de WalletConnect | Hasta desconexión |

### ¿Qué NO se guarda en localStorage?

❌ IDs de plantas registradas  
❌ Datos de plantas  
❌ Listings del marketplace  
❌ Contadores de votos  
❌ Ningún dato de negocio  

**Todo se consulta directamente desde el blockchain.**

---

## 📚 Referencias

- **Contrato desplegado**: `CCW7E6CECERISMD2FIKKYRMSUEU5F7VGPUHMTARG5PQH3IRNM4CFYJRE`
- **Network**: Stellar Testnet
- **RPC**: https://soroban-testnet.stellar.org:443
- **Explorer**: https://stellar.expert/explorer/testnet
- **Repositorio**: https://github.com/RicardoMtzSts/herbamed-blockchain

---

**Última actualización**: 11 de diciembre, 2024  
**Versión del contrato**: v2.0 (redesplegado con funciones de consulta)  
**Estado**: ✅ Producción en Testnet
