import { useState, useCallback, useEffect } from 'react'
import type { Preset } from './types'
import { BUILT_IN_PRESETS } from './builtins'
import type { EngineParams } from '../audio/EngineParams'
import { useAuth } from '../context/AuthContext'
import { fetchPresets, putPreset, removePreset } from '../lib/presetsApi'

export function usePresets() {
  const { identityId } = useAuth()
  const [userPresets, setUserPresets] = useState<Preset[]>([])
  const [activeId,    setActiveId]    = useState<string | null>(null)
  const [isLoading,   setIsLoading]   = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)

  useEffect(() => {
    if (!identityId) {
      setUserPresets([])
      setActiveId(null)
      return
    }
    setIsLoading(true)
    fetchPresets(identityId)
      .then(setUserPresets)
      .catch(err => console.error('fetchPresets failed:', err))
      .finally(() => setIsLoading(false))
  }, [identityId])

  const load = useCallback((preset: Preset): EngineParams => {
    setActiveId(preset.id)
    return preset.params
  }, [])

  const save = useCallback(async (name: string, params: EngineParams): Promise<void> => {
    if (!identityId) return
    const preset: Preset = { id: crypto.randomUUID(), name, params }
    setSaveError(null)
    setUserPresets(prev => [...prev, preset])
    setActiveId(preset.id)
    try {
      await putPreset(identityId, preset)
    } catch (err) {
      console.error('putPreset failed:', err)
      setUserPresets(prev => prev.filter(p => p.id !== preset.id))
      setActiveId(null)
      setSaveError(err instanceof Error ? err.message : 'Failed to save preset')
      throw err
    }
  }, [identityId])

  const remove = useCallback(async (id: string): Promise<void> => {
    if (!identityId) return
    setUserPresets(prev => prev.filter(p => p.id !== id))
    setActiveId(prev => (prev === id ? null : prev))
    await removePreset(identityId, id).catch(err => console.error('removePreset failed:', err))
  }, [identityId])

  return {
    builtIns:    BUILT_IN_PRESETS,
    userPresets,
    activeId,
    isLoading,
    saveError,
    load,
    save,
    remove,
  }
}
