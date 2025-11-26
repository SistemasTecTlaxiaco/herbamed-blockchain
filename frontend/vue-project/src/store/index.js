import { createStore } from 'vuex'

export default createStore({
  state: {
    plants: [],
    validators: [],
    publicKey: null,
    mode: null // 'demo' | 'blockchain'
  },
  mutations: {
    SET_PUBLIC_KEY(state, pk) {
      state.publicKey = pk
    },
    SET_MODE(state, mode) {
      state.mode = mode
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
    initMode({ commit }) {
      try {
        const saved = localStorage.getItem('herbamed:mode')
        if (saved === 'demo' || saved === 'blockchain') {
          commit('SET_MODE', saved)
        }
      } catch (_) { /* ignore */ }
    },
    setMode({ commit }, mode) {
      if (mode !== 'demo' && mode !== 'blockchain') throw new Error('Modo inválido')
      commit('SET_MODE', mode)
      try { localStorage.setItem('herbamed:mode', mode) } catch (_) { /* ignore */ }
    },
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
    },
    currentMode: (state) => state.mode
    }
  }
})
