import { useState } from 'react'
import { useAudio } from '../../context/AudioContext'
import { useAuth } from '../../context/AuthContext'
import { usePresets } from '../../presets/usePresets'
import type { Preset } from '../../presets/types'
import './PresetsView.css'

export default function PresetsView() {
  const { params, setParams } = useAudio()
  const { isAuthenticated, openLoginModal } = useAuth()
  const { builtIns, userPresets, activeId, isLoading, saveError, load, save, remove } = usePresets()
  const [saveName,  setSaveName]  = useState('')
  const [isSaving,  setIsSaving]  = useState(false)

  function handleLoad(preset: Preset) {
    setParams(load(preset))
  }

  async function handleSave() {
    const name = saveName.trim()
    if (!name) return
    setIsSaving(true)
    try {
      await save(name, params)
      setSaveName('')
    } catch {
      // error is displayed via saveError from usePresets
    } finally {
      setIsSaving(false)
    }
  }

  function PresetCard({ preset, deletable }: { preset: Preset; deletable: boolean }) {
    return (
      <div className={`preset-card${activeId === preset.id ? ' preset-card--active' : ''}`}>
        <button className="preset-card-load" onClick={() => handleLoad(preset)}>
          <span className="preset-card-name">{preset.name}</span>
          {preset.description && (
            <span className="preset-card-desc">{preset.description}</span>
          )}
        </button>
        {deletable && (
          <button
            className="preset-card-delete"
            onClick={() => remove(preset.id)}
            aria-label={`Delete ${preset.name}`}
          >
            ×
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="presets-view">
      <section className="presets-section">
        <h2 className="presets-section-title">Built-in</h2>
        <div className="presets-list">
          {builtIns.map(p => (
            <PresetCard key={p.id} preset={p} deletable={false} />
          ))}
        </div>
      </section>

      {!isAuthenticated ? (
        <section className="presets-section presets-auth-gate">
          <p className="presets-gate-text">Sign in to save and load your own presets.</p>
          <button className="presets-gate-btn" onClick={openLoginModal}>Sign in</button>
        </section>
      ) : (
        <>
          {isLoading ? (
            <section className="presets-section">
              <p className="presets-gate-text">Loading your presets…</p>
            </section>
          ) : userPresets.length > 0 && (
            <section className="presets-section">
              <h2 className="presets-section-title">Saved</h2>
              <div className="presets-list">
                {userPresets.map(p => (
                  <PresetCard key={p.id} preset={p} deletable={true} />
                ))}
              </div>
            </section>
          )}

          <section className="presets-section">
            <h2 className="presets-section-title">Save current</h2>
            <div className="presets-save-row">
              <input
                className="presets-save-input"
                type="text"
                placeholder="Preset name"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                maxLength={64}
              />
              <button
                className="presets-save-btn"
                onClick={handleSave}
                disabled={!saveName.trim() || isSaving}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {saveError && (
              <p className="presets-save-error">{saveError}</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
