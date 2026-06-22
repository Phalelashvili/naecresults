import { useLayoutEffect, useRef } from 'react'
import katex from 'katex'

// Renders a single KaTeX source string (already in math mode — no $ delimiters).
export default function Katex({ tex, display = false, className }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    if (!ref.current) return
    try {
      katex.render(tex, ref.current, { displayMode: display, throwOnError: false })
    } catch {
      ref.current.textContent = tex
    }
  }, [tex, display])
  return <span ref={ref} className={className} />
}
