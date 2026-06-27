// Small, dependency-free math helpers shared by the worked-problem solvers and
// their interactive widgets. Pure functions — safe to import anywhere (SSR too).

// Short numeric format: round to 2 decimals, drop "-0", use a real minus sign.
export function fmt(x) {
  if (x == null || !isFinite(x)) return '∞'
  const r = Math.round(x * 100) / 100
  const s = (Object.is(r, -0) ? 0 : r).toString()
  return s.replace('-', '−')
}

// Floating-point tolerant equality (parameter sweeps land on messy decimals).
export function approxEq(a, b, eps = 1e-7) {
  return Math.abs(a - b) <= eps
}

// Solutions of |x| = rhs. Returns [] (rhs<0), [0] (rhs=0) or [rhs, -rhs].
export function solveAbs(rhs) {
  if (rhs < -1e-12) return []
  if (Math.abs(rhs) <= 1e-12) return [0]
  return [rhs, -rhs]
}

// Real roots of ax² + bx + c = 0, returned smallest-first as { disc, roots }.
export function solveQuadratic(a, b, c) {
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) return { disc: NaN, roots: [] }
    return { disc: 0, roots: [-c / b] }
  }
  const disc = b * b - 4 * a * c
  if (disc < -1e-12) return { disc, roots: [] }
  const sd = Math.sqrt(Math.max(0, disc))
  return { disc, roots: [(-b - sd) / (2 * a), (-b + sd) / (2 * a)] }
}

// A signed LaTeX/text term, e.g. signed(-4, 'x') → "− 4x", signed(3) → "+ 3".
// Used to assemble equations with the parameter substituted in.
export function signed(v, suffix = '') {
  const s = v >= 0 ? '+' : '−'
  const a = Math.round(Math.abs(v) * 100) / 100
  return `${s} ${a}${suffix}`
}
