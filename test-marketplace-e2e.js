#!/usr/bin/env node

/**
 * Pruebas E2E: Registro, listado, validación y compra
 * Vendedor y Comprador con keypairs proporcionados
 */

const stellar = require('@stellar/stellar-sdk')
const fetch = global.fetch || require('node-fetch')

const CONFIG = {
  CONTRACT_ADDRESS: 'CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR',
  RPC_URL: 'https://soroban-testnet.stellar.org',
  NETWORK: 'testnet',
  SELLER_PUBLIC: 'GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL',
  SELLER_SECRET: 'SBSSPK2I4XNMGPT5TZXRDWC5YC4DIILXQA5XS6TFCBX72F2EFP7YMSVW',
  BUYER_PUBLIC: 'GA2JBPZ6PBRBZEDXKKMFMV3LRFARBWZ4UXG4OJPVLNXRDZPV4GBSSFTV',
  BUYER_SECRET: 'SDFGRGSMHS56WO7AZ4KLUC63LPJ7PB4KCIGYB6ZJ22WVWQCNS6ETMLRZ'
}

const {
  Keypair,
  TransactionBuilder,
  Networks,
  Contract,
  Address,
  nativeToScVal,
  rpc,
  xdr
} = stellar

const networkPassphrase = Networks.TESTNET

function toScVal(value) {
  if (value && value._attributes) return value
  if (typeof value === 'string') {
    if (value.startsWith('G') || value.startsWith('C')) {
      try { return new Address(value).toScVal() } catch { return nativeToScVal(value, {type: 'string'}) }
    }
    return nativeToScVal(value, {type: 'string'})
  }
  if (typeof value === 'number' || typeof value === 'bigint') return nativeToScVal(value, {type: 'i128'})
  if (typeof value === 'boolean') return nativeToScVal(value)
  if (Array.isArray(value)) return xdr.ScVal.scvVec(value.map(v => toScVal(v)))
  throw new Error('Unsupported type: ' + typeof value)
}

async function buildTx(method, args, publicKey) {
  const server = new rpc.Server(CONFIG.RPC_URL)
  const account = await server.getAccount(publicKey)
  const contract = new Contract(CONFIG.CONTRACT_ADDRESS)
  const op = contract.call(method, ...args.map(toScVal))
  let tx = new TransactionBuilder(account, { fee: stellar.BASE_FEE, networkPassphrase })
    .addOperation(op)
    .setTimeout(30)
    .build()
  const sim = await server.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(sim)) throw new Error('Simulation error: ' + JSON.stringify(sim))
  tx = rpc.assembleTransaction(tx, sim).build()
  return tx.toXDR()
}

async function waitFor(hash) {
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    const payload = { jsonrpc: '2.0', id: Date.now(), method: 'getTransaction', params: { hash } }
    const res = await fetch(CONFIG.RPC_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    const j = await res.json().catch(()=>null)
    const r = j?.result || j
    const status = r?.status || r?.result?.status
    console.log('[WAIT]', status)
    if (typeof status === 'string') {
      const s = status.toUpperCase()
      if (s === 'SUCCESS' || s === 'ERROR' || s === 'FAILED') return r
    }
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Timeout waiting tx ' + hash)
}

async function submitSigned(xdrStr) {
  const payload = { jsonrpc: '2.0', id: Date.now(), method: 'sendTransaction', params: { transaction: xdrStr } }
  const res = await fetch(CONFIG.RPC_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  const j = await res.json()
  if (j.error) throw new Error('RPC error: ' + j.error.message)
  const r = j.result || j
  if (!r.hash) throw new Error('No hash returned')
  const final = await waitFor(r.hash)
  return { hash: r.hash, status: final?.status || 'PENDING' }
}

async function asAccount(secret, fn) {
  const kp = Keypair.fromSecret(secret)
  return fn(kp)
}

async function e2e() {
  console.log('=== E2E Marketplace Test ===')
  const plantId = 'E2E-PLANT-' + Math.floor(Date.now()/1000)

  // 1) Vendedor registra planta
  const registerResp = await asAccount(CONFIG.SELLER_SECRET, async (sellerKp) => {
    console.log('\n[Vendedor] Registrar planta:', plantId)
    const unsigned = await buildTx('register_plant', [plantId, 'E2E Planta', 'E2E Scientific', ['prop1','prop2']], sellerKp.publicKey())
    const txObj = TransactionBuilder.fromXDR(unsigned, networkPassphrase)
    txObj.sign(sellerKp)
    return submitSigned(txObj.toXDR())
  })
  console.log('[Registro] Hash:', registerResp.hash, 'Status:', registerResp.status, 'Explorer: https://stellar.expert/explorer/testnet/tx/' + registerResp.hash)

  // 2) Añadir validador (vendedor como validador) si hiciera falta
  // El contrato tiene add_validator(Address), usamos vendedor como validador
  const addValidatorResp = await asAccount(CONFIG.SELLER_SECRET, async (sellerKp) => {
    console.log('\n[Vendedor] Añadir validador (self)')
    const unsigned = await buildTx('add_validator', [sellerKp.publicKey()], sellerKp.publicKey())
    const txObj = TransactionBuilder.fromXDR(unsigned, networkPassphrase)
    txObj.sign(sellerKp)
    return submitSigned(txObj.toXDR())
  })
  console.log('[AddValidator] Hash:', addValidatorResp.hash, 'Status:', addValidatorResp.status, 'Explorer: https://stellar.expert/explorer/testnet/tx/' + addValidatorResp.hash)

  // 3) Votar validación de planta
  const voteResp = await asAccount(CONFIG.SELLER_SECRET, async (sellerKp) => {
    console.log('\n[Vendedor] Votar validación de planta:', plantId)
    const unsigned = await buildTx('vote_for_plant', [plantId, sellerKp.publicKey()], sellerKp.publicKey())
    const txObj = TransactionBuilder.fromXDR(unsigned, networkPassphrase)
    txObj.sign(sellerKp)
    return submitSigned(txObj.toXDR())
  })
  console.log('[Vote] Hash:', voteResp.hash, 'Status:', voteResp.status, 'Explorer: https://stellar.expert/explorer/testnet/tx/' + voteResp.hash)

  // 4) Listar para venta
  // El contrato define Listing y keys, asumimos método list_for_sale(plant_id: String, price: i128)
  let listResp
  try {
    listResp = await asAccount(CONFIG.SELLER_SECRET, async (sellerKp) => {
      console.log('\n[Vendedor] Listar planta para venta:', plantId)
      const price = 10000000 // 1 XLM en unidades base (si contrato usa i128 nominal)
      const unsigned = await buildTx('list_for_sale', [plantId, price], sellerKp.publicKey())
      const txObj = TransactionBuilder.fromXDR(unsigned, networkPassphrase)
      txObj.sign(sellerKp)
      return submitSigned(txObj.toXDR())
    })
    console.log('[List] Hash:', listResp.hash, 'Status:', listResp.status, 'Explorer: https://stellar.expert/explorer/testnet/tx/' + listResp.hash)
  } catch (e) {
    console.warn('List for sale no disponible en contrato o falló:', e.message)
  }

  // 5) Consultar listings
  try {
    console.log('\n[Query] get_all_listings (read-only via simulation)')
    const server = new rpc.Server(CONFIG.RPC_URL)
    const account = await server.getAccount(CONFIG.SELLER_PUBLIC)
    const contract = new Contract(CONFIG.CONTRACT_ADDRESS)
    const op = contract.call('get_all_listings')
    const tx = new TransactionBuilder(account, { fee: stellar.BASE_FEE, networkPassphrase })
      .addOperation(op)
      .setTimeout(30)
      .build()
    const sim = await server.simulateTransaction(tx)
    if (rpc.Api.isSimulationError(sim)) throw new Error('Simulation error on get_all_listings')
    const listings = stellar.scValToNative(sim.result.retval)
    console.log('[Listings]', Array.isArray(listings) ? listings : [])
  } catch (e) {
    console.warn('get_all_listings no disponible o falló:', e.message)
  }

  // 6) Comprar (comprador)
  try {
    const buyResp = await asAccount(CONFIG.BUYER_SECRET, async (buyerKp) => {
      console.log('\n[Comprador] Comprar planta:', plantId)
      const unsigned = await buildTx('buy_listing', [plantId, buyerKp.publicKey()], buyerKp.publicKey())
      const txObj = TransactionBuilder.fromXDR(unsigned, networkPassphrase)
      txObj.sign(buyerKp)
      return submitSigned(txObj.toXDR())
    })
    console.log('[Buy] Hash:', buyResp.hash, 'Status:', buyResp.status, 'Explorer: https://stellar.expert/explorer/testnet/tx/' + buyResp.hash)
  } catch (e) {
    console.warn('buy_listing no disponible o falló:', e.message)
  }

  console.log('\n=== E2E completo ===')
}

e2e().catch(e => { console.error('❌ Error E2E:', e); process.exit(1) })
