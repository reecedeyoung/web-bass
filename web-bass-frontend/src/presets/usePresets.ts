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

  useEffect(() => {
    if (!identityId) {
      setUserPresets([])
      setActiveId(null)
      return
    }
    setIsLoading(true)
    fetchPresets()
      .then(setUserPresets)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [identityId])

  const load = useCallback((preset: Preset): EngineParams => {
    setActiveId(preset.id)
    return preset.params
  }, [])

  const save = useCallback(async (name: string, params: EngineParams): Promise<void> => {
    if (!identityId) return
    const preset: Preset = { id: crypto.randomUUID(), name, params }
    setUserPresets(prev => [...prev, preset])
    setActiveId(preset.id)
    await putPreset(preset)
  }, [identityId])

  const remove = useCallback(async (id: string): Promise<void> => {
    if (!identityId) return
    setUserPresets(prev => prev.filter(p => p.id !== id))
    setActiveId(prev => (prev === id ? null : prev))
    await removePreset(id)
  }, [identityId])

  return {
    builtIns:    BUILT_IN_PRESETS,
    userPresets,
    activeId,
    isLoading,
    load,
    save,
    remove,
  }
}
