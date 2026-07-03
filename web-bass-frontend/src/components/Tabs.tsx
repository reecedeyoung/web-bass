import { useRef, useState } from 'react'
import BassGuitar from './BassGuitar'
import BassInfoOverlay from './BassInfoOverlay'
import ControlMappingView from './ControlMapping/ControlMappingView'
import PresetsView from './Presets/PresetsView'
import SettingsView from './Settings/SettingsView'
import './Tabs.css'

type Tab = 'Bass' | 'Presets' | 'Settings' | 'Control Mapping'

const TABS: Tab[] = ['Bass', 'Presets', 'Settings', 'Control Mapping']

// Tabs whose content fills the full width without centering
const FULL_WIDTH_TABS = new Set<Tab>(['Presets', 'Settings', 'Control Mapping'])

function Tabs() {
  const [activeTab, setActiveTab] = useState<Tab>('Bass')
  const [infoOpen, setInfoOpen]   = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const showInfo = () => {
    clearTimeout(hideTimer.current)
    setInfoOpen(true)
  }

  const hideInfo = () => {
    // Small delay prevents flicker when the pointer moves from the icon to the overlay.
    hideTimer.current = setTimeout(() => setInfoOpen(false), 120)
  }

  const toggleInfo = () => {
    clearTimeout(hideTimer.current)
    setInfoOpen(v => !v)
  }

  return (
    <div className="tabs">
      <div className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className={`tab-content${FULL_WIDTH_TABS.has(activeTab) ? ' tab-content--full' : ''}`}>

        {/* Bass tab stays mounted to avoid reinitialising the animation on every tab switch */}
        <div hidden={activeTab !== 'Bass'}>
          <BassGuitar />

          {/* ── Info icon ── */}
          <button
            className={`bass-info-btn${infoOpen ? ' bass-info-btn--active' : ''}`}
            onClick={toggleInfo}
            onMouseEnter={showInfo}
            onMouseLeave={hideInfo}
            aria-label="About Web Bass"
            aria-expanded={infoOpen}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="9" y1="8" x2="9" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="9" cy="5.5" r="1" fill="currentColor"/>
            </svg>
          </button>

          {/* ── Info overlay ── */}
          {infoOpen && (
            <BassInfoOverlay onMouseEnter={showInfo} onMouseLeave={hideInfo} />
          )}
        </div>

        {activeTab === 'Presets' && <PresetsView />}
        {activeTab === 'Settings' && <SettingsView />}
        {activeTab === 'Control Mapping' && <ControlMappingView />}
      </div>
    </div>
  )
}

export default Tabs
