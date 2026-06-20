import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loadAttempts, deleteAttempt, clearAttempts } from '../lib/session.js'
import AnswerSheet from '../components/AnswerSheet.jsx'

const PALETTE = { math: '#4f46e5', georgian: '#0ea5e9', english: '#f59e0b' }

function fmt(ts) {
  try {
    const d = new Date(ts)
    return (
      d.toLocaleDateString('ka-GE') +
      ' ' +
      d.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })
    )
  } catch (e) {
    return ''
  }
}

export default function Saved() {
  const [items, setItems] = useState(() => loadAttempts())
  const [open, setOpen] = useState(null) // id of the attempt whose answer sheet is expanded

  function remove(id) {
    deleteAttempt(id)
    setItems(loadAttempts())
  }
  function clearAll() {
    if (!window.confirm('ნამდვილად წავშალო ყველა შენახული შედეგი?')) return
    clearAttempts()
    setItems([])
  }

  return (
    <div className="wrap saved-page">
      <div className="saved-head">
        <div>
          <Link to="/tests" className="back-link">← ტესტები</Link>
          <h1>შენახული შედეგები</h1>
        </div>
        {items.length > 0 && (
          <button className="btn ghost danger" onClick={clearAll}>ყველას წაშლა</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="saved-empty">
          <p>ჯერ არაფერი შეგინახავს.</p>
          <p className="muted">ტესტის დასრულების შემდეგ დააჭირე „💾 შედეგის შენახვა“-ს.</p>
          <Link to="/tests" className="btn">ტესტებზე გადასვლა</Link>
        </div>
      ) : (
        <div className="saved-grid">
          {items.map((a) => {
            const colour = PALETTE[a.subject] || '#4f46e5'
            const to = a.slug && a.slug !== 'random' ? `/tests/test/${a.slug}` : '/tests/random'
            const hasSheet = Array.isArray(a.rows) && a.rows.length > 0
            const isOpen = open === a.id
            return (
              <div className="saved-item" key={a.id} style={{ '--c': colour }}>
                <div className="saved-row">
                  <div className="sr-ring" style={{ '--pct': a.pct ?? 0 }}>
                    <span>{a.pct ?? 0}%</span>
                  </div>
                  <div className="sr-body">
                    <div className="sr-title">{a.title || a.subjectKa}</div>
                    <div className="sr-meta">
                      {a.subjectKa}
                      {a.year ? ` · ${a.year}` : ''}
                      {a.variant ? ` · ვარიანტი ${a.variant}` : ''}
                    </div>
                    <div className="sr-stats">
                      <span>სწორი {a.correct}/{a.gradable}</span>
                      <span>ქულა {a.gotPoints}/{a.points}</span>
                      <span className="sr-date">{fmt(a.ts)}</span>
                    </div>
                  </div>
                  <div className="sr-actions">
                    {hasSheet && (
                      <button className="btn small ghost" onClick={() => setOpen(isOpen ? null : a.id)}>
                        {isOpen ? 'დახურვა' : 'პასუხები'}
                      </button>
                    )}
                    <Link to={to} className="btn small">თავიდან</Link>
                    <button className="icon-btn" title="წაშლა" onClick={() => remove(a.id)}>🗑</button>
                  </div>
                </div>
                {isOpen && hasSheet && (
                  <div className="sr-sheet">
                    <AnswerSheet rows={a.rows} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
