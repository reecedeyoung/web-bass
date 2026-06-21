import type { EngineParams } from '../audio/EngineParams'

export interface Preset {
  id:           string
  name:         string
  description?: string
  params:       EngineParams
}
