import { useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Row, Dataset, grantClass } from "./types";

interface Props {
  dataset: Dataset;
  rows: Row[];
  favProgs: Set<number>;
  favUnis: Set<number>;
  onToggleFavProg: (code: number) => void;
  onToggleFavUni: (code: number) => void;
  onYearChange: (year: string) => void;
}

export default function UniDetail({ dataset, rows, favProgs, favUnis, onToggleFavProg, onToggleFavUni, onYearChange }: Props) {
  const { uniCode: uniCodeParam, year } = useParams();

  useEffect(() => {
    if (year) onYearChange(year);
  }, [year, onYearChange]);
  const uniCode = Number(uniCodeParam);
  const uniName = dataset.unis[uniCode] ?? "უცნობი უნივერსიტეტი";

  const uniRows = useMemo(() => rows.filter((r) => r.uniCode === uniCode), [rows, uniCode]);

  const stats = useMemo(() => {
    const scores = uniRows.filter((r) => r.compScore != null).map((r) => r.compScore!);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const g100 = uniRows.filter((r) => r.grant === 100).length;
    const g70 = uniRows.filter((r) => r.grant === 70).length;
    const g50 = uniRows.filter((r) => r.grant === 50).length;
    const acad = uniRows.filter((r) => r.type === "აკად").length;
    return { total: uniRows.length, avg, g100, g70, g50, acad, prep: uniRows.length - acad };
  }, [uniRows]);

  const programs = useMemo(() => {
    const map = new Map<number, { progCode: number; name: string; count: number; totalScore: number; scoredCount: number; minScore: number; maxScore: number; grants: { g100: number; g70: number; g50: number } }>();
    for (const r of uniRows) {
      let p = map.get(r.progCode);
      if (!p) {
        p = { progCode: r.progCode, name: r.progName, count: 0, totalScore: 0, scoredCount: 0, minScore: Infinity, maxScore: -Infinity, grants: { g100: 0, g70: 0, g50: 0 } };
        map.set(r.progCode, p);
      }
      p.count++;
      if (r.compScore != null) {
        p.totalScore += r.compScore;
        p.scoredCount++;
        if (r.compScore < p.minScore) p.minScore = r.compScore;
        if (r.compScore > p.maxScore) p.maxScore = r.compScore;
      }
      if (r.grant === 100) p.grants.g100++;
      else if (r.grant === 70) p.grants.g70++;
      else if (r.grant === 50) p.grants.g50++;
    }
    const result = Array.from(map.values()).map((p) => ({
      ...p,
      avgScore: p.scoredCount > 0 ? Math.round((p.totalScore / p.scoredCount) * 10) / 10 : 0,
      minScore: p.minScore === Infinity ? 0 : p.minScore,
      maxScore: p.maxScore === -Infinity ? 0 : p.maxScore,
    }));
    result.sort((a, b) => b.avgScore - a.avgScore);
    return result;
  }, [uniRows]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            მთავარი
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">კოდი: {uniCode}</span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-400">{year}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`text-lg transition-colors ${favUnis.has(uniCode) ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
            onClick={() => onToggleFavUni(uniCode)}
          >
            {favUnis.has(uniCode) ? "\u2665" : "\u2661"}
          </button>
          <h2 className="text-xl font-bold text-gray-800">{uniName}</h2>
        </div>
      </div>

      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="სტუდენტები" value={stats.total.toLocaleString()} />
        <StatCard label="საშ. ქულა" value={stats.avg.toFixed(1)} />
        <StatCard label="პროგრამები" value={programs.length.toString()} />
        <StatCard label="100% გრანტი" value={stats.g100.toString()} color="text-emerald-600" />
        <StatCard label="70% გრანტი" value={stats.g70.toString()} color="text-lime-600" />
        <StatCard label="50% გრანტი" value={stats.g50.toString()} color="text-amber-600" />
      </div>

      <div className="px-6 pb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">პროგრამები ({programs.length})</h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 w-8"></th>
                <th className="text-left px-4 py-2.5">პროგრამა</th>
                <th className="text-left px-2 py-2.5 w-20">კოდი</th>
                <th className="text-right px-3 py-2.5 w-16">რაოდ.</th>
                <th className="text-right px-3 py-2.5 w-20">საშ. ქულა</th>
                <th className="text-right px-3 py-2.5 w-20">მინ. ქულა</th>
                <th className="text-right px-3 py-2.5 w-20">მაქს. ქულა</th>
                <th className="text-center px-3 py-2.5 w-32">გრანტები</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => {
                const isFav = favProgs.has(p.progCode);
                return (
                  <tr key={p.progCode} className={`border-t border-gray-100 hover:bg-gray-50 ${isFav ? "bg-yellow-50" : ""}`}>
                    <td className="px-4 py-2">
                      <button
                        className={`text-sm transition-colors ${isFav ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
                        onClick={() => onToggleFavProg(p.progCode)}
                      >
                        {isFav ? "\u2665" : "\u2661"}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <Link to={`/${year}/program/${p.progCode}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-gray-400">{p.progCode}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.count}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{p.avgScore}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.minScore}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.maxScore}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {p.grants.g100 > 0 && <span className={`text-xs px-1.5 py-0.5 rounded ${grantClass(100)}`}>{p.grants.g100}</span>}
                        {p.grants.g70 > 0 && <span className={`text-xs px-1.5 py-0.5 rounded ${grantClass(70)}`}>{p.grants.g70}</span>}
                        {p.grants.g50 > 0 && <span className={`text-xs px-1.5 py-0.5 rounded ${grantClass(50)}`}>{p.grants.g50}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${color ?? "text-gray-800"}`}>{value}</div>
    </div>
  );
}
