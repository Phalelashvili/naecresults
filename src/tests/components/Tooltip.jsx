import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Inline trigger with a rich popover. Opens on hover/focus (desktop) and on
// tap/click (touch); the popover is portalled to <body> and positioned with
// fixed coords so it never gets clipped by the card's overflow. `content` is
// arbitrary JSX (we pass the correction rationale + points into it).
export default function Tooltip({ children, content, className = '', tone = '' }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const triggerRef = useRef(null)
  const popRef = useRef(null)
  const id = useId()

  const place = () => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setCoords({ top: r.top, left: r.left + r.width / 2, bottom: r.bottom })
  }

  useLayoutEffect(() => {
    if (open) place()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onScroll = () => place()
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return
      setOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  // Decide above/below based on room; clamp horizontally to the viewport.
  let popStyle = null
  if (coords) {
    const below = coords.top < 220
    const left = Math.min(Math.max(coords.left, 170), window.innerWidth - 170)
    popStyle = below
      ? { top: coords.bottom + 8, left, transform: 'translateX(-50%)' }
      : { top: coords.top - 8, left, transform: 'translate(-50%, -100%)' }
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={`tt-trigger ${tone} ${className} ${open ? 'open' : ''}`}
        tabIndex={0}
        role="button"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
      >
        {children}
      </span>
      {open && coords &&
        createPortal(
          <div
            id={id}
            ref={popRef}
            role="tooltip"
            className={`tt-pop ${tone}`}
            style={popStyle}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}
