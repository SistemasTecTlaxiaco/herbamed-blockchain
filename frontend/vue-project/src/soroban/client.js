// Basic Soroban client wrapper (placeholder)
// This module provides functions to interact with the MedicinalPlants contract.
// NOTE: For full Soroban integration, install and use the official soroban-client.

// For now we implement a simple mock that mirrors the contract methods and
// can be replaced later with real RPC calls.

const CONTRACT_ADDRESS = process.env.VUE_APP_CONTRACT_ADDRESS || ''
const NETWORK = process.env.VUE_APP_SOROBAN_NETWORK || 'local'

// Simple in-memory mock storage (used if CONTRACT_ADDRESS is not set)
const _storage = {
  plants: {},
  listings: {},
  validators: new Set(),
  votes: {},
}

export async function registerPlant(plant) {
  if (!CONTRACT_ADDRESS) {
    _storage.plants[plant.id] = { ...plant, validated: false, validator: null }
    return plant.id
  }
  // TODO: implement RPC call to Soroban when CONTRACT_ADDRESS is provided
  throw new Error('registerPlant: RPC not implemented')
}

export async function getAllPlants() {
  if (!CONTRACT_ADDRESS) {
    return Object.values(_storage.plants)
  }
  throw new Error('getAllPlants: RPC not implemented')
}

export async function voteForPlant(plantId, validatorAddress) {
  if (!CONTRACT_ADDRESS) {
    const key = `${plantId}:${validatorAddress}`
    if (_storage.votes[key]) return _storage.votes[key]
    _storage.votes[key] = true
    const countKey = `count:${plantId}`
    _storage[countKey] = (_storage[countKey] || 0) + 1
    const votes = _storage[countKey]
    // simple majority: if votes >=1 mark validated (mock)
    if (votes >= 1 && _storage.plants[plantId]) {
      _storage.plants[plantId].validated = true
      _storage.plants[plantId].validator = validatorAddress
    }
    return votes
  }
  throw new Error('voteForPlant: RPC not implemented')
}

export async function listForSale(plantId, seller, price) {
  if (!CONTRACT_ADDRESS) {
    _storage.listings[plantId] = { seller, plantId, price, available: true }
    return true
  }
  throw new Error('listForSale: RPC not implemented')
}

export async function buyListing(plantId, buyer) {
  if (!CONTRACT_ADDRESS) {
    const listing = _storage.listings[plantId]
    if (!listing || !listing.available) return false
    listing.available = false
    return true
  }
  throw new Error('buyListing: RPC not implemented')
}

export default {
  registerPlant,
  getAllPlants,
  voteForPlant,
  listForSale,
  buyListing,
}
