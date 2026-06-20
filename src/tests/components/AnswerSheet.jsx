// Per-question answer sheet shared by the on-screen result summary, the printable
// card, and the saved-results view. `rows` are {n, free, your, correct, ok}.
// Open/edit/essay tasks (`free`) show the student's own answer (they aren't graded).
export default function AnswerSheet({ rows }) {
  return (
    <table className="answer-sheet">
      <thead>
        <tr><th>#</th><th>შენი პასუხი</th><th>სწორი</th><th></th></tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const empty = !r.your || r.your === '—'
          return (
            <tr key={r.n} className={r.free ? 'as-free' : r.ok ? 'as-ok' : 'as-no'}>
              <td>{r.n}</td>
              <td className="as-your">{empty ? <span className="as-empty">უპასუხო</span> : r.your}</td>
              <td>{r.free ? '—' : r.correct}</td>
              <td>{r.free ? <span className="as-ng">არ ფასდება</span> : r.ok ? '✓' : '✗'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
