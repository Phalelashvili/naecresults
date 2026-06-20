import HtmlMath from './HtmlMath.jsx'

// Passages, task headers, audio players, tables, etc. shown between questions.
export default function ContentBlock({ html }) {
  const isAudio = /<audio/i.test(html)
  return <HtmlMath className={'content-block' + (isAudio ? ' has-audio' : '')} html={html} />
}
