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

// Curve helpers — convert between parameter value and normalised [0,1] position.
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
const START_ANGLE = 225  // degrees clockwise from 12 o'clock
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
  const uid = useId()
  const gradId = `rk-grad-${uid.replace(/:/g, '')}`
  const shadowId = `rk-shadow-${uid.replace(/:/g, '')}`

  const drag = useRef<{ startY: number; startT: number } | null>(null)

  const t = Math.max(0, Math.min(1, normFromValue(value, min, max, curve)))
  const cx = size / 2
  const cy = size / 2
  const trackR = size * 0.40
  const knobR  = size * 0.275
  const dotDist = size * 0.19
  const strokeW = Math.max(3, size * 0.05)

  const valueAngle = START_ANGLE + t * SWEEP

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

  const dot = polarToXY(cx, cy, dotDist, valueAngle)
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
          <radialGradient id={gradId} cx="38%" cy="32%" r="65%">
            <stop offset="0%"   stopColor="#5a5a5a" />
            <stop offset="55%"  stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#181818" />
          </radialGradient>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* Full-range track */}
        <path
          d={arcPath(cx, cy, trackR, START_ANGLE, START_ANGLE + SWEEP)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Value arc */}
        {t > 0.001 && (
          <path
            d={arcPath(cx, cy, trackR, START_ANGLE, valueAngle)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}

        {/* Knob body */}
        <circle
          cx={cx} cy={cy} r={knobR}
          fill={`url(#${gradId})`}
          filter={`url(#${shadowId})`}
        />

        {/* Outer ring */}
        <circle
          cx={cx} cy={cy} r={knobR}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />

        {/* Indicator dot */}
        <circle
          cx={dot.x} cy={dot.y}
          r={size * 0.038}
          fill="rgba(255,255,255,0.9)"
        />
      </svg>

      <span className="rk-value">{displayValue}</span>
      <span className="rk-label">{label}</span>
    </div>
  )
}
