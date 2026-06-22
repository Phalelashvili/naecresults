import { Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Header from "./tests/components/Header.jsx";
import TestsApp from "./tests/TestsApp.jsx";
import TheoryApp from "./tests/TheoryApp.jsx";
import ResultsApp from "./results/ResultsApp";

// Unified shell: a shared top nav (tests UI feel) over two tabs —
// "ტესტები" (math exam practice) and "ჩარიცხვები" (NAEC admission-results explorer).
export default function AppShell() {
  return (
    <div className="shell">
      <Header />
      <div className="shell-body">
        <Routes>
          <Route path="/" element={<Navigate to="/tests" replace />} />
          <Route path="/tests/*" element={<TestsApp />} />
          <Route path="/theory/*" element={<TheoryApp />} />
          <Route path="/results/*" element={<ResultsApp />} />
          <Route path="*" element={<Navigate to="/tests" replace />} />
        </Routes>
      </div>
      <Analytics />
    </div>
  );
}
