#!/bin/bash

# 🔄 Script de Migración: Eliminación de localStorage
# Este script realiza un backup y aplica los cambios documentados

set -e  # Exit on error

FRONTEND_DIR="/home/ricardo_1/herbamed-blockchain/frontend/vue-project"
BACKUP_DIR="$FRONTEND_DIR/backups/$(date +%Y%m%d_%H%M%S)"
CLIENT_JS="$FRONTEND_DIR/src/soroban/client.js"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 MIGRACIÓN: Eliminar localStorage de HerbaMed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Crear backup
echo "📦 Creando backup en: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

cp "$CLIENT_JS" "$BACKUP_DIR/client.js.bak"
cp "$FRONTEND_DIR/src/views/validators/ValidatorDashboard.vue" "$BACKUP_DIR/ValidatorDashboard.vue.bak" 2>/dev/null || true
cp "$FRONTEND_DIR/src/components/plants/MarketPlace.vue" "$BACKUP_DIR/MarketPlace.vue.bak" 2>/dev/null || true
cp "$FRONTEND_DIR/src/views/plants/PlantList.vue" "$BACKUP_DIR/PlantList.vue.bak" 2>/dev/null || true

echo "✅ Backup completado"
echo ""

# 2. Reemplazar componentes Vue
echo "🔧 Reemplazando componentes Vue..."

if [ -f "$FRONTEND_DIR/src/views/validators/ValidatorDashboard-updated.vue" ]; then
  mv "$FRONTEND_DIR/src/views/validators/ValidatorDashboard.vue" "$BACKUP_DIR/ValidatorDashboard.old.vue" 2>/dev/null || true
  mv "$FRONTEND_DIR/src/views/validators/ValidatorDashboard-updated.vue" "$FRONTEND_DIR/src/views/validators/ValidatorDashboard.vue"
  echo "  ✅ ValidatorDashboard.vue actualizado"
fi

if [ -f "$FRONTEND_DIR/src/components/plants/MarketPlace-updated.vue" ]; then
  mv "$FRONTEND_DIR/src/components/plants/MarketPlace.vue" "$BACKUP_DIR/MarketPlace.old.vue" 2>/dev/null || true
  mv "$FRONTEND_DIR/src/components/plants/MarketPlace-updated.vue" "$FRONTEND_DIR/src/components/plants/MarketPlace.vue"
  echo "  ✅ MarketPlace.vue actualizado"
fi

if [ -f "$FRONTEND_DIR/src/views/plants/PlantList-updated.vue" ]; then
  mv "$FRONTEND_DIR/src/views/plants/PlantList.vue" "$BACKUP_DIR/PlantList.old.vue" 2>/dev/null || true
  mv "$FRONTEND_DIR/src/views/plants/PlantList-updated.vue" "$FRONTEND_DIR/src/views/plants/PlantList.vue"
  echo "  ✅ PlantList.vue actualizado"
fi

echo ""

# 3. Verificar client.js
echo "🔍 Verificando client.js..."
echo ""

echo "  📊 Referencias a localStorage para plantas:"
grep -n "localStorage.*plant" "$CLIENT_JS" | head -20 || echo "    (Ninguna encontrada - Perfecto!)"

echo ""
echo "  📊 Funciones a eliminar:"
grep -n "function getRegisteredPlantIds\|function addRegisteredPlantId\|function savePlantToLocalCache\|function getPlantFromLocalCache" "$CLIENT_JS" || echo "    (Ya eliminadas)"

echo ""

# 4. Mostrar instrucciones manuales
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 CAMBIOS MANUALES REQUERIDOS EN client.js"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Por favor, abre client.js y aplica los cambios documentados en:"
echo "  📄 $FRONTEND_DIR/CAMBIOS_CLIENT_JS.md"
echo ""
echo "Resumen de cambios:"
echo "  1. ➕ Agregar imports (queries.js, stellar-expert.js)"
echo "  2. ❌ Eliminar 4 funciones de localStorage (líneas ~370-415)"
echo "  3. ✏️  Modificar registerPlant() - agregar explorerUrl"
echo "  4. ✏️  Modificar getAllPlants() - usar sessionStorage + queries"
echo "  5. ✏️  Modificar voteForPlant() - agregar explorerUrl"
echo "  6. ✏️  Modificar listForSale() - agregar explorerUrl"
echo "  7. ✏️  Modificar buyListing() - agregar explorerUrl"
echo "  8. ✏️  Reemplazar getPlantVotes() - usar queryPlantVotes"
echo "  9. ✏️  Reemplazar getListing() - usar queryListing"
echo ""

# 5. Verificación post-cambios (para después)
cat << 'VERIFICATION_SCRIPT' > "$FRONTEND_DIR/verify_migration.sh"
#!/bin/bash

CLIENT_JS="/home/ricardo_1/herbamed-blockchain/frontend/vue-project/src/soroban/client.js"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VERIFICACIÓN DE MIGRACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0

# Verificar que NO hay localStorage para plantas
if grep -q "localStorage.*plant" "$CLIENT_JS"; then
  echo "❌ ERROR: Todavía hay referencias a localStorage para plantas"
  grep -n "localStorage.*plant" "$CLIENT_JS"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ No hay localStorage para plantas"
fi

# Verificar que SÍ hay imports
if grep -q "stellar-expert" "$CLIENT_JS"; then
  echo "✅ Import de stellar-expert encontrado"
else
  echo "❌ ERROR: Falta import de stellar-expert"
  ERRORS=$((ERRORS + 1))
fi

if grep -q "queries" "$CLIENT_JS"; then
  echo "✅ Import de queries encontrado"
else
  echo "❌ ERROR: Falta import de queries"
  ERRORS=$((ERRORS + 1))
fi

# Verificar explorerUrl en funciones
if grep -q "explorerUrl.*getTransactionUrl" "$CLIENT_JS"; then
  echo "✅ explorerUrl implementado"
else
  echo "❌ ERROR: Falta implementación de explorerUrl"
  ERRORS=$((ERRORS + 1))
fi

# Verificar uso de queries
if grep -q "queryPlantVotes" "$CLIENT_JS"; then
  echo "✅ queryPlantVotes implementado"
else
  echo "❌ ERROR: Falta queryPlantVotes"
  ERRORS=$((ERRORS + 1))
fi

if grep -q "queryListing" "$CLIENT_JS"; then
  echo "✅ queryListing implementado"
else
  echo "❌ ERROR: Falta queryListing"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⚠️  MIGRACIÓN INCOMPLETA ($ERRORS errores)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
VERIFICATION_SCRIPT

chmod +x "$FRONTEND_DIR/verify_migration.sh"

echo "📋 Script de verificación creado: verify_migration.sh"
echo "   Ejecuta después de modificar client.js para validar cambios"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 BACKUP ubicado en:"
echo "   $BACKUP_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
