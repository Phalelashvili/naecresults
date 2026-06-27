import { solveAbs, solveQuadratic, approxEq, signed } from '../../lib/solve.js'

// Registry of "parameter equation" specs. Each spec is the reusable solution
// logic for a family of problems where a fraction = 0 must have a target number
// of solutions for some parameter value. The interactive <ParamExplorer> renders
// any spec generically; a problem's JSON just references it by key.
//
// A spec exposes pure functions of the parameter:
//   numerator(p)   → { rhs, candidates:[{x,label}] }   roots of the numerator
//   forbidden(p)   → [{x,label}]                        zeros of the denominator
//   equationTex(p) → string                             the equation, p substituted
// plus display metadata (slider range, quick-jump chips, solutionSet for the
// number line, and the target solution count).

export const PARAM_SPECS = {
  // 41(4):  (|x| − 2a − 3) / (3x² − 4ax + a²) = 0  — needs exactly two solutions.
  absFracParam: {
    param: 'a',
    target: 2,
    range: { min: -3, max: 3, step: 0.01, def: 0 },
    chips: [
      { v: -1.5, label: '−3/2' },
      { v: -9 / 7, label: '−9/7' },
      { v: -1, label: '−1' },
      { v: 0, label: '0' },
      { v: 2, label: '2' },
    ],
    // numerator: |x| = 2a + 3
    numerator(a) {
      const rhs = 2 * a + 3
      const xs = solveAbs(rhs)
      return {
        rhs,
        candidates: xs.map((x) => ({ x, label: x > 0 ? '+(2a+3)' : x < 0 ? '−(2a+3)' : '0' })),
      }
    },
    // denominator: 3x² − 4ax + a² = (x − a)(3x − a) → zeros x = a and x = a/3
    forbidden(a) {
      const { roots } = solveQuadratic(3, -4 * a, a * a)
      return roots.map((x) => ({ x, label: approxEq(x, a) ? 'a' : 'a/3' }))
    },
    equationTex(a) {
      const num = `|x| ${signed(-(2 * a + 3))}`
      let den = '3x^{2}'
      if (Math.abs(-4 * a) > 1e-9) den += ` ${signed(-4 * a, 'x')}`
      if (Math.abs(a * a) > 1e-9) den += ` ${signed(a * a)}`
      return `\\dfrac{${num}}{${den}}=0`
    },
    solutionSet: {
      min: -3,
      max: 3,
      intervals: [{ from: -1.5, toInf: true, openFrom: true }],
      holes: [-9 / 7, -1],
      specials: [
        { v: -1.5, label: '−3/2' },
        { v: -9 / 7, label: '−9/7' },
        { v: -1, label: '−1' },
      ],
    },
  },
}
