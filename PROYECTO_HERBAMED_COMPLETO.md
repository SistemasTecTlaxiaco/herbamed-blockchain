# 🌿 HerbaMed - Sistema Blockchain para Registro de Plantas Medicinales

**Versión:** 2.0.0  
**Última Actualización:** 5 de Diciembre, 2025  
**Estado:** ✅ **PRODUCCIÓN - Autenticación Completa Implementada**

---

## 📋 ÍNDICE

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estado Actual](#estado-actual)
4. [Tecnologías Utilizadas](#tecnologías-utilizadas)
5. [Guía de Inicio Rápido](#guía-de-inicio-rápido)
6. [Autenticación y Wallets](#autenticación-y-wallets)
7. [Estructura del Proyecto](#estructura-del-proyecto)
8. [Funcionalidades Principales](#funcionalidades-principales)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Roadmap y Próximos Pasos](#roadmap-y-próximos-pasos)

---

## 📖 DESCRIPCIÓN DEL PROYECTO

HerbaMed es una **DApp (Aplicación Descentralizada)** construida sobre la blockchain de **Stellar** utilizando **Soroban** smart contracts. El sistema permite:

- **Registro descentralizado** de plantas medicinales
- **Marketplace** para compra/venta de plantas
- **Sistema de validación** comunitario mediante votos
- **Autenticación segura** con múltiples métodos (Clave Local, Freighter, WalletConnect)
- **Trazabilidad completa** de transacciones en blockchain

### Caso de Uso Principal

Agricultores y distribuidores pueden registrar plantas medicinales en blockchain, listarlas para venta, y los validadores de la comunidad pueden votar por la calidad/autenticidad de las plantas registradas.

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Backend (Blockchain Layer)

```
Stellar Testnet
    │
    ├─ Soroban Smart Contract
    │     │
    │     ├─ register_plant()
    │     ├─ list_for_sale()
    │     ├─ buy_listing()
    │     └─ vote_for_plant()
    │
    └─ Contract Address
          CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR
```

### Frontend (Client Layer)

```
Vue 3 + Vite
    │
    ├─ Components
    │     ├─ Login.vue (Auth: 3 métodos)
    │     ├─ PlantList.vue
    │     ├─ PlantRegistration.vue
    │     ├─ MarketPlace.vue
    │     └─ ValidatorDashboard.vue
    │
    ├─ Soroban Client
    │     ├─ client.js (RPC + Freighter)
    │     ├─ walletconnect.js (WC v2)
    │     └─ balance.js (Horizon API)
    │
    └─ State Management (Vuex)
          ├─ publicKey
          ├─ balance
          ├─ isAuthenticated
          └─ authMethod
```

### Autenticación (3 Métodos)

| Método | Tipo | Uso | Seguridad |
|--------|------|-----|-----------|
| **Clave Local** | AES-GCM cifrada | Desktop/Mobile | 🔒 Alta (PBKDF2 100k iterations) |
| **Freighter** | Browser Extension | Desktop | 🔒🔒 Muy Alta (HW wallet compatible) |
| **WalletConnect** | QR Code | Mobile | 🔒🔒🔒 Máxima (firma remota) |

---

## ✅ ESTADO ACTUAL

### Completado (100%)

#### Backend/Smart Contract
- [x] Contrato Rust Soroban desplegado en testnet
- [x] Funciones core: register, list, buy, vote
- [x] Tests unitarios passing (2/2)
- [x] Eventos emitidos correctamente

#### Frontend Core
- [x] Vue 3 + Vite configurado
- [x] Router con auth guard
- [x] Vuex state management
- [x] Bootstrap 5 UI

#### Autenticación
- [x] Login.vue con 3 métodos
  - Clave local cifrada (AES-GCM + PBKDF2)
  - Freighter desktop wallet
  - WalletConnect v2 mobile (QR)
- [x] Indicador de cuenta activa (public key + balance)
- [x] Protección de rutas sin autenticación
- [x] Navbar con estado de conexión

#### Integración Blockchain
- [x] Cliente Soroban RPC
- [x] Horizon API balance fetching
- [x] WalletConnect SignClient v2
- [x] Firma de transacciones
- [x] Generación de QR codes

#### UI/UX
- [x] PlantList - Lista plantas registradas
- [x] PlantRegistration - Formulario registro
- [x] MarketPlace - Compra/venta
- [x] ValidatorDashboard - Panel validadores
- [x] Responsive design (Bootstrap 5)

### En Desarrollo (0%)

Actualmente no hay features activas en desarrollo. El sistema está en estado funcional completo.

### Pendiente (Roadmap Futuro)

- [ ] Refresh automático de balance
- [ ] Historial de transacciones
- [ ] Filtros y búsqueda en marketplace
- [ ] Sistema de notificaciones
- [ ] Integración con testnet faucet
- [ ] Panel de administración

---

## 🛠️ TECNOLOGÍAS UTILIZADAS

### 🔗 Blockchain Layer

| Tecnología | Versión | Uso en el Proyecto |
|------------|---------|-------------------|
| **Stellar Testnet** | - | Red blockchain principal para desarrollo |
| **Soroban SDK** | 23.0.1 | Framework para smart contracts en Rust |
| **stellar-cli** | latest | Deploy y gestión de contratos |
| **Horizon API** | v2 | Consulta de balances y estado de cuentas |
| **Stellar SDK (JS)** | 14.3.3 | Interacción con blockchain desde frontend |
| **Freighter Wallet** | - | Extensión de navegador para firma de transacciones |

**Dónde se usa:**
- `contracts/medicinal-plants/src/lib.rs` - Smart contract Rust
- `frontend/vue-project/src/soroban/client.js` - Cliente RPC Stellar
- `frontend/vue-project/src/soroban/balance.js` - Horizon API calls

---

### 🎨 Frontend Layer

#### Core Framework

| Tecnología | Versión | Uso en el Proyecto |
|------------|---------|-------------------|
| **Vue.js** | 3.3.8 | Framework principal (Composition API) |
| **Vite** | 7.2.2 | Build tool y dev server |
| **Vuex** | 4.1.0 | State management (auth, balance, publicKey) |
| **Vue Router** | 4.2.5 | Navegación SPA + auth guard |

**Dónde se usa:**
- `frontend/vue-project/src/App.vue` - Componente raíz
- `frontend/vue-project/src/main.js` - Entry point
- `frontend/vue-project/src/store/index.js` - Vuex store
- `frontend/vue-project/src/router/index.js` - Rutas y guards

#### UI/UX

| Tecnología | Versión | Uso en el Proyecto |
|------------|---------|-------------------|
| **Bootstrap** | 5.3.2 | Framework CSS (grid, components, utilities) |
| **@popperjs/core** | 2.11.8 | Tooltips y popovers (Bootstrap dependency) |

**Dónde se usa:**
- `frontend/vue-project/src/components/Login.vue` - Forms, modals, cards
- `frontend/vue-project/src/views/plants/*.vue` - Tables, buttons, layout
- `frontend/vue-project/index.html` - CDN Bootstrap CSS

#### Autenticación & Wallets

| Tecnología | Versión | Uso en el Proyecto |
|------------|---------|-------------------|
| **WalletConnect** | 2.23.0 | Conexión con wallets móviles vía QR |
| **@walletconnect/utils** | 2.23.0 | Utilidades WalletConnect |
| **qrcode** | 1.5.4 | Generación de QR codes para WalletConnect |
| **Crypto API** | Web Standard | Cifrado AES-GCM para claves locales |
| **SubtleCrypto** | Web Standard | PBKDF2 (100k iterations) para derivación de claves |

**Dónde se usa:**
- `frontend/vue-project/src/components/Login.vue` - 3 métodos de auth
- `frontend/vue-project/src/soroban/walletconnect.js` - WalletConnect SignClient
- Lines 239-251 (Login.vue) - QR generation con canvas

#### HTTP & API

| Tecnología | Versión | Uso en el Proyecto |
|------------|---------|-------------------|
| **Axios** | 1.6.2 | HTTP client para Horizon API |

**Dónde se usa:**
- `frontend/vue-project/src/soroban/balance.js` - Fetch balance from Horizon

---

### 🦀 Backend/Smart Contract Layer

| Tecnología | Versión | Uso en el Proyecto |
|------------|---------|-------------------|
| **Rust** | Edition 2021 | Lenguaje para smart contracts Soroban |
| **soroban-sdk** | 23.0.1 | SDK principal para desarrollo |
| **soroban-sdk/testutils** | 23.0.1 | Framework de testing |

**Configuración de Compilación:**
```toml
opt-level = "z"           # Máxima optimización de tamaño
lto = true                # Link-Time Optimization
codegen-units = 1         # Mejor optimización
strip = "symbols"         # Reducir tamaño binario
panic = "abort"           # Reducir overhead
```

**Dónde se usa:**
- `contracts/medicinal-plants/src/lib.rs` - Contrato principal (4 funciones)
- `contracts/medicinal-plants/src/test.rs` - Tests unitarios
- `contracts/medicinal-plants/Cargo.toml` - Configuración

**Funciones Implementadas:**
1. `register_plant()` - Registro de planta
2. `list_for_sale()` - Listado en marketplace
3. `buy_listing()` - Compra de planta
4. `vote_for_plant()` - Sistema de votación

---

### 🧪 Testing & Development

| Tecnología | Versión | Uso en el Proyecto |
|------------|---------|-------------------|
| **Vitest** | 1.1.5 | Testing framework para frontend |
| **jsdom** | 21.1.0 | DOM simulation para tests |
| **Rust Test Framework** | Built-in | Tests de smart contracts |
| **ngrok** | latest | HTTPS tunnel para testing mobile |

**Dónde se usa:**
- `frontend/vue-project/package.json` - Config Vitest
- `contracts/medicinal-plants/src/test.rs` - Rust tests (2/2 passing)
- Mobile testing - ngrok para WalletConnect desde dispositivos reales

**Tests Implementados:**
- ✅ `test_register_plant()` - Verifica registro
- ✅ `test_vote_for_plant()` - Verifica votación

---

### 🛠️ Development Tools

| Herramienta | Versión | Uso en el Proyecto |
|-------------|---------|-------------------|
| **npm** | latest | Package manager |
| **ESLint** | - | Linting JavaScript/Vue |
| **Git** | - | Control de versiones |
| **VS Code** | - | IDE recomendado |
| **GitHub Copilot** | - | AI assistant (documented in .github/) |

**Dónde se usa:**
- `frontend/vue-project/package.json` - Scripts npm
- `.github/copilot-instructions.md` - Instrucciones para AI
- `.gitignore` - Archivos ignorados

---

### 📦 Dependencias Backend (Express Server - Opcional)

| Tecnología | Versión | Uso en el Proyecto |
|------------|---------|-------------------|
| **Express** | 5.1.0 | Server HTTP (scripts opcionales) |
| **body-parser** | 2.2.0 | Parse request bodies |

**Dónde se usa:**
- `frontend/vue-project/scripts/tx_builder_server.js` - Build XDR transactions
- Uso opcional para debugging de transacciones

---

### 🌐 APIs Externas

| Servicio | Endpoint | Uso en el Proyecto |
|----------|----------|-------------------|
| **Stellar Horizon** | https://horizon-testnet.stellar.org | Consulta de balances y account info |
| **Stellar RPC** | https://soroban-testnet.stellar.org | Invocación de smart contracts |
| **WalletConnect Cloud** | relay.walletconnect.com | Relay server para WalletConnect |

**Dónde se usa:**
- `.env` - URLs configuradas
- `client.js` - RPC calls
- `balance.js` - Horizon API calls
- `walletconnect.js` - WalletConnect relay

---

### 📊 Resumen por Capa

```
┌─────────────────────────────────────────────┐
│         FRONTEND (Vue 3 + Vite)             │
│  - Vue Router 4.2.5 (navegación)            │
│  - Vuex 4.1.0 (state)                       │
│  - Bootstrap 5.3.2 (UI)                     │
│  - Axios 1.6.2 (HTTP)                       │
│  - WalletConnect 2.23.0 (mobile wallets)    │
│  - qrcode 1.5.4 (QR generation)             │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      BLOCKCHAIN INTEGRATION LAYER           │
│  - @stellar/stellar-sdk 14.3.3              │
│  - Horizon API v2 (balances)                │
│  - Stellar RPC (contract calls)             │
│  - Freighter Wallet (desktop)               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         BLOCKCHAIN (Stellar Testnet)        │
│  - Soroban Smart Contract                   │
│  - Rust + soroban-sdk 23.0.1                │
│  - Contract: CA5C74SZ...PKOOXNPR            │
└─────────────────────────────────────────────┘
```

---

### 🔐 Seguridad & Criptografía

| Tecnología | Uso en el Proyecto |
|------------|-------------------|
| **Web Crypto API** | Cifrado AES-GCM de claves privadas |
| **PBKDF2** | Derivación de claves (100,000 iterations) |
| **Ed25519** | Firma digital Stellar (via SDK) |
| **SHA-256** | Hashing (via Stellar SDK) |
| **CSP (Content Security Policy)** | Canvas rendering para evitar inline scripts |

**Dónde se usa:**
- `Login.vue` (lines 90-120) - AES-GCM encryption
- `Login.vue` (lines 122-145) - PBKDF2 key derivation
- QR generation usa canvas (no data URLs) para cumplir CSP

---

## 🚀 GUÍA DE INICIO RÁPIDO

### Prerrequisitos

```bash
# Node.js
node --version  # v18+ requerido

# Rust + Soroban CLI
rustc --version
soroban --version

# Git
git --version
```

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/RicardoMtzSts/herbamed-blockchain.git
cd herbamed-blockchain

# 2. Instalar dependencias frontend
cd frontend/vue-project
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Iniciar servidor de desarrollo
npm run dev

# Servidor: http://127.0.0.1:3000
```

### Configuración `.env`

```bash
# Stellar Configuration
VITE_STELLAR_NETWORK=testnet
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_CONTRACT_ADDRESS=CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR

# WalletConnect
VITE_WC_PROJECT_ID=4d6e4ea28e2c05227eeec7733dfd78ff
VITE_APP_URL=http://localhost:3000
```

### Primer Uso

1. **Abre el navegador:** `http://127.0.0.1:3000`
2. **Ve a Login (🔑 Wallet)**
3. **Crea una cuenta nueva:**
   - Tab "Crear Cuenta"
   - Ingresa contraseña
   - Click "Crear Cuenta"
   - **Guarda tu SECRET_KEY** en lugar seguro
4. **Financia tu cuenta:**
   - Copia tu PUBLIC_KEY
   - Ve a: https://laboratory.stellar.org/#account-creator
   - Pega tu public key
   - Click "Get test network lumens" (10,000 XLM)
5. **Explora funcionalidades:**
   - Registrar plantas
   - Listar en marketplace
   - Votar como validador

---

## 🔐 AUTENTICACIÓN Y WALLETS

### Método 1: Clave Local Cifrada

**Uso:** Desktop/Mobile  
**Seguridad:** Alta (AES-GCM + PBKDF2)

#### Crear Cuenta

1. Login → Tab "Crear Cuenta"
2. Ingresa contraseña (mínimo 8 caracteres)
3. Confirma contraseña
4. Click "Crear Cuenta"
5. **Automáticamente se fondea con Friendbot** (10,000 XLM testnet)
6. **Guarda SECRET_KEY mostrado** (no lo pierdas)
7. QR generado automáticamente para mobile
8. **Enlace a stellar.expert** para ver la cuenta en blockchain

**Fondeo Automático (Nuevo):**
```javascript
// Implementado en Login.vue
async function fundAccountWithFriendbot(publicKey) {
  const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`)
  // Fondea con 10,000 XLM de testnet
  // Espera 2s para propagación
}
```

**Características:**
- ⚡ Fondeo instantáneo (2-3 segundos)
- 💰 10,000 XLM de testnet
- 🔗 Enlace directo a stellar.expert/explorer/testnet
- ✅ Cuenta lista para usar inmediatamente
- 🎯 Similar a Stellar Laboratory pero integrado

**Mejoras de UI (Diciembre 2025):**
- 📋 Botones de copiar para claves (pública/secreta)
- 💰 Opción de fondear cuentas importadas
- 📊 Balance en tiempo real después de fondeo
- 🎨 Diseño mejorado con íconos y colores
- ♻️ Código refactorizado (crypto.js separado)
- ✅ Validaciones y mensajes de error mejorados

#### Desbloquear Cuenta Existente

1. Login → Tab "Ingresar"
2. Sección "Desbloquear Clave Local"
3. Ingresa tu contraseña
4. Click "Desbloquear"

**Seguridad Implementada:**
- Password → PBKDF2 (100,000 iterations, SHA-256)
- Secret encryption → AES-GCM (256-bit key)
- Salt + IV únicos por encriptación
- Storage: localStorage (cifrado)

### Método 2: Freighter Desktop

**Uso:** Desktop (Chrome/Firefox/Edge)  
**Seguridad:** Muy Alta (hardware wallet compatible)

#### Instalación

1. Descargar: https://freighter.app
2. Instalar extensión en navegador
3. Crear wallet o importar existente

#### Conectar

1. Login → Tab "Ingresar"
2. Sección "Conectar Freighter (Desktop)"
3. Click "CONECTAR FREIGHTER"
4. Aprobar en popup de Freighter
5. ✓ Conectado (public key + balance visible)

**Ventajas:**
- No guardas claves en la DApp
- Compatible con Ledger/Trezor
- Firma transacciones sin exponer SECRET

### Método 3: WalletConnect Mobile

**Uso:** Mobile (Freighter Mobile)  
**Seguridad:** Máxima (firma remota, keys nunca salen del móvil)

#### Desktop Testing (con ngrok)

```bash
# Terminal 1: Iniciar Vite
cd frontend/vue-project
npm run dev

# Terminal 2: Iniciar ngrok
ngrok http 3000

# Output:
# Forwarding https://xxxx-xxxx.ngrok.io -> http://localhost:3000
```

#### Conexión

1. Login → Tab "Ingresar"
2. Sección "Conectar Mobile con QR"
3. Click "📱 Generar QR"
4. **En Freighter Mobile:**
   - Abrir app
   - Toca ícono "Scan QR"
   - Escanea QR de pantalla
   - Aprobar conexión
5. ✓ Conectado automáticamente

**WalletConnect Flow:**
```
Desktop                    Mobile
  │                          │
  ├─ Generate URI           │
  ├─ Display QR ───────────>│
  │                          ├─ Scan QR
  │                          ├─ Approve Session
  │<──────────────────────── │
  ├─ Session Active          │
  ├─ Request Signature       │
  ├─ ───────────────────────>│
  │                          ├─ Sign Tx
  │<──────────────────────── │
  ├─ Broadcast to Network    │
  └─ ✓ Confirmed             └─ ✓ Confirmed
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
herbamed-blockchain/
│
├── contracts/                    # Smart contracts Soroban
│   └── medicinal-plants/
│       ├── src/
│       │   ├── lib.rs           # Contrato principal
│       │   └── test.rs          # Tests unitarios
│       └── Cargo.toml
│
├── frontend/
│   └── vue-project/
│       ├── src/
│       │   ├── components/      # Componentes Vue
│       │   │   └── Login.vue    # ✅ Auth (3 métodos)
│       │   ├── views/           # Vistas principales
│       │   │   ├── plants/
│       │   │   │   ├── PlantList.vue
│       │   │   │   └── PlantRegistration.vue
│       │   │   └── validators/
│       │   │       └── ValidatorDashboard.vue
│       │   ├── soroban/         # Cliente blockchain
│       │   │   ├── client.js    # RPC + Freighter
│       │   │   ├── walletconnect.js  # WC v2
│       │   │   └── balance.js   # Horizon balance
│       │   ├── store/           # Vuex state
│       │   │   └── index.js
│       │   ├── router/          # Vue Router
│       │   │   └── index.js
│       │   └── App.vue
│       ├── public/
│       ├── .env                 # Config (no committed)
│       ├── package.json
│       └── vite.config.js
│
├── .github/
│   └── copilot-instructions.md  # AI agent guidelines
│
├── docs/
│   ├── ANALISIS_UI_FUNCIONES.md
│   └── RESPUESTAS.md
│
├── PROYECTO_HERBAMED_COMPLETO.md  # 📄 ESTE ARCHIVO
├── NGROK_SETUP.md               # Guía ngrok mobile
├── TESTING_CHECKLIST.md         # Casos de prueba
├── QUICKSTART.md                # Inicio rápido
├── DEVELOPER_GUIDE.md           # Guía desarrollador
├── USER_MANUAL.md               # Manual usuario
└── README.md                    # Overview

```

---

## ⚙️ FUNCIONALIDADES PRINCIPALES

### 1. Registro de Plantas

**Ruta:** `/plants/register`  
**Componente:** `PlantRegistration.vue`

```javascript
// Campos del formulario
{
  name: "Manzanilla",
  scientificName: "Matricaria chamomilla",
  description: "Planta medicinal para infusiones",
  quantity: 100,
  price: 50,  // XLM
  location: "Jalisco, México"
}
```

**Flujo:**
1. Usuario autenticado completa formulario
2. Validación frontend (campos obligatorios)
3. Llamada a smart contract: `register_plant()`
4. Firma con wallet activa (local/Freighter/WalletConnect)
5. Transacción broadcast a Stellar testnet
6. Confirmación + hash de transacción
7. Planta visible en `/plants`

### 2. Marketplace

**Ruta:** `/marketplace`  
**Componente:** `MarketPlace.vue`

#### Listar Planta para Venta

```javascript
// Solo propietario puede listar
await contract.list_for_sale({
  plant_id: 1,
  price_xlm: 75
})
```

#### Comprar Planta

```javascript
// Cualquier usuario autenticado
await contract.buy_listing({
  listing_id: 1
})
// Transfiere XLM del comprador al vendedor
// Cambia ownership de la planta
```

**Funcionalidades UI:**
- ✅ Grid de plantas disponibles
- ✅ Filtro por precio
- ✅ Botón "Comprar" (solo si no eres propietario)
- ✅ Indicador de estado (Disponible/Vendida)

### 3. Sistema de Validación

**Ruta:** `/validator`  
**Componente:** `ValidatorDashboard.vue`

```javascript
// Votar por planta
await contract.vote_for_plant({
  plant_id: 1,
  voter: "GXXXXXX..."  // Public key validador
})
```

**Lógica de Validación:**
- Cada validador = 1 voto por planta
- No puede votar su propia planta
- Votos incrementan credibilidad
- Futuro: Threshold de votos para "verificado"

### 4. Balance y Account Info

**Componente:** `Login.vue` (indicador de cuenta)

```javascript
// Fetch balance desde Horizon
const response = await fetch(
  `https://horizon-testnet.stellar.org/accounts/${publicKey}`
)
const account = await response.json()
const xlmBalance = account.balances.find(
  b => b.asset_type === 'native'
).balance

// Display: "Balance: 9,542.3500 XLM"
```

---

## 🧪 TESTING

### Testing Checklist Desktop

#### 1. Navegación Sin Autenticación
- [ ] Acceder a `/plants` → redirige a `/login`
- [ ] Nav links deshabilitados (gris)
- [ ] Navbar muestra "⚠️ Sin sesión"

#### 2. Crear Cuenta Nueva
- [ ] Ingresar contraseña → confirmar contraseña
- [ ] Click "Crear Cuenta"
- [ ] Ver PUBLIC_KEY generado
- [ ] Ver SECRET_KEY (guardar)
- [ ] Ver QR code
- [ ] Indicador verde "✅ Cuenta Activa"
- [ ] Balance: "—" (sin fondos aún)

#### 3. Financiar Cuenta (Testnet)
- [ ] Copiar PUBLIC_KEY
- [ ] Ir a https://laboratory.stellar.org/#account-creator
- [ ] Pegar public key → "Get test network lumens"
- [ ] Recargar página en DApp
- [ ] Balance actualizado: "10,000.0000 XLM"

#### 4. Registrar Planta
- [ ] Ir a "Registrar"
- [ ] Completar formulario
- [ ] Click "Registrar Planta"
- [ ] Firmar transacción (Freighter popup / auto con local key)
- [ ] Ver confirmación con hash
- [ ] Planta visible en "Plantas"

#### 5. Listar en Marketplace
- [ ] Ir a "Plantas"
- [ ] Click "Listar para Venta" en tu planta
- [ ] Ingresar precio (ej: 100 XLM)
- [ ] Confirmar
- [ ] Planta visible en "Marketplace"

#### 6. Logout y Re-login
- [ ] Click "Cerrar Sesión" en indicador
- [ ] Navbar: "⚠️ Sin sesión"
- [ ] Intentar acceder plantas → redirige login
- [ ] Tab "Ingresar" → desbloquear con password
- [ ] ✅ Sesión restaurada

### Testing WalletConnect Mobile

#### Setup ngrok

```bash
# Terminal 1
cd frontend/vue-project
npm run dev

# Terminal 2
ngrok http 3000
# Copiar URL: https://xxxx-xxxx.ngrok.io
```

#### Flujo Testing

1. **En Mobile Browser:**
   - Navega a URL de ngrok
   - Acepta warning de certificado
   - Ve a Login

2. **Generar QR:**
   - Tab "Ingresar"
   - Click "📱 Generar QR"
   - Espera renderizado QR

3. **Escanear con Freighter Mobile:**
   - Abre Freighter app
   - Toca ícono scan
   - Escanea QR de pantalla

4. **Aprobar Conexión:**
   - Freighter muestra "Aprobar conexión con Herbamed"
   - Toca "Aprobar"

5. **Verificar Conexión:**
   - Vuelve a navegador mobile
   - Ver "✅ Cuenta Activa"
   - Public key + balance visible
   - Método: "WalletConnect Mobile"

6. **Firmar Transacción:**
   - Registra una planta
   - Freighter mobile recibe request
   - Revisar detalles tx
   - Aprobar firma
   - Ver confirmación en DApp

---

## 🚀 DEPLOYMENT

### Smart Contract

#### 🔑 Keypairs del Proyecto

**Deployer Account (Admin):**
```
Public Key:  GADZC7QBB4TWRFECMKN6O7YUC5THLYCTPIYBPZH2MXRJKYDPIICESF23
Secret Key:  SC6F34PG32JOVH6KUIMOW4GDX33OGRJP6WNRQMRYROJJ57GZ5YIZXEAK
```

**⚠️ Rol de estos Keypairs:**
- **Deployment**: Usados para desplegar el contrato en testnet
- **Autorización**: Tienen permisos de administrador sobre el contrato
- **Fees**: Pagan los costos de transacciones (fondeados con 10,000 XLM testnet)
- **Signing**: Firman transacciones administrativas
- **⚠️ SEGURIDAD**: Mantener el Secret Key privado y seguro (nunca compartir en producción)

**Contract Deployed:**
```
Contract ID: CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR
Network:     Stellar Testnet
Status:      ✅ Activo
Explorer:    https://stellar.expert/explorer/testnet/contract/CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR
```

#### 📝 Proceso Completo de Creación de Contrato

**PASO 1: Escribir Código Rust**

```rust
// contracts/medicinal-plants/src/lib.rs
#![no_std]
use soroban_sdk::{contract, contractimpl, Env, String, Address};

#[contract]
pub struct MedicinalPlantsContract;

#[contractimpl]
impl MedicinalPlantsContract {
    pub fn register_plant(env: &Env, id: String, name: String) -> String {
        // Lógica del contrato
        env.storage().instance().set(&DataKey::Plant(id.clone()), &plant);
        id
    }
}
```

**PASO 2: Compilar a WebAssembly**

```bash
# Navegar al directorio del contrato
cd contracts/medicinal-plants

# Build (compila a WASM optimizado)
soroban contract build

# Internamente ejecuta:
# cargo build --target wasm32-unknown-unknown --release

# Output generado:
# ✅ target/wasm32-unknown-unknown/release/medicinal_plants.wasm (~50-100 KB)
```

**PASO 3: Generar Keypair de Deployment**

```bash
# Generar nueva identity
soroban keys generate deployer --network testnet

# Ver public key generada
soroban keys address deployer
# Output: GADZC7QBB4TWRFECMKN6O7YUC5THLYCTPIYBPZH2MXRJKYDPIICESF23

# Fondear cuenta con Friendbot (solo testnet)
curl "https://friendbot.stellar.org?addr=$(soroban keys address deployer)"
# ✅ Cuenta fondeada con 10,000 XLM testnet
```

**PASO 4: Deploy a Testnet**

```bash
# Deploy el contrato compilado
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/medicinal_plants.wasm \
  --source deployer \
  --network testnet

# ✅ Output: CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR
#            ↑ Tu nuevo CONTRACT_ID
```

**🔐 Qué sucede internamente:**

1. **Build Transaction**: stellar-cli crea transacción con:
   - `HostFunction::UploadContractWasm` (sube .wasm a ledger)
   - `HostFunction::CreateContract` (instancia contrato)

2. **Firma**: Usa secret key de `deployer` para firmar tx

3. **Submit**: Envía a `https://soroban-testnet.stellar.org`

4. **Blockchain procesa**:
   - ✅ Valida firma del deployer
   - 💰 Cobra fee (~100 stroops)
   - 📦 Almacena WASM en ledger
   - 🆔 Genera Contract ID único (CA5C...)

5. **Retorna**: Contract Address para usar en frontend

**PASO 5: Verificar Deployment**

```bash
# Ver contrato en explorer
https://stellar.expert/explorer/testnet/contract/CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR

# Ver transacciones del deployer
https://stellar.expert/explorer/testnet/account/GADZC7QBB4TWRFECMKN6O7YUC5THLYCTPIYBPZH2MXRJKYDPIICESF23

# Invocar función del contrato (test)
soroban contract invoke \
  --id CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR \
  --source deployer \
  --network testnet \
  -- \
  register_plant \
  --id "plant001" \
  --name "Aloe Vera"
```

### Frontend

#### 🔧 Configuración de Environment Variables

```bash
# frontend/vue-project/.env
VITE_CONTRACT_ADDRESS=CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_SOROBAN_NETWORK=testnet
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_WC_PROJECT_ID=4d6e4ea28e2c05227eeec7733dfd78ff

# ⚠️ Solo para desarrollo/testing local (nunca en producción)
# VITE_SECRET_KEY=SC6F34PG32JOVH6KUIMOW4GDX33OGRJP6WNRQMRYROJJ57GZ5YIZXEAK
```

**📋 Descripción de Variables:**

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_CONTRACT_ADDRESS` | ID del contrato desplegado | `CA5C74SZ...` |
| `VITE_SOROBAN_RPC_URL` | Endpoint Soroban RPC | `https://soroban-testnet.stellar.org` |
| `VITE_SOROBAN_NETWORK` | Red Stellar (testnet/mainnet) | `testnet` |
| `VITE_HORIZON_URL` | API Horizon para balances | `https://horizon-testnet.stellar.org` |
| `VITE_WC_PROJECT_ID` | WalletConnect Project ID | `4d6e4ea...` (obtener en walletconnect.com) |

#### Desarrollo Local

```bash
cd frontend/vue-project
npm install
npm run dev
# ✅ http://localhost:3000
```

#### Build Producción

```bash
npm run build
# Output: dist/

# Preview build
npm run preview
```

#### Deploy a Vercel (Recomendado)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend/vue-project
vercel

# ⚙️ Configurar Environment Variables en Vercel Dashboard:
# Settings → Environment Variables → Add New
# - VITE_CONTRACT_ADDRESS
# - VITE_SOROBAN_RPC_URL
# - VITE_SOROBAN_NETWORK
# - VITE_HORIZON_URL
# - VITE_WC_PROJECT_ID
```

#### Deploy a Netlify

```bash
# netlify.toml (ya incluido en el proyecto)
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Deploy
netlify deploy --prod

# ⚙️ Configurar variables en Netlify:
# Site settings → Environment variables
```

---

## 🔄 FLUJO COMPLETO: CONTRATO → FRONTEND → USUARIO

```
1. Código Rust (lib.rs)
        ↓ cargo build
2. WASM Binary (medicinal_plants.wasm)
        ↓ soroban deploy --source deployer
3. [Keypair GADZ... firma transacción]
        ↓
4. Stellar Network procesa y almacena
        ↓
5. ✅ Contract ID: CA5C74SZ...
        ↓
6. Frontend config.js conecta con CONTRACT_ID
        ↓
7. Usuario autenticado invoca función
        ↓
8. client.js construye transacción
        ↓
9. Freighter/Local/WC firma transacción
        ↓
10. Submit a Soroban RPC
        ↓
11. Blockchain ejecuta función del contrato
        ↓
12. ✅ Resultado guardado en ledger
        ↓
13. Frontend recibe confirmación
        ↓
14. UI actualiza estado
```

---

## 🗺️ ROADMAP Y PRÓXIMOS PASOS

### Fase 1: MVP Completo ✅ (COMPLETADO)

- [x] Smart contract desplegado
- [x] Frontend funcional
- [x] Autenticación 3 métodos
- [x] CRUD plantas
- [x] Marketplace básico
- [x] Sistema de votos

### Fase 2: Mejoras UX/UI 🔄 (EN PROGRESO)

- [ ] **Persistencia de sesión** (localStorage)
  - Guardar publicKey + authMethod
  - Auto-login al recargar página
  - Session timeout (30 min)

- [ ] **Balance auto-refresh**
  - Polling cada 30s cuando autenticado
  - Botón "Refrescar Balance"
  - Loading indicator

- [ ] **Historial de transacciones**
  - Tabla con últimas 10 tx
  - Link a Stellar Explorer
  - Filtro por tipo (registro/compra/voto)

- [ ] **Notificaciones toast**
  - Tx confirmada
  - Errores amigables
  - Warnings (fondos insuficientes)

### Fase 3: Features Avanzados 📋 (PLANIFICADO)

- [ ] **Búsqueda y filtros**
  - Buscar por nombre/científico
  - Filtrar por precio range
  - Ordenar por votos/fecha

- [ ] **Faucet integrado**
  - Botón "Solicitar XLM testnet"
  - Auto-request desde UI
  - Verificación de cuenta sin fondos

- [ ] **Multi-idioma (i18n)**
  - Español (actual)
  - Inglés
  - Selector en navbar

- [ ] **Dashboard Analytics**
  - Total plantas registradas
  - Total XLM en marketplace
  - Top validadores
  - Gráficas Chart.js

### Fase 4: Producción (Mainnet) 🎯 (FUTURO)

- [ ] Deploy a Stellar Mainnet
- [ ] Auditoría de seguridad del contrato
- [ ] Integración con wallets mainnet
- [ ] Sistema de fees/comisiones
- [ ] KYC/AML compliance (si aplica)
- [ ] Legal: Términos de servicio
- [ ] Marketing: Landing page
- [ ] Onboarding: Tutorial interactivo

### Fase 5: Escalabilidad 🚀 (VISIÓN)

- [ ] Backend API (cache, analytics)
- [ ] Base de datos off-chain (metadata)
- [ ] IPFS para imágenes de plantas
- [ ] Sistema de reputación validadores
- [ ] Gamificación (badges, rankings)
- [ ] Mobile app nativa (React Native)
- [ ] Integración con DEX (swap XLM<>otras crypto)

---

## 📞 SOPORTE Y CONTRIBUCIÓN

### Reportar Bugs

1. Ir a: https://github.com/RicardoMtzSts/herbamed-blockchain/issues
2. Click "New Issue"
3. Seleccionar template "Bug Report"
4. Completar información:
   - Descripción del bug
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots (si aplica)
   - Consola del navegador (F12 → Console)

### Contribuir

```bash
# Fork del repo
git clone https://github.com/TU_USUARIO/herbamed-blockchain.git
cd herbamed-blockchain

# Crear branch feature
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commit
git add .
git commit -m "feat: descripción cambios"

# Push a tu fork
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
```

### Contacto

- **GitHub:** https://github.com/RicardoMtzSts
- **Email:** (agregar si aplica)
- **Discord:** (agregar si aplica)

---

## 📄 LICENCIA

MIT License - Ver archivo `LICENSE` para detalles.

---

## 🙏 AGRADECIMIENTOS

- **Stellar Development Foundation** - Blockchain y documentación
- **Soroban Team** - Smart contracts framework
- **Freighter Team** - Wallet extension
- **WalletConnect** - Protocolo de conexión mobile
- **Vue.js Community** - Framework frontend

---

**¿Listo para comenzar?**

```bash
cd frontend/vue-project
npm install
npm run dev
# Abre http://localhost:3000
# ¡Registra tu primera planta! 🌱
```

---

*Documento generado el 5 de Diciembre, 2025*  
*Versión del proyecto: 2.0.0*
