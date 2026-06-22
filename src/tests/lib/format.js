// Small shared helpers: asset paths, media rewriting, option letters.

export const BASE = import.meta.env.BASE_URL || './'

// Resolve a public/ asset (e.g. "media/x.png" or "data/index.json").
export function asset(path) {
  return BASE + String(path).replace(/^\.?\//, '')
}

// Rewrite media URLs embedded in scraped content HTML so they resolve against
// the app base, and harden <img> with lazy loading.
export function fixMediaHtml(html) {
  if (!html) return ''
  return html
    .replace(/(src|href)=("|')media\//g, (_, attr, q) => `${attr}=${q}${asset('media/')}`)
    .replace(/<img /g, '<img loading="lazy" ')
}

// Inside $…$ / $$…$$ math, a raw "<" (e.g. $0 \le r < b$) is parsed by the
// browser as an HTML tag start ("<b") before KaTeX runs, breaking the formula.
// Escape "<"/">" to entities *only within* math spans: the browser then keeps
// them as text and KaTeX (which reads decoded textContent) still sees < and >.
export function escapeMathAngles(html) {
  if (!html) return ''
  const esc = (m) => m.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return html
    .replace(/\$\$[\s\S]*?\$\$/g, esc)
    .replace(/\$[^$]*\$/g, esc)
}

export const LETTERS = ['ა', 'ბ', 'გ', 'დ', 'ე', 'ვ', 'ზ', 'თ', 'ი', 'კ', 'ლ', 'მ', 'ნ', 'ო', 'პ', 'ჟ', 'რ', 'ს', 'ტ', 'უ']

export function letterIndex(letter) {
  return LETTERS.indexOf(letter)
}

export const SUBJECT_FALLBACK_COLOUR = '#475569'

// Strip tags -> plain text (for excerpts / search).
export function plainText(html) {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || '').replace(/\s+/g, ' ').trim()
}

export function excerpt(html, n = 90) {
  const t = plainText(html)
  return t.length > n ? t.slice(0, n) + '…' : t
}

// pluralisation is trivial in Georgian (no plural agreement on numbers).
export function qWord(n) {
  return `${n} კითხვა`
}
