import { Link } from 'react-router-dom'
import { loadAttempts } from '../lib/session.js'

const PALETTE = { math: '#4f46e5', georgian: '#0ea5e9', english: '#f59e0b' }

function fmtShort(ts) {
  try {
    return new Date(ts).toLocaleDateString('ka-GE', { day: '2-digit', month: 'short' })
  } catch (e) {
    return ''
  }
}

function SavedCard({ a }) {
  const colour = PALETTE[a.subject] || '#4f46e5'
  const to = a.slug && a.slug !== 'random' ? `/tests/test/${a.slug}` : '/tests/random'
  const pct = a.pct ?? 0
  return (
    <Link to={to} className="ss-card" style={{ '--c': colour, '--pct': pct }}>
      <div className="ss-ring"><span>{pct}%</span></div>
      <div className="ss-info">
        <div className="ss-subj">{a.subjectKa || a.subject}</div>
        <div className="ss-meta">
          {a.year || ''}{a.variant ? ` · ვარ. ${a.variant}` : ''}
        </div>
        <div className="ss-foot">
          <span className="ss-score">{a.correct}/{a.gradable} სწორი</span>
          <span className="ss-date">{fmtShort(a.ts)}</span>
        </div>
      </div>
    </Link>
  )
}

// Horizontal strip of recently saved attempts, shown on the home page just
// below the random-test CTA. Renders nothing when there are no saved results.
export default function SavedStrip({ limit = 10 }) {
  const all = loadAttempts()
  if (!all.length) return null
  const shown = all.slice(0, limit)
  return (
    <section className="saved-strip">
      <div className="ss-head">
        <h2 className="ss-title">📌 შენახული შედეგები</h2>
        <Link to="/tests/saved" className="ss-all">ყველას ნახვა ({all.length}) →</Link>
      </div>
      <div className="ss-scroll">
        {shown.map((a) => (
          <SavedCard key={a.id} a={a} />
        ))}
      </div>
    </section>
  )
}
