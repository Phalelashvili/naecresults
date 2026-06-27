import { Fragment, useState } from 'react'
import Katex from '../theory/Katex.jsx'
import HtmlMath from '../HtmlMath.jsx'

// A tall left brace that stretches to the height of the stacked rows it groups.
// Non-scaling stroke keeps the line weight even under the vertical stretch.
function Brace() {
  return (
    <svg className="dc-brace" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M8 1 Q4 1 4 11 L4 43 Q4 50 1 50 Q4 50 4 57 L4 89 Q4 99 8 99"
        fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// The whole solution as one chained derivation in math notation (⇒, { }, [ ], | |).
// Items without `explain` are static connectives/delimiters; items with `explain`
// are interactive "evaluations" (hover/focus shows the reason, click pins it, and
// an optional link jumps to the matching step). A `group` item is a system: its
// `rows` stack vertically under a spanning brace, each row still interactive.
export default function DerivationChain({ chain = [], onJump }) {
  const [pinned, setPinned] = useState(null)

  const renderNode = (it, id) => {
    const isPinned = pinned === id
    return (
      <span className={'dc-node' + (it.tone ? ' tone-' + it.tone : '') + (isPinned ? ' pinned' : '')}>
        <button type="button" className="dc-node-btn" aria-expanded={isPinned} onClick={() => setPinned(isPinned ? null : id)}>
          <Katex tex={it.tex} />
        </button>
        <span className="dc-tip" role="tooltip">
          {it.title && <b className="dc-tip-h">{it.title}</b>}
          <HtmlMath tag="span" className="dc-tip-x" html={it.explain} />
          {it.step != null && onJump && (
            <button type="button" className="dc-tip-jump" onClick={() => { setPinned(null); onJump(it.step) }}>
              ნახე ნაბიჯი →
            </button>
          )}
        </span>
      </span>
    )
  }

  const renderItem = (it, id) => {
    if (it.rows) {
      return (
        <span className="dc-group">
          <Brace />
          <span className="dc-rows">
            {it.rows.map((row, ri) => (
              <span className="dc-row" key={ri}>
                {row.map((sub, si) => <Fragment key={si}>{renderItem(sub, `${id}-${ri}-${si}`)}</Fragment>)}
              </span>
            ))}
          </span>
        </span>
      )
    }
    if (!it.explain) return <span className={'dc-op' + (it.op ? ' spaced' : '')}><Katex tex={it.tex} /></span>
    return renderNode(it, id)
  }

  return (
    <div className="dc" aria-label="ამოხსნის ჯაჭვი">
      {chain.map((it, i) => <Fragment key={i}>{renderItem(it, 't' + i)}</Fragment>)}
    </div>
  )
}
