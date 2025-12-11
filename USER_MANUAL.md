# Herbamed — Manual de Usuario (DApp)

Bienvenido a Herbamed, una DApp (aplicación descentralizada) para registrar, listar y votar plantas medicinales en la red Soroban (Stellar). Este documento es una guía amigable para usuarios finales.

## ¿Qué es esta DApp?
- Aplicación web que conecta con Soroban para registrar plantas, listarlas para venta, comprar y votar por ellas.

## ¿Qué problema soluciona?
- Descentraliza el catálogo de plantas medicinales en blockchain, permitiendo trazabilidad de registros, votos y listados sin depender de una sola autoridad.

## Ventajas principales
- Inmutabilidad y trazabilidad de registros en la blockchain
- Control del usuario sobre las firmas (wallets)
- Interoperabilidad mediante estándares Stellar/Soroban

## Requisitos
- Navegador moderno (Chrome, Edge, Brave, Firefox)
- Freighter extensión (recomendado) o clave local para pruebas

## Cómo empezar
1. Abre `http://127.0.0.1:3000/`
2. Conecta tu wallet (Freighter o clave local)
3. Registra una planta: ve a "Registrar Planta" y completa el formulario
4. Ver plantas: ve a "Plantas" para ver el listado
5. Listar/Comprar: desde la lista, pon en venta o compra
6. Votar: incrementa el contador de votos de una planta

## Acciones disponibles
- **Registrar Planta** — añade una planta al catálogo (requiere firma)
- **Listar para venta** — marca una planta con precio (requiere firma)
- **Comprar** — compra una planta listada (requiere firma)
- **Votar** — registra un voto (requiere firma)
- **Conectar Wallet** — Freighter o clave local

## ¿Dónde se guarda la información?
En la red Soroban (blockchain Stellar) cuando se envía una transacción real.

## Wallets y cuentas

### Freighter
- Extensión que mantiene tu clave privada segura
- Solicita confirmación al firmar transacciones
- Recomendado para producción

### Clave Local
- Solo para pruebas y scripts locales
- No uses en producción
- Puede cifrarse con contraseña

### Fondeo Automático (Testnet)
- Crear cuenta nueva → Se fondea automáticamente con 10,000 XLM de testnet
- Via Friendbot: `https://friendbot.stellar.org`
- Inmediatamente funcional en blockchain
- Ver en: `https://stellar.expert/explorer/testnet`

---

## Testing Manual

### ¿Cómo verificar que funciona?

#### 1. Registrar una Planta
- Ir a "Registrar Planta"
- Llenar: ID (`ALBACA-001`), Nombre (`Albaca`), Científico (`Ocimum basilicum`), Propiedades (`Antinflamatorio`, etc.)
- Click "Registrar Planta"
- Esperado: Mensaje de éxito + enlace a Stellar Explorer
- Verificar: Planta aparece en listado en 2-5 segundos

#### 2. Votar por una Planta
- Ir a "Plantas"
- Buscar planta registrada
- Click "Votar"
- Esperado: Contador incrementa a 1 + enlace Explorer funciona
- Verificar: Refresca página y voto persiste

#### 3. Listar para Venta
- Desde planta, click "Listar para Venta"
- Ingresar precio (ej: `10`)
- Click "Poner en Venta"
- Esperado: Transacción exitosa + hash Explorer
- Verificar: Planta aparece en Marketplace

#### 4. Comprar en Marketplace
- Ir a "Marketplace"
- Buscar planta listada
- Click "Comprar"
- Esperado: Transacción exitosa + planta desaparece
- Verificar: No aparece más en listado de venta

#### 5. Persistencia de Datos
- Registrar 3 plantas
- Cerrar navegador completamente
- Reabrir aplicación
- Esperado: Las 3 plantas aún aparecen
- Razón: Datos en blockchain, no en localStorage

#### 6. localStorage Solo para Auth
- DevTools (F12) → "Application" → "Local Storage"
- Buscar claves `herbamed_*`
- Esperado: Solo `soroban_auth` y `wc_session_topic`
- NO debería haber: `herbamed_plant_ids`, `herbamed_plant_*`, etc.

---

## Transacciones vs. Consultas

### Transacciones (Requieren Firma, Generan Hash)
- ✅ Registrar Planta
- ✅ Votar
- ✅ Listar para Venta
- ✅ Comprar

Muestran:
```
✅ Acción completada exitosamente
ID: ALBACA-001
Verificar transacción en Stellar Explorer:
[Hash] →
```

### Consultas (Sin Firma, Sin Hash)
- 🔍 Ver Lista de Plantas (`getAllPlants()`)
- 🔍 Ver Votos (`getPlantVotes()`)
- 🔍 Ver Marketplace (`getAllListings()`)

Estas son simulaciones RPC (read-only, sin firmar, sin fees).

---

## Verificar en Stellar Explorer

1. Click en enlace de transacción desde la DApp
2. Verás:
   - **Status**: Success ✅
   - **Timestamp**: Hora exacta
   - **From**: Tu cuenta
   - **Operations**: Qué hizo
   - **Fee**: XLM gastado (típicamente 0.00001)

Ejemplo: `https://stellar.expert/explorer/testnet/tx/[hash]`

---

## Preguntas Frecuentes

**¿Necesito entender blockchain para usar esto?**  
No. Solo necesitas una wallet y seguir los botones de la UI.

**¿Puedo recuperar mi clave si la pierdo?**  
No. La clave privada es la única forma de firmar. Guarda tu secret en un lugar seguro.

**¿Es seguro usar clave local?**  
Solo para pruebas en testnet. Para producción, usa Freighter o hardware wallet.

---

*Fin del manual de usuario.*
