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
    import soroban from '../../soroban/client'

    export default {
      name: 'ValidatorDashboard',
      data() {
        return {
          pendingPlants: [],
          voting: false
        }
      },
      async created() {
        await this.loadPendingPlants()
      },
      methods: {
        async loadPendingPlants() {
          try {
            const all = await soroban.getAllPlants()
            this.pendingPlants = all.filter(p => !p.validated)
          } catch (error) {
            console.error('Error al cargar las plantas pendientes:', error)
          }
        },
        async votePlant(plantId) {
          try {
            this.voting = true
            const validatorAddress = 'validator-mock' // in real app get from wallet
            const votes = await soroban.voteForPlant(plantId, validatorAddress)
            const plant = this.pendingPlants.find(p => p.id === plantId)
            if (plant) {
              plant.votes = votes
              plant.hasVoted = true
            }
          } catch (error) {
            console.error('Error al votar por la planta:', error)
            alert('Error al votar: ' + error.message)
          } finally {
            this.voting = false
          }
        }
      }
    }
    </script>

    <style scoped>
    .card {
      height: 100%;
    }
    </style>