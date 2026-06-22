// Docs-style search helpers: rank by where the query matches (title > content)
// and render a content snippet with the matched term highlighted.

// Extract a ~window of text around the first match, with ellipses.
export function makeSnippet(text, query, pad = 64) {
  if (!text || !query) return null
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return null
  const start = Math.max(0, i - pad)
  const end = Math.min(text.length, i + query.length + pad)
  let s = text.slice(start, end).trim()
  if (start > 0) s = '…' + s
  if (end < text.length) s = s + '…'
  return s
}

// rank: 0 = title starts with query, 1 = title contains, 2 = content/section only
export function matchRank(title, content, sectionKa, q) {
  const t = title.toLowerCase()
  if (t.startsWith(q)) return 0
  if (t.includes(q)) return 1
  if ((content || '').toLowerCase().includes(q) || (sectionKa || '').toLowerCase().includes(q)) return 2
  return -1
}

// Render `text` with every (case-insensitive) occurrence of `query` wrapped in <mark>.
export default function Highlight({ text, query }) {
  if (!query || !text) return text || null
  const lc = text.toLowerCase()
  const q = query.toLowerCase()
  const nodes = []
  let i = 0, idx, k = 0
  while ((idx = lc.indexOf(q, i)) !== -1) {
    if (idx > i) nodes.push(text.slice(i, idx))
    nodes.push(<mark key={k++} className="hl">{text.slice(idx, idx + q.length)}</mark>)
    i = idx + q.length
  }
  nodes.push(text.slice(i))
  return <>{nodes}</>
}
