<template>
  <div class="container mt-4">
    <h2>🛒 Marketplace de Plantas Medicinales</h2>
    
    <!-- Búsqueda de plantas/listings -->
    <div class="card mb-4">
      <div class="card-body">
        <h5>Buscar Planta en Venta</h5>
        <div class="input-group">
          <input 
            v-model="searchId" 
            type="text" 
            class="form-control" 
            placeholder="ID de planta (ej: 001, ALBACA-001)"
          />
          <button 
            class="btn btn-primary" 
            @click="searchListing"
            :disabled="searching || !searchId"
          >
            {{ searching ? '🔍 Buscando...' : '🔍 Buscar' }}
          </button>
        </div>
        <small class="text-muted">
          Ingresa el ID de una planta para ver si está en venta
        </small>
      </div>
    </div>
    
    <div v-if="loading" class="alert alert-info">
      <h5>⏳ Cargando listings desde blockchain...</h5>
    </div>
    
    <div v-else-if="listings.length === 0" class="alert alert-info">
      <h5>📭 No hay plantas en el marketplace</h5>
      <p class="mb-0">Usa el buscador arriba para encontrar plantas en venta.</p>
    </div>
    
    <div class="row mt-4">
      <div class="col-md-6 mb-4" v-for="listing in listings" :key="listing.plant_id">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">🌿 {{ listing.plantInfo?.name || listing.plant_id }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">
              {{ listing.plantInfo?.scientific_name || 'Planta medicinal' }}
            </h6>
            <div class="card-text flex-grow-1">
              <p><small class="text-muted">ID: {{ listing.plant_id }}</small></p>
              <div v-if="listing.plantInfo?.properties" class="mb-2">
                <strong>Propiedades:</strong>
                <ul>
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
                @click="buyListing(listing.plant_id)"
                :disabled="!listing.available || buying === listing.plant_id"
              >
                {{ buying === listing.plant_id ? '⏳ Comprando...' : listing.available ? '🛒 Comprar' : '❌ No disponible' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Crear nuevo listing -->
    <div class="card mt-4">
      <div class="card-body">
        <h5>📦 Vender una Planta</h5>
        <div class="row g-3">
          <div class="col-md-8">
            <input 
              v-model="newListing.plantId" 
              type="text" 
              class="form-control" 
              placeholder="ID de planta a vender"
            />
          </div>
          <div class="col-md-4">
            <input 
              v-model.number="newListing.price" 
              type="number" 
              class="form-control" 
              placeholder="Precio (XLM)"
              min="0"
              step="0.1"
            />
          </div>
        </div>
        <button 
          class="btn btn-success w-100 mt-3" 
          @click="createListing"
          :disabled="listing || !newListing.plantId || !newListing.price"
        >
          {{ listing ? '⏳ Creando listing...' : '📦 Poner en venta' }}
        </button>
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
import { onMounted, ref } from 'vue'
import soroban from '../../soroban/client'

export default {
  name: 'MarketPlace',
  setup() {
    const listings = ref([])
    const buying = ref(null)
    const listing = ref(false)
    const searching = ref(false)
    const searchId = ref('')
    const newListing = ref({ plantId: '', price: 0 })
    const status = ref(null)
    const loading = ref(false)
    
    // Cargar todos los listings desde el contrato
    const loadListings = async () => {
      try {
        loading.value = true
        console.log('[MarketPlace] Cargando listings desde el contrato...')
        
        const allListings = await soroban.getAllListings()
        console.log('[MarketPlace] Listings obtenidos:', allListings)
        
        // Enriquecer con info de plantas
        for (const listingData of allListings) {
          try {
            const plantInfo = await soroban.getPlant(listingData.plant_id)
            listingData.plantInfo = plantInfo
          } catch (error) {
            console.warn(`[MarketPlace] No se pudo obtener info de planta ${listingData.plant_id}:`, error)
          }
        }
        
        listings.value = allListings
        console.log('[MarketPlace] Total listings cargados:', listings.value.length)
      } catch (error) {
        console.error('[MarketPlace] Error al cargar listings:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al cargar listings: ${error.message}`
        }
      } finally {
        loading.value = false
      }
    }
    
    const searchListing = async () => {
      if (!searchId.value.trim()) return
      
      try {
        searching.value = true
        status.value = null
        
        console.log('[MarketPlace] Buscando listing:', searchId.value)
        const listingData = await soroban.getListing(searchId.value.trim())
        
        if (!listingData) {
          status.value = {
            type: 'warning',
            message: `⚠️ No hay listing para la planta: ${searchId.value}`
          }
          return
        }
        
        // Verificar si ya existe
        const exists = listings.value.find(l => l.plant_id === listingData.plant_id)
        if (exists) {
          status.value = {
            type: 'info',
            message: `ℹ️ El listing ${listingData.plant_id} ya está en la lista`
          }
          return
        }
        
        // Intentar obtener info de la planta
        try {
          const plantInfo = await soroban.getPlant(listingData.plant_id)
          listingData.plantInfo = plantInfo
        } catch (error) {
          console.warn('[MarketPlace] No se pudo obtener info de planta:', error)
        }
        
        // Agregar a lista
        listings.value.push(listingData)
        
        status.value = {
          type: 'success',
          message: `✅ Listing encontrado: ${listingData.plant_id} - ${listingData.price} XLM`
        }
        
        searchId.value = ''
      } catch (error) {
        console.error('[MarketPlace] Error al buscar listing:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error: ${error.message}`
        }
      } finally {
        searching.value = false
      }
    }
    
    const createListing = async () => {
      try {
        listing.value = true
        status.value = null
        
        console.log('[MarketPlace] Creando listing:', newListing.value)
        const result = await soroban.listForSale(newListing.value.plantId, newListing.value.price)
        
        status.value = {
          type: 'success',
          message: `✅ Planta ${newListing.value.plantId} puesta en venta por ${newListing.value.price} XLM`,
          explorerUrl: soroban.getStellarExplorerLink(result.transactionHash)
        }
        
        // Recargar listings desde el contrato
        await loadListings()
        
        // Reset form
        newListing.value = { plantId: '', price: 0 }
      } catch (error) {
        console.error('[MarketPlace] Error al crear listing:', error)
        status.value = {
          type: 'danger',
          message: `❌ Error al crear listing: ${error.message}`
        }
      } finally {
        listing.value = false
      }
    }
    
    const buyListing = async (plantId) => {
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
        
        // Recargar listings desde el contrato
        await loadListings()
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
      loadListings()
    })
    
    return {
      listings,
      buying,
      listing,
      searching,
      searchId,
      newListing,
      status,
      loading,
      loadListings,
      searchListing,
      createListing,
      buyListing,
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
</style>
