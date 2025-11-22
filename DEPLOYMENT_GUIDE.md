# Guía rápida de despliegue y pruebas (Herbamed DApp)

Fecha: 2025-11-22

Esta guía resume los pasos para desplegar y probar la DApp Herbamed en entornos de desarrollo (testnet) y su aproximación a producción.

## Resumen
- Frontend: Vue 3 + Vite
- Contrato: Soroban smart contract (Rust) en `contracts/medicinal-plants/src/lib.rs`
- Helper dev: servidor Express que construye unsigned XDRs para firmar desde el frontend

## Requisitos previos
- Node.js (v18+ recomendado)
- npm
- Freighter extension (para pruebas en navegador)
- Cuenta testnet Stellar/Soroban con fondos (si vas a enviar transacciones reales)

## Paso 1 — Preparar entorno local
1. Clonar el repositorio y moverse al frontend:
```bash
cd herbamed-blockchain/frontend/vue-project
npm install
```
2. Opcional: instalar dependencias del contrato y toolchain Rust/Soroban si vas a compilar/desplegar el contrato.

## Paso 2 — Levantar servicios en desarrollo
1. Levantar el helper builder (opcional pero recomendado si el SDK en el navegador no expone host-function XDR helpers):
```bash
cd frontend/vue-project
node scripts/tx_builder_server.js
# escucha en http://127.0.0.1:4001
```
2. Levantar el frontend:
```bash
npm run dev
# abre http://127.0.0.1:3000 (o el puerto que Vite indique)
```
3. Abrir la DApp en el navegador y usar la pestaña `Crear Cuenta` para generar una cuenta local, o conectar Freighter.

## Paso 3 — Probar flujo de firma/envío
- El flujo estándar en la DApp es:
  1. Construir un XDR (si el SDK lo soporta en navegador) o pedirlo a `POST /build_tx`.
  2. Firmar con Freighter (extensión) o con clave local en memoria.
  3. Enviar el XDR firmado a `${RPC_URL}/send_transaction`.

- Para pruebas manuales con `curl` al builder:
```bash
curl -X POST http://127.0.0.1:4001/build_tx \
  -H "Content-Type: application/json" \
  -d '{"contractId":"<CONTRACT_ADDRESS>","method":"register_plant","args":["id","name","desc"],"publicKey":"<PUBLIC_KEY>","network":"testnet"}'
```

## Paso 4 — Deployed contract (testnet/mainnet)
- Compilar y desplegar el contrato Soroban desde el directorio `contracts/`.
  - Sigue la documentación de Soroban Tools para compilar a WASM y desplegar en testnet.
- Actualizar `frontend/vue-project/.env` con `VITE_CONTRACT_ADDRESS` apuntando al contrato desplegado.

## Seguridad y producción
- No guardes secretos en el repositorio.
- Para producción usa wallets externas (Freighter, WalletConnect, TSS providers) — evita almacenar secret keys en el navegador.
- Si usas un backend para construir XDRs, valida inputs y autentica llamadas si el endpoint estará público.

## Notas sobre `invokeHostFunction` vs fallback
- Algunas builds del `@stellar/stellar-sdk` no exponen helpers para construir `invokeHostFunction` en el navegador; por eso el helper server intenta construir la XDR si la librería lo soporta en el servidor, y si no usa un fallback `manageData` (útil para probar la cadena de firmas/envío, no para ejecutar el contrato realmente).

## Siguientes mejoras sugeridas
- Implementar `/build_invoke` que genere XDR de `invokeHostFunction` usando ABI del contrato.
- Probar e2e con Freighter y testnet (crear cuentas, financiar con friendbot, firmar transacciones).
- Preparar scripts de CI que verifiquen la construcción del contrato y la integridad del frontend.

---
