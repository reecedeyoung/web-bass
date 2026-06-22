import './BassInfoOverlay.css'

const STRINGS = [
  { label: 'G', keys: '1  2  3  4  5  6  7  8  9  0', range: 'G2 – E3' },
  { label: 'D', keys: 'Q  W  E  R  T  Y  U  I  O  P', range: 'D2 – B2' },
  { label: 'A', keys: 'A  S  D  F  G  H  J  K  L  ;', range: 'A1 – F#2' },
  { label: 'E', keys: 'Z  X  C  V  B  N  M  ,  .  /', range: 'E1 – C#2' },
]

const TIPS = [
  { head: 'Legato', body: 'Turn Retrigger OFF — overlapping notes on the same string change pitch without restarting the attack.' },
  { head: 'Slides', body: 'Enable Portamento and dial in a Slide Time to glide smoothly between pitches.' },
  { head: 'Sustain', body: 'Sustain ON holds notes until you release the key, bypassing the Release envelope.' },
  { head: 'Tone', body: 'Use the Tone knob for a quick bright/dark sweep; the Amp section has a three-band EQ and soft-clip Drive.' },
]

interface BassInfoOverlayProps {
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export default function BassInfoOverlay({ onMouseEnter, onMouseLeave }: BassInfoOverlayProps) {
  return (
    <div
      className="bio-overlay"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bio-panel">

        <div className="bio-header">
          <h2 className="bio-title">Web Bass</h2>
          <p className="bio-subtitle">
            Physical-modelling bass synthesizer built on the Web Audio API.
            Pluck strings by pressing keys, connect a MIDI controller, or
            play MIDI files in real time.
          </p>
        </div>

        <div className="bio-grid">

          {/* ── Keyboard layout ── */}
          <section className="bio-card">
            <h3 className="bio-card-title">Keyboard</h3>
            <p className="bio-card-hint">One row per string. First key = open string, each subsequent key adds one fret.</p>
            <table className="bio-kb-table">
              <thead>
                <tr>
                  <th>String</th>
                  <th>Keys</th>
                  <th>Range</th>
                </tr>
              </thead>
              <tbody>
                {STRINGS.map(s => (
                  <tr key={s.label}>
                    <td><span className="bio-string-badge">{s.label}</span></td>
                    <td><code className="bio-keys">{s.keys}</code></td>
                    <td className="bio-range">{s.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="bio-card-hint" style={{ marginTop: '10px' }}>
              Retune strings and remap keys in the <strong>Control Mapping</strong> tab.
            </p>
          </section>

          {/* ── Tips column ── */}
          <section className="bio-card">
            <h3 className="bio-card-title">MIDI</h3>
            <p className="bio-card-hint">
              Connect any USB MIDI bass or keyboard. The synth responds to
              Note On / Note Off on all channels with full velocity sensitivity.
              Chrome and Edge support Web MIDI natively.
            </p>

            <h3 className="bio-card-title" style={{ marginTop: '20px' }}>Tips</h3>
            <ul className="bio-tips">
              {TIPS.map(t => (
                <li key={t.head}>
                  <strong>{t.head}</strong> — {t.body}
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>
    </div>
  )
}
