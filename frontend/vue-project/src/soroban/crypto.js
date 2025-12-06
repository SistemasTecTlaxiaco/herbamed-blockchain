/**
 * Crypto utilities for account encryption/decryption
 * Uses Web Crypto API with AES-GCM and PBKDF2
 */

// Convert ArrayBuffer to base64
function buf2b64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

// Convert base64 to ArrayBuffer
function b642buf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

/**
 * Derive encryption key from password using PBKDF2
 * @param {string} password - User password
 * @param {Uint8Array} salt - Salt for derivation
 * @returns {Promise<CryptoKey>} Derived key
 */
async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const passKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt secret key with password
 * @param {string} secret - Stellar secret key
 * @param {string} password - User password
 * @returns {Promise<Object>} Encrypted payload {salt, iv, data}
 */
export async function encryptSecret(secret, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const enc = new TextEncoder()
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(secret)
  )
  return {
    salt: buf2b64(salt),
    iv: buf2b64(iv),
    data: buf2b64(ct)
  }
}

/**
 * Decrypt secret key with password
 * @param {Object} payload - Encrypted payload {salt, iv, data}
 * @param {string} password - User password
 * @returns {Promise<string>} Decrypted secret key
 */
export async function decryptSecret(payload, password) {
  const salt = b642buf(payload.salt)
  const iv = b642buf(payload.iv)
  const data = b642buf(payload.data)
  const key = await deriveKey(password, salt)
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  const dec = new TextDecoder()
  return dec.decode(pt)
}
