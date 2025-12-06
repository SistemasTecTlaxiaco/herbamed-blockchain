<template>
  <div class="container mt-4">
    <div class="card mx-auto" style="max-width:760px">
      <div class="card-body">
        <h4 class="card-title text-center">Conectar Wallet</h4>

        <!-- Indicador de cuenta activa -->
        <div v-if="isAuthenticated" class="alert alert-success mb-3">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>✅ Cuenta Activa</strong>
              <div class="small mt-1">
                <strong>Clave Pública:</strong> {{ publicKey.slice(0, 8) }}…{{ publicKey.slice(-8) }}
                <div class="mt-1"><strong>Balance:</strong> {{ balance }} XLM</div>
                <div class="mt-1 small text-success"><strong>Método:</strong> {{ authMethodLabel }}</div>
              </div>
            </div>
            <button class="btn btn-sm btn-outline-danger" @click="logout">Cerrar Sesión</button>
          </div>
        </div>

        <!-- Alerta si no hay cuenta activa -->
        <div v-else class="alert alert-warning mb-3">
          <strong>⚠️ Sin sesión activa.</strong> Debes conectar tu wallet para acceder a otras secciones.
        </div>

        <!-- Tabs -->
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

        <!-- TAB: LOGIN -->
        <div v-if="activeTab==='login'">
          <h5 class="mb-3">Métodos de Acceso</h5>

          <!-- Desbloquear clave local -->
          <div class="mb-4 p-3 border rounded bg-light">
            <h6 class="mb-2">1️⃣ Desbloquear Clave Cifrada Local</h6>
            <p class="small text-muted">Usa tu clave guardada cifrada en el navegador.</p>
            <div class="mb-2">
              <label class="form-label">Contraseña</label>
              <input v-model="loginPassword" type="password" class="form-control" placeholder="Tu contraseña" />
            </div>
            <button class="btn btn-primary btn-sm" @click="loginLocal">Desbloquear</button>
          </div>

          <!-- Conectar Freighter -->
          <div class="mb-4 p-3 border rounded bg-light">
            <h6 class="mb-2">2️⃣ Conectar Freighter (Desktop)</h6>
            <p class="small text-muted">Wallet para navegador desktop de Stellar.</p>
            <button class="btn btn-success btn-sm" @click="connectFreighter">Conectar Freighter</button>
            <span v-if="freighterText" class="small ms-2" :class="freighterText.includes('✓') ? 'text-success' : 'text-muted'">{{ freighterText }}</span>
          </div>

          <!-- WalletConnect QR (Mobile) -->
          <div class="mb-4 p-3 border rounded bg-light">
            <h6 class="mb-2">3️⃣ Conectar Mobile con QR</h6>
            <p class="small text-muted">Escanea desde Freighter móvil (WalletConnect v2).</p>
            <button class="btn btn-info btn-sm" @click="toggleWalletConnectQR" :disabled="generatingQR">
              {{ wcQRVisible ? '🔻 Ocultar QR' : '📱 Generar QR' }}
            </button>
            <div v-if="wcQRVisible" class="mt-3 text-center">
              <div v-if="generatingQR" class="spinner-border spinner-border-sm text-info" role="status">
                <span class="visually-hidden">Generando QR...</span>
              </div>
              <div v-else>
                <canvas id="walletConnectQR" style="max-width: 300px; border: 2px solid #ddd; padding: 10px; background: white;"></canvas>
                <p class="small text-muted mt-2">{{ wcQRMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB: CREATE -->
        <div v-if="activeTab==='create'">
          <p class="text-muted">Genera una nueva clave y guárdala cifrada con tu contraseña.</p>
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <input v-model="createPassword" type="password" class="form-control" placeholder="Nueva contraseña" />
          </div>
          <div class="mb-3">
            <label class="form-label">Confirmar contraseña</label>
            <input v-model="createPasswordConfirm" type="password" class="form-control" placeholder="Repetir contraseña" />
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-success btn-sm" @click="createAccount" :disabled="fundingAccount">
              <span v-if="fundingAccount" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ fundingAccount ? 'Fondeando...' : 'Crear Cuenta' }}
            </button>
            <button class="btn btn-outline-secondary btn-sm" @click="generateOnly" :disabled="fundingAccount">
              {{ fundingAccount ? 'Fondeando...' : 'Generar (no guardar)' }}
            </button>
          </div>

          <div v-if="newAccount" class="mt-4">
            <hr />
            <h5 class="text-success">✅ Cuenta Generada Exitosamente</h5>
            
            <!-- Public Key -->
            <div class="mb-3">
              <label class="form-label fw-bold">🔑 Clave Pública:</label>
              <div class="input-group">
                <input type="text" class="form-control font-monospace small" :value="newAccount.publicKey" readonly />
                <button class="btn btn-outline-secondary" @click="copyToClipboard(newAccount.publicKey, 'public')" :disabled="copiedPublic">
                  {{ copiedPublic ? '✅ Copiado' : '📋 Copiar' }}
                </button>
              </div>
            </div>
            
            <!-- Stellar Expert Link -->
            <div class="alert alert-info mb-3">
              <strong>🔍 Ver en Blockchain:</strong><br/>
              <a :href="`https://stellar.expert/explorer/testnet/account/${newAccount.publicKey}`" target="_blank" class="text-decoration-none fw-bold">
                🌐 stellar.expert/explorer/testnet/account/{{ newAccount.publicKey.slice(0, 8) }}...
              </a>
              <div class="small text-muted mt-1">Balance actual: <strong>{{ balance }} XLM</strong></div>
            </div>
            
            <!-- Secret Key -->
            <div class="mb-3">
              <label class="form-label fw-bold text-danger">⚠️ Clave Secreta (guárdala de forma segura):</label>
              <div class="input-group">
                <input type="text" class="form-control font-monospace small text-danger" :value="newAccount.secret" readonly />
                <button class="btn btn-outline-danger" @click="copyToClipboard(newAccount.secret, 'secret')" :disabled="copiedSecret">
                  {{ copiedSecret ? '✅ Copiado' : '📋 Copiar' }}
                </button>
              </div>
              <div class="alert alert-warning mt-2 small">
                <strong>⚠️ IMPORTANTE:</strong> Guarda esta clave en un lugar seguro. Nunca la compartas. Si la pierdes, no podrás recuperar tu cuenta.
              </div>
            </div>
            
            <!-- QR Code -->
            <div class="mt-4 text-center">
              <p class="small text-muted mb-2">Escanea el QR para guardar en móvil:</p>
              <div v-if="generatingAccountQR" class="spinner-border spinner-border-sm text-info" role="status">
                <span class="visually-hidden">Generando QR...</span>
              </div>
              <canvas v-else id="accountSecretQR" style="max-width: 260px; border: 2px solid #ddd; padding: 10px; background: white; border-radius: 8px; display: block; margin: 0 auto;"></canvas>
            </div>
          </div>
        </div>

        <!-- TAB: IMPORT -->
        <div v-if="activeTab==='import'">
          <div class="alert alert-success mb-3">
            <strong>✅ Recomendado:</strong> Importa SECRET_KEY para firmar sin depender de Freighter.
          </div>
          <p class="text-muted">Pega tu clave secreta (empieza con 'S').</p>
          <div class="mb-3">
            <label class="form-label">Clave Secreta</label>
            <input v-model="importSecret" type="text" class="form-control font-monospace" placeholder="S..." />
          </div>
          <div class="mb-3">
            <label class="form-label">Guardar Cifrada (opcional)</label>
            <input v-model="importPassword" type="password" class="form-control" placeholder="Contraseña para cifrar" />
          </div>
          
          <!-- Opción de fondeo -->
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" v-model="fundImportedAccount" id="fundImported">
            <label class="form-check-label" for="fundImported">
              <strong>💰 Fondear con Friendbot</strong> (si la cuenta no existe aún)
            </label>
            <div class="small text-muted">Activa esto si es una cuenta nueva que necesita fondos testnet</div>
          </div>
          
          <div class="d-flex gap-2">
            <button class="btn btn-primary btn-sm" @click="importAndSave" :disabled="fundingImport">
              <span v-if="fundingImport" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ fundingImport ? 'Procesando...' : 'Importar y Guardar' }}
            </button>
            <button class="btn btn-outline-primary btn-sm" @click="importOnly" :disabled="fundingImport">
              Solo Importar
            </button>
          </div>
        </div>

        <!-- Status Messages -->
        <div v-if="status" class="mt-3 alert" :class="status.type === 'error' ? 'alert-danger' : 'alert-success'">
          {{ status.message }}
        </div>

        <!-- Footer Info -->
        <div class="mt-3 text-center small text-muted">
          Freighter: <strong>{{ freighterText }}</strong> • RPC: <strong>{{ rpcText }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { connectWallet, setLocalSecret, isFreighterInstalled, isRpcAvailable, waitForFreighterInjection } from '@/soroban/client'
import { initializeWalletConnect, generateWalletConnectQR, getWalletConnectPublicKey, getActiveSession, disconnectWalletConnect } from '@/soroban/walletconnect'
import { getAccountInfo } from '@/soroban/balance'
import { encryptSecret, decryptSecret } from '@/soroban/crypto'
import { Keypair } from '@stellar/stellar-sdk'
import QRCode from 'qrcode'

export default {
  name: 'LoginAdvanced',
  setup() {
    const store = useStore()
    
    const activeTab = ref('login')
    const loginPassword = ref('')
    const createPassword = ref('')
    const createPasswordConfirm = ref('')
    const newAccount = ref(null)
    const importSecret = ref('')
    const importPassword = ref('')
    const fundImportedAccount = ref(false)
    const status = ref(null)
    const freighterText = ref('Detectando...')
    const rpcText = ref('...')
    const wcQRUrl = ref(null)
    const wcQRVisible = ref(false)
    const generatingQR = ref(false)
    const wcQRMessage = ref('Escanea con Freighter móvil')
    const fundingAccount = ref(false)
    const fundingImport = ref(false)
    const copiedPublic = ref(false)
    const copiedSecret = ref(false)
    const generatingAccountQR = ref(false)

    const isAuthenticated = computed(() => store.state.isAuthenticated)
    const publicKey = computed(() => store.state.publicKey)
    const balance = computed(() => store.state.balance || '—')
    const authMethodLabel = computed(() => {
      const method = store.state.authMethod
      return method === 'local-key' ? 'Clave Local' : method === 'freighter' ? 'Freighter' : method === 'walletconnect' ? 'WalletConnect Mobile' : '—'
    })

    onMounted(async () => {
      await waitForFreighterInjection()
      freighterText.value = isFreighterInstalled() ? 'Instalada ✓' : 'No detectada'
      
      const rpcAvailable = await isRpcAvailable()
      rpcText.value = rpcAvailable ? 'Disponible' : 'No disponible'

      // Initialize WalletConnect
      try {
        await initializeWalletConnect()
      } catch (e) {
        console.warn('WalletConnect init failed (non-critical):', e.message)
      }
    })

    async function toggleWalletConnectQR() {
      if (wcQRVisible.value) {
        wcQRVisible.value = false
        return
      }

      // Primero mostrar el contenedor con canvas
      wcQRVisible.value = true
      generatingQR.value = false // Mostrar canvas inmediatamente
      
      // Esperar a que el DOM se actualice
      await nextTick()
      
      try {
        const { uri, approval } = await generateWalletConnectQR()
        console.log('WalletConnect URI:', uri)
        
        // Obtener canvas directamente del DOM
        const canvas = document.getElementById('walletConnectQR')
        console.log('Canvas element:', canvas)
        
        if (!canvas) {
          throw new Error('Canvas element no encontrado en el DOM')
        }
        
        // Renderizar QR directamente en canvas (evita CSP issues)
        await QRCode.toCanvas(canvas, uri, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        
        wcQRUrl.value = uri // Guardar URI para referencia
        wcQRMessage.value = 'Escanea con Freighter móvil para conectar'
        console.log('QR generado exitosamente')

        // Wait for approval in background
        approval().then(async (session) => {
          if (session) {
            const pk = getWalletConnectPublicKey()
            if (pk) {
              await setSessionAsActive(pk, 'walletconnect')
              wcQRVisible.value = false
              status.value = { type: 'success', message: 'WalletConnect conectado correctamente' }
            }
          }
        }).catch(e => {
          console.error('WalletConnect approval failed:', e)
          status.value = { type: 'error', message: 'Error en aprobación de WalletConnect' }
        })
      } catch (e) {
        console.error('Error generando QR:', e)
        status.value = { type: 'error', message: 'Error generando QR: ' + e.message }
      } finally {
        generatingQR.value = false
      }
    }

    async function fundAccountWithFriendbot(publicKey) {
      try {
        const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`)
        if (!response.ok) {
          throw new Error(`Friendbot failed: ${response.status}`)
        }
        console.log('✅ Cuenta fondeada con Friendbot')
        // Esperar un momento para que la transacción se propague
        await new Promise(resolve => setTimeout(resolve, 2000))
        return true
      } catch (e) {
        console.error('Error fondeando cuenta:', e)
        throw e
      }
    }

    async function copyToClipboard(text, type) {
      try {
        await navigator.clipboard.writeText(text)
        if (type === 'public') {
          copiedPublic.value = true
          setTimeout(() => copiedPublic.value = false, 2000)
        } else if (type === 'secret') {
          copiedSecret.value = true
          setTimeout(() => copiedSecret.value = false, 2000)
        }
      } catch (e) {
        console.error('Error copiando:', e)
        status.value = { type: 'error', message: 'Error al copiar al portapapeles' }
      }
    }

    async function renderSecretQR() {
      if (!newAccount.value) return
      
      generatingAccountQR.value = true
      try {
        await nextTick()
        const canvas = document.getElementById('accountSecretQR')
        if (!canvas) {
          throw new Error('Canvas element no encontrado')
        }
        
        await QRCode.toCanvas(canvas, newAccount.value.secret, {
          width: 280,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        console.log('✅ QR de secret generado')
      } catch (e) {
        console.error('Error generando QR:', e)
        status.value = { type: 'error', message: 'Error generando QR: ' + e.message }
      } finally {
        generatingAccountQR.value = false
      }
    }

    async function setSessionAsActive(pk, method) {
      store.commit('SET_PUBLIC_KEY', pk)
      store.commit('SET_AUTH_METHOD', method)
      store.commit('SET_AUTHENTICATED', true)

      // Fetch balance
      try {
        const info = await getAccountInfo(pk)
        if (info) {
          store.commit('SET_BALANCE', info.balance)
        }
      } catch (e) {
        console.warn('Balance fetch failed:', e.message)
      }
    }

    async function createAccount() {
      status.value = null
      if (!createPassword.value) {
        status.value = { type: 'error', message: 'Ingresa contraseña' }
        return
      }
      if (createPassword.value !== createPasswordConfirm.value) {
        status.value = { type: 'error', message: 'Contraseñas no coinciden' }
        return
      }
      try {
        fundingAccount.value = true
        const kp = Keypair.random()
        
        // Fondear cuenta con Friendbot
        status.value = { type: 'success', message: '⏳ Generando cuenta y fondeando con Friendbot...' }
        await fundAccountWithFriendbot(kp.publicKey())
        
        // Guardar cuenta cifrada
        const payload = await encryptSecret(kp.secret(), createPassword.value)
        localStorage.setItem('herbamed:account', JSON.stringify(payload))
        setLocalSecret(kp.secret())
        newAccount.value = { secret: kp.secret(), publicKey: kp.publicKey() }
        await setSessionAsActive(kp.publicKey(), 'local-key')
        
        // Renderizar QR después de crear la cuenta
        await renderSecretQR()
        
        status.value = { type: 'success', message: '✅ Cuenta creada, fondeada con 10,000 XLM (testnet) y guardada cifrada.' }
      } catch (e) {
        status.value = { type: 'error', message: 'Error: ' + e.message }
      } finally {
        fundingAccount.value = false
      }
    }

    async function generateOnly() {
      try {
        fundingAccount.value = true
        status.value = { type: 'success', message: '⏳ Generando cuenta y fondeando con Friendbot...' }
        
        const kp = Keypair.random()
        await fundAccountWithFriendbot(kp.publicKey())
        
        newAccount.value = { secret: kp.secret(), publicKey: kp.publicKey() }
        
        // Renderizar QR
        await renderSecretQR()
        
        status.value = { type: 'success', message: '✅ Cuenta generada y fondeada (no guardada localmente).' }
      } catch (e) {
        status.value = { type: 'error', message: 'Error: ' + e.message }
      } finally {
        fundingAccount.value = false
      }
    }

    async function loginLocal() {
      status.value = null
      const raw = localStorage.getItem('herbamed:account')
      if (!raw) {
        status.value = { type: 'error', message: 'No hay cuenta guardada.' }
        return
      }
      try {
        const payload = JSON.parse(raw)
        const secret = await decryptSecret(payload, loginPassword.value)
        const kp = Keypair.fromSecret(secret)
        setLocalSecret(secret)
        await setSessionAsActive(kp.publicKey(), 'local-key')
        status.value = { type: 'success', message: 'Sesión iniciada con clave local.' }
      } catch (e) {
        status.value = { type: 'error', message: 'Error: ' + e.message }
      }
    }

    async function importAndSave() {
      status.value = null
      if (!importSecret.value) {
        status.value = { type: 'error', message: 'Pega la clave secreta' }
        return
      }
      if (!importPassword.value) {
        status.value = { type: 'error', message: 'Ingresa contraseña para guardar' }
        return
      }
      try {
        fundingImport.value = true
        const kp = Keypair.fromSecret(importSecret.value)
        
        // Fondear si está marcado
        if (fundImportedAccount.value) {
          status.value = { type: 'success', message: '⏳ Fondeando cuenta con Friendbot...' }
          await fundAccountWithFriendbot(kp.publicKey())
        }
        
        const payload = await encryptSecret(importSecret.value, importPassword.value)
        localStorage.setItem('herbamed:account', JSON.stringify(payload))
        setLocalSecret(importSecret.value)
        await setSessionAsActive(kp.publicKey(), 'local-key')
        
        const msg = fundImportedAccount.value 
          ? '✅ Clave importada, fondeada y guardada.'
          : '✅ Clave importada y guardada.'
        status.value = { type: 'success', message: msg }
      } catch (e) {
        status.value = { type: 'error', message: 'Error: ' + e.message }
      } finally {
        fundingImport.value = false
      }
    }

    function importOnly() {
      status.value = null
      if (!importSecret.value) {
        status.value = { type: 'error', message: 'Pega la clave secreta' }
        return
      }
      try {
        const kp = Keypair.fromSecret(importSecret.value)
        setLocalSecret(importSecret.value)
        status.value = { type: 'success', message: '✅ Clave importada en memoria (solo esta sesión).' }
      } catch (e) {
        status.value = { type: 'error', message: 'Clave inválida: ' + e.message }
      }
    }

    async function connectFreighter() {
      status.value = null
      try {
        const pk = await connectWallet()
        if (!pk) {
          status.value = { type: 'error', message: 'Freighter rechazó la conexión' }
          return
        }
        freighterText.value = 'Conectada ✓'
        await setSessionAsActive(pk, 'freighter')
        status.value = { type: 'success', message: 'Freighter conectada: ' + pk }
      } catch (e) {
        const msg = e.message || String(e)
        if (msg.includes('not available')) {
          status.value = { type: 'error', message: 'Freighter no está instalada. Descárgala en: https://freighter.app' }
        } else {
          status.value = { type: 'error', message: 'Error: ' + msg }
        }
      }
    }

    async function logout() {
      try {
        // Disconnect WalletConnect if active
        if (store.state.authMethod === 'walletconnect') {
          await disconnectWalletConnect()
        }
        
        setLocalSecret('')
        store.commit('SET_PUBLIC_KEY', null)
        store.commit('SET_BALANCE', null)
        store.commit('SET_AUTHENTICATED', false)
        store.commit('SET_AUTH_METHOD', null)
        status.value = { type: 'success', message: 'Sesión cerrada.' }
      } catch (e) {
        status.value = { type: 'error', message: 'Error al cerrar sesión: ' + e.message }
      }
    }

    function handleQRError(event) {
      console.error('Error cargando imagen QR:', event)
      status.value = { type: 'error', message: 'Error cargando imagen QR. Verifica la consola.' }
    }

    return {
      activeTab,
      loginPassword,
      createPassword,
      createPasswordConfirm,
      newAccount,
      importSecret,
      importPassword,
      fundImportedAccount,
      status,
      freighterText,
      rpcText,
      wcQRUrl,
      wcQRVisible,
      generatingQR,
      generatingAccountQR,
      wcQRMessage,
      fundingAccount,
      fundingImport,
      copiedPublic,
      copiedSecret,
      isAuthenticated,
      publicKey,
      balance,
      authMethodLabel,
      toggleWalletConnectQR,
      handleQRError,
      fundAccountWithFriendbot,
      copyToClipboard,
      renderSecretQR,
      createAccount,
      generateOnly,
      loginLocal,
      importAndSave,
      importOnly,
      connectFreighter,
      logout
    }
  }
}
</script>

<style scoped>
pre { white-space: pre-wrap; word-break: break-word; font-size: 0.85rem; }
.border { border-color: #ddd !important; }
.bg-light { background-color: #f8f9fa !important; }
</style>
