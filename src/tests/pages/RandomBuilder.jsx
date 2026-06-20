import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadBank, loadSubjects } from '../lib/data.js'
import { selectionToSession, storeRun } from '../lib/session.js'

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function RandomBuilder() {
  const navigate = useNavigate()
  const [bank, setBank] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [err, setErr] = useState(null)

  const [subjSel, setSubjSel] = useState(() => new Set())
  const [topicSel, setTopicSel] = useState(() => new Set())
  const [pointSel, setPointSel] = useState('all')
  const [count, setCount] = useState(20)
  const [mode, setMode] = useState('instant')

  useEffect(() => {
    Promise.all([loadSubjects(), loadBank()])
      .then(([s, b]) => {
        setSubjects(s.filter((x) => b.some((q) => q.subject === x.id)))
        setBank(b)
        setSubjSel(new Set(s.map((x) => x.id)))
      })
      .catch((e) => setErr(e.message))
  }, [])

  const topics = useMemo(() => {
    if (!bank) return []
    const set = new Set()
    bank.forEach((q) => {
      if (q.topic && subjSel.has(q.subject)) set.add(q.topic)
    })
    return [...set].sort()
  }, [bank, subjSel])

  const points = useMemo(() => {
    if (!bank) return []
    const set = new Set()
    bank.forEach((q) => subjSel.has(q.subject) && set.add(q.points || 1))
    return [...set].sort((a, b) => a - b)
  }, [bank, subjSel])

  const pool = useMemo(() => {
    if (!bank) return []
    return bank.filter((q) => {
      if (!subjSel.has(q.subject)) return false
      if (topicSel.size && !(q.topic && topicSel.has(q.topic))) return false
      if (pointSel !== 'all' && (q.points || 1) !== pointSel) return false
      return true
    })
  }, [bank, subjSel, topicSel, pointSel])

  function toggle(set, setter, id) {
    const n = new Set(set)
    n.has(id) ? n.delete(id) : n.add(id)
    setter(n)
  }

  function generate() {
    const n = Math.min(count, pool.length)
    if (n === 0) return
    const picked = shuffle(pool).slice(0, n)
    const session = selectionToSession(picked, `შემთხვევითი ტესტი · ${n} კითხვა`)
    storeRun({ session, mode })
    navigate('/tests/run')
  }

  if (err) return <div className="wrap"><div className="error-box">შეცდომა: {err}</div></div>
  if (!bank) return <div className="wrap"><div className="loading">იტვირთება…</div></div>

  const maxCount = Math.min(50, pool.length)

  return (
    <div className="wrap builder">
      <h1>შემთხვევითი ტესტის აწყობა · მათემატიკა</h1>
      <p className="muted">
        აირჩიე თემები და სირთულე — სისტემა შემთხვევით ამოარჩევს მათემატიკის კითხვებს ყველა
        წლის ტესტებიდან და ერთ ტესტად აგიწყობს. (ქართულის ტესტები ცალკეა — მათი კითხვები
        ტექსტებზეა მიბმული.)
      </p>

      {subjects.length > 1 && (
        <div className="b-section">
          <div className="b-head">
            <h3>საგნები</h3>
            <div className="b-quick">
              <button className="link-btn" onClick={() => setSubjSel(new Set(subjects.map((s) => s.id)))}>ყველა</button>
              <button className="link-btn" onClick={() => setSubjSel(new Set())}>გასუფთავება</button>
            </div>
          </div>
          <div className="subject-chips">
            {subjects.map((s) => (
              <button
                key={s.id}
                className={subjSel.has(s.id) ? 'chip active' : 'chip'}
                style={{ '--c': s.colour }}
                onClick={() => toggle(subjSel, setSubjSel, s.id)}
              >
                {s.ka}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="b-section">
        <h3>თემატიკა</h3>
        {topics.length === 0 ? (
          <p className="muted small">
            თემატიკის მიხედვით ფილტრი გააქტიურდება კითხვების თემებად დახარისხების შემდეგ.
          </p>
        ) : (
          <div className="subject-chips">
            {topics.map((t) => (
              <button
                key={t}
                className={topicSel.has(t) ? 'chip active' : 'chip'}
                onClick={() => toggle(topicSel, setTopicSel, t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="b-section">
        <h3>ქულა / სირთულე</h3>
        <div className="subject-chips">
          <button className={pointSel === 'all' ? 'chip active' : 'chip'} onClick={() => setPointSel('all')}>
            ყველა
          </button>
          {points.map((p) => (
            <button key={p} className={pointSel === p ? 'chip active' : 'chip'} onClick={() => setPointSel(p)}>
              {p} ქულა
            </button>
          ))}
        </div>
        {points.length <= 1 && (
          <p className="muted small">ქულების დიფერენცირება დაიხვეწება ახსნა-მეტამონაცემების დამატების შემდეგ.</p>
        )}
      </div>

      <div className="b-section">
        <h3>კითხვების რაოდენობა: <span className="b-count">{Math.min(count, maxCount)}</span></h3>
        <input
          type="range"
          min="5"
          max={Math.max(5, maxCount)}
          value={Math.min(count, maxCount)}
          onChange={(e) => setCount(Number(e.target.value))}
          className="range"
        />
        <p className="muted small">ხელმისაწვდომია {pool.length.toLocaleString('ka-GE')} კითხვა მოცემული ფილტრით.</p>
      </div>

      <div className="b-section">
        <h3>რეჟიმი</h3>
        <div className="subject-chips">
          <button className={mode === 'instant' ? 'chip active' : 'chip'} onClick={() => setMode('instant')}>
            ⚡ მყისიერი პასუხები
          </button>
          <button className={mode === 'end' ? 'chip active' : 'chip'} onClick={() => setMode('end')}>
            📝 პასუხები ბოლოს
          </button>
        </div>
      </div>

      <div className="b-actions">
        <button className="btn big" disabled={pool.length === 0} onClick={generate}>
          🎲 ტესტის შექმნა ({Math.min(count, maxCount)} კითხვა)
        </button>
      </div>
    </div>
  )
}
