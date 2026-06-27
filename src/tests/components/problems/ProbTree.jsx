import { useState } from 'react'
import HtmlMath from '../HtmlMath.jsx'
import { PROB_SPECS } from './prob-specs.js'

// Two-event independent-probability tree. Each leaf is a path (e.g. boy→boy);
// click a leaf to trace its branch probabilities and see the product. The
// favourable leaf (spec.target) is outlined; selecting it shows P = product.
const W = 320, H = 212

const gcd = (a, b) => (b ? gcd(b, a % b) : a)
const parse = (s) => { const [n, d] = s.split('/').map(Number); return { n, d } }
const fracTex = (s) => { const f = parse(s); return f.d === 1 ? `${f.n}` : `\\tfrac{${f.n}}{${f.d}}` }
function product(path) {
  let n = 1, d = 1
  for (const b of path) { const f = parse(b.p); n *= f.n; d *= f.d }
  const g = gcd(n, d) || 1
  return { n: n / g, d: d / g }
}

export default function ProbTree({ spec: specKey }) {
  const spec = PROB_SPECS[specKey]
  const [sel, setSel] = useState(spec && spec.type === 'tree' ? spec.target : null)
  if (!spec || spec.type !== 'tree') return null
  const [B0, B1] = spec.branches

  const root = { x: 160, y: 22 }
  const lvl1 = [{ x: 92, y: 102, br: B0 }, { x: 228, y: 102, br: B1 }]
  const leaves = [
    { x: 34, y: 182, path: [B0, B0] }, { x: 118, y: 182, path: [B0, B1] },
    { x: 202, y: 182, path: [B1, B0] }, { x: 286, y: 182, path: [B1, B1] },
  ].map((l) => ({ ...l, key: l.path.map((b) => b.key).join('') }))

  const selLeaf = leaves.find((l) => l.key === sel) || leaves[0]
  const edges = [
    { a: root, b: lvl1[0], br: B0, on: selLeaf.path[0].key === B0.key },
    { a: root, b: lvl1[1], br: B1, on: selLeaf.path[0].key === B1.key },
    { a: lvl1[0], b: leaves[0], br: B0, on: sel === leaves[0].key },
    { a: lvl1[0], b: leaves[1], br: B1, on: sel === leaves[1].key },
    { a: lvl1[1], b: leaves[2], br: B0, on: sel === leaves[2].key },
    { a: lvl1[1], b: leaves[3], br: B1, on: sel === leaves[3].key },
  ]

  const prod = product(selLeaf.path)
  const pexpr = selLeaf.path.map((b) => fracTex(b.p)).join('\\cdot ') + '=' + fracTex(`${prod.n}/${prod.d}`)
  const pathLabels = selLeaf.path.map((b) => b.label).join(' → ')
  const isTarget = sel === spec.target

  return (
    <div className="pt">
      <svg className={'pt-svg' + (isTarget ? ' is-target' : '')} viewBox={`0 0 ${W} ${H}`}>
        {edges.map((e, i) => {
          const mx = (e.a.x + e.b.x) / 2, my = (e.a.y + e.b.y) / 2
          return (
            <g key={i}>
              <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} className={'pt-edge' + (e.on ? ' on' : '')} />
              <text x={mx + (e.b.x < e.a.x ? -7 : 7)} y={my} className="pt-elabel">{e.br.label} · {e.br.p}</text>
            </g>
          )
        })}
        {[root, ...lvl1].map((n, i) => <circle key={i} cx={n.x} cy={n.y} r="5" className="pt-node" />)}
        {leaves.map((l) => (
          <g key={l.key} className="pt-leaf-g" onClick={() => setSel(l.key)} style={{ cursor: 'pointer' }}>
            <rect x={l.x - 24} y={l.y - 2} width="48" height="22" rx="6"
              className={'pt-leaf' + (l.key === spec.target ? ' target' : '') + (l.key === sel ? ' sel' : '')} />
            <text x={l.x} y={l.y + 13} className="pt-leaf-t">{(() => { const p = product(l.path); return p.d === 1 ? p.n : `${p.n}/${p.d}` })()}</text>
          </g>
        ))}
        <text x={6} y={root.y + 4} className="pt-lvl">{spec.levelLabels[0]}</text>
        <text x={6} y={lvl1[0].y + 4} className="pt-lvl">{spec.levelLabels[1]}</text>
      </svg>
      <HtmlMath
        tag="div" className={'pt-readout' + (isTarget ? ' good' : '')}
        html={`<b>${pathLabels}</b> &nbsp; $P=${pexpr}$ ${isTarget ? '&nbsp; ✓ ხელსაყრელი' : ''}`}
      />
      <div className="pt-hint">დააწექი ფოთოლს გზის ასარჩევად. ოთხივე გზის ჯამი: 1/9 + 2/9 + 2/9 + 4/9 = 1.</div>
    </div>
  )
}
