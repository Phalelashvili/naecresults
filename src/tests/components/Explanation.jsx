import HtmlMath from './HtmlMath.jsx'

// Renders a generated explanation when present; nothing when absent (e.g. the
// listening questions, which have no transcript to ground an explanation in).
export default function Explanation({ q }) {
  const ex = q.explanation
  if (!ex) return null
  const perOption = ex.options && typeof ex.options === 'object'
  return (
    <div className="explain">
      <div className="explain-title">ახსნა</div>
      {ex.summary && <HtmlMath className="explain-summary" html={ex.summary} />}
      {perOption && (
        <ul className="explain-options">
          {q.options.map((o) =>
            ex.options[o.letter] ? (
              <li key={o.letter} className={o.letter === q.correct ? 'good' : 'bad'}>
                <span className="ex-badge">{o.letter}</span>
                <HtmlMath tag="span" html={ex.options[o.letter]} />
              </li>
            ) : null,
          )}
        </ul>
      )}
      {ex.mistake && (
        <div className="explain-mistake">
          <strong>ხშირი შეცდომა:</strong> <HtmlMath tag="span" html={ex.mistake} />
        </div>
      )}
    </div>
  )
}
