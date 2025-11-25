import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as client from '../client.js'

beforeEach(() => {
  // Clear storages
  try { const s = client._storage ? client._storage() : null; if (s) s.clear() } catch (e) {}
  try { delete window.freighterApi } catch (e) {}
  // Mock fetch to avoid network calls
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ xdr: 'stubbed-xdr' }), status: 200 })
})

describe('wallet integration', () => {
  it('isFreighterInstalled returns false when no extension present', () => {
    expect(client.isFreighterInstalled()).toBe(false)
  })

  it('isFreighterInstalled returns true when window.freighterApi exists', () => {
    globalThis.window = globalThis.window || {}
    globalThis.window.freighterApi = { getPublicKey: async () => 'GTEST' }
    expect(client.isFreighterInstalled()).toBe(true)
  })

  it('connectWallet returns null when freighterApi not present', async () => {
    const pk = await client.connectWallet()
    expect(pk).toBeNull()
  })

  it('connectWallet returns publicKey when freighterApi present', async () => {
    globalThis.window = globalThis.window || {}
    globalThis.window.freighterApi = { getPublicKey: async () => 'GPUBKEY123' }
    const pk = await client.connectWallet()
    expect(pk).toBe('GPUBKEY123')
  })

  it('disconnectWallet removes local secret', () => {
    client.setLocalSecret('STEST')
    expect(client.getLocalSecret()).toBe('STEST')
    client.disconnectWallet()
    expect(client.getLocalSecret()).toBe('')
  })

  it('isRpcAvailable returns true when fetch succeeds', async () => {
    const available = await client.isRpcAvailable()
    expect(available).toBe(true)
  })

  it('isRpcAvailable returns false when fetch fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const available = await client.isRpcAvailable()
    expect(available).toBe(false)
  })
})
