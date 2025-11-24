# Despliegue y acciones realizadas — Herbamed DApp

Resumen de acciones realizadas en el entorno de desarrollo / testnet:

- Cuenta inicial creada (testnet):
  - Public Key: `GADZC7QBB4TWRFECMKN6O7YUC5THLYCTPIYBPZH2MXRJKYDPIICESF23`
  - Secret Key (proporcionada inicialmente): `SC6F34PG32JOVH6KUIMOW4GDX33OGRJP6WNRQMRYROJJ57GZ5YIZXEAK` (nota: si esta secret se publicó, considerarla comprometida)
- Fondeo: la cuenta fue fondeada en testnet (friendbot) — balance actual: ~19999.5572988 XLM
- Deploy de contrato WASM (testnet):
  - Contract ID: `CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR`
  - Operaciones registradas en Horizon:
    - `invoke_host_function` con `UploadContractWasm` (subida de WASM)
    - `invoke_host_function` con `CreateContract` (creación del contrato)

- Conexión de wallet Freighter:
  - Se importó/registró en Freighter la cuenta con dirección: `GCQSEXZKYK7QJJFGFVQZ3B4HYXM6SQDCWQVHH7Z6TWML4QBHQX2CE25V` (la UI muestra la cuenta en el panel de Freighter)

- Código/archivos modificados o creados en el repo (branch local):
  - `frontend/vue-project/src/soroban/client.js` — helpers para Firma (Freighter / local / builder) y persistencia demo.
  - `frontend/vue-project/src/soroban/config.js` — variables de entorno seguras.
  - `frontend/vue-project/README.md` — notas y guía de uso.
  - `USER_MANUAL.md`, `DEVELOPER_GUIDE.md`, `DEPLOY_AND_ACTIONS.md`, `TEST_REPORT.md`, `DAAP_STATUS.md` — documentación creada o actualizada.

---

Notas de seguridad y próximos pasos recomendados:
- La clave secreta inicial debe considerarse expuesta si se publicó en repositorios o capturas. Para entornos de producción rotar claves y no usar secrets en `localStorage`.
- Para firmar desde la DApp en desarrollo, preferir Freighter. Evitar firma local con `SECRET_KEY` en páginas web públicas.

*Fin del documento.*
