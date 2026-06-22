import { useEffect, useRef, useState } from 'react'

// Tiny dependency-free 3D engine: rotate -> perspective-project -> painter's
// algorithm with flat shading. Convex solids only, so back-to-front fill order
// alone gives correct occlusion. Dimensions are slider-adjustable and the
// volume / surface-area formulas update live below the figure.

const CAM = 4.6
const SCALE = 50
const CX = 150
const CY = 122
const TARGET = 1.18 // normalized half-extent the solid is scaled to fit
const LIGHT = norm([-0.35, 0.7, 0.9])
const PI = Math.PI

function norm(v) {
  const m = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / m, v[1] / m, v[2] / m]
}
function rotate([x, y, z], ax, ay) {
  const cy = Math.cos(ay), sy = Math.sin(ay)
  let X = x * cy + z * sy
  let Z = -x * sy + z * cy
  const cx = Math.cos(ax), sx = Math.sin(ax)
  const Y = y * cx - Z * sx
  Z = y * sx + Z * cx
  return [X, Y, Z]
}
function project([x, y, z]) {
  const p = CAM / (CAM - z)
  return [CX + x * p * SCALE, CY - y * p * SCALE, z]
}
function faceNormal(a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  return norm([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]])
}
function ring(n, r, y, rot = 0) {
  const a = []
  for (let i = 0; i < n; i++) {
    const t = rot + (i * 2 * PI) / n
    a.push([r * Math.cos(t), y, r * Math.sin(t)])
  }
  return a
}
const fmt = (x) => {
  const r = Math.round(x * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

// ---- per-kind: adjustable params, raw geometry, and live formulas ----
const PARAMS = {
  cube: [{ k: 'a', min: 1, max: 6, step: 0.5, def: 3 }],
  box: [
    { k: 'a', min: 1, max: 6, step: 0.5, def: 4 },
    { k: 'b', min: 1, max: 6, step: 0.5, def: 2.5 },
    { k: 'c', min: 1, max: 6, step: 0.5, def: 3 },
  ],
  prism: [
    { k: 'R', min: 1, max: 5, step: 0.5, def: 2.5 },
    { k: 'h', min: 1, max: 6, step: 0.5, def: 3 },
  ],
  'prism-tri': [
    { k: 'R', min: 1, max: 5, step: 0.5, def: 2.5 },
    { k: 'h', min: 1, max: 6, step: 0.5, def: 3 },
  ],
  pyramid: [
    { k: 'a', min: 1, max: 6, step: 0.5, def: 3 },
    { k: 'h', min: 1, max: 6, step: 0.5, def: 3.5 },
  ],
  cylinder: [
    { k: 'R', min: 1, max: 5, step: 0.5, def: 2 },
    { k: 'h', min: 1, max: 6, step: 0.5, def: 3.5 },
  ],
  cone: [
    { k: 'R', min: 1, max: 5, step: 0.5, def: 2.5 },
    { k: 'h', min: 1, max: 6, step: 0.5, def: 3.5 },
  ],
  sphere: [{ k: 'R', min: 1, max: 5, step: 0.5, def: 3 }],
}

function buildRaw(kind, p) {
  if (kind === 'cube' || kind === 'box') {
    const a = (kind === 'cube' ? p.a : p.a) / 2
    const b = (kind === 'cube' ? p.a : p.b) / 2
    const c = (kind === 'cube' ? p.a : p.c) / 2
    const V = [
      [-a, -b, -c], [a, -b, -c], [a, b, -c], [-a, b, -c],
      [-a, -b, c], [a, -b, c], [a, b, c], [-a, b, c],
    ]
    const faces = [
      { v: [4, 5, 6, 7], t: 'flat' }, { v: [0, 1, 2, 3], t: 'flat' },
      { v: [0, 4, 7, 3], t: 'flat' }, { v: [1, 5, 6, 2], t: 'flat' },
      { v: [3, 2, 6, 7], t: 'flat' }, { v: [0, 1, 5, 4], t: 'flat' },
    ]
    const labels = kind === 'box'
      ? [{ t: 'a', p: [0, -b, c] }, { t: 'b', p: [a, 0, c] }, { t: 'c', p: [a, -b, 0] }]
      : [{ t: 'a', p: [0, -a, a] }]
    return { verts: V, faces, labels }
  }
  if (kind === 'prism' || kind === 'prism-tri') {
    const n = kind === 'prism-tri' ? 3 : 6, R = p.R, h = p.h / 2
    const top = ring(n, R, h, PI / n), bot = ring(n, R, -h, PI / n)
    const V = [...top, ...bot]
    const faces = [{ v: top.map((_, i) => i), t: 'cap' }, { v: bot.map((_, i) => n + (n - 1 - i)), t: 'cap' }]
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; faces.push({ v: [n + i, n + j, j, i], t: 'flat' }) }
    return { verts: V, faces, labels: [{ t: 'h', p: [R * Math.cos(PI / n), 0, R * Math.sin(PI / n)] }, { t: 'R', p: [R / 2, h, 0] }] }
  }
  if (kind === 'pyramid') {
    const a = p.a / 2, h = p.h
    const V = [[-a, -h / 2, -a], [a, -h / 2, -a], [a, -h / 2, a], [-a, -h / 2, a], [0, h / 2, 0]]
    const faces = [
      { v: [3, 2, 1, 0], t: 'cap' },
      { v: [0, 1, 4], t: 'flat' }, { v: [1, 2, 4], t: 'flat' }, { v: [2, 3, 4], t: 'flat' }, { v: [3, 0, 4], t: 'flat' },
    ]
    return { verts: V, faces, labels: [{ t: 'h', p: [0, 0, 0] }, { t: 'a', p: [0, -h / 2, a] }] }
  }
  if (kind === 'cylinder') {
    const n = 44, R = p.R, h = p.h / 2
    const top = ring(n, R, h), bot = ring(n, R, -h)
    const V = [...top, ...bot]
    const faces = [{ v: top.map((_, i) => i), t: 'cap' }, { v: bot.map((_, i) => n + (n - 1 - i)), t: 'cap' }]
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; faces.push({ v: [n + i, n + j, j, i], t: 'side' }) }
    return { verts: V, faces, labels: [{ t: 'R', p: [R / 2, h, 0] }, { t: 'h', p: [R, 0, 0] }] }
  }
  if (kind === 'cone') {
    const n = 44, R = p.R, h = p.h
    const bot = ring(n, R, -h / 2)
    const V = [...bot, [0, h / 2, 0]]
    const apex = n
    const faces = [{ v: bot.map((_, i) => n - 1 - i), t: 'cap' }]
    for (let i = 0; i < n; i++) faces.push({ v: [i, (i + 1) % n, apex], t: 'side' })
    return { verts: V, faces, labels: [{ t: 'R', p: [R / 2, -h / 2, 0] }, { t: 'h', p: [0.05, 0, 0] }] }
  }
  return null
}

function buildScaled(kind, p) {
  const g = buildRaw(kind, p)
  let maxAbs = 0
  for (const v of g.verts) maxAbs = Math.max(maxAbs, Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]))
  const s = TARGET / (maxAbs || 1)
  return {
    verts: g.verts.map((v) => [v[0] * s, v[1] * s, v[2] * s]),
    faces: g.faces,
    labels: g.labels.map((l) => ({ t: l.t, p: [l.p[0] * s, l.p[1] * s, l.p[2] * s] })),
  }
}

function readout(kind, p) {
  switch (kind) {
    case 'cube': return [`a = ${p.a}`, `V = a³ = ${fmt(p.a ** 3)}`, `S = 6a² = ${fmt(6 * p.a ** 2)}`]
    case 'box': return [
      `a=${p.a}, b=${p.b}, c=${p.c}`,
      `V = a·b·c = ${fmt(p.a * p.b * p.c)}`,
      `S = 2(ab+bc+ca) = ${fmt(2 * (p.a * p.b + p.b * p.c + p.c * p.a))}`,
      `d = √(a²+b²+c²) = ${fmt(Math.hypot(p.a, p.b, p.c))}`,
    ]
    case 'prism': {
      const base = (3 * Math.sqrt(3) / 2) * p.R ** 2
      return [`R=${p.R}, h=${p.h}`, `S_ფუძე = (3√3/2)R² ≈ ${fmt(base)}`, `V = S_ფუძე·h ≈ ${fmt(base * p.h)}`, `S_გვ = P·h = ${fmt(6 * p.R * p.h)}`]
    }
    case 'prism-tri': {
      const s = p.R * Math.sqrt(3), base = (Math.sqrt(3) / 4) * s ** 2
      return [`გვერდი a ≈ ${fmt(s)}, h=${p.h}`, `S_ფუძე = (√3/4)a² ≈ ${fmt(base)}`, `V = S_ფუძე·h ≈ ${fmt(base * p.h)}`, `S_გვ = 3a·h ≈ ${fmt(3 * s * p.h)}`]
    }
    case 'pyramid': {
      const m = Math.hypot(p.h, p.a / 2)
      return [`a=${p.a}, h=${p.h}`, `V = ⅓a²h = ${fmt(p.a ** 2 * p.h / 3)}`, `S = a² + 2a·m ≈ ${fmt(p.a ** 2 + 2 * p.a * m)}`]
    }
    case 'cylinder': return [`R=${p.R}, h=${p.h}`, `V = πR²h ≈ ${fmt(PI * p.R ** 2 * p.h)}`, `S = 2πR(R+h) ≈ ${fmt(2 * PI * p.R * (p.R + p.h))}`]
    case 'cone': {
      const l = Math.hypot(p.R, p.h)
      return [`R=${p.R}, h=${p.h}, l≈${fmt(l)}`, `V = ⅓πR²h ≈ ${fmt(PI * p.R ** 2 * p.h / 3)}`, `S = πR(R+l) ≈ ${fmt(PI * p.R * (p.R + l))}`]
    }
    case 'sphere': return [`R = ${p.R}`, `V = (4/3)πR³ ≈ ${fmt(4 / 3 * PI * p.R ** 3)}`, `S = 4πR² ≈ ${fmt(4 * PI * p.R ** 2)}`]
    default: return []
  }
}

function shadeColor(t, type) {
  const L = 44 + 33 * t
  return `hsl(${type === 'cap' ? 248 : 244} 68% ${L}%)`
}

function Solid({ kind, params, ax, ay }) {
  const g = buildScaled(kind, params)
  const rv = g.verts.map((p) => rotate(p, ax, ay))
  const pv = rv.map(project)
  const faces = g.faces
    .map((f) => {
      let nrm = faceNormal(rv[f.v[0]], rv[f.v[1]], rv[f.v[2]])
      if (nrm[2] < 0) nrm = [-nrm[0], -nrm[1], -nrm[2]]
      const bright = Math.max(0, nrm[0] * LIGHT[0] + nrm[1] * LIGHT[1] + nrm[2] * LIGHT[2])
      const z = f.v.reduce((s, i) => s + rv[i][2], 0) / f.v.length
      const pts = f.v.map((i) => `${pv[i][0].toFixed(1)},${pv[i][1].toFixed(1)}`).join(' ')
      return { pts, z, fill: shadeColor(bright, f.t), t: f.t }
    })
    .sort((p, q) => p.z - q.z)
  return (
    <g>
      {faces.map((f, i) => (
        <polygon key={i} points={f.pts} fill={f.fill}
          stroke={f.t === 'side' ? 'rgba(40,30,90,.10)' : 'rgba(30,22,70,.75)'}
          strokeWidth={f.t === 'side' ? 0.6 : 1.1} strokeLinejoin="round" />
      ))}
      {g.labels.map((l, i) => {
        const [x, y] = project(rotate(l.p, ax, ay))
        return <text key={i} x={x} y={y} className="th3-label">{l.t}</text>
      })}
    </g>
  )
}

function Sphere({ ax, ay }) {
  const R = 1.12
  const lines = []
  for (let k = -2; k <= 2; k++) {
    const th = (k * PI) / 6
    lines.push(ring(48, R * Math.cos(th), R * Math.sin(th)))
  }
  for (let m = 0; m < 6; m++) {
    const phi = (m * PI) / 6, ps = []
    for (let i = 0; i <= 48; i++) {
      const t = -PI / 2 + (i * PI) / 48
      ps.push([R * Math.cos(t) * Math.cos(phi), R * Math.sin(t), R * Math.cos(t) * Math.sin(phi)])
    }
    lines.push(ps)
  }
  const rEdge = (CAM / CAM) * SCALE * R
  const surf = project(rotate([R, 0, 0], ax, ay))
  return (
    <g>
      <defs>
        <radialGradient id="th-sph" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="hsl(244 80% 78%)" />
          <stop offset="60%" stopColor="hsl(244 70% 58%)" />
          <stop offset="100%" stopColor="hsl(246 64% 42%)" />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={rEdge} fill="url(#th-sph)" stroke="rgba(30,22,70,.6)" strokeWidth="1.1" />
      {lines.map((ln, i) => {
        const d = ln.map((p, j) => { const [x, y] = project(rotate(p, ax, ay)); return `${j ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}` }).join(' ')
        return <path key={i} d={d} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="0.7" />
      })}
      <line x1={CX} y1={CY} x2={surf[0]} y2={surf[1]} stroke="#fff" strokeWidth="1.3" />
      <text x={(CX + surf[0]) / 2 + 4} y={(CY + surf[1]) / 2 - 3} className="th3-label th3-label-light">R</text>
    </g>
  )
}

export default function Shape3D({ kind }) {
  const defs = PARAMS[kind] || []
  const [params, setParams] = useState(() => Object.fromEntries(defs.map((d) => [d.k, d.def])))
  const [ang, setAng] = useState({ x: -0.5, y: 0.7 })
  const [spin, setSpin] = useState(true)
  const drag = useRef(null)
  const spinning = useRef(true)
  spinning.current = spin

  useEffect(() => {
    let prev = null, id = 0
    const loop = (t) => {
      id = requestAnimationFrame(loop)
      if (prev == null) prev = t
      const dt = (t - prev) / 1000; prev = t
      if (spinning.current && !drag.current) setAng((a) => ({ ...a, y: a.y + dt * 0.5 }))
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  function down(e) { e.currentTarget.setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, ax: ang.x, ay: ang.y } }
  function move(e) {
    if (!drag.current) return
    let nx = drag.current.ax + (e.clientY - drag.current.y) * 0.01
    nx = Math.max(-1.3, Math.min(1.3, nx))
    setAng({ x: nx, y: drag.current.ay + (e.clientX - drag.current.x) * 0.01 })
  }
  function up(e) { drag.current = null; e.currentTarget.releasePointerCapture?.(e.pointerId) }

  const lines = readout(kind, params)
  return (
    <div className="th3-wrap">
      <svg className="th3-svg" viewBox="0 0 300 244" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
        {kind === 'sphere' ? <Sphere ax={ang.x} ay={ang.y} /> : <Solid kind={kind} params={params} ax={ang.x} ay={ang.y} />}
      </svg>
      {defs.length > 0 && (
        <div className="th-sliders">
          {defs.map((d) => (
            <label key={d.k} className="th-slider">
              <span className="th-slider-k">{d.k} = {params[d.k]}</span>
              <input type="range" min={d.min} max={d.max} step={d.step} value={params[d.k]}
                onChange={(e) => setParams((p) => ({ ...p, [d.k]: +e.target.value }))} />
            </label>
          ))}
        </div>
      )}
      <div className="th-readout">
        {lines.map((l, i) => <div key={i} className={'th-readout-line' + (i === 0 ? ' th-readout-given' : '')}>{l}</div>)}
      </div>
      <div className="th3-ctrls">
        <button type="button" className="th3-btn" onClick={() => setSpin((s) => !s)}>{spin ? '⏸ ბრუნვა' : '▶ ბრუნვა'}</button>
        <button type="button" className="th3-btn" onClick={() => setAng({ x: -0.5, y: 0.7 })}>↺ ხედი</button>
      </div>
    </div>
  )
}
