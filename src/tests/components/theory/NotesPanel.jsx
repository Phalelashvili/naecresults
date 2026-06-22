import { useNotes, setNote } from '../../lib/theory-store.js'

// A per-topic free-text note. Stored only in the browser (localStorage) — the
// hint text says so in plain language.
export default function NotesPanel({ topicId }) {
  const notes = useNotes()
  const val = notes[topicId] || ''
  return (
    <section className="notes-panel">
      <h2 className="notes-title">ჩემი ჩანაწერი</h2>
      <p className="notes-hint">
        💾 ეს ჩანაწერი ინახება <b>მხოლოდ ამ მოწყობილობაზე</b> (შენს ბრაუზერში) — ის არსად იგზავნება და
        მხოლოდ შენ ხედავ. სხვა მოწყობილობაზე ან ბრაუზერის მონაცემების გასუფთავების შემდეგ ის აღარ იქნება.
      </p>
      <textarea
        className="notes-area"
        value={val}
        onChange={(e) => setNote(topicId, e.target.value)}
        placeholder="ჩაიწერე შენი შენიშვნები, ფორმულები ან ხრიკები ამ თემაზე…"
        rows={4}
      />
      {val.trim() && <div className="notes-saved">✓ შენახულია ამ მოწყობილობაზე</div>}
    </section>
  )
}
