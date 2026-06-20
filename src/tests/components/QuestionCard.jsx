import { asset } from '../lib/format.js'
import HtmlMath from './HtmlMath.jsx'
import Explanation from './Explanation.jsx'
import EditTask from './EditTask.jsx'
import EssayTask from './EssayTask.jsx'
import PdfLinks from './PdfLinks.jsx'

function Check() {
  return (
    <svg className="opt-ico" viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function Cross() {
  return (
    <svg className="opt-ico" viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function Figure({ src, alt }) {
  return (
    <img
      className="q-figure"
      src={asset(src)}
      alt={alt || ''}
      loading="lazy"
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )
}

const TYPE_TAG = { edit: 'რედაქტირება', essay: 'თხზულება', open: 'ღია დავალება' }

export default function QuestionCard({ q, answer, revealed, locked, onSelect, onAnswer, onRevealOpen, showSource }) {
  const isOpen = q.type === 'open'
  const isEdit = q.type === 'edit'
  const isEssay = q.type === 'essay'
  const isFree = isOpen || isEdit || isEssay
  const src = q._source || {}

  return (
    <section className={`q-card ${isEdit ? 'q-edit' : ''} ${isEssay ? 'q-essay' : ''} ${q.gap ? 'q-gap' : ''} ${q.gap && (q.options || []).some((o) => (o.text || '').length > 30) ? 'q-sent' : ''}`} id={`q-${q._n}`}
      data-correct={revealed && !isFree ? q.correct || '' : undefined}>
      <div className="q-head">
        <div className="q-num">{q._n}</div>
        <div className="q-tags">
          {showSource && src.title && (
            src.pdf?.test ? (
              <a className="q-source-pill" href={src.pdf.test} target="_blank" rel="noopener noreferrer"
                title={`${src.title} — ოფიციალური ტესტი (ნაესი)`}>
                {src.subjectKa} · {src.year}{src.variant ? ` · ვარ. ${src.variant}` : ''}
              </a>
            ) : (
              <span className="q-source-pill" title={src.title}>
                {src.subjectKa} · {src.year}{src.variant ? ` · ვარ. ${src.variant}` : ''}
              </span>
            )
          )}
          {TYPE_TAG[q.type] && <span className={`tag tag-${q.type}`}>{TYPE_TAG[q.type]}</span>}
          <span className="tag tag-pts">{q.points || 1} ქულა</span>
          {q.topic && <span className="tag tag-topic">{q.topic}</span>}
        </div>
      </div>

      {q.stem_html && <HtmlMath className="q-stem" html={q.stem_html} />}
      {q.figures && q.figures.map((f, i) => <Figure key={i} src={f} alt={`ნახაზი ${q._n}`} />)}

      {isEdit ? (
        <EditTask q={q} value={answer} revealed={revealed} locked={locked}
          onChange={onAnswer} onReveal={!revealed && onRevealOpen ? onRevealOpen : undefined} />
      ) : isEssay ? (
        <EssayTask q={q} value={answer} revealed={revealed} onChange={onAnswer} />
      ) : isOpen ? (
        <div className="open-box">
          <textarea className="open-input" value={answer || ''} onChange={(e) => onAnswer && onAnswer(e.target.value)}
            placeholder="ჩაწერე ამოხსნა / პასუხი აქ (არ ფასდება ავტომატურად)…" rows={3} />
          {!revealed && onRevealOpen && (
            <button type="button" className="btn small reveal-open" onClick={onRevealOpen}>ამოხსნის ნახვა</button>
          )}
          {!revealed && !onRevealOpen && (
            <div className="open-note">ღია (პროდუქტიული) დავალება — ავტომატური შეფასება არ ხდება; ამოხსნა გამოჩნდება ტესტის დასრულების შემდეგ.</div>
          )}
        </div>
      ) : (
        <div className="q-options" role="group">
          {q.options.map((o) => {
            const isSel = answer === o.letter
            const isCorrect = revealed && q.correct && o.letter === q.correct
            const isWrongSel = revealed && isSel && o.letter !== q.correct
            const cls = ['opt', isSel ? 'sel' : '', isCorrect ? 'correct' : '', isWrongSel ? 'wrong' : '']
              .filter(Boolean).join(' ')
            return (
              <button key={o.letter} type="button" className={cls} disabled={locked || revealed}
                title={isSel && !revealed ? 'ხელახლა დაჭერით მონიშვნა მოიხსნება' : undefined}
                onClick={() => onSelect && onSelect(o.letter)}>
                <span className="opt-letter">{o.letter}</span>
                <HtmlMath tag="span" className="opt-body" html={o.html || o.text} />
                {isSel && !revealed && <span className="opt-clear" aria-hidden="true">✕</span>}
                {isCorrect && <Check />}
                {isWrongSel && <Cross />}
              </button>
            )
          })}
        </div>
      )}

      {revealed && !isFree && q.correct && (
        <div className={'q-verdict ' + (answer === q.correct ? 'ok' : answer ? 'no' : 'skip')}>
          {answer === q.correct ? 'სწორია' : answer ? `არასწორია — სწორი პასუხია „${q.correct}“` : `უპასუხოდ — სწორი პასუხია „${q.correct}“`}
        </div>
      )}

      {revealed && !isFree && q.answerFlag && (
        <div className={'answer-flag' + (q.corrected ? ' corrected' : '')}>
          <strong>{q.corrected ? '✓ პასუხი დაზუსტებულია:' : '⚠️ შენიშვნა:'}</strong> {q.answerFlag}
        </div>
      )}
      {revealed && !isEdit && !isEssay && <Explanation q={q} />}
      {revealed && <PdfLinks source={src} showAnswers compact />}
    </section>
  )
}
