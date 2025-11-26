import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import PlantList from '../views/plants/PlantList.vue'
import PlantRegistration from '../views/plants/PlantRegistration.vue'
import ValidatorDashboard from '../views/validators/ValidatorDashboard.vue'
import TestFunctions from '../views/plants/TestFunctions.vue'
import Login from '../components/Login.vue'
import MarketPlace from '../components/plants/MarketPlace.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      redirect: '/plants'
    },
    {
      path: '/test',
      name: 'test-functions',
      component: TestFunctions
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/plants',
      name: 'plants',
      component: PlantList
    },
    {
      path: '/plants/register',
      name: 'plant-registration',
      component: PlantRegistration
    },
    {
      path: '/marketplace',
      name: 'marketplace',
      component: MarketPlace
    },
    {
      path: '/validator',
      name: 'validator-dashboard',
      component: ValidatorDashboard
    }
  ]
})

// Route guard: must select mode before accessing any route except login
router.beforeEach((to, from, next) => {
  const mode = store.state.mode || localStorage.getItem('herbamed:mode')
  if (!mode && to.name !== 'login') {
    return next({ name: 'login' })
  }
  // Permitir volver a login si se clickea el botón de cambiar modo
  next()
})

// Initialize mode on first load
store.dispatch('initMode').catch(() => {})

export default router
