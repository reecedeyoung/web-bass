import MidiSection from './MidiSection'
import KeyboardSection from './KeyboardSection'
import './ControlMapping.css'

export default function ControlMappingView() {
  return (
    <div className="control-mapping">
      <MidiSection />
      <KeyboardSection />
    </div>
  )
}
