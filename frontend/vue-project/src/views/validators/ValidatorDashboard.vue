<template>
  <div class="container mt-4">
    <h2>🌿 Validación de Plantas</h2>
    
    <!-- Búsqueda manual de plantas -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>Buscar Planta por ID</h5>
        <div class="input-group">
          <input 
            v-model="searchId" 
            type="text" 
            class="form-control" 
            placeholder="Ej: 001, TEST-001, ALBACA-001"
          />
          <button 
            class="btn btn-primary" 
            @click="searchPlant"
            :disabled="searching || !searchId"
          >
            {{ searching ? '🔍 Buscando...' : '🔍 Buscar' }}
          </button>
        </div>
        <small class="text-muted">
          Ingresa el ID de una planta registrada para agregarla a la lista de validación
        </small>
      </div>
    </div>
    
    <div v-if="pendingPlants.length === 0" class="alert alert-info mt-4">
      <h5>📭 No hay plantas pendientes de validación</h5>
      <p class="mb-0">Usa el buscador arriba para encontrar plantas por ID y validarlas.</p>
    </div>
    
    <div class="row mt-4">
      <div class="col-md-6 mb-4" v-for="plant in pendingPlants" :key="plant.id">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">🌿 {{ plant.name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
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
              <button 
                class="btn btn-success w-100 mb-2" 
                @click="votePlant(plant.id)"
                :disabled="plant.hasVoted || voting === plant.id || plant.validated"
              >
                {{ voting === plant.id ? '⏳ Votando...' : plant.hasVoted ? '✅ Votado' : '👍 Votar para validar' }}
              </button>
              <button 
                class="btn btn-sm btn-outline-secondary w-100" 
                @click="refreshVotes(plant.id)"
                :disabled="refreshing === plant.id"
              >
                {{ refreshing === plant.id ? '⏳' : '🔄' }} Actualizar votos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Status alerts con links a Stellar Expert -->
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
  name: 'ValidatorDashboard',
  setup() {
    const pendingPlants = ref([])
    const voting = ref(null)
    const refreshing = ref(null)
    const searching = ref(false)
    const searchId = ref('')
    const status = ref(null)
    
    const searchPlant = async () => {
      if (!searchId.value.trim()) return
      
      try {
        searching.value = true
        status.value = null
        
        console.log('[ValidatorDashboard] Buscando planta:', searchId.value)
        const plant = await soroban.getPlant(searchId.value.trim())
        
        if (!plant) {
          status.value = {
            type: 'warning',
            message: `⚠️ No se encontró planta con ID: ${searchId.value}`
          }
          return
        }
        
        // Verificar si ya existe en la lista
        const exists = pendingPlants.value.find(p => p.id === plant.id)
        if (exists) {
          status.value = {
            type: 'info',
            message: `ℹ️ La planta ${plant.id} ya está en la lista`
          }
          return
        }
        
        // Obtener votos actuales
        const votes = await soroban.getPlantVotes(plant.id)
        plant.votes = votes
        plant.hasVoted = false
        
        // Agregar a lista
        pendingPlants.value.push(plant)
        
        status.value = {
          type: 'success',
          message: `✅ Planta ${plant.name} agregada a la lista`
        }
        
        searchId.value = ''
      } catch (error) {
        console.error('[ValidatorDashboard] Error al buscar planta:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al buscar: ${error.message}`
        }
      } finally {
        searching.value = false
      }
    }
    
    const votePlant = async (plantId) => {
      try {
        voting.value = plantId
        status.value = null
        
        console.log('[ValidatorDashboard] Votando por:', plantId)
        const result = await soroban.voteForPlant(plantId)
        
        status.value = {
          type: 'success',
          message: `✅ Voto registrado para ${plantId}`,
          explorerUrl: soroban.getStellarExplorerLink(result.transactionHash)
        }
        
        // Actualizar votos después de votar
        await refreshVotes(plantId)
        
        // Marcar como votado
        const plant = pendingPlants.value.find(p => p.id === plantId)
        if (plant) {
          plant.hasVoted = true
        }
      } catch (error) {
        console.error('[ValidatorDashboard] Error al votar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al votar: ${error.message}`
        }
      } finally {
        voting.value = null
      }
    }
    
    const refreshVotes = async (plantId) => {
      try {
        refreshing.value = plantId
        console.log('[ValidatorDashboard] Actualizando votos para:', plantId)
        
        const votes = await soroban.getPlantVotes(plantId)
        const plant = pendingPlants.value.find(p => p.id === plantId)
        
        if (plant) {
          plant.votes = votes
          console.log(`[ValidatorDashboard] Votos actualizados: ${votes}`)
        }
      } catch (error) {
        console.error('[ValidatorDashboard] Error al actualizar votos:', error)
      } finally {
        refreshing.value = null
      }
    }
    
    onMounted(() => {
      console.log('[ValidatorDashboard] Componente montada')
      console.log('[ValidatorDashboard] Usa el buscador para agregar plantas por ID')
    })
    
    return {
      pendingPlants,
      voting,
      refreshing,
      searching,
      searchId,
      status,
      searchPlant,
      votePlant,
      refreshVotes
    }
  }
}
</script>

<style scoped>
.card {
  height: 100%;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>
