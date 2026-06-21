import { useMidiDevices } from '../../hooks/useMidiDevices'

const isFirefox = typeof navigator !== 'undefined' && /Firefox\//i.test(navigator.userAgent)

export default function MidiSection() {
  const { supported, devices, error } = useMidiDevices()

  return (
    <section className="cm-section">
      <h2 className="cm-section-title">MIDI Controller</h2>

      {!supported && (
        <p className="cm-notice cm-notice--warn">
          Web MIDI is not supported in this browser. Use Chrome or Edge for native MIDI support.
        </p>
      )}

      {supported && error && (
        <div className="cm-notice cm-notice--error">
          <strong>MIDI unavailable</strong>
          {isFirefox ? (
            <p style={{ margin: '6px 0 0' }}>
              Firefox requires the <strong>Jazz-Soft WebMIDI</strong> browser extension to access
              MIDI devices. Search for <em>"Jazz-Soft WebMIDI"</em> in Firefox Add-ons, or switch
              to Chrome or Edge for built-in Web MIDI support.
            </p>
          ) : (
            <p style={{ margin: '6px 0 0' }}>{error}</p>
          )}
        </div>
      )}

      {supported && !error && (
        <ul className="cm-device-list">
          {devices.length === 0
            ? <li className="cm-device cm-device--empty">No MIDI inputs detected.</li>
            : devices.map(d => (
                <li key={d.id} className="cm-device">
                  <span className={`cm-status-dot${d.state === 'connected' ? ' cm-status-dot--on' : ''}`} />
                  <span className="cm-device-name">{d.name}</span>
                  <span className="cm-device-state">{d.state}</span>
                </li>
              ))
          }
        </ul>
      )}

      <p className="cm-notice cm-notice--info">CC controller mapping coming soon.</p>
    </section>
  )
}
