// Soroban frontend configuration
// Values can be provided via Vite env (VITE_*) or legacy Vue env (VUE_APP_*), or fall back to defaults.

// Make this file safe to import under plain Node (tests) by falling back from import.meta.env
const _env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {})

export const CONTRACT_ADDRESS = _env.VITE_CONTRACT_ADDRESS || _env.VUE_APP_CONTRACT_ADDRESS || 'CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR'
export const NETWORK = _env.VITE_SOROBAN_NETWORK || _env.VUE_APP_SOROBAN_NETWORK || 'testnet'
export const RPC_URL = _env.VITE_SOROBAN_RPC_URL || _env.VUE_APP_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org:443'

// For signing locally during development, set VITE_SOROBAN_SECRET_KEY or SOROBAN_SECRET_KEY in your env.
// OPCIÓN DIRECTA: Descomenta la línea siguiente para usar tu SECRET_KEY directamente (solo para desarrollo/testing):
export const SECRET_KEY = 'SC6F34PGDRKMIPIWIWZOHLHQE7L27DWNVCUD2UKNER7ZLWNKHPQHFNHR'
// export const SECRET_KEY = _env.VITE_SOROBAN_SECRET_KEY || _env.SOROBAN_SECRET_KEY || ''

export const TX_BUILDER_URL = _env.VITE_TX_BUILDER_URL || _env.TX_BUILDER_URL || 'http://127.0.0.1:4001'
