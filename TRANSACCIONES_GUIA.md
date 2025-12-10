# 🔄 Guía de Transacciones en HerbaMed

**Última actualización:** 10 de Diciembre, 2025

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Flujo de Transacciones](#flujo-de-transacciones)
3. [Operaciones Disponibles](#operaciones-disponibles)
4. [Implementación Técnica](#implementación-técnica)
5. [Pruebas en Testnet](#pruebas-en-testnet)

---

## 📖 Descripción General

HerbaMed utiliza **Stellar Testnet** con **Soroban smart contracts** para registrar todas las transacciones en blockchain. Cada operación (registrar planta, votar, comprar) genera una transacción firmada que se envía a la red.

### Arquitectura de Transacciones

```
Usuario (Frontend)
    ↓
Wallet (Freighter/Clave Local)
    ↓
Cliente Soroban (client.js)
    ↓
TX Builder Service (opcional)
    ↓
Firma de Transacción
    ↓
Soroban RPC (Stellar Testnet)
    ↓
Smart Contract
    ↓
Confirmación en Blockchain
```

---

## 🔄 Flujo de Transacciones

### 1. Preparación de la Transacción

```javascript
// Ejemplo: Registrar una planta
const plantData = {
  id: 'MNZ-001',
  name: 'Manzanilla',
  scientificName: 'Matricaria chamomilla',
  properties: ['Antiinflamatoria', 'Calmante', 'Digestiva']
}

// El cliente prepara la operación
const operation = {
  contractId: CONTRACT_ADDRESS,
  method: 'register_plant',
  args: [plantData.id, plantData.name, plantData.scientificName, plantData.properties]
}
```

### 2. Construcción del XDR

```javascript
// Se construye el XDR unsigned (Transaction Envelope)
const unsignedXDR = await buildUnsignedXDR(operation, publicKey)
```

### 3. Firma de la Transacción

**Con Freighter:**
```javascript
const signedXDR = await window.freighterApi.signTransaction(
  unsignedXDR, 
  Networks.TESTNET
)
```

**Con Clave Local:**
```javascript
const tx = new Transaction(unsignedXDR, Networks.TESTNET)
tx.sign(keypair)
const signedXDR = tx.toXDR()
```

### 4. Envío a la Red

```javascript
const response = await fetch(`${RPC_URL}/send_transaction`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tx: signedXDR })
})

const result = await response.json()
// result.hash = transaction hash en blockchain
```

---

## 🛠️ Operaciones Disponibles

### 1. Registrar Planta

**Función del contrato:** `register_plant(env, id: String, name: String, scientific_name: String, properties: Vec<String>) -> String`

**Cliente JS:**
```javascript
import { registerPlant } from '@/soroban/client'

const result = await registerPlant({
  id: 'MNZ-001',
  name: 'Manzanilla',
  scientificName: 'Matricaria chamomilla',
  properties: ['Antiinflamatoria', 'Calmante']
})

console.log('TX Hash:', result.transactionHash)
```

**Requisitos:**
- ✅ Cuenta autenticada (Freighter o clave local)
- ✅ Balance suficiente en testnet (para fees)
- ✅ ID único de planta

**Resultado:**
- Planta registrada en blockchain
- Hash de transacción disponible
- Estado: `validated = false` (pendiente de votos)

---

### 2. Votar por Planta

**Función del contrato:** `vote_for_plant(env, plant_id: String, validator: Address) -> i128`

**Cliente JS:**
```javascript
import { voteForPlant } from '@/soroban/client'

const result = await voteForPlant('MNZ-001')
console.log('Votos actuales:', result)
```

**Requisitos:**
- ✅ Cuenta autenticada
- ✅ Ser validador registrado (o auto-registrarse)
- ✅ No haber votado previamente por esta planta

**Lógica del contrato:**
```rust
// Verifica que no haya votado antes
if voted[plant_id][validator] == true {
  return error_already_voted
}

// Marca como votado
voted[plant_id][validator] = true

// Incrementa contador
votes[plant_id] += 1

// Si > 50% validadores, marca como validada
if votes[plant_id] * 2 > total_validators {
  plant.validated = true
}

return votes[plant_id]
```

**Resultado:**
- Voto registrado en blockchain
- Contador incrementado
- Si alcanza quorum (>50%), planta se valida automáticamente

---

### 3. Listar para Venta

**Función del contrato:** `list_for_sale(env, plant_id: String, seller: Address, price: i128)`

**Cliente JS:**
```javascript
import { listForSale } from '@/soroban/client'

const result = await listForSale('MNZ-001', 1000000) // 1 XLM = 10,000,000 stroops
```

**Requisitos:**
- ✅ Cuenta autenticada
- ✅ Planta registrada previamente
- ✅ Precio en stroops (1 XLM = 10^7 stroops)

**Resultado:**
- Listing creado en blockchain
- Planta visible en Marketplace
- Estado: `available = true`

---

### 4. Comprar Planta

**Función del contrato:** `buy_listing(env, plant_id: String, buyer: Address) -> Result<bool, Error>`

**Cliente JS:**
```javascript
import { buyListing } from '@/soroban/client'

const result = await buyListing('MNZ-001')
console.log('Compra exitosa:', result.success)
```

**Requisitos:**
- ✅ Cuenta autenticada
- ✅ Planta listada (available = true)
- ✅ Balance suficiente para el precio + fees

**Lógica del contrato:**
```rust
// Verifica disponibilidad
if !listing.available {
  return Err(NotAvailable)
}

// Transfiere tokens (placeholder - implementar con Stellar assets)
transfer_tokens(buyer, seller, listing.price)?

// Marca como vendida
listing.available = false

return Ok(true)
```

**Resultado:**
- Transferencia de tokens ejecutada
- Listing marcado como vendido
- Propiedad transferida

---

## 💻 Implementación Técnica

### Archivo Principal: `client.js`

```javascript
// Estructura de submitOperation
async function submitOperation(operation) {
  // 1. Obtener clave pública del usuario conectado
  const publicKey = getConnectedPublicKey()
  
  // 2. Construir XDR unsigned
  const unsignedXDR = await buildUnsignedXDR(operation, publicKey)
  
  // 3. Firmar con Freighter o clave local
  let signedXDR
  if (window.freighterApi) {
    signedXDR = await window.freighterApi.signTransaction(
      unsignedXDR,
      Networks.TESTNET
    )
  } else {
    const keypair = getLocalKeypair()
    const tx = new Transaction(unsignedXDR, Networks.TESTNET)
    tx.sign(keypair)
    signedXDR = tx.toXDR()
  }
  
  // 4. Enviar a RPC
  const response = await submitTx(signedXDR)
  
  return response
}
```

### TX Builder Service (Opcional)

Si está configurado `TX_BUILDER_URL`, se usa un servicio externo para construir XDRs:

```javascript
const response = await fetch(`${TX_BUILDER_URL}/build_invoke`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractId: CONTRACT_ADDRESS,
    method: 'register_plant',
    args: ['MNZ-001', 'Manzanilla', ...],
    publicKey: 'GXXX...',
    network: 'testnet'
  })
})

const { xdr } = await response.json()
```

---

## 🧪 Pruebas en Testnet

### 1. Configuración Inicial

```bash
# Fondear cuenta con Friendbot
curl "https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY"

# Verificar balance
curl "https://horizon-testnet.stellar.org/accounts/YOUR_PUBLIC_KEY"
```

### 2. Ejecutar Transacción de Prueba

**Paso 1: Conectar Wallet**
- Ve a http://127.0.0.1:3000/login
- Conecta con Freighter o importa clave local
- Verifica que aparezca tu balance

**Paso 2: Registrar Planta**
- Ve a "Registrar Planta"
- Completa formulario:
  ```
  ID: TEST-001
  Nombre: Planta de Prueba
  Nombre Científico: Testus Plantae
  Propiedades: [Prueba, Testnet]
  ```
- Click en "Registrar Planta"
- Confirma en Freighter (si usas extensión)
- Espera confirmación

**Paso 3: Verificar en Blockchain**
```bash
# Ver transacción en Stellar Expert
https://stellar.expert/explorer/testnet/tx/TRANSACTION_HASH

# O en Horizon API
curl "https://horizon-testnet.stellar.org/transactions/TRANSACTION_HASH"
```

**Paso 4: Votar por Planta**
- Ve a "Lista de Plantas"
- Encuentra "TEST-001"
- Click en "👍 Votar por esta planta"
- Confirma transacción
- Verifica que el contador de votos incremente

**Paso 5: Listar en Marketplace**
- Ve a "Marketplace"
- Completa formulario:
  ```
  ID de planta: TEST-001
  Precio: 10 XLM
  ```
- Click en "Listar para venta"
- Confirma transacción

**Paso 6: Comprar (con otra cuenta)**
- Cambia a otra cuenta (otra clave o wallet)
- Ve a Marketplace
- Click en "Comprar" en TEST-001
- Confirma transacción

---

## 📊 Estados de Transacción

### Pending
```javascript
{
  status: 'pending',
  hash: null,
  message: 'Transacción en construcción...'
}
```

### Signed
```javascript
{
  status: 'signed',
  hash: 'ABC123...',
  message: 'Firmada, enviando a red...'
}
```

### Confirmed
```javascript
{
  status: 'confirmed',
  hash: 'ABC123...',
  ledger: 12345,
  message: '✅ Confirmada en blockchain'
}
```

### Failed
```javascript
{
  status: 'failed',
  error: 'Insufficient funds',
  message: '❌ Transacción fallida'
}
```

---

## 🔍 Debugging de Transacciones

### Ver Logs en Consola

```javascript
// Activar logs detallados
localStorage.setItem('DEBUG', 'soroban:*')

// En client.js verás:
[registerPlant] Enviando: {...}
[submitOperation] Building XDR...
[submitOperation] Signing with Freighter...
[submitTx] Sending to RPC...
[submitTx] Response: {...}
```

### Verificar en Stellar Expert

```
https://stellar.expert/explorer/testnet/account/YOUR_PUBLIC_KEY
```

Muestra:
- Todas las transacciones
- Balances
- Operaciones ejecutadas
- Contract invocations

### Verificar Balance de Fees

```javascript
import { getBalance } from '@/soroban/balance'

const balance = await getBalance(publicKey)
console.log('Balance:', balance, 'XLM')

// Mínimo recomendado: 10 XLM para fees
```

---

## ⚠️ Errores Comunes

### 1. "Insufficient Funds"
**Causa:** Balance muy bajo para fees  
**Solución:** Fondear con Friendbot

```bash
curl "https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY"
```

### 2. "Transaction Failed: op_already_exists"
**Causa:** Intentando registrar planta con ID duplicado  
**Solución:** Usar ID único

### 3. "Not Authorized"
**Causa:** No estás autenticado  
**Solución:** Conectar wallet en /login

### 4. "Freighter extension not detected"
**Causa:** Extensión no instalada o bloqueada  
**Solución:** Ver FREIGHTER_FIX.md

### 5. "Builder service unavailable"
**Causa:** TX_BUILDER_URL no configurado o caído  
**Solución:** Verificar config o usar construcción local

---

## 🚀 Próximos Pasos

- [ ] Implementar queries con `simulateTransaction` para leer datos
- [ ] Agregar sistema de eventos del contrato
- [ ] Implementar indexación off-chain para listas de plantas
- [ ] Mejorar UI de confirmación de transacciones
- [ ] Agregar estimación de fees antes de enviar
- [ ] Implementar retry automático en fallos de red

---

## 📚 Referencias

- [Stellar SDK JS](https://stellar.github.io/js-stellar-sdk/)
- [Soroban Docs](https://soroban.stellar.org/)
- [Freighter Wallet](https://freighter.app/)
- [Stellar Expert](https://stellar.expert/explorer/testnet)
- [Horizon API](https://developers.stellar.org/api/horizon)
