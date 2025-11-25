<template>
  <div class="container mt-4">
    <div class="card mx-auto" style="max-width:640px">
      <div class="card-body">
        <h4 class="card-title text-center">Conectar / Crear Cuenta</h4>

        <ul class="nav nav-tabs mb-3">
          <li class="nav-item">
            <a :class="['nav-link', activeTab==='login' ? 'active' : '']" href="#" @click.prevent="activeTab='login'">Ingresar</a>
          </li>
          <li class="nav-item">
            <a :class="['nav-link', activeTab==='create' ? 'active' : '']" href="#" @click.prevent="activeTab='create'">Crear Cuenta</a>
          </li>
          <li class="nav-item">
            <a :class="['nav-link', activeTab==='import' ? 'active' : '']" href="#" @click.prevent="activeTab='import'">Importar Clave</a>
          </li>
        </ul>

        <div v-if="activeTab==='login'">
          <p class="text-muted">Inicia sesión con la cuenta local guardada (cifrada) o conecta Freighter.</p>
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <input v-model="loginPassword" type="password" class="form-control" placeholder="Tu contraseña" />
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-primary" @click="loginLocal">Ingresar (local)</button>
            <button class="btn btn-outline-primary" @click="connectFreighter">Conectar Freighter</button>
            <button class="btn btn-outline-secondary" @click="logout">Desconectar</button>
          </div>
        </div>

        <div v-if="activeTab==='create'">
          <p class="text-muted">Crea una cuenta local. Se generará una clave secreta que se cifrará con la contraseña que elijas.</p>
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <input v-model="createPassword" type="password" class="form-control" placeholder="Nueva contraseña" />
          </div>
          <div class="mb-3">
            <label class="form-label">Confirmar contraseña</label>
            <input v-model="createPasswordConfirm" type="password" class="form-control" placeholder="Repetir contraseña" />
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-success" @click="createAccount">Crear Cuenta</button>
            <button class="btn btn-outline-secondary" @click="generateOnly">Generar (no guardar)</button>
          </div>

          <div v-if="newAccount">
            <hr />
            <h5>Cuenta generada</h5>
            <p><strong>Public Key:</strong> {{ newAccount.publicKey }}</p>
            <p class="text-danger"><strong>Secret (guárdala en un lugar seguro):</strong></p>
            <pre class="p-2 bg-light">{{ newAccount.secret }}</pre>
            <p class="small text-muted">Puedes escanear el QR para guardar la clave en tu móvil (no compartas este código).</p>
            <img :src="qrUrl(newAccount.secret)" alt="QR" />
          </div>
        </div>

        <div v-if="activeTab==='import'">
          <p class="text-muted">Pega tu clave secreta para importarla (no se guardará a menos que elijas guardar).</p>
          <div class="mb-3">
            <label class="form-label">Clave secreta</label>
            <input v-model="importSecret" type="text" class="form-control" placeholder="S..." />
          </div>
          <div class="mb-3">
            <label class="form-label">Guardar con contraseña (opcional)</label>
            <input v-model="importPassword" type="password" class="form-control" placeholder="Contraseña para cifrar (opcional)" />
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-primary" @click="importAndSave">Importar y Guardar</button>
            <button class="btn btn-outline-primary" @click="importOnly">Solo importar (no guardar)</button>
          </div>
        </div>

        <div v-if="status" class="mt-3 alert" :class="status.type === 'error' ? 'alert-danger' : 'alert-success'">{{ status.message }}</div>

        <div class="mt-3 text-center small text-muted">Freighter: <strong>{{ freighterText }}</strong> • RPC: <strong>{{ rpcText }}</strong></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { connectWallet, setLocalSecret, isFreighterInstalled, isRpcAvailable, waitForFreighterInjection } from '@/soroban/client'
import { Keypair } from '@stellar/stellar-sdk'

// Helpers Web Crypto
function buf2b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))) }
function b642buf(b64) { return Uint8Array.from(atob(b64), c => c.charCodeAt(0)) }

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
  return { salt: buf2b64(salt), iv: buf2b64(iv), data: buf2b64(ct) }
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

export default {
  name: 'LoginAdvanced',
  setup() {
    const activeTab = ref('login')
    const loginPassword = ref('')
    const createPassword = ref('')
    const createPasswordConfirm = ref('')
    const newAccount = ref(null)
    const importSecret = ref('')
    const importPassword = ref('')
    const status = ref(null)

    const freighterText = ref('Detectando...')
    const rpcText = ref('...')
    
    onMounted(async () => {
      // Wait for Freighter to inject
      await waitForFreighterInjection()
      freighterText.value = isFreighterInstalled() ? 'Instalada ✓' : 'No detectada'
      
      // Check RPC
      const rpcAvailable = await isRpcAvailable()
      rpcText.value = rpcAvailable ? 'Disponible' : 'No disponible'
    })

    function qrUrl(content) {
      const encoded = encodeURIComponent(content)
      return `https://chart.googleapis.com/chart?chs=240x240&cht=qr&chl=${encoded}`
    }

    async function createAccount() {
      status.value = null
      if (!createPassword.value) { status.value = { type: 'error', message: 'Ingresa una contraseña' }; return }
      if (createPassword.value !== createPasswordConfirm.value) { status.value = { type: 'error', message: 'Las contraseñas no coinciden' }; return }
      const kp = Keypair.random()
      const secret = kp.secret()
      const pub = kp.publicKey()
      // cifrar y guardar
      try {
        const payload = await encryptSecret(secret, createPassword.value)
        localStorage.setItem('herbamed:account', JSON.stringify(payload))
        // establecer localmente
        setLocalSecret(secret)
        newAccount.value = { secret, publicKey: pub }
        status.value = { type: 'success', message: 'Cuenta creada y guardada localmente (cifrada).' }
      } catch (e) {
        status.value = { type: 'error', message: 'Error al crear cuenta: ' + e.message }
      }
    }

    function generateOnly() {
      const kp = Keypair.random()
      newAccount.value = { secret: kp.secret(), publicKey: kp.publicKey() }
      status.value = { type: 'success', message: 'Cuenta generada (no guardada).' }
    }

    async function loginLocal() {
      status.value = null
      const raw = localStorage.getItem('herbamed:account')
      if (!raw) { status.value = { type: 'error', message: 'No hay cuenta guardada localmente.' }; return }
      try {
        const payload = JSON.parse(raw)
        const secret = await decryptSecret(payload, loginPassword.value)
        setLocalSecret(secret)
        status.value = { type: 'success', message: 'Sesión iniciada con cuenta local.' }
      } catch (e) {
        status.value = { type: 'error', message: 'Error al descifrar la cuenta. Contraseña incorrecta?' }
      }
    }

    async function importAndSave() {
      status.value = null
      if (!importSecret.value) { status.value = { type: 'error', message: 'Pega la clave secreta' }; return }
      if (!importPassword.value) { status.value = { type: 'error', message: 'Ingresa una contraseña para guardar' }; return }
      try {
        // validar
        Keypair.fromSecret(importSecret.value)
        const payload = await encryptSecret(importSecret.value, importPassword.value)
        localStorage.setItem('herbamed:account', JSON.stringify(payload))
        setLocalSecret(importSecret.value)
        status.value = { type: 'success', message: 'Clave importada y guardada (cifrada).' }
      } catch (e) {
        status.value = { type: 'error', message: 'Clave inválida: ' + e.message }
      }
    }

    function importOnly() {
      try {
        setLocalSecret(importSecret.value)
        status.value = { type: 'success', message: 'Clave importada en memoria (no guardada).' }
      } catch (e) {
        status.value = { type: 'error', message: 'Clave inválida: ' + e.message }
      }
    }

    async function connectFreighter() {
      status.value = null
      try {
        // Attempt connection (will wait for Freighter injection)
        const pk = await connectWallet()
        if (!pk) {
          status.value = { type: 'error', message: 'Freighter no devolvió una clave pública. ¿Rechazaste la conexión?' }
          return
        }
        freighterText.value = 'Conectada ✓'
        status.value = { type: 'success', message: 'Freighter conectada: ' + pk }
      } catch (e) {
        const errorMsg = e.message || String(e)
        if (errorMsg.includes('not available') || errorMsg.includes('API not available')) {
          status.value = { type: 'error', message: 'Freighter no está instalada o no está habilitada. Instálala desde: https://freighter.app' }
        } else if (errorMsg.includes('User declined')) {
          status.value = { type: 'error', message: 'Rechazaste la conexión en Freighter' }
        } else {
          status.value = { type: 'error', message: 'Error conectando Freighter: ' + errorMsg }
        }
      }
    }

    function logout() {
      // limpiar estado local (no borra almacenamiento)
      setLocalSecret && setLocalSecret('')
      status.value = { type: 'success', message: 'Desconectado (nota: la clave almacenada sigue en localStorage si la guardaste).' }
    }

    return { activeTab, loginPassword, createPassword, createPasswordConfirm, newAccount, importSecret, importPassword, status, freighterText, rpcText, qrUrl, createAccount, generateOnly, loginLocal, importAndSave, importOnly, connectFreighter, logout }
  }
}
</script>

<style scoped>
pre { white-space: pre-wrap; word-break: break-word; }
</style>
