import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadTheoryIndex, loadTheorySection } from '../lib/data.js'
import TheoryTree from '../components/theory/TheoryTree.jsx'
import TopicBody from '../components/theory/TopicBody.jsx'
import RelatedQuestions from '../components/theory/RelatedQuestions.jsx'
import NotesPanel from '../components/theory/NotesPanel.jsx'
import HtmlMath from '../components/HtmlMath.jsx'
import { useBookmarks, toggleBookmark } from '../lib/theory-store.js'

export default function TheoryTopic() {
  const { section, slug } = useParams()
  const [index, setIndex] = useState(null)
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    loadTheoryIndex().then(setIndex).catch((e) => setErr(e.message))
  }, [])
  useEffect(() => {
    setData(null)
    loadTheorySection(section).then(setData).catch((e) => setErr(e.message))
  }, [section])

  // flat global order across all sections, for continuous prev/next
  const order = useMemo(() => {
    if (!index) return []
    return index.sections.flatMap((s) => s.topics.map((t) => ({ section: t.section, id: t.id, slug: t.slug })))
  }, [index])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [slug])

  const bookmarks = useBookmarks()

  if (err) return <div className="wrap"><div className="error-box">შეცდომა: {err}</div></div>
  if (!index || !data) return <div className="wrap"><div className="loading">იტვირთება…</div></div>

  // resolve by slug; fall back to id (keeps old id-based links working)
  const t = data.topics.find((x) => x.slug === slug) || data.topics.find((x) => x.id === slug)
  if (!t) {
    return (
      <div className="wrap">
        <div className="error-box">თემა ვერ მოიძებნა.</div>
        <Link to="/theory" className="back-link">← ყველა თემა</Link>
      </div>
    )
  }
  const tid = t.id
  // which chapter (§) holds this topic — drives the breadcrumb, colour, numbering
  let chapter = null, entry = null
  for (const s of index.sections) {
    const e = s.topics.find((x) => x.id === tid)
    if (e) { chapter = s; entry = e; break }
  }

  const gi = order.findIndex((o) => o.id === tid)
  const prev = gi > 0 ? order[gi - 1] : null
  const next = gi >= 0 && gi < order.length - 1 ? order[gi + 1] : null
  const marked = bookmarks.includes(tid)

  return (
    <div className="wrap theory-layout">
      <aside className="theory-side">
        <TheoryTree sections={index.sections} currentId={tid} />
      </aside>

      <main className="theory-main">
        <div className="theory-crumb">
          <Link to="/theory">თეორია</Link>
          {chapter?.group && (<><span className="crumb-sep">/</span><span>{chapter.group}</span></>)}
          <span className="crumb-sep">/</span>
          <span className="crumb-cur">{chapter?.ka}</span>
        </div>

        <nav className="topic-nav top">
          {prev ? (
            <Link to={`/theory/${prev.section}/${prev.slug}`} className="topic-nav-btn prev">← წინა</Link>
          ) : <span />}
          {next ? (
            <Link to={`/theory/${next.section}/${next.slug}`} className="topic-nav-btn next">შემდეგი →</Link>
          ) : <span />}
        </nav>

        <header className="topic-head" style={{ '--c': chapter?.colour }}>
          <span className="topic-num">{entry?.num ?? t.num}</span>
          <h1 className="topic-title">{t.title}</h1>
          <button
            type="button"
            className={'bookmark-btn' + (marked ? ' on' : '')}
            onClick={() => toggleBookmark(tid)}
            title={marked ? 'სანიშნეებიდან ამოღება' : 'სანიშნეებში დამატება'}
          >
            {marked ? '★ შენახულია' : '☆ შენახვა'}
          </button>
        </header>
        {t.summary && <HtmlMath tag="p" className="topic-summary" html={t.summary} />}

        <TopicBody blocks={t.blocks} />

        {t.deep && t.deep.length > 0 && (
          <details className="deepdive">
            <summary className="deepdive-summary">
              <span className="deepdive-ico">📖</span>
              <span className="deepdive-label">
                <b>ვრცლად — ახსნა ნულიდან</b>
                <small>აქსიომები, დასაბუთება და დაწვრილებითი მაგალითები — თუ თემას პირველად ეცნობი</small>
              </span>
              <span className="deepdive-chev">▾</span>
            </summary>
            <div className="deepdive-body">
              <TopicBody blocks={t.deep} />
            </div>
          </details>
        )}

        <RelatedQuestions topicId={tid} />
        <NotesPanel topicId={tid} />

        <nav className="topic-nav">
          {prev ? (
            <Link to={`/theory/${prev.section}/${prev.slug}`} className="topic-nav-btn prev">← წინა</Link>
          ) : <span />}
          <Link to="/theory" className="topic-nav-btn all">ყველა თემა</Link>
          {next ? (
            <Link to={`/theory/${next.section}/${next.slug}`} className="topic-nav-btn next">შემდეგი →</Link>
          ) : <span />}
        </nav>
      </main>
    </div>
  )
}
