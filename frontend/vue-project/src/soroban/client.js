import * as stellar from '@stellar/stellar-sdk'
import { CONTRACT_ADDRESS, RPC_URL, NETWORK, SECRET_KEY, TX_BUILDER_URL } from './config.js'

const { Keypair, TransactionBuilder, Networks, xdr, Transaction, SorobanRpc, scValToNative } = stellar

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
  // Submit a signed XDR directly to RPC (if txXdr looks like signed envelope)
  try {
    const url = `${RPC_URL.replace(/\/$/, '')}/send_transaction`
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tx: txXdr }) })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`RPC send failed: ${res.status} ${res.statusText} ${body}`)
    }
    return await res.json()
  } catch (e) {
    throw e
  }
}

// High-level helper: submit an operation (object with method/args/contractId)
export async function submitOperation(operation = {}) {
  // Determine signer
  const publicKey = getConnectedPublicKey() || (getLocalKeypair() ? getLocalKeypair().publicKey() : null)
  if (!publicKey) throw new Error('No public key available to build transaction')

  // Build unsigned XDR (prefer builder service)
  let unsignedXDR = null
  if (TX_BUILDER_URL) {
    unsignedXDR = await buildUnsignedXDR(operation, publicKey)
  }

  if (!unsignedXDR) {
    // As a last resort, try to use SorobanRpc transaction building if available
    try {
      if (typeof SorobanRpc !== 'undefined') {
        const rpc = new SorobanRpc(RPC_URL)
        const account = await rpc.getAccount(publicKey)
        const txb = new TransactionBuilder(account, { fee: '10000', networkPassphrase }).setTimeout(30)
        // can't reliably construct host function here without proper SDK helpers; fall back to builder service
      }
    } catch (e) {
      // ignore
    }
    if (!unsignedXDR) throw new Error('Unable to build unsigned transaction: no builder available')
  }

  // Sign the unsigned XDR: prefer Freighter
  let signedXDR = null
  if (typeof window !== 'undefined' && window.freighterApi) {
    try {
      const signed = await window.freighterApi.signTransaction(unsignedXDR, networkPassphrase)
      signedXDR = typeof signed === 'string' ? signed : (signed && signed.signed_envelope_xdr) ? signed.signed_envelope_xdr : null
    } catch (e) {
      // fall through to local keypair
    }
  }

  if (!signedXDR) {
    const kp = getLocalKeypair()
    if (!kp) throw new Error('No signer available (Freighter or local key)')
    const txObj = Transaction.fromXDR(unsignedXDR, networkPassphrase)
    txObj.sign(kp)
    signedXDR = txObj.toXDR()
  }

  // Submit signed XDR
  return await submitTx(signedXDR)
}

export async function registerPlant(name, metadata) {
  // Register plant in blockchain via contract
  const plant = (name && name.id) ? name : { 
    id: String(Date.now()), 
    name: name.name || '', 
    description: name.description || '', 
    location: name.location || '' 
  }
  
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'register_plant', 
    args: [plant.id, plant.name, plant.description, plant.location] 
  })
  
  return { success: true, plantId: plant.id, transactionHash: resp?.hash || 'pending' }
}

export async function getAllPlants() {
  // Query contract for all plants
  // Por ahora retorna array vacío hasta implementar query
  return []
}

export async function voteForPlant(id) {
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'vote_for_plant', 
    args: [id] 
  })
  
  return { success: true, plantId: id, transactionHash: resp?.hash || 'pending' }
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
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'list_for_sale', 
    args: [plantId, String(price)] 
  })
  
  return { success: true, plantId, price, transactionHash: resp?.hash || 'pending' }
}

export async function buyListing(plantId, price) {
  const resp = await submitOperation({ 
    contractId: CONTRACT_ADDRESS, 
    method: 'buy_listing', 
    args: [plantId] 
  })
  
  return { success: true, plantId, price, transactionHash: resp?.hash || 'pending' }
}

export async function getListing(plantId) {
  // Query contract for listing details
  // Por ahora retorna estructura básica
  return { plantId, available: false, price: null }
}

export async function getPlantVotes(plantId) {
  // Query contract for vote count
  // Por ahora retorna 0
  return 0
}

export default {
  setLocalSecret,
  getLocalSecret,
  connectWallet,
  submitTx,
  submitOperation,
  registerPlant,
  getAllPlants,
  voteForPlant,
  listForSale,
  buyListing,
  getListing,
  getPlantVotes,
  isFreighterInstalled,
  waitForFreighterInjection,
  isRpcAvailable,
  disconnectWallet,
  getConnectedPublicKey
}
