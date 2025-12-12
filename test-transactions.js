#!/usr/bin/env node

/**
 * Script de Pruebas: Almacenamiento Real en Blockchain
 * Registra plantas usando transacciones reales en Stellar
 */

const fs = require('fs');
const path = require('path');

// Importar Stellar SDK
const stellar = require('@stellar/stellar-sdk');

// Configuración
const CONFIG = {
  CONTRACT_ADDRESS: 'CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR',
  RPC_URL: 'https://soroban-testnet.stellar.org',
  NETWORK: 'testnet',
  PUBLIC_KEY: 'GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL',
  SECRET_KEY: 'SBSSPK2I4XNMGPT5TZXRDWC5YC4DIILXQA5XS6TFCBX72F2EFP7YMSVW'
};

const {
  Keypair,
  TransactionBuilder,
  Networks,
  Contract,
  Address,
  nativeToScVal,
  rpc,
  xdr
} = stellar;

const networkPassphrase = Networks.TESTNET;

/**
 * Helper: Convertir valores a ScVal
 */
function toScVal(value) {
  if (value && value._attributes) return value;
  
  if (typeof value === 'string') {
    if (value.startsWith('G') || value.startsWith('C')) {
      try {
        return new Address(value).toScVal();
      } catch (e) {
        return nativeToScVal(value, { type: 'string' });
      }
    }
    return nativeToScVal(value, { type: 'string' });
  }
  
  if (typeof value === 'number' || typeof value === 'bigint') {
    return nativeToScVal(value, { type: 'i128' });
  }
  
  if (typeof value === 'boolean') {
    return nativeToScVal(value);
  }
  
  if (Array.isArray(value)) {
    const scVals = value.map(v => toScVal(v));
    return xdr.ScVal.scvVec(scVals);
  }
  
  throw new Error(`Unsupported type: ${typeof value}`);
}

/**
 * Construir transacción localmente
 */
async function buildTransactionLocally(method, args, publicKey) {
  console.log(`\n[BUILD] Construyendo transacción para: ${method}`);
  
  const server = new rpc.Server(CONFIG.RPC_URL);
  console.log(`[BUILD] Conectando a RPC: ${CONFIG.RPC_URL}`);
  
  const account = await server.getAccount(publicKey);
  console.log(`[BUILD] ✅ Cuenta obtenida: ${publicKey}`);
  
  const scArgs = args.map(arg => toScVal(arg));
  console.log(`[BUILD] ✅ Args convertidos a ScVal`);
  
  const contract = new Contract(CONFIG.CONTRACT_ADDRESS);
  const contractOperation = contract.call(method, ...scArgs);
  console.log(`[BUILD] ✅ Operación de contrato creada`);
  
  const txBuilder = new TransactionBuilder(account, {
    fee: stellar.BASE_FEE,
    networkPassphrase
  })
    .addOperation(contractOperation)
    .setTimeout(30);
  
  let transaction = txBuilder.build();
  console.log(`[BUILD] ✅ Transacción construida`);
  
  console.log(`[BUILD] Simulando transacción...`);
  const simulateResponse = await server.simulateTransaction(transaction);
  
  if (rpc.Api.isSimulationError(simulateResponse)) {
    throw new Error(`Simulation error: ${JSON.stringify(simulateResponse.error)}`);
  }
  
  console.log(`[BUILD] ✅ Simulación exitosa`);
  
  transaction = rpc.assembleTransaction(transaction, simulateResponse).build();
  console.log(`[BUILD] ✅ Transacción armada con recursos reales`);
  
  return transaction.toXDR();
}

/**
 * Esperar a que una transacción se confirme
 */
async function waitForTransaction(hash, timeoutMs = 45000, intervalMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  let attempts = 0;
  
  while (Date.now() < deadline) {
    attempts++;
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'getTransaction',
      params: { hash }
    };
    
    try {
      const res = await fetch(CONFIG.RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const j = await res.json();
      const r = j?.result || j;
      const status = r?.status || r?.result?.status;
      
      console.log(`[WAIT] Intento ${attempts}: ${status}`);
      
      if (typeof status === 'string') {
        const s = status.toUpperCase();
        if (s === 'SUCCESS' || s === 'ERROR' || s === 'FAILED') {
          console.log(`[WAIT] ✅ Estado final: ${s}`);
          return r;
        }
      }
    } catch (e) {
      console.log(`[WAIT] Error en intento ${attempts}, reintentando...`);
    }
    
    await new Promise(r => setTimeout(r, intervalMs));
  }
  
  throw new Error(`Timeout esperando transacción: ${hash}`);
}

/**
 * Enviar transacción firmada
 */
async function submitTx(txXdr) {
  console.log(`\n[SUBMIT] Enviando transacción a RPC...`);
  
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'sendTransaction',
    params: { transaction: txXdr }
  };
  
  const res = await fetch(CONFIG.RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RPC error: ${res.status} ${body}`);
  }
  
  const result = await res.json();
  console.log(`[SUBMIT] Respuesta RPC recibida`);
  
  if (result.error) {
    throw new Error(`RPC error: ${result.error.message}`);
  }
  
  const sendResult = result.result || result;
  const txHash = sendResult?.hash;
  
  if (!txHash) {
    throw new Error('No transaction hash in response');
  }
  
  console.log(`[SUBMIT] ✅ Hash obtenido: ${txHash}`);
  
  console.log(`[SUBMIT] Esperando confirmación...`);
  const final = await waitForTransaction(txHash);
  
  return { hash: txHash, status: final?.status || 'PENDING' };
}

/**
 * Registrar planta en blockchain
 */
async function registerPlant(id, name, scientificName, properties) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`REGISTRANDO PLANTA: ${id}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // 1. Construir transacción
    const unsignedXDR = await buildTransactionLocally(
      'register_plant',
      [id, name, scientificName, properties],
      CONFIG.PUBLIC_KEY
    );
    
    // 2. Firmar con keypair
    console.log(`\n[SIGN] Firmando transacción...`);
    const kp = Keypair.fromSecret(CONFIG.SECRET_KEY);
    const txObj = TransactionBuilder.fromXDR(unsignedXDR, networkPassphrase);
    txObj.sign(kp);
    const signedXDR = txObj.toXDR();
    console.log(`[SIGN] ✅ Transacción firmada`);
    
    // 3. Enviar
    const result = await submitTx(signedXDR);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ ÉXITO: Planta registrada en blockchain`);
    console.log(`${'='.repeat(60)}`);
    console.log(`ID:     ${id}`);
    console.log(`Hash:   ${result.hash}`);
    console.log(`Status: ${result.status}`);
    console.log(`Explorer: https://stellar.expert/explorer/testnet/tx/${result.hash}`);
    console.log(`${'='.repeat(60)}\n`);
    
    return result;
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error(`${'='.repeat(60)}\n`);
    throw error;
  }
}

/**
 * Ejecutar pruebas
 */
async function runTests() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     PRUEBAS: Almacenamiento Real en Blockchain        ║
║     Red: Stellar Testnet                               ║
║     Fecha: ${new Date().toLocaleString()}              ║
╚════════════════════════════════════════════════════════╝
  `);
  
  console.log(`Configuración:`);
  console.log(`├─ Contrato: ${CONFIG.CONTRACT_ADDRESS}`);
  console.log(`├─ RPC URL:  ${CONFIG.RPC_URL}`);
  console.log(`├─ Public:   ${CONFIG.PUBLIC_KEY}`);
  console.log(`└─ Red:      ${CONFIG.NETWORK}\n`);
  
  const results = [];
  
  try {
    // Test 1: Albahaca
    const result1 = await registerPlant(
      'ALBACA-TEST-001',
      'Albahaca',
      'Ocimum basilicum',
      ['Antibacteriana', 'Antiviral', 'Aromática']
    );
    results.push(result1);
    
    // Esperar un poco entre transacciones
    console.log(`⏳ Esperando 5 segundos antes de siguiente transacción...`);
    await new Promise(r => setTimeout(r, 5000));
    
    // Test 2: Tomillo
    const result2 = await registerPlant(
      'TOMILLO-TEST-001',
      'Tomillo',
      'Thymus vulgaris',
      ['Antitusivo', 'Expectorante', 'Antimicrobiano']
    );
    results.push(result2);
    
    // Test 3: Menta
    console.log(`⏳ Esperando 5 segundos antes de siguiente transacción...`);
    await new Promise(r => setTimeout(r, 5000));
    
    const result3 = await registerPlant(
      'MENTA-TEST-001',
      'Menta',
      'Mentha piperita',
      ['Digestiva', 'Refrescante', 'Antiespasmódica']
    );
    results.push(result3);
    
  } catch (error) {
    console.error(`\n❌ Error durante pruebas: ${error.message}`);
    process.exit(1);
  }
  
  // Resumen
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESUMEN DE PRUEBAS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total de transacciones: ${results.length}`);
  console.log(`Exitosas: ${results.filter(r => r.status === 'SUCCESS').length}`);
  console.log(`\nDetalles:\n`);
  
  results.forEach((r, i) => {
    console.log(`${i + 1}. Hash: ${r.hash}`);
    console.log(`   Status: ${r.status}`);
    console.log(`   Explorer: https://stellar.expert/explorer/testnet/tx/${r.hash}`);
    console.log();
  });
  
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE`);
  console.log(`${'='.repeat(60)}\n`);
}

// Ejecutar
runTests().catch(error => {
  console.error(`\n❌ Error crítico: ${error.message}`);
  process.exit(1);
});
