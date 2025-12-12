# 🚀 Guía de Deployment - Herbamed Blockchain en Vercel

## 📋 Requisitos Previos

- Cuenta de GitHub
- Cuenta de Vercel (vinculada con GitHub)
- Git instalado en tu computadora

---

## 🎯 PROCESO COMPLETO PASO A PASO

### **PARTE 1: CONFIGURACIÓN INICIAL (MANUAL)**

#### 1️⃣ Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Configura el repositorio:
   - **Nombre:** `herbamed-blockchain`
   - **Visibilidad:** Público o Privado (tu elección)
   - **NO marques** "Initialize with README"
3. Clic en **"Create repository"**
4. **IMPORTANTE:** Copia la URL del repositorio (ejemplo: `https://github.com/tu-usuario/herbamed-blockchain.git`)

#### 2️⃣ Crear Cuenta en Vercel

1. Ve a https://vercel.com
2. Clic en **"Sign Up"**
3. **Selecciona "Continue with GitHub"** (esto es importante)
4. Autoriza a Vercel para acceder a tus repositorios
5. Completa tu perfil

---

### **PARTE 2: SUBIR EL PROYECTO (SEMI-AUTOMÁTICO)**

#### 3️⃣ Ejecutar el Script de Deployment

En la terminal, ejecuta:

```bash
cd /home/ricardo_1/herbamed-blockchain
./deploy-to-vercel.sh
```

El script te pedirá:
- La URL de tu repositorio de GitHub (la que copiaste en el paso 1)
- Un mensaje de commit (puedes presionar Enter para usar el predeterminado)

El script hará automáticamente:
- ✅ Inicializar Git
- ✅ Configurar el remote de GitHub
- ✅ Crear .gitignore
- ✅ Hacer commit de todos los archivos
- ✅ Subir el código a GitHub

---

### **PARTE 3: DEPLOYMENT EN VERCEL (MANUAL)**

#### 4️⃣ Importar Proyecto en Vercel

1. Ve a tu dashboard de Vercel: https://vercel.com/dashboard
2. Clic en **"Add New Project"** o **"Import Project"**
3. Busca tu repositorio **"herbamed-blockchain"** en la lista
4. Clic en **"Import"**

#### 5️⃣ Configurar el Proyecto

Vercel detectará automáticamente la configuración de `vercel.json`, pero verifica:

- **Framework Preset:** Vite
- **Root Directory:** `./` (raíz del proyecto)
- **Build Command:** `cd frontend/vue-project && npm install && npm run build`
- **Output Directory:** `frontend/vue-project/dist`

Si algo no está correcto, ajústalo manualmente.

#### 6️⃣ Variables de Entorno (si las necesitas)

Si tu proyecto necesita variables de entorno:

1. En la configuración del proyecto, ve a **"Environment Variables"**
2. Añade las variables necesarias:
   - `VITE_STELLAR_NETWORK=testnet`
   - `VITE_CONTRACT_ID=tu-contract-id`
   - Etc.

#### 7️⃣ Deploy!

1. Clic en **"Deploy"**
2. Espera 2-3 minutos mientras Vercel:
   - Instala dependencias
   - Construye el proyecto
   - Despliega en CDN global

---

## ✅ ¡PROYECTO EN LÍNEA!

Una vez completado el deployment:

- 🌐 Vercel te dará una URL: `https://herbamed-blockchain-xxx.vercel.app`
- 🔄 Los futuros cambios se desplegarán automáticamente al hacer push a GitHub
- 📊 Puedes ver analytics, logs y métricas en el dashboard de Vercel

---

## 🔧 COMANDOS ÚTILES

### Actualizar el proyecto después del deployment:

```bash
cd /home/ricardo_1/herbamed-blockchain
git add .
git commit -m "Descripción de los cambios"
git push origin main
```

Vercel automáticamente detectará los cambios y re-desplegará.

### Ver el preview del proyecto localmente:

```bash
cd frontend/vue-project
npm run build
npm run preview
```

---

## 🎨 PERSONALIZACIÓN DEL DOMINIO (OPCIONAL)

### Usar un Dominio Personalizado:

1. Ve a tu proyecto en Vercel
2. Clic en **"Settings"** → **"Domains"**
3. Añade tu dominio personalizado
4. Sigue las instrucciones para configurar los DNS

---

## 📝 ESTRUCTURA DE ARCHIVOS DE CONFIGURACIÓN

### `vercel.json`
Configuración principal de Vercel con:
- Comandos de build
- Directorio de output
- Headers CORS
- Rewrites para SPA routing

### `.vercelignore`
Archivos que no se subirán a Vercel:
- node_modules
- archivos de build de Rust
- tests
- backups

### `deploy-to-vercel.sh`
Script automatizado para subir a GitHub

---

## ⚠️ TROUBLESHOOTING

### Error: "Build failed"
- Verifica que el comando de build esté correcto en vercel.json
- Revisa los logs de build en Vercel
- Asegúrate de que `package.json` tenga todas las dependencias

### Error: "404 on page refresh"
- Verifica que el rewrite esté configurado en vercel.json
- Debería redirigir todo a `/index.html` para SPA

### Error: "Environment variables not working"
- Asegúrate de que las variables tengan el prefijo `VITE_`
- Re-deploya después de añadir variables de entorno

---

## 🆘 SOPORTE

- Documentación de Vercel: https://vercel.com/docs
- Comunidad de Vercel: https://github.com/vercel/vercel/discussions
- Documentación de Vite: https://vitejs.dev/guide/

---

## 📊 VENTAJAS DE VERCEL

✅ **Deployment automático** desde GitHub  
✅ **SSL gratuito** (HTTPS automático)  
✅ **CDN global** (velocidad en todo el mundo)  
✅ **Preview deployments** para cada PR  
✅ **Analytics** y métricas  
✅ **Rollback** fácil a versiones anteriores  
✅ **Dominio personalizado** gratuito  

---

## 🎉 ¡LISTO!

Tu proyecto Herbamed Blockchain ahora está en producción y accesible desde cualquier parte del mundo.
