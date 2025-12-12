#!/bin/bash

# Script de Deployment a Vercel - Herbamed Blockchain
# Este script te guía para subir el proyecto a Vercel

echo "=========================================="
echo "🚀 DEPLOYMENT DE HERBAMED BLOCKCHAIN"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si git está inicializado
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git no está inicializado. Inicializando...${NC}"
    git init
    echo -e "${GREEN}✓ Git inicializado${NC}"
fi

# Verificar si hay un remote configurado
if ! git remote | grep -q 'origin'; then
    echo ""
    echo -e "${BLUE}📝 Necesitas configurar el remote de GitHub${NC}"
    echo "Copia la URL de tu repositorio de GitHub (ejemplo: https://github.com/tu-usuario/herbamed-blockchain.git)"
    read -p "Pega la URL aquí: " repo_url
    git remote add origin "$repo_url"
    echo -e "${GREEN}✓ Remote configurado${NC}"
fi

# Crear .gitignore si no existe
if [ ! -f ".gitignore" ]; then
    echo -e "${YELLOW}Creando .gitignore...${NC}"
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
frontend/vue-project/node_modules/

# Build outputs
frontend/vue-project/dist/
target/

# Environment variables
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS files
.DS_Store
Thumbs.db

# Vercel
.vercel

# Backups
frontend/vue-project/backups/
EOF
    echo -e "${GREEN}✓ .gitignore creado${NC}"
fi

echo ""
echo -e "${BLUE}📦 Preparando archivos para commit...${NC}"
git add .

echo ""
read -p "Mensaje del commit (Enter para usar 'Deploy to Vercel'): " commit_msg
commit_msg=${commit_msg:-"Deploy to Vercel"}

git commit -m "$commit_msg"
echo -e "${GREEN}✓ Commit creado${NC}"

echo ""
echo -e "${BLUE}☁️  Subiendo a GitHub...${NC}"
git branch -M main
git push -u origin main

echo ""
echo -e "${GREEN}=========================================="
echo "✅ ¡PROYECTO SUBIDO A GITHUB!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASOS EN VERCEL:${NC}"
echo ""
echo "1. Ve a https://vercel.com/dashboard"
echo "2. Clic en 'Add New Project'"
echo "3. Importa tu repositorio 'herbamed-blockchain'"
echo "4. Vercel detectará automáticamente la configuración (vercel.json)"
echo "5. Clic en 'Deploy'"
echo ""
echo -e "${GREEN}🎉 ¡Tu proyecto estará en línea en 2-3 minutos!${NC}"
echo ""
