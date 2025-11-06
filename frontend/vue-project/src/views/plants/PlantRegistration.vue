&lt;template>
  &lt;div class="container mt-4">
    &lt;h2>Registro de Plantas Medicinales&lt;/h2>
    &lt;form @submit.prevent="registerPlant" class="mt-4">
      &lt;div class="mb-3">
        &lt;label for="plantId" class="form-label">ID de la Planta&lt;/label>
        &lt;input
          type="text"
          class="form-control"
          id="plantId"
          v-model="plant.id"
          required
        >
      &lt;/div>
      &lt;div class="mb-3">
        &lt;label for="plantName" class="form-label">Nombre Común&lt;/label>
        &lt;input
          type="text"
          class="form-control"
          id="plantName"
          v-model="plant.name"
          required
        >
      &lt;/div>
      &lt;div class="mb-3">
        &lt;label for="scientificName" class="form-label">Nombre Científico&lt;/label>
        &lt;input
          type="text"
          class="form-control"
          id="scientificName"
          v-model="plant.scientificName"
          required
        >
      &lt;/div>
      &lt;div class="mb-3">
        &lt;label for="properties" class="form-label">Propiedades Medicinales&lt;/label>
        &lt;div v-for="(property, index) in plant.properties" :key="index" class="d-flex mb-2">
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
                <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? 'Registrando...' : 'Registrar Planta' }}</button>
              </form>
            </div>
          </template>

          <script>
          import soroban from '../../soroban/client'

          export default {
            name: 'PlantRegistration',
            data() {
              return {
                plant: {
                  id: '',
                  name: '',
                  scientificName: '',
                  properties: ['']
                },
                loading: false
              }
            },
            methods: {
              addProperty() {
                this.plant.properties.push('')
              },
              removeProperty(index) {
                this.plant.properties.splice(index, 1)
              },
              async registerPlant() {
                try {
                  this.loading = true
                  await soroban.registerPlant({
                    id: this.plant.id,
                    name: this.plant.name,
                    scientificName: this.plant.scientificName,
                    properties: this.plant.properties
                  })
                  this.$router.push('/plants')
                } catch (error) {
                  console.error('Error al registrar la planta:', error)
                  alert('Error al registrar la planta: ' + error.message)
                } finally {
                  this.loading = false
                }
              }
            }
          }
          </script>

          <style scoped>
          .container {
            max-width: 800px;
          }
          </style>