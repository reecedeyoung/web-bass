import { useState } from 'react'
import { useAudio } from '../../context/AudioContext'
import { usePresets } from '../../presets/usePresets'
import type { Preset } from '../../presets/types'
import './PresetsView.css'

export default function PresetsView() {
  const { params, setParams } = useAudio()
  const { builtIns, userPresets, activeId, load, save, remove } = usePresets()
  const [saveName, setSaveName] = useState('')

  function handleLoad(preset: Preset) {
    setParams(load(preset))
  }

  function handleSave() {
    const name = saveName.trim()
    if (!name) return
    save(name, params)
    setSaveName('')
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

      {userPresets.length > 0 && (
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
            disabled={!saveName.trim()}
          >
            Save
          </button>
        </div>
      </section>
    </div>
  )
}
