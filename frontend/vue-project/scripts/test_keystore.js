// test_keystore.js
// Script de prueba para encrypt/decrypt usando Web Crypto (simula creación/importación de cuenta)

async function buf2b64(buf) { return Buffer.from(buf).toString('base64') }
function b642buf(b64) { return Uint8Array.from(Buffer.from(b64, 'base64')) }

async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const passKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, passKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

async function encryptSecret(secret, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const enc = new TextEncoder()
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(secret))
  return { salt: await buf2b64(salt), iv: await buf2b64(iv), data: await buf2b64(ct) }
}

async function decryptSecret(payload, password) {
  const salt = b642buf(payload.salt)
  const iv = b642buf(payload.iv)
  const data = b642buf(payload.data)
  const key = await deriveKey(password, salt)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  const dec = new TextDecoder()
  return dec.decode(pt)
}

async function main() {
  console.log('Running keystore roundtrip test...')
  const secret = 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' // placeholder
  const password = 'miPasswordDePrueba123!'

  try {
    const payload = await encryptSecret(secret, password)
    console.log('Encrypted payload:', payload)
    const recovered = await decryptSecret(payload, password)
    console.log('Recovered secret:', recovered)
    if (recovered === secret) console.log('OK: roundtrip success')
    else console.error('FAIL: recovered secret mismatch')
  } catch (e) {
    console.error('Error during test:', e)
    process.exit(2)
  }
}

main()
