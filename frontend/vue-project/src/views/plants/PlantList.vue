<template>
  <div class="container mt-4">
    <h2>🌿 Registro de Plantas Medicinales</h2>
    
    <!-- Formulario de registro -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>Registrar Nueva Planta</h5>
        <div class="mb-3">
          <label class="form-label">ID de la Planta</label>
          <input 
            v-model="newPlant.id" 
            type="text" 
            class="form-control" 
            placeholder="Ej: 001, ALBACA-001"
          />
        </div>
        <div class="mb-3">
          <label class="form-label">Nombre Común</label>
          <input 
            v-model="newPlant.name" 
            type="text" 
            class="form-control" 
            placeholder="Ej: Albahaca"
          />
        </div>
        <div class="mb-3">
          <label class="form-label">Nombre Científico</label>
          <input 
            v-model="newPlant.scientificName" 
            type="text" 
            class="form-control" 
            placeholder="Ej: Ocimum basilicum"
          />
        </div>
        <div class="mb-3">
          <label class="form-label">Propiedades (una por línea)</label>
          <textarea 
            v-model="propertiesText" 
            class="form-control" 
            rows="3"
            placeholder="Antiinflamatoria&#10;Digestiva&#10;Antioxidante"
          ></textarea>
        </div>
        <button 
          class="btn btn-primary w-100" 
          @click="registerPlant"
          :disabled="registering || !isFormValid"
        >
          {{ registering ? '⏳ Registrando...' : '✨ Registrar Planta' }}
        </button>
      </div>
    </div>
    
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
        <small class="text-muted">
          Busca plantas registradas en la blockchain por su ID
        </small>
      </div>
    </div>
    
    <!-- Lista de plantas -->
    <h3 class="mt-4">Plantas Encontradas</h3>
    
    <div v-if="plants.length === 0" class="alert alert-info">
      <h5>📭 No hay plantas en la lista</h5>
      <p class="mb-0">
        Registra una nueva planta o busca plantas existentes por ID.
      </p>
    </div>
    
    <div class="row mt-3">
      <div class="col-md-6 mb-4" v-for="plant in plants" :key="plant.id">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">🌿 {{ plant.name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
            <div class="card-text flex-grow-1">
              <p><small class="text-muted">ID: {{ plant.id }}</small></p>
              <p><strong>Propiedades:</strong></p>
              <ul class="mb-2">
                <li v-for="(property, index) in plant.properties" :key="index">
                  {{ property }}
                </li>
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
import { onMounted, ref, computed } from 'vue'
import soroban from '../../soroban/client'
import { queryPlant, queryPlantVotes } from '../../soroban/queries'

export default {
  name: 'PlantList',
  setup() {
    const plants = ref([])
    const registering = ref(false)
    const searching = ref(false)
    const searchId = ref('')
    const newPlant = ref({
      id: '',
      name: '',
      scientificName: '',
      properties: []
    })
    const propertiesText = ref('')
    const status = ref(null)
    
    const isFormValid = computed(() => {
      return newPlant.value.id && 
             newPlant.value.name && 
             newPlant.value.scientificName && 
             propertiesText.value.trim()
    })
    
    const registerPlant = async () => {
      try {
        registering.value = true
        status.value = null
        
        // Parsear propiedades
        const properties = propertiesText.value
          .split('\n')
          .map(p => p.trim())
          .filter(p => p.length > 0)
        
        if (properties.length === 0) {
          status.value = {
            type: 'warning',
            message: '⚠️ Debes agregar al menos una propiedad'
          }
          return
        }
        
        const plantData = {
          id: newPlant.value.id,
          name: newPlant.value.name,
          scientificName: newPlant.value.scientificName,
          properties
        }
        
        console.log('[PlantList] Registrando planta:', plantData)
        const result = await soroban.registerPlant(plantData)
        
        console.log('[PlantList] Resultado:', result)
        
        status.value = {
          type: 'success',
          message: `✅ Planta ${newPlant.value.name} registrada con ID: ${result.plantId}`,
          explorerUrl: result.explorerUrl
        }
        
        // Agregar a lista local
        const registeredPlant = {
          id: plantData.id,
          name: plantData.name,
          scientific_name: plantData.scientificName,
          properties: plantData.properties,
          validated: false,
          votes: 0
        }
        
        plants.value.push(registeredPlant)
        
        // Reset form
        newPlant.value = {
          id: '',
          name: '',
          scientificName: '',
          properties: []
        }
        propertiesText.value = ''
      } catch (error) {
        console.error('[PlantList] Error al registrar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error: ${error.message}`
        }
      } finally {
        registering.value = false
      }
    }
    
    const searchPlant = async () => {
      if (!searchId.value.trim()) return
      
      try {
        searching.value = true
        status.value = null
        
        console.log('[PlantList] Buscando planta:', searchId.value)
        const plant = await queryPlant(searchId.value.trim())
        
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
        const votes = await queryPlantVotes(plant.id)
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
    
    const loadSessionPlants = async () => {
      // Cargar plantas de sesión actual
      const sessionPlants = JSON.parse(sessionStorage.getItem('currentSessionPlants') || '[]')
      
      if (sessionPlants.length === 0) {
        console.log('[PlantList] No hay plantas en sesión actual')
        return
      }
      
      console.log('[PlantList] Cargando plantas de sesión:', sessionPlants)
      
      for (const id of sessionPlants) {
        try {
          const plant = await queryPlant(id)
          if (plant) {
            const votes = await queryPlantVotes(id)
            plant.votes = votes
            plants.value.push(plant)
          }
        } catch (error) {
          console.warn(`[PlantList] Error al cargar planta ${id}:`, error)
        }
      }
    }
    
    onMounted(() => {
      console.log('[PlantList] Componente montado')
      loadSessionPlants()
    })
    
    return {
      plants,
      registering,
      searching,
      searchId,
      newPlant,
      propertiesText,
      status,
      isFormValid,
      registerPlant,
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
