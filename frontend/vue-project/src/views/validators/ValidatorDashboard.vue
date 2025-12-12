<template>
  <div class="container-fluid mt-4">
    <h2>✅ Validación de Plantas Medicinales</h2>
    
    <!-- Búsqueda y actualizar -->
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
            <input 
              v-model="searchId" 
              type="text" 
              class="form-control" 
              placeholder="Buscar planta por ID"
              @keyup.enter="searchAndAdd"
            />
          </div>
          <div class="col-auto">
            <button 
              class="btn btn-primary"
              @click="searchAndAdd"
              :disabled="searching || !searchId"
            >
              {{ searching ? '🔍' : '🔍 Buscar' }}
            </button>
          </div>
        </div>
        <small class="text-muted d-block mt-2">Busca plantas para validarlas, o ve los listados abajo</small>
      </div>
    </div>

    <!-- Tabs: 2 menús -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === 'my-validations' }"
          @click="activeTab = 'my-validations'"
        >
          🏆 Mis Plantas en Venta ({{ userValidations.length }})
        </button>
      </li>
      <li class="nav-item">
        <button 
          class="nav-link"
          :class="{ active: activeTab === 'other-validations' }"
          @click="activeTab = 'other-validations'"
        >
          🌍 Para Validar ({{ otherValidations.length }})
        </button>
      </li>
    </ul>

    <!-- TAB 1: MIS PLANTAS EN VENTA (cuántas validaciones tienen) -->
    <div v-if="activeTab === 'my-validations'" class="tab-content">
      <h4>🏆 Mis Plantas en Venta - Conteo de Validaciones</h4>
      <p class="text-muted">Aquí puedes ver cuántas validaciones tiene cada una de tus plantas en venta.</p>

      <div v-if="loading && userValidations.length === 0" class="alert alert-info">
        ⏳ Cargando...
      </div>

      <div v-else-if="userValidations.length === 0" class="alert alert-info">
        <h5>📭 No tienes plantas en venta</h5>
        <p class="mb-0">Ve al Marketplace para listar tus plantas primero.</p>
      </div>

      <div class="row mt-3">
        <div class="col-md-6 mb-4" v-for="listing in userValidations" :key="listing.plant_id">
          <div class="card h-100">
            <div class="card-header bg-warning text-dark">
              <h5 class="mb-0">🌿 {{ listing.plantInfo?.name || listing.plant_id }}</h5>
            </div>
            <div class="card-body d-flex flex-column">
              <h6 class="card-subtitle mb-2 text-muted">
                {{ listing.plantInfo?.scientific_name || 'Planta medicinal' }}
              </h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted"><strong>ID:</strong> {{ listing.plant_id }}</small></p>
                <p v-if="listing.plantInfo?.properties && listing.plantInfo.properties.length > 0" class="mb-2">
                  <strong>Propiedades:</strong>
                  <ul class="mb-0">
                    <li v-for="(prop, idx) in listing.plantInfo.properties.slice(0, 3)" :key="idx">{{ prop }}</li>
                  </ul>
                </p>
              </div>
              <div class="mt-auto pt-3 border-top">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="badge bg-info">Precio: {{ listing.price }} XLM</span>
                  <span class="badge bg-secondary">
                    {{ listing.votes || 0 }} validaciones
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: PLANTAS AJENAS PARA VALIDAR -->
    <div v-if="activeTab === 'other-validations'" class="tab-content">
      <h4>🌍 Plantas de Otros Usuarios para Validar</h4>
      <p class="text-muted">Aquí están todas las plantas que otros usuarios pusieron en venta. Puedes votarlas para validarlas.</p>

      <div v-if="loading && otherValidations.length === 0" class="alert alert-info">
        ⏳ Cargando...
      </div>

      <div v-else-if="otherValidations.length === 0" class="alert alert-info">
        <h5>📭 No hay plantas de otros usuarios para validar</h5>
        <p class="mb-0">Vuelve luego o usa el buscador para buscar plantas específicas.</p>
      </div>

      <div class="row mt-3">
        <div class="col-md-6 mb-4" v-for="listing in otherValidations" :key="listing.plant_id">
          <div class="card h-100">
            <div class="card-header bg-info text-white">
              <h5 class="mb-0">🌿 {{ listing.plantInfo?.name || listing.plant_id }}</h5>
            </div>
            <div class="card-body d-flex flex-column">
              <h6 class="card-subtitle mb-2 text-muted">
                {{ listing.plantInfo?.scientific_name || 'Planta medicinal' }}
              </h6>
              <div class="card-text flex-grow-1">
                <p><small class="text-muted"><strong>ID:</strong> {{ listing.plant_id }}</small></p>
                <p><small class="text-muted"><strong>Vendedor:</strong> {{ formatAddress(listing.seller) }}</small></p>
                <p><small class="text-muted"><strong>Precio:</strong> {{ listing.price }} XLM</small></p>
                <p v-if="listing.plantInfo?.properties && listing.plantInfo.properties.length > 0" class="mb-2">
                  <strong>Propiedades:</strong>
                  <ul class="mb-0">
                    <li v-for="(prop, idx) in listing.plantInfo.properties.slice(0, 3)" :key="idx">{{ prop }}</li>
                  </ul>
                </p>
              </div>
              <div class="mt-auto pt-3 border-top">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge bg-secondary">
                    {{ listing.votes || 0 }} validaciones
                  </span>
                  <span class="badge" :class="listing.validated ? 'bg-success' : 'bg-warning'">
                    {{ listing.validated ? '✓ Validada' : '⏳ Pendiente' }}
                  </span>
                </div>
                <button 
                  class="btn btn-success w-100"
                  @click="votePlant(listing.plant_id)"
                  :disabled="voting === listing.plant_id || userHasVoted[listing.plant_id]"
                >
                  {{ voting === listing.plant_id ? '⏳ Votando...' : userHasVoted[listing.plant_id] ? '✅ Votado' : '👍 Validar' }}
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
  name: 'ValidatorDashboard',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const searching = ref(false)
    const searchId = ref('')
    const activeTab = ref('my-validations')
    const voting = ref(null)
    const status = ref(null)
    const userHasVoted = ref({})

    const userValidations = computed(() => store.state.userValidations || [])
    const otherValidations = computed(() => store.state.otherValidations || [])

    const formatAddress = (addr) => {
      if (!addr || addr.length < 10) return addr
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    const refreshAll = async () => {
      try {
        loading.value = true
        status.value = null
        await store.dispatch('refreshValidations')
        
        // Enriquecer con info de plantas
        for (const listing of store.state.allListings) {
          if (!listing.plantInfo) {
            try {
              listing.plantInfo = await soroban.getPlant(listing.plant_id)
              const votes = await soroban.getPlantVotes(listing.plant_id)
              listing.votes = votes || 0
            } catch (e) {
              console.warn('[Validator] No se pudo cargar info:', e)
            }
          }
        }
        
        status.value = { type: 'success', message: '✅ Datos actualizados' }
      } catch (e) {
        console.error('[Validator] Error refrescando:', e)
        status.value = { type: 'danger', message: `❌ Error: ${e.message}` }
      } finally {
        loading.value = false
      }
    }

    const searchAndAdd = async () => {
      if (!searchId.value.trim()) return
      try {
        searching.value = true
        status.value = null
        const plant = await soroban.getPlant(searchId.value.trim())
        if (!plant) {
          status.value = { type: 'warning', message: `⚠️ No encontré "${searchId.value}"` }
          return
        }
        status.value = { type: 'success', message: `✅ Planta ${plant.name} encontrada` }
        searchId.value = ''
        // El componente ya muestra esta planta en otherValidations si está en venta
      } catch (e) {
        console.error('[Validator] Error buscando:', e)
        status.value = { type: 'danger', message: `❌ Error: ${e.message}` }
      } finally {
        searching.value = false
      }
    }

    const votePlant = async (plantId) => {
      try {
        voting.value = plantId
        status.value = null
        const result = await soroban.voteForPlant(plantId)
        status.value = {
          type: 'success',
          message: `✅ Planta ${plantId} validada`,
          explorerUrl: soroban.getStellarExplorerLink(result.transactionHash)
        }
        userHasVoted.value[plantId] = true
        await refreshAll()
      } catch (e) {
        console.error('[Validator] Error votando:', e)
        status.value = { type: 'danger', message: `❌ Error: ${e.message}` }
      } finally {
        voting.value = null
      }
    }

    onMounted(async () => {
      console.log('[ValidatorDashboard] Montado')
      await refreshAll()
    })

    return {
      loading, searching, searchId, activeTab, voting, status, userHasVoted,
      userValidations, otherValidations,
      formatAddress, refreshAll, searchAndAdd, votePlant
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

