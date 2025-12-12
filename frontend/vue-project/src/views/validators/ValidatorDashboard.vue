<template>
  <div class="container mt-4">
    <h2>🌿 Validación de Plantas</h2>
    
    <!-- Búsqueda manual de plantas -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>🔍 Buscar Planta por ID</h5>
        <div class="input-group">
          <input 
            v-model="searchId" 
            type="text" 
            class="form-control" 
            placeholder="Ej: 001, TEST-001, ALBACA-001"
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
          Busca plantas para ver su estado de validación o validar plantas de otros usuarios
        </small>
      </div>
    </div>

    <!-- Tabs para los 2 menús -->
    <ul class="nav nav-tabs mb-4" role="tablist">
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'my-validations' }"
          @click="activeTab = 'my-validations'"
        >
          📊 Mis Plantas Validadas ({{ myPlantsInSale.length }})
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'validate-others' }"
          @click="activeTab = 'validate-others'"
        >
          ✅ Validar Plantas de Otros ({{ otherPlantsToValidate.length }})
        </button>
      </li>
    </ul>

    <div v-if="loading" class="alert alert-info">
      <h5>⏳ Cargando validaciones desde blockchain...</h5>
    </div>

    <!-- Tab 1: Mis plantas en venta y sus validaciones -->
    <div v-if="activeTab === 'my-validations'" class="tab-pane">
      <h4>📊 Mis Plantas en Venta</h4>
      <p class="text-muted">Plantas que has puesto en venta y cuántos usuarios las han validado.</p>
      
      <div v-if="myPlantsInSale.length === 0" class="alert alert-info">
        📭 No tienes plantas en venta actualmente.
      </div>

      <div class="row">
        <div class="col-md-6 mb-4" v-for="plant in myPlantsInSale" :key="plant.id">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">🌿 {{ plant.name }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted">ID: {{ plant.id }}</small></p>
                <div v-if="plant.properties && plant.properties.length > 0">
                  <p><strong>Propiedades:</strong></p>
                  <ul class="mb-2">
                    <li v-for="(property, index) in plant.properties.slice(0, 3)" :key="index">
                      {{ property }}
                    </li>
                  </ul>
                </div>
                <p><strong>Precio:</strong> {{ plant.listingPrice || 'N/A' }} XLM</p>
              </div>
              <div class="mt-auto">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge" :class="plant.validated ? 'bg-success' : 'bg-warning'">
                    {{ plant.validated ? '✓ Validada' : '⏳ Pendiente' }}
                  </span>
                  <span class="badge bg-info fs-6">
                    👍 {{ plant.votes || 0 }} validaciones
                  </span>
                </div>
                <button 
                  class="btn btn-sm btn-outline-secondary w-100" 
                  @click="refreshVotes(plant.id)"
                  :disabled="refreshing === plant.id"
                >
                  {{ refreshing === plant.id ? '⏳ Actualizando...' : '🔄 Actualizar votos' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Plantas ajenas para validar -->
    <div v-if="activeTab === 'validate-others'" class="tab-pane">
      <h4>✅ Validar Plantas de Otros Usuarios</h4>
      <p class="text-muted">Plantas en venta de otros usuarios que puedes validar.</p>
      
      <div v-if="otherPlantsToValidate.length === 0" class="alert alert-info">
        📭 No hay plantas de otros usuarios para validar. Usa el buscador para encontrar plantas.
      </div>

      <div class="row">
        <div class="col-md-6 mb-4" v-for="plant in otherPlantsToValidate" :key="plant.id">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">🌿 {{ plant.name }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted">ID: {{ plant.id }}</small></p>
                <div v-if="plant.properties && plant.properties.length > 0">
                  <p><strong>Propiedades:</strong></p>
                  <ul class="mb-2">
                    <li v-for="(property, index) in plant.properties.slice(0, 3)" :key="index">
                      {{ property }}
                    </li>
                  </ul>
                </div>
                <p v-if="plant.seller"><strong>Vendedor:</strong> {{ formatAddress(plant.seller) }}</p>
              </div>
              <div class="mt-auto">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge" :class="plant.validated ? 'bg-success' : 'bg-warning'">
                    {{ plant.validated ? '✓ Validada' : '⏳ Pendiente' }}
                  </span>
                  <span class="badge bg-info">
                    👍 {{ plant.votes || 0 }} votos
                  </span>
                </div>
                <button 
                  class="btn btn-success w-100 mb-2" 
                  @click="votePlant(plant.id)"
                  :disabled="plant.hasVoted || voting === plant.id || plant.validated"
                >
                  {{ voting === plant.id ? '⏳ Votando...' : plant.hasVoted ? '✅ Ya votaste' : '👍 Validar Planta' }}
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
import { onMounted, ref, computed, onActivated } from 'vue'
import soroban from '../../soroban/client'
import { useStore } from 'vuex'

// Plantas default para validación
const DEFAULT_VALIDATION_PLANTS = [
  {
    id: 'D-ROMERO-003',
    name: 'Romero',
    scientific_name: 'Rosmarinus officinalis',
    properties: ['Antioxidante', 'Estimulante', 'Digestiva', 'Antimicrobiana'],
    validated: false,
    votes: 2,
    seller: 'GDEFAULTSELLERVALIDATION1234567890ABCDEFG',
    hasVoted: false,
    isDefault: true
  },
  {
    id: 'D-CALENDULA-008',
    name: 'Caléndula',
    scientific_name: 'Calendula officinalis',
    properties: ['Cicatrizante', 'Antiinflamatoria', 'Antiséptica', 'Calmante'],
    validated: false,
    votes: 1,
    seller: 'GDEFAULTSELLERVALIDATION2XXXXXXXXXXXXX',
    hasVoted: false,
    isDefault: true
  },
  {
    id: 'D-TOMILLO-009',
    name: 'Tomillo',
    scientific_name: 'Thymus vulgaris',
    properties: ['Antiséptico', 'Expectorante', 'Digestivo', 'Antibacteriano'],
    validated: true,
    votes: 5,
    seller: 'GDEFAULTSELLERVALIDATION3YYYYYYYYYYYYYYY',
    hasVoted: false,
    isDefault: true
  }
]

export default {
  name: 'ValidatorDashboard',
  setup() {
    const store = useStore()
    const activeTab = ref('my-validations')
    const allPlants = ref([])
    const allListings = ref([])
    const voting = ref(null)
    const refreshing = ref(null)
    const searching = ref(false)
    const searchId = ref('')
    const status = ref(null)
    const loading = ref(false)

    const currentUserAddress = computed(() => store.state.publicKey || '')

    // Computed: Mis plantas en venta con validaciones - SIN defaults
    const myPlantsInSale = computed(() => {
      if (!currentUserAddress.value) return []
      const myListings = allListings.value.filter(l => 
        l.seller === currentUserAddress.value &&
        (!l.plant_id || !l.plant_id.startsWith('D-'))
      )
      return myListings.map(listing => {
        const plant = allPlants.value.find(p => p.id === listing.plant_id)
        return {
          ...(plant || { id: listing.plant_id, name: listing.plant_id }),
          listingPrice: listing.price,
          available: listing.available
        }
      })
    })

    // Computed: Plantas de otros para validar
    const otherPlantsToValidate = computed(() => {
      if (!currentUserAddress.value) {
        // Si no hay usuario conectado, mostrar todas las plantas con listings
        return allListings.value.map(listing => {
          const plant = allPlants.value.find(p => p.id === listing.plant_id)
          return {
            ...(plant || { id: listing.plant_id, name: listing.plant_id }),
            seller: listing.seller,
            listingPrice: listing.price
          }
        })
      }
      const otherListings = allListings.value.filter(l => l.seller !== currentUserAddress.value)
      return otherListings.map(listing => {
        const plant = allPlants.value.find(p => p.id === listing.plant_id)
        return {
          ...(plant || { id: listing.plant_id, name: listing.plant_id }),
          seller: listing.seller,
          listingPrice: listing.price
        }
      })
    })

    const loadAllData = async () => {
      try {
        loading.value = true
        console.log('[ValidatorDashboard] Cargando datos desde blockchain...')

        // Cargar todas las plantas (filtrar defaults con D-)
        const plants = await soroban.getAllPlants()
        const realPlants = plants.filter(p => !p.id || !p.id.startsWith('D-'))
        console.log('[ValidatorDashboard] Plantas obtenidas:', plants.length, 'Reales:', realPlants.length)

        // Cargar todos los listings (filtrar defaults con D-)
        const listings = await soroban.getAllListings()
        const realListings = listings.filter(l => !l.plant_id || !l.plant_id.startsWith('D-'))
        console.log('[ValidatorDashboard] Listings obtenidos:', listings.length, 'Reales:', realListings.length)

        // Obtener votos para cada planta real
        for (const plant of realPlants) {
          try {
            const votes = await soroban.getPlantVotes(plant.id)
            plant.votes = votes
            plant.hasVoted = false
          } catch (error) {
            console.warn(`[ValidatorDashboard] No se pudieron obtener votos para ${plant.id}:`, error)
            plant.votes = 0
            plant.hasVoted = false
          }
        }

        // Si no hay datos reales, agregar defaults
        const combinedPlants = [...realPlants]
        const combinedListings = [...realListings]

        for (const defaultPlant of DEFAULT_VALIDATION_PLANTS) {
          if (!combinedPlants.find(p => p.id === defaultPlant.id)) {
            combinedPlants.push(defaultPlant)
          }
          // Agregar listing default correspondiente
          if (!combinedListings.find(l => l.plant_id === defaultPlant.id)) {
            combinedListings.push({
              plant_id: defaultPlant.id,
              seller: defaultPlant.seller,
              price: 20,
              available: true
            })
          }
        }

        allPlants.value = combinedPlants
        allListings.value = combinedListings
        
        console.log('[ValidatorDashboard] Carga completa. Plantas:', allPlants.value.length, 'Listings:', allListings.value.length)
      } catch (error) {
        console.error('[ValidatorDashboard] Error al cargar datos:', error)
        // Mostrar datos default aunque falle
        allPlants.value = [...DEFAULT_VALIDATION_PLANTS]
        allListings.value = DEFAULT_VALIDATION_PLANTS.map(p => ({
          plant_id: p.id,
          seller: p.seller,
          price: 20,
          available: true
        }))
        status.value = {
          type: 'warning',
          message: `⚠️ No se pudieron cargar datos de blockchain. Mostrando datos default.`
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
        
        const id = searchId.value.trim()
        console.log('[ValidatorDashboard] Buscando planta:', id)
        const plant = await soroban.getPlant(id)
        
        if (!plant) {
          status.value = {
            type: 'warning',
            message: `⚠️ No se encontró planta con ID: ${id}`
          }
          return
        }
        
        // Verificar si ya existe en la lista
        const exists = allPlants.value.find(p => p.id === plant.id)
        if (exists) {
          status.value = {
            type: 'info',
            message: `ℹ️ La planta ${plant.id} ya está en la lista`
          }
          searchId.value = ''
          return
        }
        
        // Obtener votos actuales
        try {
          const votes = await soroban.getPlantVotes(plant.id)
          plant.votes = votes
        } catch (e) {
          plant.votes = 0
        }
        plant.hasVoted = false
        
        // Agregar a lista
        allPlants.value.push(plant)
        
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
          message: `✅ Voto registrado para planta ${plantId}`,
          explorerUrl: result.transactionHash ? soroban.getStellarExplorerLink(result.transactionHash) : null
        }
        
        // Actualizar votos después de votar
        await refreshVotes(plantId)
        
        // Marcar como votado
        const plant = allPlants.value.find(p => p.id === plantId)
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
        const plant = allPlants.value.find(p => p.id === plantId)
        
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

    const formatAddress = (address) => {
      if (!address || address.length < 10) return address
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    
    onMounted(() => {
      console.log('[ValidatorDashboard] Componente montado')
      loadAllData()
    })

    // Auto-refresh cuando se activa la vista
    onActivated(() => {
      console.log('[ValidatorDashboard] Vista activada, refrescando...')
      loadAllData()
    })
    
    return {
      activeTab,
      myPlantsInSale,
      otherPlantsToValidate,
      voting,
      refreshing,
      searching,
      searchId,
      status,
      loading,
      searchPlant,
      votePlant,
      refreshVotes,
      formatAddress
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

.nav-link {
  cursor: pointer;
}
</style>
