<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>🌿 Lista de Plantas Medicinales</h2>
      <router-link to="/plants/register" class="btn btn-primary">
        ➕ Registrar Nueva Planta
      </router-link>
    </div>
    
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando plantas desde blockchain...</p>
    </div>
    
    <div v-else-if="plants.length === 0" class="alert alert-info mt-4">
      <h5>📭 No hay plantas registradas</h5>
      <p class="mb-0">Ve a <router-link to="/plants/register">Registrar Planta</router-link> para agregar la primera.</p>
    </div>
    
    <div class="row mt-4" v-else>
      <div class="col-md-6 col-lg-4 mb-4" v-for="plant in plants" :key="plant.id">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ plant.name }}</h5>
            <h6 class="card-subtitle mb-3 text-muted">{{ plant.scientificName }}</h6>
            
            <div class="mb-3 flex-grow-1">
              <strong>🌱 Propiedades:</strong>
              <ul class="mt-2">
                <li v-for="(property, index) in plant.properties" :key="index">
                  {{ property }}
                </li>
              </ul>
              <p v-if="!plant.properties || plant.properties.length === 0" class="text-muted small">
                Sin propiedades registradas
              </p>
            </div>
            
            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge" :class="plant.validated ? 'bg-success' : 'bg-warning text-dark'">
                  {{ plant.validated ? '✅ Validada' : '⏳ Pendiente' }}
                </span>
                <span class="badge bg-info text-dark">
                  👍 {{ plant.votes || 0 }} votos
                </span>
              </div>
              
              <div class="d-grid gap-2">
                <button 
                  class="btn btn-sm btn-outline-primary" 
                  @click="votePlant(plant.id)"
                  :disabled="votingPlantId === plant.id"
                >
                  <span v-if="votingPlantId === plant.id" class="spinner-border spinner-border-sm me-1"></span>
                  {{ votingPlantId === plant.id ? 'Votando...' : '👍 Votar por esta planta' }}
                </button>
                <button 
                  class="btn btn-sm btn-outline-success" 
                  @click="goToMarketplace(plant.id)"
                >
                  🛒 Ver en Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Status message -->
    <div v-if="status" class="alert mt-4" :class="status.type === 'error' ? 'alert-danger' : 'alert-success'" role="alert">
      {{ status.message }}
    </div>
  </div>
</template>

<script>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAllPlants, voteForPlant, getPlantVotes } from '../../soroban/client'

export default {
  name: 'PlantList',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const plants = ref([])
    const loading = ref(false)
    const votingPlantId = ref(null)
    const status = ref(null)
    
    const loadPlants = async () => {
      try {
        loading.value = true
        status.value = null
        console.log('[PlantList] Cargando plantas...')
        
        const result = await getAllPlants()
        plants.value = Array.isArray(result) ? result : []
        
        // Cargar votos para cada planta
        for (const plant of plants.value) {
          try {
            plant.votes = await getPlantVotes(plant.id)
          } catch (e) {
            plant.votes = 0
          }
        }
        
        console.log('[PlantList] Plantas cargadas:', plants.value.length)
      } catch (error) {
        console.error('[PlantList] Error al cargar plantas:', error)
        plants.value = []
        status.value = { type: 'error', message: 'Error al cargar plantas: ' + error.message }
      } finally {
        loading.value = false
      }
    }
    
    const votePlant = async (plantId) => {
      try {
        votingPlantId.value = plantId
        status.value = null
        console.log('[PlantList] Votando por planta:', plantId)
        
        const result = await voteForPlant(plantId)
        status.value = { 
          type: 'success', 
          message: `✅ Voto registrado exitosamente en blockchain (TX: ${result.transactionHash.slice(0, 8)}...)`
        }
        
        // Actualizar votos
        await loadPlants()
      } catch (error) {
        console.error('[PlantList] Error al votar:', error)
        status.value = { type: 'error', message: 'Error al votar: ' + error.message }
      } finally {
        votingPlantId.value = null
      }
    }
    
    const goToMarketplace = (plantId) => {
      router.push({ path: '/marketplace', query: { plantId } })
    }
    
    // Montar y cargar datos la primera vez
    onMounted(async () => {
      await loadPlants()
    })
    
    // Watchers para refrescar datos cuando regresas a esta ruta
    watch(() => route.path, async (newPath) => {
      if (newPath === '/plants') {
        console.log('[PlantList] Ruta /plants detectada - recargando datos')
        await loadPlants()
      }
    })
    
    return {
      plants,
      loading,
      votingPlantId,
      status,
      loadPlants,
      votePlant,
      goToMarketplace
    }
  }
}
</script><style scoped>
.card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}
</style>