import fs from 'fs'
import path from 'path'
import { Keypair } from '@stellar/stellar-sdk'

function loadEnv(envPath) {
  const data = fs.readFileSync(envPath, 'utf8')
  const lines = data.split(/\r?\n/)
  const env = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx)
    const val = trimmed.slice(idx + 1)
    env[key] = val
  }
  return env
}

const envPath = path.resolve(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at', envPath)
  process.exit(2)
}

const env = loadEnv(envPath)
const secret = env.VITE_SOROBAN_SECRET_KEY || env.VITE_SOROBAN_SECRET || env.SOROBAN_SECRET_KEY || ''
const expectedPublic = env.EXPECTED_PUBLIC_KEY || ''

if (!secret) {
  console.error('No secret key found in .env (VITE_SOROBAN_SECRET_KEY)')
  process.exit(3)
}

try {
  const kp = Keypair.fromSecret(secret)
  const pub = kp.publicKey()
  console.log('Derived public key:', pub)
  if (expectedPublic) {
    if (pub === expectedPublic) {
      console.log('Public key matches EXPECTED_PUBLIC_KEY')
      process.exit(0)
    } else {
      console.warn('Public key does NOT match EXPECTED_PUBLIC_KEY')
      console.log('EXPECTED_PUBLIC_KEY=', expectedPublic)
      process.exit(4)
    }
  } else {
    console.log('No EXPECTED_PUBLIC_KEY provided in .env to compare.')
    process.exit(0)
  }
} catch (err) {
  console.error('Failed to derive keypair from secret:', err.message)
  process.exit(5)
}
