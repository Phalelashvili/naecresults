// Dependency-free word/token diff for the text-editing (რედაქტირება) task.
// Tokenises into word / punctuation / whitespace tokens, then computes a classic
// LCS diff. Whitespace tokens are preserved so the diff can be re-rendered with
// the original spacing intact. Sizes here are tiny (~200 tokens), so the O(n·m)
// DP table is irrelevant for performance.

const TOKEN_RE = /[\p{L}\p{N}̀-ͯ]+|\s+|[^\s]/gu

export function tokenize(s) {
  if (!s) return []
  return s.match(TOKEN_RE) || []
}

const isSpace = (t) => /^\s+$/.test(t)
// Collapse whitespace runs so a single space and a newline compare equal.
const norm = (t) => (isSpace(t) ? ' ' : t)

// LCS-based diff of two strings → ordered ops.
//   { type:'equal', text }  present in both
//   { type:'ins',   text }  present in `b` only  (the student missed it)
//   { type:'del',   text }  present in `a` only  (the student added/kept it)
// Adjacent ops of the same type are merged.
export function diffTokens(a, b) {
  const A = tokenize(a), B = tokenize(b)
  const n = A.length, m = B.length
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = norm(A[i]) === norm(B[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ops = []
  const push = (type, text) => {
    const last = ops[ops.length - 1]
    if (last && last.type === type) last.text += text
    else ops.push({ type, text })
  }
  let i = 0, j = 0
  while (i < n && j < m) {
    if (norm(A[i]) === norm(B[j])) { push('equal', B[j]); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('del', A[i]); i++ }
    else { push('ins', B[j]); j++ }
  }
  while (i < n) { push('del', A[i]); i++ }
  while (j < m) { push('ins', B[j]); j++ }
  return ops
}

// An edit task stores its passage as ordered `segments`: plain text chunks
// `{t}` interleaved with correction refs `{c:<id>}`. The original (error-laden)
// and corrected (target) passages are both derived from the same segments, so
// they can never drift apart.
export function editText(edit, which /* 'original' | 'corrected' */) {
  const corr = edit.corrections || {}
  return (edit.segments || [])
    .map((s) => (s.t != null ? s.t : (corr[s.c]?.[which] ?? '')))
    .join('')
}

// Character ranges each correction occupies inside the *corrected* passage.
export function correctionRanges(edit) {
  const corr = edit.corrections || {}
  const ranges = []
  let pos = 0
  for (const s of edit.segments || []) {
    if (s.t != null) { pos += s.t.length; continue }
    const text = corr[s.c]?.corrected ?? ''
    ranges.push({ id: s.c, start: pos, end: pos + text.length })
    pos += text.length
  }
  return ranges
}

// Score the student's edit by ALIGNING their text to the corrected passage at
// the token level (whitespace ignored) instead of substring-matching — so a
// passage pasted out of a PDF (hard newlines), an extra or missing comma
// somewhere else, or any incidental typo can never throw off an unrelated
// correction. The corrected passage is tokenised with every token tagged by the
// correction it belongs to; we LCS-align those tokens against the student's
// tokens; a correction counts as "caught" when the tokens that *distinguish*
// its fix from the error (the inserted comma, the changed/added letters, the
// substituted word) all line up in the student's text. Shared tokens (the word
// a comma hangs off, quotes, surrounding context) aren't required, so quote
// style or nearby edits don't matter, and an untouched passage — which aligns
// to none of those distinctive tokens — scores zero.
const words = (s) => tokenize(s).filter((t) => !isSpace(t))

// LCS alignment of two token arrays → boolean[] over A marking which A-tokens
// appear, in order, in B.
function lcsMatch(A, B) {
  const n = A.length, m = B.length
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = norm(A[i]) === norm(B[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
  const matched = new Array(n).fill(false)
  let i = 0, j = 0
  while (i < n && j < m) {
    if (norm(A[i]) === norm(B[j])) { matched[i] = true; i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return matched
}

// Non-space tokens of the corrected passage, each tagged with the correction id
// it came from (null for the unchanged `t` runs).
function correctedTagged(edit) {
  const corr = edit.corrections || {}
  const out = []
  for (const s of edit.segments || []) {
    const cid = s.t != null ? null : s.c
    const txt = s.t != null ? s.t : (corr[s.c]?.corrected ?? '')
    for (const tk of tokenize(txt)) if (!isSpace(tk)) out.push({ t: tk, c: cid })
  }
  return out
}

// Is `needle` a contiguous run inside `hay` (both arrays of normalised tokens)?
function hasSeq(hay, needle) {
  if (!needle.length) return true
  for (let i = 0; i + needle.length <= hay.length; i++) {
    let ok = true
    for (let k = 0; k < needle.length; k++) if (hay[i + k] !== needle[k]) { ok = false; break }
    if (ok) return true
  }
  return false
}

export function assessEdit(userText, edit) {
  const corr = edit.corrections || {}
  const tagged = correctedTagged(edit)
  const A = tagged.map((x) => x.t)
  const B = words(userText)
  const matched = lcsMatch(A, B)
  const Bnorm = B.map(norm)

  const result = {}
  for (const id of Object.keys(corr)) {
    const idxs = []
    tagged.forEach((x, i) => { if (x.c === id) idxs.push(i) })
    // Multiset-subtract the error's tokens from the fix's: what's left are the
    // tokens the student had to add or change to. (A comma insertion leaves the
    // comma; `რის`→`რომლის` leaves `რომლის`; the shared word is dropped.)
    const cnt = {}
    for (const t of words(corr[id].original ?? '')) { const k = norm(t); cnt[k] = (cnt[k] || 0) + 1 }
    const distinctive = idxs.filter((i) => { const k = norm(A[i]); return cnt[k] ? (cnt[k]--, false) : true })
    if (distinctive.length) {
      result[id] = distinctive.every((i) => matched[i])
    } else {
      // No added/changed tokens ⇒ the fix is a reordering or pure deletion of
      // existing words: caught iff the student reproduced the corrected token
      // order (contiguously) and not the original order.
      const corrSeq = idxs.map((i) => norm(A[i]))
      const origSeq = words(corr[id].original ?? '').map(norm)
      result[id] = hasSeq(Bnorm, corrSeq) && !hasSeq(Bnorm, origSeq)
    }
  }
  return result
}

// How much of the corrected passage the student actually reproduced, 0..1
// (word tokens, whitespace ignored). Used to scale the editing score so that
// deleting/garbling the text collapses it toward 0 — otherwise "catch nothing"
// would still score the bucket maxima minus only the few official corrections.
export function similarity(userText, corrected) {
  const words = (s) => tokenize(s).filter((t) => !isSpace(t))
  const A = words(userText), B = words(corrected)
  if (!A.length && !B.length) return 1
  if (!A.length || !B.length) return 0
  let eq = 0
  for (const op of diffTokens(userText, corrected)) {
    if (op.type === 'equal') eq += words(op.text).length
  }
  return eq / Math.max(A.length, B.length)
}
