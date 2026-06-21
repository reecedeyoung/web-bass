import { useEffect } from 'react'
import type { NoteEventHandler } from '../audio/types'
import { noteEventBus } from '../audio/NoteEventBus'

/** Subscribe a component to all NoteEvents from the bus. */
export function useNoteEvents(handler: NoteEventHandler): void {
  useEffect(() => noteEventBus.subscribe(handler), [handler])
}
