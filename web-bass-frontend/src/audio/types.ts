export type NoteEventType = 'noteOn' | 'noteOff'

export interface NoteEvent {
  type: NoteEventType
  /** MIDI note number 0–127 */
  note: number
  /** 0–127; noteOff conventionally sends 0 */
  velocity: number
  /** MIDI channel 1–16 */
  channel: number
  /** performance.now() timestamp */
  timestamp: number
  source: 'keyboard' | 'midi'
}

export type NoteEventHandler = (event: NoteEvent) => void
