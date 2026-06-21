import { useEffect, useRef } from 'react'
import { noteEventBus } from '../audio/NoteEventBus'
import svgContent from '../assets/vector-bass-export.svg?raw'
import './BassGuitar.css'

interface StringDef {
  pathId:      string
  channel:     number
  openNote:    number
  openVisFreq: number  // visual oscillation Hz at open note; scales up with fret
  x1: number; y1: number  // nut end (right side of SVG, x≈180.5)
  x2: number; y2: number  // bridge end (left side of SVG, x≈6)
  maxAmp:      number      // max SVG-unit deflection at velocity 127
}

// x-coordinates of fret wires extracted from the SVG.
// Index 0 = nut position (right boundary of fretboard).
// Index N = fret N wire. Fret 1 is nearest the nut, fret 20 nearest the body.
const FRET_WIRE_X = [
  180.5,      //  0: nut
  170.29352,  //  1
  161.5,      //  2
  153.25342,  //  3
  145.5,      //  4
  138.1232,   //  5
  131.1124,   //  6
  124.5,      //  7
  118.37394,  //  8
  112.58386,  //  9
  107.07375,  // 10
  101.75,     // 11
  97.014343,  // 12
  92.326202,  // 13
  88,         // 14
  83.75,      // 15
  79.901291,  // 16
  76.234718,  // 17
  72.655258,  // 18
  69.4496,    // 19
  66.302574,  // 20
]

const MAX_FRETS = 20
const DECAY     = 2.8

// SVG top→bottom matches bass front view: E (thick) at top, G (thin) at bottom.
const STRINGS: StringDef[] = [
  { pathId: 'path3',  channel: 1, openNote: 28, openVisFreq: 5,  x1: 180.5,     y1: 28.871994, x2: 5.9999996, y2: 26.654516, maxAmp: 2.2 },
  { pathId: 'path6',  channel: 2, openNote: 33, openVisFreq: 6,  x1: 180.5,     y1: 31.058926, x2: 5.998316,  y2: 30.377878, maxAmp: 1.8 },
  { pathId: 'path10', channel: 3, openNote: 38, openVisFreq: 8,  x1: 180.5,     y1: 33.250949, x2: 5.9977988, y2: 34.158099, maxAmp: 1.5 },
  { pathId: 'path11', channel: 4, openNote: 43, openVisFreq: 10, x1: 180.50069, y1: 35.166043, x2: 6.2205181, y2: 37.921091, maxAmp: 1.2 },
]

// Linear y interpolation along the (nearly straight) string at a given x.
function stringY(s: StringDef, x: number): number {
  const t = (x - s.x2) / (s.x1 - s.x2)  // 0 at bridge, 1 at nut
  return s.y2 + t * (s.y1 - s.y2)
}

// Build the SVG path for a string.
// For open notes (fret=0): single quadratic Bezier, full string length.
// For fretted notes: straight segment nut→fret, then curved fret→bridge.
// The Bezier control point sits at the center of the vibrating portion displaced
// by deflection — so the curve correctly reflects only the ringing segment.
function buildPath(s: StringDef, deflection = 0, fret = 0): string {
  if (fret === 0) {
    const cx = (s.x1 + s.x2) / 2
    const cy = (s.y1 + s.y2) / 2 + deflection
    return `M ${s.x1},${s.y1} Q ${cx},${cy} ${s.x2},${s.y2}`
  }

  const fx  = FRET_WIRE_X[fret]
  const fy  = stringY(s, fx)
  const vcx = (s.x2 + fx) / 2
  const vcy = stringY(s, vcx) + deflection

  // Nut→fret: straight (string is stopped here).
  // Fret→bridge: quadratic Bezier (vibrating portion).
  return `M ${s.x1},${s.y1} L ${fx},${fy} Q ${vcx},${vcy} ${s.x2},${s.y2}`
}

export default function BassGuitar() {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const svgEl = wrap.querySelector('svg')
    if (!svgEl) return

    // Prime each string as a straight Bezier at rest.
    const pathEls = STRINGS.map(s => wrap.querySelector<SVGPathElement>(`#${s.pathId}`))
    pathEls.forEach((el, i) => { if (el) el.setAttribute('d', buildPath(STRINGS[i])) })

    // Create one fret indicator dot per string, appended to the SVG root.
    const ns = 'http://www.w3.org/2000/svg'
    const dots = STRINGS.map(() => {
      const c = document.createElementNS(ns, 'circle')
      c.setAttribute('r', '1.5')
      c.setAttribute('class', 'fret-dot')
      svgEl.appendChild(c)
      return c
    })

    // Per-string animation state (plain arrays — no re-render on update).
    const rafIds      = new Array<number>(STRINGS.length).fill(0)
    const amps        = new Array<number>(STRINGS.length).fill(0)
    const starts      = new Array<number>(STRINGS.length).fill(0)
    const activeFrets = new Array<number>(STRINGS.length).fill(0)
    const activeNotes = new Array<number>(STRINGS.length).fill(-1)

    const unsub = noteEventBus.subscribe(event => {
      const idx = STRINGS.findIndex(s => s.channel === event.channel)
      if (idx === -1) return

      const s    = STRINGS[idx]
      const fret = event.note - s.openNote

      // Silently ignore notes outside the physical fret range.
      if (fret < 0 || fret > MAX_FRETS) return

      const el  = pathEls[idx]
      const dot = dots[idx]

      if (event.type === 'noteOn') {
        activeNotes[idx]  = event.note
        activeFrets[idx]  = fret

        // Position and show fret indicator (no dot for open strings).
        if (fret > 0 && dot) {
          const fx = (FRET_WIRE_X[fret - 1] + FRET_WIRE_X[fret]) / 2
          dot.setAttribute('cx', String(fx))
          dot.setAttribute('cy', String(stringY(s, fx)))
          dot.classList.add('visible')
        }

        // Start vibration animation.
        cancelAnimationFrame(rafIds[idx])
        amps[idx]   = s.maxAmp * (event.velocity / 127)
        starts[idx] = performance.now()

        if (!el) return
        const tick = (now: number) => {
          const t     = (now - starts[idx]) / 1000
          const decay = Math.exp(-t * DECAY)
          if (decay < 0.01) {
            el.setAttribute('d', buildPath(s, 0, activeFrets[idx]))
            return
          }
          // Visual frequency scales with fret (shorter string → higher pitch).
          const visFreq    = s.openVisFreq * Math.pow(2, activeFrets[idx] / 12)
          const deflection = amps[idx] * Math.sin(t * visFreq * Math.PI * 2) * decay
          el.setAttribute('d', buildPath(s, deflection, activeFrets[idx]))
          rafIds[idx] = requestAnimationFrame(tick)
        }
        rafIds[idx] = requestAnimationFrame(tick)

      } else {
        // Hide dot only if this noteOff matches the note currently held.
        if (activeNotes[idx] === event.note) {
          activeNotes[idx] = -1
          if (dot) dot.classList.remove('visible')
        }
      }
    })

    return () => {
      unsub()
      rafIds.forEach(id => cancelAnimationFrame(id))
      dots.forEach(d => d.remove())
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className="bass-guitar"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}
