import express from 'express'
import bodyParser from 'body-parser'
import { TransactionBuilder, Networks, Operation, Account } from '@stellar/stellar-sdk'

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
    // fallback: embed invocation payload in manageData to simulate invocation
    txBuilder.addOperation(Operation.manageData({ name: `invoke:${method}`, value: Buffer.from(JSON.stringify(args)) }))
    const tx = txBuilder.build()
    return res.json({ xdr: tx.toXDR() })
  } catch (e) {
    console.error('build_tx error', e)
    return res.status(500).json({ error: String(e) })
  }
})

const port = process.env.PORT || 4001
app.listen(port, () => console.log(`tx_builder_server listening on ${port}`))
