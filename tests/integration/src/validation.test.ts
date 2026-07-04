import { describe, test, expect } from 'vitest'
import { authedFetch } from './helpers/client'
import { makePreset, VALID_PARAMS, VALID_MAPPING } from './fixtures'

async function putPreset(body: unknown, id = crypto.randomUUID()) {
  return authedFetch(`/api/presets/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(body),
  })
}

async function putMapping(body: unknown, id = 'default') {
  return authedFetch(`/api/mappings/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(body),
  })
}

describe('preset validation', () => {
  test('missing body → 400', async () => {
    const res = await authedFetch(`/api/presets/${crypto.randomUUID()}`, { method: 'PUT' })
    expect(res.status).toBe(400)
  })

  test('name longer than 64 chars → 400', async () => {
    const res = await putPreset(makePreset({ name: 'x'.repeat(65) }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/name/)
  })

  test('description longer than 256 chars → 400', async () => {
    const res = await putPreset(makePreset({ description: 'x'.repeat(257) }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/description/)
  })

  test('id that is not a UUID → 400', async () => {
    const id  = 'not-a-uuid'
    // bypass the typed helper to send an intentionally invalid id
    const token = await import('./helpers/auth').then(m => m.getIdToken())
    const res = await fetch(
      `${process.env['API_BASE_URL']}/api/presets/${id}`,
      {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ id, name: 'test', params: VALID_PARAMS }),
      },
    )
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/UUID/)
  })

  test('params.attack out of range → 400', async () => {
    const res = await putPreset(makePreset({ params: { ...VALID_PARAMS, attack: 2 } }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/attack/)
  })

  test('params.volume out of range → 400', async () => {
    const res = await putPreset(makePreset({ params: { ...VALID_PARAMS, volume: -0.1 } }))
    expect(res.status).toBe(400)
  })

  test('params.sustain not a boolean → 400', async () => {
    const res = await putPreset(makePreset({ params: { ...VALID_PARAMS, sustain: 'yes' } }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/sustain/)
  })

  test('missing params entirely → 400', async () => {
    const { params: _, ...noParams } = makePreset()
    const res = await putPreset(noParams)
    expect(res.status).toBe(400)
  })
})

describe('mapping validation', () => {
  test('missing body → 400', async () => {
    const res = await authedFetch('/api/mappings/default', { method: 'PUT' })
    expect(res.status).toBe(400)
  })

  test('missing name → 400', async () => {
    const { name: _, ...noName } = VALID_MAPPING
    const res = await putMapping(noName)
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/name/)
  })

  test('name longer than 128 chars → 400', async () => {
    const res = await putMapping({ ...VALID_MAPPING, name: 'x'.repeat(129) })
    expect(res.status).toBe(400)
  })

  test('binding note out of range → 400', async () => {
    const res = await putMapping({
      ...VALID_MAPPING,
      mappings: { a: { note: 200, channel: 1 } },
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/note/)
  })

  test('binding channel out of range → 400', async () => {
    const res = await putMapping({
      ...VALID_MAPPING,
      mappings: { a: { note: 40, channel: 0 } },
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/channel/)
  })

  test('payload over 32 KB → 413', async () => {
    const bigMappings: Record<string, { note: number; channel: number }> = {}
    for (let i = 0; i < 150; i++) {
      bigMappings[`key${i}_${'x'.repeat(200)}`] = { note: 40, channel: 1 }
    }
    const res = await putMapping({ name: 'big', mappings: bigMappings })
    expect(res.status).toBe(413)
  })
})
