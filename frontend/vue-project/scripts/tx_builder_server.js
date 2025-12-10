import express from 'express'
import bodyParser from 'body-parser'
import { TransactionBuilder, Networks, Operation, Account, xdr } from '@stellar/stellar-sdk'
import fs from 'fs'
import path from 'path'

// Load contract ABI (if present)
let ABI = {}
try {
  const abiPath = path.resolve(process.cwd(), '..', '..', 'contracts', 'abi.json')
  if (fs.existsSync(abiPath)) {
    ABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'))
    console.log('Loaded contract ABI from', abiPath)
  }
} catch (e) {
  console.warn('Could not load ABI:', e.message || e)
}

const app = express()
app.use(bodyParser.json())
// Allow simple CORS for local development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.post('/build_tx', async (req, res) => {
  try {
    let { contractId, method, args = [], publicKey, sequence, network = 'testnet' } = req.body
    if (!publicKey) return res.status(400).json({ error: 'publicKey is required' })
    const networkPassphrase = network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC

    // If sequence not provided, fetch from Horizon
    if (!sequence) {
      const horizonUrl = network === 'testnet' ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org'
      const accRes = await fetch(`${horizonUrl}/accounts/${publicKey}`)
      if (!accRes.ok) return res.status(400).json({ error: 'Unable to fetch account from Horizon', status: accRes.status })
      const accJson = await accRes.json()
      sequence = accJson.sequence
    }

    const account = new Account(publicKey, sequence.toString())
    const txBuilder = new TransactionBuilder(account, { fee: '100', networkPassphrase }).setTimeout(30)

    // Intentar construir una invocación real usando HostFunction/InvokeContract si la librería XDR lo soporta
    try {
      if (xdr && xdr.HostFunction && typeof xdr.HostFunction.hostFunctionTypeInvokeContract === 'function' && xdr.Operation && typeof xdr.Operation.invokeHostFunction === 'function') {
        // Construcción de argumentos como ScVal strings (solo soporta strings por ahora)
        const scArgs = args.map(a => {
          if (typeof a === 'string') return xdr.ScVal.scvString(a)
          // para otros tipos podríamos extender aquí
          return xdr.ScVal.scvString(String(a))
        })

        // Construir la operación invokeHostFunction (low-level). Nota: las firmas exactas XDR pueden variar entre SDKs.
        // Aquí intentamos crear la operación directamente en XDR y añadirla al transaction builder usando addOperation con raw xdr.
        const hf = xdr.HostFunction.hostFunctionTypeInvokeContract()
        const opXdr = xdr.Operation.invokeHostFunction({
          function: hf,
          contractAddress: xdr.ScAddress.contract(contractId),
          args: scArgs
        })

        // TransactionBuilder no acepta xdr.Operation directamente; como alternativa, crear la operación manageData con payload indicando que se intentó usar invokeHostFunction.
        // Si la SDK cambia y TransactionBuilder.addOperation acepta el XDR, se puede reemplazar este fallback.
        txBuilder.addOperation(Operation.manageData({ name: `invoke:${method}`, value: Buffer.from(JSON.stringify({ _attempt: 'invokeHostFunction', args })) }))
      } else {
        // fallback: embed invocation payload in manageData to simulate invocation
        txBuilder.addOperation(Operation.manageData({ name: `invoke:${method}`, value: Buffer.from(JSON.stringify(args)) }))
      }
    } catch (e) {
      // en caso de cualquier error durante la construcción XDR, usar el fallback manageData
      console.warn('Could not build invokeHostFunction XDR, using manageData fallback:', e.message || e)
      txBuilder.addOperation(Operation.manageData({ name: `invoke:${method}`, value: Buffer.from(JSON.stringify(args)) }))
    }

    const tx = txBuilder.build()
    return res.json({ xdr: tx.toXDR() })
  } catch (e) {
    console.error('build_tx error', e)
    return res.status(500).json({ error: String(e) })
  }
})

// Endpoint para construir una invocación real (si la librería lo soporta)
app.post('/build_invoke', async (req, res) => {
  try {
    const { contractId, method, args = [], publicKey, sequence, network = 'testnet' } = req.body
    if (!publicKey) return res.status(400).json({ error: 'publicKey is required' })
    const networkPassphrase = network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC

    // Obtener sequence si no se pasa
    let seq = sequence
    if (!seq) {
      const horizonUrl = network === 'testnet' ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org'
      const accRes = await fetch(`${horizonUrl}/accounts/${publicKey}`)
      if (!accRes.ok) return res.status(400).json({ error: 'Unable to fetch account from Horizon', status: accRes.status })
      const accJson = await accRes.json()
      seq = accJson.sequence
    }

    const account = new Account(publicKey, seq.toString())
    const txBuilder = new TransactionBuilder(account, { fee: '100', networkPassphrase }).setTimeout(30)

    // Si Operation.invokeHostFunction está disponible en esta versión del SDK, úsala
    if (Operation && typeof Operation.invokeHostFunction === 'function') {
      // Build op args using ABI types if available
      let opArgs = []
      const sig = ABI[method]
      if (sig && sig.length === args.length) {
        opArgs = sig.map((t, i) => {
          const val = args[i]
          if (t === 'string') return { type: 'string', value: String(val) }
          if (t === 'i128') return { type: 'i128', value: String(val) }
          if (t === 'address') return { type: 'address', value: String(val) }
          if (t === 'vec<string>' && Array.isArray(val)) return { type: 'vec', value: val.map(String) }
          // fallback to string
          return { type: 'string', value: String(val) }
        })
      } else {
        // no ABI info: default all args to strings
        opArgs = args.map(a => ({ type: 'string', value: String(a) }))
      }

      try {
        txBuilder.addOperation(Operation.invokeHostFunction({
          contractAddress: contractId,
          method: method,
          args: opArgs
        }))
        const tx = txBuilder.build()
        return res.json({ xdr: tx.toXDR() })
      } catch (err) {
        console.warn('invokeHostFunction via Operation failed, falling back to manageData. Error:', err.message || err)
        txBuilder.addOperation(Operation.manageData({ name: `invoke:${method}`, value: Buffer.from(JSON.stringify(args)) }))
        const tx = txBuilder.build()
        return res.json({ xdr: tx.toXDR(), warning: 'invokeHostFunction construction failed; returned manageData fallback' })
      }
    }

    // Si no está disponible, devolver 501 y explicar
    return res.status(501).json({ error: 'invokeHostFunction not supported in installed SDK. Use /build_tx fallback or upgrade SDK.' })
  } catch (e) {
    console.error('build_invoke error', e)
    return res.status(500).json({ error: String(e) })
  }
})

const port = process.env.PORT || 4001
const host = '127.0.0.1'
app.listen(port, host, () => console.log(`tx_builder_server listening on ${host}:${port}`))
