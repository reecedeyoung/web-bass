import { useAudio } from '../../context/AudioContext'
import RotaryKnob from '../ui/RotaryKnob'
import MetalSwitch from '../ui/MetalSwitch'
import './SettingsView.css'

export default function SettingsView() {
  const { params, setParams } = useAudio()

  return (
    <div className="settings-view">

      {/* ── Continuous parameters ─────────────────────────────── */}
      <section className="sv-section">
        <header className="sv-section-header">
          <h2 className="sv-section-title">Tone</h2>
          <span className="sv-section-badge sv-section-badge--live">live</span>
        </header>
        <p className="sv-section-hint">Changes take effect immediately.</p>

        <div className="sv-knobs">
          <RotaryKnob
            label="Tone"
            minLabel="Dark"
            maxLabel="Bright"
            min={0} max={1} step={0.01}
            value={params.tone}
            onChange={v => setParams({ tone: v })}
            formatValue={v => `${Math.round(v * 100)}%`}
          />
        </div>
      </section>

      {/* ── Damping parameters ────────────────────────────────── */}
      <section className="sv-section">
        <header className="sv-section-header">
          <h2 className="sv-section-title">Damping</h2>
          <span className="sv-section-badge sv-section-badge--live">live</span>
        </header>
        <p className="sv-section-hint">Upper harmonics fade faster than the fundamental.</p>

        <div className="sv-knobs">
          <RotaryKnob
            label="Frequency"
            minLabel="Low"
            maxLabel="High"
            min={60} max={400} step={5}
            value={params.dampFreq}
            onChange={v => setParams({ dampFreq: v })}
            formatValue={v => `${Math.round(v)} Hz`}
            sensitivity={200}
            curve="exponential"
          />
          <RotaryKnob
            label="Amount"
            minLabel="Light"
            maxLabel="Heavy"
            min={0.3} max={1} step={0.01}
            value={params.dampAmount}
            onChange={v => setParams({ dampAmount: v })}
            formatValue={v => `${Math.round(v * 100)}%`}
          />
        </div>
      </section>

      {/* ── Amp parameters ────────────────────────────────────── */}
      <section className="sv-section">
        <header className="sv-section-header">
          <h2 className="sv-section-title">Amp</h2>
          <span className="sv-section-badge sv-section-badge--live">live</span>
        </header>
        <p className="sv-section-hint">Three-band EQ, soft-clip drive, and master volume.</p>

        <div className="sv-knobs">
          <RotaryKnob
            label="Low"
            minLabel="-12"
            maxLabel="+12"
            min={-12} max={12} step={0.5}
            value={params.eqLow}
            onChange={v => setParams({ eqLow: v })}
            formatValue={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)} dB`}
          />
          <RotaryKnob
            label="Mid"
            minLabel="-12"
            maxLabel="+12"
            min={-12} max={12} step={0.5}
            value={params.eqMid}
            onChange={v => setParams({ eqMid: v })}
            formatValue={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)} dB`}
          />
          <RotaryKnob
            label="High"
            minLabel="-12"
            maxLabel="+12"
            min={-12} max={12} step={0.5}
            value={params.eqHigh}
            onChange={v => setParams({ eqHigh: v })}
            formatValue={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)} dB`}
          />
          <RotaryKnob
            label="Drive"
            minLabel="Clean"
            maxLabel="Sat"
            min={0} max={1} step={0.01}
            value={params.drive}
            onChange={v => setParams({ drive: v })}
            formatValue={v => `${Math.round(v * 100)}%`}
          />
          <RotaryKnob
            label="Volume"
            minLabel="0"
            maxLabel="10"
            min={0} max={1} step={0.01}
            value={params.volume}
            onChange={v => setParams({ volume: v })}
            formatValue={v => `${Math.round(v * 100)}%`}
          />
        </div>
      </section>

      {/* ── Envelope parameters ───────────────────────────────── */}
      <section className="sv-section">
        <header className="sv-section-header">
          <h2 className="sv-section-title">Envelope</h2>
          <span className="sv-section-badge sv-section-badge--next">next note</span>
        </header>
        <p className="sv-section-hint">Changes take effect on the next note played.</p>

        <div className="sv-knobs">
          <RotaryKnob
            label="Attack"
            minLabel="Clicky"
            maxLabel="Smooth"
            min={0} max={1} step={0.01}
            value={params.attack}
            onChange={v => setParams({ attack: v })}
            formatValue={v => `${Math.round(v * 100)}%`}
          />

          <div className="sv-switch-param">
            <MetalSwitch
              label="Sustain"
              value={params.sustain}
              onChange={v => setParams({ sustain: v })}
            />
          </div>

          <RotaryKnob
            label="Release"
            minLabel="Fast"
            maxLabel="Slow"
            min={10} max={2000} step={10}
            value={params.releaseTime}
            onChange={v => setParams({ releaseTime: v })}
            formatValue={v => `${Math.round(v)}ms`}
            sensitivity={240}
            curve="exponential"
            disabled={params.sustain}
          />

          <div className="sv-switch-param">
            <MetalSwitch
              label="Retrigger"
              value={params.retrigger}
              onChange={v => setParams({ retrigger: v })}
            />
          </div>
        </div>

        <p className="sv-envelope-note">
          Release only applies when Sustain is <strong>OFF</strong>.
          Retrigger <strong>OFF</strong> = legato: overlapping notes on the same string
          change pitch without restarting the attack.
        </p>
      </section>

      {/* ── Portamento ────────────────────────────────────────── */}
      <section className="sv-section">
        <header className="sv-section-header">
          <h2 className="sv-section-title">Portamento</h2>
          <span className="sv-section-badge sv-section-badge--next">next note</span>
        </header>
        <p className="sv-section-hint">Pitch slides between notes on the same string. Most expressive with Retrigger OFF.</p>

        <div className="sv-knobs">
          <div className="sv-switch-param">
            <MetalSwitch
              label="Portamento"
              value={params.portamento}
              onChange={v => setParams({ portamento: v })}
            />
          </div>

          <RotaryKnob
            label="Slide Time"
            minLabel="Fast"
            maxLabel="Slow"
            min={10} max={1000} step={10}
            value={params.portamentoTime}
            onChange={v => setParams({ portamentoTime: v })}
            formatValue={v => `${Math.round(v)}ms`}
            sensitivity={200}
            curve="exponential"
            disabled={!params.portamento}
          />
        </div>
      </section>

    </div>
  )
}
