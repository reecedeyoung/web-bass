import { apiFetch } from './apiClient'
import type { KeyMapping } from '../mappings/types'

export async function fetchMappings(): Promise<KeyMapping[]> {
  const res = await apiFetch('/api/mappings')
  if (!res.ok) throw new Error(`Failed to load mappings (${res.status})`)
  return res.json()
}

export async function putMapping(mappingId: string, mapping: KeyMapping): Promise<void> {
  const res = await apiFetch(`/api/mappings/${mappingId}`, {
    method: 'PUT',
    body:   JSON.stringify(mapping),
  })
  if (!res.ok) throw new Error(`Failed to save mapping (${res.status})`)
}
