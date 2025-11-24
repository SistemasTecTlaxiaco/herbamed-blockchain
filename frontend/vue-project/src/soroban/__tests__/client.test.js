import { describe, it, expect, beforeEach } from 'vitest'
import * as client from '../client.js'

beforeEach(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try { window.localStorage.clear() } catch (e) {}
  }
  try { delete window.freighterApi } catch (e) {}
})

describe('soroban client basic', () => {
  it('reports no freighter by default', () => {
    expect(client.isFreighterInstalled()).toBe(false)
  })

  it('can set and get local secret', () => {
    client.setLocalSecret('SLOCALSECRET')
    expect(client.getLocalSecret()).toBe('SLOCALSECRET')
  })

  it('registerPlant persists and getAllPlants returns entries', async () => {
    // ensure storage is empty
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear()
    const res = await client.registerPlant({ name: 'TestHerb', description: 'TestDesc' })
    expect(res).toHaveProperty('success', true)
    // debug aids
    // console.log('debug inMemory:', client._debugGetInMemory('herbamed:plants'))
    // console.log('debug storage:', typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('herbamed:plants') : null)
    const plants = await client.getAllPlants()
    expect(Array.isArray(plants)).toBe(true)
    expect(plants.length).toBeGreaterThan(0)
    expect(plants[0]).toHaveProperty('name')
  })
})
