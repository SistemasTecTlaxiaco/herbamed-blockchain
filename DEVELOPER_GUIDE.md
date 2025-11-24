# Herbamed — Guía para Desarrolladores

Este documento explica la arquitectura, cómo ejecutar, desarrollar y entender el flujo de transacciones (incluyendo las tres opciones de firma: Freighter, firma local y builder service). Está orientado a quien quiera contribuir o desplegar la DApp.

**Resumen rápido**
- Frontend: `frontend/vue-project` (Vue 3 + Vite)
- Cliente Soroban (helpers): `frontend/vue-project/src/soroban/client.js`
- Configuración compartida: `frontend/vue-project/src/soroban/config.js`
- Scripts de prueba headless: `frontend/vue-project/scripts/test_client_actions.mjs`
- Branch con cambios: `feature/soroban-signing-docs` (commit ejemplo `2f671ce`)

## Estructura relevante del repositorio
- `frontend/vue-project/` — aplicación Vue + Vite
  - `src/` — código fuente
    - `soroban/` — helpers de blockchain (`client.js`, `config.js`)
  - `scripts/` — pequeños scripts para pruebas locales
  - `vite.config.js` — configuración de bundling (manualChunks para `stellar-sdk`)

## Variables de entorno (importantes)
- `VITE_CONTRACT_ADDRESS` — dirección del contrato desplegado
- `VITE_RPC_URL` — URL del nodo RPC (por defecto `https://soroban-testnet.stellar.org`)
- `VITE_NETWORK_PASSPHRASE` — passphrase de la red (testnet/mainnet)
- `VITE_TX_BUILDER_URL` — URL del servicio Builder (opcional)
- `VITE_SECRET_KEY` — (solo para pruebas locales) secret key en claro; no usar en producción

> Nota: en desarrollo con Vite las variables prefijadas con `VITE_` están disponibles en `import.meta.env`.

## Cómo ejecutar la aplicación (desarrollo)
1. En el directorio `frontend/vue-project`:
   - `npm install` (si no se instalaron dependencias)
   - `npm run dev` — inicia Vite en `http://127.0.0.1:3000/` (u otro puerto si 3000 ocupado)
2. Para compilar producción:
   - `npm run build`
   - `npm run preview` (opcional, sirve los archivos de `dist/`)

## Pruebas headless (node)
Hay un script de prueba que importa `client.js` y ejecuta flujos demo sin interfaz:
- `node frontend/vue-project/scripts/test_client_actions.mjs`

Este script usa las implementaciones de `client.js` que en modo demo persisten en `localStorage`. Si ejecutas desde Node, `localStorage` puede no existir; los scripts están escritos para usarse en el navegador o con entornos que emulen `localStorage`.

## Descripción del cliente Soroban (`client.js`)
- Funciones wallet helpers:
  - `isFreighterInstalled()` — detecta la extensión Freighter.
  - `connectWallet()` — solicita conexión a Freighter.
  - `disconnectWallet()` — limpia estado local.
  - `getConnectedPublicKey()` — obtiene la clave pública conectada.
- Funciones de firma y envío:
  - `buildUnsignedXDR(operation, publicKey)` — llama al Builder (si está configurado) para construir un XDR no firmado.
  - `getLocalKeypair()` — devuelve un `Keypair` usando `VITE_SECRET_KEY` o clave en `localStorage`.
  - `submitOperation(operation)` — flujo maestro: construye XDR, firma (Freighter → local → builder), y llama a `submitTx(xdr)`.
  - `submitTx(txXdr)` — POST al endpoint `${RPC_URL}/send_transaction` del RPC.
- Funciones de negocio (demo / persistencia):
  - `registerPlant()`, `getAllPlants()`, `voteForPlant()`, `listForSale()`, `getListing()`, `buyListing()` — implementadas con persistencia `localStorage` para pruebas.

## Flujos de firma soportados
1. Freighter (preferido)
   - La UI detecta Freighter y solicita firma; Freighter devuelve el XDR firmado.
   - Ventaja: la clave privada nunca sale de la extensión.
2. Firma local
   - La DApp puede cargar `VITE_SECRET_KEY` o solicitar que el usuario pegue su secret key localmente (solo para pruebas).
   - La firma se realiza en la página (no recomendable en producción).
3. Builder service (fallback o ayuda)
   - El Builder crea el XDR y puede (si está configurado) devolver una transacción parcial o instruir cómo firmar.
   - Útil cuando la DApp no arma la transacción completa localmente.

## Diagrama de flujo de la transacción (Mermaid)

```mermaid
flowchart TD
  A[Usuario inicia acción (Registrar/Listar/Votar/Comprar)] --> B{Necesita firma?}
  B -- Sí --> C[Construir operación (cliente) -> unsigned op]
  C --> D{¿Freighter disponible?}
  D -- Sí --> E[Enviar XDR a Freighter]
  E --> F[Freighter firma y retorna XDR firmado]
  F --> G[Enviar XDR firmado al RPC (/send_transaction)]
  D -- No --> H{¿Clave local disponible?}
  H -- Sí --> I[Firmar localmente con secret]
  I --> G
  H -- No --> J{¿Builder configurado?}
  J -- Sí --> K[Enviar solicitud a Builder (/build_invoke)]
  K --> L[Builder retorna XDR listo para firmar o ya firmado]
  L --> M{Builder retornó firmado?}
  M -- Sí --> G
  M -- No --> N[Descargar XDR para firma externa]
  N --> G
  J -- No --> O[Imposible continuar - mostrar error al usuario]
  B -- No --> G
```

## Ejemplo paso a paso (Registrar planta)
1. Usuario rellena formulario → `operation = { type: 'register', payload: {...} }`.
2. `submitOperation(operation)` llama a `buildUnsignedXDR(operation, publicKey)`.
3. Dependiendo del método de firma: Freighter/local/builder — se obtiene `txXdrSigned`.
4. `submitTx(txXdrSigned)` hace POST a `${RPC_URL}/send_transaction` y espera confirmación.
5. UI muestra resultado (éxito/fracaso). En modo demo se actualiza `localStorage` sin enviar a la red.

## Buenas prácticas de desarrollo
- Nunca comites `VITE_SECRET_KEY` en el repositorio.
- Para pruebas automatizadas usa cuentas de testnet y keys separadas.
- Mantén el builder y RPC configurables mediante variables de entorno.
- Separa dependencias pesadas (`stellar-sdk`) en un chunk para reducir TTI (ya configurado en `vite.config.js`).

## Debugging y problemas comunes
- Error CORS al llamar al RPC: revisa que la URL esté correcta y que el RPC soporte CORS. Para pruebas locales usa proxys si es necesario.
- `Named export 'SorobanRpc' not found` al hacer `import { SorobanRpc } from '@stellar/stellar-sdk'`: en entornos Node es más seguro usar `import * as stellar from '@stellar/stellar-sdk'` y luego destructurar (`const { SorobanRpc } = stellar;`).
- Problemas de bundle grande: verificar `vite.config.js` y evaluar lazy-loading o dynamic imports.

## Tests y scripts
- `frontend/vue-project/scripts/test_client_actions.mjs` — script de prueba que ejecuta funciones del cliente en modo no UI.
- Recomiendo añadir pruebas E2E con Playwright o Cypress que cubran:
  - Conexión Freighter (o mock de Freighter)
  - Flujo Registrar/Listar/Comprar/Votar
  - Respuesta de builder (mock)

## Checklist para PRs relacionados a soroban/client.js
- [ ] Añadir pruebas unitarias para funciones puras (con mocks de RPC/builder).
- [ ] Validar comportamiento con Freighter mock/spy.
- [ ] No añadir secrets a los commits.
- [ ] Actualizar `README.md` y `DEVELOPER_GUIDE.md` si hay cambios en env vars o API.

## Glosario rápido
- RPC: Remote Procedure Call; nodo que acepta transacciones.
- XDR: formato binario (base64) que representa transacciones en Stellar.
- Freighter: extensión de wallet para Stellar/Soroban.
- Builder service: servicio HTTP que ayuda a construir transacciones/XDR.
- Keypair/Secret: par de claves (public/private). Secret = clave privada.
- Testnet: red de pruebas de Stellar/Soroban.

---

*Fin de la guía para desarrolladores.*
