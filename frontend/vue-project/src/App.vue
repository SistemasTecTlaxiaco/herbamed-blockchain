<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">Herbamed</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <router-link class="nav-link" to="/plants">Plantas</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/plants/register">Registrar Planta</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/marketplace">🛒 Marketplace</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/validator">Validadores</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/login">Conectar Wallet</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main class="py-4">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
body {
  padding-top: 1rem;
}
</style>