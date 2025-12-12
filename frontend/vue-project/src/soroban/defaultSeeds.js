// Default on-chain-like seeds for demo flows between vendor and buyer
// These mimic plants already registered/listed/validated on testnet so both users can
// see bought/sold status across Marketplace and Validator views.

export const VENDOR = {
  publicKey: 'GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL',
  role: 'vendor'
}

export const BUYER = {
  publicKey: 'GA2JBPZ6PBRBZEDXKKMFMV3LRFARBWZ4UXG4OJPVLNXRDZPV4GBSSFTV',
  role: 'buyer'
}

// Seeds: pretend these were registered/listed/validated on-chain already
export const DEFAULT_CHAIN_SEEDS = [
  {
    id: 'D-LAVANDA-002',
    name: 'Lavanda',
    scientific_name: 'Lavandula angustifolia',
    properties: ['Relajante', 'Antiséptica', 'Cicatrizante', 'Aromática'],
    validated: true,
    votes: 5,
    owner: VENDOR.publicKey,
    hasVotedBy: [BUYER.publicKey],
    listing: {
      seller: VENDOR.publicKey,
      price: 15,
      available: true,
      txHash: 'demo-hash-lavanda-available'
    }
  },
  {
    id: 'D-JENGIBRE-006',
    name: 'Jengibre',
    scientific_name: 'Zingiber officinale',
    properties: ['Antiinflamatoria', 'Digestiva', 'Náuseas', 'Antioxidante'],
    validated: true,
    votes: 6,
    owner: VENDOR.publicKey,
    hasVotedBy: [BUYER.publicKey],
    listing: {
      seller: VENDOR.publicKey,
      price: 20,
      available: false,
      buyer: BUYER.publicKey,
      txHash: 'demo-hash-jengibre-vendida'
    }
  },
  {
    id: 'D-EUCALIPTO-007',
    name: 'Eucalipto',
    scientific_name: 'Eucalyptus globulus',
    properties: ['Descongestionante', 'Expectorante', 'Antiséptico', 'Refrescante'],
    validated: false,
    votes: 2,
    owner: BUYER.publicKey,
    hasVotedBy: [VENDOR.publicKey],
    listing: {
      seller: BUYER.publicKey,
      price: 12,
      available: true,
      txHash: 'demo-hash-eucalipto-disponible'
    }
  },
  {
    id: 'D-CEDRON-010',
    name: 'Cedrón',
    scientific_name: 'Aloysia citrodora',
    properties: ['Digestiva', 'Calmante', 'Antiespasmódica', 'Aromática'],
    validated: true,
    votes: 4,
    owner: BUYER.publicKey,
    hasVotedBy: [VENDOR.publicKey],
    listing: {
      seller: BUYER.publicKey,
      price: 18,
      available: false,
      buyer: VENDOR.publicKey,
      txHash: 'demo-hash-cedron-vendida'
    }
  }
]
