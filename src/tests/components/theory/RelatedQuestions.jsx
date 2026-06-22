import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadTheoryRelated } from '../../lib/data.js'
import { asset } from '../../lib/format.js'
import HtmlMath from '../HtmlMath.jsx'

function QCard({ q }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rq-card">
      <div className="rq-head">
        <span className="rq-src">{q.sourceTitle}{q.number ? ` · #${q.number}` : ''}</span>
        <span className="rq-pts">{q.points || 1} ქ.</span>
      </div>
      <HtmlMath className="rq-stem" html={q.stem_html} />
      {(q.figures || []).map((f, i) => <img key={i} className="rq-fig" src={asset(f)} alt="" loading="lazy" />)}
      {q.type === 'mcq' && (
        <ul className="rq-opts">
          {q.options.map((o) => (
            <li key={o.letter} className={'rq-opt' + (open && o.letter === q.correct ? ' correct' : '')}>
              <HtmlMath tag="span" html={o.html} />
              {open && o.letter === q.correct && <span className="rq-check">✓</span>}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="rq-toggle" onClick={() => setOpen((s) => !s)}>
        {open ? 'პასუხის დამალვა' : 'პასუხი და ახსნა'}
      </button>
      {open && (
        <div className="rq-expl">
          {q.type !== 'mcq' && q.correct && <div className="rq-ans">პასუხი: <b>{q.correct}</b></div>}
          {q.type === 'mcq' && <div className="rq-ans">სწორი პასუხი: <b>{q.correct}</b></div>}
          {q.expl && <HtmlMath html={q.expl} />}
          <Link to={`/tests/test/${q.slug}`} className="rq-link">სრული ტესტის ნახვა →</Link>
        </div>
      )}
    </div>
  )
}

export default function RelatedQuestions({ topicId }) {
  const [map, setMap] = useState(null)
  useEffect(() => { loadTheoryRelated().then(setMap).catch(() => setMap({})) }, [])
  if (!map) return null
  const qs = map[topicId]
  if (!qs || !qs.length) return null
  return (
    <section className="related-q">
      <h2 className="related-q-title">კითხვები ტესტებიდან <span className="related-q-n">{qs.length}</span></h2>
      <p className="related-q-sub">ამ თემაზე დაფუძნებული რეალური საგამოცდო კითხვები — სცადე, შემდეგ ნახე პასუხი და ახსნა.</p>
      {qs.map((q) => <QCard key={q.key} q={q} />)}
    </section>
  )
}
