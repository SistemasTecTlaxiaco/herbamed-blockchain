import * as stellar from '@stellar/stellar-sdk'
import { CONTRACT_ADDRESS, RPC_URL, NETWORK, SECRET_KEY, TX_BUILDER_URL } from './config.js'

// Importar directamente las clases que necesitamos
const Keypair = stellar.Keypair
const TransactionBuilder = stellar.TransactionBuilder
const Networks = stellar.Networks
const Transaction = stellar.Transaction
const Contract = stellar.Contract
const Address = stellar.Address
const rpc = stellar.rpc  // ✅ CORRECTO: es 'rpc' minúscula, no 'SorobanRpc'
const nativeToScVal = stellar.nativeToScVal
const scValToNative = stellar.scValToNative
const xdr = stellar.xdr

// Soroban client helpers for blockchain operations
const LOCAL_SECRET_KEY = 'soroban_secret'

const networkPassphrase = (typeof NETWORK !== 'undefined' && NETWORK === 'testnet') ? Networks.TESTNET : Networks.PUBLIC

async function buildUnsignedXDR(operation, publicKey) {
  // Try builder service if configured
  const builderBase = TX_BUILDER_URL ? TX_BUILDER_URL.replace(/\/$/, '') : null
  if (!builderBase) return null

  // try /build_invoke first
  try {
    const invokeUrl = `${builderBase}/build_invoke`
    const res = await fetch(invokeUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contractId: operation.contractId || CONTRACT_ADDRESS, method: operation.method, args: operation.args || [], publicKey, network: NETWORK }) })
    if (res.ok) {
      const j = await res.json()
      if (j && j.xdr) return j.xdr
    }
  } catch (e) {
    // ignore and try build_tx
  }

  try {
    const txUrl = `${builderBase}/build_tx`
    const res = await fetch(txUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contractId: operation.contractId || CONTRACT_ADDRESS, method: operation.method, args: operation.args || [], publicKey, network: NETWORK }) })
    if (res.ok) {
      const j = await res.json()
      if (j && j.xdr) return j.xdr
    }
  } catch (e) {
    // fall through
  }

  return null
}

function getLocalKeypair() {
  // prefer SECRET_KEY from env-like config, otherwise localStorage secret
  try {
    if (SECRET_KEY) return Keypair.fromSecret(SECRET_KEY)
  } catch (_) {}
  try {
    const s = getLocalSecret()
    if (s) return Keypair.fromSecret(s)
  } catch (_) {}
  return null
}


export function setLocalSecret(secret) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(LOCAL_SECRET_KEY, secret)
  }
}

export function getLocalSecret() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(LOCAL_SECRET_KEY) || ''
  }
  return ''
}

export async function connectWallet(retries = 3) {
  if (typeof window === 'undefined') return null

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`[Freighter] Intento ${attempt}/${retries}...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }

      // Get the correct Freighter API variant
      const api = getFreighterAPI()
      
      if (!api) {
        throw new Error('Freighter extension not detected. Please install from https://freighter.app')
      }
      
      // Verificar que la API tenga getPublicKey
      if (typeof api.getPublicKey !== 'function') {
        throw new Error('Freighter API incomplete - getPublicKey not available yet')
      }

      // Request public key (this triggers permission popup in Freighter)
      const pk = await api.getPublicKey()
      if (!pk) throw new Error('No public key returned - did you reject the request?')
      
      console.log('[Freighter] ✅ Conectado exitosamente')
      return pk
    } catch (e) {
      console.error(`[Freighter] Intento ${attempt} fallido:`, e.message)
      if (attempt === retries) {
        throw e
      }
    }
  }
}

export async function submitTx(txXdr) {
  // Submit a signed XDR to Soroban RPC using JSON-RPC 2.0 protocol
  try {
    console.log('[submitTx] Enviando transacción a:', RPC_URL)
    
    // Soroban RPC usa JSON-RPC 2.0, no REST
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'sendTransaction',
      params: {
        transaction: txXdr
      }
    }
    
    const res = await fetch(RPC_URL, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    })
    
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`RPC send failed: ${res.status} ${res.statusText} ${body}`)
    }
    
    const result = await res.json()
    console.log('[submitTx] Respuesta RPC:', result)
    
    // JSON-RPC 2.0 format: {jsonrpc, id, result} o {jsonrpc, id, error}
    if (result.error) {
      throw new Error(`RPC error: ${result.error.message || JSON.stringify(result.error)}`)
    }
    
    return result.result || result
  } catch (e) {
    console.error('[submitTx] Error:', e)
    throw e
  }
}

// Helper to convert JS values to Soroban scVal types
function toScVal(value) {
  // Si ya es un ScVal, devolverlo directamente
  if (value && value._attributes) {
    return value
  }
  
  // Manejar strings (incluyendo addresses)
  if (typeof value === 'string') {
    // Check if it's an address (starts with G or C)
    if (value.startsWith('G') || value.startsWith('C')) {
      try {
        return new Address(value).toScVal()
      } catch (e) {
        // If not a valid address, treat as string
        return nativeToScVal(value, { type: 'string' })
      }
    }
    // String normal - usar nativeToScVal que NO requiere Buffer
    return nativeToScVal(value, { type: 'string' })
  }
  
  // Manejar números
  if (typeof value === 'number' || typeof value === 'bigint') {
    return nativeToScVal(value, { type: 'i128' })
  }
  
  // Manejar booleanos
  if (typeof value === 'boolean') {
    return nativeToScVal(value)
  }
  
  // Manejar arrays
  if (Array.isArray(value)) {
    const scVals = value.map(v => toScVal(v))
    return xdr.ScVal.scvVec(scVals)
  }
  
  throw new Error(`Unsupported type for value: ${typeof value}, value: ${value}`)
}

// Build transaction locally using Stellar SDK
async function buildTransactionLocally(operation, sourcePublicKey) {
  try {
    console.log('[buildTransactionLocally] Construyendo transacción para:', operation.method)
    console.log('[buildTransactionLocally] Args:', operation.args)
    
    const contractAddress = operation.contractId || CONTRACT_ADDRESS
    
    // Verificar que rpc existe
    if (!rpc || !rpc.Server) {
      throw new Error('rpc.Server no está disponible en el SDK')
    }
    
    const server = new rpc.Server(RPC_URL)
    console.log('[buildTransactionLocally] Servidor RPC creado:', RPC_URL)
    
    // Get source account
    const sourceAccount = await server.getAccount(sourcePublicKey)
    console.log('[buildTransactionLocally] Cuenta obtenida:', sourcePublicKey)
    
    // Convert args to ScVal
    const scArgs = (operation.args || []).map(arg => {
      const scVal = toScVal(arg)
      console.log('[buildTransactionLocally] Arg convertido:', arg, '→', scVal)
      return scVal
    })
    
    // Create contract
    const contract = new Contract(contractAddress)
    console.log('[buildTransactionLocally] Contrato creado:', contractAddress)
    
    // Build the operation
    let contractOperation
    if (operation.method) {
      contractOperation = contract.call(operation.method, ...scArgs)
    } else {
      throw new Error('Method name is required')
    }
    
    // Build transaction
    const txBuilder = new TransactionBuilder(sourceAccount, {
      fee: stellar.BASE_FEE,
      networkPassphrase
    })
      .addOperation(contractOperation)
      .setTimeout(30)
    
    let transaction = txBuilder.build()
    console.log('[buildTransactionLocally] Transacción construida, simulando...')
    
    // Simulate to get the correct resource fees
    console.log('[buildTransactionLocally] Simulando transacción...')
    const simulateResponse = await server.simulateTransaction(transaction)
    
    if (rpc.Api.isSimulationError(simulateResponse)) {
      console.error('[buildTransactionLocally] Simulation error:', simulateResponse)
      throw new Error(`Simulation failed: ${simulateResponse.error}`)
    }
    
    // Prepare the transaction with simulation results
    transaction = rpc.assembleTransaction(transaction, simulateResponse).build()
    
    console.log('[buildTransactionLocally] Transacción construida exitosamente')
    return transaction.toXDR()
    
  } catch (error) {
    console.error('[buildTransactionLocally] Error:', error)
    throw error
  }
}

// High-level helper: submit an operation (object with method/args/contractId)
export async function submitOperation(operation = {}) {
  // Determine signer
  const publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
  if (!publicKey) throw new Error('No public key available to build transaction')

  console.log('[submitOperation] Operación:', operation.method, 'Args:', operation.args)

  // Build unsigned XDR - try local build first, then builder service
  let unsignedXDR = null
  
  try {
    // PRIMARY: Build locally using Stellar SDK
    console.log('[submitOperation] Construyendo transacción localmente...')
    unsignedXDR = await buildTransactionLocally(operation, publicKey)
  } catch (localError) {
    console.warn('[submitOperation] Error en construcción local:', localError.message)
    
    // FALLBACK: Try builder service if configured
    if (TX_BUILDER_URL) {
      console.log('[submitOperation] Intentando builder service...')
      unsignedXDR = await buildUnsignedXDR(operation, publicKey)
    }
  }

  if (!unsignedXDR) {
    throw new Error('Unable to build unsigned transaction: local build and builder service failed')
  }

  console.log('[submitOperation] XDR sin firmar obtenido, procediendo a firmar...')

  // Sign the unsigned XDR: prefer Freighter
  let signedXDR = null
  const api = getFreighterAPI()
  
  if (api && typeof api.signTransaction === 'function') {
    try {
      console.log('[submitOperation] Firmando con Freighter...')
      const signed = await api.signTransaction(unsignedXDR, networkPassphrase)
      signedXDR = typeof signed === 'string' ? signed : (signed && signed.signed_envelope_xdr) ? signed.signed_envelope_xdr : null
      console.log('[submitOperation] ✅ Firmado con Freighter')
    } catch (e) {
      console.warn('[submitOperation] Error firmando con Freighter:', e.message)
      // fall through to local keypair
    }
  }

  if (!signedXDR) {
    console.log('[submitOperation] Firmando con keypair local...')
    const kp = getLocalKeypair()
    if (!kp) throw new Error('No signer available (Freighter or local key)')
    const txObj = TransactionBuilder.fromXDR(unsignedXDR, networkPassphrase)
    txObj.sign(kp)
    signedXDR = txObj.toXDR()
    console.log('[submitOperation] ✅ Firmado con keypair local')
  }

  // Submit signed XDR
  console.log('[submitOperation] Enviando transacción a RPC...')
  const result = await submitTx(signedXDR)
  console.log('[submitOperation] ✅ Transacción enviada:', result)
  return result
}

export async function registerPlant(plantData) {
  // Register plant in blockchain via contract
  // Contract signature: register_plant(id: String, name: String, scientific_name: String, properties: Vec<String>)
  const plant = plantData || {}
  const id = plant.id || `PLANT-${Date.now()}`
  const name = plant.name || ''
  const scientificName = plant.scientificName || plant.scientific_name || ''
  const properties = Array.isArray(plant.properties) ? plant.properties : []
  
  console.log('[registerPlant] Enviando:', { id, name, scientificName, properties })
  
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'register_plant', 
    args: [id, name, scientificName, properties] 
  })
  
  // Guardar ID en localStorage para poder listar después
  addRegisteredPlantId(id)
  
  return { success: true, plantId: id, transactionHash: resp?.hash || 'pending' }
}

// LocalStorage helpers para rastrear plantas registradas
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

export async function getAllPlants() {
  // Query contract for all registered plants
  // Como el contrato no tiene get_all_plants, consultamos cada ID registrado
  const plantIds = getRegisteredPlantIds()
  console.log('[getAllPlants] IDs registrados localmente:', plantIds)
  
  const plants = []
  for (const id of plantIds) {
    try {
      const plant = await getPlant(id)
      if (plant) {
        plants.push(plant)
      }
    } catch (e) {
      console.error(`[getAllPlants] Error al cargar planta ${id}:`, e)
    }
  }
  
  console.log('[getAllPlants] Plantas cargadas:', plants.length)
  return plants
}

export async function getPlant(plantId) {
  // Query contract for specific plant (read-only)
  // Contract signature: get_plant(id: String) -> Option<MedicinalPlant>
  try {
    console.log('[getPlant] Consultando planta:', plantId)
    
    // Para queries read-only, usamos simulación sin firmar/enviar
    const server = new rpc.Server(RPC_URL)
    const contract = new Contract(CONTRACT_ADDRESS)
    const publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
    
    if (!publicKey) {
      console.warn('[getPlant] No hay cuenta conectada, usando cuenta dummy')
      // Usar cuenta dummy para query
      const dummyKeypair = Keypair.random()
      const sourceAccount = await server.getAccount(dummyKeypair.publicKey())
    }
    
    const account = await server.getAccount(publicKey)
    const args = [nativeToScVal(plantId, {type: 'string'})]
    
    const contractOperation = contract.call('get_plant', ...args)
    const txBuilder = new TransactionBuilder(account, {
      fee: stellar.BASE_FEE,
      networkPassphrase
    })
      .addOperation(contractOperation)
      .setTimeout(30)
    
    const transaction = txBuilder.build()
    const simulateResponse = await server.simulateTransaction(transaction)
    
    if (rpc.Api.isSimulationError(simulateResponse)) {
      console.error('[getPlant] Simulation error:', simulateResponse)
      return null
    }
    
    // Parse result from simulation
    if (simulateResponse.result && simulateResponse.result.retval) {
      const result = simulateResponse.result.retval
      console.log('[getPlant] Resultado:', result)
      
      // Convert ScVal to JS object
      // MedicinalPlant { id, name, scientific_name, properties, validated, validator }
      if (result._switch && result._switch.name === 'scvVec') {
        const plant = scValToNative(result)
        console.log('[getPlant] Planta encontrada:', plant)
        return plant
      }
    }
    
    return null
  } catch (e) {
    console.error('[getPlant] Error:', e)
    return null
  }
}

export async function voteForPlant(plantId) {
  // Contract signature: vote_for_plant(plant_id: String, validator: Address)
  // El validator debe ser la cuenta conectada
  const publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
  if (!publicKey) throw new Error('No hay cuenta conectada para votar')
  
  console.log('[voteForPlant] Votando por planta:', plantId, 'con validador:', publicKey)
  
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'vote_for_plant', 
    args: [plantId, publicKey] 
  })
  
  return { success: true, plantId, transactionHash: resp?.hash || 'pending' }
}

export function isFreighterInstalled() {
  if (typeof window === 'undefined') return false
  // Check for Freighter's injected API (multiple patterns for different versions)
  const detected = !!(
    window.freighterApi ||
    window.freighterAPI ||
    window.stellar?.isConnected ||
    window.stellar?.freighter ||
    window.freighter ||
    window.__stellarFreighter
  )
  
  if (detected) {
    console.log('[Freighter] API detectada:', {
      freighterApi: !!window.freighterApi,
      freighterAPI: !!window.freighterAPI,
      stellar_isConnected: !!window.stellar?.isConnected,
      stellar_freighter: !!window.stellar?.freighter,
      freighter: !!window.freighter,
      __stellarFreighter: !!window.__stellarFreighter,
      freighterApi_getPublicKey: typeof window.freighterApi?.getPublicKey,
      stellar_getPublicKey: typeof window.stellar?.getPublicKey
    })
  }
  
  return detected
}

// Helper to detect the correct Freighter API variant
function getFreighterAPI() {
  if (typeof window === 'undefined') return null
  // Primero intenta obtener la API que tenga getPublicKey
  if (window.freighterApi?.getPublicKey) return window.freighterApi
  if (window.freighterAPI?.getPublicKey) return window.freighterAPI
  if (window.stellar?.getPublicKey) return window.stellar
  if (window.freighter?.getPublicKey) return window.freighter
  if (window.__stellarFreighter?.getPublicKey) return window.__stellarFreighter
  
  // Si no encuentra con getPublicKey, devuelve cualquier objeto Freighter que exista
  // (puede que getPublicKey se agregue después)
  if (window.freighterApi) return window.freighterApi
  if (window.freighterAPI) return window.freighterAPI
  if (window.stellar?.request) return window.stellar
  if (window.freighter) return window.freighter
  if (window.__stellarFreighter) return window.__stellarFreighter
  
  return null
}

// Helper to wait for Freighter injection (called once on app mount)
export function waitForFreighterInjection() {
  return new Promise((resolve) => {
    if (isFreighterInstalled()) {
      console.log('[Freighter] Ya está instalada')
      resolve(true)
      return
    }
    
    // Event listener for active detection
    const handleFreighterReady = () => {
      console.log('[Freighter] Evento freighter#loaded detectado')
      window.removeEventListener('freighter#loaded', handleFreighterReady)
      clearInterval(interval)
      resolve(true)
    }
    
    window.addEventListener('freighter#loaded', handleFreighterReady)
    
    // Poll for max 10 seconds with exponential backoff
    let attempts = 0
    const maxAttempts = 100
    const interval = setInterval(() => {
      if (isFreighterInstalled()) {
        console.log('[Freighter] Detectada tras', attempts * 100, 'ms')
        window.removeEventListener('freighter#loaded', handleFreighterReady)
        clearInterval(interval)
        resolve(true)
        return
      }
      if (attempts++ >= maxAttempts) {
        console.warn('[Freighter] No detectada después de 10 segundos')
        window.removeEventListener('freighter#loaded', handleFreighterReady)
        clearInterval(interval)
        resolve(false)
        return
      }
    }, 100)
  })
}

export async function isRpcAvailable() {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' })
    })
    return res.ok
  } catch (e) {
    return false
  }
}

export function disconnectWallet() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(LOCAL_SECRET_KEY)
  }
}

export function getConnectedPublicKey() {
  if (typeof window !== 'undefined' && window.freighterApi) {
    try { return window.freighterApi.getPublicKey() } catch (e) { /* ignore */ }
  }
  const s = getLocalSecret()
  if (s) {
    try { return Keypair.fromSecret(s).publicKey() } catch (e) { return null }
  }
  return null
}

export async function listForSale(plantId, price) {
  // Contract signature: list_for_sale(plant_id: String, seller: Address, price: i128)
  const publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
  if (!publicKey) throw new Error('No hay cuenta conectada para listar planta')
  
  const priceNum = parseInt(price, 10)
  if (isNaN(priceNum) || priceNum <= 0) throw new Error('Precio inválido')
  
  console.log('[listForSale] Listando planta:', plantId, 'precio:', priceNum, 'vendedor:', publicKey)
  
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'list_for_sale', 
    args: [plantId, publicKey, priceNum] 
  })
  
  return { success: true, plantId, price: priceNum, transactionHash: resp?.hash || 'pending' }
}

export async function buyListing(plantId) {
  // Contract signature: buy_listing(plant_id: String, buyer: Address)
  const publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
  if (!publicKey) throw new Error('No hay cuenta conectada para comprar')
  
  console.log('[buyListing] Comprando planta:', plantId, 'comprador:', publicKey)
  
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'buy_listing', 
    args: [plantId, publicKey] 
  })
  
  return { success: true, plantId, transactionHash: resp?.hash || 'pending' }
}

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

export async function isValidator(address) {
  // Query contract to check if address is validator
  // Contract signature: is_validator(validator: Address) -> bool
  try {
    console.log('[isValidator] Verificando:', address)
    const resp = await submitOperation({ 
      contractId: CONTRACT_ADDRESS, 
      method: 'is_validator', 
      args: [address],
      readOnly: true
    })
    return !!resp
  } catch (e) {
    console.error('[isValidator] Error:', e)
    return false
  }
}

export default {
  setLocalSecret,
  getLocalSecret,
  connectWallet,
  submitTx,
  submitOperation,
  registerPlant,
  getAllPlants,
  getPlant,
  voteForPlant,
  listForSale,
  buyListing,
  getListing,
  getPlantVotes,
  isValidator,
  isFreighterInstalled,
  waitForFreighterInjection,
  isRpcAvailable,
  disconnectWallet,
  getConnectedPublicKey
}
