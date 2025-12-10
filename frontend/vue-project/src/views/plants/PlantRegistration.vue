<template>
  <div class="container mt-4">
    <h2>Registro de Plantas Medicinales</h2>
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
import { ref, watch } from 'vue'
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
    
    const addProperty = () => {
      plant.value.properties.push('')
    }
    
    const removeProperty = (index) => {
      plant.value.properties.splice(index, 1)
    }
    
    const registerPlant = async () => {
      try {
        loading.value = true
        console.log('[PlantRegistration] Registrando planta...')
        const result = await soroban.registerPlant({
          id: plant.value.id,
          name: plant.value.name,
          scientificName: plant.value.scientificName,
          properties: plant.value.properties
        })
        console.log('[PlantRegistration] Planta registrada:', result.plantId)
        
        // Esperar un poco para que el localStorage se actualice
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Disparar evento para que PlantList se recargue
        window.dispatchEvent(new Event('plant-registered'))
        
        console.log('[PlantRegistration] Navegando a /plants')
        router.push('/plants')
      } catch (error) {
        console.error('[PlantRegistration] Error al registrar planta:', error)
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
      }
    })
    
    return {
      plant,
      loading,
      addProperty,
      removeProperty,
      registerPlant
    }
  }
}
</script>          <style scoped>
          .container {
            max-width: 800px;
          }
          </style>