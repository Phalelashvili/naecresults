import { useMemo, useState } from 'react'
import HtmlMath from './HtmlMath.jsx'

// Bank/option text is shown as plain text (chips, <option>, slots), so decode the
// HTML entities the source preserves (e.g. don&rsquo;t → don’t). &amp; first so
// double-encoded entities (&amp;rsquo;) collapse correctly.
function dec(s) {
  return (s || '')
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;|&#8217;/g, '’').replace(/&lsquo;|&#8216;/g, '‘')
    .replace(/&rdquo;|&#8221;/g, '”').replace(/&ldquo;|&#8220;/g, '“')
    .replace(/&hellip;/g, '…').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

// Renders a gap task as one unified passage with the gaps inline — no "Gap N"
// cards. Two modes:
//   • word/sentence bank (Task 4/6): a shared draggable bank; drag chips into the
//     slots (tap a chip then a slot on touch; tap a filled slot to clear).
//   • choice (Task 5 cloze): each gap has its own options → an inline dropdown.
// Either way each gap maps 1:1 to its MCQ question, so scoring/Nav are unchanged.
export default function GapFill({ headingHtml, passageHtml, bank, mode, gaps, answers, onGap, revealed, instant }) {
  const choice = mode === 'choice' || !bank
  const [picked, setPicked] = useState(null) // letter "in hand" for tap-to-place
  // a gap shows its verdict (and locks) once revealed — at submit, or in instant
  // mode the moment a word is placed, mirroring how instant-mode MCQs behave.
  const isRev = (gi) => revealed || (instant && !!placedAt(gi))

  // text for a letter: from the shared bank (word mode) or the gap's own options
  const textOf = (q, letter) => {
    if (!letter) return null
    if (bank) { const w = bank.find((b) => b.letter === letter); if (w) return dec(w.text) }
    return dec(q?.options?.find((o) => o.letter === letter)?.text) || letter
  }
  const placedAt = (gi) => answers[gaps[gi]?._key] || null
  const usedLetters = useMemo(() => {
    const s = new Set()
    gaps.forEach((q) => { if (answers[q._key]) s.add(answers[q._key]) })
    return s
  }, [gaps, answers])

  function clearLetterEverywhere(letter) {
    gaps.forEach((q) => { if (answers[q._key] === letter) onGap(q._key, null) })
  }
  function place(gi, letter) {
    if (isRev(gi) || !letter) return
    const key = gaps[gi]?._key
    if (!key) return
    // word bank: a word lives in one slot (move semantics) — but not in instant
    // mode, where placed gaps lock immediately and must not be un-revealed.
    if (!choice && !instant) clearLetterEverywhere(letter)
    onGap(key, letter)
    setPicked(null)
  }
  function clearSlot(gi) {
    if (isRev(gi)) return
    const key = gaps[gi]?._key
    if (key) onGap(key, null)
  }
  function tapChip(letter) {
    if (revealed || usedLetters.has(letter)) return
    setPicked((p) => (p === letter ? null : letter))
  }
  function tapSlot(gi) {
    if (isRev(gi)) return
    if (placedAt(gi)) { clearSlot(gi); return }
    if (picked) place(gi, picked)
  }

  // split passage into text fragments + gap markers ([[GAP:n]])
  const parts = useMemo(() => {
    const markBold = /<b>\s*\(\s*(\d+)\s*\)\s*<\/b>/gi
    const markPlain = /[\s._…]*\(\s*(\d+)\s*\)/g
    const html = (passageHtml || '')
      .replace(/<\/p>\s*<p[^>]*>/gi, '<br/><br/>')
      .replace(/<\/?p[^>]*>/gi, '')
      .replace(markBold, (m, n) => `[[GAP:${n}]]`)
      .replace(markPlain, (m, n) => (+n >= 1 && +n <= gaps.length ? `[[GAP:${n}]]` : m))
    return html.split(/\[\[GAP:(\d+)\]\]/)
  }, [passageHtml, gaps.length])

  const dragStart = (e, letter) => { e.dataTransfer.setData('text/plain', letter); e.dataTransfer.effectAllowed = 'move' }

  function Slot({ gi }) {
    const q = gaps[gi]
    const letter = placedAt(gi)
    const correct = q?.correct
    const rev = isRev(gi) // this gap's verdict is shown (submit, or instant + placed)
    const state = rev ? (letter === correct ? 'ok' : letter ? 'no' : 'skip') : (letter ? 'filled' : 'empty')

    // choice mode: an inline dropdown of this gap's own options
    if (choice) {
      return (
        <span id={q ? `q-${q._n}` : undefined} className={`gap-slot gap-choice gap-${state}`}>
          <span className="gap-num">{gi + 1}</span>
          {rev ? (
            <>
              <span className="gap-word">{textOf(q, letter) || '—'}</span>
              {letter !== correct && <span className="gap-fix">{textOf(q, correct)}</span>}
            </>
          ) : (
            <select className="gap-select" value={letter || ''} onChange={(e) => onGap(q._key, e.target.value || null)}>
              <option value="">—</option>
              {(q?.options || []).map((o) => <option key={o.letter} value={o.letter}>{dec(o.text)}</option>)}
            </select>
          )}
        </span>
      )
    }

    // word/sentence bank mode: a drop slot
    return (
      <span
        id={q ? `q-${q._n}` : undefined}
        className={`gap-slot gap-${state} ${mode === 'sentences' ? 'gap-wide' : ''}`}
        draggable={!rev && !!letter}
        onDragStart={(e) => letter && dragStart(e, letter)}
        onDragOver={(e) => { if (!rev) e.preventDefault() }}
        onDrop={(e) => { if (rev) return; e.preventDefault(); const l = e.dataTransfer.getData('text/plain'); if (l) place(gi, l) }}
        onClick={() => tapSlot(gi)}
        title={rev ? '' : letter ? 'მოაშორე' : 'ჩააგდე ან დააჭირე სიტყვა'}
      >
        <span className="gap-num">{gi + 1}</span>
        {letter ? <span className="gap-word">{textOf(q, letter)}</span> : <span className="gap-blank" />}
        {rev && letter !== correct && <span className="gap-fix">{textOf(q, correct)}</span>}
      </span>
    )
  }

  return (
    <section className="gapfill">
      {headingHtml && <HtmlMath className="gf-heading" html={headingHtml} />}

      <div className="gf-passage">
        {parts.map((p, i) =>
          i % 2 === 0
            ? <HtmlMath key={i} tag="span" html={p} />
            : <Slot key={i} gi={parseInt(p, 10) - 1} />,
        )}
      </div>

      {/* shared draggable bank — word/sentence modes only */}
      {!choice && (
        <div className={`gf-bank ${mode === 'sentences' ? 'gf-bank-sent' : ''}`}>
          <div className="gf-bank-label">{mode === 'sentences' ? 'წინადადებები' : 'სიტყვები'} — ჩააგდე ხარვეზებში</div>
          <div className="gf-chips">
            {bank.map((w) => {
              const used = usedLetters.has(w.letter)
              return (
                <span
                  key={w.letter}
                  className={`gf-chip ${used ? 'used' : ''} ${picked === w.letter ? 'picked' : ''}`}
                  draggable={!revealed && !used}
                  onDragStart={(e) => !used && dragStart(e, w.letter)}
                  onClick={() => tapChip(w.letter)}
                >
                  <span className="gf-chip-letter">{w.letter}</span>
                  {dec(w.text)}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* after submit: per-gap result + Georgian explanation */}
      {revealed && (
        <ol className="gf-review">
          {gaps.map((q, gi) => {
            const your = placedAt(gi)
            const ok = your === q.correct
            const ex = q.explanation
            return (
              <li key={q._key} className={ok ? 'ok' : 'no'}>
                <div className="gfr-head">
                  <span className="gfr-n">{gi + 1}</span>
                  <span className="gfr-verdict">
                    {ok ? 'სწორია' : your
                      ? <>არასწორი — სწორი: <b>{q.correct}</b> {textOf(q, q.correct)}</>
                      : <>უპასუხო — სწორი: <b>{q.correct}</b> {textOf(q, q.correct)}</>}
                  </span>
                </div>
                {ex?.summary && <HtmlMath className="gfr-exp" html={ex.summary} />}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
