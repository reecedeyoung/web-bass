import { describe, test, expect } from 'vitest'
import { anonFetch } from './helpers/client'

describe('unauthenticated requests are rejected', () => {
  test('GET /api/presets → 401', async () => {
    const res = await anonFetch('/api/presets')
    expect(res.status).toBe(401)
  })

  test('PUT /api/presets/:id → 401', async () => {
    const res = await anonFetch(`/api/presets/${crypto.randomUUID()}`, {
      method: 'PUT',
      body: JSON.stringify({ id: crypto.randomUUID(), name: 'x', params: {} }),
    })
    expect(res.status).toBe(401)
  })

  test('DELETE /api/presets/:id → 401', async () => {
    const res = await anonFetch(`/api/presets/${crypto.randomUUID()}`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  test('GET /api/mappings → 401', async () => {
    const res = await anonFetch('/api/mappings')
    expect(res.status).toBe(401)
  })

  test('PUT /api/mappings/:id → 401', async () => {
    const res = await anonFetch('/api/mappings/default', {
      method: 'PUT',
      body: JSON.stringify({ name: 'x', mappings: {} }),
    })
    expect(res.status).toBe(401)
  })

  test('malformed token → 401', async () => {
    const res = await fetch(`${process.env['API_BASE_URL']}/api/presets`, {
      headers: { Authorization: 'Bearer this.is.not.a.real.jwt' },
    })
    expect(res.status).toBe(401)
  })
})
