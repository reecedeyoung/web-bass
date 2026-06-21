import { useEffect, useState } from 'react'

export interface MidiDevice {
  id: string
  name: string
  state: MIDIPortDeviceState
}

export function useMidiDevices() {
  const [supported]       = useState(() => typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess)
  const [devices,  setDevices]  = useState<MidiDevice[]>([])
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    if (!supported) return

    let access: MIDIAccess | null = null

    navigator.requestMIDIAccess().then(a => {
      access = a

      const refresh = () =>
        setDevices(
          Array.from(a.inputs.values()).map(input => ({
            id:    input.id,
            name:  input.name ?? 'Unknown Device',
            state: input.state,
          }))
        )

      refresh()
      a.onstatechange = refresh
    }).catch(err => {
      setError(err instanceof Error ? err.message : 'MIDI access denied')
    })

    return () => {
      if (access) access.onstatechange = null
    }
  }, [supported])

  return { supported, devices, error }
}
