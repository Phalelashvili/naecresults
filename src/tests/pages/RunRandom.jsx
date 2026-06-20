import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadRun } from '../lib/session.js'
import Runner from '../components/Runner.jsx'

export default function RunRandom() {
  const navigate = useNavigate()
  const [payload, setPayload] = useState(undefined)
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    setPayload(loadRun())
  }, [])

  if (payload === undefined) return <div className="wrap"><div className="loading">იტვირთება…</div></div>
  if (!payload || !payload.session) {
    return (
      <div className="wrap">
        <div className="error-box">
          შემთხვევითი ტესტი ვერ მოიძებნა.
          <div style={{ marginTop: 12 }}>
            <Link to="/tests/random" className="btn">ახლის აწყობა</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap runner-wrap">
      <div className="run-topbar">
        <Link to="/tests/random" className="back-link">← ახალი შემთხვევითი</Link>
        <div className="run-title">{payload.session.title}</div>
        <button className="btn ghost small" onClick={() => navigate('/tests/random')}>ხელახლა აწყობა</button>
      </div>
      <Runner key={runKey} session={payload.session} mode={payload.mode} onRestart={() => setRunKey((k) => k + 1)} />
    </div>
  )
}
