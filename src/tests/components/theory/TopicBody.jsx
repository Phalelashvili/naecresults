import HtmlMath from '../HtmlMath.jsx'
import Katex from './Katex.jsx'
import Shape from './Shape.jsx'

function Formula({ tex, caption }) {
  return (
    <figure className="th-formula">
      <Katex tex={tex} display />
      {caption && <HtmlMath tag="figcaption" className="th-formula-cap" html={caption} />}
    </figure>
  )
}

function Table({ head, rows }) {
  return (
    <div className="th-table-wrap">
      <table className="th-table">
        {head && (
          <thead>
            <tr>{head.map((h, i) => <th key={i}><HtmlMath tag="span" html={h} /></th>)}</tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>{r.map((c, ci) => <td key={ci}><HtmlMath tag="span" html={c} /></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Renders a single content block. Exported so other surfaces (e.g. worked
// problems) can reuse the exact same block vocabulary and styling.
export function renderBlock(b, i) {
  switch (b.type) {
    case 'concept':
    case 'text':
      return <HtmlMath key={i} className="th-concept" html={b.html} />
    case 'formula':
      return <Formula key={i} tex={b.tex} caption={b.caption} />
    case 'formulas':
      return (
        <div key={i} className="th-formulas">
          {(b.items || []).map((it, j) => <Formula key={j} tex={it.tex} caption={it.caption} />)}
        </div>
      )
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul'
      return (
        <Tag key={i} className={'th-list' + (b.ordered ? ' th-list-ol' : '')}>
          {(b.items || []).map((h, j) => <li key={j}><HtmlMath tag="span" html={h} /></li>)}
        </Tag>
      )
    }
    case 'definition':
      return (
        <div key={i} className="th-callout th-def">
          <span className="th-callout-tag">განმარტება</span>
          <HtmlMath html={b.html} />
        </div>
      )
    case 'theorem': {
      const isAxiom = /^[\s„"]*აქსიომა/.test(b.html || '')
      return (
        <div key={i} className="th-callout th-thm">
          <span className="th-callout-tag">{isAxiom ? 'აქსიომა' : 'თეორემა'}</span>
          <HtmlMath html={b.html} />
        </div>
      )
    }
    case 'proof':
      return (
        <div key={i} className="th-callout th-proof">
          <span className="th-callout-tag">დასაბუთება</span>
          <HtmlMath html={b.html} />
        </div>
      )
    case 'example':
      return (
        <div key={i} className="th-callout th-example">
          <span className="th-callout-tag">მაგალითი</span>
          <HtmlMath html={b.html} />
        </div>
      )
    case 'note':
      return (
        <div key={i} className="th-callout th-note">
          <span className="th-callout-tag">გასათვალისწინებელია</span>
          <HtmlMath html={b.html} />
        </div>
      )
    case 'table':
      return <Table key={i} head={b.head} rows={b.rows} />
    case 'shape':
      return <Shape key={i} shape={b.shape} caption={b.caption} />
    default:
      return null
  }
}

export default function TopicBody({ blocks }) {
  return <div className="th-body">{(blocks || []).map((b, i) => renderBlock(b, i))}</div>
}
