import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useAudio } from '../../context/AudioContext'
import { useAuth } from '../../context/AuthContext'
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
import { fetchMappings, putMapping } from '../../lib/mappingsApi'

const MIN_OPEN_NOTE = OPEN_NOTE_OPTIONS[0].value
const MAX_OPEN_NOTE = OPEN_NOTE_OPTIONS[OPEN_NOTE_OPTIONS.length - 1].value
const MAPPING_ID    = 'default'

function minNotesFromMapping(m: KeyMapping): Map<number, number> {
  const result = new Map<number, number>()
  for (const binding of Object.values(m.mappings)) {
    const cur = result.get(binding.channel)
    if (cur === undefined || binding.note < cur) result.set(binding.channel, binding.note)
  }
  return result
}

export default function KeyboardSection() {
  const { keyboard, engine }                         = useAudio()
  const { identityId, isAuthenticated, openLoginModal } = useAuth()
  const [mapping,          setMapping]          = useState<KeyMapping>(defaultLayout as KeyMapping)
  const [pendingNotes,     setPendingNotes]     = useState<number[]>(() => deriveOpenNotes(defaultLayout as KeyMapping))
  const [pendingPreset,    setPendingPreset]    = useState(defaultLayout.name)
  const [uploadError,      setUploadError]      = useState<string | null>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const keyboardRef   = useRef(keyboard)
  const engineRef     = useRef(engine)
  useEffect(() => { keyboardRef.current = keyboard }, [keyboard])
  useEffect(() => { engineRef.current   = engine   }, [engine])

  const applyMapping = useCallback((m: KeyMapping) => {
    setMapping(m)
    keyboardRef.current?.setMapping(m)
    engineRef.current?.setChannelMinNotes(minNotesFromMapping(m))
    setPendingNotes(deriveOpenNotes(m))
  }, [])

  useEffect(() => {
    if (!identityId) return
    fetchMappings().then(mappings => {
      if (mappings.length > 0) applyMapping(mappings[0])
    }).catch(console.error)
  }, [identityId])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!identityId) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      putMapping(MAPPING_ID, mapping).catch(console.error)
    }, 1500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [mapping, identityId])

  function handleTuneStep(stringIdx: number, delta: number) {
    setPendingNotes(prev => {
      const next = [...prev]
      next[stringIdx] = Math.max(MIN_OPEN_NOTE, Math.min(MAX_OPEN_NOTE, prev[stringIdx] + delta))
      return next
    })
  }

  function handleApplyGenerate() {
    applyMapping(buildMappingFromTunings(pendingNotes))
  }

  function handleApplyLoad() {
    const preset = PRESETS.find(p => p.name === pendingPreset)
    if (preset) applyMapping(preset)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
    e.target.value = ''
  }

  return (
    <>
      {/* ── Generate Mapping ── */}
      <section className="cm-section">
        <h2 className="cm-section-title">Generate Mapping</h2>
        <p className="cm-hint">
          Set each string's open note. All fret keys on that row shift to match.
          {isAuthenticated && <span className="cm-save-indicator"> Changes are saved to your account automatically.</span>}
        </p>
        {!isAuthenticated && (
          <p className="cm-hint cm-hint--auth">
            <button className="cm-link-btn" onClick={openLoginModal}>Sign in</button>
            {' '}to save your tuning across sessions.
          </p>
        )}

        <div className="cm-string-grid">
          <span className="cm-col-label">Tune</span>
          <span className="cm-col-label">String</span>
          <span className="cm-col-label">Keys</span>
          <span className="cm-col-label">Range</span>

          {STRING_ROWS.map((row, i) => {
            const open = pendingNotes[i]
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

        <div className="cm-apply-row">
          <button className="cm-apply-btn" onClick={handleApplyGenerate}>Apply</button>
        </div>
      </section>

      {/* ── Load Mapping ── */}
      <section className="cm-section">
        <h2 className="cm-section-title">Load Mapping</h2>

        <div className="cm-load-row">
          <select
            className="cm-note-select"
            value={pendingPreset}
            onChange={e => setPendingPreset(e.target.value)}
          >
            {PRESETS.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          <button className="cm-apply-btn" onClick={handleApplyLoad}>
            Apply
          </button>
        </div>

        <div className="cm-upload-row" style={{ marginTop: 14 }}>
          <button
            className="cm-upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload .json
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
        <p className="cm-hint" style={{ marginTop: 6 }}>
          Must conform to <code>key-mapping.schema.json</code>.
        </p>
      </section>
    </>
  )
}
