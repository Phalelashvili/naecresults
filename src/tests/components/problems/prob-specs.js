// Registry of probability-widget specs, referenced from problem JSON by key.
// Two widget families:
//   tree     — independent-events probability tree (<ProbTree>)
//   segment  — 1-D geometric probability on a segment (<SegmentProb>)

export const PROB_SPECS = {
  // class: girls = 2·boys ⇒ P(boy first) = 1/3 each of two independent breaks.
  classBreaks: {
    type: 'tree',
    levelLabels: ['I შესვენება', 'II შესვენება'],
    branches: [
      { key: 'b', label: 'ბიჭი', p: '1/3' },
      { key: 'g', label: 'გოგო', p: '2/3' },
    ],
    target: 'bb', // favourable leaf: boy on both breaks
  },

  // point C chosen uniformly on AB (15 cm); favourable if max(AC,CB) ≥ 12.
  segMax15: {
    type: 'segment', L: 15, t: 12, kind: 'maxGE', unit: 'სმ',
  },
}

// Favourable sub-intervals of [0,L] for a segment spec, merged.
export function favIntervals({ L, t, kind }) {
  let raw = []
  if (kind === 'maxGE') raw = [[0, L - t], [t, L]]          // max(x,L−x) ≥ t
  else if (kind === 'maxLE') raw = [[L - t, t]]             // max(x,L−x) ≤ t
  else if (kind === 'minGE') raw = [[t, L - t]]             // min(x,L−x) ≥ t
  raw = raw.map(([a, b]) => [Math.max(0, Math.min(L, a)), Math.max(0, Math.min(L, b))]).filter(([a, b]) => b > a)
  raw.sort((p, q) => p[0] - q[0])
  const out = []
  for (const iv of raw) {
    const last = out[out.length - 1]
    if (last && iv[0] <= last[1] + 1e-9) last[1] = Math.max(last[1], iv[1])
    else out.push([...iv])
  }
  return out
}

// Is point x favourable for this spec?
export function isFavorable(x, { L, t, kind }) {
  if (kind === 'maxGE') return Math.max(x, L - x) >= t
  if (kind === 'maxLE') return Math.max(x, L - x) <= t
  if (kind === 'minGE') return Math.min(x, L - x) >= t
  return false
}
