import { createStore } from 'vuex'

export default createStore({
  state: {
    plants: [],
    validators: [],
    publicKey: null,
    balance: null,
    isAuthenticated: false,
    authMethod: null // 'local-key', 'freighter', 'walletconnect'
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
    SET_PLANTS(state, plants) {
      state.plants = plants
    },
    ADD_PLANT(state, plant) {
      state.plants.push(plant)
    },
    UPDATE_PLANT(state, { id, plant }) {
      const index = state.plants.findIndex(p => p.id === id)
      if (index !== -1) {
        state.plants[index] = { ...state.plants[index], ...plant }
      }
    },
    SET_VALIDATORS(state, validators) {
      state.validators = validators
    }
  },
  actions: {
    async fetchPlants({ commit }) {
      try {
        // TODO: Implementar la llamada al smart contract
        const plants = [] // Obtener plantas del contrato
        commit('SET_PLANTS', plants)
      } catch (error) {
        console.error('Error al obtener las plantas:', error)
        throw error
      }
    },
    async registerPlant({ commit }, plantData) {
      try {
        // TODO: Implementar la llamada al smart contract
        commit('ADD_PLANT', plantData)
      } catch (error) {
        console.error('Error al registrar la planta:', error)
        throw error
      }
    },
    async votePlant({ commit }, { plantId, validatorAddress }) {
      try {
        // TODO: Implementar la llamada al smart contract
        const votes = 0 // Obtener votos del contrato
        commit('UPDATE_PLANT', {
          id: plantId,
          plant: { votes }
        })
      } catch (error) {
        console.error('Error al votar por la planta:', error)
        throw error
      }
    }
  },
  getters: {
    getPlantById: (state) => (id) => {
      return state.plants.find(plant => plant.id === id)
    },
    getPendingPlants: (state) => {
      return state.plants.filter(plant => !plant.validated)
    }
  }
})
