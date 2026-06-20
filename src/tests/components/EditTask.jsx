import { useMemo, useState } from 'react'
import HtmlMath from './HtmlMath.jsx'
import Tooltip from './Tooltip.jsx'
import { assessEdit, diffTokens, editText, similarity } from '../lib/diff.js'

// Which official 16-point bucket a correction's category falls in.
//   lang  (8) — morphology / orthography / syntax / mechanical
//   style (2) — stylistic & textual
//   punct (6) — punctuation
const CAT_BUCKET = { morph: 'lang', orth: 'lang', syntax: 'lang', mech: 'lang', style: 'style', punct: 'punct' }
const CAT_KA = {
  morph: 'მორფოლოგია-ორთოგრაფია', orth: 'ორთოგრაფია', syntax: 'სინტაქსი',
  mech: 'მექანიკური', style: 'სტილისტიკა', punct: 'პუნქტუაცია',
}
const DEFAULT_BUCKETS = [
  { key: 'lang', label: 'მორფოლოგია-ორთოგრაფია, სინტაქსი', max: 8 },
  { key: 'style', label: 'სტილისტიკა და ტექსტური სიზუსტე', max: 2 },
  { key: 'punct', label: 'პუნქტუაცია', max: 6 },
]

export default function EditTask({ q, value, revealed, locked, onChange, onReveal }) {
  const original = useMemo(() => editText(q, 'original'), [q])
  const buckets = q.buckets || DEFAULT_BUCKETS
  // The student edits the passage in place: seed the textarea with the original.
  const text = value == null ? original : value
  const touched = value != null && value !== original

  const assessment = useMemo(
    () => (revealed ? assessEdit(text, q) : null),
    [revealed, text, q],
  )

  // Estimated score — you EARN points for the corrections you actually make
  // (not "start at full marks"), so leaving the text untouched or typing
  // gibberish scores 0. Points are weighted by the official 16-point buckets
  // (8 / 2 / 6), and the whole thing is scaled by how faithfully you reproduced
  // the passage, so introducing new errors on top of the fixes costs you.
  const score = useMemo(() => {
    if (!assessment) return null
    const bk = { lang: { c: 0, t: 0 }, style: { c: 0, t: 0 }, punct: { c: 0, t: 0 } }
    let caught = 0
    const total = Object.keys(q.corrections || {}).length
    for (const [id, c] of Object.entries(q.corrections || {})) {
      const key = CAT_BUCKET[c.category] || 'lang'
      bk[key].t += 1
      if (assessment[id]) { bk[key].c += 1; caught += 1 }
    }
    const sim = similarity(text, editText(q, 'corrected'))
    const maxPts = buckets.reduce((s, b) => s + b.max, 0)
    // earn fraction of each active bucket's points for the corrections caught
    const rows = buckets.filter((b) => bk[b.key].t > 0).map((b) => ({
      ...b, caught: bk[b.key].c, total: bk[b.key].t,
      got: Math.round((b.max * bk[b.key].c / bk[b.key].t) * sim),
    }))
    const got = total ? Math.round(maxPts * (caught / total) * sim) : 0
    return { rows, caught, total, sim, got, max: maxPts }
  }, [assessment, q, buckets, text])

  return (
    <div className="edit-task">
      {q.prompt_html && <HtmlMath className="edit-prompt" html={q.prompt_html} />}

      {!revealed && (
        <>
          <div className="edit-legend">
            {buckets.map((b) => (
              <span key={b.key} className={`elg elg-${b.key}`}>{b.label} · {b.max} ქ.</span>
            ))}
          </div>
          <textarea
            className="edit-input"
            value={text}
            disabled={locked}
            spellCheck={false}
            onChange={(e) => onChange(e.target.value)}
            rows={Math.max(8, Math.round(original.length / 55))}
            aria-label="ტექსტის რედაქტირება"
          />
          <div className="edit-actions">
            <span className="muted small">
              {touched ? 'ჩაასწორე ტექსტი პირდაპირ ველში.' : 'შეასწორე შეცდომები უშუალოდ ტექსტში.'}
            </span>
            {onReveal && (
              <button className="btn small" disabled={locked} onClick={onReveal}>
                შემოწმება და სწორი ვარიანტი
              </button>
            )}
          </div>
          {!onReveal && (
            <div className="open-note">
              ღია დავალება — ავტომატური ქულა არ ედება; სწორი ვარიანტი და ახსნები გამოჩნდება ტესტის დასრულების შემდეგ.
            </div>
          )}
        </>
      )}

      {revealed && (
        <RevealView q={q} text={text} assessment={assessment} score={score} touched={touched} />
      )}
    </div>
  )
}

function RevealView({ q, text, assessment, score, touched }) {
  const [showDiff, setShowDiff] = useState(false)
  return (
    <div className="edit-reveal">
      {score && (
        <div className="edit-tally">
          <div className="et-head">
            <strong>დააფიქსირე {score.caught} / {score.total} შესწორება</strong>
            <span className="et-score">~{score.got} / {score.max} ქულა</span>
          </div>
          <div className="et-bars">
            {score.rows.map((r) => (
              <div className="et-bar" key={r.key}>
                <span className="etb-label">{r.label}</span>
                <span className="etb-track"><span className={`etb-fill ef-${r.key}`} style={{ width: `${(r.caught / r.total) * 100}%` }} /></span>
                <span className="etb-num">{r.caught}/{r.total} · {r.got} ქ.</span>
              </div>
            ))}
          </div>
          {score.sim < 0.85 && (
            <p className="et-warn small">
              ⚠ შენი ტექსტი სწორ ვარიანტს მხოლოდ {Math.round(score.sim * 100)}%-ით ემთხვევა —
              ბევრი სიტყვა შეცვლილია ან აკლია, ამიტომ ქულა დაბალია.
            </p>
          )}
          <p className="muted small">შეფასება სავარაუდოა — საგამოცდო ნაშრომს ცოცხალი გამსწორებელი აფასებს.</p>
        </div>
      )}

      <div className="edit-corrected-head">
        <span>სწორი (დარედაქტირებული) ტექსტი — დააჭირე ხაზგასმულ ადგილებს ახსნისთვის</span>
        {touched && (
          <button className="btn ghost small" onClick={() => setShowDiff((s) => !s)}>
            {showDiff ? 'სწორი ტექსტი' : 'შენი vs სწორი'}
          </button>
        )}
      </div>

      {showDiff
        ? <DiffView userText={text} corrected={editText(q, 'corrected')} />
        : <CorrectedView q={q} assessment={assessment} />}
    </div>
  )
}

// The corrected passage with every correction highlighted + tooltipped.
function CorrectedView({ q, assessment }) {
  const corr = q.corrections || {}
  return (
    <p className="corrected-text">
      {(q.segments || []).map((s, i) => {
        if (s.t != null) return <span key={i}>{s.t}</span>
        const c = corr[s.c]
        if (!c) return null
        const caught = assessment?.[s.c]
        const bucket = CAT_BUCKET[c.category] || 'lang'
        return (
          <Tooltip
            key={i}
            tone={`corr-${bucket}`}
            className={`corr ${caught ? 'caught' : 'missed'}`}
            content={
              <div className="corr-pop">
                <div className="cp-head">
                  <span className="cp-from">{c.original || '∅'}</span>
                  <span className="cp-arrow">→</span>
                  <span className="cp-to">{c.corrected}</span>
                </div>
                <div className="cp-meta">
                  <span className={`cp-cat cat-${bucket}`}>{CAT_KA[c.category] || c.category}</span>
                  <span className="cp-pts">{c.points || 1} ქ.</span>
                  <span className={`cp-status ${caught ? 'ok' : 'no'}`}>{caught ? '✓ დააფიქსირე' : '✗ გამოგრჩა'}</span>
                </div>
                <HtmlMath className="cp-why" html={c.why_html} />
              </div>
            }
          >
            {c.corrected}
          </Tooltip>
        )
      })}
    </p>
  )
}

// Plain student-vs-corrected word diff.
function DiffView({ userText, corrected }) {
  const ops = useMemo(() => diffTokens(userText, corrected), [userText, corrected])
  return (
    <p className="diff-text">
      {ops.map((op, i) =>
        op.type === 'equal'
          ? <span key={i}>{op.text}</span>
          : op.type === 'ins'
            ? <ins key={i} className="d-ins" title="აკლია შენს ნაშრომში">{op.text}</ins>
            : <del key={i} className="d-del" title="ზედმეტი / შესაცვლელი">{op.text}</del>,
      )}
    </p>
  )
}
