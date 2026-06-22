import { useEffect, useRef, useState } from 'react'

// Area-by-dissection derivations only — the cases where you literally watch
// pieces rearrange into a shape whose area is obvious. (Other "transformations"
// were dropped for being abstract/unclear.) Driven by a slider + optional ▶.

const W = 300, H = 232
const P = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`
const fmt = (x) => { const r = Math.round(x * 10) / 10; return Number.isInteger(r) ? String(r) : r.toFixed(1) }
function rot(p, c, ang) {
  const dx = p[0] - c[0], dy = p[1] - c[1], s = Math.sin(ang), co = Math.cos(ang)
  return [c[0] + dx * co - dy * s, c[1] + dx * s + dy * co]
}
function fitter(pts, pad = 28) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys)
  const s = Math.min((W - 2 * pad) / (maxx - minx || 1), (H - 2 * pad) / (maxy - miny || 1))
  const ox = (W - (maxx - minx) * s) / 2, oy = (H - (maxy - miny) * s) / 2
  return (p) => [ox + (p[0] - minx) * s, oy + (maxy - p[1]) * s]
}
const poly = (pts, m) => pts.map(m).map(P).join(' ')
const xy = (p, dx, dy) => ({ x: p[0] + (dx || 0), y: p[1] + (dy || 0) })

// parallelogram -> rectangle: cut the end triangle and slide it across
function parallelogram(t) {
  const a = 5, h = 3, s = 1.8
  const A = [0, 0], B = [a, 0], C = [a + s, h], D = [s, h], E = [a, h]
  const m = fitter([A, B, C, D, [0, h]])
  const stay = [A, B, E, D]
  const tri = [B, C, E].map((p) => [p[0] - t * a, p[1]])
  const rect = [[0, 0], [a, 0], [a, h], [0, h]]
  return {
    g: (
      <g>
        <polygon points={poly(rect, m)} className="th2-target" />
        <polygon points={poly(stay, m)} className="th2-shape" />
        <polygon points={poly(tri, m)} className="th2-pieceB" />
        <text {...xy(m([a / 2, 0]), 0, 16)} className="th2-label">a</text>
        <text {...xy(m([0, h / 2]), -14, 0)} className="th2-label">h</text>
      </g>
    ),
    read: ['პარალელოგრამი → მართკუთხედი', `S = a · h = ${fmt(a * h)}`],
  }
}
// triangle = half a parallelogram (duplicate + rotate 180°)
function triangle(t) {
  const b = 5, h = 3, C = [1.5, h], A = [0, 0], B = [b, 0]
  const M = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]
  const copy = [A, B, C].map((p) => rot(p, M, t * Math.PI))
  const par = [[0, 0], [b, 0], [2 * M[0], 2 * M[1]], C]
  const m = fitter([A, B, C, [2 * M[0], 2 * M[1]]])
  return {
    g: (
      <g>
        <polygon points={poly(par, m)} className="th2-target" />
        <polygon points={poly([A, B, C], m)} className="th2-shape" />
        <polygon points={poly(copy, m)} className="th2-pieceB" />
        <text {...xy(m([b / 2, 0]), 0, 16)} className="th2-label">b</text>
        <text {...xy(m(C), 6, -4)} className="th2-label">h</text>
      </g>
    ),
    read: ['სამკუთხედი = პარალელოგრამის ნახევარი', `S = ½ · b · h = ${fmt(b * h / 2)}`],
  }
}
// two trapezoids -> a parallelogram of base (a+b)
function trapezoid(t) {
  const a = 2.4, b = 5, h = 3
  const A = [(b - a) / 2, h], B = [(b + a) / 2, h], C = [b, 0], D = [0, 0]
  const M = [(C[0] + B[0]) / 2, (C[1] + B[1]) / 2]
  const copy = [A, B, C, D].map((p) => rot(p, M, t * Math.PI))
  const par = [[0, 0], [a + b, 0], [(3 * b + a) / 2, h], [(b - a) / 2, h]]
  const m = fitter([D, C, B, A, [a + b, 0], [(3 * b + a) / 2, h]])
  return {
    g: (
      <g>
        <polygon points={poly(par, m)} className="th2-target" />
        <polygon points={poly([A, B, C, D], m)} className="th2-shape" />
        <polygon points={poly(copy, m)} className="th2-pieceB" />
        <text {...xy(m([(A[0] + B[0]) / 2, h]), 0, -6)} className="th2-label">a</text>
        <text {...xy(m([b / 2, 0]), 0, 16)} className="th2-label">b</text>
        <text {...xy(m([0, h / 2]), -12, 0)} className="th2-label">h</text>
      </g>
    ),
    read: ['ორი ტრაპეცია → პარალელოგრამი', `S = ½ (a + b) · h = ${fmt((a + b) / 2 * h)}`],
  }
}

const RENDER = { parallelogram, triangle, trapezoid }

export default function Derive2D({ kind }) {
  const render = RENDER[kind]
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const play = useRef(false)
  play.current = playing

  useEffect(() => {
    let id = 0, prev = null
    const loop = (ts) => {
      id = requestAnimationFrame(loop)
      if (!play.current) { prev = ts; return }
      if (prev == null) prev = ts
      const dt = (ts - prev) / 1000; prev = ts
      setT((x) => { const nx = x + dt * 0.45; if (nx >= 1) { play.current = false; setPlaying(false); return 1 } return nx })
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  if (!render) return null
  const out = render(t)
  return (
    <div className="th2-graphwrap">
      <svg className="th2-svg" viewBox={`0 0 ${W} ${H}`}>{out.g}</svg>
      <div className="th-sliders">
        <label className="th-slider">
          <span className="th-slider-k">გარდაქმნა {Math.round(t * 100)}%</span>
          <input type="range" min="0" max="1" step="0.01" value={t} onChange={(e) => { setPlaying(false); setT(+e.target.value) }} />
        </label>
      </div>
      <div className="th3-ctrls">
        <button type="button" className="th3-btn" onClick={() => { if (t >= 1) setT(0); setPlaying((p) => !p) }}>{playing ? '⏸ პაუზა' : '▶ ჩვენება'}</button>
        <button type="button" className="th3-btn" onClick={() => { setPlaying(false); setT(0) }}>↺ თავიდან</button>
      </div>
      <div className="th-readout">
        {out.read.map((l, i) => <div key={i} className={'th-readout-line' + (i === out.read.length - 1 ? ' th-readout-given' : '')}>{l}</div>)}
      </div>
    </div>
  )
}
