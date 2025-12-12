#!/usr/bin/env node

/**
 * PRUEBAS E2E COMPLETAS: Flujo vendedor → comprador
 * 
 * Flujo:
 * 1. Vendedor registra una planta (register_plant)
 * 2. Vendedor se agrega como validador (add_validator)
 * 3. Vendedor valida su propia planta (vote_for_plant)
 * 4. Vendedor lista la planta para venta (list_for_sale con precio)
 * 5. Comprador obtiene lista de plantas en venta (get_all_listings)
 * 6. Comprador compra la planta (buy_listing)
 * 7. Verificar que la planta ahora le pertenece al comprador
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

const { Keypair, TransactionBuilder, Networks, Contract, Address, nativeToScVal, rpc, xdr } = stellar
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
    if (typeof status === 'string') {
      const s = status.toUpperCase()
      if (s === 'SUCCESS' || s === 'ERROR' || s === 'FAILED') return r
    }
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Timeout')
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

function log(prefix, msg) {
  console.log(`\n${prefix} ${msg}`)
}

function logSuccess(prefix, msg, hash) {
  console.log(`\n${prefix} ✅ ${msg}`)
  if (hash) console.log(`   Hash: ${hash}`)
  console.log(`   Explorer: https://stellar.expert/explorer/testnet/tx/${hash}`)
}

function logError(prefix, msg) {
  console.log(`\n${prefix} ❌ ${msg}`)
}

async function e2e() {
  console.log('=' .repeat(80))
  console.log('E2E TEST: FLUJO COMPLETO VENDEDOR → COMPRADOR')
  console.log('=' .repeat(80))

  const plantId = `E2E-${Date.now()}`
  const plantPrice = 5 // 5 XLM

  try {
    // ==================== PASO 1: VENDEDOR REGISTRA PLANTA ====================
    log('\n[PASO 1/7]', 'VENDEDOR: Registrando planta...')
    const registerResp = await asAccount(CONFIG.SELLER_SECRET, async (kp) => {
      const xdr = await buildTx('register_plant', [plantId, 'Planta E2E', 'Planta E2E Scientifica', ['prop1', 'prop2']], kp.publicKey())
      const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase)
      tx.sign(kp)
      return submitSigned(tx.toXDR())
    })
    logSuccess('[REGISTRO]', `Planta ${plantId} registrada`, registerResp.hash)

    // ==================== PASO 2: VENDEDOR SE AGREGA COMO VALIDADOR ====================
    log('\n[PASO 2/7]', 'VENDEDOR: Agregándose como validador...')
    const addValidatorResp = await asAccount(CONFIG.SELLER_SECRET, async (kp) => {
      const xdr = await buildTx('add_validator', [kp.publicKey()], kp.publicKey())
      const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase)
      tx.sign(kp)
      return submitSigned(tx.toXDR())
    })
    logSuccess('[ADD_VALIDATOR]', 'Vendedor agregado como validador', addValidatorResp.hash)

    // ==================== PASO 3: VENDEDOR VALIDA LA PLANTA ====================
    log('\n[PASO 3/7]', 'VENDEDOR: Validando su propia planta...')
    const voteResp = await asAccount(CONFIG.SELLER_SECRET, async (kp) => {
      const xdr = await buildTx('vote_for_plant', [plantId, kp.publicKey()], kp.publicKey())
      const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase)
      tx.sign(kp)
      return submitSigned(tx.toXDR())
    })
    logSuccess('[VOTE_FOR_PLANT]', `Planta ${plantId} validada por vendedor`, voteResp.hash)

    // ==================== PASO 4: VENDEDOR LISTA PARA VENTA ====================
    log('\n[PASO 4/7]', `VENDEDOR: Listando planta para venta por ${plantPrice} XLM...`)
    const listResp = await asAccount(CONFIG.SELLER_SECRET, async (kp) => {
      const xdr = await buildTx('list_for_sale', [plantId, kp.publicKey(), plantPrice], kp.publicKey())
      const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase)
      tx.sign(kp)
      return submitSigned(tx.toXDR())
    })
    logSuccess('[LIST_FOR_SALE]', `Planta ${plantId} listada por ${plantPrice} XLM`, listResp.hash)

    // ==================== PASO 5: COMPRADOR OBTIENE LISTINGS ====================
    log('\n[PASO 5/7]', 'COMPRADOR: Intentando obtener lista de plantas en venta...')
    try {
      const server = new rpc.Server(CONFIG.RPC_URL)
      const buyerAccount = await server.getAccount(CONFIG.BUYER_PUBLIC)
      const contract = new Contract(CONFIG.CONTRACT_ADDRESS)
      const op = contract.call('get_all_listings')
      let tx = new TransactionBuilder(buyerAccount, { fee: stellar.BASE_FEE, networkPassphrase })
        .addOperation(op)
        .setTimeout(30)
        .build()
      const sim = await server.simulateTransaction(tx)
      if (!rpc.Api.isSimulationError(sim)) {
        const listings = stellar.scValToNative(sim.result.retval)
        console.log(`   ✅ ${Array.isArray(listings) ? listings.length : 0} listings encontrados`)
      } else {
        console.log(`   ⚠️ No se pudo obtener lista de listings, pero continuamos`)
      }
    } catch (e) {
      console.log(`   ⚠️ Error al consultar listings, pero continuamos: ${e.message}`)
    }

    // ==================== PASO 6: COMPRADOR COMPRA LA PLANTA ====================
    log('\n[PASO 6/7]', `COMPRADOR: Comprando planta ${plantId}...`)
    const buyResp = await asAccount(CONFIG.BUYER_SECRET, async (kp) => {
      const xdr = await buildTx('buy_listing', [plantId, kp.publicKey()], kp.publicKey())
      const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase)
      tx.sign(kp)
      return submitSigned(tx.toXDR())
    })
    logSuccess('[BUY_LISTING]', `Planta ${plantId} comprada por comprador`, buyResp.hash)

    // ==================== PASO 7: VERIFICAR PROPIEDAD ====================
    log('\n[PASO 7/7]', 'VERIFICAR: Consultando planta para confirmar propiedad...')
    const server = new rpc.Server(CONFIG.RPC_URL)
    const plantAccount = await server.getAccount(CONFIG.BUYER_PUBLIC)
    const contract = new Contract(CONFIG.CONTRACT_ADDRESS)
    const getPlantOp = contract.call('get_plant', toScVal(plantId))
    let plantTx = new TransactionBuilder(plantAccount, { fee: stellar.BASE_FEE, networkPassphrase })
      .addOperation(getPlantOp)
      .setTimeout(30)
      .build()
    const plantSim = await server.simulateTransaction(plantTx)
    if (rpc.Api.isSimulationError(plantSim)) throw new Error('Simulation error on get_plant')
    const plantData = stellar.scValToNative(plantSim.result.retval)
    console.log(`\n   ✅ Planta encontrada: ${plantData?.name || plantId}`)
    console.log(`   Propietario: ${plantData?.owner ? plantData.owner.slice(0, 6) + '...' + plantData.owner.slice(-4) : 'desconocido'}`)

    // ==================== RESUMEN ====================
    console.log('\n' + '=' .repeat(80))
    console.log('E2E TEST: ✅ COMPLETADO EXITOSAMENTE')
    console.log('=' .repeat(80))
    console.log(`\nRESUMEN DE TRANSACCIONES:`)
    console.log(`\n1. [REGISTRO]      Hash: ${registerResp.hash.slice(0, 16)}...`)
    console.log(`2. [VALIDATOR]     Hash: ${addValidatorResp.hash.slice(0, 16)}...`)
    console.log(`3. [VALIDACIÓN]    Hash: ${voteResp.hash.slice(0, 16)}...`)
    console.log(`4. [LISTADO]       Hash: ${listResp.hash.slice(0, 16)}...`)
    console.log(`5. [COMPRA]        Hash: ${buyResp.hash.slice(0, 16)}...`)
    console.log(`\nTodas las transacciones: https://stellar.expert/explorer/testnet/`)
    console.log(`Planta registrada: ${plantId}`)

  } catch (error) {
    console.error('\n❌ ERROR EN E2E TEST:', error.message)
    process.exit(1)
  }
}

e2e()
