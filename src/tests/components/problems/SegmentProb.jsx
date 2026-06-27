import { useRef, useState } from 'react'
import HtmlMath from '../HtmlMath.jsx'
import { PROB_SPECS, favIntervals, isFavorable } from './prob-specs.js'
import { fmt } from '../../lib/solve.js'

// 1-D geometric probability: a point C is dragged along AB; AC and CB update
// live, the favourable region is shaded, and P = favourable length / total.
const W = 320, H = 96, PADX = 26, SEG = 50, FAV = 28

export default function SegmentProb({ spec: specKey }) {
  const spec = PROB_SPECS[specKey]
  const ref = useRef(null)
  const dragging = useRef(false)
  const [x, setX] = useState(spec ? spec.L * 0.5 : 0)
  if (!spec || spec.type !== 'segment') return null
  const { L, t, unit } = spec
  const X = (v) => PADX + (v / L) * (W - 2 * PADX)

  function pick(e) {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let v = ((px - PADX) / (W - 2 * PADX)) * L
    v = Math.max(0, Math.min(L, v))
    setX(Math.round(v * 100) / 100)
  }

  const fav = favIntervals(spec)
  const favLen = fav.reduce((s, [a, b]) => s + (b - a), 0)
  const ac = x, cb = L - x, mx = Math.max(ac, cb)
  const ok = isFavorable(x, spec)
  const g = gcd(Math.round(favLen), L) || 1
  const pTex = `\\dfrac{${fmt(favLen)}}{${L}}=\\dfrac{${Math.round(favLen) / g}}{${L / g}}`

  return (
    <div className="sp">
      <svg
        ref={ref} className="sp-svg" viewBox={`0 0 ${W} ${H}`}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); pick(e) }}
        onPointerMove={(e) => { if (dragging.current) pick(e) }}
        onPointerUp={() => { dragging.current = false }}
        onPointerCancel={() => { dragging.current = false }}
      >
        {/* favourable region */}
        {fav.map(([a, b], i) => <line key={i} x1={X(a)} y1={FAV} x2={X(b)} y2={FAV} className="sp-fav" />)}
        <text x={PADX} y={FAV - 7} className="sp-favlabel">ხელსაყრელი არე</text>

        {/* the segment AB, split into AC (left) and CB (right) */}
        <line x1={X(0)} y1={SEG} x2={X(x)} y2={SEG} className="sp-ac" />
        <line x1={X(x)} y1={SEG} x2={X(L)} y2={SEG} className="sp-cb" />

        {/* threshold guides at t and L−t */}
        {[t, L - t].map((v, i) => <line key={i} x1={X(v)} y1={FAV - 3} x2={X(v)} y2={SEG + 14} className="sp-guide" />)}

        {/* endpoints + draggable C */}
        <circle cx={X(0)} cy={SEG} r="3.5" className="sp-end" />
        <circle cx={X(L)} cy={SEG} r="3.5" className="sp-end" />
        <circle cx={X(x)} cy={SEG} r="6" className={'sp-c' + (ok ? ' ok' : ' bad')} />

        <text x={X(0)} y={SEG + 22} className="sp-pt">A·0</text>
        <text x={X(L)} y={SEG + 22} className="sp-pt">B·{L}</text>
        <text x={Math.max(20, Math.min(W - 20, X(x)))} y={SEG - 12} className="sp-clabel">C</text>
        {[t, L - t].map((v, i) => <text key={i} x={X(v)} y={SEG + 22} className="sp-gt">{v}</text>)}
      </svg>

      <HtmlMath
        tag="div" className={'sp-readout' + (ok ? ' ok' : ' bad')}
        html={`$AC=${fmt(ac)}$, &nbsp; $CB=${fmt(cb)}$ &nbsp;→&nbsp; $\\max=${fmt(mx)}$ ${ok ? `$\\ge ${t}$ ✓` : `$< ${t}$ ✗`}`}
      />
      <HtmlMath tag="div" className="sp-prob" html={`ხელსაყრელი სიგრძე / სრული სიგრძე: &nbsp; $P=${pTex}$`} />
      <div className="sp-hint">გადაათრიე წერტილი C. მწვანე უბანი — სადაც AC და CB-დან უდიდესი ≥ {t} {unit}.</div>
    </div>
  )
}

function gcd(a, b) { return b ? gcd(b, a % b) : a }
