# 🗺️ ROADMAP - HerbaMed Blockchain

**Estado**: Actualizado 11 de Diciembre, 2025  
**Versión Actual**: 2.0 (Blockchain-first, sin localStorage para datos de negocio)

---

## ✅ COMPLETADO (v2.0)

### Smart Contract (Soroban/Rust)
- ✅ Funciones de lectura: `get_all_plants()`, `get_all_listings()`, `get_plant_votes()`, `get_listing()`, `get_validators()`
- ✅ Funciones de escritura: `register_plant()`, `vote_for_plant()`, `list_for_sale()`, `buy_listing()`
- ✅ Validadores y sistema de votación
- ✅ Marketplace compra/venta
- ✅ Tracking de IDs con `PlantIds` y `ListingIds` vectores

### Frontend (Vue 3 + Vite)
- ✅ Cliente blockchain centralizado (`client.js`, 854 líneas)
- ✅ Autenticación multi-método (Freighter, WalletConnect, clave local)
- ✅ Componentes actualizados: PlantRegistration, MarketPlace, ValidatorDashboard, PlantList
- ✅ Eliminación de localStorage para datos de negocio (solo auth)
- ✅ Enlaces a Stellar Explorer en transacciones (compra/venta/registro/votación)

### Documentación
- ✅ `ESTADO_FINAL.md` - Estado consolidado del proyecto
- ✅ `RESPUESTAS_PREGUNTAS.md` - Q&A detallado de los 3 problemas resueltos
- ✅ `README.md` - Descripción general y guía rápida
- ✅ `DEVELOPER_GUIDE.md` - Setup y deploy de contrato
- ✅ `USER_MANUAL.md` - Manual de usuario

### Testing
- ✅ Tests unitarios Rust (`cargo test`): 2/2 pasando
- ⏳ Tests manuales pendientes (requieren iniciar servidor y UI)

---

## ⏳ PENDIENTE INMEDIATO (v2.1)

### 1. **Tests Manuales Completos** (BLOQUEADOR)
**Por qué**: Verificar que el flujo end-to-end funciona en navegador con transacciones reales.

**Qué hacer**:
1. Iniciar servidor: `cd frontend/vue-project && npm run dev`
2. Conectar wallet (Freighter o clave local)
3. Ejecutar tests:
   - [ ] Registrar planta → Verificar enlace Explorer funciona
   - [ ] Votar por planta → Verificar contador incrementa a 1
   - [ ] Listar planta → Verificar aparece en marketplace
   - [ ] Comprar planta → Verificar desaparece del marketplace
   - [ ] Cerrar/reabrir navegador → Verificar persistencia de datos

**Resultado esperado**: Todos los pasos exitosos y datos persistidos en blockchain.

---

### 2. **Actualizar TRANSACCIONES_GUIA.md** (DOCUMENTACIÓN)
**Por qué**: Usuario solicita guía actualizada sobre cuándo se ejecutan transacciones.

**Qué incluir**:
- Tabla de acciones: Registro, Votación, Listar, Comprar
- Qué es transacción vs. lectura (RPC simulación)
- Cómo verificar en Stellar Explorer
- Costos (fees) asociados
- Ejemplos de flujos reales

**Tiempo estimado**: 1-2 horas (después de tests manuales)

---

### 3. **Flujo Bifurcado: Modo Demo vs. Blockchain** (OPCIONAL)
**Por qué**: Usuario preguntó si registro/votación podrían ser solo "indicativos" sin generar transacción.

**Opciones**:
- **Opción A (Recomendada)**: Mantener tal como está (transacciones reales para todo)
- **Opción B**: Agregar parámetro `dryRun` en `registerPlant()` y `voteForPlant()` para modo demo sin transacción
- **Opción C**: Campo de configuración en UI para elegir modo

**Decisión pendiente**: ¿Implementar modo demo o mantener transacciones reales para todas las acciones?

**Tiempo estimado**: 2-3 horas si se elige Opción B

---

## 🔮 FUTURO (v2.2+)

### Funcionalidades Nuevas

#### 4. **Transfer de Tokens (Pagos en XLM)**
**Descripción**: Integrar `transfer_tokens()` del contrato para mover XLM en compras.

**Trabajo**:
- Descomentar y completar `transfer_tokens()` en `lib.rs`
- Actualizar `buyListing()` en `client.js` para enviar pago
- Mostrar confirmación de fondos transferidos
- Validar saldo disponible antes de compra

**Impacto**: Marketplace con pagos reales (actualmente `buy_listing` solo marca como no disponible)

**Tiempo estimado**: 2-3 horas

---

#### 5. **Sistema de Reputación de Vendedores**
**Descripción**: Agregarmétrica de calificación por comprador en cada transacción.

**Trabajo**:
- Extender `Listing` con campo `seller_rating: i32`
- Función `rate_seller(plant_id: String, rating: i32)`
- UI para mostrar rating promedio y reseñas

**Impacto**: Mejor confianza en marketplace

**Tiempo estimado**: 4-5 horas

---

#### 6. **Historial de Transacciones (Personal)**
**Descripción**: Dashboard con transacciones del usuario (registro, votos, compras, ventas).

**Trabajo**:
- Agregar `DataKey::UserTransactions(Address)` en contrato
- Función `get_user_transactions(account: Address) → Vec<Transaction>`
- Vista de historial en frontend

**Tiempo estimado**: 3-4 horas

---

#### 7. **Validación Avanzada de Plantas**
**Descripción**: Requerir datos de origen, certificados, etc.

**Trabajo**:
- Extender `MedicinalPlant` con campos adicionales
- Sistema de documentación on-chain
- Requerimientos por validador

**Tiempo estimado**: 5-6 horas

---

### Integraciones Externas

#### 8. **API Rest Pública**
**Descripción**: Endpoint para consultar plantas y listings sin blockchain (caché).

**Trabajo**:
- Backend Node.js + Express con Postgres
- Sincronizar datos del contrato en DB
- Endpoints: GET /plants, GET /listings, GET /votes

**Tiempo estimado**: 8-10 horas

---

#### 9. **Webhook de Eventos**
**Descripción**: Notificaciones cuando se registra una planta o hay compra.

**Trabajo**:
- Escuchar eventos del contrato
- Guardar en cola (Redis)
- Enviar webhooks a clientes suscritos

**Tiempo estimado**: 6-8 horas

---

### Mejoras UX/DevOps

#### 10. **Producción (Mainnet)**
**Descripción**: Desplegar a Stellar Mainnet (cuidado: fondos reales).

**Trabajo**:
- Auditoría de seguridad del contrato
- Testing en testnet completo
- Actualizar variables de entorno
- Deploy y migración de datos

**Impacto**: Aplicación lista para usuarios reales

**Tiempo estimado**: 4-6 horas (incluye auditoría externa)

---

#### 11. **Mobile App (React Native)**
**Descripción**: App nativa iOS/Android.

**Trabajo**:
- Compartir lógica `client.js` (isomórfico)
- UI con React Native Paper
- WalletConnect integrado

**Tiempo estimado**: 40-50 horas

---

---

## 📋 Matriz de Prioridades

| ID | Tarea | Prioridad | Bloqueador | Tiempo | Dependencias |
|----|-------|-----------|-----------|--------|--------------|
| 1 | Tests Manuales | 🔴 CRÍTICO | Sí | 2h | Nada |
| 2 | TRANSACCIONES_GUIA.md | 🔴 CRÍTICO | No | 1.5h | Tests OK |
| 3 | Modo Demo (dryRun) | 🟡 ALTA | No | 2.5h | Tests OK |
| 4 | Transfer de Tokens | 🟡 ALTA | No | 3h | Tests OK |
| 5 | Reputación Vendedores | 🟠 MEDIA | No | 5h | Transfer OK |
| 6 | Historial Personal | 🟠 MEDIA | No | 4h | Transfer OK |
| 7 | Validación Avanzada | 🟠 MEDIA | No | 6h | Historial OK |
| 8 | API Rest Pública | 🟢 BAJA | No | 10h | Validación OK |
| 9 | Webhooks | 🟢 BAJA | No | 8h | API Rest OK |
| 10 | Mainnet | 🟢 BAJA | Sí (post-audit) | 6h | Todo OK |
| 11 | Mobile | 🔵 FUTURA | No | 50h | Mainnet OK |

---

## 🎯 Próximos Pasos (Order Recomendado)

### Semana 1
1. **Ejecutar tests manuales** (2h) → Confirmar todo funciona
2. **Actualizar TRANSACCIONES_GUIA.md** (1.5h) → Documenta flujos
3. **Decidir modo demo** (30m) → Impacta design

### Semana 2
4. **Implementar Transfer de Tokens** (3h) → Pagos reales
5. **QA Transfer** (1h) → Validar fondos

### Semana 3+
6. **Reputación de Vendedores** (5h)
7. **Historial de Transacciones** (4h)
8. Considerar **Mainnet** si está todo validado

---

## 📞 Decisiones Pendientes

### 1. ¿Modo Demo o Transacciones Reales?
- **Actual**: Todas las acciones generan transacciones (registro, votación, compra/venta)
- **Pregunta del Usuario**: ¿Deberían registro/votación ser solo indicativos sin transacción?
- **Recomendación**: Mantener transacciones reales para garantía blockchain, pero ofrecer modo demo (`dryRun=true`) como opción

### 2. ¿Transfer de Tokens o Solo Marketplace Simbólico?
- **Actual**: `buy_listing` marca planta como no disponible pero no mueve fondos
- **Opción A**: Implementar `transfer_tokens` para pagos reales (seguro, auditable)
- **Opción B**: Mantener como es (solo cambio de estado, sin dinero)
- **Recomendación**: Opción A para caso de uso real

### 3. ¿Cuándo a Mainnet?
- **Recomendación**: Después de auditoría externa y 100% de tests pasando
- **Timeline**: Mínimo Año 2026 Q1

---

## 📊 Métricas de Éxito

- ✅ Tests manuales 100% pasando
- ✅ 0 errores en transacciones blockchain
- ✅ Documentación actualizada
- ✅ Código sin warnings de lint
- ✅ Cobertura de tests >80%
- ✅ Usuarios reales registrando plantas

---

**Último actualizado**: 11 de Diciembre, 2025  
**Mantenedor**: Ricardo M.  
**Repositorio**: https://github.com/RicardoMtzSts/herbamed-blockchain
