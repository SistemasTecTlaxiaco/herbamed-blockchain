# 📊 Estado del Proyecto HerbaMed - Actualización 25 Nov 2025

## ✅ Completado

### **Backend/Contrato**
- [x] Contrato Rust Soroban desplegado en testnet
  - Contract ID: `CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR`
  - Funciones: register_plant, list_for_sale, buy_listing, vote_for_plant
  - Tests unitarios: 2/2 passing ✅

### **Frontend Core**
- [x] Vue 3 + Vite configurado
- [x] Router con rutas: /plants, /plants/register, /marketplace, /validator, /login
- [x] Navbar con navegación funcional
- [x] Bootstrap 5 integrado

### **Componentes UI**
- [x] `Login.vue` - Autenticación con 3 pestañas:
  - Ingresar (cuenta local cifrada)
  - Crear Cuenta (genera nuevo keypair)
  - Importar Clave (importa SECRET_KEY existente)
- [x] `PlantList.vue` - Lista de plantas registradas
- [x] `PlantRegistration.vue` - Formulario registro plantas
- [x] `ValidatorDashboard.vue` - Vista validadores
- [x] `MarketPlace.vue` - **NUEVO** ✨
  - Modo Demo / Blockchain toggle
  - Listar plantas para venta
  - Comprar plantas listadas

### **Cliente Soroban (client.js)**
- [x] Funciones business logic:
  - registerPlant, getAllPlants
  - voteForPlant, getPlantVotes
  - listForSale, buyListing, getListing
- [x] Signing methods implementados:
  - Freighter (con detección mejorada)
  - SECRET_KEY local
  - Builder service (preparado)
- [x] Modo Demo (localStorage)
  - Sin firma, datos locales
  - Keys: herbamed:plants, herbamed:listings, herbamed:votes
- [x] RPC health check
- [x] Manejo robusto de storage (in-memory fallback)

### **Tests**
- [x] Rust contract tests: 2 passing
- [x] Frontend Vitest: 14 tests passing ✅
  - client.test.js (básicos)
  - client.operations.test.js (negocio)
  - client.wallet.test.js (wallet integration)

### **Documentación**
- [x] `USER_MANUAL.md` - Manual de usuario
- [x] `DEVELOPER_GUIDE.md` - Guía desarrollador con diagrama Mermaid
- [x] `TEST_REPORT.md` - Reporte de tests
- [x] `DEPLOY_AND_ACTIONS.md` - Despliegue y CI/CD
- [x] `SIGNING_GUIDE.md` - **NUEVO** ✨
  - Explicación completa métodos de firma
  - Modo Demo vs Blockchain
  - Tipos de cuenta
  - Flujos con ejemplos de código

### **Git & CI**
- [x] Branch: `feature/docs-deploy-actions`
- [x] Commits organizados con mensajes semánticos
- [x] Push a GitHub remoto
- [x] PR listo para crear: https://github.com/RicardoMtzSts/herbamed-blockchain/pull/new/feature/docs-deploy-actions

---

## 🔴 Problemas Actuales

### **CRÍTICO: Freighter No Detectada**
**Síntoma**: 
- Extension instalada y activa (visible en navegador)
- `window.freighterApi` NO se inyecta
- Error en consola: "Freighter API not available"

**Investigado**:
- ✅ CSP removida (ya no bloquea extensiones)
- ✅ Múltiples patrones de detección implementados:
  - `window.freighterApi`
  - `window.stellar.isConnected`
  - `window.freighter`
- ✅ Polling con timeout de 3 segundos
- ✅ `onMounted` lifecycle hook esperando inyección

**Posibles causas**:
1. Versión de Freighter incompatible con patrón actual
2. Freighter requiere interacción manual antes de inyectar API
3. Conflicto con otra extensión
4. Necesita hard refresh del navegador

**Próximos pasos**:
- [ ] Verificar versión de Freighter instalada
- [ ] Probar hard refresh (Ctrl+Shift+R)
- [ ] Revisar permisos de extensión en chrome://extensions
- [ ] Añadir botón "Re-detectar Freighter"
- [ ] Implementar método alternativo: deep-link a Freighter
- [ ] Consultar docs oficiales Freighter sobre inyección

---

## 🟡 Pendientes (No Bloqueantes)

### **Funcionalidad**
- [ ] Implementar validación real de plantas (validadores)
- [ ] Conectar RegisterPlant con firma blockchain (actualmente solo demo)
- [ ] Añadir vistas detalladas de plantas
- [ ] Implementar búsqueda/filtros en lista
- [ ] Añadir paginación si hay muchas plantas

### **UX/UI**
- [ ] Loading states más visuales
- [ ] Toasts/notifications en lugar de alerts
- [ ] Animaciones de transición
- [ ] Diseño responsive mejorado
- [ ] Dark mode

### **Testing**
- [ ] E2E tests con Cypress/Playwright
- [ ] Tests de integración con contrato real
- [ ] Performance tests

### **DevOps**
- [ ] GitHub Actions workflow
- [ ] Deploy automático a Vercel/Netlify
- [ ] Environment variables management
- [ ] Sentry error tracking

---

## 📈 Avances Desde Última Actualización

### **Hoy (25 Nov)**
1. ✨ Creado componente Marketplace completo
2. 📝 Documentación exhaustiva de firmas (SIGNING_GUIDE.md)
3. 🔧 Mejorada detección de Freighter (múltiples intentos)
4. 🐛 Removida CSP que bloqueaba extensiones
5. ✅ Tests frontend: 14 passing
6. 📦 Commits y push a GitHub

### **Semana Anterior**
- Implementación inicial signing (Freighter/local/builder)
- Tests Rust contract arreglados
- Documentación completa (5 archivos markdown)
- Vite + Vue configurado con HMR

---

## 🎯 Próximos Pasos (Prioridad)

### **Corto Plazo (Esta semana)**
1. **RESOLVER Freighter** 🔴
   - Investigar versión exacta instalada
   - Probar métodos alternativos de conexión
   - Implementar fallback visible (SECRET_KEY mode)

2. **Validar firma real en RegisterPlant**
   - Cambiar de modo demo a blockchain
   - Probar con SECRET_KEY si Freighter falla
   - Verificar transacción en Stellar Expert

3. **Testing E2E básico**
   - Flujo completo: registrar → listar → votar
   - Con SECRET_KEY (automatizado)

### **Medio Plazo (Próximas 2 semanas)**
1. Implementar validadores reales
2. Añadir autenticación persistente (JWT/session)
3. Deploy a producción (testnet primero)
4. Documentar API del contrato

### **Largo Plazo**
1. Migrar a mainnet (cuando esté listo)
2. Integrar payment con tokens
3. Sistema de reputación/ratings
4. Mobile app (React Native)

---

## 🔧 Comandos Útiles

### **Desarrollo**
```bash
# Frontend
cd frontend/vue-project
npm run dev          # http://127.0.0.1:3000
npm test             # Vitest (14 tests)
npm run build        # Production build

# Contrato
cd contracts/medicinal-plants
cargo test           # 2 tests
cargo build --target wasm32-unknown-unknown --release

# Git
git status
git add -A
git commit -m "mensaje"
git push origin feature/docs-deploy-actions
```

### **Testing Manual**
```bash
# Limpiar localStorage (consola navegador)
localStorage.clear()

# Ver datos demo
localStorage.getItem('herbamed:plants')
localStorage.getItem('herbamed:listings')
localStorage.getItem('herbamed:votes')
```

---

## 📊 Métricas

- **Líneas de código**: ~3,500 (estimado)
- **Componentes Vue**: 7
- **Rutas**: 6
- **Tests**: 16 (14 frontend + 2 contract)
- **Documentos**: 6 markdown files
- **Commits**: 15+ en feature branch
- **Issues resueltas**: 8
- **Issues pendientes**: 1 crítica (Freighter)

---

## 🤝 Contribuyendo

Si encuentras bugs o tienes sugerencias:
1. Abre issue en GitHub
2. Describe el problema con screenshots
3. Incluye logs de consola si es error

---

**Última actualización**: 25 Noviembre 2025, 5:15 AM  
**Branch activo**: `feature/docs-deploy-actions`  
**Próxima revisión**: Cuando se resuelva issue de Freighter
