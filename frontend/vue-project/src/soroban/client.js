import { CONTRACT_ADDRESS, NETWORK, RPC_URL, SECRET_KEY } from './config'

// Mock storage as fallback if real client fails to load
const _storage = {
  plants: {},
  listings: {},
  validators: new Set(),
  votes: {},
}

// Attempt to load real Soroban client, gracefully fall back to mock if not available
let sorobanClient = null
let keypair = null

try {
  const { SorobanRpc, Keypair } = await import('@stellar/stellar-sdk')
  sorobanClient = new SorobanRpc.Server(RPC_URL, { allowHttp: true })
  if (SECRET_KEY) {
    keypair = Keypair.fromSecret(SECRET_KEY)
  }
} catch (err) {
  console.warn('Failed to load soroban-client:', err.message)
  console.info('Using mock implementation - install dependencies with: npm install')
}

export async function registerPlant(plant) {
  if (!sorobanClient || !keypair) {
    console.warn('Using mock storage - set VITE_SOROBAN_SECRET_KEY to use real contract')
    _storage.plants[plant.id] = { ...plant, validated: false, validator: null }
    return plant.id
  }

  try {
    const account = await sorobanClient.getAccount(keypair.publicKey())
    const operation = {
      source: keypair.publicKey(),
      contractId: CONTRACT_ADDRESS,
      method: 'register_plant',
      args: [plant.id, plant.name, plant.description, plant.location],
    }

    const tx = await sorobanClient
      .prepareTransaction(operation, account)
      .setTimeout(30)
      .build()

    tx.sign(keypair)
    const response = await sorobanClient.sendTransaction(tx)
    return response.hash
  } catch (err) {
    console.error('Failed to register plant:', err)
    throw new Error('Failed to register plant on chain')
  }
}

export async function getAllPlants() {
  if (!sorobanClient) {
    console.warn('Using mock storage - install soroban-client to use real contract')
    return Object.values(_storage.plants)
  }

  try {
    const result = await sorobanClient.simulateTransaction({
      contractId: CONTRACT_ADDRESS,
      method: 'get_all_plants',
      args: [],
    })
    return result.results[0].xdr // Parse XDR result to array of plants
  } catch (err) {
    console.error('Failed to fetch plants:', err)
    throw new Error('Failed to fetch plants from chain')
  }
}

export async function voteForPlant(plantId, validatorAddress) {
  if (!sorobanClient || !keypair) {
    console.warn('Using mock storage - set VITE_SOROBAN_SECRET_KEY to use real contract')
    const key = `${plantId}:${validatorAddress}`
    if (_storage.votes[key]) return _storage.votes[key]
    _storage.votes[key] = true
    const countKey = `count:${plantId}`
    _storage[countKey] = (_storage[countKey] || 0) + 1
    const votes = _storage[countKey]
    if (votes >= 1 && _storage.plants[plantId]) {
      _storage.plants[plantId].validated = true
      _storage.plants[plantId].validator = validatorAddress
    }
    return votes
  }

  try {
    const account = await sorobanClient.getAccount(keypair.publicKey())
    const operation = {
      source: keypair.publicKey(),
      contractId: CONTRACT_ADDRESS,
      method: 'vote_for_plant',
      args: [plantId],
    }

    const tx = await sorobanClient
      .prepareTransaction(operation, account)
      .setTimeout(30)
      .build()

    tx.sign(keypair)
    const response = await sorobanClient.sendTransaction(tx)
    return response.hash
  } catch (err) {
    console.error('Failed to vote for plant:', err)
    throw new Error('Failed to submit vote on chain')
  }
}

export async function listForSale(plantId, price) {
  if (!sorobanClient || !keypair) {
    console.warn('Using mock storage - set VITE_SOROBAN_SECRET_KEY to use real contract')
    _storage.listings[plantId] = { seller: keypair?.publicKey() || 'mock-seller', plantId, price, available: true }
    return true
  }

  try {
    const account = await sorobanClient.getAccount(keypair.publicKey())
    const operation = {
      source: keypair.publicKey(),
      contractId: CONTRACT_ADDRESS,
      method: 'list_for_sale',
      args: [plantId, price],
    }

    const tx = await sorobanClient
      .prepareTransaction(operation, account)
      .setTimeout(30)
      .build()

    tx.sign(keypair)
    const response = await sorobanClient.sendTransaction(tx)
    return response.hash
  } catch (err) {
    console.error('Failed to list plant:', err)
    throw new Error('Failed to list plant on chain')
  }
}

export async function buyListing(plantId) {
  if (!sorobanClient || !keypair) {
    console.warn('Using mock storage - set VITE_SOROBAN_SECRET_KEY to use real contract')
    const listing = _storage.listings[plantId]
    if (!listing || !listing.available) return false
    listing.available = false
    return true
  }

  try {
    const account = await sorobanClient.getAccount(keypair.publicKey())
    const operation = {
      source: keypair.publicKey(),
      contractId: CONTRACT_ADDRESS,
      method: 'buy_listing',
      args: [plantId],
    }

    const tx = await sorobanClient
      .prepareTransaction(operation, account)
      .setTimeout(30)
      .build()

    tx.sign(keypair)
    const response = await sorobanClient.sendTransaction(tx)
    return response.hash
  } catch (err) {
    console.error('Failed to buy plant:', err)
    throw new Error('Failed to buy plant from chain')
  }
}

export default {
  registerPlant,
  getAllPlants,
  voteForPlant,
  listForSale,
  buyListing,
}
