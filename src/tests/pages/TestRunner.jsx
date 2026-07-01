import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { loadTest } from '../lib/data.js'
import { testToSession } from '../lib/session.js'
import Runner from '../components/Runner.jsx'
import PdfLinks from '../components/PdfLinks.jsx'
import RatingScheme from '../components/RatingScheme.jsx'

function Intro({ session, onPick }) {
  return (
    <div className="intro">
      <Link to="/tests" className="back-link">← ყველა ტესტი</Link>
      <h1 className="intro-title">{session.title || `${session.subjectKa} ${session.year}`}</h1>
      <div className="intro-meta">
        <span>{session.subjectKa}</span>
        <span>{session.year}{session.variant ? ` · ვარიანტი ${session.variant}` : ''}</span>
        <span>{session.questions.length} კითხვა</span>
        {session.hasAudio && <span>🎧 მოსასმენი ნაწილით</span>}
      </div>
      <PdfLinks source={session} />
      <RatingScheme subject={session.subject} pdf={session.pdf} />
      <h2 className="intro-h2">აირჩიე რეჟიმი</h2>
      <div className="mode-cards">
        <button className="mode-card" onClick={() => onPick('instant')}>
          <div className="mc-ico">⚡</div>
          <div className="mc-name">მყისიერი პასუხები</div>
          <div className="mc-desc">ყოველ კითხვაზე პასუხის გაცემისთანავე ნახავ, სწორია თუ არა, და ახსნას.</div>
        </button>
        <button className="mode-card" onClick={() => onPick('end')}>
          <div className="mc-ico">📝</div>
          <div className="mc-name">პასუხები ბოლოს</div>
          <div className="mc-desc">ჯერ უპასუხებ ყველა კითხვას, ბოლოს ერთიანად ნახავ შედეგსა და ახსნებს.</div>
        </button>
      </div>
    </div>
  )
}

export default function TestRunner() {
  const { slug } = useParams()
  const [session, setSession] = useState(null)
  const [err, setErr] = useState(null)
  const [mode, setMode] = useState(null)
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    setSession(null)
    setMode(null)
    setErr(null)
    loadTest(slug)
      .then((t) => setSession(testToSession(t)))
      .catch((e) => setErr(e.message))
  }, [slug])

  if (err) return <div className="wrap"><div className="error-box">შეცდომა: {err}</div></div>
  if (!session) return <div className="wrap"><div className="loading">იტვირთება…</div></div>

  if (!mode) {
    return <div className="wrap"><Intro session={session} onPick={setMode} /></div>
  }

  return (
    <div className="wrap runner-wrap">
      <div className="run-topbar">
        <Link to="/tests" className="back-link">← ყველა ტესტი</Link>
        <div className="run-title">{session.title}</div>
        <button className="btn ghost small" onClick={() => setMode(null)}>რეჟიმის შეცვლა</button>
      </div>
      <Runner key={runKey} session={session} mode={mode} onRestart={() => setRunKey((k) => k + 1)} />
    </div>
  )
}
