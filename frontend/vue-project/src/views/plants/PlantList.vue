<template>
  <div class="container mt-4">
    <h2>🌿 Plantas Medicinales</h2>

    <!-- Búsqueda de plantas -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>Buscar Planta Registrada</h5>
        <div class="input-group">
          <input
            v-model="searchId"
            type="text"
            class="form-control"
            placeholder="ID de planta (ej: 001, ALBACA-001)"
            @keyup.enter="searchPlant"
          />
          <button
            class="btn btn-primary"
            @click="searchPlant"
            :disabled="searching || !searchId"
          >
            {{ searching ? '🔍 Buscando...' : '🔍 Buscar' }}
          </button>
        </div>
        <small class="text-muted">Busca plantas registradas en la blockchain por su ID</small>
      </div>
    </div>

    <!-- Lista de plantas -->
    <h3 class="mt-4">Plantas Registradas</h3>

    <div v-if="loading" class="alert alert-info">
      <h5>⏳ Cargando plantas desde blockchain...</h5>
    </div>

    <div v-else-if="plants.length === 0" class="alert alert-info">
      <h5>📭 No hay plantas en la lista</h5>
      <p class="mb-0">Registra una nueva planta en la sección "Registrar" o busca plantas existentes por ID.</p>
    </div>

    <div v-else class="row mt-3">
      <div class="col-md-6 mb-4" v-for="plant in plants" :key="plant.id">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">🌿 {{ plant.name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
            <div class="card-text flex-grow-1">
              <p><small class="text-muted">ID: {{ plant.id }}</small></p>
              <p><strong>Propiedades:</strong></p>
              <ul class="mb-2">
                <li v-for="(property, index) in plant.properties" :key="index">{{ property }}</li>
              </ul>
            </div>
            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center">
                <span class="badge" :class="plant.validated ? 'bg-success' : 'bg-warning'">
                  {{ plant.validated ? '✓ Validada' : '⏳ Pendiente' }}
                </span>
                <span class="badge bg-info">
                  {{ plant.votes || 0 }} votos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status con link a Stellar Expert -->
    <div v-if="status" class="alert mt-4" :class="`alert-${status.type}`">
      <div class="d-flex justify-content-between align-items-center">
        <span>{{ status.message }}</span>
        <a
          v-if="status.explorerUrl"
          :href="status.explorerUrl"
          target="_blank"
          class="btn btn-sm btn-outline-primary"
        >
          Ver en Stellar Expert →
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import soroban from '../../soroban/client'

export default {
  name: 'PlantList',
  setup() {
    const plants = ref([])
    const loading = ref(false)
    const searching = ref(false)
    const searchId = ref('')
    const status = ref(null)

    const searchPlant = async () => {
      if (!searchId.value.trim()) return

      try {
        searching.value = true
        status.value = null

        console.log('[PlantList] Buscando:', searchId.value)
        const plant = await soroban.getPlant(searchId.value.trim())

        if (!plant) {
          status.value = {
            type: 'warning',
            message: `⚠️ No se encontró planta con ID: ${searchId.value}`
          }
          return
        }

        // Verificar si ya existe
        const exists = plants.value.find(p => p.id === plant.id)
        if (exists) {
          status.value = {
            type: 'info',
            message: `ℹ️ La planta ${plant.id} ya está en la lista`
          }
          return
        }

        // Obtener votos
        const votes = await soroban.getPlantVotes(plant.id)
        plant.votes = votes

        plants.value.push(plant)

        status.value = {
          type: 'success',
          message: `✅ Planta ${plant.name} agregada a la lista`
        }

        searchId.value = ''
      } catch (error) {
        console.error('[PlantList] Error al buscar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error: ${error.message}`
        }
      } finally {
        searching.value = false
      }
    }

    const loadPlantsFromChain = async () => {
      try {
        loading.value = true
        console.log('[PlantList] Cargando plantas desde blockchain...')

        const all = await soroban.getAllPlants()
        console.log('[PlantList] Plantas obtenidas:', all)

        const enriched = []
        for (const plant of all) {
          try {
            const votes = await soroban.getPlantVotes(plant.id)
            plant.votes = votes
            enriched.push(plant)
          } catch (error) {
            console.warn('[PlantList] No se pudieron obtener votos para', plant.id, error)
            enriched.push(plant)
          }
        }

        plants.value = enriched
        console.log('[PlantList] Total plantas cargadas:', plants.value.length)
      } catch (error) {
        console.error('[PlantList] Error al cargar plantas:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al cargar plantas: ${error.message}`
        }
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      console.log('[PlantList] Componente montado')
      loadPlantsFromChain()
    })

    return {
      plants,
      loading,
      searching,
      searchId,
      status,
      searchPlant
    }
  }
}
</script>

<style scoped>
.card {
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>
