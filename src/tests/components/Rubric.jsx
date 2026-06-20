import HtmlMath from './HtmlMath.jsx'

// The official NAEC essay rubric: 10 criteria (I–X), 34 points. Each criterion
// is expandable to its score levels. Purely informational.
export default function Rubric({ rubric = [], total }) {
  if (!rubric.length) return null
  const sum = total ?? rubric.reduce((s, c) => s + (c.max || 0), 0)
  return (
    <div className="rubric">
      <div className="rubric-top">
        <span>შეფასების კრიტერიუმები</span>
        <span className="rubric-total">სულ {sum} ქულა</span>
      </div>
      {rubric.map((c, i) => (
        <details className="rub-crit" key={i}>
          <summary>
            <span className="rc-roman">{c.roman}</span>
            <span className="rc-name">{c.name}</span>
            <span className="rc-max">{c.max} ქ.</span>
          </summary>
          {Array.isArray(c.levels) && c.levels.length > 0 && (
            <ul className="rc-levels">
              {c.levels.map((lv, k) => (
                <li key={k}>
                  <span className="rc-score">{lv.score}</span>
                  <HtmlMath tag="span" className="rc-desc" html={lv.desc} />
                </li>
              ))}
            </ul>
          )}
        </details>
      ))}
    </div>
  )
}
