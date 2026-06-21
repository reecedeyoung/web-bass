import { useState, useCallback } from 'react'
import type { Preset } from './types'
import { BUILT_IN_PRESETS } from './builtins'
import type { EngineParams } from '../audio/EngineParams'

const STORAGE_KEY = 'bass-user-presets'

function readStorage(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Preset[]) : []
  } catch {
    return []
  }
}

function writeStorage(presets: Preset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function usePresets() {
  const [userPresets, setUserPresets] = useState<Preset[]>(readStorage)
  const [activeId,    setActiveId]    = useState<string | null>(null)

  const load = useCallback((preset: Preset): EngineParams => {
    setActiveId(preset.id)
    return preset.params
  }, [])

  const save = useCallback((name: string, params: EngineParams, description?: string): Preset => {
    const preset: Preset = { id: Date.now().toString(), name, description, params }
    setUserPresets(prev => {
      const next = [...prev, preset]
      writeStorage(next)
      return next
    })
    setActiveId(preset.id)
    return preset
  }, [])

  const remove = useCallback((id: string): void => {
    setUserPresets(prev => {
      const next = prev.filter(p => p.id !== id)
      writeStorage(next)
      return next
    })
    setActiveId(prev => (prev === id ? null : prev))
  }, [])

  return {
    builtIns:    BUILT_IN_PRESETS,
    userPresets,
    activeId,
    load,
    save,
    remove,
  }
}
