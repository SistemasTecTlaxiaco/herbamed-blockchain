#!/usr/bin/env node

/**
 * Prueba E2E UI: Registro de planta para verificar auto-actualización
 * Vendedor registra planta y verifica que aparece en la lista
 */

const stellar = require('@stellar/stellar-sdk')
const fetch = global.fetch || require('node-fetch')

const CONFIG = {
  CONTRACT_ADDRESS: 'CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR',
  RPC_URL: 'https://soroban-testnet.stellar.org',
  NETWORK: 'testnet',
  SELLER_PUBLIC: 'GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL',
  SELLER_SECRET: 'SBSSPK2I4XNMGPT5TZXRDWC5YC4DIILXQA5XS6TFCBX72F2EFP7YMSVW'
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

async function testRegisterPlant() {
  console.log('=== Test: Registro de Planta para Verificar Auto-actualización ===\n')
  
  const timestamp = Math.floor(Date.now()/1000)
  const plantId = `UI-TEST-${timestamp}`
  
  console.log('📝 Registrando planta:', plantId)
  console.log('👤 Vendedor:', CONFIG.SELLER_PUBLIC)
  
  const sellerKp = Keypair.fromSecret(CONFIG.SELLER_SECRET)
  
  const plantData = {
    id: plantId,
    name: 'Planta de Prueba UI',
    scientific_name: 'Plantus testius',
    properties: ['Prueba 1', 'Prueba 2', 'Prueba 3']
  }
  
  console.log('\n🔄 Construyendo transacción...')
  const unsigned = await buildTx('register_plant', [
    plantData.id,
    plantData.name,
    plantData.scientific_name,
    plantData.properties
  ], sellerKp.publicKey())
  
  console.log('✍️  Firmando transacción...')
  const txObj = TransactionBuilder.fromXDR(unsigned, networkPassphrase)
  txObj.sign(sellerKp)
  
  console.log('📤 Enviando transacción...')
  const result = await submitSigned(txObj.toXDR())
  
  console.log('\n✅ RESULTADO:')
  console.log('   Hash:', result.hash)
  console.log('   Status:', result.status)
  console.log('   Explorer: https://stellar.expert/explorer/testnet/tx/' + result.hash)
  
  console.log('\n📋 INSTRUCCIONES PARA VERIFICAR EN UI:')
  console.log('1. Abrir http://127.0.0.1:3000/plants')
  console.log('2. La planta', plantId, 'debe aparecer AUTOMÁTICAMENTE al inicio')
  console.log('3. Si NO aparece, hay un problema de auto-actualización')
  console.log('4. NO debes usar el buscador para verla')
  
  console.log('\n⏰ Espera 3-5 segundos para que la transacción se confirme en blockchain')
  console.log('   Luego refresca la página o cambia de sección y vuelve')
}

testRegisterPlant().catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
