import type { NoteEvent, NoteEventHandler } from './types'

class NoteEventBus {
  private readonly handlers = new Set<NoteEventHandler>()

  /** Returns an unsubscribe function. */
  subscribe(handler: NoteEventHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  dispatch(event: NoteEvent): void {
    for (const handler of this.handlers) {
      handler(event)
    }
  }
}

export const noteEventBus = new NoteEventBus()
