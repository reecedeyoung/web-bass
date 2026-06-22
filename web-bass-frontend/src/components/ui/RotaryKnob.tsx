import { useId, useRef } from 'react'
import './RotaryKnob.css'

/**
 * How drag position (linear, 0–1) maps to parameter value.
 * A number uses a power curve: valueFromNorm(t) = t^exponent.
 *   exponent < 1 → curve bends upward (small t → large value) — biases toward the max end.
 *   exponent > 1 → curve bends downward — biases toward the min end.
 */
export type KnobCurve = 'linear' | 'exponential' | number

interface RotaryKnobProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  label: string
  minLabel?: string
  maxLabel?: string
  /** Pixels of vertical drag to traverse the full range. Default 160. */
  sensitivity?: number
  formatValue?: (v: number) => string
  size?: number
  /** 'exponential' requires min > 0. Drag moves linearly in normalised space; the curve shapes the output. */
  curve?: KnobCurve
  disabled?: boolean
}

function normFromValue(v: number, min: number, max: number, curve: KnobCurve): number {
  if (curve === 'exponential') return Math.log(v / min) / Math.log(max / min)
  if (typeof curve === 'number') {
    const t = Math.max(0, (v - min) / (max - min))
    return Math.pow(t, 1 / curve)
  }
  return (v - min) / (max - min)
}

function valueFromNorm(t: number, min: number, max: number, curve: KnobCurve): number {
  const tc = Math.max(0, Math.min(1, t))
  if (curve === 'exponential') return min * Math.pow(max / min, tc)
  if (typeof curve === 'number') return min + Math.pow(tc, curve) * (max - min)
  return min + tc * (max - min)
}

// Knob sweep: 270° clockwise from the 7:30 position to the 4:30 position.
const START_ANGLE = 225
const SWEEP = 270

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = polarToXY(cx, cy, r, startDeg)
  const e = polarToXY(cx, cy, r, endDeg)
  const span = ((endDeg - startDeg) + 360) % 360
  const largeArc = span > 180 ? 1 : 0
  return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`
}

export default function RotaryKnob({
  value, min, max, step,
  onChange, label, minLabel, maxLabel,
  sensitivity = 160, formatValue, size = 80, curve = 'linear', disabled = false,
}: RotaryKnobProps) {
  const uid    = useId()
  const safeId = uid.replace(/:/g, '')
  const gradTopId = `rk-top-${safeId}`
  const gradCylId = `rk-cyl-${safeId}`
  const knurlId   = `rk-kn-${safeId}`
  const shadowId  = `rk-sh-${safeId}`

  const drag = useRef<{ startY: number; startT: number } | null>(null)

  const t = Math.max(0, Math.min(1, normFromValue(value, min, max, curve)))
  const cx = size / 2
  const cy = size / 2

  // Layout proportions
  const trackR      = size * 0.420   // arc ring radius
  const trackStroke = Math.max(1.5, size * 0.030)
  const knobOuterR  = size * 0.315   // outer edge of knob (includes knurled band)
  const knobTopR    = size * 0.225   // inner edge of knurled band = flat chrome top
  const indR0       = size * 0.055   // indicator line start (near center)
  const indR1       = knobTopR * 0.82 // indicator line end (near edge of flat top)
  const indStroke   = Math.max(1.2, size * 0.024)

  const valueAngle = START_ANGLE + t * SWEEP
  const indP0 = polarToXY(cx, cy, indR0, valueAngle)
  const indP1 = polarToXY(cx, cy, indR1, valueAngle)

  const clamp = (v: number) => Math.max(min, Math.min(max, v))
  const snap  = (v: number) => step ? Math.round(v / step) * step : v

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, startT: t }
    document.body.style.cursor = 'ns-resize'
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current || disabled) return
    const dy   = drag.current.startY - e.clientY
    const newT = Math.max(0, Math.min(1, drag.current.startT + dy / sensitivity))
    onChange(snap(clamp(valueFromNorm(newT, min, max, curve))))
  }

  const handlePointerUp = () => {
    drag.current = null
    document.body.style.cursor = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const inc = step ?? (max - min) / 100
    const big = (max - min) / 10
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault()
      onChange(snap(clamp(value + (e.shiftKey ? big : inc))))
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault()
      onChange(snap(clamp(value - (e.shiftKey ? big : inc))))
    }
  }

  const displayValue = formatValue ? formatValue(value) : value.toFixed(2)

  return (
    <div className={`rk-wrap${disabled ? ' rk-wrap--disabled' : ''}`}>
      <div className="rk-pole-row">
        <span className="rk-pole">{minLabel}</span>
        <span className="rk-pole">{maxLabel}</span>
      </div>

      <svg
        className="rk-svg"
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <defs>
          {/*
            Knurling pattern: two crossed diagonal lines per cell simulate the
            diamond-pyramid knurl on a chrome barrel knob. The "/" face (#8c8c8c)
            catches light from upper-left; the "\" face (#363636) is in shadow.
          */}
          <pattern id={knurlId} x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="#5e5e5e"/>
            <line x1="0" y1="3" x2="3" y2="0" stroke="#8c8c8c" strokeWidth="0.7"/>
            <line x1="0" y1="0" x2="3" y2="3" stroke="#363636" strokeWidth="0.7"/>
          </pattern>

          {/* Chrome radial gradient for the flat top face */}
          <radialGradient id={gradTopId} cx="36%" cy="28%" r="72%">
            <stop offset="0%"   stopColor="#e4e4e4"/>
            <stop offset="18%"  stopColor="#cacaca"/>
            <stop offset="52%"  stopColor="#787878"/>
            <stop offset="82%"  stopColor="#3e3e3e"/>
            <stop offset="100%" stopColor="#282828"/>
          </radialGradient>

          {/*
            Cylindrical shading overlay for the knurled band: radial gradient
            originating from the top of the bounding box simulates a cylinder
            lit from above — top of ring is brighter, bottom falls into shadow.
          */}
          <radialGradient id={gradCylId} cx="42%" cy="0%" r="100%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.28"/>
            <stop offset="40%"  stopColor="#ffffff" stopOpacity="0.05"/>
            <stop offset="100%" stopColor="#000000" stopOpacity="0.24"/>
          </radialGradient>

          {/* Drop shadow beneath the knob body */}
          <filter id={shadowId} x="-28%" y="-28%" width="156%" height="156%">
            <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#000" floodOpacity="0.65"/>
          </filter>
        </defs>

        {/* ── Track: full-range groove ── */}
        <path
          d={arcPath(cx, cy, trackR, START_ANGLE, START_ANGLE + SWEEP)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={trackStroke}
          strokeLinecap="round"
        />

        {/* ── Track: value fill ── */}
        {t > 0.001 && (
          <path
            d={arcPath(cx, cy, trackR, START_ANGLE, valueAngle)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={trackStroke}
            strokeLinecap="round"
          />
        )}

        {/* ── Knob drop shadow ── */}
        <circle cx={cx} cy={cy} r={knobOuterR} fill="#181818" filter={`url(#${shadowId})`}/>

        {/* ── Knurled band: outer circle filled with crosshatch pattern ── */}
        <circle cx={cx} cy={cy} r={knobOuterR} fill={`url(#${knurlId})`}/>

        {/* ── Cylindrical shading overlay on knurled band ── */}
        <circle cx={cx} cy={cy} r={knobOuterR} fill={`url(#${gradCylId})`}/>

        {/* ── Outer edge darkening (machined rim) ── */}
        <circle cx={cx} cy={cy} r={knobOuterR} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1.5"/>

        {/* ── Bevel between knurled band and flat top (machined chamfer highlight) ── */}
        <circle cx={cx} cy={cy} r={knobTopR + 1.0} fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="1.4"/>
        <circle cx={cx} cy={cy} r={knobTopR}        fill="none" stroke="rgba(0,0,0,0.45)"         strokeWidth="1.0"/>

        {/* ── Flat chrome top face ── */}
        <circle cx={cx} cy={cy} r={knobTopR} fill={`url(#${gradTopId})`}/>

        {/* ── Subtle highlight ring at top face edge ── */}
        <circle cx={cx} cy={cy} r={knobTopR} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8"/>

        {/* ── Indicator line ── */}
        <line
          x1={indP0.x.toFixed(3)} y1={indP0.y.toFixed(3)}
          x2={indP1.x.toFixed(3)} y2={indP1.y.toFixed(3)}
          stroke="rgba(255,255,255,0.92)"
          strokeWidth={indStroke}
          strokeLinecap="round"
        />
      </svg>

      <span className="rk-value">{displayValue}</span>
      <span className="rk-label">{label}</span>
    </div>
  )
}
