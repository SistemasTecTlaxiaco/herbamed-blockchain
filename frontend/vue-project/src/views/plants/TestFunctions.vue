<template>
  <div class="container mt-4">
    <h2>Prueba de Funciones Herbamed</h2>

    <!-- Registro de Planta -->
    <div class="card mb-4">
      <div class="card-header">
        <h4>Registrar Planta</h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleRegisterPlant">
          <div class="mb-3">
            <label class="form-label">ID de la Planta</label>
            <input v-model="newPlant.id" type="text" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Nombre</label>
            <input v-model="newPlant.name" type="text" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Descripción</label>
            <textarea v-model="newPlant.description" class="form-control" required></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Ubicación</label>
            <input v-model="newPlant.location" type="text" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-primary">Registrar Planta</button>
        </form>
      </div>
    </div>

    <!-- Lista de Plantas -->
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h4>Plantas Registradas</h4>
        <button @click="loadPlants" class="btn btn-secondary">Actualizar</button>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
        <div v-else-if="plants.length === 0" class="text-center">
          No hay plantas registradas
        </div>
        <div v-else class="list-group">
          <div v-for="plant in plants" :key="plant.id" class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5>{{ plant.name }}</h5>
                <p class="mb-1">{{ plant.description }}</p>
                <small>ID: {{ plant.id }} | Ubicación: {{ plant.location }}</small>
              </div>
              <div class="btn-group">
                <button @click="handleVote(plant.id)" class="btn btn-outline-success btn-sm">
                  Votar
                </button>
                <button @click="handleListForSale(plant.id)" class="btn btn-outline-primary btn-sm">
                  Listar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert" :class="'alert alert-' + alert.type" role="alert">
      {{ alert.message }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { registerPlant, getAllPlants, voteForPlant, listForSale } from '@/soroban/client'

export default {
  name: 'TestFunctions',
  setup() {
    const plants = ref([])
    const loading = ref(false)
    const alert = ref(null)
    const newPlant = ref({
      id: '',
      name: '',
      description: '',
      location: ''
    })

    // Cargar plantas
    const loadPlants = async () => {
      loading.value = true
      try {
        const result = await getAllPlants()
        plants.value = result
        showAlert('success', 'Plantas cargadas correctamente')
      } catch (error) {
        showAlert('danger', `Error al cargar plantas: ${error.message}`)
      }
      loading.value = false
    }

    // Registrar planta
    const handleRegisterPlant = async () => {
      loading.value = true
      try {
        const result = await registerPlant(newPlant.value)
        showAlert('success', `Planta registrada. Hash: ${result.transactionHash}`)
        await loadPlants()
        // Limpiar formulario
        newPlant.value = {
          id: '',
          name: '',
          description: '',
          location: ''
        }
      } catch (error) {
        showAlert('danger', `Error al registrar: ${error.message}`)
      }
      loading.value = false
    }

    // Votar por una planta
    const handleVote = async (plantId) => {
      try {
        const result = await voteForPlant(plantId)
        showAlert('success', `Voto registrado. Hash: ${result.transactionHash}`)
        await loadPlants()
      } catch (error) {
        showAlert('danger', `Error al votar: ${error.message}`)
      }
    }

    // Listar para venta
    const handleListForSale = async (plantId) => {
      try {
        const price = prompt('Ingrese el precio en XLM:')
        if (!price) return
        
        const result = await listForSale(plantId, parseFloat(price))
        showAlert('success', `Planta listada para venta. Hash: ${result.transactionHash}`)
        await loadPlants()
      } catch (error) {
        showAlert('danger', `Error al listar: ${error.message}`)
      }
    }

    // Utilidad para mostrar alertas
    const showAlert = (type, message) => {
      alert.value = { type, message }
      setTimeout(() => {
        alert.value = null
      }, 5000)
    }

    onMounted(loadPlants)

    return {
      plants,
      loading,
      alert,
      newPlant,
      loadPlants,
      handleRegisterPlant,
      handleVote,
      handleListForSale
    }
  }
}
</script>