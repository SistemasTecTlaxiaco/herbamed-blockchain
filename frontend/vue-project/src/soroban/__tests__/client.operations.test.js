import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as client from '../client.js'

beforeEach(() => {
  // Clear both storages
  try { const s = client._storage ? client._storage() : null; if (s) s.clear() } catch (e) {}
  try { delete window.freighterApi } catch (e) {}
  // stub fetch to avoid network calls made by submitTx
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ xdr: 'stubbed-xdr' }) })
})

describe('soroban client operations', () => {
  it('listForSale persists and getListing returns available', async () => {
    const plantId = 'plant-123'
    const price = '10'
    const res = await client.listForSale(plantId, price)
    expect(res).toHaveProperty('success', true)
    const listing = await client.getListing(plantId)
    expect(listing).toHaveProperty('available', true)
    expect(listing).toHaveProperty('price', price)
  })

  it('buyListing marks unavailable and returns success', async () => {
    const plantId = 'plant-234'
    const price = '5'
    await client.listForSale(plantId, price)
    const resp = await client.buyListing(plantId, price)
    expect(resp).toHaveProperty('success', true)
    const listing = await client.getListing(plantId)
    expect(listing.available).toBe(false)
  })

  it('buyListing throws when listing not available', async () => {
    const plantId = 'no-such'
    await expect(client.buyListing(plantId, '1')).rejects.toThrow(/Listing not available/)
  })

  it('voteForPlant increments vote count', async () => {
    const plantId = 'pvote'
    const before = await client.getPlantVotes(plantId)
    expect(before).toBe(0)
    await client.voteForPlant(plantId)
    const after = await client.getPlantVotes(plantId)
    expect(after).toBe(1)
  })
})
