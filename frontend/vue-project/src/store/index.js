import { createStore } from 'vuex'
import soroban from '../soroban/client'

/**
 * Store centralizado para manejo de estado global
 * - Plantas registradas globales
 * - Listings (marketplace)
 * - Validaciones
 * - Usuario actual (currentUser: public key)
 */
export default createStore({
  state: {
    // Autenticación
    publicKey: null,
    balance: null,
    isAuthenticated: false,
    authMethod: null,
    
    // Plantas registradas en blockchain
    allPlants: [],
    userPlants: [], // Plantas propiedad del usuario actual
    
    // Listings (marketplace)
    allListings: [],
    userListings: [], // Listings del usuario
    
    // Validaciones
    userValidations: [], // Plantas en venta del usuario (para validar)
    otherValidations: [], // Plantas ajenas que el usuario puede validar
    
    // UI state
    lastRefresh: {
      plants: 0,
      listings: 0,
      validations: 0
    }
  },
  
  mutations: {
    SET_PUBLIC_KEY(state, pk) {
      state.publicKey = pk
    },
    SET_BALANCE(state, balance) {
      state.balance = balance
    },
    SET_AUTHENTICATED(state, isAuth) {
      state.isAuthenticated = isAuth
    },
    SET_AUTH_METHOD(state, method) {
      state.authMethod = method
    },
    
    // Plantas
    SET_ALL_PLANTS(state, plants) {
      state.allPlants = plants
      state.lastRefresh.plants = Date.now()
    },
    SET_USER_PLANTS(state, plants) {
      state.userPlants = plants
    },
    ADD_PLANT(state, plant) {
      const exists = state.allPlants.find(p => p.id === plant.id)
      if (!exists) {
        state.allPlants.push(plant)
      }
    },
    
    // Listings
    SET_ALL_LISTINGS(state, listings) {
      state.allListings = listings
      state.lastRefresh.listings = Date.now()
    },
    SET_USER_LISTINGS(state, listings) {
      state.userListings = listings
    },
    
    // Validaciones
    SET_USER_VALIDATIONS(state, validations) {
      state.userValidations = validations
    },
    SET_OTHER_VALIDATIONS(state, validations) {
      state.otherValidations = validations
    },
    
    RESET_STATE(state) {
      state.allPlants = []
      state.userPlants = []
      state.allListings = []
      state.userListings = []
      state.userValidations = []
      state.otherValidations = []
    }
  },
  
  actions: {
    // ===== PLANTAS =====
    async refreshAllPlants({ commit }) {
      try {
        const plants = await soroban.getAllPlants()
        commit('SET_ALL_PLANTS', plants)
        return plants
      } catch (error) {
        console.error('[Store] Error al cargar plantas:', error)
        throw error
      }
    },
    
    async refreshUserPlants({ state, commit, dispatch }) {
      if (!state.publicKey) return []
      try {
        // Obtener todas las plantas y filtrar por owner
        const allPlants = await soroban.getAllPlants()
        // TODO: implementar método en soroban/client.js para obtener owner de planta
        // Por ahora asumimos que tenemos un campo owner o usamos metadata
        const userPlants = allPlants.filter(p => p.owner === state.publicKey)
        commit('SET_USER_PLANTS', userPlants)
        return userPlants
      } catch (error) {
        console.error('[Store] Error al cargar plantas del usuario:', error)
        throw error
      }
    },
    
    // ===== LISTINGS (MARKETPLACE) =====
    async refreshAllListings({ commit }) {
      try {
        const listings = await soroban.getAllListings()
        commit('SET_ALL_LISTINGS', listings)
        return listings
      } catch (error) {
        console.error('[Store] Error al cargar listings:', error)
        throw error
      }
    },
    
    async refreshUserListings({ state, commit }) {
      if (!state.publicKey) return []
      try {
        const allListings = await soroban.getAllListings()
        // Filtrar listings del usuario actual
        const userListings = allListings.filter(l => l.seller === state.publicKey)
        commit('SET_USER_LISTINGS', userListings)
        return userListings
      } catch (error) {
        console.error('[Store] Error al cargar listings del usuario:', error)
        throw error
      }
    },
    
    // ===== VALIDACIONES =====
    async refreshValidations({ state, commit, dispatch }) {
      if (!state.publicKey) return { user: [], other: [] }
      try {
        const allListings = await soroban.getAllListings()
        
        // Plantas del usuario en venta (para que otros validen)
        const userValidations = allListings.filter(l => l.seller === state.publicKey)
        commit('SET_USER_VALIDATIONS', userValidations)
        
        // Plantas ajenas en venta (para que el usuario valide)
        const otherValidations = allListings.filter(l => l.seller !== state.publicKey)
        commit('SET_OTHER_VALIDATIONS', otherValidations)
        
        return { user: userValidations, other: otherValidations }
      } catch (error) {
        console.error('[Store] Error al cargar validaciones:', error)
        throw error
      }
    },
    
    // ===== REFRESH GENERAL =====
    async refreshAll({ dispatch }) {
      try {
        await Promise.all([
          dispatch('refreshAllPlants'),
          dispatch('refreshAllListings'),
          dispatch('refreshValidations'),
          dispatch('refreshUserListings')
        ])
      } catch (error) {
        console.error('[Store] Error al refrescar todo:', error)
        throw error
      }
    }
  },
  
  getters: {
    isUserAuthenticated: state => !!state.publicKey,
    currentPublicKey: state => state.publicKey,
    
    // PLANTAS
    allPlants: state => state.allPlants,
    userPlants: state => state.userPlants,
    getPlantById: state => id => state.allPlants.find(p => p.id === id),
    
    // LISTINGS
    allListings: state => state.allListings,
    userListings: state => state.userListings,
    userPlantsNotListed: state => {
      // Plantas del usuario que NO están en listings
      const listedIds = new Set(state.userListings.map(l => l.plant_id))
      return state.userPlants.filter(p => !listedIds.has(p.id))
    },
    userPlantsListed: state => {
      // Plantas del usuario que SÍ están en listings
      const listedIds = new Set(state.userListings.map(l => l.plant_id))
      return state.userPlants.filter(p => listedIds.has(p.id))
    },
    otherUserListings: state => {
      // Listings de otros usuarios (no del usuario actual)
      return state.allListings.filter(l => l.seller !== state.publicKey)
    },
    
    // VALIDACIONES
    userValidations: state => state.userValidations,
    otherValidations: state => state.otherValidations
  }
})
