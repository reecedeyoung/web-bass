import { apiFetch } from './apiClient'
import type { Preset } from '../presets/types'

export async function fetchPresets(): Promise<Preset[]> {
  const res = await apiFetch('/api/presets')
  if (!res.ok) throw new Error(`Failed to load presets (${res.status})`)
  return res.json()
}

export async function putPreset(preset: Preset): Promise<void> {
  const res = await apiFetch(`/api/presets/${preset.id}`, {
    method: 'PUT',
    body:   JSON.stringify(preset),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Failed to save preset (${res.status})`)
  }
}

export async function removePreset(presetId: string): Promise<void> {
  const res = await apiFetch(`/api/presets/${presetId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete preset (${res.status})`)
}
