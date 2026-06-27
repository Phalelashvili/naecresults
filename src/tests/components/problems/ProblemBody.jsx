import { renderBlock } from '../theory/TopicBody.jsx'
import WidgetHost from './WidgetHost.jsx'

// Same block vocabulary as theory topics (concept/formula/list/note/table…),
// plus an inline interactive `widget` block. Reuses TopicBody's renderBlock so
// the two surfaces never drift apart.
export default function ProblemBody({ blocks }) {
  return (
    <div className="th-body">
      {(blocks || []).map((b, i) =>
        b.type === 'widget' ? <WidgetHost key={i} widget={b} /> : renderBlock(b, i),
      )}
    </div>
  )
}
