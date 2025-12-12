# 📋 Guía de Pruebas UI - HerbaMed Blockchain

## 🌐 Servidor de Desarrollo
**URL:** http://127.0.0.1:3000

## 🔑 Keypairs de Prueba

### Vendedor (Cuenta 1)
```
Public: GA25GZEXA23M6NOC7NJLB4CKPS4MZSCNTDB5KPNN7VCNQI5GRK53MDPL
Secret: SBSSPK2I4XNMGPT5TZXRDWC5YC4DIILXQA5XS6TFCBX72F2EFP7YMSVW
```

### Comprador (Cuenta 2)
```
Public: GA2JBPZ6PBRBZEDXKKMFMV3LRFARBWZ4UXG4OJPVLNXRDZPV4GBSSFTV
Secret: SDFGRGSMHS56WO7AZ4KLUC63LPJ7PB4KCIGYB6ZJ22WVWQCNS6ETMLRZ
```

## ✅ Cambios Implementados

### 1. **Plantas Default Agregadas**
Cada sección ahora tiene múltiples plantas default con IDs formato `D-NOMBRE-XXX`:

#### PlantList (5 plantas)
- D-MANZANILLA-001 (Matricaria chamomilla) - 5 votos ✓
- D-LAVANDA-002 (Lavandula angustifolia) - 3 votos ✓
- D-ROMERO-003 (Rosmarinus officinalis) - 2 votos
- D-MENTA-004 (Mentha piperita) - 4 votos ✓
- D-ALBAHACA-005 (Ocimum basilicum) - 1 voto

#### MarketPlace (3 listings)
- D-LAVANDA-002: 15 XLM ✓
- D-JENGIBRE-006: 20 XLM ✓
- D-EUCALIPTO-007: 12 XLM ✓

#### Validación (3 plantas)
- D-ROMERO-003: 2 votos
- D-CALENDULA-008: 1 voto
- D-TOMILLO-009: 5 votos ✓

### 2. **Auto-actualización Mejorada**

#### Antes ❌
- Las plantas registradas NO aparecían automáticamente
- Solo se mostraban plantas default
- Había que buscar manualmente para ver plantas registradas

#### Ahora ✅
- Plantas reales del usuario aparecen **primero**
- Plantas default aparecen **al final**
- Después de registrar: auto-redirige a /plants en 3 segundos
- `onActivated()` refresca al volver a cada sección
- Filtrado de plantas D- del blockchain para evitar duplicados

### 3. **Buscador Mejorado**

#### Antes ❌
- Solo buscaba en blockchain
- Agregaba duplicados
- No posicionaba la planta encontrada

#### Ahora ✅
- **Primero** busca en la lista actual
- **Reposiciona al inicio** la planta encontrada
- **Solo si no existe** busca en blockchain
- Mensaje claro indicando dónde encontró la planta

## 🧪 Flujo de Pruebas

### Paso 1: Configurar Cuenta de Vendedor
```bash
# Editar archivo de configuración
nano frontend/vue-project/src/soroban/config.js

# Cambiar SECRET_KEY a la del vendedor:
export const SECRET_KEY = 'SBSSPK2I4XNMGPT5TZXRDWC5YC4DIILXQA5XS6TFCBX72F2EFP7YMSVW'
```

### Paso 2: Registrar Nueva Planta 🌿

1. Abrir http://127.0.0.1:3000/plants/register
2. Registrar planta:
   ```
   ID: TEST-ALBAHACA-001
   Nombre: Albahaca Medicinal
   Nombre Científico: Ocimum basilicum
   Propiedades: Digestiva, Antibacteriana, Calmante
   ```
3. Hacer clic en "Registrar Planta"
4. **Esperar 3 segundos** → Auto-redirige a /plants
5. ✅ **Verificar**: La planta TEST-ALBAHACA-001 aparece **primero** en la lista

### Paso 3: Verificar Plantas Registradas 📋

1. Ir a "Plantas" (http://127.0.0.1:3000/plants)
2. ✅ **Verificar orden**:
   - TEST-ALBAHACA-001 (tu planta) **al inicio**
   - D-MANZANILLA-001 (default) después
   - D-LAVANDA-002 (default)
   - etc.

### Paso 4: Probar Buscador 🔍

1. En "Plantas", buscar: `D-ALBAHACA-005`
2. ✅ **Verificar**: D-ALBAHACA-005 se **mueve al inicio**
3. Buscar: `TEST-ALBAHACA-001`
4. ✅ **Verificar**: TEST-ALBAHACA-001 se **mueve al inicio**

### Paso 5: Listar en MarketPlace 💰

1. Ir a "Marketplace" (http://127.0.0.1:3000/marketplace)
2. Click en tab **"📦 Mis Plantas"**
3. ✅ **Verificar**: TEST-ALBAHACA-001 aparece aquí
4. Asignar precio: `25` XLM
5. Click "💰 Poner en Venta"
6. ✅ **Verificar**: 
   - Transacción SUCCESS
   - Enlace a Stellar Explorer
   - Auto-cambia a tab "💰 Mis Plantas en Venta"
   - TEST-ALBAHACA-001 ahora aparece en venta

### Paso 6: Cambiar a Cuenta Comprador

```bash
# Editar config.js
nano frontend/vue-project/src/soroban/config.js

# Cambiar SECRET_KEY:
export const SECRET_KEY = 'SDFGRGSMHS56WO7AZ4KLUC63LPJ7PB4KCIGYB6ZJ22WVWQCNS6ETMLRZ'

# Refrescar navegador (Ctrl+Shift+R)
```

### Paso 7: Comprar Planta 🛒

1. Ir a "Marketplace"
2. Click en tab **"🛍️ Plantas de Otros"**
3. ✅ **Verificar**: TEST-ALBAHACA-001 aparece aquí (del vendedor)
4. También se ven defaults: D-LAVANDA-002, D-JENGIBRE-006, D-EUCALIPTO-007
5. Click "🛒 Comprar" en TEST-ALBAHACA-001
6. ✅ **Verificar**:
   - Transacción SUCCESS
   - Enlace a Stellar Explorer

### Paso 8: Validar Planta ✅

1. Ir a "Validación" (http://127.0.0.1:3000/validator)
2. Click en tab **"✅ Validar Plantas de Otros"**
3. ✅ **Verificar**: Aparecen plantas default (D-ROMERO-003, D-CALENDULA-008, D-TOMILLO-009)
4. Buscar planta del vendedor para validar
5. Click "👍 Validar Planta"
6. ✅ **Verificar**:
   - Transacción SUCCESS
   - Contador de votos incrementa

### Paso 9: Ver Mis Validaciones 📊

1. Cambiar a cuenta vendedor (config.js)
2. Ir a "Validación"
3. Click en tab **"📊 Mis Plantas Validadas"**
4. ✅ **Verificar**: 
   - Tus plantas en venta aparecen
   - Contador de validaciones visible
   - Precio de venta mostrado

## 🎯 Checklist de Funcionalidades

### PlantList ✓
- [x] Muestra 5 plantas default
- [x] Plantas reales aparecen primero
- [x] Auto-refresh con onActivated
- [x] Buscador reposiciona planta al inicio
- [x] Después de registrar → auto-redirige y muestra planta nueva

### MarketPlace ✓
- [x] 3 menús con tabs funcionales
- [x] Tab 1: Mis plantas sin precio
- [x] Tab 2: Mis plantas en venta
- [x] Tab 3: Plantas de otros
- [x] Buscador indica en qué menú está
- [x] 3 listings default
- [x] Transacciones listForSale/buyListing funcionan

### Validación ✓
- [x] 2 menús con tabs
- [x] Tab 1: Mis plantas y validaciones
- [x] Tab 2: Validar plantas ajenas
- [x] 3 plantas default
- [x] Contador de votos actualizable
- [x] Transacción voteForPlant funciona

## 🚀 Comandos Útiles

```bash
# Ver logs del servidor
cd frontend/vue-project && npm run dev

# Ver plantas registradas en el contrato
node test-marketplace-e2e.js

# Commit cambios
git add -A && git commit -m "test: Pruebas UI completadas"
git push origin main

# Deploy a Vercel
./deploy-to-vercel.sh
```

## 📝 Notas Importantes

1. **IDs de plantas default** usan formato `D-NOMBRE-XXX`
2. **Filtrado automático**: No se muestran plantas D- duplicadas del blockchain
3. **Orden de carga**: Plantas reales primero, defaults al final
4. **Auto-actualización**: onActivated() en todas las vistas
5. **Buscador inteligente**: Busca en lista actual primero, luego blockchain

## ✅ Resultado Esperado

Después de seguir todas las pruebas:

- ✓ Plantas registradas se ven inmediatamente
- ✓ Cada sección tiene contenido (defaults)
- ✓ Flujo completo: registro → marketplace → validación → compra
- ✓ Todas las transacciones confirmadas en Stellar Explorer
- ✓ Buscador funciona correctamente
- ✓ Auto-refresh al cambiar de sección
