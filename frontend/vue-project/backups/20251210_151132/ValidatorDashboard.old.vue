<template>
  <div class="container mt-4">
    <h2>Validación de Plantas</h2>
    
    <div v-if="pendingPlants.length === 0" class="alert alert-info mt-4">
      <h5>✅ No hay plantas pendientes de validación</h5>
      <p class="mb-0">Todas las plantas han sido validadas o aún no hay plantas registradas.</p>
    </div>
    
    <div class="row mt-4">
      <div class="col-md-6 mb-4" v-for="plant in pendingPlants" :key="plant.id">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">{{ plant.name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientificName }}</h6>
            <div class="card-text">
              <strong>Propiedades:</strong>
              <ul>
                <li v-for="(property, index) in plant.properties" :key="index">
                  {{ property }}
                </li>
              </ul>
            </div>
            <div class="mt-3">
              <button 
                class="btn btn-success me-2" 
                @click="votePlant(plant.id)"
                :disabled="plant.hasVoted || voting"
              >
                {{ plant.hasVoted ? 'Votado' : 'Votar para validar' }}
              </button>
              <span class="badge bg-info">
                Votos: {{ plant.votes || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import soroban from '../../soroban/client'

export default {
  name: 'ValidatorDashboard',
  setup() {
    const route = useRoute()
    const pendingPlants = ref([])
    const voting = ref(false)
    
    const loadPendingPlants = async () => {
      try {
        console.log('[ValidatorDashboard] Cargando plantas pendientes...')
        const all = await soroban.getAllPlants()
        // Asegurar que siempre sea un array
        const plants_array = Array.isArray(all) ? all : []
        pendingPlants.value = plants_array.filter(p => !p.validated)
        console.log('[ValidatorDashboard] Plantas pendientes cargadas:', pendingPlants.value.length)
      } catch (error) {
        console.error('[ValidatorDashboard] Error al cargar plantas pendientes:', error)
        pendingPlants.value = []
      }
    }
    
    const votePlant = async (plantId) => {
      try {
        voting.value = true
        console.log('[ValidatorDashboard] Votando por planta:', plantId)
        const validatorAddress = 'validator-mock'
        const votes = await soroban.voteForPlant(plantId, validatorAddress)
        const plant = pendingPlants.value.find(p => p.id === plantId)
        if (plant) {
          plant.votes = votes
          plant.hasVoted = true
        }
      } catch (error) {
        console.error('[ValidatorDashboard] Error al votar:', error)
        alert('Error al votar: ' + error.message)
      } finally {
        voting.value = false
      }
    }
    
    // Montar y cargar datos la primera vez
    onMounted(async () => {
      await loadPendingPlants()
    })
    
    // Watchers para refrescar datos cuando regresas a esta ruta
    watch(() => route.path, async (newPath) => {
      if (newPath === '/validator') {
        console.log('[ValidatorDashboard] Ruta /validator detectada - recargando datos')
        await loadPendingPlants()
      }
    })
    
    return {
      pendingPlants,
      voting,
      loadPendingPlants,
      votePlant
    }
  }
}
</script>    <style scoped>
    .card {
      height: 100%;
    }
    </style>