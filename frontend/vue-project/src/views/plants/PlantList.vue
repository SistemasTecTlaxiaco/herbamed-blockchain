<template>
  <div class="container mt-4">
    <h2>🌿 Plantas Medicinales</h2>

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
        <small class="text-muted">Busca plantas registradas en la blockchain por su ID</small>
      </div>
    </div>

    <!-- Lista de plantas -->
    <h3 class="mt-4">Plantas Registradas</h3>

    <div v-if="loading" class="alert alert-info">
      <h5>⏳ Cargando plantas desde blockchain...</h5>
    </div>

    <div v-else-if="plants.length === 0" class="alert alert-info">
      <h5>📭 No hay plantas en la lista</h5>
      <p class="mb-0">Registra una nueva planta en la sección "Registrar" o busca plantas existentes por ID.</p>
    </div>

    <div v-else class="row mt-3">
      <div class="col-md-6 mb-4" v-for="plant in plants" :key="plant.id">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">🌿 {{ plant.name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
            <div class="card-text flex-grow-1">
              <p><small class="text-muted">ID: {{ plant.id }}</small></p>
              <p><strong>Propiedades:</strong></p>
              <ul class="mb-2">
                <li v-for="(property, index) in plant.properties" :key="index">{{ property }}</li>
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
import { onMounted, ref, onActivated, watch } from 'vue'
import { useStore } from 'vuex'
import soroban from '../../soroban/client'
import { DEFAULT_CHAIN_SEEDS } from '../../soroban/defaultSeeds'

// Plantas default medicinales reales para demostración
const DEFAULT_PLANTS = [
  {
    id: 'D-MANZANILLA-001',
    name: 'Manzanilla',
    scientific_name: 'Matricaria chamomilla',
    properties: ['Antiinflamatoria', 'Digestiva', 'Calmante', 'Antiespasmódica'],
    validated: true,
    votes: 5,
    isDefault: true
  },
  {
    id: 'D-LAVANDA-002',
    name: 'Lavanda',
    scientific_name: 'Lavandula angustifolia',
    properties: ['Relajante', 'Antiséptica', 'Cicatrizante', 'Aromática'],
    validated: true,
    votes: 3,
    isDefault: true
  },
  {
    id: 'D-ROMERO-003',
    name: 'Romero',
    scientific_name: 'Rosmarinus officinalis',
    properties: ['Antioxidante', 'Estimulante', 'Digestiva', 'Antimicrobiana'],
    validated: false,
    votes: 2,
    isDefault: true
  },
  {
    id: 'D-MENTA-004',
    name: 'Menta',
    scientific_name: 'Mentha piperita',
    properties: ['Digestiva', 'Refrescante', 'Analgésica', 'Descongestionante'],
    validated: true,
    votes: 4,
    isDefault: true
  },
  {
    id: 'D-ALBAHACA-005',
    name: 'Albahaca',
    scientific_name: 'Ocimum basilicum',
    properties: ['Antiinflamatoria', 'Antibacteriana', 'Digestiva', 'Antioxidante'],
    validated: false,
    votes: 1,
    isDefault: true
  }
]

export default {
  name: 'PlantList',
  setup() {
    const store = useStore()
    const plants = ref([])
    const loading = ref(false)
    const searching = ref(false)
    const searchId = ref('')
    const status = ref(null)

    const searchPlant = async () => {
      if (!searchId.value.trim()) return

      try {
        searching.value = true
        status.value = null

        const searchTerm = searchId.value.trim()
        console.log('[PlantList] Buscando:', searchTerm)

        // Primero buscar en la lista actual
        const existingIndex = plants.value.findIndex(p => p.id === searchTerm)
        if (existingIndex !== -1) {
          // Mover al inicio para resaltar
          const foundPlant = plants.value[existingIndex]
          plants.value.splice(existingIndex, 1)
          plants.value.unshift(foundPlant)
          
          status.value = {
            type: 'success',
            message: `✅ Planta "${foundPlant.name}" encontrada y posicionada al inicio`
          }
          searchId.value = ''
          return
        }

        // Si no existe en la lista, buscar en blockchain
        const plant = await soroban.getPlant(searchTerm)

        if (!plant) {
          status.value = {
            type: 'warning',
            message: `⚠️ No se encontró planta con ID: ${searchTerm}`
          }
          return
        }

        // Obtener votos
        try {
          const votes = await soroban.getPlantVotes(plant.id)
          plant.votes = votes
        } catch (e) {
          console.warn('[PlantList] No se pudieron obtener votos:', e)
          plant.votes = 0
        }

        // Agregar al inicio
        plants.value.unshift(plant)

        status.value = {
          type: 'success',
          message: `✅ Planta "${plant.name}" encontrada en blockchain y agregada al inicio`
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

    const loadPlantsFromChain = async () => {
      try {
        loading.value = true
        console.log('[PlantList] Cargando plantas desde blockchain...')

        const all = await soroban.getAllPlants()
        console.log('[PlantList] Plantas obtenidas desde blockchain:', all.length)

        const enriched = []
        for (const plant of all) {
          // No cargar plantas que empiecen con D- (son defaults)
          if (plant.id && plant.id.startsWith('D-')) {
            console.log('[PlantList] Omitiendo planta default del contrato:', plant.id)
            continue
          }
          try {
            const votes = await soroban.getPlantVotes(plant.id)
            plant.votes = votes
            enriched.push(plant)
          } catch (error) {
            console.warn('[PlantList] No se pudieron obtener votos para', plant.id, error)
            plant.votes = 0
            enriched.push(plant)
          }
        }

        // Combinar: plantas reales primero + defaults locales + semillas on-chain simuladas
        const combined = [...enriched]

        const seedPlants = DEFAULT_CHAIN_SEEDS.map(seed => ({
          id: seed.id,
          name: seed.name,
          scientific_name: seed.scientific_name,
          properties: seed.properties || [],
          validated: !!seed.validated,
          votes: seed.votes || 0,
          isDefault: true
        }))

        for (const defaultPlant of [...seedPlants, ...DEFAULT_PLANTS]) {
          if (!combined.find(p => p.id === defaultPlant.id)) {
            combined.push(defaultPlant)
          }
        }

        plants.value = combined
        console.log('[PlantList] Total plantas cargadas:', plants.value.length, '(Reales:', enriched.length, 'Defaults:', DEFAULT_PLANTS.length, ')')
      } catch (error) {
        console.error('[PlantList] Error al cargar plantas:', error)
        // Aunque falle, mostrar las defaults
        plants.value = [...DEFAULT_PLANTS]
        status.value = {
          type: 'warning',
          message: `⚠️ No se pudieron cargar plantas de la blockchain. Mostrando plantas default.`
        }
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      console.log('[PlantList] Componente montado')
      loadPlantsFromChain()
    })

    // Escuchar invalidaciones globales (registro/listado/compra/validación)
    watch(() => store.state.dataVersion, () => {
      console.log('[PlantList] dataVersion changed, reloading plants')
      loadPlantsFromChain()
    })

    // Auto-refresh cuando la vista se activa (vuelve el usuario)
    onActivated(() => {
      console.log('[PlantList] Vista activada, refrescando...')
      loadPlantsFromChain()
    })

    return {
      plants,
      loading,
      searching,
      searchId,
      status,
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
