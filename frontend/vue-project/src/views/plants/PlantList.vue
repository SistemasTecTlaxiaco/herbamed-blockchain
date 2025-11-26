<template>
  <div class="container mt-4">
    <h2>Lista de Plantas Medicinales</h2>
    
    <div v-if="plants.length === 0" class="alert alert-info mt-4">
      <h5>📭 No hay plantas registradas</h5>
      <p class="mb-0">Ve a <router-link to="/plants/register">Registrar Planta</router-link> para agregar la primera.</p>
    </div>
    
    <div class="row mt-4">
      <div class="col-md-4 mb-4" v-for="plant in plants" :key="plant.id">
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
            <div class="mt-2">
              <span class="badge" :class="plant.validated ? 'bg-success' : 'bg-warning'">
                {{ plant.validated ? 'Validada' : 'Pendiente de validación' }}
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
    name: 'PlantList',
    data() {
      return {
        plants: []
      }
    },
    computed: {
      mode() {
        return this.$store?.state?.mode || localStorage.getItem('herbamed:mode')
      }
    },
    async created() {
      await this.loadPlants()
    },
    watch: {
      mode() {
        this.loadPlants()
      }
    },
    methods: {
      async loadPlants() {
        try {
          this.plants = await soroban.getAllPlants()
        } catch (error) {
          console.error('Error al cargar las plantas:', error)
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