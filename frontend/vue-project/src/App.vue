<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">HerbaMed</a>
        
        <!-- Indicador de modo actual (solo visual) -->
        <div v-if="currentMode" class="d-flex align-items-center me-3">
          <span v-if="currentMode === 'demo'" class="badge bg-primary fs-6">
            📦 Modo: Demo
          </span>
          <span v-else class="badge bg-success fs-6">
            ⛓️ Modo: Blockchain
          </span>
        </div>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/plants">🌱 Plantas</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/plants/register">➕ Registrar</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/marketplace">🛒 Marketplace</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/validator">✓ Validadores</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/login">🔑 Wallet</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <!-- Barra de estado de navegación -->
    <div class="bg-light text-muted small px-3 py-2 shadow-sm">
      <span v-if="currentMode==='demo'">📦 Demo</span>
      <span v-else-if="currentMode==='blockchain'">⛓️ Blockchain</span>
      <span v-else>⚙️ Modo no seleccionado</span>
      · Vista: <strong>{{ currentView }}</strong>
    </div>

    <main class="py-5">
      <router-view />
    </main>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const store = useStore()
    const route = useRoute()
    
    const currentMode = computed(() => store.state.mode)
    const currentView = computed(() => route.name || route.path)
    
    return {
      currentMode,
      currentView
    }
  }
}
</script>

<style>
#app {
  min-height: 100vh;
}
</style>