/**
 * Karplus-Strong bass string synthesis — AudioWorklet thread.
 *
 * Portamento design:
 *   Uses a large circular buffer with separate integer writePtr and fractional
 *   readPtr. The effective delay D = writePtr − readPtr determines pitch
 *   (f = sampleRate / D). Portamento smooths currentFreq toward targetFreq
 *   each sample; readPtr is recomputed from the new D so pitch slides without
 *   a buffer restart or clicks. Linear interpolation between adjacent samples
 *   handles sub-sample readPtr positions.
 *
 * Retrigger:
 *   Handled upstream (BassEngine). When retrigger is off, the engine sends
 *   'setPitch' instead of 'pluck', so the excitation buffer is never reset.
 *
 * Damping / high-shelf design: (unchanged)
 *   Two cascaded first-order IIR high-shelf stages in the KS feedback loop
 *   give 12 dB/oct slope and G² HF gain per trip.
 */

const DECAY_SUSTAIN = 0.99
const DAMP_G_FLOOR  = 0.93

function muteGainPerSample(ms) {
  return Math.exp(-6908 / (ms * sampleRate))
}

class BassStringProcessor extends AudioWorkletProcessor {
  constructor() {
    super()

    // Large buffer — covers 20 Hz at any realistic sample rate.
    const maxN   = Math.ceil(sampleRate / 20) + 8
    this.buf     = new Float32Array(maxN)
    this.maxN    = maxN

    // Separate read (fractional) / write (integer) pointers.
    this.writePtr     = 0
    this.readPtr      = 0.0
    this.currentFreq  = 440.0   // slides toward targetFreq each sample
    this.targetFreq   = 440.0
    this.currentDelay = sampleRate / 440.0

    this.active     = false
    this.muting     = false
    this.onsetRamp  = false
    this.onsetStep  = 0
    this.sustain    = false
    this.outputGain = 1.0
    this.muteStep   = muteGainPerSample(150)

    this.portamentoActive = false
    this.portamentoCoeff  = 0.001

    this.dampFreq   = 100
    this.dampAmount = 0.5
    this.shelfX1 = 0;  this.shelfY1 = 0
    this.shelfX2 = 0;  this.shelfY2 = 0
    this.updateShelfCoeffs()

    this.port.onmessage = ({ data }) => {
      switch (data.type) {
        case 'pluck':
          this.pluck(data.frequency, data.velocity, data.attack ?? 0.3)
          break
        case 'setPitch':
          this.setPitch(data.frequency)
          break
        case 'mute':
          if (!this.sustain) this.muting = true
          break
        case 'setSustain':
          this.sustain = data.value
          break
        case 'setReleaseTime':
          this.muteStep = muteGainPerSample(data.value)
          break
        case 'setDampFreq':
          this.dampFreq = data.value
          this.updateShelfCoeffs()
          break
        case 'setDampAmount':
          this.dampAmount = data.value
          this.updateShelfCoeffs()
          break
        case 'setPortamento':
          this.portamentoActive = data.active
          this.portamentoCoeff  = data.coeff
          break
      }
    }
  }

  updateShelfCoeffs() {
    const G      = Math.pow(DAMP_G_FLOOR, this.dampAmount)
    const safeHz = Math.min(this.dampFreq, sampleRate * 0.45)
    const K      = Math.tan(Math.PI * safeHz / sampleRate)
    const norm   = 1 / (1 + K)
    this.shelfB0 = (G + K) * norm
    this.shelfB1 = (K - G) * norm
    this.shelfFb = (1 - K) * norm
  }

  pluck(frequency, velocity, attack) {
    const prevFreq  = this.currentFreq
    const prevDelay = this.currentDelay
    const wasActive = this.active

    const N     = Math.max(2, Math.round(sampleRate / frequency))
    const buf   = this.buf
    const maxN  = this.maxN
    const start = this.writePtr   // fill excitation starting here

    const vel = velocity / 127
    const amp = vel * 0.7

    // Triangular displacement (with noise blend controlled by attack)
    const pluckPos = 0.12 + vel * 0.05
    const peak     = Math.max(1, Math.round(pluckPos * N))
    for (let i = 0; i < N; i++) {
      const p = (start + i) % maxN
      buf[p] = i < peak
        ? amp * (i / peak)
        : amp * (N - 1 - i) / (N - 1 - peak)
    }

    // First DC removal (triangle is always positive)
    let sum = 0
    for (let i = 0; i < N; i++) sum += buf[(start + i) % maxN]
    const dc1 = sum / N
    for (let i = 0; i < N; i++) buf[(start + i) % maxN] -= dc1

    // Noise blend: attack=0 → full noise (clicky), attack=1 → pure triangle
    const noiseMix = 1.0 - attack
    for (let i = 0; i < N; i++) {
      buf[(start + i) % maxN] += (Math.random() * 2 - 1) * amp * noiseMix
    }

    // Second DC removal (noise may reintroduce offset)
    sum = 0
    for (let i = 0; i < N; i++) sum += buf[(start + i) % maxN]
    const dc2 = sum / N
    for (let i = 0; i < N; i++) buf[(start + i) % maxN] -= dc2

    // Smoothing passes (attack=1 → 3 passes of moving average)
    const passes = Math.round(attack * 3)
    for (let p = 0; p < passes; p++) {
      for (let i = 1; i < N; i++) {
        const curr = (start + i) % maxN
        const prev = (start + i - 1) % maxN
        buf[curr] = 0.5 * (buf[curr] + buf[prev])
      }
    }

    // readPtr at beginning of excitation; writePtr N samples ahead.
    // Effective delay = N → fundamental = sampleRate / N.
    this.readPtr      = start
    this.writePtr     = (start + N) % maxN
    this.currentFreq  = frequency
    this.targetFreq   = frequency
    this.currentDelay = N

    // When portamento is active and the string was already ringing, preserve the
    // previous frequency as the slide origin so pitch glides to the new note.
    if (this.portamentoActive && wasActive) {
      this.currentFreq  = prevFreq
      this.currentDelay = prevDelay
      this.readPtr      = (this.writePtr + maxN * 2 - prevDelay) % maxN
    }

    this.outputGain = 0.0
    this.onsetStep  = 1.0 / (0.001 * sampleRate)
    this.onsetRamp  = true
    this.muting     = false
    this.active     = true

    this.shelfX1 = 0;  this.shelfY1 = 0
    this.shelfX2 = 0;  this.shelfY2 = 0
  }

  setPitch(frequency) {
    this.targetFreq = frequency
    if (!this.portamentoActive) {
      this.currentFreq  = frequency
      this.currentDelay = sampleRate / frequency
    }
    // Legato: cancel a fade-out in progress so the string keeps ringing.
    if (this.active && this.muting) {
      this.muting = false
    }
  }

  process(_inputs, outputs) {
    const out = outputs[0][0]

    if (!this.active) {
      out.fill(0)
      return true
    }

    const buf  = this.buf
    const maxN = this.maxN
    const b0   = this.shelfB0
    const b1   = this.shelfB1
    const fb   = this.shelfFb

    for (let i = 0; i < out.length; i++) {
      const rp = this.readPtr
      const wp = this.writePtr

      // Fractional read via linear interpolation
      const i0   = Math.floor(rp) % maxN
      const i1   = (i0 + 1) % maxN
      const frac = rp - Math.floor(rp)
      const sample = (1 - frac) * buf[i0] + frac * buf[i1]

      // KS averaging filter + cascaded high-shelf (12 dB/oct)
      const avg      = DECAY_SUSTAIN * 0.5 * (buf[i0] + buf[i1])
      const stage1   = b0 * avg    + b1 * this.shelfX1 + fb * this.shelfY1
      this.shelfX1   = avg;   this.shelfY1 = stage1
      const dampened = b0 * stage1 + b1 * this.shelfX2 + fb * this.shelfY2
      this.shelfX2   = stage1; this.shelfY2 = dampened

      buf[wp]       = dampened
      this.writePtr = (wp + 1) % maxN

      // Portamento: exponentially smooth currentFreq toward targetFreq.
      // 0.1 Hz threshold snaps to target to prevent infinite drift.
      if (Math.abs(this.currentFreq - this.targetFreq) > 0.1) {
        this.currentFreq  += (this.targetFreq - this.currentFreq) * this.portamentoCoeff
        this.currentDelay  = sampleRate / this.currentFreq
      } else {
        this.currentFreq  = this.targetFreq
        this.currentDelay = sampleRate / this.targetFreq
      }

      // Recompute readPtr so it stays currentDelay samples behind writePtr.
      // + maxN*2 keeps the expression positive before the modulo.
      this.readPtr = (this.writePtr + maxN * 2 - this.currentDelay) % maxN

      out[i] = sample * this.outputGain

      if (this.onsetRamp) {
        this.outputGain += this.onsetStep
        if (this.outputGain >= 1.0) {
          this.outputGain = 1.0
          this.onsetRamp  = false
        }
      } else if (this.muting) {
        this.outputGain *= this.muteStep
        if (this.outputGain < 1e-6) {
          out.fill(0, i + 1)
          this.active = false
          return true
        }
      }
    }

    return true
  }
}

registerProcessor('bass-string-processor', BassStringProcessor)
