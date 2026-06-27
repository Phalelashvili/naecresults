import ParamExplorer from './ParamExplorer.jsx'
import NumberLine from './NumberLine.jsx'
import ProbTree from './ProbTree.jsx'
import SegmentProb from './SegmentProb.jsx'
import { PARAM_SPECS } from './param-specs.js'

// Renders an interactive "widget" block embedded in a worked-problem step.
// JSON form: { type:'widget', kind:'<name>', spec:'<key>', caption? }
export default function WidgetHost({ widget }) {
  if (!widget) return null

  if (widget.kind === 'paramExplorer') {
    return <ParamExplorer kind={widget.spec} />
  }

  if (widget.kind === 'probTree') {
    return <ProbTree spec={widget.spec} />
  }

  if (widget.kind === 'segmentProb') {
    return <SegmentProb spec={widget.spec} />
  }

  if (widget.kind === 'numberLine') {
    const ss = PARAM_SPECS[widget.spec]?.solutionSet
    if (!ss) return null
    return (
      <figure className="nl-fig">
        <NumberLine min={ss.min} max={ss.max} intervals={ss.intervals} holes={ss.holes} specials={ss.specials} />
        {widget.caption && <figcaption className="nl-cap">{widget.caption}</figcaption>}
      </figure>
    )
  }

  return null
}
