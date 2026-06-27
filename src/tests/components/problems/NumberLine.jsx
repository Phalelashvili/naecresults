import { useRef } from 'react'

// Reusable 1-D number line for showing a solution set on the parameter axis.
// Draws integer ticks, a green interval band with open/closed endpoints, "holes"
// (excluded points) and labelled special values. Labels for closely-spaced
// specials are stacked on separate rows with leader lines so they never collide.
// When `onPick` is given it becomes interactive: click or drag moves the marker.

const W = 320, H = 98, PADX = 20, AXIS = 78, BAND = 58

export default function NumberLine({
  min, max, intervals = [], holes = [], specials = [],
  marker, markerOk = true, onPick,
}) {
  const ref = useRef(null)
  const dragging = useRef(false)
  const X = (v) => PADX + ((v - min) / (max - min)) * (W - 2 * PADX)
  const clampLabel = (x) => Math.max(22, Math.min(W - 22, x))

  function pick(e) {
    if (!onPick || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let v = min + ((px - PADX) / (W - 2 * PADX)) * (max - min)
    v = Math.max(min, Math.min(max, v))
    onPick(Math.round(v * 100) / 100)
  }

  const ticks = []
  for (let i = Math.ceil(min); i <= Math.floor(max); i++) ticks.push(i)

  // each special gets its own row (height) so labels of nearby values don't overlap
  const rowY = (row) => 14 + row * 13

  const interactive = !!onPick
  return (
    <svg
      ref={ref}
      className={'nl-svg' + (interactive ? ' interactive' : '')}
      viewBox={`0 0 ${W} ${H}`}
      onPointerDown={interactive ? (e) => { dragging.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); pick(e) } : undefined}
      onPointerMove={interactive ? (e) => { if (dragging.current) pick(e) } : undefined}
      onPointerUp={interactive ? () => { dragging.current = false } : undefined}
      onPointerCancel={interactive ? () => { dragging.current = false } : undefined}
    >
      {/* axis + arrowheads (the line continues both ways) */}
      <line x1={PADX} y1={AXIS} x2={W - PADX} y2={AXIS} className="nl-axis" />
      <polygon points={`${W - PADX + 2},${AXIS} ${W - PADX - 5},${AXIS - 3.5} ${W - PADX - 5},${AXIS + 3.5}`} className="nl-arrow" />
      <polygon points={`${PADX - 2},${AXIS} ${PADX + 5},${AXIS - 3.5} ${PADX + 5},${AXIS + 3.5}`} className="nl-arrow" />

      {ticks.map((i) => (
        <g key={'t' + i}>
          <line x1={X(i)} y1={AXIS - 3} x2={X(i)} y2={AXIS + 3} className="nl-tick" />
          <text x={X(i)} y={AXIS + 15} className="nl-ticklabel">{i}</text>
        </g>
      ))}

      {/* interval band(s) */}
      {intervals.map((iv, k) => {
        const x1 = X(iv.from)
        const x2 = iv.toInf ? W - PADX - 6 : X(iv.to)
        return <line key={'iv' + k} x1={x1} y1={BAND} x2={x2} y2={BAND} className="nl-band" />
      })}
      {intervals.map((iv, k) => (
        <g key={'e' + k}>
          <circle cx={X(iv.from)} cy={BAND} r="4" className={iv.openFrom ? 'nl-end-open' : 'nl-end-closed'} />
          {!iv.toInf && <circle cx={X(iv.to)} cy={BAND} r="4" className={iv.openTo ? 'nl-end-open' : 'nl-end-closed'} />}
          {iv.toInf && <polygon points={`${W - PADX + 2},${BAND} ${W - PADX - 5},${BAND - 3.5} ${W - PADX - 5},${BAND + 3.5}`} className="nl-band-arrow" />}
        </g>
      ))}

      {/* excluded points */}
      {holes.map((h, k) => <circle key={'h' + k} cx={X(h)} cy={BAND} r="4.5" className="nl-hole" />)}

      {/* labelled special values — stacked on separate rows with leader lines */}
      {specials.map((s, k) => {
        const ly = rowY(s.row != null ? s.row : k)
        return (
          <g key={'s' + k}>
            <line x1={X(s.v)} y1={ly + 4} x2={X(s.v)} y2={BAND - 6} className="nl-special-line" />
            <text x={clampLabel(X(s.v))} y={ly} className="nl-special-label">{s.label}</text>
          </g>
        )
      })}

      {/* draggable marker (value is shown by the slider above; here just position) */}
      {marker != null && isFinite(marker) && (
        <g>
          <line x1={X(marker)} y1={BAND - 14} x2={X(marker)} y2={AXIS} className={'nl-marker-line' + (markerOk ? ' ok' : ' bad')} />
          <circle cx={X(marker)} cy={BAND} r="5.5" className={'nl-marker' + (markerOk ? ' ok' : ' bad')} />
        </g>
      )}
    </svg>
  )
}
