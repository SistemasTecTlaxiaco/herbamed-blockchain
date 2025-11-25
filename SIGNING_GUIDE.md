# 🔐 Guía Completa: Firmas, Cuentas y Modo Demo en Herbamed

## 📚 Índice
1. [Métodos de Firma](#métodos-de-firma)
2. [Relación con Acciones de la DApp](#relación-con-acciones)
3. [Modo Demo vs Modo Blockchain](#modo-demo-vs-blockchain)
4. [Tipos de Cuenta](#tipos-de-cuenta)
5. [Cuándo Usar Cada Método](#cuándo-usar-cada-método)

---

## 1. Métodos de Firma

### **A) Freighter (Recomendado)**
- **Qué es**: Extensión de navegador que funciona como wallet
- **Cómo funciona**:
  1. Usuario instala extensión → crea/importa keypair
  2. DApp pide firmar → Freighter muestra popup
  3. Usuario aprueba → Freighter firma con clave privada (NUNCA sale de extensión)
  4. DApp recibe transacción firmada → envía a blockchain

**Ventajas**:
- ✅ Clave privada NUNCA se expone
- ✅ Mejor UX (popup amigable)
- ✅ Recomendado para producción

**Requisitos**:
- Usuario debe instalar extensión
- Navegador compatible (Chrome, Brave, Firefox)

---

### **B) Firma Local (SECRET_KEY en código)**
- **Qué es**: Pegar tu clave secreta directamente en el código/env
- **Cómo funciona**:
  1. Desarrollador configura `SECRET_KEY="SC6F34P..."`  en `.env`
  2. DApp lee la clave → firma automáticamente
  3. No hay popup ni confirmación manual

**Ventajas**:
- ✅ Útil para scripts/CI/testing automatizado
- ✅ No requiere intervención manual

**Riesgos**:
- ⚠️ Clave expuesta en código/variables
- ⚠️ Si se sube a GitHub → **CLAVE COMPROMETIDA**
- ⚠️ Solo para dev/test, NUNCA producción

---

### **C) Builder Service (Backend)**
- **Qué es**: Servidor que construye/firma transacciones por el usuario
- **Cómo funciona**:
  - **Opción 1 (no recomendada)**: Backend firma con su propia clave
    - Usuario no tiene control
    - Backend mueve fondos sin consentimiento
  - **Opción 2 (mejor)**: Backend construye XDR sin firmar
    - Devuelve unsigned XDR al frontend
    - Usuario firma con Freighter/local

**Uso**:
- Para DApps que necesitan transacciones complejas
- Backend ayuda a construir, frontend firma

---

## 2. Relación con Acciones de la DApp

### **Acciones que REQUIEREN Firma**

| Acción | ¿Requiere firma? | ¿Por qué? |
|--------|------------------|-----------|
| **Registrar Planta** | ✅ SÍ | Escribe datos en blockchain, cuesta gas (XLM) |
| **Listar para Venta** | ✅ SÍ | Modifica estado del contrato |
| **Comprar** | ✅ SÍ | Transfiere fondos, requiere autorización |
| **Votar** | ✅ SÍ | Modifica contador en contrato |
| **Ver Plantas** | ❌ NO | Solo lectura, no modifica blockchain |

### **Flujo de Firma: Ejemplo con REGISTRAR**

#### **Modo Blockchain (con firma)**:
```
1. Usuario llena formulario → Clic "Registrar"
2. DApp construye transacción (buildUnsignedXDR)
3. Método de firma:
   ┌─ Freighter disponible? → Popup → Usuario aprueba → Firma
   └─ No Freighter? → Usa SECRET_KEY local → Firma automática
4. DApp envía transacción firmada al RPC de Soroban
5. Blockchain valida, ejecuta, devuelve hash
6. DApp muestra: "✅ Registrado. Tx: abc123..."
```

#### **Modo Demo (sin firma)**:
```
1. Usuario llena formulario → Clic "Registrar"
2. DApp guarda en localStorage:
   localStorage.setItem('herbamed:plants', [...nueva planta])
3. DApp muestra: "✅ (DEMO) Planta registrada localmente"
4. NO se envía nada a blockchain
5. Datos solo existen en tu navegador
```

---

## 3. Modo Demo vs Modo Blockchain

### **🎮 Modo Demo (localStorage)**

**Características**:
- ❌ **NO requiere firma**
- ❌ **NO toca blockchain**
- ✅ Datos en `localStorage` del navegador
- ✅ Instantáneo (sin esperar confirmación de red)
- ✅ Gratis (sin gas fees)
- ⚠️ Datos se pierden si borras caché del navegador
- ⚠️ Solo tú ves los datos (no son compartidos)

**Métodos de firma implementados**: **NINGUNO** (no firma)

**Tipos de cuenta**: **NINGUNA** (no necesita cuenta blockchain)

**Cuándo usar**:
- Probar UI sin gastar XLM
- Desarrollo local sin conexión a internet
- Demostrar funcionalidad sin onboarding de wallet

**Keys localStorage**:
```javascript
'herbamed:plants'    → Array de plantas registradas
'herbamed:listings'  → Object de plantas en venta
'herbamed:votes'     → Object de contadores de votos
```

**Ejemplo de datos**:
```json
// localStorage.getItem('herbamed:plants')
[
  {
    "id": "MNZ-001",
    "name": "Manzanilla",
    "description": "Antiinflamatoria",
    "location": "México"
  }
]
```

---

### **⛓️ Modo Blockchain (firma real)**

**Características**:
- ✅ **Requiere firma** (Freighter o SECRET_KEY)
- ✅ **Escribe en blockchain** Soroban
- ✅ Datos permanentes e inmutables
- ✅ Compartidos globalmente (cualquiera puede leer)
- ⚠️ Cuesta gas (XLM para fees)
- ⚠️ Espera confirmación (~5 segundos)

**Métodos de firma implementados**:
1. **Freighter** (prioridad 1)
2. **SECRET_KEY local** (fallback si no hay Freighter)
3. **Builder service** (opcional, si `TX_BUILDER_URL` configurado)

**Tipos de cuenta requeridos**:
- **Stellar Account** (keypair con fondos)
  - Puede ser de Stellar Lab
  - Puede ser de Freighter
  - Puede ser generada en DApp (pestaña "Crear Cuenta")

**Cuándo usar**:
- Testing real en testnet
- Producción en mainnet
- Cuando quieres datos permanentes
- Interactuar con otros usuarios

---

## 4. Tipos de Cuenta

### **Comparación Visual**

| Tipo | Dónde se crea | Clave privada | Firma con | Uso |
|------|---------------|---------------|-----------|-----|
| **Stellar Lab Keypair** | laboratory.stellar.org | Visible en pantalla | SECRET_KEY en código | Dev/testing/scripts |
| **Freighter Wallet** | Extensión Freighter | Oculta en extensión | Popup de Freighter | Producción/usuarios |
| **DApp Local (cifrada)** | Pestaña "Crear Cuenta" | Cifrada en localStorage | SECRET_KEY descifrado | Testing local |
| **Cuenta Demo** | localStorage | No existe (no firma) | N/A | UI testing sin blockchain |

---

## 5. Cuándo Usar Cada Método

### **Escenario 1: Desarrollo Local**
```
✅ Usar: Modo Demo
- Sin firma, sin blockchain
- Testing rápido de UI
- No necesitas wallet ni fondos
```

### **Escenario 2: Testing en Testnet**
```
✅ Usar: Modo Blockchain + SECRET_KEY local
- Copia tu keypair de Stellar Lab
- Configura en .env o pestaña "Importar Clave"
- Fondea con Friendbot
- Firmas automáticas (sin popup)
```

### **Escenario 3: Demostración a Usuarios**
```
✅ Usar: Modo Blockchain + Freighter
- Usuario instala Freighter
- Crea wallet en extensión
- Fondea con Friendbot (testnet)
- Firmas con popup (UX profesional)
```

### **Escenario 4: Producción (Mainnet)**
```
✅ Usar: Modo Blockchain + Freighter
- Usuario usa su wallet real
- Fondos reales en juego
- NUNCA usar SECRET_KEY expuesto
- Solo Freighter (seguridad máxima)
```

### **Escenario 5: Scripts/CI/CD**
```
✅ Usar: Firma Local (SECRET_KEY)
- Variable de entorno en servidor
- Scripts automatizados
- No hay intervención humana
- Clave en secreto del servidor (no en repo)
```

---

## 🔄 Flujo Completo: Ejemplo "VOTAR"

### **Modo Demo**:
```javascript
// client.js
export async function voteForPlant(id) {
  const votes = JSON.parse(localStorage.getItem('herbamed:votes') || '{}')
  votes[id] = (votes[id] || 0) + 1
  localStorage.setItem('herbamed:votes', JSON.stringify(votes))
  return { success: true, transactionHash: 'local:vote:' + id }
}
```
- Sin firma
- Sin blockchain
- Instantáneo

### **Modo Blockchain (con Freighter)**:
```javascript
// 1. DApp construye operación
const operation = { 
  method: 'vote_for_plant', 
  args: [plantId] 
}

// 2. Construir XDR sin firmar (builder service o SDK)
const unsignedXDR = await buildUnsignedXDR(operation, publicKey)

// 3. Firmar con Freighter
const signed = await window.freighterApi.signTransaction(unsignedXDR, network)

// 4. Enviar a blockchain
const result = await submitTx(signed)

// 5. Retornar hash de transacción
return { success: true, transactionHash: result.hash }
```

### **Modo Blockchain (con SECRET_KEY)**:
```javascript
// 1-2. Igual que arriba (construir XDR)

// 3. Firmar con keypair local
const kp = Keypair.fromSecret(SECRET_KEY)
const txObj = Transaction.fromXDR(unsignedXDR, networkPassphrase)
txObj.sign(kp)
const signedXDR = txObj.toXDR()

// 4-5. Igual que arriba (enviar y retornar)
```

---

## ✅ Resumen Ejecutivo

| | Modo Demo | Blockchain + Freighter | Blockchain + SECRET_KEY |
|---|-----------|------------------------|-------------------------|
| **Firma** | ❌ No | ✅ Popup | ✅ Automática |
| **Blockchain** | ❌ No | ✅ Sí | ✅ Sí |
| **Clave expuesta** | N/A | ❌ No | ⚠️ Sí |
| **Costo** | Gratis | Gas fees | Gas fees |
| **Datos persistentes** | ❌ Solo local | ✅ Inmutables | ✅ Inmutables |
| **Uso recomendado** | UI testing | Producción | Scripts/testing |

---

**🎯 Recomendación Final**:

- **Desarrollo**: Modo Demo (rápido, sin setup)
- **Testing testnet**: Blockchain + SECRET_KEY (automatizado)
- **Demo a usuarios**: Blockchain + Freighter (UX profesional)
- **Producción mainnet**: Blockchain + Freighter (seguridad máxima)

