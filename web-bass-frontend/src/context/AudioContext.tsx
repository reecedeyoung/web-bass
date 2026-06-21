import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { KeyboardInputSource } from '../audio/KeyboardInputSource'
import { MidiInputSource } from '../audio/MidiInputSource'
import { BassEngine } from '../audio/BassEngine'
import { DEFAULT_ENGINE_PARAMS, type EngineParams } from '../audio/EngineParams'

interface AudioCtxValue {
  keyboard: KeyboardInputSource | null
  engine:   BassEngine | null
  params:   EngineParams
  setParams: (updates: Partial<EngineParams>) => void
}

const AudioCtx = createContext<AudioCtxValue>({
  keyboard:  null,
  engine:    null,
  params:    DEFAULT_ENGINE_PARAMS,
  setParams: () => {},
})

export function AudioProvider({ children }: { children: ReactNode }) {
  const [keyboard, setKeyboard] = useState<KeyboardInputSource | null>(null)
  const [engine,   setEngine]   = useState<BassEngine | null>(null)
  const [params,   setParamsState] = useState<EngineParams>(DEFAULT_ENGINE_PARAMS)

  // Stable ref so setParams callback never goes stale
  const engineRef = useRef<BassEngine | null>(null)

  const setParams = useCallback((updates: Partial<EngineParams>) => {
    setParamsState(prev => ({ ...prev, ...updates }))
    engineRef.current?.setParams(updates)
  }, [])

  useEffect(() => {
    const kb   = new KeyboardInputSource()
    const midi = new MidiInputSource()
    const eng  = new BassEngine()

    engineRef.current = eng

    kb.connect()
    void midi.connect()
    eng.start()
      .then(() => setEngine(eng))
      .catch(err => console.error('[BassEngine]', err))

    setKeyboard(kb)

    return () => {
      kb.disconnect()
      midi.disconnect()
      eng.stop()
      engineRef.current = null
    }
  }, [])

  return (
    <AudioCtx.Provider value={{ keyboard, engine, params, setParams }}>
      {children}
    </AudioCtx.Provider>
  )
}

export const useAudio = () => useContext(AudioCtx)
