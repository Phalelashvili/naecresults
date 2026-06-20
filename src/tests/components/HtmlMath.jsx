import { useLayoutEffect, useRef } from 'react'
import { renderMath } from '../lib/math.js'
import { fixMediaHtml } from '../lib/format.js'

// Renders scraped HTML (with media + LaTeX) safely-ish and typesets math.
export default function HtmlMath({ html, className, tag = 'div' }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    renderMath(ref.current)
  }, [html])
  const Tag = tag
  return (
    <Tag
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: fixMediaHtml(html || '') }}
    />
  )
}
