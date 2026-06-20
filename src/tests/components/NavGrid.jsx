// Jump-grid of question numbers, coloured by answer status.
export default function NavGrid({ questions, answers, revealed }) {
  function jump(n) {
    const el = document.getElementById(`q-${n}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <div className="nav-grid">
      {questions.map((q) => {
        const a = answers[q._key]
        const free = q.type === 'open' || q.type === 'edit' || q.type === 'essay'
        let cls = 'ng-cell'
        if (revealed && !free && q.correct) {
          if (a === q.correct) cls += ' ok'
          else if (a) cls += ' no'
          else cls += ' miss'
        } else if (a) {
          cls += ' done'
        }
        if (free) cls += ' open'
        return (
          <button key={q._key} className={cls} onClick={() => jump(q._n)} title={`კითხვა ${q._n}`}>
            {q._n}
          </button>
        )
      })}
    </div>
  )
}
