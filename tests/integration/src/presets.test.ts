import { describe, test, expect, beforeAll } from 'vitest'
import { authedFetch } from './helpers/client'
import { makePreset, VALID_PARAMS } from './fixtures'

async function deleteAllPresets() {
  const res = await authedFetch('/api/presets')
  const presets = (await res.json()) as { id: string }[]
  await Promise.all(
    presets.map(p => authedFetch(`/api/presets/${p.id}`, { method: 'DELETE' }))
  )
}

describe('presets CRUD', () => {
  const preset = makePreset()

  beforeAll(deleteAllPresets)

  test('GET /api/presets returns empty array on clean user', async () => {
    const res = await authedFetch('/api/presets')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  test('PUT /api/presets/:id creates a preset → 204', async () => {
    const res = await authedFetch(`/api/presets/${preset.id}`, {
      method: 'PUT',
      body:   JSON.stringify(preset),
    })
    expect(res.status).toBe(204)
  })

  test('GET /api/presets returns the created preset', async () => {
    const res  = await authedFetch('/api/presets')
    const body = (await res.json()) as { id: string; name: string; params: unknown }[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0]!.id).toBe(preset.id)
    expect(body[0]!.name).toBe(preset.name)
    expect(body[0]!.params).toMatchObject(VALID_PARAMS)
  })

  test('PUT /api/presets/:id with same id updates the preset → 204', async () => {
    const res = await authedFetch(`/api/presets/${preset.id}`, {
      method: 'PUT',
      body:   JSON.stringify({ ...preset, name: 'Updated Name' }),
    })
    expect(res.status).toBe(204)
  })

  test('GET /api/presets reflects the name update', async () => {
    const res  = await authedFetch('/api/presets')
    const body = (await res.json()) as { id: string; name: string }[]
    expect(body).toHaveLength(1)
    expect(body[0]!.name).toBe('Updated Name')
  })

  test('preset with optional description round-trips correctly', async () => {
    const withDesc = makePreset({ description: 'punchy slap tone' })
    await authedFetch(`/api/presets/${withDesc.id}`, {
      method: 'PUT',
      body:   JSON.stringify(withDesc),
    })
    const res  = await authedFetch('/api/presets')
    const body = (await res.json()) as { id: string; description?: string }[]
    const saved = body.find(p => p.id === withDesc.id)
    expect(saved?.description).toBe('punchy slap tone')
    // clean up the extra preset
    await authedFetch(`/api/presets/${withDesc.id}`, { method: 'DELETE' })
  })

  test('DELETE /api/presets/:id removes the preset → 204', async () => {
    const res = await authedFetch(`/api/presets/${preset.id}`, { method: 'DELETE' })
    expect(res.status).toBe(204)
  })

  test('GET /api/presets is empty after deletion', async () => {
    const res  = await authedFetch('/api/presets')
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual([])
  })
})
