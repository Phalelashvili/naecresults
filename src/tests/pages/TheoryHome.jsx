import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadTheoryIndex } from '../lib/data.js'
import { useBookmarks, useNotes } from '../lib/theory-store.js'
import Highlight, { makeSnippet, matchRank } from '../components/theory/Highlight.jsx'

const NAEC_PROGRAM =
  'https://naec.ge/uploads/postData/2026/%E1%83%9E%E1%83%A0%E1%83%9D%E1%83%92%E1%83%A0%E1%83%90%E1%83%9B%E1%83%94%E1%83%91%E1%83%98/%E1%83%9B%E1%83%90%E1%83%97%E1%83%94%E1%83%9B%E1%83%90%E1%83%A2%E1%83%98%E1%83%99%E1%83%98%E1%83%A1%20%E1%83%9B%E1%83%98%E1%83%9B%E1%83%90%E1%83%A0%E1%83%97%E1%83%A3%E1%83%9A%E1%83%94%E1%83%91%E1%83%90.pdf'

function TopicCard({ s, t, marks, noted }) {
  return (
    <Link to={`/theory/${t.section}/${t.slug}`} className="th-topic-card" style={{ '--c': s.colour }}>
      <span className="th-topic-num">{t.num}</span>
      <span className="th-topic-title">{t.title}</span>
      <span className="th-topic-badges">
        {noted?.has(t.id) && <span className="th-topic-note" title="ჩანაწერი">📝</span>}
        {marks?.has(t.id) && <span className="th-topic-star" title="სანიშნე">★</span>}
        {t.hasShape && <span className="th-topic-shape" title="ინტერაქტიული ფიგურა">◆</span>}
      </span>
    </Link>
  )
}

function SectionPanel({ s, marks, noted }) {
  return (
    <details className="th-sec-panel" style={{ '--c': s.colour }}>
      <summary className="th-sec-summary">
        <span className="th-sec-dot" />
        <h2 className="th-sec-name">{s.ka}</h2>
        <span className="th-sec-count">{s.count} თემა</span>
        <span className="th-sec-chev">▾</span>
      </summary>
      <div className="th-topic-grid">
        {s.topics.map((t) => <TopicCard key={t.id} s={s} t={t} marks={marks} noted={noted} />)}
      </div>
    </details>
  )
}

export default function TheoryHome() {
  const [index, setIndex] = useState(null)
  const [err, setErr] = useState(null)
  const [query, setQuery] = useState('')
  useEffect(() => {
    loadTheoryIndex().then(setIndex).catch((e) => setErr(e.message))
  }, [])

  const queryRaw = query.trim()
  const q = queryRaw.toLowerCase()
  const matches = useMemo(() => {
    if (!index || !q) return null
    const out = []
    for (const s of index.sections) {
      for (const t of s.topics) {
        const rank = matchRank(t.title, t.q, s.ka, q)
        if (rank < 0) continue
        out.push({ s, t, rank, snip: makeSnippet(t.q, queryRaw) })
      }
    }
    out.sort((a, b) => a.rank - b.rank) // title matches first, then content
    return out
  }, [index, q])

  const bookmarks = useBookmarks()
  const notesMap = useNotes()
  const lookup = useMemo(() => {
    const m = {}
    if (index) for (const s of index.sections) for (const t of s.topics) m[t.id] = { s, t }
    return m
  }, [index])

  if (err) return <div className="wrap"><div className="error-box">შეცდომა: {err}</div></div>
  if (!index) return <div className="wrap"><div className="loading">იტვირთება…</div></div>

  const total = index.sections.reduce((n, s) => n + s.count, 0)
  const marks = new Set(bookmarks)
  const noted = new Set(Object.keys(notesMap))
  const bookmarked = bookmarks.map((id) => lookup[id]).filter(Boolean)
  let lastGroup = null

  return (
    <div className="wrap theory-home">
      <div className="theory-hero">
        <div className="theory-hero-kicker">თეორია · მათემატიკა</div>
        <h1 className="theory-hero-title">გაიმეორე ყველაფერი გამოცდის წინ</h1>
        <p className="theory-hero-sub">
          ეროვნული გამოცდების მათემატიკის სრული თეორია — ძირითადი ცნებები, ფორმულები და
          ინტერაქტიული ფიგურები ({total} თემა), დალაგებული ოფიციალური საგამოცდო პროგრამის მიხედვით.
        </p>
        <a className="theory-src" href={NAEC_PROGRAM} target="_blank" rel="noopener noreferrer">
          📄 ოფიციალური პროგრამა (NAEC)
        </a>
      </div>

      <div className="theory-searchbar">
        <span className="theory-search-ico">🔍</span>
        <input
          className="theory-search"
          placeholder="თემის ძებნა — მაგ. დისკრიმინანტი, მოცულობა, ვექტორი…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && <button className="theory-search-clear" onClick={() => setQuery('')} aria-label="გასუფთავება">✕</button>}
      </div>

      {!matches && bookmarked.length > 0 && (
        <section className="bm-panel">
          <div className="bm-head">
            <h2 className="bm-title">★ სანიშნეები</h2>
            <span className="bm-count">{bookmarked.length}</span>
          </div>
          <div className="th-topic-grid">
            {bookmarked.map(({ s, t }) => <TopicCard key={t.id} s={s} t={t} marks={marks} noted={noted} />)}
          </div>
        </section>
      )}

      {matches ? (
        <div className="th-results">
          <div className="th-results-head">{matches.length} შედეგი „{query.trim()}"-ზე</div>
          {matches.length === 0 && <p className="muted center">ვერაფერი მოიძებნა.</p>}
          <div className="th-topic-grid th-results-grid">
            {matches.map(({ s, t, snip }) => (
              <Link key={t.id} to={`/theory/${t.section}/${t.slug}`} className="th-topic-card th-result-card" style={{ '--c': s.colour }}>
                <span className="th-topic-num">{t.num}</span>
                <span className="th-topic-title">
                  <span className="th-result-title"><Highlight text={t.title} query={queryRaw} /></span>
                  <span className="th-result-sec">{s.ka}</span>
                  {snip && <span className="th-result-snip"><Highlight text={snip} query={queryRaw} /></span>}
                </span>
                <span className="th-topic-badges">
                  {noted.has(t.id) && <span className="th-topic-note" title="ჩანაწერი">📝</span>}
                  {marks.has(t.id) && <span className="th-topic-star" title="სანიშნე">★</span>}
                  {t.hasShape && <span className="th-topic-shape" title="ინტერაქტიული ფიგურა">◆</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        index.sections.map((s) => {
          const head = s.group && s.group !== lastGroup ? s.group : null
          lastGroup = s.group || null
          return (
            <div key={s.id}>
              {head && <div className="th-group-head">{head}</div>}
              <SectionPanel s={s} marks={marks} noted={noted} />
            </div>
          )
        })
      )}
    </div>
  )
}
