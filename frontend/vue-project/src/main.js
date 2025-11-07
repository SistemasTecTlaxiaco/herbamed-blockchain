import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Import styles
import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'

// Import Bootstrap JS
import * as bootstrap from 'bootstrap'
window.bootstrap = bootstrap

// Create Vue app
const app = createApp(App)

// Use plugins
app.use(router)
app.use(store)

// Mount the app
app.mount('#app')
