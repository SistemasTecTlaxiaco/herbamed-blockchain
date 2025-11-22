// Soroban frontend configuration
// Values can be provided via Vite env (VITE_*) or legacy Vue env (VUE_APP_*), or fall back to defaults.

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || process.env.VUE_APP_CONTRACT_ADDRESS || 'CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR'
export const NETWORK = import.meta.env.VITE_SOROBAN_NETWORK || process.env.VUE_APP_SOROBAN_NETWORK || 'testnet'
export const RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || process.env.VUE_APP_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
// For signing locally during development, set VITE_SOROBAN_SECRET_KEY or SOROBAN_SECRET_KEY in your env.
export const SECRET_KEY = import.meta.env.VITE_SOROBAN_SECRET_KEY || process.env.SOROBAN_SECRET_KEY || ''
export const TX_BUILDER_URL = import.meta.env.VITE_TX_BUILDER_URL || process.env.TX_BUILDER_URL || 'http://127.0.0.1:4001'
