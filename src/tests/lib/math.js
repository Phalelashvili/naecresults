// KaTeX auto-rendering for scraped HTML that contains $...$ / $$...$$ /
// \(...\) / \[...\] math. Errors are swallowed so a single bad formula never
// blanks the page.
import renderMathInElement from 'katex/contrib/auto-render'

const DELIMS = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '$', right: '$', display: false },
  { left: '\\(', right: '\\)', display: false },
]

export function renderMath(el) {
  if (!el) return
  try {
    renderMathInElement(el, {
      delimiters: DELIMS,
      throwOnError: false,
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
    })
  } catch (e) {
    /* ignore — leave raw text */
  }
}
