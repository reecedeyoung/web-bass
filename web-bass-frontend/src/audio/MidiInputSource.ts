import type { InputSource } from './InputSource'
import { noteEventBus } from './NoteEventBus'
import type { NoteEvent } from './types'

const STATUS_MASK = 0xf0
const CHANNEL_MASK = 0x0f
const NOTE_ON = 0x90
const NOTE_OFF = 0x80

export class MidiInputSource implements InputSource {
  private access: MIDIAccess | null = null

  async connect(): Promise<void> {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not available in this browser')
      return
    }
    try {
      this.access = await navigator.requestMIDIAccess()
      this.access.inputs.forEach(input => { input.onmidimessage = this.onMessage })
      this.access.onstatechange = this.onStateChange
    } catch (err) {
      console.warn('MIDI access denied:', err)
    }
  }

  disconnect(): void {
    if (!this.access) return
    this.access.inputs.forEach(input => { input.onmidimessage = null })
    this.access = null
  }

  private readonly onMessage = (e: MIDIMessageEvent): void => {
    if (!e.data) return
    const [status, note, velocity] = e.data
    const msgType = status & STATUS_MASK
    const channel = (status & CHANNEL_MASK) + 1

    let event: NoteEvent | null = null

    if (msgType === NOTE_ON && velocity > 0) {
      event = { type: 'noteOn', note, velocity, channel, timestamp: performance.now(), source: 'midi' }
    } else if (msgType === NOTE_OFF || (msgType === NOTE_ON && velocity === 0)) {
      event = { type: 'noteOff', note, velocity: 0, channel, timestamp: performance.now(), source: 'midi' }
    }

    if (event) noteEventBus.dispatch(event)
  }

  private readonly onStateChange = (e: MIDIConnectionEvent): void => {
    if (!e.port || e.port.type !== 'input') return
    const input = e.port as MIDIInput
    input.onmidimessage = e.port.state === 'connected' ? this.onMessage : null
  }
}
