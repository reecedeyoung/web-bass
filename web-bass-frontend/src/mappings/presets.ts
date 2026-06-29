import type { KeyMapping } from './types'
import defaultLayout from './default-bass-layout.json'
import cMajorLayout from './c-major-layout.json'

export const PRESETS: KeyMapping[] = [
  defaultLayout as KeyMapping,
  cMajorLayout as KeyMapping,
]
