<template>
  <div class="container mt-4">
    <h2>Registro de Plantas Medicinales</h2>
    
    <!-- Alert de éxito con enlace a Stellar Explorer -->
    <div v-if="transactionHash && transactionHash !== 'pending'" class="alert alert-success alert-dismissible fade show" role="alert">
      <h5 class="alert-heading">✅ Planta registrada en blockchain!</h5>
      <p class="mb-2"><strong>ID:</strong> {{ registeredPlantId }}</p>
      <p class="mb-2"><strong>Nombre:</strong> {{ registeredPlantName }}</p>
      <hr>
      <p class="mb-2">
        <strong>Hash de Transacción:</strong><br>
        <code class="text-dark" style="word-break: break-all;">{{ transactionHash }}</code>
      </p>
      <p class="mb-0">
        <a :href="explorerLink" target="_blank" class="btn btn-sm btn-outline-primary">
          🔗 Ver en Stellar Expert →
        </a>
        <small class="d-block mt-2 text-muted">
          ⏱️ La transacción puede tardar unos segundos en aparecer en el explorador.
        </small>
      </p>
      <button type="button" class="btn-close" @click="clearSuccess"></button>
    </div>
    
    <!-- Alert cuando está pendiente -->
    <div v-else-if="transactionHash === 'pending'" class="alert alert-warning alert-dismissible fade show" role="alert">
      <h5 class="alert-heading">⏳ Registrando planta en blockchain...</h5>
      <p class="mb-2"><strong>ID:</strong> {{ registeredPlantId }}</p>
      <p class="mb-0"><small>La transacción está siendo procesada. Esto puede tardar 3-5 segundos.</small></p>
      <button type="button" class="btn-close" @click="clearSuccess"></button>
    </div>
    
    <!-- Alert de error -->
    <div v-else-if="registrationFailed" class="alert alert-danger alert-dismissible fade show" role="alert">
      <h5 class="alert-heading">❌ Error al registrar</h5>
      <p class="mb-0">No se pudo registrar la planta en blockchain. Intenta de nuevo.</p>
      <button type="button" class="btn-close" @click="clearSuccess"></button>
    </div>
    
    <form @submit.prevent="registerPlant" class="mt-4">
      <div class="mb-3">
        <label for="plantId" class="form-label">ID de la Planta</label>
        <input
          type="text"
          class="form-control"
          id="plantId"
          v-model="plant.id"
          required
        />
      </div>
      <div class="mb-3">
        <label for="plantName" class="form-label">Nombre Común</label>
        <input
          type="text"
          class="form-control"
          id="plantName"
          v-model="plant.name"
          required
        />
      </div>
      <div class="mb-3">
        <label for="scientificName" class="form-label">Nombre Científico</label>
        <input
          type="text"
          class="form-control"
          id="scientificName"
          v-model="plant.scientificName"
          required
        />
      </div>
      <div class="mb-3">
        <label for="properties" class="form-label">Propiedades Medicinales</label>
        <div v-for="(property, index) in plant.properties" :key="index" class="d-flex mb-2">
          <input
            type="text"
            class="form-control me-2"
            v-model="plant.properties[index]"
          />
          <button type="button" class="btn btn-danger" @click="removeProperty(index)">
            Eliminar
          </button>
        </div>
        <button type="button" class="btn btn-secondary" @click="addProperty">
          Agregar Propiedad
        </button>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Registrando...' : 'Registrar Planta' }}
      </button>
    </form>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import soroban from '../../soroban/client'

export default {
  name: 'PlantRegistration',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const plant = ref({
      id: '',
      name: '',
      scientificName: '',
      properties: ['']
    })
    const loading = ref(false)
    const transactionHash = ref('')
    const registeredPlantId = ref('')
    const registeredPlantName = ref('')
    const registrationFailed = ref(false)
    
    // Computed para generar el enlace de Stellar Explorer
    const explorerLink = computed(() => {
      return transactionHash.value 
        ? soroban.getStellarExplorerLink(transactionHash.value)
        : ''
    })
    
    const addProperty = () => {
      plant.value.properties.push('')
    }
    
    const removeProperty = (index) => {
      plant.value.properties.splice(index, 1)
    }
    
    const clearSuccess = () => {
      transactionHash.value = ''
      registeredPlantId.value = ''
      registeredPlantName.value = ''
      registrationFailed.value = false
    }
    
    const registerPlant = async () => {
      try {
        loading.value = true
        registrationFailed.value = false
        console.log('[PlantRegistration] Registrando planta en blockchain...')
        const result = await soroban.registerPlant({
          id: plant.value.id,
          name: plant.value.name,
          scientificName: plant.value.scientificName,
          properties: plant.value.properties.filter(p => p.trim())
        })
        console.log('[PlantRegistration] Planta registrada:', result.plantId, 'status:', result.status, 'hash:', result.transactionHash)

        if (!result.success) {
          throw new Error('La transacción no se confirmó. Intenta de nuevo en unos segundos.')
        }

        // Guardar datos para mostrar el alert de éxito
        transactionHash.value = result.transactionHash || 'pending'
        registeredPlantId.value = result.plantId
        registeredPlantName.value = plant.value.name
        
        // Limpiar formulario
        plant.value = {
          id: '',
          name: '',
          scientificName: '',
          properties: ['']
        }
        
        // Auto-scroll al alert de éxito
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
        
      } catch (error) {
        console.error('[PlantRegistration] Error al registrar planta:', error)
        registrationFailed.value = true
        alert('Error al registrar la planta: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    // Limpiar formulario cuando regresas a esta ruta
    watch(() => route.path, (newPath) => {
      if (newPath === '/plants/register') {
        console.log('[PlantRegistration] Ruta /plants/register detectada - limpiando formulario')
        plant.value = {
          id: '',
          name: '',
          scientificName: '',
          properties: ['']
        }
        clearSuccess()
      }
    })
    
    return {
      plant,
      loading,
      transactionHash,
      registeredPlantId,
      registeredPlantName,
      registrationFailed,
      explorerLink,
      addProperty,
      removeProperty,
      registerPlant,
      clearSuccess
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 800px;
}
</style>