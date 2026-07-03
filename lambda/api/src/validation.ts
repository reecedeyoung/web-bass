const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validatePreset(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return 'Preset must be an object'
  const p = value as Record<string, unknown>

  if (typeof p['id'] !== 'string' || !UUID_RE.test(p['id'])) return 'preset.id must be a UUID'
  if (typeof p['name'] !== 'string' || p['name'].trim() === '') return 'preset.name is required'
  if ((p['name'] as string).length > 64) return 'preset.name max 64 characters'
  if (p['description'] !== undefined) {
    if (typeof p['description'] !== 'string' || (p['description'] as string).length > 256) {
      return 'preset.description max 256 characters'
    }
  }
  return validateEngineParams(p['params'])
}

function validateEngineParams(params: unknown): string | undefined {
  if (!params || typeof params !== 'object') return 'preset.params must be an object'
  const p = params as Record<string, unknown>

  const numericRanges: [string, number, number][] = [
    ['attack',          0,   1],
    ['releaseTime',     0,   5000],
    ['portamentoTime',  0,   2000],
    ['tone',            0,   1],
    ['dampFreq',        20,  20000],
    ['dampAmount',      0,   1],
    ['eqLow',          -20,  20],
    ['eqMid',          -20,  20],
    ['eqHigh',         -20,  20],
    ['drive',           0,   1],
    ['volume',          0,   1],
  ]
  for (const [key, min, max] of numericRanges) {
    if (typeof p[key] !== 'number' || (p[key] as number) < min || (p[key] as number) > max) {
      return `params.${key} must be a number between ${min} and ${max}`
    }
  }
  if (typeof p['sustain']    !== 'boolean') return 'params.sustain must be boolean'
  if (typeof p['retrigger']  !== 'boolean') return 'params.retrigger must be boolean'
  if (typeof p['portamento'] !== 'boolean') return 'params.portamento must be boolean'
  return undefined
}

export function validateMapping(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return 'Mapping must be an object'
  const m = value as Record<string, unknown>

  if (typeof m['name'] !== 'string' || m['name'].trim() === '') return 'mapping.name is required'
  if ((m['name'] as string).length > 128) return 'mapping.name max 128 characters'
  if (!m['mappings'] || typeof m['mappings'] !== 'object' || Array.isArray(m['mappings'])) {
    return 'mapping.mappings must be an object'
  }
  const bindings = m['mappings'] as Record<string, unknown>
  const keys = Object.keys(bindings)
  if (keys.length > 150) return 'mapping.mappings max 150 keys'

  for (const key of keys) {
    const b = bindings[key] as Record<string, unknown> | undefined
    if (!b || typeof b !== 'object') return `mapping.mappings.${key} must be an object`
    if (!Number.isInteger(b['note'])    || (b['note']    as number) < 0  || (b['note']    as number) > 127) {
      return `mapping.mappings.${key}.note must be integer 0–127`
    }
    if (!Number.isInteger(b['channel']) || (b['channel'] as number) < 1  || (b['channel'] as number) > 16) {
      return `mapping.mappings.${key}.channel must be integer 1–16`
    }
  }
  return undefined
}
