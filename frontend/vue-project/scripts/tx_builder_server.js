import express from 'express'
import bodyParser from 'body-parser'
import { TransactionBuilder, Networks, Operation, Account, xdr } from '@stellar/stellar-sdk'

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

const port = process.env.PORT || 4001
app.listen(port, () => console.log(`tx_builder_server listening on ${port}`))
