import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadProblemsIndex } from '../lib/data.js'
import Katex from '../components/theory/Katex.jsx'

// Hub for "დამატებითი ამოცანები" — selected problems with worked solutions.
export default function ExtraHome() {
  const [items, setItems] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    loadProblemsIndex().then((d) => setItems(d.problems || [])).catch((e) => setErr(e.message))
  }, [])

  if (err) return <div className="wrap"><div className="error-box">შეცდომა: {err}</div></div>

  return (
    <div className="wrap xp">
      <div className="theory-crumb">
        <Link to="/tests">ტესტები</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-cur">დამატებითი ამოცანები</span>
      </div>

      <header className="xp-hero">
        <h1>დამატებითი ამოცანები</h1>
        <p className="muted">
          ამოცანათა კრებულებიდან შერჩეული, სტანდარტული ტესტების მიღმა დარჩენილი ამოცანები — თითოეული
          ამოხსნილია ნაბიჯ-ნაბიჯ, ინტერაქტიული ვიზუალიზაციითა და დაწვრილებითი ახსნით.
        </p>
      </header>

      {!items ? (
        <div className="loading">იტვირთება…</div>
      ) : items.length === 0 ? (
        <p className="muted center">ჯერ არაფერია დამატებული.</p>
      ) : (
        <div className="xp-grid">
          {items.map((p) => (
            <Link key={p.id} to={`/tests/extra/${p.slug}`} className="xp-card">
              <div className="xp-card-top">
                {p.num && <span className="xp-num">{p.num}</span>}
                {p.difficulty && <span className="xp-diff">{p.difficulty}</span>}
              </div>
              <div className="xp-card-eq"><Katex tex={p.statementTex} /></div>
              <h3 className="xp-card-title">{p.title}</h3>
              {p.tags?.length > 0 && (
                <div className="xp-card-tags">
                  {p.tags.slice(0, 4).map((t) => <span key={t}>{t}</span>)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
