<template>
  <div class="container mt-4">
    <h2>✅ Validación de Plantas</h2>
    
    <!-- Búsqueda global -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>🔍 Buscar Planta por ID</h5>
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
        <small class="text-muted">
          Busca plantas para validar. Te indicará su estado de validación.
        </small>
      </div>
    </div>
    
    <!-- Tabs para dos menús -->
    <ul class="nav nav-tabs mb-3" role="tablist">
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'pending' }"
          @click="activeTab = 'pending'"
          type="button"
        >
          ⏳ Pendientes de Validación ({{ pendingPlants.length }})
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'validated' }"
          @click="activeTab = 'validated'"
          type="button"
        >
          ✅ Validadas ({{ validatedPlants.length }})
        </button>
      </li>
    </ul>
    
    <div v-if="loading" class="alert alert-info">
      <h5>⏳ Cargando plantas desde blockchain...</h5>
    </div>
    
    <!-- Tab Content: Pendientes de Validación -->
    <div v-if="activeTab === 'pending'">
      <div v-if="pendingPlants.length === 0 && !loading" class="alert alert-info">
        <h5>📭 No hay plantas pendientes de validación</h5>
        <p class="mb-0">Las plantas sin validar aparecerán aquí.</p>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-6 mb-4" v-for="plant in pendingPlants" :key="plant.id">
          <div class="card h-100 border-warning">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">🌿 {{ plant.name }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted">ID: {{ plant.id }}</small></p>
                <div v-if="plant.properties && plant.properties.length > 0">
                  <p class="mb-1"><strong>Propiedades:</strong></p>
                  <ul class="mb-2">
                    <li v-for="(prop, idx) in plant.properties.slice(0, 3)" :key="idx">
                      {{ prop }}
                    </li>
                  </ul>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge bg-warning">⏳ Sin validar</span>
                  <span class="badge bg-info">{{ plant.votes || 0 }} votos</span>
                </div>
              </div>
              <div class="mt-auto">
                <button 
                  class="btn btn-success w-100" 
                  @click="validatePlant(plant.id)"
                  :disabled="validating === plant.id"
                >
                  {{ validating === plant.id ? '⏳ Validando...' : '✅ Validar Planta' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tab Content: Validadas -->
    <div v-if="activeTab === 'validated'">
      <div v-if="validatedPlants.length === 0 && !loading" class="alert alert-info">
        <h5>📭 No hay plantas validadas</h5>
        <p class="mb-0">Las plantas validadas aparecerán aquí.</p>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-6 mb-4" v-for="plant in validatedPlants" :key="plant.id">
          <div class="card h-100 border-success">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">🌿 {{ plant.name }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted">ID: {{ plant.id }}</small></p>
                <div v-if="plant.properties && plant.properties.length > 0">
                  <p class="mb-1"><strong>Propiedades:</strong></p>
                  <ul class="mb-2">
                    <li v-for="(prop, idx) in plant.properties.slice(0, 3)" :key="idx">
                      {{ prop }}
                    </li>
                  </ul>
                </div>
                <p class="mb-1"><strong>Validador:</strong> {{ formatAddress(plant.validator) }}</p>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge bg-success">✅ Validada</span>
                  <span class="badge bg-info">{{ plant.votes || 0 }} votos</span>
                </div>
                
                <!-- Mostrar transacciones de validación si existen -->
                <div v-if="plant.validationTx" class="mt-2">
                  <p class="mb-1"><small><strong>Transacción de validación:</strong></small></p>
                  <div class="d-grid">
                    <a 
                      :href="plant.validationTx.explorerUrl" 
                      target="_blank" 
                      class="btn btn-sm btn-outline-primary"
                    >
                      🔗 Ver en Stellar Expert
                    </a>
                  </div>
                  <p class="mt-1 mb-0">
                    <small class="text-muted">
                      Hash: {{ plant.validationTx.hash.slice(0, 8) }}...{{ plant.validationTx.hash.slice(-8) }}
                    </small>
                  </p>
                </div>
              </div>
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
import { onMounted, ref, computed } from 'vue'
import soroban from '../../soroban/client'

export default {
  name: 'PlantValidation',
  setup() {
    const activeTab = ref('pending')
    const allPlants = ref([])
    const validating = ref(null)
    const searching = ref(false)
    const searchId = ref('')
    const status = ref(null)
    const loading = ref(false)
    const validationTransactions = ref({}) // Mapa de plantId -> { hash, explorerUrl }
    
    // Plantas pendientes = plantas sin validar
    const pendingPlants = computed(() => {
      return allPlants.value.filter(p => !p.validated)
    })
    
    // Plantas validadas
    const validatedPlants = computed(() => {
      return allPlants.value.filter(p => p.validated).map(p => ({
        ...p,
        validationTx: validationTransactions.value[p.id] || null
      }))
    })
    
    // Cargar todas las plantas
    const loadAllPlants = async () => {
      try {
        loading.value = true
        console.log('[PlantValidation] Cargando plantas...')
        
        const plants = await soroban.getAllPlants()
        console.log('[PlantValidation] Plantas obtenidas:', plants.length)
        
        // Enriquecer con votos
        for (const plant of plants) {
          try {
            const votes = await soroban.getPlantVotes(plant.id)
            plant.votes = votes
          } catch (error) {
            console.warn(`[PlantValidation] No se pudieron obtener votos para ${plant.id}:`, error)
            plant.votes = 0
          }
        }
        
        allPlants.value = plants
        console.log('[PlantValidation] Total plantas:', allPlants.value.length)
        console.log('[PlantValidation] Pendientes:', pendingPlants.value.length, 'Validadas:', validatedPlants.value.length)
      } catch (error) {
        console.error('[PlantValidation] Error al cargar plantas:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al cargar plantas: ${error.message}`
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
        
        const plantId = searchId.value.trim()
        console.log('[PlantValidation] Buscando:', plantId)
        
        // Buscar en plantas cargadas
        let found = allPlants.value.find(p => p.id === plantId)
        if (found) {
          const tab = found.validated ? 'validated' : 'pending'
          status.value = {
            type: 'success',
            message: `✅ Planta "${found.name}" encontrada en "${found.validated ? 'Validadas' : 'Pendientes'}"`
          }
          activeTab.value = tab
          searchId.value = ''
          return
        }
        
        // Intentar buscar en blockchain
        const plant = await soroban.getPlant(plantId)
        if (plant) {
          const votes = await soroban.getPlantVotes(plant.id).catch(() => 0)
          plant.votes = votes
          allPlants.value.push(plant)
          
          const tab = plant.validated ? 'validated' : 'pending'
          status.value = {
            type: 'success',
            message: `✅ Planta "${plant.name}" encontrada y agregada`
          }
          activeTab.value = tab
          searchId.value = ''
          return
        }
        
        status.value = {
          type: 'warning',
          message: `⚠️ No se encontró planta con ID: ${plantId}`
        }
        searchId.value = ''
      } catch (error) {
        console.error('[PlantValidation] Error al buscar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error: ${error.message}`
        }
      } finally {
        searching.value = false
      }
    }
    
    const validatePlant = async (plantId) => {
      try {
        validating.value = plantId
        status.value = null
        
        console.log('[PlantValidation] Validando planta:', plantId)
        const result = await soroban.voteForPlant(plantId)
        
        // Guardar hash de transacción para mostrar posteriormente
        if (result.transactionHash && result.transactionHash !== 'pending') {
          validationTransactions.value[plantId] = {
            hash: result.transactionHash,
            explorerUrl: soroban.getStellarExplorerLink(result.transactionHash)
          }
        }
        
        status.value = {
          type: 'success',
          message: `✅ Planta ${plantId} validada exitosamente`,
          explorerUrl: result.transactionHash ? soroban.getStellarExplorerLink(result.transactionHash) : null
        }
        
        // Recargar plantas
        await loadAllPlants()
        activeTab.value = 'validated'
      } catch (error) {
        console.error('[PlantValidation] Error al validar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al validar: ${error.message}`
        }
      } finally {
        validating.value = null
      }
    }
    
    const formatAddress = (address) => {
      if (!address || address.length < 10) return address
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    
    onMounted(() => {
      console.log('[PlantValidation] Componente montado')
      loadAllPlants()
    })
    
    return {
      activeTab,
      allPlants,
      pendingPlants,
      validatedPlants,
      validating,
      searching,
      searchId,
      status,
      loading,
      validationTransactions,
      loadAllPlants,
      searchPlant,
      validatePlant,
      formatAddress
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
