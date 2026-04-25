import { useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Row, ColumnDef, SortState, grantClass, scoreColor, choiceColor,
} from "./types";

interface Props {
  rows: Row[];
  columns: ColumnDef[];
  sort: SortState | null;
  onSort: (key: keyof Row) => void;
  favRows: Set<number>;
  favProgs: Set<number>;
  favUnis: Set<number>;
  onToggleFavRow: (examId: number) => void;
  onToggleFavProg: (code: number) => void;
  onToggleFavUni: (code: number) => void;
  sharedRows?: Set<number>;
  sharedProgs?: Set<number>;
  onAddToList?: (examId: number) => void;
  year: string;
}

const ROW_HEIGHT = 36;
const HEART_ON = "\u2665";
const HEART_OFF = "\u2661";

export default function DataTable({
  rows, columns, sort, onSort,
  favRows, favProgs, favUnis,
  onToggleFavRow, onToggleFavProg, onToggleFavUni,
  sharedRows, sharedProgs, onAddToList, year,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const scoreRange = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const r of rows) {
      if (r.compScore != null) {
        if (r.compScore < min) min = r.compScore;
        if (r.compScore > max) max = r.compScore;
      }
    }
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max };
  }, [rows]);

  const sortIcon = useCallback((key: keyof Row) => {
    if (!sort || sort.key !== key) return "\u2195";
    return sort.dir === "asc" ? "\u2191" : "\u2193";
  }, [sort]);

  const renderCell = useCallback((row: Row, col: ColumnDef, isRowFav: boolean) => {
    const val = row[col.key];

    if (col.key === "grant") {
      if (val == null) return <span className="text-gray-300">&mdash;</span>;
      return <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${grantClass(val as number)}`}>{val}%</span>;
    }
    if (col.key === "compScore" && val != null) {
      const bg = scoreColor(val as number, scoreRange.min, scoreRange.max);
      return (
        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium" style={bg ? { backgroundColor: bg } : undefined}>
          {val}
        </span>
      );
    }
    if (col.key === "choice") {
      return <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${choiceColor(val as number)}`}>{val}</span>;
    }
    if (col.key === "type") {
      return <span className={`text-xs ${val === "\u10D0\u10D9\u10D0\u10D3" ? "text-blue-600" : "text-purple-600"}`}>{val}</span>;
    }
    if (col.key === "examId") {
      return (
        <span className="flex items-center justify-end gap-1 group/exam">
          <button
            className={`shrink-0 text-sm transition-colors opacity-30 group-hover/exam:opacity-100 ${isRowFav ? "text-red-500 opacity-100" : "text-gray-400 hover:text-red-400"}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavRow(row.examId); }}
            title={isRowFav ? "\u10E9\u10D0\u10DC\u10D0\u10EC\u10D4\u10E0\u10D8\u10E1 \u10D0\u10DB\u10DD\u10E6\u10D4\u10D1\u10D0" : "\u10E9\u10D0\u10DC\u10D0\u10EC\u10D4\u10E0\u10D8\u10E1 \u10E8\u10D4\u10DC\u10D0\u10EE\u10D5\u10D0"}
          >
            {isRowFav ? HEART_ON : HEART_OFF}
          </button>
          <span className="font-mono text-xs text-gray-500">{val}</span>
        </span>
      );
    }
    if (col.key === "progName") {
      const isPF = favProgs.has(row.progCode);
      const isSharedProg = sharedProgs?.has(row.progCode);
      return (
        <span className="flex items-center gap-1 group/prog">
          <button
            className={`shrink-0 text-sm opacity-30 group-hover/prog:opacity-100 transition-opacity ${isPF ? "text-red-500 opacity-100" : "text-gray-400 hover:text-red-400"}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavProg(row.progCode); }}
          >
            {isPF ? HEART_ON : HEART_OFF}
          </button>
          <Link
            to={`/${year}/program/${row.progCode}`}
            className={`truncate hover:underline ${isSharedProg ? "font-semibold text-blue-700" : "text-blue-600 hover:text-blue-800"}`}
          >
            {val as string}
          </Link>
        </span>
      );
    }
    if (col.key === "uniName") {
      const isUF = favUnis.has(row.uniCode);
      return (
        <span className="flex items-center gap-1 group/uni">
          <button
            className={`shrink-0 text-sm opacity-30 group-hover/uni:opacity-100 transition-opacity ${isUF ? "text-red-500 opacity-100" : "text-gray-400 hover:text-red-400"}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavUni(row.uniCode); }}
          >
            {isUF ? HEART_ON : HEART_OFF}
          </button>
          <Link
            to={`/${year}/uni/${row.uniCode}`}
            className="truncate text-blue-600 hover:text-blue-800 hover:underline"
            title={val as string}
          >
            {val as string}
          </Link>
        </span>
      );
    }

    if (val == null) return <span className="text-gray-300">&mdash;</span>;
    return <>{val}</>;
  }, [scoreRange, favProgs, favUnis, sharedProgs, onToggleFavProg, onToggleFavRow, onToggleFavUni, year]);

  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0) + (onAddToList ? 40 : 0);

  return (
    <div className="h-full overflow-x-auto">
      <div style={{ minWidth: totalWidth }} className="h-full flex flex-col">
        <div className="sticky top-0 z-20 flex bg-gray-100 border-b border-gray-300 text-xs font-semibold text-gray-600 uppercase tracking-wider shrink-0">
          {onAddToList && (
            <div className="flex items-center justify-center shrink-0" style={{ width: 40 }}>+</div>
          )}
          {columns.map((col) => (
            <div
              key={col.key}
              className={`flex items-center gap-1 px-2 shrink-0 cursor-pointer hover:bg-gray-200 transition-colors select-none ${col.numeric ? "justify-end" : ""}`}
              style={{ width: col.width, minWidth: col.width, height: ROW_HEIGHT }}
              onClick={() => col.sortable && onSort(col.key)}
            >
              <span className="truncate">{col.shortLabel ?? col.label}</span>
              {col.sortable && (
                <span className={`text-[10px] ${sort?.key === col.key ? "text-blue-600" : "text-gray-400"}`}>
                  {sortIcon(col.key)}
                </span>
              )}
            </div>
          ))}
        </div>

        <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((vRow) => {
            const row = rows[vRow.index];
            const isRowFav = favRows.has(row.examId);
            const isShared = sharedRows?.has(row.examId);
            const isSharedProg = sharedProgs?.has(row.progCode);

            let rowBg = "";
            if (isShared || isSharedProg) rowBg = "bg-blue-50";
            if (isRowFav) rowBg = "bg-yellow-50";

            return (
              <div
                key={vRow.key}
                className={`absolute flex items-center border-b border-gray-100 text-sm hover:bg-gray-50 ${rowBg}`}
                style={{ top: vRow.start, height: ROW_HEIGHT, width: "100%" }}
              >
                {onAddToList && (
                  <div className="flex items-center justify-center shrink-0" style={{ width: 40 }}>
                    <button className="text-gray-300 hover:text-blue-500 transition-colors text-base" onClick={() => onAddToList(row.examId)}>+</button>
                  </div>
                )}
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={`px-2 shrink-0 truncate ${col.numeric ? "text-right tabular-nums" : ""}`}
                    style={{ width: col.width, minWidth: col.width, height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px` }}
                  >
                    {renderCell(row, col, isRowFav)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}
