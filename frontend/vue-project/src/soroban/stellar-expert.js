// Helper para generar URLs de verificación en Stellar Expert
import { NETWORK } from './config.js'

const NETWORK_TYPE = (typeof NETWORK !== 'undefined' && NETWORK === 'testnet') ? 'testnet' : 'public'

export function getStellarExpertUrl(type, identifier) {
  const baseUrl = `https://stellar.expert/explorer/${NETWORK_TYPE}`
  
  switch (type) {
    case 'tx':
    case 'transaction':
      return `${baseUrl}/tx/${identifier}`
    
    case 'account':
      return `${baseUrl}/account/${identifier}`
    
    case 'contract':
      return `${baseUrl}/contract/${identifier}`
    
    case 'asset':
      return `${baseUrl}/asset/${identifier}`
    
    default:
      return baseUrl
  }
}

export function getTransactionUrl(hash) {
  return getStellarExpertUrl('tx', hash)
}

export function getAccountUrl(publicKey) {
  return getStellarExpertUrl('account', publicKey)
}

export function getContractUrl(contractId) {
  return getStellarExpertUrl('contract', contractId)
}

export default {
  getStellarExpertUrl,
  getTransactionUrl,
  getAccountUrl,
  getContractUrl
}
