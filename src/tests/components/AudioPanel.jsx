import { useEffect, useRef, useState } from 'react'

// Listening section. Faithful to the NAEC instruction "You now have 40 seconds
// to look through the task": the student starts the section, gets a 40-second
// prep countdown, then the recording plays.
//
// Exam mode (`strict`): the recording plays ONCE and cannot be rewound or
// scrubbed (we snap currentTime back if the user tries), mirroring the real
// exam. Practice mode keeps the full native controls. `onStarted` lets the
// runner reveal the listening questions only once the section has begun.
//
// `transcript` (optional): { sentences: [{ text, start }] } — when present, the
// student can reveal a clickable transcript; clicking a sentence seeks the audio
// to its timestamp, and the current sentence highlights as the audio plays.
export default function AudioPanel({ url, prep = 40, strict = false, transcript, onStarted }) {
  const [phase, setPhase] = useState('idle') // idle → prep → play
  const [left, setLeft] = useState(prep)
  const [showText, setShowText] = useState(false)
  const [cur, setCur] = useState(-1) // index of the currently-playing sentence
  const audioRef = useRef(null)
  const maxTimeRef = useRef(0) // furthest point reached — the rewind barrier

  const sentences = transcript?.sentences || []

  useEffect(() => {
    if (phase !== 'prep') return
    if (left <= 0) { setPhase('play'); return }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, left])

  useEffect(() => {
    if (phase === 'play' && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }, [phase])

  function begin() {
    setLeft(prep)
    setPhase('prep')
    onStarted && onStarted()
  }

  // strict mode: forbid rewinding / skipping ahead.
  function onTimeUpdate(e) {
    const a = e.currentTarget
    if (strict) {
      if (a.currentTime > maxTimeRef.current + 0.4) a.currentTime = maxTimeRef.current
      else maxTimeRef.current = Math.max(maxTimeRef.current, a.currentTime)
    }
    if (sentences.length) {
      // current sentence = last one whose start time has passed
      let i = -1
      for (let k = 0; k < sentences.length; k++) {
        if ((sentences[k].start ?? 0) <= a.currentTime + 0.15) i = k
        else break
      }
      if (i !== cur) setCur(i)
    }
  }
  function onSeeking(e) {
    const a = e.currentTarget
    if (strict && a.currentTime < maxTimeRef.current - 0.4) a.currentTime = maxTimeRef.current
  }

  function seekTo(t) {
    const a = audioRef.current
    if (!a || t == null) return
    if (strict && t < maxTimeRef.current - 0.4) return // no rewind in exam mode
    a.currentTime = t
    a.play().catch(() => {})
  }

  const pct = Math.round(((prep - left) / prep) * 100)
  // Transcript is a practice-only aid — the real exam has none, so in exam
  // (strict) mode we never show it. In practice mode it's available from the
  // start, regardless of whether the recording has been played yet.
  const canShowText = sentences.length > 0 && !strict

  return (
    <div className="audio-panel">
      <div className="ap-head">
        <span className="ap-ico">🎧</span>
        <span className="ap-title">მოსასმენი ნაწილი (Listening)</span>
        {strict && <span className="ap-once">ერთჯერადი მოსმენა</span>}
      </div>

      {phase === 'idle' && (
        <div className="ap-idle">
          <p className="ap-note">
            ჩართვის შემდეგ გექნება <strong>{prep} წამი</strong> კითხვების გადასახედად, შემდეგ კი
            ავტომატურად დაიწყება ჩანაწერი.{strict ? ' საგამოცდო რეჟიმში ჩანაწერი მხოლოდ ერთხელ ისმის — უკან დაბრუნება შეუძლებელია.' : ''}
          </p>
          <button className="btn" onClick={begin}>▶ მოსმენის დაწყება</button>
        </div>
      )}

      {phase === 'prep' && (
        <div className="ap-prep">
          <div className="ap-count">{left}</div>
          <div className="ap-prep-body">
            <div className="ap-prep-label">გადახედე კითხვებს — ჩანაწერი {left} წამში დაიწყება</div>
            <div className="ap-bar"><span style={{ width: `${pct}%` }} /></div>
          </div>
          {!strict && <button className="btn ghost small" onClick={() => setPhase('play')}>გამოტოვება →</button>}
        </div>
      )}

      {phase === 'play' && (
        <div className="ap-play">
          <audio
            ref={audioRef}
            controls
            controlsList={strict ? 'nodownload noplaybackrate' : 'nodownload'}
            preload="auto"
            src={url}
            style={{ width: '100%' }}
            onTimeUpdate={onTimeUpdate}
            onSeeking={onSeeking}
          >
            თქვენი ბრაუზერი არ უჭერს მხარს აუდიოს.
          </audio>
          <div className="ap-foot">
            <span className="ap-note small">
              {strict
                ? 'ჩანაწერი ერთხელ ისმის და უკან ვერ დაბრუნდება.'
                : 'სავარჯიშო რეჟიმი — ხელახლა მოსმენა და გადახვევა შეგიძლია.'}
            </span>
          </div>
        </div>
      )}

      {/* Transcript: a practice-only aid (the real exam has none). Available from
          the start in any phase; hidden entirely in exam (strict) mode. */}
      {canShowText && (
        <div className="ap-transcript-wrap">
          <button className="btn ghost small" onClick={() => setShowText((s) => !s)}>
            {showText ? 'ტექსტის დამალვა' : '📄 ტექსტის ჩვენება'}
          </button>
          {showText && (
            <div className="transcript">
              <div className="tr-hint">დააჭირე წინადადებას ჩანაწერის იმ ადგილზე გადასასვლელად.</div>
              <p className="tr-body">
                {sentences.map((s, i) => (
                  <span
                    key={i}
                    className={'tr-sent' + (i === cur ? ' on' : '')}
                    role="button"
                    tabIndex={0}
                    onClick={() => seekTo(s.start)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && seekTo(s.start)}
                  >
                    {s.text}{' '}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
