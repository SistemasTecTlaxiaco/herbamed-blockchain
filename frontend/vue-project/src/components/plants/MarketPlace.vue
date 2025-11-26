<template>
  <div class="container mt-4">
    <div class="card">
      <div class="card-body">
        <h4 class="card-title">💰 Marketplace - Plantas en Venta</h4>
        
        <!-- Modo global (solo lectura, definido en Login) -->
        <div class="alert alert-info mb-3">
          <strong>Modo actual:</strong>
          <span v-if="storeMode==='demo'" class="badge bg-primary ms-2">Demo (localStorage)</span>
          <span v-else class="badge bg-success ms-2">Blockchain (firma real)</span>
          <p class="mb-0 mt-2 small" v-if="storeMode==='demo'">
            Estás en modo <strong>Demo</strong>: las operaciones se guardan sólo en tu navegador.
          </p>
          <p class="mb-0 mt-2 small" v-else>
            Estás en modo <strong>Blockchain</strong>: se intentará firmar con Freighter o SECRET_KEY.
          </p>
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
import { ref, onMounted, computed, watch } from 'vue'
import { listForSale, buyListing, getListing } from '@/soroban/client'

export default {
  name: 'MarketPlace',
  setup() {
    // Usar modo global desde el store
    const { useStore } = require('vuex')
    const store = useStore()
    const storeMode = computed(() => store.state.mode || 'demo')
    const listForm = ref({ plantId: '', price: '' })
    const listings = ref([])
    const loading = ref(false)
    const status = ref(null)

    async function loadListings() {
      // Load from localStorage demo data
      try {
        const stored = localStorage.getItem('herbamed:listings')
        if (stored) {
          const data = JSON.parse(stored)
          listings.value = Object.values(data)
        }
      } catch (e) {
        console.error('Error loading listings:', e)
      }
    }

    async function listPlant() {
      status.value = null
      if (!listForm.value.plantId || !listForm.value.price) {
        status.value = { type: 'error', message: 'Completa ID y precio' }
        return
      }

      loading.value = true
      try {
        if (storeMode.value === 'demo') {
          // Demo mode: just save to localStorage
          const stored = JSON.parse(localStorage.getItem('herbamed:listings') || '{}')
          stored[listForm.value.plantId] = {
            plantId: listForm.value.plantId,
            price: listForm.value.price,
            available: true,
            listedAt: Date.now()
          }
          localStorage.setItem('herbamed:listings', JSON.stringify(stored))
          status.value = { type: 'success', message: `✅ (DEMO) Planta ${listForm.value.plantId} listada` }
        } else {
          // Blockchain mode: call contract
          const result = await listForSale(listForm.value.plantId, listForm.value.price)
          status.value = { type: 'success', message: `✅ Planta listada. Tx: ${result.transactionHash}` }
        }
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
      loading.value = true
      try {
        if (storeMode.value === 'demo') {
          // Demo mode: mark as sold in localStorage
          const stored = JSON.parse(localStorage.getItem('herbamed:listings') || '{}')
          if (stored[plantId]) {
            stored[plantId].available = false
            localStorage.setItem('herbamed:listings', JSON.stringify(stored))
            status.value = { type: 'success', message: `✅ (DEMO) Compraste ${plantId} por ${price} XLM` }
          }
        } else {
          // Blockchain mode: call contract
          const result = await buyListing(plantId, price)
          status.value = { type: 'success', message: `✅ Compra exitosa. Tx: ${result.transactionHash}` }
        }
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

    // Recargar cuando cambia el modo global
    watch(storeMode, () => {
      loadListings()
    })

    return { storeMode, listForm, listings, loading, status, listPlant, buyPlant }
  }
}
</script>

<style scoped>
.card { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
</style>
