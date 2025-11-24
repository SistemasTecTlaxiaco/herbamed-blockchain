# Reporte de Pruebas Unitarias y Calidad — Herbamed DApp

Fecha: 2025-11-23

Resumen:
- Entorno: Testnet (Soroban / Stellar testnet)
- Objetivo: Validar funciones del cliente Soroban (`frontend/vue-project/src/soroban/client.js`) y los flujos básicos: registrar, listar, votar, construir y firmar transacciones.

1) Detalle de pruebas unitarias realizadas (resumen)
- Test manual/headless (`frontend/vue-project/scripts/test_client_actions.mjs`): comprobación de las funciones exportadas del cliente.
  - `registerPlant()` → retorna objeto con id y datos.
  - `getAllPlants()` → lista actualizada (modo demo: localStorage).
  - `listForSale()` → genera un `listing` local.
  - `voteForPlant()` → incrementa contador local.
  - `getPlantVotes()` → devuelve número de votos.
- Import dinámico en Node: comprobación que `client.js` se importa sin errores (resuelto mediante import namespace para `stellar-sdk`).

2) Cobertura y métricas de calidad (estimadas)
- Cobertura: funciones principales del cliente cubiertas por tests manuales y headless (estimado): 70% de código lógico, 40% de ramas.
- Linter: no se ejecutó automáticamente; recomiendo `npm run lint` en `frontend/vue-project`.
- Tamaño de bundle: `stellar-sdk` se separa en chunk (~967 KB minified), advertencia de chunk > 500 kB (revisar si usar dynamic import o lighter SDK).
- Complejidad ciclomática: moderada en `client.js` por lógica de firma y fallbacks.

3) Casos de prueba propuestos (unitarios y E2E)
- Unitarios (Node + JSDOM / Vitest):
  - Firmar con Freighter (mock de API de Freighter) → retornar XDR firmado.
  - BuildUnsignedXDR con builder mock → validar llamada y formato XDR.
  - getLocalKeypair con VITE_SECRET_KEY y sin él → fallback a localStorage.
  - persistencia localStorage: crear, listar, votar, borrar.
- E2E:
  - Flujo completo con Freighter: conectar → registerPlant → verificar transacción en Horizon (mock o testnet real).
  - Flujo de redeploy: upload WASM + create contract (testnet) usando cuenta fondeada.

4) Comandos útiles
- Ejecutar pruebas unitarias (recomiendo Vitest / Jest):
```bash
# desde frontend/vue-project
npm install
npm run test # o config para vitest: npx vitest
```
- Ejecutar script headless de pruebas:
```bash
node frontend/vue-project/scripts/test_client_actions.mjs
```
- Compilar para WASM (contrato):
  - Si el contrato está en Rust/WASM, comandos típicos:
```bash
# ejemplo para contratos en Rust (cargo + wasm32 target)
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
# output: target/wasm32-unknown-unknown/release/<contract>.wasm
```
- Subir contrato a testnet (ejemplo conceptual usando CLI o SDK):
  - Usar SDK para construir `CreateContract`/`UploadContractWasm` con `stellar-sdk` o herramienta Soroban-CLI (documentación Soroban).

5) Recomendaciones de calidad
- Añadir vitest + mocks para Freighter y builder.
- Añadir linter (`eslint`) y pre-commit hooks para evitar commits con secrets.
- Separar el SDK con dynamic import para reducir TTI.

---

*Fin del reporte de pruebas.*
