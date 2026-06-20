// Original-PDF links for a question or test: the OFFICIAL NAEC (ნაესი) exam
// test PDF, and its answer-key scheme once answers are revealed.
function IconExternal() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

export default function PdfLinks({ source, showAnswers = false, compact = false }) {
  if (!source) return null
  const pdf = source.pdf || {}
  return (
    <div className={'pdf-links' + (compact ? ' compact' : '')}>
      {pdf.test && (
        <a href={pdf.test} target="_blank" rel="noopener noreferrer" className="src-link pdf">
          <IconExternal /> ოფიციალური ტესტი — ნაესი (PDF)
        </a>
      )}
      {showAnswers && pdf.answers && (
        <a href={pdf.answers} target="_blank" rel="noopener noreferrer" className="src-link pdf answers">
          <IconExternal /> პასუხების სქემა — ნაესი (PDF)
        </a>
      )}
    </div>
  )
}
