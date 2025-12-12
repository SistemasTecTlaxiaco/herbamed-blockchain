<template>
  <div class="container-fluid mt-4">
    <h2>🛒 Marketplace de Plantas Medicinales</h2>
    
    <!-- Búsqueda global -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-auto">
            <button 
              class="btn btn-outline-primary"
              @click="refreshAll"
              :disabled="loading"
            >
              🔄 {{ loading ? 'Actualizando...' : 'Actualizar' }}
            </button>
          </div>
          <div class="col flex-grow-1">
            <div class="input-group">
              <input 
                v-model="searchId" 
                type="text" 
                class="form-control" 
                placeholder="Buscar planta por ID"
                @keyup.enter="performSearch"
              />
              <button 
                class="btn btn-primary" 
                @click="performSearch"
                :disabled="searching || !searchId"
              >
                {{ searching ? '🔍 Buscando...' : '🔍 Buscar' }}
              </button>
            </div>
          </div>
        </div>
        <small class="text-muted d-block mt-2">Busca en tus plantas o las en venta</small>
      </div>
    </div>

    <!-- Tabs para 3 menús -->
    <ul class="nav nav-tabs mb-4" role="tablist">
      <li class="nav-item">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'my-plants' }"
          @click="activeTab = 'my-plants'"
        >
          📦 Mis Plantas ({{ userPlantsNotListed.length }})
        </button>
      </li>
      <li class="nav-item">
        <button 
          class="nav-link"
          :class="{ active: activeTab === 'my-sales' }"
          @click="activeTab = 'my-sales'"
        >
          🏷️ En Venta ({{ userListings.length }})
        </button>
      </li>
      <li class="nav-item">
        <button 
          class="nav-link"
          :class="{ active: activeTab === 'other-sales' }"
          @click="activeTab = 'other-sales'"
        >
          🌍 Plantas de Otros ({{ otherUserListings.length }})
        </button>
      </li>
    </ul>

    <!-- TAB 1: MIS PLANTAS SIN PRECIO -->
    <div v-if="activeTab === 'my-plants'" class="tab-content">
      <h4>📦 Mis Plantas Registradas sin Precio</h4>
      <p class="text-muted">Plantas que registraste sin listar. Asigna precio y ponlas en venta.</p>

      <div v-if="loading && userPlantsNotListed.length === 0" class="alert alert-info">
        ⏳ Cargando...
      </div>

      <div v-else-if="userPlantsNotListed.length === 0" class="alert alert-info">
        <h5>📭 No tienes plantas sin listar</h5>
        <p class="mb-0">Todas tus plantas están en venta o aún no has registrado ninguna.</p>
      </div>

      <div class="row mt-3">
        <div class="col-md-6 mb-4" v-for="plant in userPlantsNotListed" :key="plant.id">
          <div class="card h-100">
            <div class="card-header bg-light">
              <h5 class="mb-0">🌿 {{ plant.name }}</h5>
            </div>
            <div class="card-body d-flex flex-column">
              <h6 class="card-subtitle mb-2 text-muted">{{ plant.scientific_name }}</h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted"><strong>ID:</strong> {{ plant.id }}</small></p>
                <p v-if="plant.properties && plant.properties.length > 0" class="mb-2">
                  <strong>Propiedades:</strong>
                  <ul class="mb-0">
                    <li v-for="(prop, idx) in plant.properties.slice(0, 3)" :key="idx">{{ prop }}</li>
                  </ul>
                </p>
              </div>
              <div class="mt-auto pt-3 border-top">
                <div class="input-group">
                  <input 
                    v-model.number="priceForm[plant.id]"
                    type="number" 
                    class="form-control" 
                    placeholder="Precio XLM"
                    min="0.01"
                    step="0.01"
                  />
                  <button 
                    class="btn btn-success"
                    @click="listPlantForSale(plant.id)"
                    :disabled="!priceForm[plant.id] || listing === plant.id"
                  >
                    {{ listing === plant.id ? '⏳' : '📤' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: MIS PLANTAS EN VENTA -->
    <div v-if="activeTab === 'my-sales'" class="tab-content">
      <h4>🏷️ Mis Plantas en Venta</h4>
      <p class="text-muted">Tus plantas disponibles para compra. Los otros usuarios pueden comprarlas aquí.</p>

      <div v-if="loading && userListings.length === 0" class="alert alert-info">
        ⏳ Cargando...
      </div>

      <div v-else-if="userListings.length === 0" class="alert alert-info">
        <h5>📭 No tienes plantas en venta</h5>
        <p class="mb-0">Usa el menú "Mis Plantas" para listar alguna.</p>
      </div>

      <div class="row mt-3">
        <div class="col-md-6 mb-4" v-for="l in userListings" :key="l.plant_id">
          <div class="card h-100">
            <div class="card-header bg-success text-white">
              <h5 class="mb-0">🌿 {{ l.plantInfo?.name || l.plant_id }}</h5>
            </div>
            <div class="card-body d-flex flex-column">
              <h6 class="card-subtitle mb-2 text-muted">
                {{ l.plantInfo?.scientific_name || 'Planta medicinal' }}
              </h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted"><strong>ID:</strong> {{ l.plant_id }}</small></p>
                <p v-if="l.plantInfo?.properties && l.plantInfo.properties.length > 0" class="mb-2">
                  <strong>Propiedades:</strong>
                  <ul class="mb-0">
                    <li v-for="(prop, idx) in l.plantInfo.properties.slice(0, 3)" :key="idx">{{ prop }}</li>
                  </ul>
                </p>
              </div>
              <div class="mt-auto pt-3 border-top">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="badge" :class="l.available ? 'bg-info' : 'bg-secondary'">
                    {{ l.available ? '✅ Disponible' : '❌ Vendida' }}
                  </span>
                  <span class="fs-5 fw-bold text-success">
                    {{ l.price }} XLM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: PLANTAS DE OTROS USUARIOS -->
    <div v-if="activeTab === 'other-sales'" class="tab-content">
      <h4>🌍 Plantas de Otros Usuarios en Venta</h4>
      <p class="text-muted">Plantas que otros usuarios ofrecen. Puedes comprar cualquiera disponible.</p>

      <div v-if="loading && otherUserListings.length === 0" class="alert alert-info">
        ⏳ Cargando...
      </div>

      <div v-else-if="otherUserListings.length === 0" class="alert alert-info">
        <h5>📭 No hay plantas de otros usuarios</h5>
        <p class="mb-0">Vuelve luego o anima a otros usuarios a listar.</p>
      </div>

      <div class="row mt-3">
        <div class="col-md-6 mb-4" v-for="l in otherUserListings" :key="l.plant_id">
          <div class="card h-100">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">🌿 {{ l.plantInfo?.name || l.plant_id }}</h5>
            </div>
            <div class="card-body d-flex flex-column">
              <h6 class="card-subtitle mb-2 text-muted">
                {{ l.plantInfo?.scientific_name || 'Planta medicinal' }}
              </h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted"><strong>ID:</strong> {{ l.plant_id }}</small></p>
                <p><small class="text-muted"><strong>Vendedor:</strong> {{ formatAddress(l.seller) }}</small></p>
                <p v-if="l.plantInfo?.properties && l.plantInfo.properties.length > 0" class="mb-2">
                  <strong>Propiedades:</strong>
                  <ul class="mb-0">
                    <li v-for="(prop, idx) in l.plantInfo.properties.slice(0, 3)" :key="idx">{{ prop }}</li>
                  </ul>
                </p>
              </div>
              <div class="mt-auto pt-3 border-top">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge bg-success">
                    {{ l.available ? '✅ Disponible' : '❌ Vendida' }}
                  </span>
                  <span class="fs-5 fw-bold text-primary">
                    {{ l.price }} XLM
                  </span>
                </div>
                <button 
                  class="btn btn-primary w-100"
                  @click="buyListing(l.plant_id)"
                  :disabled="!l.available || buying === l.plant_id"
                >
                  {{ buying === l.plant_id ? '⏳ Comprando...' : l.available ? '🛒 Comprar' : '❌ No disponible' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status alerts -->
    <div v-if="status" class="alert mt-4" :class="`alert-${status.type}`">
      <div class="d-flex justify-content-between align-items-center">
        <span>{{ status.message }}</span>
        <a 
          v-if="status.explorerUrl" 
          :href="status.explorerUrl" 
          target="_blank" 
          class="btn btn-sm btn-outline-primary"
        >
          🔗 Stellar Expert →
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, computed } from 'vue'
import { useStore } from 'vuex'
import soroban from '../../soroban/client'

export default {
  name: 'MarketPlace',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const searching = ref(false)
    const searchId = ref('')
    const activeTab = ref('my-plants')
    const listing = ref(false)
    const buying = ref(null)
    const status = ref(null)
    const priceForm = ref({})

    const userPlantsNotListed = computed(() => store.getters.userPlantsNotListed || [])
    const userListings = computed(() => store.state.userListings || [])
    const otherUserListings = computed(() => store.getters.otherUserListings || [])

    const formatAddress = (addr) => {
      if (!addr || addr.length < 10) return addr
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    const refreshAll = async () => {
      try {
        loading.value = true
        status.value = null
        await store.dispatch('refreshAll')
        for (const l of store.state.allListings) {
          if (!l.plantInfo) {
            try {
              l.plantInfo = await soroban.getPlant(l.plant_id)
            } catch (e) {
              console.warn('[MP] No se pudo cargar info de planta:', e)
            }
          }
        }
        status.value = { type: 'success', message: '✅ Datos actualizados' }
      } catch (e) {
        console.error('[MP] Error refrescando:', e)
        status.value = { type: 'danger', message: `❌ Error: ${e.message}` }
      } finally {
        loading.value = false
      }
    }

    const performSearch = async () => {
      if (!searchId.value.trim()) return
      try {
        searching.value = true
        status.value = null
        const q = searchId.value.trim().toLowerCase()
        const myPlants = userPlantsNotListed.value.filter(p => p.id.toLowerCase().includes(q))
        const myListings = userListings.value.filter(l => l.plant_id.toLowerCase().includes(q))
        if (myPlants.length === 0 && myListings.length === 0) {
          status.value = { type: 'warning', message: `⚠️ No encontré "${searchId.value}"` }
        } else {
          const msg = []
          if (myPlants.length > 0) msg.push(`${myPlants.length} en "Mis Plantas"`)
          if (myListings.length > 0) msg.push(`${myListings.length} en "En Venta"`)
          status.value = { type: 'success', message: `✅ Encontrado: ${msg.join(' + ')}` }
          if (myListings.length > 0) activeTab.value = 'my-sales'
          else if (myPlants.length > 0) activeTab.value = 'my-plants'
        }
        searchId.value = ''
      } catch (e) {
        console.error('[MP] Error buscando:', e)
        status.value = { type: 'danger', message: `❌ Error: ${e.message}` }
      } finally {
        searching.value = false
      }
    }

    const listPlantForSale = async (plantId) => {
      const price = priceForm.value[plantId]
      if (!price || price <= 0) {
        status.value = { type: 'warning', message: '⚠️ Precio inválido' }
        return
      }
      try {
        listing.value = plantId
        status.value = null
        const result = await soroban.listForSale(plantId, price)
        status.value = {
          type: 'success',
          message: `✅ ${plantId} listada por ${price} XLM`,
          explorerUrl: soroban.getStellarExplorerLink(result.transactionHash)
        }
        delete priceForm.value[plantId]
        activeTab.value = 'my-sales'
        await store.dispatch('refreshUserListings')
      } catch (e) {
        console.error('[MP] Error listando:', e)
        status.value = { type: 'danger', message: `❌ Error: ${e.message}` }
      } finally {
        listing.value = false
      }
    }

    const buyListing = async (plantId) => {
      try {
        buying.value = plantId
        status.value = null
        const result = await soroban.buyListing(plantId)
        status.value = {
          type: 'success',
          message: `✅ ${plantId} comprada`,
          explorerUrl: soroban.getStellarExplorerLink(result.transactionHash)
        }
        await refreshAll()
      } catch (e) {
        console.error('[MP] Error comprando:', e)
        status.value = { type: 'danger', message: `❌ Error: ${e.message}` }
      } finally {
        buying.value = null
      }
    }

    onMounted(async () => {
      console.log('[MarketPlace] Montado - refrescando')
      await refreshAll()
    })

    return {
      loading, searching, searchId, activeTab, listing, buying, status, priceForm,
      userPlantsNotListed, userListings, otherUserListings,
      formatAddress, refreshAll, performSearch, listPlantForSale, buyListing
    }
  }
}
</script>

<style scoped>
.tab-content { animation: fadeIn 0.3s ease-in; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.card { transition: transform 0.2s; }
.card:hover { transform: translateY(-5px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.flex-grow-1 { flex-grow: 1; }
</style>
