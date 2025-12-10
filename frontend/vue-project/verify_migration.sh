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
