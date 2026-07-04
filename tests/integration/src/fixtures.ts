export const VALID_PARAMS = {
  attack:         0.3,
  sustain:        false,
  releaseTime:    150,
  retrigger:      true,
  portamento:     false,
  portamentoTime: 100,
  tone:           0.3,
  dampFreq:       100,
  dampAmount:     0.5,
  eqLow:          3,
  eqMid:          0,
  eqHigh:         0,
  drive:          0,
  volume:         0.8,
}

export function makePreset(overrides?: Record<string, unknown>) {
  return {
    id:     crypto.randomUUID(),
    name:   'Integration Test Preset',
    params: VALID_PARAMS,
    ...overrides,
  }
}

export const VALID_MAPPING = {
  name: 'Integration Test Mapping',
  mappings: {
    'a': { note: 40, channel: 1 },
    's': { note: 42, channel: 1 },
    'd': { note: 44, channel: 1 },
  },
}
