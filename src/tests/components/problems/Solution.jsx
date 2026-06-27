import { useEffect, useRef, useState } from 'react'
import ProblemBody from './ProblemBody.jsx'
import DerivationChain from './DerivationChain.jsx'

// Step-by-step solution with two complementary views:
//  • a derivation chain — the whole system written side by side in math
//    notation (⇒ { } [ ] | |); hover/click any evaluation for its reasoning.
//  • the detailed walkthrough below, revealed progressively. A chain node can
//    jump straight to its matching step.
export default function Solution({ steps = [], chain }) {
  const total = steps.length
  const [shown, setShown] = useState(1)
  const allShown = shown >= total
  const refs = useRef([])
  const pending = useRef(null)

  useEffect(() => {
    if (pending.current == null) return
    const el = refs.current[pending.current]
    pending.current = null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [shown])

  const jumpTo = (i) => {
    if (i < shown) {
      refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      pending.current = i
      setShown(i + 1)
    }
  }

  return (
    <section className="sol">
      {chain?.length > 0 && <DerivationChain chain={chain} onJump={jumpTo} />}

      <div className="sol-head">
        <span className="sol-head-t">ნაბიჯ-ნაბიჯ ახსნა</span>
        <span className="sol-head-c">{Math.min(shown, total)} / {total}</span>
        {allShown
          ? <button type="button" className="sol-allbtn" onClick={() => setShown(1)}>თავიდან</button>
          : <button type="button" className="sol-allbtn" onClick={() => setShown(total)}>ყველას ჩვენება</button>}
      </div>

      <ol className="sol-steps">
        {steps.slice(0, shown).map((s, i) => (
          <li
            key={s.id || i}
            ref={(el) => { refs.current[i] = el }}
            className={'sol-step' + (s.tone ? ' tone-' + s.tone : '')}
          >
            <div className="sol-step-h">
              <span className="sol-num">{i + 1}</span>
              <h3 className="sol-title">{s.title}</h3>
            </div>
            <ProblemBody blocks={s.blocks} />
          </li>
        ))}
      </ol>

      {!allShown && (
        <button type="button" className="sol-next" onClick={() => setShown((n) => Math.min(total, n + 1))}>
          შემდეგი ნაბიჯი ↓
        </button>
      )}
    </section>
  )
}
