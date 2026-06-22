import './MetalSwitch.css'

interface MetalSwitchProps {
  value: boolean
  onChange: (value: boolean) => void
  label?: string
  onLabel?: string
  offLabel?: string
}

export default function MetalSwitch({
  value,
  onChange,
  label,
  onLabel  = 'ON',
  offLabel = 'OFF',
}: MetalSwitchProps) {
  return (
    // ms-switch--on lives on the wrapper so descendant selectors reach both
    // the rod (inside the button) and the state label (sibling of the button).
    <div className={`ms-wrap${value ? ' ms-switch--on' : ''}`}>

      {/* Spacer matches the rk-pole-row height so the collar center lines up
          with the knob SVG center when both sit in an align-items:flex-end row. */}
      <div className="ms-spacer" aria-hidden="true" />

      <button
        className="ms-switch"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        aria-label={`${label ?? 'Toggle'}: ${value ? onLabel : offLabel}`}
        type="button"
      >
        <div className="ms-body">
          <div className="ms-rod" />
          <div className="ms-collar">
            <div className="ms-collar-ring" />
            <div className="ms-socket" />
          </div>
        </div>
      </button>

      {/* These sit at the same nesting level as rk-value / rk-label */}
      <span className="ms-state-label">{value ? onLabel : offLabel}</span>
      {label && <span className="ms-label">{label}</span>}
    </div>
  )
}
