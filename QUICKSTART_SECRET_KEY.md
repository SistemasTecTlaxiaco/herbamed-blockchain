# 🔑 Guía Rápida: Usar SECRET_KEY sin Freighter

## ✅ OPCIÓN RECOMENDADA AHORA

Ya que Freighter tiene problemas de detección, **usa tu SECRET_KEY directamente**. Es más simple y funciona inmediatamente.

---

## 📋 Pasos para Configurar

### **Método 1: Usar .env.local (YA CONFIGURADO)**

El archivo `.env.local` ya tiene tu SECRET_KEY:

```bash
VITE_SOROBAN_SECRET_KEY=SC6F34...QHFNHR
```

✅ **Ventajas:**
- No se sube a GitHub (protegido por `.gitignore`)
- Se carga automáticamente en `client.js`
- No requiere importar en la UI

🔄 **Reinicia el servidor:**
```bash
# Detén el servidor actual (Ctrl+C)
npm run dev
```

---

### **Método 2: Importar en la UI**

Si prefieres no usar `.env.local`:

1. Ve a http://127.0.0.1:3000/login
2. Click en tab **"🔐 Importar Clave"** (ahora es la pestaña por defecto)
3. Pega tu SECRET_KEY:
   ```
   SC6F34PG...QHFNHR
   ```
4. Click en **"Solo importar (no guardar)"**

✅ Listo, ya puedes firmar transacciones

---

### **Método 3: Hardcodear en config.js (Solo Testing)**

Abre `frontend/vue-project/src/soroban/config.js` y descomenta la línea:

```javascript
// ANTES (comentado):
// export const SECRET_KEY = 'SC6F34P...KHPQHFNHR'

// DESPUÉS (descomentado):
export const SECRET_KEY = 'SC6F34PGD...ZLWNKHPQHFNHR'
```

⚠️ **IMPORTANTE:** NO hacer commit de este cambio (quitar antes de subir a GitHub)

---

## 🧪 Probar las Funciones

### **1. Registrar Planta**

```bash
# Ve a: http://127.0.0.1:3000/plants/register

Nombre: Manzanilla
Descripción: Planta medicinal para infusiones
Ubicación: Jardín A

[Modo]: Blockchain
[Click]: Registrar Planta
```

Verás en consola:
```
[submitTx] ✓ Firmando con SECRET_KEY de configuración...
[submitTx] ✓ Firmado con SECRET_KEY de config: GADZC7QBB4T...PIICESF23
```

---

### **2. Votar por Planta**

```bash
# Ve a: http://127.0.0.1:3000/plants

[Click en una planta]: Votar
```

---

### **3. Listar en Marketplace**

```bash
# Ve a: http://127.0.0.1:3000/marketplace

ID Planta: 1
Precio: 100
[Modo]: Blockchain
[Click]: Listar para Venta
```

---

### **4. Comprar Planta**

```bash
# En mismo marketplace, busca listing disponible
[Click]: Comprar
```

---

## 🔍 Verificar Transacciones

Después de cada operación blockchain, verás en consola:

```javascript
{
  id: "a1b2c3...",           // Transaction hash
  status: "success",
  results: [...]
}
```

Copia el `id` y búscalo en **Stellar Expert**:
```
https://stellar.expert/explorer/testnet/tx/[TU_TX_HASH]
```

---

## 📊 Orden de Prioridad de Firma

El `client.js` intenta firmar en este orden:

1. **Freighter** (si está instalada y funcionando)
2. **LOCAL_SECRET** (importado en UI con "Importar Clave")
3. **config.SECRET_KEY** (desde `.env.local` o hardcoded) ✅ ESTE FUNCIONA AHORA
4. **Builder Service** (si `TX_BUILDER_URL` configurado)

Como `.env.local` tiene tu SECRET_KEY, **funcionará automáticamente** sin necesidad de Freighter.

---

## ✅ Verificar que Funciona

```bash
# 1. Abre consola del navegador (F12)
# 2. Pega este código:

console.log('SECRET_KEY en config:', 
  import.meta.env.VITE_SOROBAN_SECRET_KEY ? '✓ Configurado' : '✗ No encontrado'
)
```

Deberías ver:
```
SECRET_KEY en config: ✓ Configurado
```

---

## 🚨 Seguridad

### ✅ Archivos Protegidos (NO se suben a GitHub):
- `.env.local` → Ya está en `.gitignore` con patrón `*.local`

### ⚠️ NUNCA Hacer Commit de:
- SECRET_KEY hardcoded en `config.js`
- Archivos `.env.local` o `.env.development.local`

### 🔒 Antes de Subir a GitHub:

```bash
# Verifica que .env.local NO está staged:
git status

# Si aparece, quítalo:
git reset .env.local
```

---

## 🎯 Resumen

### **Configuración Actual:**
- ✅ `.env.local` creado con tu SECRET_KEY
- ✅ `.gitignore` protege archivos `*.local`
- ✅ `client.js` tiene logs mejorados
- ✅ Tab "Importar Clave" es el predeterminado en Login

### **Próximos Pasos:**
1. Reiniciar `npm run dev`
2. Probar REGISTRAR → VOTAR → LISTAR → COMPRAR
3. Verificar logs en consola
4. Si funciona, ¡ya no necesitas Freighter! 🎉

---

## 🆘 Troubleshooting

### No funciona después de reiniciar servidor:

```bash
# Verifica que .env.local existe:
ls -la frontend/vue-project/.env.local

# Verifica contenido:
cat frontend/vue-project/.env.local

# Debe mostrar:
VITE_SOROBAN_SECRET_KEY=SC6F34PG...
```

### Sigue sin firmar:

Abre `frontend/vue-project/src/soroban/config.js` y descomenta temporalmente:

```javascript
export const SECRET_KEY = 'SC6F34PGDRK...PQHFNHR'
```

---

**¡Listo! Ya no dependes de Freighter. Puedes firmar todo directamente con tu keypair.** 🚀
