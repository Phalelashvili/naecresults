import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadIndex, loadSubjects } from '../lib/data.js'
import SavedStrip from '../components/SavedStrip.jsx'

function VariantCard({ t, colour }) {
  return (
    <Link to={`/tests/test/${t.slug}`} className="test-card" style={{ '--c': colour }}>
      <div className="tc-top">
        <span className="tc-year">ვარიანტი {t.variant || 1}</span>
        {t.hasAudio && <span className="tc-audio" title="მოსასმენი ნაწილით">🎧</span>}
      </div>
      <div className="tc-foot">
        <span>{t.numQuestions} კითხვა</span>
        {t.numOpen > 0 && <span className="tc-open">{t.numOpen} ღია</span>}
      </div>
    </Link>
  )
}

export default function Home() {
  const [subjects, setSubjects] = useState([])
  const [index, setIndex] = useState([])
  const [query, setQuery] = useState('')
  const [subj, setSubj] = useState('all')
  const [err, setErr] = useState(null)

  useEffect(() => {
    Promise.all([loadSubjects(), loadIndex()])
      .then(([s, i]) => {
        setSubjects(s)
        setIndex(i)
      })
      .catch((e) => setErr(e.message))
  }, [])

  const colourOf = (id) => subjects.find((s) => s.id === id)?.colour || '#4f46e5'
  const multiSubject = subjects.length > 1

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return index.filter((t) => {
      if (subj !== 'all' && t.subject !== subj) return false
      if (!q) return true
      return `${t.subjectKa} ${t.year} ${t.variant} ვარიანტი ${t.title}`.toLowerCase().includes(q)
    })
  }, [index, query, subj])

  // group by year (newest first), then by subject (catalogue order) within.
  const byYear = useMemo(() => {
    const order = subjects.map((s) => s.id)
    const m = new Map()
    for (const t of filtered) {
      if (!m.has(t.year)) m.set(t.year, new Map())
      const sm = m.get(t.year)
      if (!sm.has(t.subject)) sm.set(t.subject, [])
      sm.get(t.subject).push(t)
    }
    return [...m.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, sm]) => ({
        year,
        subjects: [...sm.entries()]
          .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
          .map(([id, list]) => ({
            id,
            meta: subjects.find((s) => s.id === id),
            tests: list.sort((a, b) => a.variant - b.variant),
          })),
      }))
  }, [filtered, subjects])

  if (err) return <div className="wrap"><div className="error-box">შეცდომა: {err}</div></div>

  return (
    <div className="wrap tests-home">
      <Link to="/tests/random" className="random-cta">
        <span className="random-cta-ico">🎲</span>
        <span className="random-cta-text">
          <strong>შემთხვევითი ტესტი · მათემატიკა</strong>
          <small>შეარჩიე მათემატიკის კითხვები ყველა წლის ტესტებიდან — სასურველი რაოდენობით</small>
        </span>
        <span className="random-cta-btn">აწყობა →</span>
      </Link>

      <Link to="/tests/extra" className="extra-cta">
        <span className="extra-cta-ico">🧩</span>
        <span className="extra-cta-text">
          <strong>დამატებითი ამოცანები</strong>
          <small>ამოცანათა კრებულის ამოცანები — ნაბიჯ-ნაბიჯ, ინტერაქტიული ახსნით</small>
        </span>
        <span className="extra-cta-arr">→</span>
      </Link>

      <SavedStrip />

      <div className="home-toolbar">
        {multiSubject && (
          <div className="subj-filter" role="tablist">
            <button className={`subj-chip ${subj === 'all' ? 'on' : ''}`} onClick={() => setSubj('all')}>
              ყველა საგანი
            </button>
            {subjects.map((s) => (
              <button
                key={s.id}
                className={`subj-chip ${subj === s.id ? 'on' : ''}`}
                style={{ '--c': s.colour }}
                onClick={() => setSubj(s.id)}
              >
                {s.ka} <span className="sc-n">{s.tests}</span>
              </button>
            ))}
          </div>
        )}
        <input
          className="search"
          placeholder="ძებნა (საგანი, წელი, ვარიანტი)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {byYear.length === 0 && <p className="muted center">ვერაფერი მოიძებნა.</p>}

      {byYear.map(({ year, subjects: subs }) => {
        const total = subs.reduce((n, s) => n + s.tests.length, 0)
        return (
          <section className="year-section" key={year}>
            <div className="year-head">
              <h2 className="year-big">{year}</h2>
              <span className="year-total">{total} ვარიანტი</span>
            </div>
            {subs.map(({ id, meta, tests }) => {
              const colour = meta?.colour || colourOf(id)
              return (
                <div className="subj-row" key={id} style={{ '--c': colour }}>
                  <div className="subj-tag">
                    <span className="subj-dot" />
                    {meta?.ka || id}
                  </div>
                  <div className="card-grid">
                    {tests.map((t) => (
                      <VariantCard key={t.slug} t={t} colour={colour} />
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
