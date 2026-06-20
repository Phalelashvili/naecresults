import { useState } from 'react'

// Grouped bank of ready-made essay phrases. Clicking a chip inserts it into the
// essay at the caret (via onPick). Phrases may contain `______` blanks the
// student then fills — kept literally.
export default function PhraseBank({ groups = [], onPick }) {
  const [active, setActive] = useState(0)
  if (!groups.length) return null
  const g = groups[active] || groups[0]

  return (
    <div className="phrase-bank">
      <div className="pb-tabs" role="tablist">
        {groups.map((grp, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            className={`pb-tab ${i === active ? 'on' : ''}`}
            onClick={() => setActive(i)}
          >
            {grp.label}
          </button>
        ))}
      </div>
      <div className="pb-chips">
        {(g.items || []).map((p, i) => (
          <button
            key={i}
            className="pb-chip"
            title="დაამატე ესეში"
            onClick={() => onPick && onPick(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <p className="muted small">დააჭირე ფრაზას, რომ ჩასვა ესეში. „______“ — შენ შესავსები ადგილია.</p>
    </div>
  )
}
