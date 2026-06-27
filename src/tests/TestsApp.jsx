import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import TestRunner from "./pages/TestRunner.jsx";
import RandomBuilder from "./pages/RandomBuilder.jsx";
import RunRandom from "./pages/RunRandom.jsx";
import Saved from "./pages/Saved.jsx";
import ExtraHome from "./pages/ExtraHome.jsx";
import ProblemPage from "./pages/ProblemPage.jsx";

// Math exam-practice sub-app, mounted under /tests by AppShell.
// `.tests-scope` keeps this sub-app's styles (e.g. .btn) from clashing with the
// results explorer's Tailwind styles.
export default function TestsApp() {
  return (
    <div className="tests-scope">
      <Routes>
        <Route index element={<Home />} />
        <Route path="test/:slug" element={<TestRunner />} />
        <Route path="random" element={<RandomBuilder />} />
        <Route path="run" element={<RunRandom />} />
        <Route path="saved" element={<Saved />} />
        <Route path="extra" element={<ExtraHome />} />
        <Route path="extra/:slug" element={<ProblemPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}
