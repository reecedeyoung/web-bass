import type { InputSource } from './InputSource'
import { noteEventBus } from './NoteEventBus'
import type { KeyMapping } from '../mappings/types'
import defaultLayout from '../mappings/default-bass-layout.json'

const DEFAULT_VELOCITY = 100

export class KeyboardInputSource implements InputSource {
  private mapping: KeyMapping
  private readonly heldKeys = new Set<string>()

  constructor(mapping: KeyMapping = defaultLayout) {
    this.mapping = mapping
  }

  /** Swap the active mapping at runtime (e.g. from the Control Mapping tab). */
  setMapping(mapping: KeyMapping): void {
    this.heldKeys.clear()
    this.mapping = mapping
  }

  connect(): void {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('focusin', this.onFocusIn)
  }

  disconnect(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('focusin', this.onFocusIn)
    this.heldKeys.clear()
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat || e.metaKey || e.ctrlKey) return
    if (document.querySelector('[role="dialog"]')) return
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    const binding = this.mapping.mappings[key]
    if (!binding || this.heldKeys.has(key)) return

    this.heldKeys.add(key)
    noteEventBus.dispatch({
      type: 'noteOn',
      note: binding.note,
      velocity: DEFAULT_VELOCITY,
      channel: binding.channel,
      timestamp: performance.now(),
      source: 'keyboard',
    })
  }

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    const binding = this.mapping.mappings[key]
    if (!binding) return

    this.heldKeys.delete(key)
    noteEventBus.dispatch({
      type: 'noteOff',
      note: binding.note,
      velocity: 0,
      channel: binding.channel,
      timestamp: performance.now(),
      source: 'keyboard',
    })
  }

  private readonly onFocusIn = (e: FocusEvent): void => {
    const tag = (e.target as HTMLElement).tagName
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !(e.target as HTMLElement).isContentEditable) return
    for (const key of this.heldKeys) {
      const binding = this.mapping.mappings[key]
      if (!binding) continue
      noteEventBus.dispatch({
        type: 'noteOff',
        note: binding.note,
        velocity: 0,
        channel: binding.channel,
        timestamp: performance.now(),
        source: 'keyboard',
      })
    }
    this.heldKeys.clear()
  }
}
