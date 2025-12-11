# 🌿 HerbaMed - Blockchain para Plantas Medicinales

Sistema descentralizado de registro, validación y comercio de plantas medicinales construido sobre Stellar/Soroban.

**🎯 Estado:** ✅ **Transacciones Blockchain Funcionales** (11 Dic 2025)  
**📅 Última Actualización:** 11 de Diciembre, 2025  
**🔗 Network:** Stellar Testnet

---

## ⚡ Inicio Rápido

```bash
# Clonar e instalar
git clone https://github.com/RicardoMtzSts/herbamed-blockchain.git
cd herbamed-blockchain/frontend/vue-project
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con RPC_URL, CONTRACT_ADDRESS, etc.

# Ejecutar servidor de desarrollo
npm run dev
# Abre http://127.0.0.1:3000
```

---

## 🎯 Características Principales

✅ **Transacciones Blockchain Funcionales**
- Registro descentralizado de plantas en Soroban
- Firma de transacciones con keypair local
- Envío a RPC con protocolo JSON-RPC 2.0
- Logs detallados de cada paso

✅ **Autenticación Multi-Método**
- Clave Local Cifrada (AES-GCM + PBKDF2)
- Freighter Desktop Wallet
- WalletConnect v2 Mobile (QR)

✅ **Smart Contract Completo**
- Registro de plantas medicinales
- Marketplace compra/venta
- Sistema de validación comunitario
- Queries read-only de datos

✅ **UI Moderna y Responsiva**
- Vue 3 + Vite
- Bootstrap 5 responsive
- Guard de rutas autenticadas
- Indicador de cuenta conectada

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| **[ESTADO_FINAL.md](./ESTADO_FINAL.md)** | 📊 Estado actual consolidado |
| **[RESPUESTAS_PREGUNTAS.md](./RESPUESTAS_PREGUNTAS.md)** | ❓ Respuestas a preguntas clave |
| [TRANSACCIONES_GUIA.md](./TRANSACCIONES_GUIA.md) | 📘 Guía de transacciones (pendiente actualización) |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | 🛠️ Guía para desarrolladores |
| [USER_MANUAL.md](./USER_MANUAL.md) | 👤 Manual de usuario |

---

## 🛠️ Stack Tecnológico

**Blockchain**
- Stellar Testnet
- Soroban Smart Contracts (Rust)
- Contract: `CCW7E6CECERISMD2FIKKYRMSUEU5F7VGPUHMTARG5PQH3IRNM4CFYJRE`
- RPC: https://soroban-testnet.stellar.org:443

**Frontend**
- Vue 3.3.8 + Vite 7.2.2
- Bootstrap 5.3.2 UI Components
- Stellar SDK 14.3.3
- Vue Router 4.2.5 (con auth guards)
- WalletConnect v2.23.0

**Desarrollo**
- Node.js 18+
- npm/yarn package managers

---

## 📖 Uso Básico

### 1. **Autenticarse**
```
Ir a /login → Seleccionar método:
✅ Clave Local (testing - sin Freighter)
✅ Freighter (si está instalado)
✅ WalletConnect Mobile (escanear QR)
```

### 2. **Registrar una Planta**
```
Click "Registrar" → Llenar formulario:
- ID: Identificador único
- Nombre: Ej. "Albaca"
- Nombre Científico: Ej. "Ocimum basilicum"
- Propiedades: Array de beneficios medicinales

Click "Registrar Planta" → Transacción firmada y enviada
```

### 3. **Ver Lista de Plantas**
```
Click "Plantas" → Ver todas las plantas registradas
- Votar por plantas (validadores)
- Ver estado de validación
- Acceder al Marketplace
```

### 4. **Marketplace**
```
Desde planta → Click "Marketplace":
- Listar planta para venta con precio
- Comprar plantas listadas
- Ver historial de transacciones
```

---

## 🏗️ Estructura del Proyecto

```
herbamed-blockchain/
├── frontend/
│   └── vue-project/
│       ├── src/
│       │   ├── components/        # Componentes reutilizables
│       │   │   ├── Login.vue      # Autenticación multi-método
│       │   │   └── plants/        # Componentes plantas
│       │   ├── views/             # Vistas principales
│       │   │   └── plants/        # Listado y registro
│       │   ├── router/            # Rutas con guards
│       │   ├── soroban/           # Cliente blockchain
│       │   │   └── client.js      # API de transacciones (695 líneas)
│       │   └── store/             # Vuex state
│       └── package.json
│
├── contracts/
│   └── medicinal-plants/          # Smart contract Soroban (Rust)
│       ├── src/
│       │   └── lib.rs             # Lógica del contrato
│       └── Cargo.toml
│
├── docs/
│   └── [Documentación auxiliar]
│
├── README.md                       # Este archivo
├── STATUS_ACTUAL.md               # Estado actual (nuevo)
├── TRANSACCIONES_GUIA.md          # Guía de transacciones
├── PROYECTO_HERBAMED_COMPLETO.md  # Documentación completa
└── [Otros documentos...]
```

---

## 🧪 Testing

### Verificar en Blockchain (UI)
- Al registrar, listar o comprar, la UI muestra un `transactionHash` con un enlace directo a Stellar Expert.
- Para consultas (`getAllPlants`, `getAllListings`, `getPlantVotes`) no se generan transacciones; son simulaciones RPC (read‑only).

### Verificar en Stellar Explorer
```
1. Ir a https://stellar.expert/explorer/testnet
2. Buscar tu wallet (public key)
3. Ver transacciones registradas
4. Verificar cambios en account info
```

---

## 🚀 Roadmap

- Pendiente: Actualizar TRANSACCIONES_GUIA.md y USER_MANUAL.md tras pruebas manuales
- Pendiente: Añadir modo opcional "dryRun" para registro/voto si se decide flujo indicativo
- Futuro: Integrar `transfer_tokens` para mover XLM en compras
- Futuro: Validaciones avanzadas y reputación de vendedores
- Firma local de transacciones
- Autenticación multi-método
- Interfaz de usuario básica

### 🔄 En Desarrollo
- Carga dinámica de plantas registradas
- Sistema de votación completo
- Marketplace funcional

### 📋 Próximamente
- Optimización de gas
- Mejoras UX/UI
- Testing completo
- Deploy en Mainnet

---

## ⚠️ Notas Importantes

1. **Desarrollo Solamente:**
   - Keypair local: `SC6F34PGDRKMIPIWIWZOHLHQE7L27DWNVCUD2UKNER7ZLWNKHPQHFNHR`
   - Nunca usar en producción
   - Fondos limitados en testnet

2. **RPC Testnet:**
   - Endpoint: https://soroban-testnet.stellar.org
   - Límite: 100 req/min por IP
   - Latencia: 1-2 segundos

3. **LocalStorage:**
   - `herbamed_plant_ids`: Tracking de plantas
   - `soroban_auth`: Datos de autenticación
   - Se limpia al borrar datos del navegador

---

## 🔗 Enlaces Útiles

- **GitHub:** https://github.com/RicardoMtzSts/herbamed-blockchain
- **Smart Contract:** CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR
- **Stellar Testnet:** https://stellar.expert/explorer/testnet
- **Documentación Stellar:** https://developers.stellar.org

---

## 📞 Soporte

Para reportar issues o contribuir:
1. Abrir issue en GitHub
2. Describir problema/feature
3. Proporcionar logs de consola

---

**Actualizado:** 10 de Diciembre, 2025


## 🚀 Uso

### 1. Crear Cuenta

```
Login → Crear Cuenta
  ↓
Ingresar contraseña
  ↓
✅ Cuenta creada
  ↓
Guardar SECRET_KEY
```

### 2. Financiar (Testnet)

```
Copiar PUBLIC_KEY
  ↓
https://laboratory.stellar.org/#account-creator
  ↓
Get test network lumens (10,000 XLM)
```

### 3. Registrar Planta

```
Plantas → Registrar
  ↓
Completar formulario
  ↓
Firmar transacción
  ↓
✅ Planta en blockchain
```

### 4. Marketplace

```
Plantas → Listar para Venta
  ↓
Ingresar precio XLM
  ↓
Marketplace → Comprar
```

---

## 📁 Estructura

```
herbamed-blockchain/
├── contracts/medicinal-plants/    # Smart contract Soroban
│   └── src/lib.rs
├── frontend/vue-project/          # DApp Vue 3
│   ├── src/
│   │   ├── components/Login.vue   # Auth (3 métodos)
│   │   ├── views/                 # Plantas, Marketplace, Validadores
│   │   ├── soroban/               # Cliente blockchain
│   │   ├── store/                 # Vuex state
│   │   └── router/                # Vue Router + guards
│   └── .env
├── PROYECTO_HERBAMED_COMPLETO.md  # 📖 Doc Completa
└── README.md                      # Este archivo
```

---

## 🧪 Testing

```bash
# Desktop
npm run dev
# → http://127.0.0.1:3000

# Mobile (con ngrok)
# Terminal 1:
npm run dev

# Terminal 2:
ngrok http 3000
# → Usar URL HTTPS en mobile
```

Ver [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) para casos completos.

---

## 🗺️ Roadmap

- [x] Smart contract deployed
- [x] Frontend funcional
- [x] Auth multi-método
- [x] CRUD plantas
- [x] Marketplace
- [x] Sistema validación
- [ ] Persistencia sesión localStorage
- [ ] Balance auto-refresh
- [ ] Historial transacciones
- [ ] Mainnet deployment

---

## 📞 Soporte

- **Issues:** https://github.com/RicardoMtzSts/herbamed-blockchain/issues
- **Docs:** [PROYECTO_HERBAMED_COMPLETO.md](./PROYECTO_HERBAMED_COMPLETO.md)

---

## 📄 Licencia

MIT License

---

**¿Listo para registrar plantas en blockchain?** 🌱

```bash
npm install && npm run dev
```
