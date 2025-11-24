# DAAP_STATUS — Herbamed DApp (actualizado)

Fecha: 2025-11-23

Resumen ejecutivo:
- Entorno: Testnet (Soroban / Stellar testnet).
- Contrato desplegado: `CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR` (creator: `GADZC7QBB4TWRFECMKN6O7YUC5THLYCTPIYBPZH2MXRJKYDPIICESF23`).
- Cuenta Freighter conectada en el navegador durante pruebas: `GCQSEXZKYK7QJJFGFVQZ3B4HYXM6SQDCWQVHH7Z6TWML4QBHQX2CE25V`.

Estado actual de componentes:
- Frontend: `frontend/vue-project` — Vue 3 + Vite. Dev server funcionando localmente.
- Cliente Soroban: helpers en `frontend/vue-project/src/soroban/client.js` con soporte de firma por Freighter, clave local y builder.
- Contrato WASM: desplegado en testnet y confirmado por operaciones `UploadContractWasm` y `CreateContract` en Horizon.

Acciones realizadas (confirmadas):
- Creación y fondeo de la cuenta inicial (public key `GADZC7...SF23`) y despliegue del contrato (operaciones en Horizon con timestamps 2025-11-06).
- Importación/registro de la cuenta `GCQSEXZK...E25V` en Freighter (captura proporcionada).
- Ejecución de pruebas headless locales (`scripts/test_client_actions.mjs`) para las funciones de negocio en modo demo (persistencia en `localStorage`).

Riesgos y recomendaciones:
- Si la secret `SC6F34P...` fue expuesta públicamente, tratarla como comprometida y rotar claves antes de mover a mainnet.
- Evitar almacenar secrets en `localStorage` o en repositorios.
- Preferir Freighter para firmas desde la UI en entornos de prueba y producción.

Próximos pasos sugeridos:
- Añadir tests unitarios automáticos (Vitest) con mocks de Freighter y builder.
- Implementar un endpoint `/build_invoke` que construya XDRs reales `invokeHostFunction` para llamadas correctas al contrato.
- (Opcional) Rotar cuenta si decides no usar la actual para producción.

---

*Fin del estado actualizado.*
