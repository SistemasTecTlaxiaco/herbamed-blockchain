# 🧪 MANUAL DE TESTING - HerbaMed Blockchain

**Fecha**: 11 de Diciembre, 2024  
**Versión del Contrato**: v2.0  
**Address**: `CCW7E6CECERISMD2FIKKYRMSUEU5F7VGPUHMTARG5PQH3IRNM4CFYJRE`  
**Network**: Stellar Testnet

---

## 📋 PREPARACIÓN

### 1. Iniciar el Servidor de Desarrollo

```bash
cd /home/ricardo_1/herbamed-blockchain/frontend/vue-project
npm run dev
```

✅ **Resultado esperado**:
```
VITE v7.2.2  ready in 330 ms
➜  Local:   http://127.0.0.1:3000/
```

### 2. Abrir la Aplicación

- Navega a: http://127.0.0.1:3000/
- Deberías ver la página de inicio de HerbaMed

### 3. Conectar Wallet

- Instala Freighter Wallet (extensión de Chrome)
- Configura para Testnet
- Conecta tu wallet en la aplicación

---

## 🧪 TEST 1: REGISTRO DE PLANTAS

### Objetivo
Verificar que al registrar una planta:
- ✅ Se envía correctamente al blockchain
- ✅ Aparece enlace de Stellar Explorer
- ✅ El enlace funciona y muestra la transacción
- ✅ La planta aparece en la lista

### Pasos

**1.1 Navegar a Registro**
- Clic en "Registrar Planta" en el menú
- URL: http://127.0.0.1:3000/plants/register

**1.2 Llenar Formulario**
```
ID: TEST-ALBAHACA-001
Nombre Común: Albahaca
Nombre Científico: Ocimum basilicum
Propiedades:
  - Digestiva
  - Antiinflamatoria
  - Aromática
```

**1.3 Registrar Planta**
- Clic en "Registrar Planta"
- Freighter pedirá confirmación
- Aprobar la transacción

**1.4 Verificar Mensaje de Éxito**

✅ **Debe aparecer**:
```
✅ Planta registrada exitosamente!
ID: TEST-ALBAHACA-001

Verificar transacción en Stellar Explorer:
[3105f498...] →
```

**1.5 Verificar Enlace de Explorer**
- Clic en el hash de transacción
- Debe abrir nueva pestaña en Stellar Expert
- URL: `https://stellar.expert/explorer/testnet/tx/[hash]`

✅ **En Stellar Explorer debes ver**:
- Status: ✅ Success
- Operations: 1
- Operation Type: `invoke_contract`
- Contract ID: `CCW7E6CECERISMD2...`
- Function: `register_plant`

**1.6 Verificar Planta en Lista**
- Navegar a "Lista de Plantas"
- URL: http://127.0.0.1:3000/plants

✅ **Debe aparecer**:
```
🌿 Albahaca
Ocimum basilicum
ID: TEST-ALBAHACA-001
Propiedades:
  • Digestiva
  • Antiinflamatoria
  • Aromática
0 votos
```

### ✅ Criterios de Aceptación

- [ ] Formulario se envía sin errores
- [ ] Alert de éxito aparece
- [ ] Transaction hash es clickeable
- [ ] Enlace abre Stellar Explorer en nueva pestaña
- [ ] Explorer muestra status: Success
- [ ] Planta aparece en lista inmediatamente
- [ ] Formulario se limpia automáticamente

---

## 🧪 TEST 2: SISTEMA DE VOTACIÓN

### Objetivo
Verificar que al votar por una planta:
- ✅ El voto se registra en blockchain
- ✅ Aparece enlace de Stellar Explorer
- ✅ El contador de votos incrementa a 1
- ✅ No se puede votar dos veces

### Pasos

**2.1 Navegar a Validación**
- Clic en "Validación" en el menú
- URL: http://127.0.0.1:3000/validators

**2.2 Buscar Planta**
- En el buscador, escribir: `TEST-ALBAHACA-001`
- Clic en "🔍 Buscar"

✅ **Debe aparecer**:
```
✅ Planta Albahaca agregada a la lista
```

**2.3 Verificar Estado Inicial**

✅ **Card debe mostrar**:
```
🌿 Albahaca
Ocimum basilicum
ID: TEST-ALBAHACA-001

⏳ Pendiente    0 votos

[👍 Votar para validar]
[🔄 Actualizar votos]
```

**2.4 Votar por la Planta**
- Clic en "👍 Votar para validar"
- Freighter pedirá confirmación
- Aprobar la transacción

**2.5 Verificar Mensaje de Éxito**

✅ **Debe aparecer**:
```
✅ Voto registrado para TEST-ALBAHACA-001
[Ver en Stellar Expert →]
```

**2.6 Verificar Enlace de Explorer**
- Clic en "Ver en Stellar Expert"
- Nueva pestaña se abre

✅ **En Stellar Explorer debes ver**:
- Status: ✅ Success
- Operation: `invoke_contract`
- Function: `vote_for_plant`

**2.7 Verificar Contador Actualizado**

✅ **Card ahora debe mostrar**:
```
🌿 Albahaca
Ocimum basilicum
ID: TEST-ALBAHACA-001

⏳ Pendiente    1 votos  ← INCREMENTÓ!

[✅ Votado]  ← BOTÓN DESHABILITADO
[🔄 Actualizar votos]
```

**2.8 Intentar Votar de Nuevo**
- El botón debe estar deshabilitado
- Texto: "✅ Votado"

**2.9 Refrescar Votos**
- Clic en "🔄 Actualizar votos"
- Debe mantener: "1 votos"

### ✅ Criterios de Aceptación

- [ ] Búsqueda de planta funciona
- [ ] Estado inicial: 0 votos
- [ ] Voto se envía sin errores
- [ ] Alert de éxito con enlace Explorer
- [ ] Explorer muestra transacción exitosa
- [ ] Contador incrementa de 0 → 1
- [ ] Botón cambia a "✅ Votado"
- [ ] Botón queda deshabilitado
- [ ] No se puede votar dos veces

---

## 🧪 TEST 3: MARKETPLACE

### Objetivo
Verificar el flujo completo del marketplace:
- ✅ Listar planta para venta
- ✅ Planta aparece en marketplace
- ✅ Enlaces de Stellar Explorer
- ✅ Comprar planta
- ✅ Planta desaparece del marketplace

### Pasos

**3.1 Navegar a Marketplace**
- Clic en "Marketplace" en el menú
- URL: http://127.0.0.1:3000/marketplace

**3.2 Verificar Estado Inicial**

Si no hay listings:
```
⏳ Cargando listings desde blockchain...
```

Luego:
```
📭 No hay plantas en el marketplace
Usa el buscador arriba para encontrar plantas en venta.
```

**3.3 Poner Planta en Venta**

En la sección "📦 Vender una Planta":
```
ID de planta a vender: TEST-ALBAHACA-001
Precio (XLM): 10
```

- Clic en "📦 Poner en venta"
- Freighter pedirá confirmación
- Aprobar transacción

**3.4 Verificar Mensaje de Éxito**

✅ **Debe aparecer**:
```
✅ Planta TEST-ALBAHACA-001 puesta en venta por 10 XLM
[Ver en Stellar Expert →]
```

**3.5 Verificar Enlace de Explorer (Listing)**
- Clic en "Ver en Stellar Expert"
- Nueva pestaña se abre

✅ **En Stellar Explorer debes ver**:
- Status: ✅ Success
- Function: `list_for_sale`

**3.6 Verificar Planta en Marketplace**

✅ **Debe aparecer card**:
```
🌿 Albahaca
Ocimum basilicum
ID: TEST-ALBAHACA-001

Propiedades:
  • Digestiva
  • Antiinflamatoria
  • Aromática

Vendedor: GCNB6U...J4MQ

✅ Disponible    10 XLM

[🛒 Comprar]
```

**3.7 Comprar la Planta**

⚠️ **IMPORTANTE**: Para este test necesitas dos cuentas:
- Cuenta A: Listó la planta
- Cuenta B: Va a comprar

Cambiar a **Cuenta B** en Freighter:
- Clic en "🛒 Comprar"
- Freighter pedirá confirmación
- Aprobar transacción

**3.8 Verificar Mensaje de Éxito (Compra)**

✅ **Debe aparecer**:
```
✅ Planta TEST-ALBAHACA-001 comprada exitosamente
[Ver en Stellar Expert →]
```

**3.9 Verificar Enlace de Explorer (Compra)**
- Clic en "Ver en Stellar Expert"

✅ **En Stellar Explorer debes ver**:
- Status: ✅ Success
- Function: `buy_listing`

**3.10 Verificar Planta Desapareció**

El marketplace debe volver a:
```
📭 No hay plantas en el marketplace
```

O si hay otros listings, la planta TEST-ALBAHACA-001 ya no debe aparecer.

### ✅ Criterios de Aceptación

- [ ] Formulario de venta funciona
- [ ] Listing se crea sin errores
- [ ] Alert con enlace Explorer (listing)
- [ ] Planta aparece en marketplace
- [ ] Card muestra toda la información
- [ ] Precio se muestra correctamente
- [ ] Botón de compra funciona
- [ ] Alert con enlace Explorer (compra)
- [ ] Planta desaparece del marketplace
- [ ] Ambos enlaces de Explorer funcionan

---

## 🧪 TEST 4: PERSISTENCIA DE DATOS

### Objetivo
Verificar que los datos persisten en blockchain y no en localStorage

### Pasos

**4.1 Registrar 3 Plantas**

Registra estas plantas (una por una):

**Planta 1**:
```
ID: TEST-MENTA-001
Nombre: Menta
Científico: Mentha piperita
Propiedades: Digestiva, Refrescante
```

**Planta 2**:
```
ID: TEST-ROMERO-001
Nombre: Romero
Científico: Rosmarinus officinalis
Propiedades: Antioxidante, Estimulante
```

**Planta 3**:
```
ID: TEST-LAVANDA-001
Nombre: Lavanda
Científico: Lavandula angustifolia
Propiedades: Relajante, Aromática
```

**4.2 Verificar Aparecen en Lista**
- Navega a "Lista de Plantas"
- Deberías ver las 4 plantas:
  - TEST-ALBAHACA-001
  - TEST-MENTA-001
  - TEST-ROMERO-001
  - TEST-LAVANDA-001

**4.3 Cerrar el Navegador Completamente**
- Cerrar todas las pestañas
- Cerrar el navegador
- Esperar 10 segundos

**4.4 Reabrir Navegador**
- Abrir navegador nuevamente
- Navegar a: http://127.0.0.1:3000/
- Conectar wallet si es necesario

**4.5 Navegar a Lista de Plantas**
- Ir a "Lista de Plantas"

✅ **TODAS las plantas deben aparecer**:
- TEST-ALBAHACA-001
- TEST-MENTA-001
- TEST-ROMERO-001
- TEST-LAVANDA-001

**4.6 Verificar Contador de Votos**
- La planta TEST-ALBAHACA-001 debe mostrar: "1 votos"
- Las demás: "0 votos"

### ✅ Criterios de Aceptación

- [ ] 3 plantas registradas exitosamente
- [ ] 4 plantas aparecen en lista inicial
- [ ] Datos persisten después de cerrar navegador
- [ ] 4 plantas siguen apareciendo después de reabrir
- [ ] Contador de votos se mantiene (1 voto en Albahaca)
- [ ] No se pierde ninguna información

---

## 🧪 TEST 5: VERIFICAR LOCALSTORAGE LIMPIO

### Objetivo
Confirmar que localStorage solo contiene datos de autenticación

### Pasos

**5.1 Abrir DevTools**
- Presiona F12
- Pestaña "Application" (o "Aplicación")

**5.2 Inspeccionar localStorage**
- En el panel izquierdo:
  - Storage → Local Storage → http://127.0.0.1:3000

**5.3 Verificar Claves**

✅ **SOLO deben existir estas claves**:
```
soroban_auth         (datos de sesión Freighter)
wc_session_topic     (WalletConnect, si aplica)
```

❌ **NO deben existir**:
```
herbamed_plant_ids      ← ELIMINADO
herbamed_plant_[ID]     ← ELIMINADO
herbamed_listing_[ID]   ← ELIMINADO
registered_plant_ids    ← ELIMINADO
```

**5.4 Limpiar localStorage (Opcional)**
- Clic derecho en localStorage
- "Clear All"
- Refrescar página
- Conectar wallet nuevamente

**5.5 Verificar Plantas Siguen Apareciendo**
- Después de limpiar localStorage
- Navega a "Lista de Plantas"
- TODAS las plantas deben seguir apareciendo

✅ **Esto confirma**:
- Los datos vienen del blockchain
- No dependen de localStorage

### ✅ Criterios de Aceptación

- [ ] localStorage solo tiene 1-2 claves (auth)
- [ ] No hay claves de plantas/listings
- [ ] Limpiar localStorage no borra plantas
- [ ] Datos persisten después de limpiar
- [ ] Solo datos de autenticación en localStorage

---

## 📊 RESUMEN DE RESULTADOS

### Checklist General

| Test | Status | Notas |
|------|--------|-------|
| 1. Registro de Plantas | ⏳ | Enlaces Explorer funcionan |
| 2. Sistema de Votación | ⏳ | Contador incrementa correctamente |
| 3. Marketplace | ⏳ | Flujo completo list/buy |
| 4. Persistencia | ⏳ | Datos persisten en blockchain |
| 5. localStorage Limpio | ⏳ | Solo datos de autenticación |

### Funcionalidades Verificadas

- [ ] Registro de plantas
- [ ] Enlaces de Stellar Explorer (registro)
- [ ] Plantas aparecen en lista
- [ ] Votación funciona
- [ ] Enlaces de Stellar Explorer (voto)
- [ ] Contador de votos actualiza
- [ ] Listar planta para venta
- [ ] Enlaces de Stellar Explorer (listing)
- [ ] Marketplace carga automáticamente
- [ ] Compra de plantas
- [ ] Enlaces de Stellar Explorer (compra)
- [ ] Plantas desaparecen después de compra
- [ ] Persistencia después de cerrar navegador
- [ ] localStorage solo tiene auth
- [ ] Datos vienen del blockchain

---

## 🐛 PROBLEMAS ENCONTRADOS

### Durante Testing
(Registra aquí cualquier problema que encuentres)

| # | Descripción | Severidad | Status |
|---|-------------|-----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## 📝 NOTAS ADICIONALES

### Transacciones en Testnet
- Cada transacción requiere ~100,000 stroops de fee
- Asegúrate de tener XLM en tu cuenta testnet
- Obtener XLM gratis: https://laboratory.stellar.org/#account-creator?network=test

### Stellar Explorer
- Red Testnet: https://stellar.expert/explorer/testnet
- Puedes buscar transacciones por hash
- Puedes ver historial de contratos

### Logs del Navegador
- Abre consola (F12 → Console)
- Verás logs de cada operación:
  ```
  [Soroban] Registrando planta: TEST-ALBAHACA-001
  [Soroban] Planta registrada exitosamente
  [Soroban] Transaction hash: 3105f498...
  ```

---

## ✅ CONCLUSIÓN

Una vez completados todos los tests:

**✅ Sistema Funcional** si:
- Todas las transacciones se confirman
- Enlaces de Explorer funcionan
- Datos persisten correctamente
- localStorage está limpio
- No hay errores en consola

**❌ Requiere Correcciones** si:
- Alguna transacción falla
- Enlaces no funcionan
- Datos no persisten
- localStorage tiene datos de negocio

---

**Testing realizado por**: _____________  
**Fecha**: _____________  
**Resultado**: ✅ Aprobado / ❌ Con observaciones

---

**Siguiente paso**: Actualizar USER_MANUAL.md y TRANSACCIONES_GUIA.md con los hallazgos.
