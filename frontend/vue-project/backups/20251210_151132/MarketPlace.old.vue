<template>
  <div class="container mt-4">
    <div class="card">
      <div class="card-body">
        <h4 class="card-title">💰 Marketplace - Plantas en Venta</h4>
        
        <!-- Alert informativo sobre get_all_listings() -->
        <div class="alert alert-warning mt-3" role="alert">
          <h5>⚠️ Funcionalidad Pendiente</h5>
          <p class="mb-0">
            La función <code>get_all_listings()</code> necesita ser implementada en el contrato.
            Puedes listar plantas y comprarlas, pero el listado automático de todas las plantas disponibles no está disponible todavía.
            Puedes consultar listados individuales si conoces el ID de la planta.
          </p>
        </div>
        
        <!-- Alert banner para mostrar link de Stellar Expert -->
        <div v-if="lastTransactionLink" class="alert alert-success alert-dismissible fade show mt-3" role="alert">
          <h5 class="alert-heading">✅ Transacción {{ lastTransactionLink.action }} Exitosa</h5>
          <p class="mb-1"><strong>ID de Planta:</strong> {{ lastTransactionLink.plantId }}</p>
          <p class="mb-1"><strong>Hash de Transacción:</strong> <code>{{ lastTransactionLink.transactionHash }}</code></p>
          <hr>
          <p class="mb-0">
            <a :href="lastTransactionLink.link" target="_blank" class="btn btn-sm btn-primary">
              🔍 Verificar en Stellar Expert
            </a>
          </p>
          <button type="button" class="btn-close" @click="lastTransactionLink = null" aria-label="Close"></button>
        </div>

        <!-- List plant for sale -->
        <div class="card mb-3 bg-light">
          <div class="card-body">
            <h5>Listar tu planta para venta</h5>
            <div class="row g-2">
              <div class="col-md-4">
                <input v-model="listForm.plantId" class="form-control" placeholder="ID de planta (ej: MNZ-001)" />
              </div>
              <div class="col-md-4">
                <input v-model="listForm.price" type="number" class="form-control" placeholder="Precio (XLM)" />
              </div>
              <div class="col-md-4">
                <button class="btn btn-success w-100" @click="listPlant" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  Listar para venta
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Available listings -->
        <h5>Plantas disponibles</h5>
        <div v-if="listings.length === 0" class="alert alert-warning">
          No hay plantas listadas aún. Usa el formulario arriba para listar una.
        </div>
        <div v-else class="row g-3">
          <div v-for="listing in listings" :key="listing.plantId" class="col-md-6">
            <div class="card" :class="{'border-success': listing.available, 'border-secondary': !listing.available}">
              <div class="card-body">
                <h6 class="card-title">🌿 {{ listing.plantId }}</h6>
                <p class="mb-1"><strong>Precio:</strong> {{ listing.price }} XLM</p>
                <p class="mb-1 small text-muted">Listado: {{ new Date(listing.listedAt).toLocaleString() }}</p>
                <p class="mb-2">
                  <span v-if="listing.available" class="badge bg-success">Disponible</span>
                  <span v-else class="badge bg-secondary">Vendida</span>
                </p>
                <button 
                  v-if="listing.available" 
                  class="btn btn-primary btn-sm"
                  @click="buyPlant(listing.plantId, listing.price)"
                  :disabled="loading"
                >
                  Comprar
                </button>
                <button v-else class="btn btn-secondary btn-sm" disabled>Ya vendida</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Status message -->
        <div v-if="status" class="mt-3 alert" :class="status.type === 'error' ? 'alert-danger' : 'alert-success'">
          {{ status.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { listForSale, buyListing, getListing } from '@/soroban/client'

export default {
  name: 'MarketPlace',
  setup() {
    const route = useRoute()
    const listForm = ref({ plantId: '', price: '' })
    const listings = ref([])
    const loading = ref(false)
    const status = ref(null)
    const lastTransactionLink = ref(null)

    async function loadListings() {
      try {
        console.log('[MarketPlace] Cargando listados...')
        // TODO: Cargar listados desde blockchain
        // Necesita implementar get_all_listings() en el contrato
        // Por ahora, puedes consultar listados individuales si conoces el plantId
        listings.value = []
        console.log('[MarketPlace] Listados cargados:', listings.value.length)
      } catch (e) {
        console.error('[MarketPlace] Error cargando listados:', e)
        listings.value = []
      }
    }

    async function listPlant() {
      status.value = null
      lastTransactionLink.value = null
      if (!listForm.value.plantId || !listForm.value.price) {
        status.value = { type: 'error', message: 'Completa ID y precio' }
        return
      }

      loading.value = true
      try {
        console.log('[MarketPlace] Listando planta...')
        const result = await listForSale(listForm.value.plantId, listForm.value.price)
        
        // Guardar link de Stellar Expert
        if (result.stellarExpertLink) {
          lastTransactionLink.value = {
            action: 'LISTADO',
            plantId: result.plantId,
            transactionHash: result.transactionHash,
            link: result.stellarExpertLink
          }
        }
        
        status.value = { type: 'success', message: `✅ Planta listada en blockchain` }
        listForm.value = { plantId: '', price: '' }
        await loadListings()
      } catch (e) {
        status.value = { type: 'error', message: 'Error: ' + (e.message || e) }
      } finally {
        loading.value = false
      }
    }

    async function buyPlant(plantId, price) {
      status.value = null
      lastTransactionLink.value = null
      loading.value = true
      try {
        console.log('[MarketPlace] Comprando planta:', plantId)
        const result = await buyListing(plantId, price)
        
        // Guardar link de Stellar Expert
        if (result.stellarExpertLink) {
          lastTransactionLink.value = {
            action: 'COMPRA',
            plantId: result.plantId,
            transactionHash: result.transactionHash,
            link: result.stellarExpertLink
          }
        }
        
        status.value = { type: 'success', message: `✅ Compra exitosa en blockchain` }
        await loadListings()
      } catch (e) {
        status.value = { type: 'error', message: 'Error: ' + (e.message || e) }
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadListings()
    })

    // Recargar cuando regresas a esta ruta
    watch(() => route.path, async (newPath) => {
      if (newPath === '/marketplace') {
        console.log('[MarketPlace] Ruta /marketplace detectada - recargando datos')
        await loadListings()
      }
    })

    return { listForm, listings, loading, status, lastTransactionLink, listPlant, buyPlant }
  }
}
</script>

<style scoped>
.card { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
</style>
