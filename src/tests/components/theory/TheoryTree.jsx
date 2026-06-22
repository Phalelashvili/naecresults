import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useBookmarks, useNotes } from '../../lib/theory-store.js'
import Highlight, { makeSnippet, matchRank } from './Highlight.jsx'

// Groups consecutive sections that share a `group` (e.g. გეომეტრია) under one
// heading; everything else is a top-level section.
function grouped(sections) {
  const out = []
  for (const s of sections) {
    if (s.group) {
      const last = out[out.length - 1]
      if (last && last.type === 'group' && last.label === s.group) last.sections.push(s)
      else out.push({ type: 'group', label: s.group, sections: [s] })
    } else {
      out.push({ type: 'section', section: s })
    }
  }
  return out
}

function Section({ s, currentId, marks, noted }) {
  const open = s.topics.some((t) => t.id === currentId)
  return (
    <details className="tt-section" open={open}>
      <summary className="tt-summary" style={{ '--c': s.colour }}>
        <span className="tt-dot" />
        <span className="tt-name">{s.ka}</span>
        <span className="tt-count">{s.count}</span>
      </summary>
      <ul className="tt-list">
        {s.topics.map((t) => <TopicLink key={t.id} s={s} t={t} marks={marks} noted={noted} />)}
      </ul>
    </details>
  )
}

function TopicLink({ s, t, showSec, marks, noted, query, snip }) {
  return (
    <li>
      <NavLink to={`/theory/${t.section}/${t.slug}`} className={({ isActive }) => 'tt-link' + (isActive ? ' active' : '') + (snip ? ' has-snip' : '')}>
        <span className="tt-num">{t.num}</span>
        <span className="tt-title">
          <span className="tt-title-row">
            <Highlight text={t.title} query={query} />
            {showSec && <span className="tt-link-sec">{s.ka}</span>}
          </span>
          {snip && <span className="tt-snip"><Highlight text={snip} query={query} /></span>}
        </span>
        {noted?.has(t.id) && <span className="tt-note" title="ჩანაწერი">📝</span>}
        {marks?.has(t.id) && <span className="tt-star" title="სანიშნე">★</span>}
        {t.hasShape && <span className="tt-shape" title="ინტერაქტიული ფიგურა">◆</span>}
      </NavLink>
    </li>
  )
}

export default function TheoryTree({ sections, currentId }) {
  const [query, setQuery] = useState('')
  const queryRaw = query.trim()
  const q = queryRaw.toLowerCase()
  const marks = new Set(useBookmarks())
  const noted = new Set(Object.keys(useNotes()))

  const matches = useMemo(() => {
    if (!q) return null
    const out = []
    for (const s of sections) {
      for (const t of s.topics) {
        const rank = matchRank(t.title, t.q, s.ka, q)
        if (rank < 0) continue
        out.push({ s, t, rank, snip: makeSnippet(t.q, queryRaw, 48) })
      }
    }
    out.sort((a, b) => a.rank - b.rank)
    return out
  }, [sections, q])

  return (
    <nav className="theory-tree">
      <div className="tt-search">
        <input className="tt-search-in" placeholder="🔍 ძებნა…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button className="tt-search-clear" onClick={() => setQuery('')} aria-label="გასუფთავება">✕</button>}
      </div>

      {matches ? (
        <ul className="tt-list tt-flat">
          {matches.length === 0 && <li className="tt-empty">ვერ მოიძებნა</li>}
          {matches.map(({ s, t, snip }) => <TopicLink key={t.id} s={s} t={t} showSec marks={marks} noted={noted} query={queryRaw} snip={snip} />)}
        </ul>
      ) : (
        grouped(sections).map((node, i) =>
          node.type === 'group' ? (
            <div className="tt-group" key={i}>
              <div className="tt-group-label">{node.label}</div>
              {node.sections.map((s) => <Section key={s.id} s={s} currentId={currentId} marks={marks} noted={noted} />)}
            </div>
          ) : (
            <Section key={node.section.id} s={node.section} currentId={currentId} marks={marks} noted={noted} />
          ),
        )
      )}
    </nav>
  )
}
