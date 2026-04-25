import { useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Row, Dataset, grantClass, scoreColor, choiceColor } from "./types";

interface Props {
  dataset: Dataset;
  rows: Row[];
  favRows: Set<number>;
  favProgs: Set<number>;
  onToggleFavRow: (examId: number) => void;
  onToggleFavProg: (code: number) => void;
  onYearChange: (year: string) => void;
}

export default function ProgramDetail({ dataset, rows, favRows, favProgs, onToggleFavRow, onToggleFavProg, onYearChange }: Props) {
  const { progCode: progCodeParam, year } = useParams();

  useEffect(() => {
    if (year) onYearChange(year);
  }, [year, onYearChange]);
  const progCode = Number(progCodeParam);

  const progInfo = dataset.programs[progCode];
  const uniCode = progInfo?.[0] ?? 0;
  const progName = progInfo ? dataset.programNames[progInfo[1]] : "უცნობი პროგრამა";
  const uniName = dataset.unis[uniCode] ?? "უცნობი უნივერსიტეტი";

  const progRows = useMemo(
    () => rows.filter((r) => r.progCode === progCode),
    [rows, progCode]
  );

  const stats = useMemo(() => {
    const scores = progRows.filter((r) => r.compScore != null).map((r) => r.compScore!);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const min = scores.length ? Math.min(...scores) : 0;
    const max = scores.length ? Math.max(...scores) : 0;
    const g100 = progRows.filter((r) => r.grant === 100).length;
    const g70 = progRows.filter((r) => r.grant === 70).length;
    const g50 = progRows.filter((r) => r.grant === 50).length;
    return { total: progRows.length, avg, min, max, g100, g70, g50 };
  }, [progRows]);

  const scoreRange = useMemo(() => ({ min: stats.min, max: stats.max }), [stats]);

  const sortedRows = useMemo(
    () => [...progRows].sort((a, b) => (b.compScore ?? 0) - (a.compScore ?? 0)),
    [progRows]
  );

  const isFavProg = favProgs.has(progCode);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2 mb-2 text-sm">
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            მთავარი
          </Link>
          <span className="text-gray-300">/</span>
          <Link to={`/${year}/uni/${uniCode}`} className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[300px]">
            {uniName}
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{progCode}</span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-400">{year}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`text-lg transition-colors ${isFavProg ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
            onClick={() => onToggleFavProg(progCode)}
            title={isFavProg ? "ფავორიტებიდან ამოღება" : "ფავორიტებში დამატება"}
          >
            {isFavProg ? "\u2665" : "\u2661"}
          </button>
          <h2 className="text-xl font-bold text-gray-800">{progName}</h2>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="ჩარიცხულები" value={stats.total.toLocaleString()} />
        <StatCard label="საშ. ქულა" value={stats.avg.toFixed(1)} />
        <StatCard label="მინ. ქულა" value={stats.min.toString()} />
        <StatCard label="მაქს. ქულა" value={stats.max.toString()} />
        <StatCard label="100% გრანტი" value={stats.g100.toString()} color="text-emerald-600" />
        <StatCard label="70% გრანტი" value={stats.g70.toString()} color="text-lime-600" />
        <StatCard label="50% გრანტი" value={stats.g50.toString()} color="text-amber-600" />
      </div>

      {/* Students table */}
      <div className="px-6 pb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">
          ჩარიცხულები ({sortedRows.length})
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2.5 w-8"></th>
                <th className="text-left px-3 py-2.5">საგამოცდო</th>
                <th className="text-right px-3 py-2.5">ქართ. სკალ.</th>
                <th className="text-left px-3 py-2.5">უცხო ენა</th>
                <th className="text-right px-3 py-2.5">უცხ. სკალ.</th>
                <th className="text-left px-3 py-2.5">არჩევითი 1</th>
                <th className="text-right px-3 py-2.5">არჩ.1 სკალ.</th>
                <th className="text-right px-3 py-2.5">საკონკ. ქულა</th>
                <th className="text-center px-3 py-2.5">გრანტი</th>
                <th className="text-center px-3 py-2.5">არჩევანი</th>
                <th className="text-center px-3 py-2.5">ტიპი</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => {
                const isFav = favRows.has(r.examId);
                const bg = scoreColor(r.compScore, scoreRange.min, scoreRange.max);
                return (
                  <tr key={r.examId} className={`border-t border-gray-100 hover:bg-gray-50 ${isFav ? "bg-yellow-50" : ""}`}>
                    <td className="px-3 py-2">
                      <button
                        className={`text-sm transition-colors ${isFav ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
                        onClick={() => onToggleFavRow(r.examId)}
                      >
                        {isFav ? "\u2665" : "\u2661"}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.examId}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.geoScaled ?? <Dash />}</td>
                    <td className="px-3 py-2 text-xs">{r.langName ?? <Dash />}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.langScaled ?? <Dash />}</td>
                    <td className="px-3 py-2 text-xs">{r.sub1Name ?? <Dash />}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.sub1Scaled ?? <Dash />}</td>
                    <td className="px-3 py-2 text-right">
                      {r.compScore != null ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium tabular-nums" style={bg ? { backgroundColor: bg } : undefined}>
                          {r.compScore}
                        </span>
                      ) : <Dash />}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.grant != null ? (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${grantClass(r.grant)}`}>{r.grant}%</span>
                      ) : <Dash />}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${choiceColor(r.choice)}`}>{r.choice}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs ${r.type === "აკად" ? "text-blue-600" : "text-purple-600"}`}>{r.type}</span>
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

function Dash() {
  return <span className="text-gray-300">—</span>;
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${color ?? "text-gray-800"}`}>{value}</div>
    </div>
  );
}
