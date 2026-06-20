import { useState, useRef, useEffect, useCallback } from "react";

interface Option {
  value: number;
  label: string;
}

interface Props {
  label: string;
  options: Option[];
  selected: number[];
  onChange: (selected: number[]) => void;
  maxDisplay?: number;
}

export default function MultiSelect({ label, options, selected, onChange, maxDisplay = 2 }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
      setSearch("");
    }
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (val: number) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val]
    );
  };

  const isActive = selected.length > 0;

  const displayText = () => {
    if (selected.length === 0) return label;
    if (selected.length <= maxDisplay) {
      return selected
        .map((v) => {
          const opt = options.find((o) => o.value === v);
          const lbl = opt?.label ?? String(v);
          return lbl.length > 15 ? lbl.slice(0, 14) + "…" : lbl;
        })
        .join(", ");
    }
    return `${label} (${selected.length})`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className={`filter-chip ${isActive ? "active" : ""}`}
        onClick={() => { setOpen(!open); setSearch(""); }}
      >
        <span className="truncate max-w-[180px]">{displayText()}</span>
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="multi-select-dropdown">
          {options.length > 6 && (
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ძიება..."
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400"
                autoFocus
              />
            </div>
          )}

          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100">
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => onChange(filtered.map((o) => o.value))}
            >
              ყველა
            </button>
            <span className="text-gray-300">|</span>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => onChange([])}
            >
              გასუფთავება
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="truncate" title={opt.label}>{opt.label}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">არაფერი მოიძებნა</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
