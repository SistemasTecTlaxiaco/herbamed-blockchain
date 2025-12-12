#!/usr/bin/env node
// Seed default plants/listings/validations on testnet for vendor/buyer demo
// Flow:
// 1) Vendor registers D-LAVANDA-002, D-JENGIBRE-006 and lists both
// 2) Buyer registers D-EUCALIPTO-007, D-CEDRON-010 and lists both
// 3) Buyer buys D-JENGIBRE-006; Vendor buys D-CEDRON-010
// 4) Cross-votes for validation

import {
  registerPlant,
  listForSale,
  buyListing,
  voteForPlant,
  getPlant,
  getAllListings
} from '../src/soroban/client.js'

const vendor = {
  publicKey: 'GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL',
  secretKey: 'SBSSPK2I4XNMGPT5TZXRDWC5YC4DIILXQA5XS6TFCBX72F2EFP7YMSVW'
}

const buyer = {
  publicKey: 'GA2JBPZ6PBRBZEDXKKMFMV3LRFARBWZ4UXG4OJPVLNXRDZPV4GBSSFTV',
  secretKey: 'SDFGRGSMHS56WO7AZ4KLUC63LPJ7PB4KCIGYB6ZJ22WVWQCNS6ETMLRZ'
}

const plantsVendor = [
  {
    id: 'D-LAVANDA-002',
    name: 'Lavanda',
    scientificName: 'Lavandula angustifolia',
    properties: ['Relajante', 'Antiséptica', 'Cicatrizante', 'Aromática'],
    price: 15
  },
  {
    id: 'D-JENGIBRE-006',
    name: 'Jengibre',
    scientificName: 'Zingiber officinale',
    properties: ['Antiinflamatoria', 'Digestiva', 'Náuseas', 'Antioxidante'],
    price: 20
  }
]

const plantsBuyer = [
  {
    id: 'D-EUCALIPTO-007',
    name: 'Eucalipto',
    scientificName: 'Eucalyptus globulus',
    properties: ['Descongestionante', 'Expectorante', 'Antiséptico', 'Refrescante'],
    price: 12
  },
  {
    id: 'D-CEDRON-010',
    name: 'Cedrón',
    scientificName: 'Aloysia citrodora',
    properties: ['Digestiva', 'Calmante', 'Antiespasmódica', 'Aromática'],
    price: 18
  }
]

const wait = (ms) => new Promise(res => setTimeout(res, ms))

async function ensurePlant(signer, plant) {
  const exists = await getPlant(plant.id)
  if (exists) {
    console.log(`ℹ️ Planta ${plant.id} ya existe, se omite registro`)
    return { transactionHash: null, plantId: plant.id, status: 'EXISTS' }
  }
  const res = await registerPlant(plant, { secretKey: signer.secretKey, publicKey: signer.publicKey })
  console.log(`✅ Registrada ${plant.id} (${signer.publicKey}) -> ${res.transactionHash}`)
  return res
}

async function ensureListing(signer, plant, targetPrice) {
  let listings = []
  try {
    listings = await getAllListings()
  } catch (e) {
    console.warn(`⚠️ No se pudo consultar listings (se intentará listar igual): ${e.message}`)
  }

  const listing = listings.find(l => l.plant_id === plant.id)
  if (listing && listing.available === false) {
    console.log(`ℹ️ Listing ${plant.id} ya vendido, omitido`)
    return { transactionHash: null, plantId: plant.id, status: 'SOLD' }
  }
  if (listing && listing.available) {
    console.log(`ℹ️ Listing ${plant.id} ya disponible, omitido`)
    return { transactionHash: null, plantId: plant.id, status: 'LISTED' }
  }

  const res = await listForSale(plant.id, targetPrice, { secretKey: signer.secretKey, publicKey: signer.publicKey })
  console.log(`✅ Listado ${plant.id} a ${targetPrice} XLM (${signer.publicKey}) -> ${res.transactionHash}`)
  return res
}

async function ensureBuy(signer, plantId) {
  let listings = []
  try {
    listings = await getAllListings()
  } catch (e) {
    console.warn(`⚠️ No se pudo consultar listings (se intentará comprar igual): ${e.message}`)
  }

  const listing = listings.find(l => l.plant_id === plantId)
  if (listing && listing.buyer) {
    console.log(`ℹ️ ${plantId} ya comprado por ${listing.buyer}`)
    return { transactionHash: null, plantId, status: 'BOUGHT' }
  }

  try {
    const res = await buyListing(plantId, { secretKey: signer.secretKey, publicKey: signer.publicKey })
    console.log(`✅ Compra ${plantId} (${signer.publicKey}) -> ${res.transactionHash}`)
    return res
  } catch (e) {
    // Si ya no está disponible, lo marcamos como comprado para seguir el flujo
    if (String(e.message || '').toLowerCase().includes('notavailable')) {
      console.log(`ℹ️ ${plantId} ya no está disponible, se asume comprado/anulado`)
      return { transactionHash: null, plantId, status: 'NOT_AVAILABLE' }
    }
    throw e
  }
}

async function ensureVote(signer, plantId) {
  try {
    const res = await voteForPlant(plantId, { secretKey: signer.secretKey, publicKey: signer.publicKey })
    console.log(`👍 Voto emitido ${plantId} (${signer.publicKey}) -> ${res.transactionHash}`)
    return res
  } catch (e) {
    console.warn(`⚠️ Voto omitido para ${plantId}: ${e.message}`)
    return null
  }
}

async function main() {
  console.log('🚀 Sembrando defaults en testnet...')

  for (const p of plantsVendor) {
    await ensurePlant(vendor, p)
    await wait(1500)
    await ensureListing(vendor, p, p.price)
    await wait(1500)
  }

  for (const p of plantsBuyer) {
    await ensurePlant(buyer, p)
    await wait(1500)
    await ensureListing(buyer, p, p.price)
    await wait(1500)
  }

  await ensureBuy(buyer, 'D-JENGIBRE-006')
  await wait(1500)
  await ensureBuy(vendor, 'D-CEDRON-010')
  await wait(1500)

  await ensureVote(buyer, 'D-LAVANDA-002')
  await ensureVote(buyer, 'D-JENGIBRE-006')
  await ensureVote(vendor, 'D-EUCALIPTO-007')
  await ensureVote(vendor, 'D-CEDRON-010')

  console.log('🎯 Listo. Verifica en Stellar Expert los hashes anteriores.')
}

main().catch(err => {
  console.error('❌ Error en seeding:', err)
  process.exit(1)
})
