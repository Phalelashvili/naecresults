import { Routes, Route } from 'react-router-dom'
import TheoryHome from './pages/TheoryHome.jsx'
import TheoryTopic from './pages/TheoryTopic.jsx'

// Math theory cram-notes sub-app, mounted under /theory by AppShell.
// Reuses `.tests-scope` so it shares the tests UI styling (buttons, KaTeX, etc.).
export default function TheoryApp() {
  return (
    <div className="tests-scope">
      <Routes>
        <Route index element={<TheoryHome />} />
        <Route path=":section/:slug" element={<TheoryTopic />} />
        <Route path="*" element={<TheoryHome />} />
      </Routes>
    </div>
  )
}
