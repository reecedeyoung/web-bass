import type { KeyMapping } from '../../mappings/types'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function midiToName(note: number): string {
  const octave = Math.floor(note / 12) - 1
  return `${NOTE_NAMES[note % 12]}${octave}`
}

// Keyboard rows ordered top-to-bottom as they appear physically.
// Channel maps to the corresponding BassEngine string voice.
export const STRING_ROWS = [
  { name: 'G', channel: 4, keys: ['1','2','3','4','5','6','7','8','9','0'] as const, defaultOpen: 43 },
  { name: 'D', channel: 3, keys: ['q','w','e','r','t','y','u','i','o','p'] as const, defaultOpen: 38 },
  { name: 'A', channel: 2, keys: ['a','s','d','f','g','h','j','k','l',';'] as const, defaultOpen: 33 },
  { name: 'E', channel: 1, keys: ['z','x','c','v','b','n','m',',','.','/'] as const, defaultOpen: 28 },
]

/** Derive each string's open note from whatever mapping is currently loaded. */
export function deriveOpenNotes(mapping: KeyMapping): number[] {
  return STRING_ROWS.map(row => mapping.mappings[row.keys[0]]?.note ?? row.defaultOpen)
}

/** Build a full KeyMapping from four open-string MIDI note numbers. */
export function buildMappingFromTunings(openNotes: readonly number[], name = 'Custom'): KeyMapping {
  const mappings: KeyMapping['mappings'] = {}

  STRING_ROWS.forEach((row, i) => {
    row.keys.forEach((key, fret) => {
      const note = openNotes[i] + fret
      mappings[key] = { note, channel: row.channel, label: midiToName(note) }
    })
  })

  return { name, version: 1, mappings }
}

/** Selectable open-note range: E0 (16) → E3 (52) covers all realistic bass tunings. */
export const OPEN_NOTE_OPTIONS = Array.from({ length: 37 }, (_, i) => i + 16).map(n => ({
  value: n,
  label: midiToName(n),
}))
