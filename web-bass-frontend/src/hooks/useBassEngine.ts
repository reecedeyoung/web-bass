import { useEffect } from 'react'
import { BassEngine } from '../audio/BassEngine'

/**
 * Creates and starts the BassEngine for the lifetime of the calling component.
 * Mount once at the app root. Audio context unlocks automatically on the first
 * key/MIDI event (browser autoplay policy).
 */
export function useBassEngine(): void {
  useEffect(() => {
    const engine = new BassEngine()
    engine.start().catch(err => console.error('[BassEngine] start failed:', err))
    return () => engine.stop()
  }, [])
}
