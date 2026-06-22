import { useRef, useState } from 'react'

// Interactive function grapher. Each family has slider/choice params; the curve,
// key features (roots, vertex, asymptotes) and the equation update live.

const HW = 132, HH = 102, CX = 150, CY = 118
const fmt = (x) => {
  if (!isFinite(x)) return '—'
  const r = Math.round(x * 100) / 100
  return Number.isInteger(r) ? String(r) : String(r)
}
const sgn = (v) => (v >= 0 ? '+' : '−')

const FAMILIES = {
  linear: {
    label: 'წრფივი — y = kx + b',
    params: [{ k: 'k', min: -3, max: 3, step: 0.5, def: 1 }, { k: 'b', min: -4, max: 4, step: 1, def: 1 }],
    xr: 5, yr: 5,
    f: (x, p) => p.k * x + p.b,
    eq: (p) => `y = ${p.k}x ${sgn(p.b)} ${Math.abs(p.b)}`,
    feats: (p) => ({ points: [{ x: 0, y: p.b, label: 'y₀' }], notes: [`დახრა k = ${p.k}`, `y-კვეთა = ${p.b}`] }),
  },
  quadratic: {
    label: 'კვადრატული — y = ax² + bx + c',
    params: [{ k: 'a', min: -2, max: 2, step: 0.5, def: 1 }, { k: 'b', min: -4, max: 4, step: 1, def: -1 }, { k: 'c', min: -4, max: 4, step: 1, def: -2 }],
    xr: 5, yr: 5,
    f: (x, p) => p.a * x * x + p.b * x + p.c,
    eq: (p) => `y = ${p.a}x² ${sgn(p.b)} ${Math.abs(p.b)}x ${sgn(p.c)} ${Math.abs(p.c)}`,
    feats: (p) => {
      if (p.a === 0) return { points: [], notes: ['a = 0 → წრფივი ფუნქცია'] }
      const D = p.b * p.b - 4 * p.a * p.c
      const vx = -p.b / (2 * p.a), vy = p.c - (p.b * p.b) / (4 * p.a)
      const pts = [{ x: vx, y: vy, label: 'წვერო' }]
      const notes = [`D = b²−4ac = ${fmt(D)}`]
      if (D > 0) {
        const r1 = (-p.b - Math.sqrt(D)) / (2 * p.a), r2 = (-p.b + Math.sqrt(D)) / (2 * p.a)
        pts.push({ x: r1, y: 0, label: '' }, { x: r2, y: 0, label: '' })
        notes.push(`ფესვები: x = ${fmt(r1)}, ${fmt(r2)}`)
      } else if (D === 0) { pts.push({ x: vx, y: 0, label: '' }); notes.push(`ერთი ფესვი: x = ${fmt(vx)}`) }
      else notes.push('ნამდვილი ფესვი არ აქვს')
      notes.push(`წვერო (${fmt(vx)}, ${fmt(vy)})`)
      return { points: pts, notes }
    },
  },
  cubic: {
    label: 'კუბური — y = ax³',
    params: [{ k: 'a', min: -2, max: 2, step: 0.5, def: 1 }],
    xr: 3, yr: 5,
    f: (x, p) => p.a * x ** 3,
    eq: (p) => `y = ${p.a}x³`,
    feats: () => ({ points: [{ x: 0, y: 0, label: '' }], notes: ['კენტი ფუნქცია; განსაზღვრის არე ℝ'] }),
  },
  sqrt: {
    label: 'კვადრატული ფესვი — y = √x',
    params: [{ k: 'k', min: 0.5, max: 3, step: 0.5, def: 1 }],
    xr: 9, yr: 5,
    f: (x, p) => (x < 0 ? NaN : p.k * Math.sqrt(x)),
    eq: (p) => `y = ${p.k === 1 ? '' : p.k}√x`,
    feats: () => ({ points: [{ x: 0, y: 0, label: '' }], notes: ['განსაზღვრის არე: x ≥ 0', 'ზრდადი'] }),
  },
  reciprocal: {
    label: 'უკუპროპორცია — y = k/x',
    params: [{ k: 'k', min: -4, max: 4, step: 1, def: 2 }],
    xr: 5, yr: 5,
    f: (x, p) => (x === 0 ? NaN : p.k / x),
    eq: (p) => `y = ${p.k}/x`,
    vlines: () => [0], hlines: () => [0],
    feats: (p) => ({ points: [], notes: ['ასიმპტოტები: x = 0, y = 0', p.k > 0 ? 'I და III მეოთხედი' : 'II და IV მეოთხედი'] }),
  },
  exp: {
    label: 'მაჩვენებლიანი — y = aˣ',
    params: [{ k: 'a', min: 1.2, max: 3, step: 0.2, def: 2 }],
    xr: 4, yr: 5,
    f: (x, p) => p.a ** x,
    eq: (p) => `y = ${p.a}ˣ`,
    hlines: () => [0],
    feats: () => ({ points: [{ x: 0, y: 1, label: '(0,1)' }], notes: ['ასიმპტოტა: y = 0', 'მნიშვნელობათა სიმრავლე: y > 0', 'ზრდადი (a > 1)'] }),
  },
  log: {
    label: 'ლოგარითმული — y = logₐx',
    params: [{ k: 'a', min: 1.2, max: 3, step: 0.2, def: 2 }],
    xr: 8, yr: 5,
    f: (x, p) => (x <= 0 ? NaN : Math.log(x) / Math.log(p.a)),
    eq: (p) => `y = log_${p.a} x`,
    vlines: () => [0],
    feats: () => ({ points: [{ x: 1, y: 0, label: '(1,0)' }], notes: ['ასიმპტოტა: x = 0', 'განსაზღვრის არე: x > 0', 'მაჩვენებლიანის შებრუნებული'] }),
  },
  trig: {
    label: 'ტრიგონომეტრიული — y = A·f(x)',
    params: [{ k: 'fn', choices: ['sin', 'cos', 'tan'], def: 'sin' }, { k: 'A', min: 0.5, max: 2.5, step: 0.5, def: 1 }],
    xr: 6.5,
    yr: (p) => (p.fn === 'tan' ? 5 : Math.max(2.5, p.A + 0.6)),
    f: (x, p) => p.A * (p.fn === 'sin' ? Math.sin(x) : p.fn === 'cos' ? Math.cos(x) : Math.tan(x)),
    eq: (p) => `y = ${p.A === 1 ? '' : p.A}${p.fn === 'tan' ? 'tg' : p.fn} x`,
    vlines: (p) => (p.fn === 'tan' ? [-3 * Math.PI / 2, -Math.PI / 2, Math.PI / 2, 3 * Math.PI / 2] : []),
    feats: (p) => ({ points: [], notes: [p.fn === 'tan' ? 'პერიოდი π; ასიმპტოტები π/2 + πn' : `პერიოდი 2π; ამპლიტუდა ${p.A}`] }),
  },
}

function val(x, p) { return typeof x === 'function' ? x(p) : x }

export default function Graph2D({ family }) {
  const isGallery = family === 'gallery'
  const order = ['linear', 'quadratic', 'cubic', 'sqrt', 'reciprocal', 'exp', 'log', 'trig']
  const [fam, setFam] = useState(isGallery ? 'quadratic' : family)
  const F = FAMILIES[fam] || FAMILIES.linear
  const [params, setParams] = useState(() => Object.fromEntries(F.params.map((d) => [d.k, d.def])))

  // when family changes (gallery), reset params to that family's defaults
  const famRef = useRef(fam)
  if (famRef.current !== fam) {
    famRef.current = fam
    const np = Object.fromEntries((FAMILIES[fam] || FAMILIES.linear).params.map((d) => [d.k, d.def]))
    // eslint-disable-next-line
    if (JSON.stringify(np) !== JSON.stringify(params)) setParams(np)
  }

  const xr = val(F.xr, params), yr = val(F.yr, params)
  const ux = HW / xr, uy = HH / yr
  const sx = (x) => CX + x * ux
  const sy = (y) => CY - y * uy

  // sample the curve into polyline segments (breaks across gaps/asymptotes)
  const NS = 260, cap = yr * 1.5
  const segs = []
  let cur = []
  for (let i = 0; i <= NS; i++) {
    const x = -xr + (2 * xr * i) / NS
    const y = F.f(x, params)
    if (!isFinite(y) || Math.abs(y) > cap) { if (cur.length > 1) segs.push(cur); cur = []; continue }
    cur.push(`${sx(x).toFixed(1)},${sy(y).toFixed(1)}`)
  }
  if (cur.length > 1) segs.push(cur)

  const feats = F.feats ? F.feats(params) : { points: [], notes: [] }
  const vlines = F.vlines ? F.vlines(params) : []
  const hlines = F.hlines ? F.hlines(params) : []

  const grid = []
  for (let i = Math.ceil(-xr); i <= xr; i++) grid.push(<line key={'v' + i} x1={sx(i)} y1={sy(-yr)} x2={sx(i)} y2={sy(yr)} className="th2-grid" />)
  for (let j = Math.ceil(-yr); j <= yr; j++) grid.push(<line key={'h' + j} x1={sx(-xr)} y1={sy(j)} x2={sx(xr)} y2={sy(j)} className="th2-grid" />)

  return (
    <div className="th2-graphwrap">
      {isGallery && (
        <select className="th-select" value={fam} onChange={(e) => setFam(e.target.value)}>
          {order.map((o) => <option key={o} value={o}>{FAMILIES[o].label}</option>)}
        </select>
      )}
      <svg className="th2-svg" viewBox="0 0 300 236">
        {grid}
        <line x1={sx(-xr)} y1={sy(0)} x2={sx(xr)} y2={sy(0)} className="th2-axis" />
        <line x1={sx(0)} y1={sy(-yr)} x2={sx(0)} y2={sy(yr)} className="th2-axis" />
        {vlines.map((x, i) => <line key={'va' + i} x1={sx(x)} y1={sy(-yr)} x2={sx(x)} y2={sy(yr)} className="th2-aux3 th2-dash" />)}
        {hlines.map((y, i) => <line key={'ha' + i} x1={sx(-xr)} y1={sy(y)} x2={sx(xr)} y2={sy(y)} className="th2-aux3 th2-dash" />)}
        {segs.map((s, i) => <polyline key={i} points={s.join(' ')} className="th2-curve" />)}
        {feats.points.map((pt, i) => (
          <g key={i}>
            <circle cx={sx(pt.x)} cy={sy(pt.y)} r="3.6" className="th2-dot1" />
            {pt.label && <text x={sx(pt.x) + 6} y={sy(pt.y) - 6} className="th2-label-sm">{pt.label}</text>}
          </g>
        ))}
      </svg>
      <div className="th-sliders">
        {F.params.map((d) => d.choices ? (
          <label key={d.k} className="th-slider">
            <span className="th-slider-k">{d.k}</span>
            <select className="th-select sm" value={params[d.k]} onChange={(e) => setParams((p) => ({ ...p, [d.k]: e.target.value }))}>
              {d.choices.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        ) : (
          <label key={d.k} className="th-slider">
            <span className="th-slider-k">{d.k} = {params[d.k]}</span>
            <input type="range" min={d.min} max={d.max} step={d.step} value={params[d.k]}
              onChange={(e) => setParams((p) => ({ ...p, [d.k]: +e.target.value }))} />
          </label>
        ))}
      </div>
      <div className="th-readout">
        <div className="th-readout-line th-readout-given">{F.eq(params)}</div>
        {feats.notes.map((n, i) => <div key={i} className="th-readout-line">{n}</div>)}
      </div>
    </div>
  )
}
