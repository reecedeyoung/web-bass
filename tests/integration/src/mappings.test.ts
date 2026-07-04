import { describe, test, expect } from 'vitest'
import { authedFetch } from './helpers/client'
import { VALID_MAPPING } from './fixtures'

describe('mappings', () => {
  test('PUT /api/mappings/default saves a mapping → 204', async () => {
    const res = await authedFetch('/api/mappings/default', {
      method: 'PUT',
      body:   JSON.stringify(VALID_MAPPING),
    })
    expect(res.status).toBe(204)
  })

  test('GET /api/mappings returns the saved mapping', async () => {
    const res  = await authedFetch('/api/mappings')
    const body = (await res.json()) as { name: string; mappings: unknown }[]
    expect(res.status).toBe(200)
    expect(body.length).toBeGreaterThan(0)
    const saved = body.find(m => m.name === VALID_MAPPING.name)
    expect(saved).toBeDefined()
    expect(saved?.mappings).toMatchObject(VALID_MAPPING.mappings)
  })

  test('PUT /api/mappings/default overwrites with updated mapping → 204', async () => {
    const updated = { ...VALID_MAPPING, name: 'Updated Mapping' }
    const res = await authedFetch('/api/mappings/default', {
      method: 'PUT',
      body:   JSON.stringify(updated),
    })
    expect(res.status).toBe(204)
  })

  test('GET /api/mappings reflects the overwrite', async () => {
    const res  = await authedFetch('/api/mappings')
    const body = (await res.json()) as { name: string }[]
    const names = body.map(m => m.name)
    expect(names).toContain('Updated Mapping')
    expect(names).not.toContain(VALID_MAPPING.name)
  })
})
