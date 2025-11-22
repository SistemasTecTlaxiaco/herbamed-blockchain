# Estado actual de Herbamed DApp (resumen de desarrollo)

Fecha: 2025-11-22
Autor: Resumen automático generado por el asistente

## Resumen general
Esta DApp (Herbamed) es una aplicación que combina un contrato inteligente Soroban (Rust) con un frontend en Vue 3 para registrar plantas, votar por ellas y manejarlas en un pequeño marketplace. El objetivo del trabajo realizado hasta ahora ha sido: añadir lógica inicial en el contrato, integrar un frontend capaz de crear/importar cuentas, firmar transacciones con Freighter o claves locales y proporcionar un helper backend para construir transacciones (XDR) durante desarrollo cuando la SDK de Soroban en el navegador no ofrece la funcionalidad completa.

## Cambios realizados (lista detallada)

### Contrato (Rust)
- Archivo: `contracts/medicinal-plants/src/lib.rs`
  - Se añadió una función placeholder `transfer_tokens` y se actualizó `buy_listing` para llamar al placeholder y devolver `Result`.
  - Objetivo: preparar el contrato para marketplace (comprar/vender) y dejar un punto de integración para transferencias.

### Frontend (Vue 3, Vite)
- Archivo principal de configuración: `frontend/vue-project/src/soroban/config.js`
  - Variables expuestas: `CONTRACT_ADDRESS`, `NETWORK`, `RPC_URL`, `SECRET_KEY`, y añadido `TX_BUILDER_URL` para el helper de construcción de XDR.

- Cliente Soroban: `frontend/vue-project/src/soroban/client.js`
  - Añadidas utilidades para detectar Freighter, conectar/desconectar wallet y exponer funciones de negocio:
    - `registerPlant`, `getAllPlants`, `voteForPlant`, `listForSale`, `buyListing`, `getListing`, `getPlantVotes`.
  - Manejo dual de envío de transacciones:
    - Camino "ideal": usar `SorobanRpc.Server` cuando está disponible en la SDK del navegador para construir, simular y enviar transacciones.
    - Camino fallback: cuando la SDK no expone las helpers, se solicita un XDR sin firmar a un helper (`/build_tx`), se firma con Freighter o con clave local, y se envía al RPC (`/send_transaction`).
  - `setLocalSecret(secret)`: permite a la UI establecer una clave local al importar o crear una cuenta.

- UI de Login: `frontend/vue-project/src/components/Login.vue`
  - Interfaz con tres pestañas: `Ingresar`, `Crear Cuenta`, `Importar Clave`.
  - Implementa:
    - Generación de Keypair (Stellar) y cifrado de la secret con contraseña usando Web Crypto (PBKDF2 + AES-GCM).
    - Guardado cifrado en `localStorage` bajo la clave `herbamed:account`.
    - Generación de QR (Google Charts) para respaldo rápido del secret.
    - Importación de claves con opción de guardar cifrada o solo cargar en memoria.
    - Integración con `connectWallet()` que detecta y conecta Freighter si está disponible.

- Test y utilidades:
  - `frontend/vue-project/scripts/test_keystore.js`: script Node para verificar el cifrado/descifrado Web Crypto (funcionó: roundtrip OK).
  - `frontend/vue-project/scripts/build_invoke_xdr.js`: script de ejemplo para construir un XDR; cae al fallback y genera un XDR `manageData` para pruebas.

### Helper backend de desarrollo
- `frontend/vue-project/scripts/tx_builder_server.js`
  - Pequeño servidor Express que expone `POST /build_tx`.
  - Entrada JSON: `{ contractId, method, args, publicKey, sequence?, network? }`.
  - Si no se envía `sequence` consulta Horizon para obtener la secuencia actual de la cuenta.
  - Construye una transacción unsigned (actualmente usando `Operation.manageData` con el payload JSON que representa la invocación) y devuelve `{ xdr }`.
  - Permite CORS para pruebas locales.

### Dependencias instaladas
- Se actualizaron/instalaron paquetes en el frontend:
  - `@stellar/stellar-sdk` (versión usada por el proyecto), `express`, `body-parser`.

## Cómo probar localmente (instrucciones rápidas)
1. Levantar el frontend (Vite):

```bash
cd frontend/vue-project
npm install    # si no están instaladas las dependencias
npm run dev
```

2. Levantar el helper de construcción de XDR (opcional, recomendado si la SDK del navegador no expone `invokeHostFunction`):

```bash
cd frontend/vue-project
node scripts/tx_builder_server.js
# escucha en http://127.0.0.1:4001
```

3. Probar el builder desde la terminal:

```bash
curl -X POST http://127.0.0.1:4001/build_tx \
  -H "Content-Type: application/json" \
  -d '{"contractId":"C","method":"buy_listing","args":["plant-123"],"publicKey":"G...","network":"testnet"}'
```

4. Ejecutar la prueba de keystore (valida cifrado/descifrado):

```bash
cd frontend/vue-project
node scripts/test_keystore.js
```

## Limitaciones actuales y notas importantes
- El helper `/build_tx` utiliza `manageData` para embedder la intención de invocar el contrato. Esto NO ejecuta realmente el host-function invoke en Soroban; es un fallback útil para pruebas de firma/envío pero no sustituye la construcción correcta de `invokeHostFunction`/`invokeContract` XDR.
- Para invocar funciones del contrato real en la testnet/mainnet, es necesario construir XDRs de tipo `HostFunction::InvokeContract` correctamente (o usar un SDK/servidor que lo haga). Recomendación: construir un endpoint `/build_invoke` que use la versión del SDK o librerías que permitan generar estos XDRs correctamente.
- Seguridad:
  - No almacenar secretos en texto plano. `localStorage` sólo contiene el secreto cifrado (salt+iv+data) cuando el usuario decide guardar.
  - Para producción usa wallets externos como Freighter y considera hardening del backend.

## Siguientes pasos recomendados
1. Implementar `/build_invoke` en el backend que genere XDRs reales `invokeHostFunction/invokeContract` según la ABI del contrato.
2. Añadir tests e2e que simulen un usuario real conectando Freighter y firmando transacciones en testnet.
3. Preparar scripts de despliegue y documentación para mainnet (gestión de claves, verificación del contrato, etc.).

## Archivos clave modificados
- `contracts/medicinal-plants/src/lib.rs`
- `frontend/vue-project/.env` (posible corrección manual)
- `frontend/vue-project/src/soroban/config.js`
- `frontend/vue-project/src/soroban/client.js`
- `frontend/vue-project/src/components/Login.vue`
- `frontend/vue-project/src/views/plants/TestFunctions.vue` (utils de prueba)
- `frontend/vue-project/scripts/test_keystore.js`
- `frontend/vue-project/scripts/build_invoke_xdr.js`
- `frontend/vue-project/scripts/tx_builder_server.js`

## Contacto / notas finales
Si quieres que haga el siguiente paso (implantar `/build_invoke` con XDR reales o integrar el frontend para llamadas reales al contrato), dime qué prefieres: que construya el XDR server-side (recomendado) o que intente forzar la construcción del XDR en el frontend (menos recomendable por compatibilidad de SDK).


---
Generado automáticamente como documentación del estado de desarrollo.
