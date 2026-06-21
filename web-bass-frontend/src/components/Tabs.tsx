import { useState } from 'react'
import BassGuitar from './BassGuitar'
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
        {activeTab === 'Bass' && (
          <BassGuitar />
        )}
        {activeTab === 'Presets' && (
          <PresetsView />
        )}
        {activeTab === 'Settings' && (
          <SettingsView />
        )}
        {activeTab === 'Control Mapping' && (
          <ControlMappingView />
        )}
      </div>
    </div>
  )
}

export default Tabs
