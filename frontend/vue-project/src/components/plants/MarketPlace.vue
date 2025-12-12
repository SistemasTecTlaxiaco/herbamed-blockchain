<template>
  <div class="container mt-4">
    <h2>🛒 Marketplace de Plantas Medicinales</h2>
    
    <!-- Búsqueda de plantas -->
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
          Busca en tus plantas registradas o en venta. Te indicará en qué menú se encuentra.
        </small>
      </div>
    </div>

    <!-- Tabs para los 3 menús -->
    <ul class="nav nav-tabs mb-4" role="tablist">
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'my-plants' }"
          @click="activeTab = 'my-plants'"
        >
          📦 Mis Plantas ({{ myPlantsWithoutPrice.length }})
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'my-listings' }"
          @click="activeTab = 'my-listings'"
        >
          💰 Mis Plantas en Venta ({{ myListings.length }})
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'other-listings' }"
          @click="activeTab = 'other-listings'"
        >
          🛍️ Plantas de Otros ({{ otherListings.length }})
        </button>
      </li>
    </ul>

    <div v-if="loading" class="alert alert-info">
      <h5>⏳ Cargando desde blockchain...</h5>
    </div>

    <!-- Tab 1: Mis plantas sin precio (para listar) -->
    <div v-if="activeTab === 'my-plants'" class="tab-pane">
      <h4>📦 Mis Plantas Registradas</h4>
      <p class="text-muted">Estas son tus plantas que aún no has puesto en venta. Asígnales un precio para listarlas.</p>
      
      <div v-if="myPlantsWithoutPrice.length === 0" class="alert alert-info">
        📭 No tienes plantas sin listar. Todas tus plantas ya están en venta o no has registrado ninguna.
      </div>

      <div class="row">
        <div class="col-md-6 mb-4" v-for="plant in myPlantsWithoutPrice" :key="plant.id">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">🌿 {{ plant.name }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted">ID: {{ plant.id }}</small></p>
                <div v-if="plant.properties && plant.properties.length > 0">
                  <p><strong>Propiedades:</strong></p>
                  <ul class="mb-2">
                    <li v-for="(prop, idx) in plant.properties.slice(0, 3)" :key="idx">{{ prop }}</li>
                  </ul>
                </div>
              </div>
              <div class="mt-auto">
                <div class="mb-2">
                  <label class="form-label"><strong>Precio (XLM):</strong></label>
                  <input 
                    v-model.number="plant.tempPrice" 
                    type="number" 
                    class="form-control" 
                    placeholder="Ej: 10"
                    min="0"
                    step="0.1"
                  />
                </div>
                <button 
                  class="btn btn-success w-100" 
                  @click="listPlantForSale(plant)"
                  :disabled="listing === plant.id || !plant.tempPrice || plant.tempPrice <= 0"
                >
                  {{ listing === plant.id ? '⏳ Listando...' : '💰 Poner en Venta' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Mis plantas en venta -->
    <div v-if="activeTab === 'my-listings'" class="tab-pane">
      <h4>💰 Mis Plantas en Venta</h4>
      <p class="text-muted">Plantas que has puesto en venta en el marketplace.</p>
      
      <div v-if="myListings.length === 0" class="alert alert-info">
        📭 No tienes plantas en venta actualmente.
      </div>

      <div class="row">
        <div class="col-md-6 mb-4" v-for="listing in myListings" :key="listing.plant_id">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">🌿 {{ listing.plantInfo?.name || listing.plant_id }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">
                {{ listing.plantInfo?.scientific_name || 'Planta medicinal' }}
              </h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted">ID: {{ listing.plant_id }}</small></p>
                <div v-if="listing.plantInfo?.properties && listing.plantInfo.properties.length > 0">
                  <p><strong>Propiedades:</strong></p>
                  <ul class="mb-2">
                    <li v-for="(prop, idx) in listing.plantInfo.properties.slice(0, 3)" :key="idx">
                      {{ prop }}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="mt-auto">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge" :class="listing.available ? 'bg-success' : 'bg-secondary'">
                    {{ listing.available ? '✅ Disponible' : '❌ Vendida' }}
                  </span>
                  <span class="fs-5 fw-bold text-primary">
                    {{ listing.price }} XLM
                  </span>
                </div>
                <button 
                  class="btn btn-outline-danger w-100" 
                  disabled
                >
                  ❌ Cancelar venta (próximamente)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Plantas de otros usuarios -->
    <div v-if="activeTab === 'other-listings'" class="tab-pane">
      <h4>🛍️ Plantas de Otros Usuarios</h4>
      <p class="text-muted">Explora y compra plantas medicinales de otros usuarios.</p>
      
      <div v-if="otherListings.length === 0" class="alert alert-info">
        📭 No hay plantas de otros usuarios en venta actualmente.
      </div>

      <div class="row">
        <div class="col-md-6 mb-4" v-for="listing in otherListings" :key="listing.plant_id">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">🌿 {{ listing.plantInfo?.name || listing.plant_id }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">
                {{ listing.plantInfo?.scientific_name || 'Planta medicinal' }}
              </h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted">ID: {{ listing.plant_id }}</small></p>
                <div v-if="listing.plantInfo?.properties && listing.plantInfo.properties.length > 0">
                  <p><strong>Propiedades:</strong></p>
                  <ul class="mb-2">
                    <li v-for="(prop, idx) in listing.plantInfo.properties.slice(0, 3)" :key="idx">
                      {{ prop }}
                    </li>
                  </ul>
                </div>
                <p><strong>Vendedor:</strong> {{ formatAddress(listing.seller) }}</p>
              </div>
              <div class="mt-auto">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge" :class="listing.available ? 'bg-success' : 'bg-secondary'">
                    {{ listing.available ? '✅ Disponible' : '❌ Vendida' }}
                  </span>
                  <span class="fs-5 fw-bold text-primary">
                    {{ listing.price }} XLM
                  </span>
                </div>
                <button 
                  class="btn btn-primary w-100" 
                  @click="buyPlant(listing.plant_id)"
                  :disabled="!listing.available || buying === listing.plant_id"
                >
                  {{ buying === listing.plant_id ? '⏳ Comprando...' : '🛒 Comprar' }}
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

// Plantas default para marketplace
const DEFAULT_LISTINGS = [
  {
    plant_id: 'D-LAVANDA-002',
    seller: 'GDEFAULTSELLERADDRESS1234567890ABCDEFGHIJKLMNOP',
    price: 15,
    available: true,
    plantInfo: {
      id: 'D-LAVANDA-002',
      name: 'Lavanda',
      scientific_name: 'Lavandula angustifolia',
      properties: ['Relajante', 'Antiséptica', 'Cicatrizante', 'Aromática'],
      validated: true,
      votes: 3
    },
    isDefault: true
  },
  {
    plant_id: 'D-JENGIBRE-006',
    seller: 'GDEFAULTSELLERADDRESS2XXXXXXXXXXXXXXXXXXXXXXXX',
    price: 20,
    available: true,
    plantInfo: {
      id: 'D-JENGIBRE-006',
      name: 'Jengibre',
      scientific_name: 'Zingiber officinale',
      properties: ['Antiinflamatoria', 'Digestiva', 'Náuseas', 'Antioxidante'],
      validated: true,
      votes: 6
    },
    isDefault: true
  },
  {
    plant_id: 'D-EUCALIPTO-007',
    seller: 'GDEFAULTSELLERADDRESS3YYYYYYYYYYYYYYYYYYYYYYYY',
    price: 12,
    available: true,
    plantInfo: {
      id: 'D-EUCALIPTO-007',
      name: 'Eucalipto',
      scientific_name: 'Eucalyptus globulus',
      properties: ['Descongestionante', 'Expectorante', 'Antiséptico', 'Refrescante'],
      validated: true,
      votes: 4
    },
    isDefault: true
  }
]

export default {
  name: 'MarketPlace',
  setup() {
    const store = useStore()
    const activeTab = ref('my-plants')
    const allPlants = ref([])
    const allListings = ref([])
    const buying = ref(null)
    const listing = ref(null)
    const searching = ref(false)
    const searchId = ref('')
    const status = ref(null)
    const loading = ref(false)

    const currentUserAddress = computed(() => store.state.publicKey || '')

    // Computed: Mis plantas sin precio (para listar)
    const myPlantsWithoutPrice = computed(() => {
      const myListedIds = myListings.value.map(l => l.plant_id)
      return allPlants.value.filter(p => !myListedIds.includes(p.id))
    })

    // Computed: Mis listings
    const myListings = computed(() => {
      if (!currentUserAddress.value) return []
      return allListings.value.filter(l => l.seller === currentUserAddress.value)
    })

    // Computed: Listings de otros
    const otherListings = computed(() => {
      if (!currentUserAddress.value) return allListings.value
      return allListings.value.filter(l => l.seller !== currentUserAddress.value)
    })

    const loadAllData = async () => {
      try {
        loading.value = true
        console.log('[MarketPlace] Cargando datos desde blockchain...')

        // Cargar todas las plantas (filtrar defaults con D-)
        const plants = await soroban.getAllPlants()
        const realPlants = plants.filter(p => !p.id || !p.id.startsWith('D-'))
        console.log('[MarketPlace] Plantas obtenidas:', plants.length, 'Reales:', realPlants.length)

        // Cargar todos los listings (filtrar defaults con D-)
        const listings = await soroban.getAllListings()
        const realListings = listings.filter(l => !l.plant_id || !l.plant_id.startsWith('D-'))
        console.log('[MarketPlace] Listings obtenidos:', listings.length, 'Reales:', realListings.length)

        // Enriquecer listings con info de plantas
        for (const listingData of realListings) {
          try {
            const plantInfo = await soroban.getPlant(listingData.plant_id)
            listingData.plantInfo = plantInfo
          } catch (error) {
            console.warn(`[MarketPlace] No se pudo obtener info de planta ${listingData.plant_id}:`, error)
          }
        }

        // Combinar: listings reales + defaults al final
        const combinedListings = [...realListings]
        for (const defaultListing of DEFAULT_LISTINGS) {
          if (!combinedListings.find(l => l.plant_id === defaultListing.plant_id)) {
            combinedListings.push(defaultListing)
          }
        }

        allPlants.value = realPlants
        allListings.value = combinedListings
        
        console.log('[MarketPlace] Carga completa. Plantas:', allPlants.value.length, 'Listings:', allListings.value.length)
      } catch (error) {
        console.error('[MarketPlace] Error al cargar datos:', error)
        // Mostrar datos default aunque falle
        allListings.value = [...DEFAULT_LISTINGS]
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
        console.log('[MarketPlace] Buscando:', id)

        // Buscar en mis plantas sin precio
        const inMyPlants = myPlantsWithoutPrice.value.find(p => p.id === id)
        if (inMyPlants) {
          activeTab.value = 'my-plants'
          status.value = {
            type: 'success',
            message: `✅ Planta "${inMyPlants.name}" encontrada en "Mis Plantas"`
          }
          searchId.value = ''
          return
        }

        // Buscar en mis listings
        const inMyListings = myListings.value.find(l => l.plant_id === id)
        if (inMyListings) {
          activeTab.value = 'my-listings'
          status.value = {
            type: 'success',
            message: `✅ Planta encontrada en "Mis Plantas en Venta"`
          }
          searchId.value = ''
          return
        }

        // Buscar en otros listings
        const inOtherListings = otherListings.value.find(l => l.plant_id === id)
        if (inOtherListings) {
          activeTab.value = 'other-listings'
          status.value = {
            type: 'success',
            message: `✅ Planta encontrada en "Plantas de Otros"`
          }
          searchId.value = ''
          return
        }

        status.value = {
          type: 'warning',
          message: `⚠️ No se encontró la planta "${id}" en ningún menú del marketplace`
        }
        searchId.value = ''
      } catch (error) {
        console.error('[MarketPlace] Error al buscar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error: ${error.message}`
        }
      } finally {
        searching.value = false
      }
    }

    const listPlantForSale = async (plant) => {
      try {
        listing.value = plant.id
        status.value = null
        
        const price = plant.tempPrice
        console.log('[MarketPlace] Listando planta:', plant.id, 'Precio:', price)
        
        const result = await soroban.listForSale(plant.id, price)
        
        status.value = {
          type: 'success',
          message: `✅ Planta "${plant.name}" puesta en venta por ${price} XLM`,
          explorerUrl: result.transactionHash ? soroban.getStellarExplorerLink(result.transactionHash) : null
        }
        
        // Recargar datos
        await loadAllData()
        
        // Cambiar a tab de mis listings
        activeTab.value = 'my-listings'
      } catch (error) {
        console.error('[MarketPlace] Error al listar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al listar planta: ${error.message}`
        }
      } finally {
        listing.value = null
      }
    }

    const buyPlant = async (plantId) => {
      try {
        buying.value = plantId
        status.value = null
        
        console.log('[MarketPlace] Comprando planta:', plantId)
        const result = await soroban.buyListing(plantId)
        
        status.value = {
          type: 'success',
          message: `✅ Planta comprada exitosamente`,
          explorerUrl: result.transactionHash ? soroban.getStellarExplorerLink(result.transactionHash) : null
        }
        
        // Recargar datos
        await loadAllData()
      } catch (error) {
        console.error('[MarketPlace] Error al comprar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al comprar: ${error.message}`
        }
      } finally {
        buying.value = null
      }
    }

    const formatAddress = (address) => {
      if (!address || address.length < 10) return address
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    onMounted(() => {
      console.log('[MarketPlace] Componente montado')
      loadAllData()
    })

    // Auto-refresh cuando se activa la vista
    onActivated(() => {
      console.log('[MarketPlace] Vista activada, refrescando...')
      loadAllData()
    })

    return {
      activeTab,
      myPlantsWithoutPrice,
      myListings,
      otherListings,
      buying,
      listing,
      searching,
      searchId,
      status,
      loading,
      searchPlant,
      listPlantForSale,
      buyPlant,
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

.nav-link {
  cursor: pointer;
}
</style>
