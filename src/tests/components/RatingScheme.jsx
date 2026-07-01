// Official NAEC assessment scheme (შეფასების სქემა) per subject — how each test
// is scored. Structure is the same for every variant of a subject; sourced from
// the naec.ge შეფასების სქემა / სწორი პასუხები PDFs.
const SCHEMES = {
  math: {
    total: 51,
    rows: [
      { name: 'დახურული ამოცანები (1–37)', pts: 37, note: 'თითო სწორი პასუხი — 1 ქულა' },
      { name: 'პროდუქტიული ამოცანები (38–41)', pts: 14, note: 'ამოცანა 38 — 3 ქ, 39 — 3 ქ, 40 — 4 ქ, 41 — 4 ქ; ქულა ერიცხება ეტაპობრივად, ამოხსნის საფეხურების მიხედვით (ნაწილობრივი ქულა)' },
    ],
  },
  georgian: {
    total: 60,
    rows: [
      { name: 'I. ტექსტის რედაქტირება', pts: 16, note: 'მორფოლოგია-ორთოგრაფია და სინტაქსი — 8 ქ · სტილისტიკა და ტექსტური სიზუსტე — 2 ქ · პუნქტუაცია — 6 ქ (ყოველ შეცდომაზე აკლდება 1 ქულა)' },
      { name: 'II. წაკითხულის გააზრება', pts: 10, note: '10 კითხვა × 1 ქულა' },
      { name: 'III. თხზულება (წერითი დავალება)', pts: 34, note: '10 კრიტერიუმით (I–X); იხ. „შეფასების კრიტერიუმები“ თხზულების დავალებაში' },
    ],
    footnote: 'აპლიკაცია სავარჯიშოდ ორივე ტექსტს (ტექსტი I და II) გთავაზობთ; ოფიციალურ გამოცდაზე წაკითხულის გააზრება ერთ ტექსტს ეხება — 10 კითხვა.',
  },
  english: {
    total: 70,
    rows: [
      { name: 'Task 1–6 (მოსმენა და კითხვა)', pts: 54, note: 'თითო სწორი პასუხი — 1 ქულა (54 კითხვა)' },
      { name: 'Task 7 (წერა / თემა)', pts: 16, note: 'შეფასების კრიტერიუმებით (120–170 სიტყვა)' },
    ],
  },
}

export default function RatingScheme({ subject, pdf }) {
  const s = SCHEMES[subject]
  if (!s) return null
  return (
    <details className="rating-scheme">
      <summary>
        <span className="rs-title">📊 შეფასების სქემა — როგორ ფასდება ტესტი</span>
        <span className="rs-total">მაქს. {s.total} ქულა</span>
      </summary>
      <table className="rs-table">
        <tbody>
          {s.rows.map((r, i) => (
            <tr key={i}>
              <td className="rs-name">
                {r.name}
                <div className="rs-note">{r.note}</div>
              </td>
              <td className="rs-pts">{r.pts} ქ</td>
            </tr>
          ))}
          <tr className="rs-sum">
            <td>ჯამი</td>
            <td className="rs-pts">{s.total} ქ</td>
          </tr>
        </tbody>
      </table>
      {s.footnote && <div className="rs-foot">ℹ️ {s.footnote}</div>}
      {pdf?.answers && (
        <a className="rs-pdf" href={pdf.answers} target="_blank" rel="noopener noreferrer">
          ოფიციალური შეფასების სქემა (ნაესი) ↗
        </a>
      )}
    </details>
  )
}
