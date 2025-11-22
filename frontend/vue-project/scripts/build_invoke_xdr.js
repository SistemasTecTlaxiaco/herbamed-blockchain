// build_invoke_xdr.js
// Intenta construir un Transaction XDR para invocar un contrato Soroban (invokeHostFunction / invokeContract)
// Usage: node scripts/build_invoke_xdr.js

import { Keypair, TransactionBuilder, Networks, xdr, Account, Operation } from '@stellar/stellar-sdk'

function scValString(str) {
  // helper to create ScVal string xdr
  return xdr.ScVal.scvString(str)
}

async function main() {
  try {
    const CONTRACT_ADDRESS = 'CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR'
    const NETWORK = 'testnet'
    const networkPassphrase = NETWORK === 'testnet' ? Networks.TESTNET : Networks.PUBLIC
    const publicKey = Keypair.random().publicKey()
    const sequence = '1234567890'
    const account = new Account(publicKey, sequence)

    const txBuilder = new TransactionBuilder(account, { fee: '100', networkPassphrase }).setTimeout(30)

    // Try to detect invokeHostFunction operation support
    if (xdr.Operation && typeof xdr.Operation.invokeHostFunction === 'function') {
      console.log('xdr.Operation.invokeHostFunction available — building operation via xdr.Operation.invokeHostFunction')
      const hf = xdr.HostFunction.hostFunctionTypeInvokeContract()
      // This is a low-level attempt; constructing args as ScVal array may differ per SDK
      // We'll build a raw Operation via xdr.Operation.invokeHostFunction
      const op = xdr.Operation.invokeHostFunction({
        function: xdr.HostFunction.hostFunctionTypeInvokeContract(),
        contractAddress: xdr.ScAddress.contract(CONTRACT_ADDRESS),
        args: [scValString('TEST_ARG')]
      })
      // Build transaction raw xdr manually
      // Note: TransactionBuilder.addOperation expects high-level JS object; the low-level xdr.Operation may not be accepted
      console.log('Low-level operation built (xdr). You can attach it to raw transaction manually.')
      const tx = txBuilder.build()
      console.log('Transaction XDR (unsigned):', tx.toXDR())
    } else {
      console.log('invokeHostFunction not available in xdr.Operation. Will attempt high-level fallback: embed invocation data in manageData op.')
      txBuilder.addOperation(Operation.manageData({ name: 'invoke:register_plant', value: Buffer.from(JSON.stringify(['id','name','desc'])) }))
      const tx = txBuilder.build()
      console.log('Fallback Transaction XDR (unsigned):', tx.toXDR())
    }
  } catch (e) {
    console.error('Error building XDR:', e)
    process.exit(2)
  }
}

main()
