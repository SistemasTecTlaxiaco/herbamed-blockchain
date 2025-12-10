<template>
  <div class="container mt-4">
    <h2>Lista de Plantas Medicinales</h2>
    
    <div v-if="plants.length === 0" class="alert alert-info mt-4">
      <h5>📭 No hay plantas registradas</h5>
      <p class="mb-0">Ve a <router-link to="/plants/register">Registrar Planta</router-link> para agregar la primera.</p>
    </div>
    
    <div class="row mt-4">
      <div class="col-md-4 mb-4" v-for="plant in plants" :key="plant.id">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">🌿 {{ plant.name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientificName }}</h6>
            <div class="card-text flex-grow-1">
              <p><small class="text-muted">ID: {{ plant.id }}</small></p>
              <strong>Propiedades:</strong>
              <ul class="mb-2">
                <li v-for="(property, index) in plant.properties" :key="index">
                  {{ property }}
                </li>
              </ul>
            </div>
            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge" :class="plant.validated ? 'bg-success' : 'bg-warning'">
                  {{ plant.validated ? '✓ Validada' : '⏳ Pendiente' }}
                </span>
                <span class="badge bg-info">
                  {{ plant.votes || 0 }} votos
                </span>
              </div>
              <div class="btn-group w-100" role="group">
                <button 
                  class="btn btn-sm btn-primary" 
                  @click="voteForPlant(plant.id)"
                  :disabled="voting === plant.id"
                >
                  {{ voting === plant.id ? '⏳' : '👍' }} Votar
                </button>
                <button 
                  class="btn btn-sm btn-success" 
                  @click="navigateToMarketplace(plant.id)"
                >
                  🏪 Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="status" class="alert mt-4" :class="`alert-${status.type}`">
      {{ status.message }}
    </div>
  </div>
</template>

<script>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import soroban from '../../soroban/client'

export default {
  name: 'PlantList',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const plants = ref([])
    const voting = ref(null)
    const status = ref(null)
    
    const loadPlants = async () => {
      try {
        console.log('[PlantList] Cargando plantas...')
        const result = await soroban.getAllPlants()
        // Asegurar que siempre sea un array
        plants.value = Array.isArray(result) ? result : []
        
        // Cargar votos para cada planta
        for (const plant of plants.value) {
          try {
            const votes = await soroban.getPlantVotes(plant.id)
            plant.votes = votes || 0
          } catch (e) {
            plant.votes = 0
          }
        }
        
        console.log('[PlantList] Plantas cargadas:', plants.value.length)
      } catch (error) {
        console.error('[PlantList] Error al cargar plantas:', error)
        plants.value = []
      }
    }
    
    const voteForPlant = async (plantId) => {
      try {
        voting.value = plantId
        status.value = null
        console.log('[PlantList] Votando por:', plantId)
        
        const result = await soroban.voteForPlant(plantId)
        
        status.value = {
          type: 'success',
          message: `✅ Voto registrado para ${plantId}. Hash: ${result.transactionHash}`
        }
        
        // Recargar plantas para actualizar contador
        setTimeout(() => loadPlants(), 2000)
      } catch (error) {
        console.error('[PlantList] Error al votar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al votar: ${error.message}`
        }
      } finally {
        voting.value = null
      }
    }
    
    const navigateToMarketplace = (plantId) => {
      router.push({ path: '/marketplace', query: { plantId } })
    }
    
    // Montar y cargar datos la primera vez
    onMounted(async () => {
      console.log('[PlantList] Componente montada')
      await loadPlants()
      
      // Escuchar evento de planta registrada
      window.addEventListener('plant-registered', async () => {
        console.log('[PlantList] Evento plant-registered detectado - recargando datos')
        await loadPlants()
      })
    })
    
    // Watchers para refrescar datos cuando regresas a esta ruta
    watch(() => route.path, async (newPath) => {
      if (newPath === '/plants') {
        console.log('[PlantList] Ruta /plants detectada - recargando datos')
        // Dar tiempo a que localStorage se actualice
        setTimeout(async () => await loadPlants(), 100)
      }
    })
    
    // También espiar cambios en localStorage
    const handleStorageChange = () => {
      console.log('[PlantList] localStorage cambió - recargando datos')
      loadPlants()
    }
    
    onMounted(() => {
      window.addEventListener('storage', handleStorageChange)
    })
    
    // Cleanup
    const cleanup = () => {
      window.removeEventListener('storage', handleStorageChange)
    }
    
    return {
      plants,
      voting,
      status,
      loadPlants,
      voteForPlant,
      navigateToMarketplace,
      cleanup
    }
  }
}
</script>  <style scoped>
  .card {
    height: 100%;
  }
  </style>