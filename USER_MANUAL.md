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
3. Registrar Planta: ve a **Registrar Planta**, completa ID, nombre, descripción y ubicación y pulsa **Registrar**.
4. Ver plantas: ve a **Plantas** para ver el listado actualizado.
5. Listar / Comprar: desde la lista, pulsa **Listar** y define un precio; otro usuario podrá comprar.
6. Votar: pulsa **Votar** para incrementar el contador de votos de una planta.

## Acciones disponibles en la DApp
- Registrar Planta — añade una planta al catálogo (requiere firma).
- Listar para venta — marca una planta como disponible y añade precio (requiere firma).
- Comprar — compra una planta listada (requiere firma).
- Votar — registra un voto por una planta (requiere firma).
- Conectar Wallet — conecta Freighter o usa clave local para firmar.
- **Copiar Claves** — botones de un click para copiar clave pública/secreta al portapapeles.
- **Fondear Cuenta Importada** — opción para fondear automáticamente cuentas nuevas al importar.

## ¿Dónde se guarda la información?
- En la red Soroban (cuando se envía una transacción real).

## Wallets y cuentas
- **Freighter**: extensión que funciona como wallet; mantiene la clave privada en la extensión y solicita confirmación al firmar. Recomendado.
- **Clave local (`SECRET_KEY`)**: solo para pruebas y scripts locales. No la uses en producción.
- **Crear cuenta**: la DApp permite generar un par de claves (Keypair) desde la UI — la secret puede cifrarse con una contraseña y guardarse en `localStorage`.

### Fondeo Automático con Friendbot (Testnet)

Cuando creas una cuenta nueva en la DApp, automáticamente se fondea con **10,000 XLM de testnet** usando el servicio Friendbot de Stellar. Esto significa que:

- ✅ No necesitas ir a Stellar Laboratory para fondear manualmente
- ✅ La cuenta es **inmediatamente funcional** en la blockchain
- ✅ Puedes ver la cuenta en [stellar.expert](https://stellar.expert/explorer/testnet) desde el enlace que aparece
- ✅ Los fondos son de testnet (no tienen valor real)

**Proceso:**
1. Ingresas tu contraseña → Click en "Crear Cuenta"
2. La DApp genera el par de claves
3. Automáticamente llama a `https://friendbot.stellar.org` para fondear
4. Espera 2 segundos para que la transacción se propague
5. Muestra tu cuenta con enlace directo a stellar.expert

**Nota:** Este fondeo solo funciona en **testnet**. En mainnet necesitarías transferir XLM reales desde otra cuenta.

### Mejoras de Interfaz de Usuario

#### Botones de Copiar
Cada clave (pública y secreta) tiene un botón "📋 Copiar" que:
- Copia la clave al portapapeles con un solo click
- Muestra confirmación visual: "✅ Copiado" por 2 segundos
- Facilita guardar las claves en gestores de contraseñas

#### Fondeo de Cuentas Importadas
Al importar una clave secreta existente, puedes:
- Marcar la casilla "💰 Fondear con Friendbot"
- La DApp verificará y fondeará la cuenta si es necesario
- Útil para importar cuentas nuevas generadas externamente

#### Indicadores Visuales
- Spinners de carga durante fondeo
- Mensajes de estado claros con emojis
- Balance actualizado en tiempo real
- Alertas con códigos de color (verde=éxito, rojo=error, azul=info)

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
