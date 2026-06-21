export interface EngineParams {
  // ── Envelope (read once at note-on) ──────────────────────────────────────
  /** 0 = clicky/punchy (raw noise), 1 = smooth/round (pre-filtered noise) */
  attack: number
  /** When true, strings ring at natural decay after note-off; mute is ignored */
  sustain: boolean
  /** Milliseconds to reach -60 dB after note-off — only active when sustain=false */
  releaseTime: number
  /** When true, every note-on restarts the pluck; when false, overlapping notes on the
   *  same string change pitch without retriggering the attack (legato) */
  retrigger: boolean
  /** When true, pitch changes on an active string slide over portamentoTime */
  portamento: boolean
  /** Milliseconds for the pitch to converge 99% of the way to the target */
  portamentoTime: number

  // ── Continuous (take effect immediately) ─────────────────────────────────
  /** 0 = dark/warm (low-pass ~200 Hz), 1 = bright/crisp (low-pass ~10 kHz) */
  tone: number
  /** Hz — high-shelf corner in KS feedback loop; harmonics above this decay faster */
  dampFreq: number
  /** 0 = no damping, 1 = maximum — controls shelf depth per pass */
  dampAmount: number
  // ── Amp ──────────────────────────────────────────────────────────────────
  /** dB — fixed low shelf at 80 Hz */
  eqLow: number
  /** dB — fixed mid peak at 600 Hz */
  eqMid: number
  /** dB — fixed high shelf at 4 kHz */
  eqHigh: number
  /** 0 = clean, 1 = heavy soft-clip saturation */
  drive: number
  /** 0–1 master output level */
  volume: number
}

export const DEFAULT_ENGINE_PARAMS: EngineParams = {
  attack:          0.3,
  sustain:         false,
  releaseTime:     150,
  retrigger:       true,
  portamento:      false,
  portamentoTime:  100,
  tone:        0.3,
  dampFreq:    100,
  dampAmount:  0.5,
  eqLow:       3,
  eqMid:       0,
  eqHigh:      0,
  drive:       0,
  volume:      0.8,
}
