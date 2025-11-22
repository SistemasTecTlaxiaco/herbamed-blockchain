import { CONTRACT_ADDRESS, NETWORK, RPC_URL, SECRET_KEY } from './config'
import { SorobanRpc, Networks, Keypair, TransactionBuilder, xdr, scValToNative, Transaction } from '@stellar/stellar-sdk'
import { TX_BUILDER_URL } from './config'

// Inicialización del cliente Soroban y configuración (con tolerancia si la API no está disponible)
let sorobanClient = null
try {
  if (SorobanRpc && typeof SorobanRpc.Server === 'function') {
    sorobanClient = new SorobanRpc.Server(RPC_URL, { allowHttp: true })
  } else {
    console.warn('SorobanRpc.Server no disponible en esta build de la SDK; llamadas RPC deshabilitadas')
  }
} catch (e) {
  console.warn('No se pudo inicializar SorobanRpc.Server:', e.message)
}
const networkPassphrase = NETWORK === 'testnet' ? Networks.TESTNET : Networks.PUBLIC
let keypair = null
let walletPublicKey = null
let freighterDetected = false

// Polling ligero para detectar Freighter si se inyecta después
function startFreighterDetection() {
  try {
    freighterDetected = typeof window.freighterApi !== 'undefined' || typeof window.freighter !== 'undefined' || typeof window.freighterSDK !== 'undefined'
    if (!freighterDetected) {
      const id = setInterval(() => {
        if (typeof window.freighterApi !== 'undefined' || typeof window.freighter !== 'undefined' || typeof window.freighterSDK !== 'undefined') {
          freighterDetected = true
          // obtener public key automáticamente si la API está disponible
          const api = window.freighterApi || window.freighter || window.freighterSDK
          if (api && typeof api.getPublicKey === 'function') {
            api.getPublicKey().then(pk => { walletPublicKey = pk }).catch(()=>{})
          }
          clearInterval(id)
        }
      }, 500)
    } else {
      // si ya está disponible
      const api = window.freighterApi || window.freighter || window.freighterSDK
      if (api && typeof api.getPublicKey === 'function') {
        api.getPublicKey().then(pk => { walletPublicKey = pk }).catch(()=>{})
      }
    }
  } catch (e) {
    // no crítico
  }
}
startFreighterDetection()

// Integración básica con Freighter
if (window.freighterApi) {
  window.freighterApi.getPublicKey().then(pubKey => {
    walletPublicKey = pubKey
  })
} else if (SECRET_KEY) {
  keypair = Keypair.fromSecret(SECRET_KEY)
} else {
  console.warn('No wallet or secret key provided - algunas operaciones no estarán disponibles')
}

// Wallet helper: conectar/desconectar
export async function connectWallet() {
  if (window.freighterApi) {
    try {
      walletPublicKey = await window.freighterApi.getPublicKey()
      return walletPublicKey
    } catch (e) {
      console.error('Error al conectar Freighter:', e)
      throw e
    }
  }
  if (SECRET_KEY) {
    keypair = Keypair.fromSecret(SECRET_KEY)
    return keypair.publicKey()
  }
  throw new Error('No Freighter disponible ni KEY en .env')
}

export function isFreighterInstalled() {
  return typeof window.freighterApi !== 'undefined' || typeof window.freighter !== 'undefined' || typeof window.freighterSDK !== 'undefined' || freighterDetected
}

export async function isRpcAvailable() {
  try {
    // Algunos endpoints RPC no permiten GET y responden 405; eso no significa que el servidor no esté disponible.
    // Intentamos un GET simple y consideramos "disponible" cualquier respuesta recibida del servidor.
    const res = await fetch(RPC_URL, { method: 'GET', mode: 'cors' })
    if (res && typeof res.status === 'number') {
      // Si recibimos respuesta (incluso 405), consideramos el RPC alcanzable.
      return true
    }
    return false
  } catch (e) {
    // Si hay un error de red (DNS, bloqueo), devolvemos false.
    return false
  }
}

export function disconnectWallet() {
  walletPublicKey = null
  keypair = null
}

export function getConnectedPublicKey() {
  return walletPublicKey || (keypair ? keypair.publicKey() : null)
}

// Permitir que la UI establezca una clave local (importar o después de crear)
export function setLocalSecret(secret) {
  try {
    keypair = Keypair.fromSecret(secret)
    walletPublicKey = null
    return keypair.publicKey()
  } catch (e) {
    throw new Error('Clave secreta inválida')
  }
}

// Utilidad para preparar y enviar transacciones
async function submitTx(operation) {
  if (!sorobanClient) {
    // Si no hay cliente RPC disponible, usar fallback que firma con Freighter y envía vía fetch
    return submitTxFallback(operation)
  }
  if (!keypair && !walletPublicKey) {
    throw new Error('No hay método de firma disponible (Freighter o clave local)')
  }

  try {
    const account = await sorobanClient.getAccount(walletPublicKey || (keypair ? keypair.publicKey() : ''))
    const txBuilder = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase
    })
    .addOperation(
      // Usar invokeHostFunction si la SDK lo expone en runtime, fallback a invokeContract XDR
      xdr.Operation.invokeHostFunction
        ? xdr.Operation.invokeHostFunction({
            function: xdr.HostFunction.hostFunctionTypeInvokeContract(),
            contractAddress: xdr.ScAddress.contract(CONTRACT_ADDRESS),
            args: operation.args.map(a => (typeof a === 'string' ? xdr.ScVal.scvString(a) : a))
          })
        : xdr.HostFunction.invokeContract({
            contractAddress: xdr.ScAddress.contract(CONTRACT_ADDRESS),
            method: operation.method,
            args: operation.args.map(a => (typeof a === 'string' ? xdr.ScVal.scvString(a) : a))
          })
    )
    .setTimeout(30)
    const tx = txBuilder.build()

    // Firmar con Freighter si está disponible
    if (window.freighterApi && walletPublicKey) {
      // Freighter puede devolver un XDR firmado o una estructura; maneja ambas posibilidades
      const signed = await window.freighterApi.signTransaction(tx.toXDR(), networkPassphrase)
      if (typeof signed === 'string') {
        // XDR firmado
        // Enviar XDR directamente si la RPC espera la transacción completa
        const response = await sorobanClient.sendTransaction(signed)
        return response
      } else if (signed && signed.signed_envelope_xdr) {
        const signedXDR = signed.signed_envelope_xdr
        const response = await sorobanClient.sendTransaction(signedXDR)
        return response
      } else if (signed && signed.signatures) {
        // Adjuntar firmas a tx
        signed.signatures.forEach(sig => {
          tx.signatures.push(xdr.DecoratedSignature.fromXDR(sig, 'base64'))
        })
      } else {
        console.warn('Formato de firma Freighter no reconocido, intentando enviar tx sin firma')
      }
    } else if (keypair) {
      tx.sign(keypair)
    } else {
      throw new Error('No wallet or keypair available for signing')
    }

    // Simular la transacción primero
    const simulation = await sorobanClient.simulateTransaction(tx.toXDR())
    if (simulation.error) {
      throw new Error(`Transaction simulation failed: ${simulation.error}`)
    }

    // Enviar la transacción si la simulación fue exitosa
    const response = await sorobanClient.sendTransaction(tx.toXDR())

    // Esperar por la confirmación
    let result
    while (true) {
      result = await sorobanClient.getTransaction(response.hash)
      if (result.status !== "NOT_FOUND") {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (result.status === "SUCCESS") {
      return {
        success: true,
        hash: response.hash,
        result: result.returnValue ? scValToNative(result.returnValue) : null
      }
    } else {
      throw new Error(`Transaction failed: ${result.status}`)
    }
  } catch (err) {
    console.error('Transaction failed:', err)
    throw err
  }
}

// Fallback: construir XDR, pedir firma a Freighter (o usar keypair) y enviar via fetch al RPC
async function submitTxFallback(operation) {
  if (!walletPublicKey && !keypair) throw new Error('No hay método de firma disponible para fallback')

  try {
    const publicKey = walletPublicKey || (keypair ? keypair.publicKey() : null)
    if (!publicKey) throw new Error('No se encontró publicKey para construir la transacción')
    // Solicitar al builder service un XDR sin firmar
    const builderUrl = `${TX_BUILDER_URL.replace(/\/$/, '')}/build_tx`
    const builderResp = await fetch(builderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: operation.contractId || CONTRACT_ADDRESS, method: operation.method, args: operation.args || [], publicKey, network: NETWORK })
    })
    if (!builderResp.ok) {
      const body = await builderResp.text().catch(() => null)
      throw new Error(`Tx builder failed: ${builderResp.status} ${builderResp.statusText} ${body || ''}`)
    }
    const builderJson = await builderResp.json()
    const unsignedXDR = builderJson.xdr

    // Firmar con Freighter o con clave local
    let signedXDR = null
    if (window.freighterApi && walletPublicKey) {
      const signed = await window.freighterApi.signTransaction(unsignedXDR, networkPassphrase)
      if (typeof signed === 'string') signedXDR = signed
      else if (signed && signed.signed_envelope_xdr) signedXDR = signed.signed_envelope_xdr
      else if (signed && signed.signedTransaction) signedXDR = signed.signedTransaction
      else if (signed && signed.signatures) {
        // firmar localmente: reconstruir tx y adjuntar firmas si el formato lo permite
        signedXDR = unsignedXDR
      }
    } else if (keypair) {
      // Para firmar localmente, reconstruir Transaction desde unsignedXDR y firmar
      const txObj = Transaction.fromXDR(unsignedXDR, networkPassphrase)
      txObj.sign(keypair)
      signedXDR = txObj.toXDR()
    }

    if (!signedXDR) throw new Error('No se obtuvo XDR firmado desde Freighter o firma local')

    // Enviar XDR firmado al endpoint RPC (intentar /send_transaction)
    const url = `${RPC_URL.replace(/\/$/, '')}/send_transaction`
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tx: signedXDR }) })
    if (!res.ok) {
      const body = await res.text().catch(() => null)
      throw new Error(`RPC envio fallido: ${res.status} ${res.statusText} ${body || ''}`)
    }
    const result = await res.json()
    return { success: true, hash: result.hash || result.transactionHash || null, result }
  } catch (e) {
    console.error('submitTxFallback failed:', e)
    throw e
  }
}

export async function registerPlant(plant) {
  if (!sorobanClient) {
    // Mensaje más útil para el desarrollador/usuario
    throw new Error('Soroban client not initialized. Asegúrate de tener disponible un Soroban RPC compatible o instala la extensión Freighter en tu navegador y conéctala.')
  }

  try {
    const operation = {
      source: keypair.publicKey(),
      contractId: CONTRACT_ADDRESS,
      method: 'register_plant',
      args: [
        xdr.ScVal.scvString(plant.id),
        xdr.ScVal.scvString(plant.name),
        xdr.ScVal.scvString(plant.description),
        xdr.ScVal.scvString(plant.location)
      ]
    }

    const result = await submitTx(operation)
    return {
      success: true,
      plantId: plant.id,
      transactionHash: result.hash
    }
  } catch (err) {
    console.error('Failed to register plant:', err)
    throw new Error(`Failed to register plant: ${err.message}`)
  }
}

export async function getAllPlants() {
  if (!sorobanClient) {
    console.warn('getAllPlants: Soroban RPC no disponible, devolviendo lista vacía')
    return []
  }
  try {
    // Fallback: si no hay cuenta de firma disponible, usar llamada de lectura simplificada si el RPC lo soporta
    const account = await sorobanClient.getAccount(getConnectedPublicKey() || '')
    const txBuilder = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase
    })
    .setTimeout(30)
    const tx = txBuilder.build()
    // Si el RPC soporta endpoint de lectura directo, preferirlo. Aquí intentamos simular sin operaciones.
    const result = await sorobanClient.simulateTransaction(tx.toXDR())
    if (result && result.error) {
      console.warn('simulateTransaction devolvió error al leer plantas:', result.error)
      return []
    }
    return result && result.result ? scValToNative(result.result) : []
  } catch (err) {
    console.error('Failed to fetch plants:', err)
    return []
  }
}

export async function voteForPlant(plantId) {
  if (!sorobanClient || !keypair) {
    throw new Error('Soroban client or keypair not initialized')
  }

  try {
    const operation = {
      source: keypair.publicKey(),
      contractId: CONTRACT_ADDRESS,
      method: 'vote_for_plant',
      args: [
        xdr.ScVal.scvString(plantId)
      ]
    }

    const result = await submitTx(operation)
    
    return {
      success: true,
      plantId,
      validatorAddress: keypair.publicKey(),
      transactionHash: result.hash,
      voteCount: result.result // El contrato debería devolver el número actual de votos
    }
  } catch (err) {
    console.error('Failed to vote for plant:', err)
    throw new Error(`Failed to submit vote: ${err.message}`)
  }
}

export async function listForSale(plantId, price) {
  if (!sorobanClient || !keypair) {
    throw new Error('Soroban client or keypair not initialized')
  }

  try {
    const operation = {
      source: keypair.publicKey(),
      contractId: CONTRACT_ADDRESS,
      method: 'list_for_sale',
      args: [
        xdr.ScVal.scvString(plantId),
        xdr.ScVal.scvI128(new scValToNative(price.toString())) // Convertir precio a i128
      ]
    }

    const result = await submitTx(operation)
    
    return {
      success: true,
      plantId,
      price,
      seller: keypair.publicKey(),
      transactionHash: result.hash,
      listingId: result.result // El contrato debería devolver el ID del listing
    }
  } catch (err) {
    console.error('Failed to list plant:', err)
    throw new Error(`Failed to list plant: ${err.message}`)
  }
}

export async function buyListing(plantId, price) {
  if (!sorobanClient || !keypair) {
    throw new Error('Soroban client or keypair not initialized')
  }

  try {
    // Primero verificamos si el listing existe y está disponible
    const listing = await getListing(plantId)
    if (!listing) {
      throw new Error('Listing not found')
    }
    if (!listing.available) {
      throw new Error('Plant is no longer available')
    }
    if (listing.price.toString() !== price.toString()) {
      throw new Error('Price mismatch')
    }

    const operation = {
      source: keypair.publicKey(),
      contractId: CONTRACT_ADDRESS,
      method: 'buy_listing',
      args: [
        xdr.ScVal.scvString(plantId)
      ]
    }

    const result = await submitTx(operation)
    
    return {
      success: true,
      plantId,
      buyer: keypair.publicKey(),
      price,
      transactionHash: result.hash
    }
  } catch (err) {
    console.error('Failed to buy plant:', err)
    throw new Error(`Failed to buy plant: ${err.message}`)
  }
}

// Función auxiliar para obtener información de un listing
export async function getListing(plantId) {
  if (!sorobanClient) {
    throw new Error('Soroban client not initialized')
  }

  try {
    const operation = {
      source: keypair ? keypair.publicKey() : null,
      contractId: CONTRACT_ADDRESS,
      method: 'get_listing',
      args: [
        xdr.ScVal.scvString(plantId)
      ]
    }

    const result = await sorobanClient.simulateTransaction({
      ...operation,
      signers: keypair ? [keypair.publicKey()] : []
    })

    if (result.error) {
      throw new Error(`Failed to fetch listing: ${result.error}`)
    }

    return scValToNative(result.result)
  } catch (err) {
    console.error('Failed to fetch listing:', err)
    throw new Error(`Failed to fetch listing: ${err.message}`)
  }
}

// Función auxiliar para obtener los votos de una planta
export async function getPlantVotes(plantId) {
  if (!sorobanClient) {
    throw new Error('Soroban client not initialized')
  }

  try {
    const operation = {
      source: keypair ? keypair.publicKey() : null,
      contractId: CONTRACT_ADDRESS,
      method: 'get_plant_votes',
      args: [
        xdr.ScVal.scvString(plantId)
      ]
    }

    const result = await sorobanClient.simulateTransaction({
      ...operation,
      signers: keypair ? [keypair.publicKey()] : []
    })

    if (result.error) {
      throw new Error(`Failed to fetch votes: ${result.error}`)
    }

    return scValToNative(result.result)
  } catch (err) {
    console.error('Failed to fetch votes:', err)
    throw new Error(`Failed to fetch votes: ${err.message}`)
  }
}

export default {
  registerPlant,
  getAllPlants,
  voteForPlant,
  listForSale,
  buyListing,
  getListing,
  getPlantVotes
}
