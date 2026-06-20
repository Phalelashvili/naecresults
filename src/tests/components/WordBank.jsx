// The option bank for an English gap task: Task 4 word bank (A–N words) or
// Task 6 sentence bank (A–H sentences), shown as a labelled reference above the
// gapped text/conversation. Each gap question repeats these on its options, so
// answering is a normal click (no drag-and-drop needed).
export default function WordBank({ words = [], mode = 'words' }) {
  if (!words.length) return null
  const sentences = mode === 'sentences'
  return (
    <div className={'wordbank' + (sentences ? ' wb-long' : '')}>
      <div className="wb-title">{sentences ? 'წინადადებები (Sentences) — აირჩიე შესაბამისი ხარვეზისთვის' : 'სიტყვები (Word bank)'}</div>
      {sentences ? (
        <ul className="wb-list">
          {words.map((w) => (
            <li className="wb-item" key={w.letter}>
              <span className="wb-letter">{w.letter}</span>
              <span className="wb-text">{w.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="wb-chips">
          {words.map((w) => (
            <span className="wb-chip" key={w.letter}>
              <span className="wb-letter">{w.letter}</span>
              <span className="wb-word">{w.text}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
