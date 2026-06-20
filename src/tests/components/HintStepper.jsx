import { useState } from 'react'
import HtmlMath from './HtmlMath.jsx'

// Step-by-step essay hints, revealed one at a time. Deliberately usable *before*
// submitting — the point is to scaffold writing, not to give away an answer
// (there is no single correct essay). Each reveal uncovers the next small step:
// opening → thesis → analysis → argument → parallel → conclusion → self-check.
export default function HintStepper({ hints = [] }) {
  const [shown, setShown] = useState(0)
  if (!hints.length) return null
  const remaining = hints.length - shown

  return (
    <div className="hint-stepper">
      <ol className="hint-list">
        {hints.slice(0, shown).map((h, i) => (
          <li className="hint-item" key={i} style={{ '--i': i }}>
            <div className="hint-step">{i + 1}</div>
            <div className="hint-body">
              {h.title && <div className="hint-title">{h.title}</div>}
              <HtmlMath className="hint-text" html={h.body_html} />
            </div>
          </li>
        ))}
      </ol>
      <div className="hint-controls">
        {remaining > 0 ? (
          <>
            <button className="btn small" onClick={() => setShown((n) => n + 1)}>
              {shown === 0 ? 'მინიშნების ჩვენება' : 'შემდეგი მინიშნება'}
            </button>
            <span className="muted small">დარჩა {remaining} მინიშნება</span>
            {shown > 0 && (
              <button className="btn ghost small" onClick={() => setShown(hints.length)}>ყველას ჩვენება</button>
            )}
          </>
        ) : (
          <button className="btn ghost small" onClick={() => setShown(0)}>თავიდან დამალვა</button>
        )}
      </div>
    </div>
  )
}
