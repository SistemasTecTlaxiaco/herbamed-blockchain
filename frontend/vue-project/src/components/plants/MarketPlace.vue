<template>
  <div class="container mt-4">
    <h2>🛒 Marketplace de Plantas Medicinales</h2>
    
    <!-- Búsqueda global -->
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
            {{ searching ? '🔍 Buscando...' : '�� Buscar' }}
          </button>
        </div>
        <small class="text-muted">
          Busca plantas registradas o en venta. Te indicará en qué menú se encuentra.
        </small>
      </div>
    </div>
    
    <!-- Tabs para dos menús -->
    <ul class="nav nav-tabs mb-3" role="tablist">
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'available' }"
          @click="activeTab = 'available'"
          type="button"
        >
          📦 Plantas Disponibles ({{ availablePlants.length }})
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'forSale' }"
          @click="activeTab = 'forSale'"
          type="button"
        >
          🛒 En Venta ({{ listings.length }})
        </button>
      </li>
    </ul>
    
    <div v-if="loading" class="alert alert-info">
      <h5>⏳ Cargando desde blockchain...</h5>
    </div>
    
    <!-- Tab Content: Plantas Disponibles -->
    <div v-if="activeTab === 'available'">
      <div v-if="availablePlants.length === 0 && !loading" class="alert alert-info">
        <h5>📭 No hay plantas disponibles</h5>
        <p class="mb-0">Las plantas registradas sin listing aparecerán aquí.</p>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-6 mb-4" v-for="plant in availablePlants" :key="plant.id">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">🌿 {{ plant.name }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted">ID: {{ plant.id }}</small></p>
                <div v-if="plant.properties && plant.properties.length > 0">
                  <p class="mb-1"><strong>Propiedades:</strong></p>
                  <ul class="mb-2">
                    <li v-for="(prop, idx) in plant.properties.slice(0, 3)" :key="idx">
                      {{ prop }}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="mt-auto">
                <div class="badge bg-info mb-2">Sin precio asignado</div>
                <div class="input-group mb-2">
                  <input 
                    v-model.number="plant.tempPrice" 
                    type="number" 
                    class="form-control form-control-sm" 
                    placeholder="Precio (XLM)"
                    min="0"
                    step="0.1"
                  />
                </div>
                <button 
                  class="btn btn-success btn-sm w-100" 
                  @click="putForSale(plant)"
                  :disabled="listing === plant.id || !plant.tempPrice || plant.tempPrice <= 0"
                >
                  {{ listing === plant.id ? '⏳ Listando...' : '📦 Poner en venta' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tab Content: Plantas en Venta -->
    <div v-if="activeTab === 'forSale'">
      <div v-if="listings.length === 0 && !loading" class="alert alert-info">
        <h5>�� No hay plantas en venta</h5>
        <p class="mb-0">Las plantas con listing aparecerán aquí.</p>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-6 mb-4" v-for="listingItem in listings" :key="listingItem.plant_id">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">🌿 {{ listingItem.plantInfo?.name || listingItem.plant_id }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">
                {{ listingItem.plantInfo?.scientific_name || 'Planta medicinal' }}
              </h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted">ID: {{ listingItem.plant_id }}</small></p>
                <div v-if="listingItem.plantInfo?.properties">
                  <p class="mb-1"><strong>Propiedades:</strong></p>
                  <ul class="mb-2">
                    <li v-for="(prop, idx) in listingItem.plantInfo.properties.slice(0, 3)" :key="idx">
                      {{ prop }}
                    </li>
                  </ul>
                </div>
                <p><strong>Vendedor:</strong> {{ formatAddress(listingItem.seller) }}</p>
              </div>
              <div class="mt-auto">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge" :class="listingItem.available ? 'bg-success' : 'bg-secondary'">
                    {{ listingItem.available ? '✅ Disponible' : '❌ Vendida' }}
                  </span>
                  <span class="fs-5 fw-bold text-primary">
                    {{ formatPrice(listingItem.price) }} XLM
                  </span>
                </div>
                <button 
                  class="btn btn-primary w-100" 
                  @click="buyListingHandler(listingItem.plant_id)"
                  :disabled="!listingItem.available || buying === listingItem.plant_id"
                >
                  {{ buying === listingItem.plant_id ? '⏳ Comprando...' : listingItem.available ? '🛒 Comprar' : '❌ No disponible' }}
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
import { onMounted, ref, computed } from 'vue'
import soroban from '../../soroban/client'

export default {
  name: 'MarketPlace',
  setup() {
    const activeTab = ref('available')
    const allPlants = ref([])
    const listings = ref([])
    const buying = ref(null)
    const listing = ref(null)
    const searching = ref(false)
    const searchId = ref('')
    const status = ref(null)
    const loading = ref(false)
    
    // Plantas disponibles = plantas registradas que NO tienen listing
    const availablePlants = computed(() => {
      const listingIds = new Set(listings.value.map(l => l.plant_id))
      return allPlants.value.filter(p => !listingIds.has(p.id))
    })
    
    // Cargar todas las plantas y todos los listings
    const loadAllData = async () => {
      try {
        loading.value = true
        console.log('[MarketPlace] Cargando plantas y listings...')
        
        // Cargar plantas
        const plants = await soroban.getAllPlants()
        console.log('[MarketPlace] Plantas obtenidas:', plants.length)
        allPlants.value = plants
        
        // Cargar listings
        const allListings = await soroban.getAllListings()
        console.log('[MarketPlace] Listings obtenidos:', allListings.length)
        
        // Enriquecer listings con info de plantas
        for (const listingData of allListings) {
          try {
            const plantInfo = await soroban.getPlant(listingData.plant_id)
            listingData.plantInfo = plantInfo
          } catch (error) {
            console.warn(`[MarketPlace] No se pudo obtener info de planta ${listingData.plant_id}:`, error)
          }
        }
        
        listings.value = allListings
        console.log('[MarketPlace] Datos cargados:', allPlants.value.length, 'plantas,', listings.value.length, 'listings')
      } catch (error) {
        console.error('[MarketPlace] Error al cargar datos:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al cargar datos: ${error.message}`
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
        
        const plantId = searchId.value.trim()
        console.log('[MarketPlace] Buscando:', plantId)
        
        // Buscar en plantas disponibles
        let foundInAvailable = availablePlants.value.find(p => p.id === plantId)
        if (foundInAvailable) {
          status.value = {
            type: 'success',
            message: `✅ Planta "${foundInAvailable.name}" encontrada en "Plantas Disponibles"`
          }
          activeTab.value = 'available'
          searchId.value = ''
          return
        }
        
        // Buscar en listings
        let foundInListings = listings.value.find(l => l.plant_id === plantId)
        if (foundInListings) {
          status.value = {
            type: 'success',
            message: `✅ Planta "${foundInListings.plantInfo?.name || plantId}" encontrada en "En Venta"`
          }
          activeTab.value = 'forSale'
          searchId.value = ''
          return
        }
        
        // Intentar buscar en blockchain
        const plant = await soroban.getPlant(plantId)
        if (plant) {
          allPlants.value.push(plant)
          status.value = {
            type: 'success',
            message: `✅ Planta "${plant.name}" encontrada y agregada a "Plantas Disponibles"`
          }
          activeTab.value = 'available'
          searchId.value = ''
          return
        }
        
        status.value = {
          type: 'warning',
          message: `⚠️ No se encontró planta con ID: ${plantId}`
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
    
    const putForSale = async (plant) => {
      try {
        listing.value = plant.id
        status.value = null
        
        console.log('[MarketPlace] Listando planta:', plant.id, 'precio:', plant.tempPrice)
        const result = await soroban.listForSale(plant.id, plant.tempPrice)
        
        status.value = {
          type: 'success',
          message: `✅ Planta ${plant.name} puesta en venta por ${plant.tempPrice} XLM`,
          explorerUrl: soroban.getStellarExplorerLink(result.transactionHash)
        }
        
        // Recargar datos
        await loadAllData()
        activeTab.value = 'forSale'
      } catch (error) {
        console.error('[MarketPlace] Error al listar:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al listar: ${error.message}`
        }
      } finally {
        listing.value = null
      }
    }
    
    const buyListingHandler = async (plantId) => {
      try {
        buying.value = plantId
        status.value = null
        
        console.log('[MarketPlace] Comprando:', plantId)
        const result = await soroban.buyListing(plantId)
        
        status.value = {
          type: 'success',
          message: `✅ Planta ${plantId} comprada exitosamente`,
          explorerUrl: soroban.getStellarExplorerLink(result.transactionHash)
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
    
    const formatPrice = (price) => {
      // El precio está en unidades mínimas (centavos), convertir a XLM
      const priceFloat = typeof price === 'number' ? price : parseFloat(String(price))
      return (priceFloat / 100).toFixed(2)
    }
    
    onMounted(() => {
      console.log('[MarketPlace] Componente montado')
      loadAllData()
    })
    
    return {
      activeTab,
      allPlants,
      availablePlants,
      listings,
      buying,
      listing,
      searching,
      searchId,
      status,
      loading,
      loadAllData,
      searchPlant,
      putForSale,
      buyListingHandler,
      formatAddress,
      formatPrice
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
