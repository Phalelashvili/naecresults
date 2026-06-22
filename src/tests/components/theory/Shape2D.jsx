import { useRef, useState } from 'react'

// Interactive 2D figures (inline SVG). One component per kind; Shape2D
// dispatches. Many have slider/draggable variables with live formula readouts.
// Canvas is 300x240 user units.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const mul = (a, k) => [a[0] * k, a[1] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
const len = (a) => Math.hypot(a[0], a[1])
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
const P = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`
const fmt = (x) => { const r = Math.round(x * 10) / 10; return Number.isInteger(r) ? String(r) : r.toFixed(1) }
function foot(p, a, b) { const ab = sub(b, a); const t = dot(sub(p, a), ab) / dot(ab, ab); return add(a, mul(ab, t)) }
function circumcenter(A, B, C) {
  const [ax, ay] = A, [bx, by] = B, [cx, cy] = C
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
  const a2 = ax * ax + ay * ay, b2 = bx * bx + by * by, c2 = cx * cx + cy * cy
  return [(a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d, (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d]
}
function angleDeg(at, p, q) {
  const u = sub(p, at), v = sub(q, at)
  return (Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (len(u) * len(v)) || 0))) * 180) / Math.PI
}
// maps unit-space points (math y-up) to fit the canvas, centered
function fitter(pts, W = 300, H = 240, pad = 34) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys)
  const s = Math.min((W - 2 * pad) / (maxx - minx || 1), (H - 2 * pad) / (maxy - miny || 1))
  const ox = (W - (maxx - minx) * s) / 2, oy = (H - (maxy - miny) * s) / 2
  return [(p) => [ox + (p[0] - minx) * s, oy + (maxy - p[1]) * s], s]
}

function Svg({ children, svgRef, ...rest }) {
  return <svg ref={svgRef} className="th2-svg" viewBox="0 0 300 240" {...rest}>{children}</svg>
}
function Chips({ items }) {
  return (
    <div className="th2-chips">
      {items.map((it) => <button key={it.key} type="button" className={'th2-chip' + (it.on ? ' on' : '')} onClick={it.toggle}>{it.label}</button>)}
    </div>
  )
}
function Sliders({ defs, params, set }) {
  return (
    <div className="th-sliders">
      {defs.map((d) => (
        <label key={d.k} className="th-slider">
          <span className="th-slider-k">{d.label || d.k} = {params[d.k]}</span>
          <input type="range" min={d.min} max={d.max} step={d.step} value={params[d.k]}
            onChange={(e) => set((p) => ({ ...p, [d.k]: +e.target.value }))} />
        </label>
      ))}
    </div>
  )
}
function Readout({ lines }) {
  return <div className="th-readout">{lines.map((l, i) => <div key={i} className={'th-readout-line' + (i === 0 ? ' th-readout-given' : '')}>{l}</div>)}</div>
}
function useSvgPoint(ref) {
  return (e) => { const r = ref.current.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 300, ((e.clientY - r.top) / r.height) * 240] }
}
function useParams(defs) { return useState(() => Object.fromEntries(defs.map((d) => [d.k, d.def]))) }

// ----------------------------------------------------------------- triangle
function TriangleFig() {
  const ref = useRef(null)
  const toPt = useSvgPoint(ref)
  const [on, setOn] = useState({})
  const [pos, setPos] = useState({ A: [104, 36], B: [36, 200], C: [270, 196] })
  const drag = useRef(null)
  const t = (k) => setOn((o) => ({ ...o, [k]: !o[k] }))
  function move(e) {
    if (!drag.current) return
    let p = toPt(e); p = [Math.max(14, Math.min(286, p[0])), Math.max(14, Math.min(226, p[1]))]
    setPos((s) => ({ ...s, [drag.current]: p }))
  }
  const { A, B, C } = pos
  const mBC = mid(B, C), mCA = mid(C, A), mAB = mid(A, B)
  const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3]
  const a = len(sub(B, C)), b = len(sub(C, A)), c = len(sub(A, B))
  const I = mul(add(add(mul(A, a), mul(B, b)), mul(C, c)), 1 / (a + b + c))
  const s = (a + b + c) / 2, area = Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2
  const rIn = area / s, O = circumcenter(A, B, C), R = len(sub(O, A))
  const angA = angleDeg(A, B, C), angB = angleDeg(B, A, C), angC = angleDeg(C, A, B)
  const Handle = ({ k }) => <circle cx={pos[k][0]} cy={pos[k][1]} r="8" className="th2-handle" onPointerDown={(e) => { drag.current = k; ref.current.setPointerCapture?.(e.pointerId) }} />
  return (
    <>
      <Svg svgRef={ref} style={{ touchAction: 'none' }} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}>
        {on.circum && <circle cx={O[0]} cy={O[1]} r={R} className="th2-aux4" fill="none" />}
        {on.incircle && <circle cx={I[0]} cy={I[1]} r={rIn} className="th2-aux2" fill="none" />}
        <polygon points={`${P(A)} ${P(B)} ${P(C)}`} className="th2-shape" />
        {on.medians && [<line key="m1" x1={A[0]} y1={A[1]} x2={mBC[0]} y2={mBC[1]} className="th2-aux1" />, <line key="m2" x1={B[0]} y1={B[1]} x2={mCA[0]} y2={mCA[1]} className="th2-aux1" />, <line key="m3" x1={C[0]} y1={C[1]} x2={mAB[0]} y2={mAB[1]} className="th2-aux1" />, <circle key="g" cx={G[0]} cy={G[1]} r="3.5" className="th2-dot1" />]}
        {on.bisectors && [A, B, C].map((V, i) => { const opp = [[B, C], [C, A], [A, B]][i]; const f = foot(I, opp[0], opp[1]); return <line key={i} x1={V[0]} y1={V[1]} x2={f[0]} y2={f[1]} className="th2-aux2" /> })}
        {on.altitudes && [[A, B, C], [B, C, A], [C, A, B]].map(([V, p, q], i) => { const f = foot(V, p, q); return <line key={i} x1={V[0]} y1={V[1]} x2={f[0]} y2={f[1]} className="th2-aux3" /> })}
        {on.mid && <polygon points={`${P(mAB)} ${P(mBC)} ${P(mCA)}`} className="th2-aux4" fill="none" />}
        <Handle k="A" /><Handle k="B" /><Handle k="C" />
        <text x={A[0] - 4} y={A[1] - 10} className="th2-label">A</text>
        <text x={B[0] - 16} y={B[1] + 14} className="th2-label">B</text>
        <text x={C[0] + 8} y={C[1] + 14} className="th2-label">C</text>
      </Svg>
      <Chips items={[
        { key: 'medians', label: 'მედიანები', on: on.medians, toggle: () => t('medians') },
        { key: 'bisectors', label: 'ბისექტრისები', on: on.bisectors, toggle: () => t('bisectors') },
        { key: 'altitudes', label: 'სიმაღლეები', on: on.altitudes, toggle: () => t('altitudes') },
        { key: 'mid', label: 'შუახაზები', on: on.mid, toggle: () => t('mid') },
        { key: 'incircle', label: 'ჩახაზული წრე', on: on.incircle, toggle: () => t('incircle') },
        { key: 'circum', label: 'შემოხაზული წრე', on: on.circum, toggle: () => t('circum') },
      ]} />
      <Readout lines={[`∠A = ${fmt(angA)}°,  ∠B = ${fmt(angB)}°,  ∠C = ${fmt(angC)}°`, `ჯამი = ${fmt(angA + angB + angC)}° (ყოველთვის 180°)`]} />
    </>
  )
}

// ------------------------------------------------------------ right triangle
function RightTriangleFig() {
  const [alt, setAlt] = useState(false)
  const [p, set] = useParams([{ k: 'a', min: 2, max: 6, step: 0.5, def: 4 }, { k: 'b', min: 2, max: 6, step: 0.5, def: 3 }])
  const A0 = [0, 0], C0 = [p.a, 0], B0 = [0, p.b]
  const [map] = fitter([A0, C0, B0], 300, 240, 40)
  const A = map(A0), C = map(C0), B = map(B0)
  const H = foot(A, B, C)
  const c = Math.hypot(p.a, p.b), area = p.a * p.b / 2, hc = (p.a * p.b) / c
  return (
    <>
      <Svg>
        <polygon points={`${P(A)} ${P(B)} ${P(C)}`} className="th2-shape" />
        <path d={`M ${A[0] + 16} ${A[1]} L ${A[0] + 16} ${A[1] - 16} L ${A[0]} ${A[1] - 16}`} className="th2-right" fill="none" />
        {alt && <line x1={A[0]} y1={A[1]} x2={H[0]} y2={H[1]} className="th2-aux3" />}
        <text x={A[0] - 18} y={mid(A, B)[1]} className="th2-label">b</text>
        <text x={mid(A, C)[0]} y={A[1] + 20} className="th2-label">a</text>
        <text x={mid(B, C)[0] + 8} y={mid(B, C)[1] - 6} className="th2-label">c</text>
      </Svg>
      <Sliders defs={[{ k: 'a', min: 2, max: 6, step: 0.5, def: 4 }, { k: 'b', min: 2, max: 6, step: 0.5, def: 3 }]} params={p} set={set} />
      <Chips items={[{ key: 'alt', label: 'სიმაღლე ჰიპოტენუზაზე', on: alt, toggle: () => setAlt((v) => !v) }]} />
      <Readout lines={[`a = ${p.a}, b = ${p.b}`, `c = √(a²+b²) = ${fmt(c)}`, `S = ½ab = ${fmt(area)}`, `hₒ = ab/c = ${fmt(hc)}`]} />
    </>
  )
}

// ----------------------------------------------------- adjustable area quads
function QuadFig({ kind }) {
  const defsByKind = {
    rectangle: [{ k: 'a', min: 2, max: 6, step: 0.5, def: 5 }, { k: 'b', min: 1, max: 5, step: 0.5, def: 3 }],
    rhombus: [{ k: 'd1', min: 2, max: 6, step: 0.5, def: 5 }, { k: 'd2', min: 2, max: 6, step: 0.5, def: 3 }],
    parallelogram: [{ k: 'a', min: 2, max: 6, step: 0.5, def: 5 }, { k: 'h', min: 1, max: 5, step: 0.5, def: 3 }, { k: 's', label: 'დახრა', min: 0, max: 3, step: 0.5, def: 1.5 }],
  }
  const defs = defsByKind[kind]
  const [p, set] = useParams(defs)
  let unit, labels, diagMark = false, lines
  if (kind === 'rectangle') {
    unit = [[0, 0], [p.a, 0], [p.a, p.b], [0, p.b]]
    labels = (m) => [{ t: 'a', q: m([p.a / 2, 0]), dy: 18 }, { t: 'b', q: m([0, p.b / 2]), dx: -16 }]
    lines = [['d', [0, 0], [p.a, p.b]]]
  } else if (kind === 'rhombus') {
    unit = [[p.d1 / 2, 0], [p.d1, p.d2 / 2], [p.d1 / 2, p.d2], [0, p.d2 / 2]]
    labels = (m) => [{ t: 'd₁', q: m([p.d1 / 2, p.d2 / 2]), dy: -6 }, { t: 'd₂', q: m([p.d1 / 2, p.d2 / 2]), dx: 8 }]
    diagMark = true
  } else {
    unit = [[0, 0], [p.a, 0], [p.a + p.s, p.h], [p.s, p.h]]
    labels = (m) => [{ t: 'a', q: m([p.a / 2, 0]), dy: 18 }, { t: 'h', q: m([0, p.h / 2]), dx: -14 }]
  }
  const [map] = fitter(unit, 300, 240, 38)
  const pts = unit.map(map)
  const O = mid(pts[0], pts[2])
  const area = kind === 'rectangle' ? p.a * p.b : kind === 'rhombus' ? p.d1 * p.d2 / 2 : p.a * p.h
  const ro = kind === 'rectangle' ? [`a = ${p.a}, b = ${p.b}`, `S = a·b = ${fmt(area)}`, `P = 2(a+b) = ${fmt(2 * (p.a + p.b))}`, `d = √(a²+b²) = ${fmt(Math.hypot(p.a, p.b))}`]
    : kind === 'rhombus' ? [`d₁ = ${p.d1}, d₂ = ${p.d2}`, `S = ½·d₁·d₂ = ${fmt(area)}`, `გვერდი = ${fmt(Math.hypot(p.d1 / 2, p.d2 / 2))}`]
    : [`a = ${p.a}, h = ${p.h}`, `S = a·h = ${fmt(area)}`]
  return (
    <>
      <Svg>
        <polygon points={pts.map(P).join(' ')} className="th2-shape" />
        <line x1={pts[0][0]} y1={pts[0][1]} x2={pts[2][0]} y2={pts[2][1]} className="th2-aux1" />
        <line x1={pts[1][0]} y1={pts[1][1]} x2={pts[3][0]} y2={pts[3][1]} className="th2-aux1" />
        {diagMark && <path d={`M ${O[0] + 11} ${O[1]} L ${O[0] + 11} ${O[1] - 11} L ${O[0]} ${O[1] - 11}`} className="th2-right" fill="none" />}
        <circle cx={O[0]} cy={O[1]} r="3" className="th2-dot1" />
        {labels(map).map((l, i) => <text key={i} x={l.q[0] + (l.dx || 0)} y={l.q[1] + (l.dy || 0)} className="th2-label">{l.t}</text>)}
      </Svg>
      <Sliders defs={defs} params={p} set={set} />
      <Readout lines={ro} />
    </>
  )
}

// ----------------------------------------------------------------- trapezoid
function TrapezoidFig() {
  const [ml, setMl] = useState(false)
  const defs = [{ k: 'a', min: 1, max: 5, step: 0.5, def: 2.5 }, { k: 'b', min: 2, max: 6, step: 0.5, def: 5 }, { k: 'h', min: 1, max: 5, step: 0.5, def: 3 }]
  const [p, set] = useParams(defs)
  const unit = [[0, 0], [p.b, 0], [(p.b + p.a) / 2, p.h], [(p.b - p.a) / 2, p.h]]
  const [map] = fitter(unit, 300, 240, 38)
  const [D, C, Bt, At] = unit.map(map) // bottom-left, bottom-right, top-right, top-left
  const mAD = mid(At, D), mBC = mid(Bt, C)
  const area = (p.a + p.b) / 2 * p.h
  return (
    <>
      <Svg>
        <polygon points={`${P(At)} ${P(Bt)} ${P(C)} ${P(D)}`} className="th2-shape" />
        {ml && <line x1={mAD[0]} y1={mAD[1]} x2={mBC[0]} y2={mBC[1]} className="th2-aux1" />}
        <line x1={At[0]} y1={At[1]} x2={At[0]} y2={D[1]} className="th2-aux3 th2-dash" />
        <text x={At[0] - 16} y={mid(At, [At[0], D[1]])[1]} className="th2-label-sm">h</text>
        <text x={mid(At, Bt)[0]} y={At[1] - 7} className="th2-label">a</text>
        <text x={mid(D, C)[0]} y={D[1] + 18} className="th2-label">b</text>
      </Svg>
      <Sliders defs={defs} params={p} set={set} />
      <Chips items={[{ key: 'ml', label: 'შუახაზი', on: ml, toggle: () => setMl((v) => !v) }]} />
      <Readout lines={[`a = ${p.a}, b = ${p.b}, h = ${p.h}`, `S = ½(a+b)·h = ${fmt(area)}`, `შუახაზი m = (a+b)/2 = ${fmt((p.a + p.b) / 2)}`]} />
    </>
  )
}

// ------------------------------------------------------------------- circle
function CircleFig() {
  const [on, setOn] = useState({ radius: true })
  const [p, set] = useParams([{ k: 'R', min: 1, max: 6, step: 0.5, def: 4 }, { k: 'α', min: 20, max: 330, step: 10, def: 90 }])
  const t = (k) => setOn((o) => ({ ...o, [k]: !o[k] }))
  const O = [150, 116], R = p.R * 15
  const pt = (deg) => [O[0] + R * Math.cos((deg * Math.PI) / 180), O[1] - R * Math.sin((deg * Math.PI) / 180)]
  const arcPath = (d1, d2) => { const p1 = pt(d1), p2 = pt(d2); const large = ((d2 - d1 + 360) % 360) > 180 ? 1 : 0; return `M ${O[0]} ${O[1]} L ${P(p1)} A ${R} ${R} 0 ${large} 0 ${P(p2)} Z` }
  const tg = pt(50), tdir = [Math.cos((140) * Math.PI / 180), -Math.sin((140) * Math.PI / 180)]
  const aA = pt(160), aB = pt(160 - p.α), insC = pt(160 - p.α / 2 - 180)
  const circ = 2 * Math.PI * p.R, area = Math.PI * p.R * p.R
  const arcLen = Math.PI * p.R * p.α / 180, sectArea = Math.PI * p.R * p.R * p.α / 360
  return (
    <>
      <Svg>
        {on.sector && <path d={arcPath(160, 160 - p.α)} className="th2-fill1" />}
        <circle cx={O[0]} cy={O[1]} r={R} className="th2-shape" fill="none" />
        <circle cx={O[0]} cy={O[1]} r="3" className="th2-dot1" />
        <text x={O[0] - 14} y={O[1] + 4} className="th2-label-sm">O</text>
        {on.radius && [<line key="r" x1={O[0]} y1={O[1]} x2={pt(35)[0]} y2={pt(35)[1]} className="th2-aux1" />, <text key="rt" x={(O[0] + pt(35)[0]) / 2} y={(O[1] + pt(35)[1]) / 2 - 5} className="th2-label-sm">R</text>]}
        {on.diameter && <line x1={pt(200)[0]} y1={pt(200)[1]} x2={pt(20)[0]} y2={pt(20)[1]} className="th2-aux4" />}
        {on.chord && <line x1={pt(250)[0]} y1={pt(250)[1]} x2={pt(305)[0]} y2={pt(305)[1]} className="th2-aux2" />}
        {on.tangent && [<line key="tg" x1={tg[0] - tdir[0] * 70} y1={tg[1] - tdir[1] * 70} x2={tg[0] + tdir[0] * 70} y2={tg[1] + tdir[1] * 70} className="th2-aux3" />, <line key="tr" x1={O[0]} y1={O[1]} x2={tg[0]} y2={tg[1]} className="th2-aux1" />]}
        {on.angles && [<line key="oa" x1={O[0]} y1={O[1]} x2={aA[0]} y2={aA[1]} className="th2-aux1" />, <line key="ob" x1={O[0]} y1={O[1]} x2={aB[0]} y2={aB[1]} className="th2-aux1" />, <line key="ca" x1={insC[0]} y1={insC[1]} x2={aA[0]} y2={aA[1]} className="th2-aux2" />, <line key="cb" x1={insC[0]} y1={insC[1]} x2={aB[0]} y2={aB[1]} className="th2-aux2" />, <text key="c2" x={O[0] - 8} y={O[1] - 14} className="th2-label-sm">{fmt(p.α)}°</text>, <text key="c1" x={insC[0] - 6} y={insC[1] + 16} className="th2-label-sm">{fmt(p.α / 2)}°</text>]}
      </Svg>
      <Sliders defs={[{ k: 'R', min: 1, max: 6, step: 0.5, def: 4 }, { k: 'α', label: 'α°', min: 20, max: 330, step: 10, def: 90 }]} params={p} set={set} />
      <Chips items={[
        { key: 'radius', label: 'რადიუსი', on: on.radius, toggle: () => t('radius') },
        { key: 'diameter', label: 'დიამეტრი', on: on.diameter, toggle: () => t('diameter') },
        { key: 'chord', label: 'ქორდა', on: on.chord, toggle: () => t('chord') },
        { key: 'sector', label: 'სექტორი', on: on.sector, toggle: () => t('sector') },
        { key: 'tangent', label: 'მხები', on: on.tangent, toggle: () => t('tangent') },
        { key: 'angles', label: 'ცენტრ./ჩახაზ. კუთხე', on: on.angles, toggle: () => t('angles') },
      ]} />
      <Readout lines={[`R = ${p.R}`, `C = 2πR ≈ ${fmt(circ)}`, `S = πR² ≈ ${fmt(area)}`, ...(on.sector || on.angles ? [`რკალი (α=${p.α}°) ≈ ${fmt(arcLen)},  სექტორი ≈ ${fmt(sectArea)}`] : [])]} />
    </>
  )
}

// ------------------------------------------------------------ regular polygon
function RegularPolygonFig() {
  const [n, setN] = useState(6)
  const [on, setOn] = useState({ circum: true, incircle: true })
  const t = (k) => setOn((o) => ({ ...o, [k]: !o[k] }))
  const O = [150, 118], R = 86
  const verts = []
  for (let i = 0; i < n; i++) { const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n; verts.push([O[0] + R * Math.cos(ang), O[1] + R * Math.sin(ang)]) }
  const rIn = R * Math.cos(Math.PI / n)
  const interior = ((n - 2) * 180) / n, central = 360 / n
  return (
    <>
      <Svg>
        {on.circum && <circle cx={O[0]} cy={O[1]} r={R} className="th2-aux4" fill="none" />}
        {on.incircle && <circle cx={O[0]} cy={O[1]} r={rIn} className="th2-aux2" fill="none" />}
        <polygon points={verts.map(P).join(' ')} className="th2-shape" />
        <circle cx={O[0]} cy={O[1]} r="2.5" className="th2-dot1" />
      </Svg>
      <div className="th-sliders">
        <label className="th-slider"><span className="th-slider-k">გვერდები n = {n}</span>
          <input type="range" min="3" max="12" value={n} onChange={(e) => setN(+e.target.value)} /></label>
      </div>
      <div className="th2-chips">
        <button type="button" className={'th2-chip' + (on.circum ? ' on' : '')} onClick={() => t('circum')}>შემოხაზული წრე</button>
        <button type="button" className={'th2-chip' + (on.incircle ? ' on' : '')} onClick={() => t('incircle')}>ჩახაზული წრე</button>
      </div>
      <Readout lines={[`n = ${n}`, `შიდა კუთხე = (n−2)·180°/n = ${fmt(interior)}°`, `ცენტრალური კუთხე = 360°/n = ${fmt(central)}°`, `S = ½·P·r  (r — აპოთემა)`]} />
    </>
  )
}

// -------------------------------------------------------------- pythagoras
function PythagorasFig() {
  const [p, set] = useParams([{ k: 'a', min: 2, max: 5, step: 0.5, def: 4 }, { k: 'b', min: 2, max: 5, step: 0.5, def: 3 }])
  const a = p.a, b = p.b, c = Math.hypot(a, b)
  const A = [0, 0], C = [a, 0], B = [0, b]
  const sqA = [[0, 0], [a, 0], [a, -a], [0, -a]]           // on leg a (below)
  const sqB = [[0, 0], [0, b], [-b, b], [-b, 0]]           // on leg b (left)
  const sqC = [B, C, [a + b, a], [b, a + b]]               // on hypotenuse (outward)
  const allPts = [...sqA, ...sqB, ...sqC, A, B, C]
  const [map] = fitter(allPts, 300, 240, 22)
  const poly = (q) => q.map(map).map(P).join(' ')
  const ctr = (q) => { const m = q.map(map); return [(m[0][0] + m[2][0]) / 2, (m[0][1] + m[2][1]) / 2] }
  const cA = ctr(sqA), cB = ctr(sqB), cC = ctr(sqC)
  return (
    <>
      <Svg>
        <polygon points={poly(sqA)} className="th2-sqA" />
        <polygon points={poly(sqB)} className="th2-sqB" />
        <polygon points={poly(sqC)} className="th2-sqC" />
        <polygon points={poly([A, B, C])} className="th2-shape" />
        <text x={cA[0]} y={cA[1]} className="th2-label-sm th2-center">a² = {fmt(a * a)}</text>
        <text x={cB[0]} y={cB[1]} className="th2-label-sm th2-center">b² = {fmt(b * b)}</text>
        <text x={cC[0]} y={cC[1]} className="th2-label-sm th2-center">c² = {fmt(c * c)}</text>
      </Svg>
      <Sliders defs={[{ k: 'a', min: 2, max: 5, step: 0.5, def: 4 }, { k: 'b', min: 2, max: 5, step: 0.5, def: 3 }]} params={p} set={set} />
      <Readout lines={[`a = ${a}, b = ${b}`, `a² + b² = ${fmt(a * a)} + ${fmt(b * b)} = ${fmt(a * a + b * b)}`, `c² = ${fmt(c * c)}  →  c = ${fmt(c)}`]} />
    </>
  )
}

// -------------------------------------------------------------------- angles
function AnglesFig() {
  const ref = useRef(null)
  const toPt = useSvgPoint(ref)
  const [deg, setDeg] = useState(52)
  const drag = useRef(false)
  const V = [60, 188], L = 150
  const r1 = [V[0] + L, V[1]]
  const r2 = [V[0] + L * Math.cos((-deg * Math.PI) / 180), V[1] + L * Math.sin((-deg * Math.PI) / 180)]
  function update(e) { if (!drag.current) return; const p = toPt(e); let d = (Math.atan2(V[1] - p[1], p[0] - V[0]) * 180) / Math.PI; d = Math.max(0, Math.min(180, d)); setDeg(Math.round(d)) }
  const kind = deg < 90 ? 'მახვილი' : deg === 90 ? 'მართი' : deg < 180 ? 'ბლაგვი' : 'გაშლილი'
  const aR = 40
  const arc = `M ${V[0] + aR} ${V[1]} A ${aR} ${aR} 0 ${deg > 180 ? 1 : 0} 0 ${V[0] + aR * Math.cos((-deg * Math.PI) / 180)} ${V[1] + aR * Math.sin((-deg * Math.PI) / 180)}`
  return (
    <>
      <Svg svgRef={ref} style={{ touchAction: 'none' }} onPointerDown={(e) => { drag.current = true; update(e) }} onPointerMove={update} onPointerUp={() => (drag.current = false)} onPointerLeave={() => (drag.current = false)}>
        <line x1={V[0]} y1={V[1]} x2={r1[0]} y2={r1[1]} className="th2-shape" />
        <line x1={V[0]} y1={V[1]} x2={r2[0]} y2={r2[1]} className="th2-shape" />
        <path d={arc} className="th2-aux1" fill="none" />
        {deg === 90 && <path d={`M ${V[0] + 16} ${V[1]} L ${V[0] + 16} ${V[1] - 16} L ${V[0]} ${V[1] - 16}`} className="th2-right" fill="none" />}
        <circle cx={r2[0]} cy={r2[1]} r="7" className="th2-handle" />
        <text x={V[0] + 48} y={V[1] - 14} className="th2-label">{deg}°</text>
        <text x="8" y="22" className="th2-label-sm">{kind} კუთხე</text>
      </Svg>
      <div className="th2-chips"><span className="th2-hint">↔ გადაათრიე წერტილი კუთხის შესაცვლელად</span></div>
    </>
  )
}

// ------------------------------------------------------------- coordinate plane
function CoordFig() {
  const ref = useRef(null)
  const toPt = useSvgPoint(ref)
  const O = [150, 120], U = 26
  const gx = (x) => O[0] + x * U, gy = (y) => O[1] - y * U
  const inv = (q) => [Math.round((q[0] - O[0]) / U), Math.round((O[1] - q[1]) / U)]
  const [A, setA] = useState([-3, 1]); const [B, setB] = useState([2, -2])
  const drag = useRef(null)
  function move(e) { if (!drag.current) return; let g = inv(toPt(e)); g = [Math.max(-5, Math.min(5, g[0])), Math.max(-4, Math.min(4, g[1]))]; drag.current === 'A' ? setA(g) : setB(g) }
  const d = Math.hypot(A[0] - B[0], A[1] - B[1])
  const grid = []
  for (let i = -5; i <= 5; i++) grid.push(<line key={'v' + i} x1={gx(i)} y1={gy(-4)} x2={gx(i)} y2={gy(4)} className="th2-grid" />)
  for (let j = -4; j <= 4; j++) grid.push(<line key={'h' + j} x1={gx(-5)} y1={gy(j)} x2={gx(5)} y2={gy(j)} className="th2-grid" />)
  return (
    <>
      <Svg svgRef={ref} style={{ touchAction: 'none' }} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}>
        {grid}
        <line x1={gx(-5)} y1={gy(0)} x2={gx(5)} y2={gy(0)} className="th2-axis" />
        <line x1={gx(0)} y1={gy(-4)} x2={gx(0)} y2={gy(4)} className="th2-axis" />
        <line x1={gx(A[0])} y1={gy(A[1])} x2={gx(B[0])} y2={gy(B[1])} className="th2-aux1" />
        <line x1={gx(A[0])} y1={gy(A[1])} x2={gx(B[0])} y2={gy(A[1])} className="th2-aux3 th2-dash" />
        <line x1={gx(B[0])} y1={gy(A[1])} x2={gx(B[0])} y2={gy(B[1])} className="th2-aux3 th2-dash" />
        <circle cx={gx(A[0])} cy={gy(A[1])} r="6" className="th2-handle" onPointerDown={() => (drag.current = 'A')} />
        <circle cx={gx(B[0])} cy={gy(B[1])} r="6" className="th2-handle" onPointerDown={() => (drag.current = 'B')} />
        <text x={gx(A[0]) + 8} y={gy(A[1]) - 8} className="th2-label-sm">A({A[0]},{A[1]})</text>
        <text x={gx(B[0]) + 8} y={gy(B[1]) - 8} className="th2-label-sm">B({B[0]},{B[1]})</text>
      </Svg>
      <div className="th2-chips"><span className="th2-hint">↔ გადაათრიე A და B</span></div>
      <Readout lines={[`AB = √((x₂−x₁)² + (y₂−y₁)²)`, `AB = √(${A[0] - B[0]}² + ${A[1] - B[1]}²) = ${fmt(d)}`]} />
    </>
  )
}

// ---------------------------------------------- parallel lines + transversal
function ParallelLinesFig() {
  const defs = [{ k: 'theta', label: 'დახრა θ°', min: 38, max: 80, step: 2, def: 56 }]
  const [p, set] = useParams(defs)
  const [pair, setPair] = useState('corr')
  const deg = p.theta, th = (deg * Math.PI) / 180
  const y1 = 74, y2 = 170, ax = 110, r = 22
  const bx = ax + (y2 - y1) / Math.tan(th)
  const A = [ax, y1], B = [bx, y2], dir = [Math.cos(th), Math.sin(th)], ext = 46
  const t1 = [A[0] - dir[0] * ext, A[1] - dir[1] * ext], t2 = [B[0] + dir[0] * ext, B[1] + dir[1] * ext]
  const pt = (V, a, rr) => [V[0] + rr * Math.cos(a), V[1] + rr * Math.sin(a)]
  const SLOT = { BR: [0, th], BL: [th, Math.PI], TL: [Math.PI, Math.PI + th], TR: [Math.PI + th, 2 * Math.PI] }
  const VAL = { BR: deg, TL: deg, BL: 180 - deg, TR: 180 - deg }
  const V = { A, B }
  const PAIRS = {
    corr: { sel: [['A', 'BR'], ['B', 'BR']], name: 'შესაბამისი კუთხეები', eq: true },
    alti: { sel: [['A', 'BR'], ['B', 'TL']], name: 'შიდა ჯვარედინი კუთხეები', eq: true },
    alte: { sel: [['A', 'TL'], ['B', 'BR']], name: 'გარე ჯვარედინი კუთხეები', eq: true },
    coint: { sel: [['A', 'BR'], ['B', 'TR']], name: 'ცალმხრივი (შიდა) კუთხეები', eq: false },
  }
  const sel = PAIRS[pair].sel
  const isSel = (vk, sl) => sel.some(([v, s]) => v === vk && s === sl)
  const sector = (vk, sl) => { const [a1, a2] = SLOT[sl]; return `M ${P(V[vk])} L ${P(pt(V[vk], a1, r))} A ${r} ${r} 0 0 1 ${P(pt(V[vk], a2, r))} Z` }
  const chev = (x, y) => `M ${x - 4} ${y - 5} L ${x + 4} ${y} L ${x - 4} ${y + 5}`
  return (
    <>
      <Svg>
        <line x1="14" y1={y1} x2="286" y2={y1} className="th2-shape" />
        <line x1="14" y1={y2} x2="286" y2={y2} className="th2-shape" />
        <path d={chev(250, y1)} className="th2-aux4" fill="none" />
        <path d={chev(250, y2)} className="th2-aux4" fill="none" />
        <line x1={t1[0]} y1={t1[1]} x2={t2[0]} y2={t2[1]} className="th2-aux1" />
        {['A', 'B'].flatMap((vk) => ['BR', 'BL', 'TL', 'TR'].map((sl) => {
          const on = isSel(vk, sl)
          return <path key={vk + sl} d={sector(vk, sl)} className={on ? 'th2-fill1' : 'th2-thin'} />
        }))}
        {sel.map(([vk, sl], i) => { const [a1, a2] = SLOT[sl]; const q = pt(V[vk], (a1 + a2) / 2, r + 13); return <text key={i} x={q[0]} y={q[1] + 4} className="th2-label-sm th2-center">{VAL[sl]}°</text> })}
        <circle cx={A[0]} cy={A[1]} r="3" className="th2-dot1" />
        <circle cx={B[0]} cy={B[1]} r="3" className="th2-dot1" />
      </Svg>
      <Sliders defs={defs} params={p} set={set} />
      <Chips items={[
        { key: 'corr', label: 'შესაბამისი', on: pair === 'corr', toggle: () => setPair('corr') },
        { key: 'alti', label: 'შიდა ჯვარედინი', on: pair === 'alti', toggle: () => setPair('alti') },
        { key: 'alte', label: 'გარე ჯვარედინი', on: pair === 'alte', toggle: () => setPair('alte') },
        { key: 'coint', label: 'ცალმხრივი', on: pair === 'coint', toggle: () => setPair('coint') },
      ]} />
      <Readout lines={[PAIRS[pair].name, PAIRS[pair].eq ? `${deg}° = ${deg}°  (ტოლია)` : `${deg}° + ${180 - deg}° = 180°`]} />
    </>
  )
}

export default function Shape2D({ kind }) {
  switch (kind) {
    case 'parallel-lines': return <ParallelLinesFig />
    case 'triangle': return <TriangleFig />
    case 'right-triangle': return <RightTriangleFig />
    case 'parallelogram': return <QuadFig kind="parallelogram" />
    case 'rhombus': return <QuadFig kind="rhombus" />
    case 'rectangle': return <QuadFig kind="rectangle" />
    case 'trapezoid': return <TrapezoidFig />
    case 'circle': return <CircleFig />
    case 'regular-polygon': return <RegularPolygonFig />
    case 'pythagoras': return <PythagorasFig />
    case 'angles': return <AnglesFig />
    case 'coordinate-plane': return <CoordFig />
    default: return null
  }
}
