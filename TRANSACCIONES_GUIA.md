# 📘 Guía de Transacciones - HerbaMed DApp

**Fecha:** 10 de Diciembre, 2025  
**Versión:** 1.0.0

---

## 📋 ÍNDICE

1. [Descripción General](#descripción-general)
2. [Funciones del Contrato](#funciones-del-contrato)
3. [Flujos de Usuario](#flujos-de-usuario)
4. [Implementación en Frontend](#implementación-en-frontend)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Debugging y Logs](#debugging-y-logs)

---

## 📖 DESCRIPCIÓN GENERAL

HerbaMed utiliza un smart contract Soroban desplegado en **Stellar Testnet** con las siguientes funcionalidades principales:

- ✅ Registro de plantas medicinales
- ✅ Sistema de votación por validadores
- ✅ Marketplace (listar/comprar plantas)
- ✅ Queries de datos (plantas, votos, listings)

**Contract Address:**  
```
CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR
```

**RPC Endpoint:**  
```
https://soroban-testnet.stellar.org
```

---

## 🔧 FUNCIONES DEL CONTRATO

### 1. **register_plant**
Registra una nueva planta en blockchain.

**Signature Rust:**
```rust
pub fn register_plant(
    env: &Env,
    id: String,
    name: String,
    scientific_name: String,
    properties: Vec<String>,
) -> String
```

**Frontend (client.js):**
```javascript
export async function registerPlant(plantData) {
  const id = plantData.id || `PLANT-${Date.now()}`
  const name = plantData.name || ''
  const scientificName = plantData.scientificName || ''
  const properties = Array.isArray(plantData.properties) ? plantData.properties : []
  
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'register_plant', 
    args: [id, name, scientificName, properties] 
  })
  
  return { success: true, plantId: id, transactionHash: resp?.hash || 'pending' }
}
```

**Ejemplo de Uso:**
```javascript
const result = await soroban.registerPlant({
  id: 'MNZ-001',
  name: 'Manzanilla',
  scientificName: 'Matricaria chamomilla',
  properties: ['Antiinflamatoria', 'Sedante', 'Digestiva']
})

console.log('Hash:', result.transactionHash)
```

---

### 2. **vote_for_plant**
Permite a validadores votar por una planta. Cuando los votos superan el 50% de validadores, la planta se marca como `validated: true`.

**Signature Rust:**
```rust
pub fn vote_for_plant(
    env: &Env, 
    plant_id: String, 
    validator: Address
) -> i128
```

**Frontend (client.js):**
```javascript
export async function voteForPlant(plantId) {
  const publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
  if (!publicKey) throw new Error('No hay cuenta conectada para votar')
  
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'vote_for_plant', 
    args: [plantId, publicKey] 
  })
  
  return { success: true, plantId, transactionHash: resp?.hash || 'pending' }
}
```

**Ejemplo de Uso:**
```javascript
const result = await soroban.voteForPlant('MNZ-001')
console.log('Votos registrados. Hash:', result.transactionHash)
```

---

### 3. **list_for_sale**
Lista una planta en el marketplace con un precio.

**Signature Rust:**
```rust
pub fn list_for_sale(
    env: &Env, 
    plant_id: String, 
    seller: Address, 
    price: i128
)
```

**Frontend (client.js):**
```javascript
export async function listForSale(plantId, price) {
  const publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
  if (!publicKey) throw new Error('No hay cuenta conectada para listar planta')
  
  const priceNum = parseInt(price, 10)
  if (isNaN(priceNum) || priceNum <= 0) throw new Error('Precio inválido')
  
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'list_for_sale', 
    args: [plantId, publicKey, priceNum] 
  })
  
  return { success: true, plantId, price: priceNum, transactionHash: resp?.hash || 'pending' }
}
```

**Ejemplo de Uso:**
```javascript
const result = await soroban.listForSale('MNZ-001', 100) // 100 XLM
console.log('Planta listada. Hash:', result.transactionHash)
```

---

### 4. **buy_listing**
Compra una planta listada en el marketplace.

**Signature Rust:**
```rust
pub fn buy_listing(
    env: &Env, 
    plant_id: String, 
    buyer: Address
) -> Result<bool, MedicinalPlantsError>
```

**Frontend (client.js):**
```javascript
export async function buyListing(plantId) {
  const publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
  if (!publicKey) throw new Error('No hay cuenta conectada para comprar')
  
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'buy_listing', 
    args: [plantId, publicKey] 
  })
  
  return { success: true, plantId, transactionHash: resp?.hash || 'pending' }
}
```

**Ejemplo de Uso:**
```javascript
const result = await soroban.buyListing('MNZ-001')
console.log('Compra exitosa. Hash:', result.transactionHash)
```

---

### 5. **get_plant** (Query)
Consulta los datos de una planta específica.

**Signature Rust:**
```rust
pub fn get_plant(env: &Env, id: String) -> Option<MedicinalPlant>
```

**Frontend (client.js):**
```javascript
export async function getPlant(plantId) {
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'get_plant', 
    args: [plantId],
    readOnly: true
  })
  return resp || null
}
```

**Ejemplo de Uso:**
```javascript
const plant = await soroban.getPlant('MNZ-001')
console.log('Planta:', plant)
// { id: 'MNZ-001', name: 'Manzanilla', validated: true, ... }
```

---

### 6. **is_validator** (Query)
Verifica si una dirección es validador.

**Signature Rust:**
```rust
pub fn is_validator(env: &Env, validator: Address) -> bool
```

**Frontend (client.js):**
```javascript
export async function isValidator(address) {
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'is_validator', 
    args: [address],
    readOnly: true
  })
  return !!resp
}
```

---

## 🔄 FLUJOS DE USUARIO

### Flujo 1: Registrar Planta

```
Usuario → Login.vue (conectar wallet)
       → PlantRegistration.vue (formulario)
       → client.js.registerPlant()
       → submitOperation() 
       → Firma con Freighter/Clave Local
       → RPC Soroban
       → Blockchain ✅
```

**Componente:** `/views/plants/PlantRegistration.vue`

**Código:**
```javascript
const registerPlant = async () => {
  await soroban.registerPlant({
    id: plant.value.id,
    name: plant.value.name,
    scientificName: plant.value.scientificName,
    properties: plant.value.properties
  })
  router.push('/plants')
}
```

---

### Flujo 2: Votar por Planta

```
Usuario → PlantList.vue (click botón "Votar")
       → client.js.voteForPlant(plantId)
       → Verifica que el usuario esté conectado
       → submitOperation()
       → Firma transacción
       → Blockchain actualiza contador de votos ✅
```

**Componente:** `/views/plants/PlantList.vue`

**Código:**
```javascript
const voteForPlant = async (plantId) => {
  try {
    const result = await soroban.voteForPlant(plantId)
    status.value = {
      type: 'success',
      message: `✅ Voto registrado. Hash: ${result.transactionHash}`
    }
    setTimeout(() => loadPlants(), 2000)
  } catch (error) {
    status.value = {
      type: 'danger',
      message: `❌ Error: ${error.message}`
    }
  }
}
```

---

### Flujo 3: Listar Planta en Marketplace

```
Usuario → MarketPlace.vue (formulario "Listar")
       → Ingresa ID y precio
       → client.js.listForSale(plantId, price)
       → Verifica cuenta conectada
       → submitOperation()
       → Blockchain crea Listing ✅
```

**Componente:** `/components/plants/MarketPlace.vue`

**Código:**
```javascript
async function listPlant() {
  const result = await listForSale(listForm.value.plantId, listForm.value.price)
  status.value = { type: 'success', message: `✅ Planta listada` }
  await loadListings()
}
```

---

### Flujo 4: Comprar Planta

```
Usuario → MarketPlace.vue (click "Comprar")
       → client.js.buyListing(plantId)
       → Verifica cuenta conectada
       → submitOperation()
       → Blockchain marca available: false ✅
       → Transfiere tokens (placeholder)
```

**Componente:** `/components/plants/MarketPlace.vue`

**Código:**
```javascript
async function buyPlant(plantId) {
  const result = await buyListing(plantId)
  status.value = { type: 'success', message: `✅ Compra exitosa` }
  await loadListings()
}
```

---

## 🛠️ IMPLEMENTACIÓN EN FRONTEND

### Arquitectura de Client.js

```
client.js
│
├─ connectWallet() ───────────────> Freighter/Clave Local
│
├─ submitOperation(operation) ────> Builder Service/RPC
│   ├─ buildUnsignedXDR()
│   ├─ Firma (Freighter/Local)
│   └─ submitTx()
│
├─ registerPlant()
├─ voteForPlant()
├─ listForSale()
├─ buyListing()
├─ getPlant()
├─ isValidator()
└─ getPlantVotes()
```

### Validación de Cuenta Conectada

Todas las funciones de transacción verifican:

```javascript
const publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
if (!publicKey) throw new Error('No hay cuenta conectada')
```

---

## 📝 EJEMPLOS DE USO

### Ejemplo Completo: Registro + Voto + Marketplace

```javascript
// 1. Conectar wallet
const pk = await soroban.connectWallet()
console.log('Conectado:', pk)

// 2. Registrar planta
const plant = await soroban.registerPlant({
  id: 'MNZ-001',
  name: 'Manzanilla',
  scientificName: 'Matricaria chamomilla',
  properties: ['Antiinflamatoria', 'Sedante']
})
console.log('Planta registrada:', plant.transactionHash)

// 3. Votar por la planta
const vote = await soroban.voteForPlant('MNZ-001')
console.log('Voto registrado:', vote.transactionHash)

// 4. Listar en marketplace
const listing = await soroban.listForSale('MNZ-001', 100)
console.log('Planta listada:', listing.transactionHash)

// 5. Comprar (desde otra cuenta)
const purchase = await soroban.buyListing('MNZ-001')
console.log('Compra exitosa:', purchase.transactionHash)
```

---

## 🐛 DEBUGGING Y LOGS

### Logs en Console

Todas las funciones imprimen logs detallados:

```javascript
[registerPlant] Enviando: { id, name, scientificName, properties }
[voteForPlant] Votando por planta: MNZ-001 con validador: GXXX...
[listForSale] Listando planta: MNZ-001 precio: 100 vendedor: GXXX...
[buyListing] Comprando planta: MNZ-001 comprador: GXXX...
```

### Verificar en Stellar Explorer

Cada transacción retorna un hash. Puedes verificarlo en:

```
https://stellar.expert/explorer/testnet/tx/{TRANSACTION_HASH}
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `No hay cuenta conectada` | Usuario no hizo login | Ir a `/login` y conectar |
| `Freighter extension not detected` | Extensión no instalada | Instalar desde freighter.app |
| `Precio inválido` | Precio <= 0 o NaN | Ingresar número positivo |
| `Already voted` | Validador ya votó | Solo se puede votar una vez |
| `Not available` | Planta ya vendida | Listar otra planta |

---

## ✅ CHECKLIST DE TESTING

### Registro de Plantas
- [ ] Registrar planta con propiedades válidas
- [ ] Verificar que aparece en `/plants`
- [ ] Verificar hash en Stellar Explorer

### Votación
- [ ] Votar como validador
- [ ] Verificar incremento de contador
- [ ] Intentar votar dos veces (debe fallar)

### Marketplace
- [ ] Listar planta con precio válido
- [ ] Verificar que aparece en listings
- [ ] Comprar planta
- [ ] Verificar que `available: false` después de compra

### Queries
- [ ] Consultar planta por ID
- [ ] Verificar contador de votos
- [ ] Verificar estado de validator

---

## 📚 RECURSOS

- **Stellar Docs:** https://developers.stellar.org/
- **Soroban Docs:** https://soroban.stellar.org/docs
- **Freighter Wallet:** https://freighter.app
- **Stellar Explorer:** https://stellar.expert/explorer/testnet
- **Laboratory:** https://laboratory.stellar.org/

---

**Última actualización:** 10 de Diciembre, 2025  
**Autor:** HerbaMed Team
