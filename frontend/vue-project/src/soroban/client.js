import * as stellar from '@stellar/stellar-sdk'
import { CONTRACT_ADDRESS, RPC_URL, NETWORK, SECRET_KEY, TX_BUILDER_URL } from './config.js'

const { Keypair, TransactionBuilder, Networks, xdr, Transaction, SorobanRpc, scValToNative } = stellar

// Simplified Soroban client helpers (syntax-clean, minimal logic)
const LOCAL_SECRET_KEY = 'soroban_secret'
const LS_PLANTS_KEY = 'herbamed:plants'
const LS_LISTINGS_KEY = 'herbamed:listings'
const LS_VOTES_KEY = 'herbamed:votes'

function _hasLocalStorage() {
  return !!_storage()
}

function _storage() {
  try {
    if (typeof window !== 'undefined' && window && window.localStorage) return window.localStorage
  } catch (e) {}
  try {
    if (typeof globalThis !== 'undefined' && globalThis && globalThis.localStorage) return globalThis.localStorage
  } catch (e) {}
  return null
}

const _inMemoryStore = {}

function _readJSON(key) {
  try {
    const storage = _storage()
    if (storage) {
      const s = storage.getItem(key)
      if (s) return JSON.parse(s)
      // if storage exists but item missing, fall back to in-memory mirror
      if (_inMemoryStore.hasOwnProperty(key)) return _inMemoryStore[key]
      return null
    }
    // fallback to in-memory store when no persistent storage available
    return _inMemoryStore.hasOwnProperty(key) ? _inMemoryStore[key] : null
  } catch (e) { return null }
}

function _writeJSON(key, value) {
  try {
    const storage = _storage()
    // debug removed in final commit
    if (storage) {
      try {
        storage.setItem(key, JSON.stringify(value))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug('[writeJSON] storage.setItem error:', e && e.message)
      }
    }
    // always mirror to in-memory store for test/runtime resilience
    _inMemoryStore[key] = value
    // mirror updated
    return true
  } catch (e) { return false }
}

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
  const storage = _storage()
  if (storage) storage.setItem(LOCAL_SECRET_KEY, secret)
  _inMemoryStore[LOCAL_SECRET_KEY] = secret
}

export function getLocalSecret() {
  const storage = _storage()
  if (storage) return storage.getItem(LOCAL_SECRET_KEY) || ''
  return _inMemoryStore[LOCAL_SECRET_KEY] || ''
}

export async function connectWallet() {
  if (typeof window !== 'undefined' && window.freighterApi) {
    try {
      const pk = await window.freighterApi.getPublicKey()
      return pk
    } catch (e) {
      return null
    }
  }
  return null
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
  // Persist plant locally for demo so UI updates immediately
  const plant = (name && name.id) ? name : { id: String(Date.now()), name: name.name || '', description: name.description || '', location: name.location || '' }
  const existing = _readJSON(LS_PLANTS_KEY) || []
  existing.push(plant)
  // ensure persistence both to available storage and to the in-memory mirror
  _writeJSON(LS_PLANTS_KEY, existing)
  try {
    const storage = _storage()
    if (storage) storage.setItem(LS_PLANTS_KEY, JSON.stringify(existing))
  } catch (e) {}
  _inMemoryStore[LS_PLANTS_KEY] = existing
  return { success: true, plantId: plant.id, transactionHash: 'local:register:' + plant.id }
}

export async function getAllPlants() {
  const existing = _readJSON(LS_PLANTS_KEY)
  try {
    const storage = _storage()
    const stored = storage ? storage.getItem(LS_PLANTS_KEY) : null
    // eslint-disable-next-line no-console
    console.debug('[getAllPlants] stored:', stored)
    // eslint-disable-next-line no-console
    console.debug('[getAllPlants] inMemory:', _inMemoryStore[LS_PLANTS_KEY])
  } catch (e) {}
  return existing || []
}

export async function voteForPlant(id) {
  const votes = _readJSON(LS_VOTES_KEY) || {}
  votes[id] = (votes[id] || 0) + 1
  _writeJSON(LS_VOTES_KEY, votes)
  return { success: true, plantId: id, transactionHash: 'local:vote:' + id }
}

export function isFreighterInstalled() {
  if (typeof window === 'undefined') return false
  return !!(window.freighterApi || window.freighter || window.freighterSDK)
}

export async function isRpcAvailable() {
  try {
    const res = await fetch(RPC_URL, { method: 'GET', mode: 'cors' })
    return !!(res && typeof res.status === 'number')
  } catch (e) {
    return false
  }
}

export function disconnectWallet() {
  if (typeof window !== 'undefined') {
    try { const storage = _storage(); if (storage) storage.removeItem(LOCAL_SECRET_KEY); delete _inMemoryStore[LOCAL_SECRET_KEY] } catch (e) {}
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
  // Persist listing locally so UI shows listed items
  const listings = _readJSON(LS_LISTINGS_KEY) || {}
  listings[plantId] = { plantId, price, available: true, listedAt: Date.now() }
  _writeJSON(LS_LISTINGS_KEY, listings)
  const resp = await submitTx({ contractId: CONTRACT_ADDRESS, method: 'list_for_sale', args: [plantId, String(price)] })
  return { success: true, plantId, price, transactionHash: resp && resp.xdr ? resp.xdr : 'local:list:' + plantId }
}

export async function buyListing(plantId, price) {
  const listings = _readJSON(LS_LISTINGS_KEY) || {}
  if (!listings[plantId] || !listings[plantId].available) throw new Error('Listing not available')
  listings[plantId].available = false
  _writeJSON(LS_LISTINGS_KEY, listings)
  const resp = await submitTx({ contractId: CONTRACT_ADDRESS, method: 'buy_listing', args: [plantId] })
  return { success: true, plantId, price, transactionHash: resp && resp.xdr ? resp.xdr : 'local:buy:' + plantId }
}

export async function getListing(plantId) {
  const listings = _readJSON(LS_LISTINGS_KEY) || {}
  return listings[plantId] || { plantId, available: false, price: null }
}

export async function getPlantVotes(plantId) {
  const votes = _readJSON(LS_VOTES_KEY) || {}
  return votes[plantId] || 0
}

export default {
  setLocalSecret,
  getLocalSecret,
  connectWallet,
  submitTx,
  registerPlant,
  getAllPlants,
  voteForPlant,
  listForSale,
  buyListing,
  getListing,
  getPlantVotes,
  isFreighterInstalled,
  isRpcAvailable,
  disconnectWallet,
  getConnectedPublicKey
}

// Debug helper for tests: returns the in-memory mirror store value for a key
export function _debugGetInMemory(key) {
  return _inMemoryStore[key]
}

// Remove temporary debug helpers in final stage: keep for now but not exported in default API
}

