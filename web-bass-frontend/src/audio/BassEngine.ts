import { noteEventBus } from './NoteEventBus'
import type { NoteEvent } from './types'
import { DEFAULT_ENGINE_PARAMS, type EngineParams } from './EngineParams'

function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12)
}

/** Maps tone 0–1 to low-pass cutoff frequency 200 Hz – 10 kHz (exponential). */
function toneToCutoff(tone: number): number {
  return 200 * Math.pow(50, tone)
}

/** Maps drive 0–1 to pre-clipper gain 1–8 (exponential for musical response). */
function driveToGain(drive: number): number {
  return Math.pow(8, drive)
}

/** Maps attack 0–1 (linear, user-facing %) to engine smoothing weight 0–1.
 * Exponent 0.3 biases most knob travel toward smooth/round — the musically useful range. */
function attackToEngine(attack: number): number {
  return Math.pow(attack, 0.3)
}

/**
 * Converts portamento time (ms) to the per-sample exponential smoothing coefficient
 * used in the worklet. Coefficient is chosen so currentFreq reaches 99% of targetFreq
 * in exactly `ms` milliseconds.
 */
function portamentoCoeff(ms: number, sampleRate: number): number {
  if (ms <= 0) return 1.0
  return 1 - Math.pow(0.01, 1000 / (ms * sampleRate))
}

/** Fixed tanh soft-clip curve (k=3). Gentle at low input, saturates near ±1. */
function makeSoftClipCurve(): Float32Array<ArrayBuffer> {
  const n = 256
  const curve = new Float32Array(n)
  const k = Math.tanh(3)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1
    curve[i] = Math.tanh(3 * x) / k
  }
  return curve
}

const MAX_FRETS = 20

const STRINGS = [
  { name: 'E', channel: 1, openNote: 28 },
  { name: 'A', channel: 2, openNote: 33 },
  { name: 'D', channel: 3, openNote: 38 },
  { name: 'G', channel: 4, openNote: 43 },
] as const

class StringVoice {
  private readonly node: AudioWorkletNode
  // Scales the global dampFreq param so higher strings retain more harmonics.
  // Derived from the string's open-note frequency relative to the lowest string.
  private readonly dampFreqMult: number

  constructor(ctx: AudioContext, destination: AudioNode, dampFreqMult: number) {
    this.node = new AudioWorkletNode(ctx, 'bass-string-processor')
    this.node.connect(destination)
    this.dampFreqMult = dampFreqMult
  }

  pluck(frequency: number, velocity: number, attack: number): void {
    this.node.port.postMessage({ type: 'pluck', frequency, velocity, attack })
  }

  setPitch(frequency: number): void {
    this.node.port.postMessage({ type: 'setPitch', frequency })
  }

  mute(): void {
    this.node.port.postMessage({ type: 'mute' })
  }

  setSustain(value: boolean): void {
    this.node.port.postMessage({ type: 'setSustain', value })
  }

  setReleaseTime(ms: number): void {
    this.node.port.postMessage({ type: 'setReleaseTime', value: ms })
  }

  setDampFreq(hz: number): void {
    this.node.port.postMessage({ type: 'setDampFreq', value: hz * this.dampFreqMult })
  }

  setDampAmount(amount: number): void {
    this.node.port.postMessage({ type: 'setDampAmount', value: amount })
  }

  setPortamento(active: boolean, coeff: number): void {
    this.node.port.postMessage({ type: 'setPortamento', active, coeff })
  }

  dispose(): void {
    this.node.disconnect()
  }
}

export class BassEngine {
  readonly ctx: AudioContext
  // Signal chain: voices → toneFilter → eqLow → eqMid → eqHigh → driveGain → clipper → master → destination
  private readonly toneFilter: BiquadFilterNode
  private readonly eqLow:      BiquadFilterNode
  private readonly eqMid:      BiquadFilterNode
  private readonly eqHigh:     BiquadFilterNode
  private readonly driveGain:  GainNode
  private readonly clipper:    WaveShaperNode
  private readonly master:     GainNode
  private readonly voices = new Map<number, StringVoice>()
  private unsubscribe: (() => void) | null = null
  private params: EngineParams = { ...DEFAULT_ENGINE_PARAMS }
  // Ordered by press time: last element = most recently pressed note still held.
  private readonly heldNotes = new Map<number, number[]>()

  constructor() {
    this.ctx = new AudioContext()
    const p  = DEFAULT_ENGINE_PARAMS

    // Tone low-pass
    this.toneFilter = this.ctx.createBiquadFilter()
    this.toneFilter.type = 'lowpass'
    this.toneFilter.frequency.value = toneToCutoff(p.tone)

    // 3-band EQ
    this.eqLow = this.ctx.createBiquadFilter()
    this.eqLow.type = 'lowshelf'
    this.eqLow.frequency.value = 80
    this.eqLow.gain.value = p.eqLow

    this.eqMid = this.ctx.createBiquadFilter()
    this.eqMid.type = 'peaking'
    this.eqMid.frequency.value = 600
    this.eqMid.Q.value = 1.5
    this.eqMid.gain.value = p.eqMid

    this.eqHigh = this.ctx.createBiquadFilter()
    this.eqHigh.type = 'highshelf'
    this.eqHigh.frequency.value = 4000
    this.eqHigh.gain.value = p.eqHigh

    // Soft-clip amp
    this.driveGain = this.ctx.createGain()
    this.driveGain.gain.value = driveToGain(p.drive)

    this.clipper = this.ctx.createWaveShaper()
    this.clipper.curve = makeSoftClipCurve()
    this.clipper.oversample = '4x'

    // Master volume
    this.master = this.ctx.createGain()
    this.master.gain.value = p.volume

    // Wire chain
    this.toneFilter.connect(this.eqLow)
    this.eqLow.connect(this.eqMid)
    this.eqMid.connect(this.eqHigh)
    this.eqHigh.connect(this.driveGain)
    this.driveGain.connect(this.clipper)
    this.clipper.connect(this.master)
    this.master.connect(this.ctx.destination)
  }

  async start(): Promise<void> {
    await this.ctx.audioWorklet.addModule(
      new URL('./bass-string-processor.js', import.meta.url)
    )
    // Multiplier is the string's open-note frequency relative to the lowest string (E).
    // Higher strings get a proportionally higher effective dampFreq so they ring out more.
    const baseFreq = midiToFreq(STRINGS[0].openNote)
    for (const { channel, openNote } of STRINGS) {
      const dampFreqMult = midiToFreq(openNote) / baseFreq
      this.voices.set(channel, new StringVoice(this.ctx, this.toneFilter, dampFreqMult))
    }
    // Push current params into each worklet immediately — each voice gets its own
    // pitch-scaled dampFreq rather than the worklet's hardcoded constructor default.
    for (const voice of this.voices.values()) {
      voice.setSustain(this.params.sustain)
      voice.setReleaseTime(this.params.releaseTime)
      voice.setDampFreq(this.params.dampFreq)
      voice.setDampAmount(this.params.dampAmount)
    }
    this.unsubscribe = noteEventBus.subscribe(this.handleNote)
  }

  stop(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
    for (const v of this.voices.values()) v.dispose()
    this.voices.clear()
    this.heldNotes.clear()
    this.ctx.close()
  }

  setParams(updates: Partial<EngineParams>): void {
    this.params = { ...this.params, ...updates }
    const t = this.ctx.currentTime

    // Tone filter (continuous)
    if ('tone' in updates)
      this.toneFilter.frequency.setTargetAtTime(toneToCutoff(updates.tone!), t, 0.01)

    // EQ (continuous)
    if ('eqLow' in updates)  this.eqLow.gain.setTargetAtTime(updates.eqLow!, t, 0.01)
    if ('eqMid' in updates)  this.eqMid.gain.setTargetAtTime(updates.eqMid!, t, 0.01)
    if ('eqHigh' in updates) this.eqHigh.gain.setTargetAtTime(updates.eqHigh!, t, 0.01)

    // Amp (continuous)
    if ('drive' in updates)  this.driveGain.gain.setTargetAtTime(driveToGain(updates.drive!), t, 0.01)
    if ('volume' in updates) this.master.gain.setTargetAtTime(updates.volume!, t, 0.01)

    // Envelope + damping — broadcast to worklets
    const needsPortamentoUpdate = 'portamento' in updates || 'portamentoTime' in updates
    for (const voice of this.voices.values()) {
      if ('sustain' in updates)     voice.setSustain(updates.sustain!)
      if ('releaseTime' in updates) voice.setReleaseTime(updates.releaseTime!)
      if ('dampFreq' in updates)    voice.setDampFreq(updates.dampFreq!)
      if ('dampAmount' in updates)  voice.setDampAmount(updates.dampAmount!)
      if (needsPortamentoUpdate) {
        voice.setPortamento(
          this.params.portamento,
          portamentoCoeff(this.params.portamentoTime, this.ctx.sampleRate),
        )
      }
      // attack and retrigger are applied per-pluck via handleNote
    }
  }

  private readonly handleNote = (event: NoteEvent): void => {
    if (this.ctx.state === 'suspended') this.ctx.resume()

    const voice = this.voices.get(event.channel)
    if (!voice) return

    // Reject notes outside the physical fret range for this string voice.
    const stringDef = STRINGS.find(s => s.channel === event.channel)
    if (stringDef) {
      const fret = event.note - stringDef.openNote
      if (fret < 0 || fret > MAX_FRETS) return
    }

    if (event.type === 'noteOn') {
      const held = this.heldNotes.get(event.channel) ?? []
      const isFirstNote = held.length === 0

      // Remove any prior entry for this note so it moves to "most recent" position.
      const existing = held.indexOf(event.note)
      if (existing !== -1) held.splice(existing, 1)
      held.push(event.note)
      this.heldNotes.set(event.channel, held)

      if (isFirstNote || this.params.retrigger) {
        voice.pluck(midiToFreq(event.note), event.velocity, attackToEngine(this.params.attack))
      } else {
        // Legato — pitch change only; envelope continues uninterrupted.
        // Portamento (if enabled) is handled inside the worklet via setPitch.
        voice.setPitch(midiToFreq(event.note))
      }
    } else {
      const held = this.heldNotes.get(event.channel)
      if (held) {
        const idx = held.indexOf(event.note)
        if (idx !== -1) held.splice(idx, 1)
        if (held.length === 0) {
          voice.mute()
        } else {
          // Return to the most recently pressed note still held.
          voice.setPitch(midiToFreq(held[held.length - 1]))
        }
      }
    }
  }
}
