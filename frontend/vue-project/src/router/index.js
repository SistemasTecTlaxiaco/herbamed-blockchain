import { createRouter, createWebHistory } from 'vue-router'
import PlantList from '../views/plants/PlantList.vue'
import PlantRegistration from '../views/plants/PlantRegistration.vue'
import ValidatorDashboard from '../views/validators/ValidatorDashboard.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      redirect: '/plants'
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
      path: '/validator',
      name: 'validator-dashboard',
      component: ValidatorDashboard
    }
  ]
})

export default router
