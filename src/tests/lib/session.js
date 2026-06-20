// Turn a test (or a random selection) into a runnable session and grade it.

export function testToSession(test) {
  const source = {
    slug: test.slug, title: test.title, subjectKa: test.subjectKa, subject: test.subject,
    year: test.year, variant: test.variant, sourceUrl: test.sourceUrl, pdf: test.pdf,
  }
  let qn = 0
  const items = test.blocks.map((b, i) => {
    if (b.kind === 'question') {
      qn += 1
      return { ...b, _key: `${test.slug}#${b.id || i}`, _n: qn, _source: source }
    }
    return { ...b, _key: `c${i}` }
  })
  const questions = items.filter((b) => b.kind === 'question')
  return {
    kind: 'test', slug: test.slug, title: test.title, subjectKa: test.subjectKa,
    subject: test.subject, year: test.year, variant: test.variant,
    sourceUrl: test.sourceUrl, pdf: test.pdf, hasAudio: test.hasAudio,
    items, questions,
  }
}

export function selectionToSession(selected, title) {
  const items = selected.map((q, i) => ({
    ...q, kind: 'question', _key: q.key || `${q.slug}#${q.id}#${i}`, _n: i + 1,
    _source: {
      slug: q.slug, title: q.sourceTitle, subjectKa: q.subjectKa, subject: q.subject,
      year: q.year, variant: q.variant, sourceUrl: q.sourceUrl, pdf: q.pdf,
    },
  }))
  return { kind: 'random', title: title || 'შემთხვევითი ტესტი', items, questions: items }
}

export function isGradable(q) {
  return q && q.kind === 'question' && q.type !== 'open' && !!q.correct
}

export function gradeSession(session, answers) {
  let correct = 0, gradable = 0, points = 0, gotPoints = 0, answered = 0
  for (const q of session.questions) {
    if (answers[q._key]) answered += 1
    if (!isGradable(q)) continue
    gradable += 1
    points += q.points || 1
    if (answers[q._key] === q.correct) {
      correct += 1
      gotPoints += q.points || 1
    }
  }
  const pct = gradable ? Math.round((correct / gradable) * 100) : 0
  return { correct, gradable, points, gotPoints, answered, pct, total: session.questions.length }
}

const RUN_KEY = 'eg:randomRun'
export function storeRun(payload) {
  try { sessionStorage.setItem(RUN_KEY, JSON.stringify(payload)) } catch (e) { /* quota */ }
}
export function loadRun() {
  try { return JSON.parse(sessionStorage.getItem(RUN_KEY) || 'null') } catch (e) { return null }
}

// ---- saved attempts (localStorage) -------------------------------------------
const ATTEMPTS_KEY = 'eg:attempts'

export function loadAttempts() {
  try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '[]') } catch (e) { return [] }
}

// Save a finished attempt (newest first, capped). Returns the saved record.
export function saveAttempt(rec) {
  const all = loadAttempts()
  const entry = { id: `${rec.slug || 'random'}:${Date.now()}`, ts: Date.now(), ...rec }
  all.unshift(entry)
  try { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all.slice(0, 60))) } catch (e) { /* quota */ }
  return entry
}

export function attemptsForSlug(slug) {
  return loadAttempts().filter((a) => a.slug === slug)
}

export function deleteAttempt(id) {
  try { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(loadAttempts().filter((a) => a.id !== id))) } catch (e) { /* quota */ }
}

export function clearAttempts() {
  try { localStorage.removeItem(ATTEMPTS_KEY) } catch (e) { /* ignore */ }
}
