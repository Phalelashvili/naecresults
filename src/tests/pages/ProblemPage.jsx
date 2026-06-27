import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadProblem } from '../lib/data.js'
import Katex from '../components/theory/Katex.jsx'
import HtmlMath from '../components/HtmlMath.jsx'
import Solution from '../components/problems/Solution.jsx'

// A single worked problem: statement card + step-by-step interactive solution.
export default function ProblemPage() {
  const { slug } = useParams()
  const [p, setP] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    setP(null)
    setErr(null)
    loadProblem(slug).then(setP).catch((e) => setErr(e.message))
  }, [slug])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [slug])

  if (err) {
    return (
      <div className="wrap">
        <div className="error-box">ამოცანა ვერ მოიძებნა.</div>
        <Link to="/tests/extra" className="back-link">← ყველა ამოცანა</Link>
      </div>
    )
  }
  if (!p) return <div className="wrap"><div className="loading">იტვირთება…</div></div>

  return (
    <div className="wrap prob-page">
      <div className="theory-crumb">
        <Link to="/tests">ტესტები</Link>
        <span className="crumb-sep">/</span>
        <Link to="/tests/extra">დამატებითი ამოცანები</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-cur">{p.num || p.title}</span>
      </div>

      <header className="prob-head">
        {p.num && <span className="prob-num">{p.num}</span>}
        <h1 className="prob-title">{p.title}</h1>
      </header>

      <div className="prob-statement">
        {p.prompt && <HtmlMath tag="p" className="prob-prompt" html={p.prompt} />}
        <figure className="prob-eq"><Katex tex={p.statementTex} display /></figure>
      </div>

      {(p.tags?.length > 0 || p.difficulty || p.source) && (
        <div className="prob-tags">
          {(p.tags || []).map((t) => <span key={t} className="prob-tag">{t}</span>)}
          {p.difficulty && <span className="prob-tag diff">სირთულე: {p.difficulty}</span>}
          {p.source && <span className="prob-tag src">{p.source}</span>}
        </div>
      )}

      <Solution steps={p.steps} chain={p.chain} />

      <div className="prob-foot">
        <Link to="/tests/extra" className="topic-nav-btn all">← ყველა ამოცანა</Link>
      </div>
    </div>
  )
}
