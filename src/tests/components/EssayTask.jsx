import { useRef, useState } from 'react'
import HtmlMath from './HtmlMath.jsx'
import HintStepper from './HintStepper.jsx'
import PhraseBank from './PhraseBank.jsx'
import Rubric from './Rubric.jsx'

const countWords = (s) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0)

export default function EssayTask({ q, value, revealed, onChange }) {
  const [tab, setTab] = useState('hints')
  const [showSample, setShowSample] = useState(false)
  const taRef = useRef(null)
  const text = value || ''
  const en = q.lang === 'en'
  const minWords = q.min_words || 150
  const maxWords = q.max_words || null
  const words = countWords(text)
  const short = words > 0 && words < minWords
  const over = maxWords && words > maxWords
  const ok = words >= minWords && (!maxWords || words <= maxWords)
  const placeholder = en
    ? `Start writing here… (${minWords}–${maxWords} words)`
    : 'დაიწყე წერა აქ… (მინ. 150 სიტყვა)'

  // Insert a phrase at the caret (or append), then refocus the textarea.
  function insertPhrase(phrase) {
    const el = taRef.current
    const start = el ? el.selectionStart : text.length
    const end = el ? el.selectionEnd : text.length
    const needsSpace = start > 0 && !/\s$/.test(text.slice(0, start))
    const chunk = (needsSpace ? ' ' : '') + phrase + ' '
    const next = text.slice(0, start) + chunk + text.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      if (!el) return
      const pos = start + chunk.length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="essay-task">
      {q.prompt_html && (
        <div className="essay-prompt">
          <div className="ep-label">დავალების პირობა</div>
          <HtmlMath className="ep-body" html={q.prompt_html} />
        </div>
      )}

      <div className="essay-editor">
        <textarea
          ref={taRef}
          className="essay-input"
          value={text}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          aria-label={en ? 'Writing' : 'თხზულება'}
        />
        <div className="essay-meta">
          <span className={`word-count ${short ? 'short' : over ? 'short' : ok ? 'ok' : ''}`}>
            {words} {en ? 'words' : 'სიტყვა'}
            {short && <em> · {en ? `min ${minWords}` : '150-მდე ენობრივად არ ფასდება'}</em>}
            {over && <em> · {en ? `over ${maxWords}` : `ზღვარი ${maxWords}`}</em>}
            {ok && <em> · ✓</em>}
          </span>
          <span className="muted small">{q.points || (en ? 16 : 34)} ქულა · {en ? 'writing' : 'ღია დავალება'}</span>
        </div>
      </div>

      <div className="essay-tools">
        <div className="et-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'hints'} className={tab === 'hints' ? 'on' : ''} onClick={() => setTab('hints')}>
            ნაბიჯ-ნაბიჯ მინიშნებები
          </button>
          <button role="tab" aria-selected={tab === 'phrases'} className={tab === 'phrases' ? 'on' : ''} onClick={() => setTab('phrases')}>
            ფრაზები
          </button>
          <button role="tab" aria-selected={tab === 'rubric'} className={tab === 'rubric' ? 'on' : ''} onClick={() => setTab('rubric')}>
            შეფასების სქემა
          </button>
        </div>
        <div className="et-panel">
          {tab === 'hints' && <HintStepper hints={q.hints} />}
          {tab === 'phrases' && <PhraseBank groups={q.phrases} onPick={insertPhrase} />}
          {tab === 'rubric' && <Rubric rubric={q.rubric} total={q.points} />}
        </div>
      </div>

      {revealed && q.sample_html && (
        <div className="essay-sample">
          <button className="btn ghost small" onClick={() => setShowSample((s) => !s)}>
            {showSample ? 'სანიმუშო ნაშრომის დამალვა' : 'ნახე სანიმუშო ნაშრომი (მაღალქულიანი)'}
          </button>
          {showSample && (
            <div className="sample-body">
              <div className="sample-tag">სანიმუშო ნაშრომი</div>
              <HtmlMath html={q.sample_html} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
