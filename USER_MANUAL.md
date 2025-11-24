# Herbamed — Manual de Usuario (DApp)

Bienvenido a Herbamed, una DApp (aplicación descentralizada) para registrar, listar y votar plantas medicinales en la red Soroban (Stellar). Este documento es una guía amigable para usuarios finales: qué hace la DApp, cómo usarla y qué necesitas para empezar.

## ¿Qué es esta DApp?
- Es una aplicación web que conecta con la red Soroban (Stellar) para almacenar datos y ejecutar funciones de un contrato inteligente. Permite a los usuarios registrar plantas, listarlas para venta, comprar y votar por ellas.

## ¿Qué problema soluciona?
- Centraliza el catálogo de plantas medicinales en una red distribuida, permitiendo trazabilidad de registros, votos y listados sin depender de una sola autoridad.

## Ventajas principales
- Inmutabilidad y trazabilidad de registros en la blockchain.
- Control del usuario sobre las firmas (wallets) — no es necesario entregar claves a terceros.
- Interoperabilidad mediante estándares Stellar/Soroban.

## Requisitos para usar la DApp
- Un navegador moderno (Chrome, Edge, Brave, Firefox). Recomendado: Chromium basado para mejor compatibilidad con extensiones.
- Para firmar transacciones desde tu navegador: instalar la extensión Freighter (recomendado).
- Alternativamente: puedes usar una clave secreta local (solo para pruebas) o un servicio de construcción de transacciones (builder).

## Cómo empezar (pasos rápidos)
1. Abre la URL local del frontend (por ejemplo `http://127.0.0.1:3000/`).
2. Conecta tu wallet:
   - Si tienes Freighter: usa el botón **Conectar** en la sección de Wallet y sigue el flujo de la extensión.
   - Si no tienes Freighter y solo pruebas la DApp, puedes crear/importar una cuenta local en la pestaña Crear/Importar (la clave puede cifrarse localmente).
3. Registrar Planta: ve a **Registrar Planta**, completa ID, nombre, descripción y ubicación y pulsa **Registrar**. (En modo demo, los datos se guardan también en `localStorage` para que veas los cambios inmediatamente.)
4. Ver plantas: ve a **Plantas** para ver el listado actualizado.
5. Listar / Comprar: desde la lista, pulsa **Listar** y define un precio; otro usuario podrá comprar.
6. Votar: pulsa **Votar** para incrementar el contador de votos de una planta.

## Acciones disponibles en la DApp
- Registrar Planta — añade una planta al catálogo (requiere firma).
- Listar para venta — marca una planta como disponible y añade precio (requiere firma).
- Comprar — compra una planta listada (requiere firma).
- Votar — registra un voto por una planta (requiere firma).
- Conectar Wallet — conecta Freighter o usa clave local para firmar.

## ¿Dónde se guarda la información?
- En la red Soroban (cuando se envía una transacción real).
- En modo demo/local, la UI también persiste temporalmente en `localStorage` (keys: `herbamed:plants`, `herbamed:listings`, `herbamed:votes`) para facilitar pruebas locales.

## Wallets y cuentas
- **Freighter**: extensión que funciona como wallet; mantiene la clave privada en la extensión y solicita confirmación al firmar. Recomendado.
- **Clave local (`SECRET_KEY`)**: solo para pruebas y scripts locales. No la uses en producción.
- **Crear cuenta**: la DApp permite generar un par de claves (Keypair) desde la UI — la secret puede cifrarse con una contraseña y guardarse en `localStorage`.

## Roles en la DApp
- Usuario: registra, lista, vota, compra.
- Validador (operacional): no es un rol de la UI, pero los validadores de la red Soroban procesan transacciones.
- Administrador (solo si se implementa): podría operar builder service o gestionar configuraciones del backend.

## Recomendaciones de uso
- Para uso real: utiliza Freighter y la red testnet para pruebas.
- Mantén segura tu clave privada si usas firma local; no la compartas.
- Si ves errores de CORS o RPC, revisa la configuración de red; a veces el RPC no admite GET en la raíz y devuelve 405 — esto no significa que esté caído.

## Preguntas frecuentes rápidas
- **¿Necesito entender blockchain para usar la DApp?** No. Para el uso básico, solo necesitas una wallet y seguir los botones de la UI.
- **¿Puedo recuperar mi clave si la pierdo?** No; la clave privada es la única forma de firmar transacciones. Guarda tu secret en un lugar seguro.

## Limpieza de datos de prueba (local)
Si quieres borrar los datos de prueba guardados en el navegador, abre la consola y ejecuta:
```js
localStorage.removeItem('herbamed:plants')
localStorage.removeItem('herbamed:listings')
localStorage.removeItem('herbamed:votes')
```

---

*Fin del manual de usuario.*
