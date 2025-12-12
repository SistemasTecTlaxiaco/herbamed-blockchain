<template>
  <div class="container mt-4">
    <h2>🌿 Plantas Medicinales Registradas</h2>

    <!-- Búsqueda de plantas -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>Buscar Planta Registrada</h5>
        <div class="row g-2">
          <div class="col-auto">
            <button 
              class="btn btn-outline-primary"
              @click="refreshPlants"
              :disabled="loading"
            >
              🔄 {{ loading ? 'Actualizando...' : 'Actualizar' }}
            </button>
          </div>
          <div class="col-flex-grow">
            <div class="input-group">
              <input
                v-model="searchId"
                type="text"
                class="form-control"
                placeholder="ID de planta (ej: 001, ALBACA-001, E2E-PLANT-xxx)"
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
          </div>
        </div>
        <small class="text-muted d-block mt-2">Busca plantas registradas en la blockchain por su ID</small>
      </div>
    </div>

    <!-- Lista de plantas -->
    <h3 class="mt-4">Todas las Plantas ({{ displayedPlants.length }})</h3>

    <div v-if="loading && !displayedPlants.length" class="alert alert-info">
      <h5>⏳ Cargando plantas desde blockchain...</h5>
    </div>

    <div v-else-if="displayedPlants.length === 0" class="alert alert-info">
      <h5>📭 No hay plantas registradas</h5>
      <p class="mb-0">Registra una nueva planta en la sección "Registrar" o busca plantas existentes por ID.</p>
    </div>

    <div v-else class="row mt-3">
      <div class="col-md-6 mb-4" v-for="plant in displayedPlants" :key="plant.id">
        <div class="card h-100">
          <div class="card-header bg-light">
            <h5 class="mb-0">🌿 {{ plant.name }}</h5>
          </div>
          <div class="card-body d-flex flex-column">
            <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
            <div class="card-text flex-grow-1">
              <p><small class="text-muted"><strong>ID:</strong> {{ plant.id }}</small></p>
              <p v-if="plant.properties && plant.properties.length > 0" class="mb-2">
                <strong>Propiedades:</strong>
                <ul class="mb-0">
                  <li v-for="(property, index) in plant.properties" :key="index">{{ property }}</li>
                </ul>
              </p>
              <p v-if="plant.owner" class="mb-0">
                <small class="text-muted"><strong>Propietario:</strong> {{ formatAddress(plant.owner) }}</small>
              </p>
            </div>
            <div class="mt-auto mt-3 pt-3 border-top">
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
import { onMounted, ref, computed } from 'vue'
import { useStore } from 'vuex'
import soroban from '../../soroban/client'

export default {
  name: 'PlantList',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const searching = ref(false)
    const searchId = ref('')
    const status = ref(null)
    
    // Computed para filtrar plantas mostradas (búsqueda o todas)
    const displayedPlants = computed(() => {
      const allPlants = store.state.allPlants || []
      if (!searchId.value.trim()) {
        return allPlants
      }
      return allPlants.filter(p => 
        p.id.toLowerCase().includes(searchId.value.toLowerCase())
      )
    })
    
    const formatAddress = (address) => {
      if (!address || address.length < 10) return address
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const refreshPlants = async () => {
      try {
        loading.value = true
        status.value = null
        console.log('[PlantList] Refrescando plantas...')
        const plants = await store.dispatch('refreshAllPlants')
        
        // Enriquecer con votos
        for (const plant of plants) {
          try {
            const votes = await soroban.getPlantVotes(plant.id)
            plant.votes = votes || 0
          } catch (e) {
            console.warn('[PlantList] No se pudieron obtener votos para', plant.id)
            plant.votes = 0
          }
        }
        
        status.value = {
          type: 'success',
          message: `✅ ${plants.length} plantas cargadas desde blockchain`
        }
      } catch (error) {
        console.error('[PlantList] Error al refrescar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error: ${error.message}`
        }
      } finally {
        loading.value = false
      }
    }

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
        const exists = store.state.allPlants.find(p => p.id === plant.id)
        if (exists) {
          status.value = {
            type: 'info',
            message: `ℹ️ La planta ${plant.id} ya está en la lista`
          }
          searchId.value = ''
          return
        }

        // Obtener votos
        try {
          const votes = await soroban.getPlantVotes(plant.id)
          plant.votes = votes || 0
        } catch (e) {
          plant.votes = 0
        }

        // Agregar al store
        store.commit('ADD_PLANT', plant)

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

    onMounted(async () => {
      console.log('[PlantList] Componente montado - refrescando plantas')
      await refreshPlants()
    })

    return {
      loading,
      searching,
      searchId,
      status,
      displayedPlants,
      formatAddress,
      refreshPlants,
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

.flex-grow {
  flex-grow: 1;
}
</style>
