import { useEffect } from 'react'
import { KeyboardInputSource } from '../audio/KeyboardInputSource'
import { MidiInputSource } from '../audio/MidiInputSource'

/**
 * Activates keyboard and MIDI input for the lifetime of the calling component.
 * Mount this once at the app root so input is always live.
 */
export function useInputSources(): void {
  useEffect(() => {
    const keyboard = new KeyboardInputSource()
    const midi = new MidiInputSource()

    keyboard.connect()
    midi.connect()

    return () => {
      keyboard.disconnect()
      midi.disconnect()
    }
  }, [])
}
