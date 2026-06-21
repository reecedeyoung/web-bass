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
    <div className="ms-wrap">
      <button
        className={`ms-switch${value ? ' ms-switch--on' : ''}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
        aria-label={label}
        type="button"
      >
        {/* Housing */}
        <span className="ms-housing">
          {/* Slot recess */}
          <span className="ms-slot">
            {/* Chrome lever */}
            <span className="ms-lever" />
          </span>
        </span>
        {/* State label beside the switch */}
        <span className="ms-state-label">{value ? onLabel : offLabel}</span>
      </button>

      {label && <span className="ms-label">{label}</span>}
    </div>
  )
}
