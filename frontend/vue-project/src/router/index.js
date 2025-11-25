import { createRouter, createWebHistory } from 'vue-router'
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

export default router
