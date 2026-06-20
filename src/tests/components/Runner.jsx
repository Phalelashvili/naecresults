import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuestionCard from './QuestionCard.jsx'
import ContentBlock from './ContentBlock.jsx'
import AudioPanel from './AudioPanel.jsx'
import WordBank from './WordBank.jsx'
import GapFill from './GapFill.jsx'
import AnswerSheet from './AnswerSheet.jsx'
import NavGrid from './NavGrid.jsx'
import { gradeSession, isGradable, saveAttempt } from '../lib/session.js'

function ResultSummary({ session, answers, onRestart }) {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [showAns, setShowAns] = useState(false)
  const g = gradeSession(session, answers)

  // per-question lines for the printable card + the saved answer sheet
  const printRows = session.questions.map((q) => ({
    n: q._n,
    free: !isGradable(q),
    your: answers[q._key] || '—',
    correct: q.correct || '',
    ok: isGradable(q) && answers[q._key] === q.correct,
  }))

  function save() {
    saveAttempt({
      slug: session.slug || 'random', title: session.title || session.subjectKa,
      subject: session.subject, subjectKa: session.subjectKa,
      year: session.year, variant: session.variant,
      pct: g.pct, correct: g.correct, gradable: g.gradable,
      gotPoints: g.gotPoints, points: g.points, total: g.total,
      rows: printRows, // per-question answer sheet (viewable later from saved results)
    })
    setSaved(true)
  }
  const now = new Date()
  // breakdown by subject (+ topic when present)
  const groups = useMemo(() => {
    const m = new Map()
    for (const q of session.questions) {
      if (!isGradable(q)) continue
      const key = q._source?.subjectKa || session.subjectKa || 'სხვა'
      const e = m.get(key) || { correct: 0, total: 0 }
      e.total += 1
      if (answers[q._key] === q.correct) e.correct += 1
      m.set(key, e)
    }
    return [...m.entries()]
  }, [session, answers])

  const grade =
    g.pct >= 90 ? 'შესანიშნავი!' : g.pct >= 70 ? 'კარგია!' : g.pct >= 50 ? 'საშუალო' : 'გასაუმჯობესებელია'

  return (
    <div className="result-card">
      <div className="result-top">
        <div className="result-score" style={{ '--pct': g.pct }}>
          <span className="result-pct">{g.pct}%</span>
        </div>
        <div className="result-meta">
          <h2>{grade}</h2>
          <p>
            სწორი: <strong>{g.correct}</strong> / {g.gradable} &nbsp;·&nbsp; ქულა:{' '}
            <strong>{g.gotPoints}</strong> / {g.points}
          </p>
          {g.total > g.gradable && (
            <p className="muted">{g.total - g.gradable} ღია/უპასუხო დავალება ავტომატურად არ ფასდება.</p>
          )}
        </div>
      </div>
      {groups.length > 1 && (
        <div className="result-breakdown">
          {groups.map(([name, e]) => (
            <div className="rb-row" key={name}>
              <span className="rb-name">{name}</span>
              <span className="rb-bar">
                <span className="rb-fill" style={{ width: `${Math.round((e.correct / e.total) * 100)}%` }} />
              </span>
              <span className="rb-num">
                {e.correct}/{e.total}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="result-actions">
        <button className="btn" onClick={onRestart}>თავიდან</button>
        <button className="btn ghost" onClick={() => setShowAns((s) => !s)}>
          {showAns ? '🙈 პასუხების დამალვა' : '📋 პასუხების ნახვა'}
        </button>
        <button className="btn ghost" onClick={save} disabled={saved}>
          {saved ? '✓ შენახულია' : '💾 შედეგის შენახვა'}
        </button>
        <button className="btn ghost" onClick={() => window.print()}>🖨 ბეჭდვა</button>
        <button className="btn ghost" onClick={() => navigate('/tests')}>მთავარზე</button>
      </div>

      {/* on-screen answer sheet (toggle) */}
      {showAns && (
        <div className="result-answers">
          <AnswerSheet rows={printRows} />
        </div>
      )}

      {/* printable summary — hidden on screen, shown only when printing */}
      <div className="print-summary">
        <div className="ps-head">
          <div>
            <div className="ps-title">{session.title || session.subjectKa}</div>
            <div className="ps-sub">{session.subjectKa}{session.year ? ` · ${session.year}` : ''}{session.variant ? ` · ვარიანტი ${session.variant}` : ''}</div>
          </div>
          <div className="ps-score">{g.pct}%</div>
        </div>
        <div className="ps-stats">
          <span>სწორი: <strong>{g.correct} / {g.gradable}</strong></span>
          <span>ქულა: <strong>{g.gotPoints} / {g.points}</strong></span>
          <span>{now.toLocaleDateString('ka-GE')} {now.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <AnswerSheet rows={printRows} />
        <div className="ps-foot">ეროვნული გამოცდები — სავარჯიშო ტესტები (არაოფიციალური)</div>
      </div>
    </div>
  )
}

export default function Runner({ session, mode, onRestart }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [openShown, setOpenShown] = useState({}) // open questions whose solution was revealed
  const [listeningStarted, setListeningStarted] = useState(false) // English exam-mode gate

  const instant = mode === 'instant'
  const g = gradeSession(session, answers)
  const gradableTotal = session.questions.filter(isGradable).length

  // Collapse each gap-fill task (a word/sentence bank + its passage + the run of
  // gap questions) into one interactive GapFill block, so the user drags words
  // into the passage instead of seeing a stack of "Gap N" cards. The underlying
  // questions stay in session.questions for scoring/Nav.
  const plan = useMemo(() => {
    const items = session.items
    const strip = (h) => (h || '').replace(/<[^>]+>/g, '').trim()
    const hasMarker = (h) => /\(\s*\d+\s*\)/.test(h || '')
    const isTaskInstr = (c) => /^\s*Task\s*\d/.test(strip(c.html))
    const isGapStem = (b) => b.kind === 'question' && /^Gap\s*\d+/.test(strip(b.stem_html))
    const out = []
    let i = 0
    while (i < items.length) {
      const b = items[i]
      // A run of "Gap N" questions = a gap task (Task 4 word bank / Task 5 choice
      // cloze / Task 6 sentence bank). Fold it + its passage + (optional) bank into
      // one unified GapFill instead of a stack of "Gap N" cards.
      if (isGapStem(b)) {
        const gaps = []
        let j = i
        while (j < items.length && isGapStem(items[j])) gaps.push(items[j++])
        // pull the passage / title / bank that precede the gaps, back to (but not
        // including) the "Task N" instruction line
        const pre = []
        while (out.length) {
          const t = out[out.length - 1]
          if (t.kind === 'wordbank' || (t.kind === 'content' && !isTaskInstr(t))) { pre.unshift(out.pop()); continue }
          break
        }
        const wb = pre.find((x) => x.kind === 'wordbank')
        const content = pre.filter((x) => x.kind === 'content')
        out.push({
          kind: 'gapfill', _key: `gf-${i}`,
          mode: wb ? wb.mode : 'choice', bank: wb ? wb.words : null,
          passageHtml: content.filter((c) => hasMarker(c.html)).map((c) => c.html).join(''),
          headingHtml: content.filter((c) => !hasMarker(c.html) && (c.html || '').trim()).map((c) => c.html).join(''),
          gaps,
        })
        i = j
        continue
      }
      out.push(b)
      i++
    }
    return out
  }, [session.items])

  // place / clear a word in a gap (drag-drop is freely editable until submit)
  function setGap(qkey, letter) {
    if (submitted) return
    setAnswers((a) => {
      const next = { ...a }
      if (letter == null || letter === '') delete next[qkey]
      else next[qkey] = letter
      return next
    })
  }

  // Reveal logic. Instant mode: each answered MCQ reveals immediately, and
  // open/edit tasks can be revealed individually via their own button. Essays
  // only "reveal" (show the model answer) once the paper is submitted; their
  // step hints are always available. Exam mode: nothing reveals until submit.
  const REVEAL_ON_BTN = new Set(['open', 'edit'])
  const revealedFor = (b) =>
    b.type === 'essay'
      ? submitted
      : REVEAL_ON_BTN.has(b.type)
        ? (instant ? submitted || !!openShown[b._key] : submitted)
        : (instant ? !!answers[b._key] : submitted)

  // A free-text task (open/edit/essay) only locks once it's revealed/submitted,
  // so the student can keep typing; an MCQ locks the moment it's answered.
  const isFree = (b) => b.type === 'open' || b.type === 'edit' || b.type === 'essay'
  const lockedFor = (b) =>
    isFree(b)
      ? (instant ? submitted || !!openShown[b._key] : submitted)
      : (instant ? !!answers[b._key] : submitted)

  function setText(qkey, text) {
    if (submitted) return
    setAnswers((a) => ({ ...a, [qkey]: text }))
  }

  function select(qkey, letter) {
    if (submitted) return
    if (instant) {
      if (answers[qkey]) return // locked once answered in instant mode
      setAnswers((a) => ({ ...a, [qkey]: letter }))
      return
    }
    // "answers at end" mode: clicking the selected option again clears it
    setAnswers((a) => {
      const next = { ...a }
      if (next[qkey] === letter) delete next[qkey]
      else next[qkey] = letter
      return next
    })
  }

  function finish() {
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function restart() {
    setAnswers({})
    setSubmitted(false)
    setOpenShown({})
    setListeningStarted(false)
    window.scrollTo({ top: 0 })
    if (onRestart) onRestart()
  }

  // open/edit/essay tasks are never "answered" via options, so gate the
  // instant-mode results on all gradable (MCQ) questions being answered
  const mcqAnswered = session.questions.filter((q) => isGradable(q) && answers[q._key]).length
  const showResults = submitted || (instant && gradableTotal > 0 && mcqAnswered >= gradableTotal)
  const total = session.questions.length

  return (
    <div className="runner">
      <div className="runner-main">
        <div className="run-status">
          <div className="rs-left">
            <span className="rs-mode">{instant ? 'მყისიერი პასუხები' : 'პასუხები ბოლოს'}</span>
            <span className="rs-prog">
              ნაპასუხები {g.answered}/{total}
            </span>
            {instant && g.gradable > 0 && (
              <span className="rs-live">
                სწორი {g.correct}/{g.gradable}
              </span>
            )}
          </div>
          <div className="rs-right">
            <div className="rs-progbar">
              <span style={{ width: `${total ? (g.answered / total) * 100 : 0}%` }} />
            </div>
            {!instant && !submitted && (
              <button className="btn small" onClick={finish}>
                დასრულება
              </button>
            )}
          </div>
        </div>

        {showResults && <ResultSummary session={session} answers={answers} onRestart={restart} />}

        <div className="items">
          {plan.map((b) => {
            // Exam mode: listening questions stay hidden until the recording's
            // 40-second prep has been started (no peeking before the timer).
            if (b.kind === 'question' && b.listening && !instant && !submitted && !listeningStarted) {
              return (
                <section key={b._key} className="q-card q-locked" id={`q-${b._n}`}>
                  <div className="q-locked-body">🔒 კითხვა {b._n} გამოჩნდება მოსმენის დაწყების შემდეგ</div>
                </section>
              )
            }
            return b.kind === 'gapfill' ? (
              <GapFill
                key={b._key}
                headingHtml={b.headingHtml}
                passageHtml={b.passageHtml}
                bank={b.bank}
                mode={b.mode}
                gaps={b.gaps}
                answers={answers}
                onGap={setGap}
                instant={instant}
                revealed={showResults}
              />
            ) : b.kind === 'question' ? (
              <QuestionCard
                key={b._key}
                q={b}
                answer={answers[b._key]}
                revealed={revealedFor(b)}
                locked={lockedFor(b)}
                onSelect={(letter) => select(b._key, letter)}
                onAnswer={(text) => setText(b._key, text)}
                onRevealOpen={instant ? () => setOpenShown((s) => ({ ...s, [b._key]: true })) : undefined}
                showSource={session.kind === 'random'}
              />
            ) : b.kind === 'audio' ? (
              <AudioPanel
                key={b._key}
                url={b.url}
                prep={b.prep}
                strict={!instant}
                transcript={b.transcript}
                onStarted={() => setListeningStarted(true)}
              />
            ) : b.kind === 'wordbank' ? (
              <WordBank key={b._key} words={b.words} mode={b.mode} />
            ) : (
              <ContentBlock key={b._key} html={b.html} />
            )
          })}
        </div>

        {!instant && !submitted && (
          <div className="finish-bar">
            <button className="btn big" onClick={finish}>
              დაასრულე და ნახე პასუხები
            </button>
            <span className="muted">{g.answered}/{total} ნაპასუხები</span>
          </div>
        )}
        {showResults && (
          <div className="finish-bar">
            <button className="btn" onClick={restart}>თავიდან</button>
          </div>
        )}
      </div>

      <aside className="runner-aside">
        <div className="aside-card">
          <div className="aside-title">ნავიგაცია</div>
          <NavGrid questions={session.questions} answers={answers} revealed={instant || submitted} />
          <div className="nav-legend">
            <span><i className="lg done" /> ნაპასუხები</span>
            {(instant || submitted) && <span><i className="lg ok" /> სწორი</span>}
            {(instant || submitted) && <span><i className="lg no" /> არასწორი</span>}
          </div>
        </div>
      </aside>
    </div>
  )
}
