import Shape2D from './Shape2D.jsx'
import Shape3D from './Shape3D.jsx'
import Graph2D from './Graph2D.jsx'
import Derive2D from './Derive2D.jsx'
import HtmlMath from '../HtmlMath.jsx'

const SHAPES_3D = new Set(['cube', 'box', 'prism', 'prism-tri', 'pyramid', 'cylinder', 'cone', 'sphere'])

// Dispatches a shape id to the right interactive figure.
//   "graph:<family>"  -> function grapher
//   "derive:<kind>"   -> formula-derivation animation
//   3D solid ids       -> Shape3D
//   everything else    -> Shape2D
export default function Shape({ shape, caption }) {
  const isGraph = shape.startsWith('graph:')
  const isDerive = shape.startsWith('derive:')
  const is3d = SHAPES_3D.has(shape)
  const hint = isDerive ? '✦ ნახე, როგორ გამოიყვანება ფორმულა'
    : isGraph ? '✦ შეცვალე პარამეტრები'
    : is3d ? '🖐 დაატრიალე · შეცვალე ზომები'
    : '✦ ინტერაქტიული ფიგურა'
  return (
    <figure className="th-shape">
      <div className="th-shape-hint">{hint}</div>
      {isDerive ? <Derive2D kind={shape.slice(7)} />
        : isGraph ? <Graph2D family={shape.slice(6)} />
        : is3d ? <Shape3D kind={shape} />
        : <Shape2D kind={shape} />}
      {caption && <HtmlMath tag="figcaption" className="th-shape-cap" html={caption} />}
    </figure>
  )
}
