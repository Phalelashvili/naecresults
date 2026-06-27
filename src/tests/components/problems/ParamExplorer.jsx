import { useState } from 'react'
import Katex from '../theory/Katex.jsx'
import HtmlMath from '../HtmlMath.jsx'
import NumberLine from './NumberLine.jsx'
import { PARAM_SPECS } from './param-specs.js'
import { fmt, approxEq } from '../../lib/solve.js'

// Interactive explorer for a parameter equation (see param-specs.js). Slide the
// parameter and watch the numerator's candidate roots, the denominator's
// forbidden points, the live solution count and the answer region on the axis.
export default function ParamExplorer({ kind }) {
  const spec = PARAM_SPECS[kind]
  const [a, setA] = useState(spec ? spec.range.def : 0)
  if (!spec) return null

  const { rhs, candidates } = spec.numerator(a)
  const forbidden = spec.forbidden(a)
  const evaluated = candidates.map((c) => {
    const hit = forbidden.find((f) => approxEq(f.x, c.x))
    return { ...c, dead: !!hit, hitLabel: hit ? hit.label : null }
  })
  const count = evaluated.filter((c) => !c.dead).length
  const ok = count === spec.target
  const dead = evaluated.filter((c) => c.dead)

  let reason
  if (rhs < -1e-9) reason = `მრიცხველს ამონახსნი არ აქვს ($|x| = ${fmt(rhs)} < 0$) — 0 ამონახსნი`
  else if (approxEq(rhs, 0)) reason = 'მხოლოდ ერთი კანდიდატი ($x = 0$)'
  else if (dead.length) reason = `კანდიდატი $x = ${fmt(dead[0].x)}$ დაემთხვა მნიშვნელის ნულს ($x = ${dead[0].hitLabel}$) → იკარგება`
  else reason = 'ორივე კანდიდატი ნამდვილია'

  const ss = spec.solutionSet
  return (
    <div className="pe">
      <figure className="pe-eq"><Katex tex={spec.equationTex(a)} display /></figure>

      <div className="pe-controls">
        <label className="pe-slider">
          <span className="pe-akey">{spec.param} = {fmt(a)}</span>
          <input
            type="range" min={spec.range.min} max={spec.range.max} step={spec.range.step}
            value={a} onChange={(e) => setA(+e.target.value)}
          />
        </label>
        <div className="pe-chips">
          {spec.chips.map((c) => (
            <button key={c.label} type="button" className={'pe-chip' + (approxEq(c.v, a) ? ' on' : '')} onClick={() => setA(c.v)}>
              {spec.param} = {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pe-grid">
        <div className="pe-col">
          <div className="pe-col-h">მრიცხველი → კანდიდატები</div>
          <div className="pe-eqline">|x| = {fmt(rhs)}</div>
          <div className="pe-cands">
            {evaluated.length === 0
              ? <span className="pe-empty">ამონახსნი არ აქვს</span>
              : evaluated.map((c, i) => (
                <span key={i} className={'pe-cand' + (c.dead ? ' dead' : ' live')}>
                  x = {fmt(c.x)}{c.dead && <em> = {c.hitLabel}</em>}
                </span>
              ))}
          </div>
        </div>
        <div className="pe-col">
          <div className="pe-col-h">მნიშვნელი → აკრძალული</div>
          <div className="pe-forb">
            <span className="pe-forbv">x = {fmt(a)} <em>(a)</em></span>
            <span className="pe-forbv">x = {fmt(a / 3)} <em>(a/3)</em></span>
          </div>
        </div>
      </div>

      <HtmlMath
        tag="div"
        className={'pe-verdict ' + (ok ? 'ok' : 'bad')}
        html={`<b>ამონახსნების რაოდენობა: ${count}</b> — ${reason}`}
      />

      <NumberLine
        min={ss.min} max={ss.max} intervals={ss.intervals} holes={ss.holes} specials={ss.specials}
        marker={a} markerOk={ok} onPick={setA}
      />

      <HtmlMath
        tag="div" className="pe-hint"
        html={'↳ გადაათრიე სლაიდერი ან რიცხვითი წრფე. რაოდენობა 2-დან 1-მდე ეცემა ზუსტად $a = -1$ და $a = -\\tfrac{9}{7}$ წერტილებში; დანარჩენ ადგილებზე $-\\tfrac{3}{2}$-ის მარჯვნივ ის ისევ 2-ია.'}
      />
    </div>
  )
}
