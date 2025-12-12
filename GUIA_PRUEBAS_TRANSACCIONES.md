# 🧪 Guía de Pruebas: Almacenamiento Real en Blockchain

**Fecha:** 11 de Diciembre, 2025  
**Estado:** ✅ Listo para probar

---

## 🔑 Cuenta de Prueba Patrocinada

```
PUBLIC KEY:  GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL
SECRET KEY:  SBSSPK2I4XNMGPT5TZXRDWC5YC4DIILXQA5XS6TFCBX72F2EFP7YMSVW

Estado:      ✅ Patrocinada por Friendbot
Saldo:       10,000 XLM
Red:         Stellar Testnet
```

### **Qué significa "patrocinada":**
- ✅ Ya tiene saldo inicial (10,000 XLM)
- ✅ Puede enviar transacciones inmediatamente
- ✅ No necesitas ejecutar Friendbot de nuevo

---

## 📋 Plan de Pruebas

### **Test 1: Registrar Primera Planta**
```
Objetivo:     Crear transacción blockchain real
Resultado:    Hash verificable en Stellar Expert
Tiempo:       3-5 segundos
```

### **Test 2: Leer Plantas del Blockchain**
```
Objetivo:     Verificar que la planta se guardó
Resultado:    Debe aparecer en la lista
Tiempo:       Instantáneo
```

### **Test 3: Verificar Transacción en Stellar Expert**
```
Objetivo:     Confirmar que la transacción existe en blockchain
Resultado:    Link funcional a explorer con detalles
Tiempo:       Inmediato
```

### **Test 4: Registrar Segunda Planta**
```
Objetivo:     Crear otra transacción
Resultado:    Hash diferente, ambas plantas en blockchain
Tiempo:       3-5 segundos
```

---

## 🚀 Paso a Paso: Test 1

### **Paso 1: Abrir la Aplicación**
```
URL: http://127.0.0.1:3003/plants/register
```

### **Paso 2: Acceder a la Cuenta**
El sistema detectará automáticamente la clave privada del config.js:
```javascript
SECRET_KEY: 'SBSSPK2I4XNMGPT5TZXRDWC5YC4DIILXQA5XS6TFCBX72F2EFP7YMSVW'
```

**Verificación:**
```
Console: [Soroban] Conectado: GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL
```

### **Paso 3: Llenar Formulario**

Planta 1 - Albahaca:
```
ID:                  ALBACA-001
Nombre:              Albahaca
Nombre Científico:   Ocimum basilicum
Propiedades:         Antibacteriana
                     Antiviral
                     Aromática
```

### **Paso 4: Registrar**
```
Clic en: [Registrar Planta]
```

### **Paso 5: Esperar Confirmación**

**Estado 1: En progreso (0-5 seg)**
```
⏳ "Registrando planta en blockchain..."
ID: ALBACA-001
```

**Estado 2: Exitoso (después de 5 seg)**
```
✅ "Planta registrada en blockchain!"
ID: ALBACA-001
Nombre: Albahaca

Hash de Transacción:
3d5cb925f0d44ba755b2c3aca6a0be7282d9ec...

[🔗 Ver en Stellar Expert →]
```

### **Paso 6: Verificar en Stellar Expert**

Clic en el link:
```
https://stellar.expert/explorer/testnet/tx/3d5cb925f0d44ba755b2c3aca6a0be7282d9ec...
```

**Lo que deberías ver:**
```
Transaction
Hash:       3d5cb925f0d44ba755b2c3aca6a0be7282d9ec...
Status:     ✅ Success
Type:       Transaction
Time:       2025-12-11 18:54:07 UTC
Fee:        100 stroops (0.00001 XLM)

Operations (1):
├─ Type:    Invoke Host Function
├─ Contract: CA5C74SZ5XHXENOVQ454WQN66PMVSPMIZV5FYUR6OWDUQKC4PKOOXNPR
├─ Method:  register_plant
├─ Args:    
│  ├─ "ALBACA-001"
│  ├─ "Albahaca"
│  ├─ "Ocimum basilicum"
│  └─ ["Antibacteriana", "Antiviral", "Aromática"]
└─ Status:  ✅ SUCCESS

Signature:
  (Firmado con GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL)
```

---

## 🔄 Prueba 2: Registrar Segunda Planta

Volver a `/plants/register` (formulario limpio automáticamente)

```
ID:                  TOMILLO-001
Nombre:              Tomillo
Nombre Científico:   Thymus vulgaris
Propiedades:         Antitusivo
                     Expectorante
                     Antimicrobiano
```

Repetir pasos 4-6.

**Resultado esperado:**
```
✅ Hash DIFERENTE al de la primera planta
✅ Ambas plantas en blockchain
✅ Ambas verificables en Stellar Expert
```

---

## 📊 Prueba 3: Verificar Lectura del Blockchain

### **Ir a: Plantas → Mi Lista**

**Resultado esperado:**
```
Lista de Plantas Medicinales

🌿 Albahaca
   Ocimum basilicum
   ✅ Registered on blockchain
   Propiedades: Antibacteriana, Antiviral, Aromática

🌿 Tomillo
   Thymus vulgaris
   ✅ Registered on blockchain
   Propiedades: Antitusivo, Expectorante, Antimicrobiano
```

---

## 🔍 Verificaciones Técnicas

### **En la Consola del Navegador (F12)**

**Logs esperados de Test 1:**

```javascript
[registerPlant] Registrando planta en BLOCKCHAIN: {
  id: "ALBACA-001",
  name: "Albahaca",
  scientificName: "Ocimum basilicum",
  properties: ["Antibacteriana", "Antiviral", "Aromática"]
}

[submitOperation] Operación: register_plant
[submitOperation] Construyendo transacción localmente...
[buildTransactionLocally] Construyendo transacción para: register_plant
[buildTransactionLocally] Simulando transacción...
[buildTransactionLocally] Transacción construida exitosamente

[submitOperation] XDR sin firmar obtenido
[submitOperation] Firmando con keypair local...
[submitOperation] ✅ Firmado con keypair local

[submitOperation] Enviando transacción a RPC...
[submitTx] Enviando transacción a: https://soroban-testnet.stellar.org

[submitTx] Estado inicial: PENDING hash: 3d5cb925...
[waitForTransaction] Estado: PENDING
[waitForTransaction] Estado: PENDING
[waitForTransaction] Estado: SUCCESS  ← ✅ ÉXITO

[submitTx] Estado final: SUCCESS
[submitOperation] ✅ Transacción enviada: {
  hash: '3d5cb925f0d44ba755b2c3aca6a0be7282d9ec...',
  status: 'SUCCESS'
}

[PlantRegistration] Planta registrada: ALBACA-001 status: SUCCESS hash: 3d5cb925...
```

---

## ⚠️ Posibles Errores y Soluciones

### **Error 1: "No hay cuenta conectada"**
```
Síntoma: Error al registrar
Solución: 
  → Verificar que config.js tenga SECRET_KEY configurado
  → Verificar console.log muestra la clave pública
```

### **Error 2: "RPC error: Timeout"**
```
Síntoma: Transacción tarda mucho o falla
Solución:
  → Esperar 30 segundos y reintentar
  → La red testnet puede estar lenta
```

### **Error 3: "Insufficient balance"**
```
Síntoma: No hay XLM suficiente
Solución:
  → Ir a https://laboratory.stellar.org/#account-creator
  → Usar PUBLIC_KEY: GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL
  → Clic "Get test network lumens"
```

### **Error 4: "Transaction not found in Stellar Expert"**
```
Síntoma: Link a explorer no funciona
Solución:
  → Esperar 10 segundos (explorer se actualiza)
  → Recargar explorer manualmente
```

---

## 📈 Métricas de Éxito

### **Test 1: Registrar Planta**
```
✅ ÉXITO si:
  - Formulario se envía sin errores
  - Recibe hash en respuesta (no NULL)
  - Hash comienza con letras/números
  - UI muestra "Planta registrada en blockchain!"
```

### **Test 2: Verificar en Explorer**
```
✅ ÉXITO si:
  - Link a Stellar Expert funciona
  - Muestra Status: SUCCESS
  - Muestra Operation: invoke_host_function
  - Muestra Método: register_plant
  - Muestra los datos correctos
```

### **Test 3: Lectura desde Blockchain**
```
✅ ÉXITO si:
  - Plantas aparecen en "Mi Lista"
  - Datos coinciden con lo registrado
  - Se leen sin errores
```

### **Test 4: Segunda Planta**
```
✅ ÉXITO si:
  - Hash es diferente al primero
  - Ambas plantas aparecen en lista
  - Ambas verificables en explorer
```

---

## 📝 Registro de Pruebas

### **Prueba 1: Albahaca**
```
Fecha/Hora:     [Tu fecha/hora]
ID:             ALBACA-001
Hash:           [Hash aquí]
Status:         [ ] Exitoso  [ ] Fallido
Explorer:       [ ] Verificado
```

### **Prueba 2: Tomillo**
```
Fecha/Hora:     [Tu fecha/hora]
ID:             TOMILLO-001
Hash:           [Hash aquí]
Status:         [ ] Exitoso  [ ] Fallido
Explorer:       [ ] Verificado
```

---

## 🎯 Conclusión

Si todas las pruebas pasan:
```
✅ Sistema completamente funcional
✅ Almacenamiento real en blockchain
✅ Transacciones auténticas
✅ Hashes verificables
✅ Listo para producción
```

---

**¿Necesitas ayuda con las pruebas? Muéstrame los resultados de la consola.**
