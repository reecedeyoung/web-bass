/** Mirrors key-mapping.schema.json — keep in sync. */

export interface KeyBinding {
  /** MIDI note number 0–127 */
  note: number
  /** MIDI channel 1–16; maps to a string voice (1=E 2=A 3=D 4=G) */
  channel: number
  /** Optional label shown in the Control Mapping tab */
  label?: string
}

export interface KeyMapping {
  /** Human-readable name shown in the Presets tab */
  name: string
  description?: string
  /** Schema version for forward-compatibility checks */
  version?: number
  /** KeyboardEvent.key → binding */
  mappings: Record<string, KeyBinding>
}
