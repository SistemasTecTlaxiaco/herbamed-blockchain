// Query functions para consultas read-only al contrato Soroban
import * as stellar from '@stellar/stellar-sdk'
import { CONTRACT_ADDRESS, RPC_URL, NETWORK } from './config.js'

const Keypair = stellar.Keypair
const TransactionBuilder = stellar.TransactionBuilder
const Networks = stellar.Networks
const Contract = stellar.Contract
const rpc = stellar.rpc
const nativeToScVal = stellar.nativeToScVal
const scValToNative = stellar.scValToNative

const networkPassphrase = (typeof NETWORK !== 'undefined' && NETWORK === 'testnet') ? Networks.TESTNET : Networks.PUBLIC

// Helper para queries read-only
async function queryContract(method, args = []) {
  try {
    const server = new rpc.Server(RPC_URL)
    const contract = new Contract(CONTRACT_ADDRESS)
    
    // Usar cuenta dummy para queries (no requiere firma)
    const dummyKeypair = Keypair.random()
    const account = await server.getAccount(dummyKeypair.publicKey())
    
    // Convertir args a ScVal
    const scArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return nativeToScVal(arg, {type: 'string'})
      }
      return nativeToScVal(arg)
    })
    
    const contractOperation = contract.call(method, ...scArgs)
    const txBuilder = new TransactionBuilder(account, {
      fee: stellar.BASE_FEE,
      networkPassphrase
    })
      .addOperation(contractOperation)
      .setTimeout(30)
    
    const transaction = txBuilder.build()
    const simulateResponse = await server.simulateTransaction(transaction)
    
    if (rpc.Api.isSimulationError(simulateResponse)) {
      console.error(`[queryContract ${method}] Simulation error:`, simulateResponse)
      return null
    }
    
    if (!simulateResponse.result || !simulateResponse.result.retval) {
      console.warn(`[queryContract ${method}] Sin resultado`)
      return null
    }
    
    const result = simulateResponse.result.retval
    return scValToNative(result)
  } catch (e) {
    console.error(`[queryContract ${method}] Error:`, e)
    return null
  }
}

// Obtener votos de una planta
export async function queryPlantVotes(plantId) {
  console.log('[queryPlantVotes] Consultando votos para:', plantId)
  const votes = await queryContract('get_plant_votes', [plantId])
  return Number(votes) || 0
}

// Obtener datos de un listing
export async function queryListing(plantId) {
  console.log('[queryListing] Consultando listing para:', plantId)
  const listing = await queryContract('get_listing', [plantId])
  
  if (!listing) return null
  
  // Convertir estructura de Listing
  // Listing { seller: Address, plant_id: String, price: i128, available: bool }
  if (Array.isArray(listing)) {
    return {
      seller: listing[0] || '',
      plant_id: listing[1] || plantId,
      price: Number(listing[2]) || 0,
      available: Boolean(listing[3])
    }
  }
  
  return listing
}

// Obtener datos de una planta
export async function queryPlant(plantId) {
  console.log('[queryPlant] Consultando planta:', plantId)
  const plant = await queryContract('get_plant', [plantId])
  
  if (!plant) return null
  
  // Convertir estructura de MedicinalPlant
  // MedicinalPlant { id, name, scientific_name, properties, validated, validator }
  if (Array.isArray(plant)) {
    return {
      id: plant[0] || plantId,
      name: plant[1] || '',
      scientific_name: plant[2] || '',
      properties: Array.isArray(plant[3]) ? plant[3] : [],
      validated: Boolean(plant[4]),
      validator: plant[5] || ''
    }
  }
  
  return plant
}

export default {
  queryPlantVotes,
  queryListing,
  queryPlant
}
