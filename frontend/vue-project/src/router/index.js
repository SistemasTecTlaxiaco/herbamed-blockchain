import { createRouter, createWebHistory } from 'vue-router'
import { useStore } from 'vuex'
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
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/plants',
      name: 'plants',
      component: PlantList,
      meta: { requiresAuth: true }
    },
    {
      path: '/plants/register',
      name: 'plant-registration',
      component: PlantRegistration,
      meta: { requiresAuth: true }
    },
    {
      path: '/marketplace',
      name: 'marketplace',
      component: MarketPlace,
      meta: { requiresAuth: true }
    },
    {
      path: '/validator',
      name: 'validator-dashboard',
      component: ValidatorDashboard,
      meta: { requiresAuth: true }
    }
  ]
})

// Auth guard: redirige a /login si no está autenticado
router.beforeEach((to, from, next) => {
  const store = useStore()
  const isAuthenticated = store.state.isAuthenticated
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
