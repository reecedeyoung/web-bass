import { Fragment, useCallback, useRef, useState } from 'react'
import { useAudio } from '../../context/AudioContext'
import type { KeyMapping } from '../../mappings/types'
import defaultLayout from '../../mappings/default-bass-layout.json'
import { PRESETS } from '../../mappings/presets'
import {
  STRING_ROWS,
  OPEN_NOTE_OPTIONS,
  deriveOpenNotes,
  buildMappingFromTunings,
  midiToName,
} from './keyboardUtils'

const MIN_OPEN_NOTE = OPEN_NOTE_OPTIONS[0].value
const MAX_OPEN_NOTE = OPEN_NOTE_OPTIONS[OPEN_NOTE_OPTIONS.length - 1].value

export default function KeyboardSection() {
  const { keyboard } = useAudio()
  const [mapping,      setMapping]      = useState<KeyMapping>(defaultLayout as KeyMapping)
  const [advanced,     setAdvanced]     = useState(false)
  const [uploadError,  setUploadError]  = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openNotes = deriveOpenNotes(mapping)

  const applyMapping = useCallback((m: KeyMapping) => {
    setMapping(m)
    keyboard?.setMapping(m)
  }, [keyboard])

  const handleTuneStep = (stringIdx: number, delta: number) => {
    const next = Math.max(MIN_OPEN_NOTE, Math.min(MAX_OPEN_NOTE, openNotes[stringIdx] + delta))
    if (next === openNotes[stringIdx]) return
    const notes = openNotes.map((n, i) => i === stringIdx ? next : n)
    applyMapping(buildMappingFromTunings(notes))
  }

  const handlePreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = PRESETS.find(p => p.name === e.target.value)
    if (preset) applyMapping(preset)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Partial<KeyMapping>
        if (!parsed.name || typeof parsed.mappings !== 'object') {
          throw new Error('Missing required fields: name, mappings')
        }
        applyMapping(parsed as KeyMapping)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Invalid JSON mapping file.')
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-uploaded if needed
    e.target.value = ''
  }

  return (
    <section className="cm-section">
      <h2 className="cm-section-title">Keyboard Mapping</h2>

      {/* ── String tuning ── */}
      <div className="cm-subsection">
        <h3 className="cm-subsection-title">String Tuning</h3>
        <p className="cm-hint">
          Set each string's open note. All fret keys on that row shift to match.
        </p>

        <div className="cm-string-grid">
          {/* Header */}
          <span className="cm-col-label">Tune</span>
          <span className="cm-col-label">String</span>
          <span className="cm-col-label">Keys</span>
          <span className="cm-col-label">Range</span>

          {STRING_ROWS.map((row, i) => {
            const open = openNotes[i]
            const high = open + row.keys.length - 1
            return (
              <Fragment key={row.name}>
                <div className="cm-tune-ctrl">
                  <button
                    className="cm-tune-btn"
                    onClick={() => handleTuneStep(i, -1)}
                    disabled={open <= MIN_OPEN_NOTE}
                    aria-label="Tune down one semitone"
                  >▼</button>
                  <span className="cm-tune-note">{midiToName(open)}</span>
                  <button
                    className="cm-tune-btn"
                    onClick={() => handleTuneStep(i, +1)}
                    disabled={open >= MAX_OPEN_NOTE}
                    aria-label="Tune up one semitone"
                  >▲</button>
                </div>
                <span className="cm-string-badge">{row.name}</span>
                <span className="cm-key-range">
                  {row.keys[0].toUpperCase()}–{row.keys[row.keys.length - 1].toUpperCase()}
                </span>
                <span className="cm-fret-range">
                  {midiToName(open)} – {midiToName(high)}
                </span>
              </Fragment>
            )
          })}
        </div>
      </div>

      {/* ── Advanced toggle ── */}
      <button
        className="cm-advanced-toggle"
        onClick={() => setAdvanced(v => !v)}
        aria-expanded={advanced}
      >
        <span className="cm-advanced-arrow">{advanced ? '▲' : '▼'}</span>
        Advanced
      </button>

      {/* ── Advanced section ── */}
      {advanced && (
        <div className="cm-subsection">
          <div className="cm-field">
            <label htmlFor="cm-preset-select" className="cm-label">Load preset</label>
            <select
              id="cm-preset-select"
              className="cm-note-select"
              value={mapping.name}
              onChange={handlePreset}
            >
              {PRESETS.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="cm-field">
            <label className="cm-label">Upload custom mapping</label>
            <div className="cm-upload-row">
              <button
                className="cm-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose .json file
              </button>
              <span className="cm-upload-name">
                {mapping.name !== defaultLayout.name ? mapping.name : 'No file chosen'}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            {uploadError && (
              <p className="cm-notice cm-notice--error">{uploadError}</p>
            )}
            <p className="cm-hint">
              Must conform to <code>key-mapping.schema.json</code>.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
