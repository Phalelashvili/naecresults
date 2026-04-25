import { useState, useEffect, useMemo, useCallback } from "react";
import { Routes, Route, Link } from "react-router-dom";
import MultiSelect from "./MultiSelect";
import DataTable from "./Table";
import ListPanel from "./ListPanel";
import UniDetail from "./UniDetail";
import ProgramDetail from "./ProgramDetail";
import {
  Dataset, Row, Filters, SortState, AppLists, SavedList, SharedState,
  COLUMNS, emptyFilters,
  processDataset, applySort,
  loadLists, saveLists, loadPrefs, savePrefs,
  decodeShareUrl, encodeShareUrl, genId,
} from "./types";

const AVAILABLE_YEARS = ["2025"];
const GITHUB_URL = "https://github.com/phalelashvili/naecresults";

const GithubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
);

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(AVAILABLE_YEARS[0]);

  const [filters, setFilters] = useState<Filters>(emptyFilters());
  const [sort, setSort] = useState<SortState | null>(null);
  const [lists, setLists] = useState<AppLists>(loadLists());
  const [activeView, setActiveView] = useState("all");
  const [showListPanel, setShowListPanel] = useState(false);
  const [visibleCols, setVisibleCols] = useState<string[]>(loadPrefs().visibleColumns);
  const [showColPicker, setShowColPicker] = useState(false);
  const [shared, setShared] = useState<SharedState | null>(null);
  const [toast, setToast] = useState("");
  const [addToListExamId, setAddToListExamId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${year}.json`)
      .then((r) => r.json())
      .then((ds: Dataset) => {
        setDataset(ds);
        setAllRows(processDataset(ds));
        setLoading(false);
      })
      .catch((e) => {
        setError(`მონაცემები ვერ ჩაიტვირთა: ${e.message}`);
        setLoading(false);
      });
  }, [year]);

  useEffect(() => {
    const s = decodeShareUrl();
    if (s) {
      setShared(s);
      if (s.d && AVAILABLE_YEARS.includes(s.d)) setYear(s.d);
      if (s.f) {
        setFilters({
          universities: s.f.u ?? [],
          programs: s.f.pr ?? [],
          languages: s.f.l ?? [],
          subjects: s.f.s ?? [],
          grants: s.f.g ?? [],
          types: s.f.t ?? [],
          programSearch: s.f.q ?? "",
        });
      }
    }
  }, []);

  useEffect(() => { saveLists(lists); }, [lists]);
  useEffect(() => { savePrefs({ visibleColumns: visibleCols }); }, [visibleCols]);

  // Faceted filter options
  const filterOptions = useMemo(() => {
    if (!dataset || allRows.length === 0) {
      return { unis: [], progs: [], langs: [], subs: [], grants: [], types: [] };
    }

    const filterExcluding = (...exclude: string[]) => {
      let rows = allRows;
      if (!exclude.includes("universities") && filters.universities.length > 0) {
        const s = new Set(filters.universities);
        rows = rows.filter((r) => s.has(r.uniCode));
      }
      if (!exclude.includes("programs") && filters.programs.length > 0) {
        const names = new Set(filters.programs.map((i) => dataset.programNames[i]));
        rows = rows.filter((r) => names.has(r.progName));
      }
      if (!exclude.includes("languages") && filters.languages.length > 0) {
        const names = new Set(filters.languages.map((i) => dataset.languages[i]));
        rows = rows.filter((r) => r.langName != null && names.has(r.langName));
      }
      if (!exclude.includes("subjects") && filters.subjects.length > 0) {
        const names = new Set(filters.subjects.map((i) => dataset.subjects[i]));
        rows = rows.filter((r) => r.sub1Name != null && names.has(r.sub1Name));
      }
      if (!exclude.includes("grants") && filters.grants.length > 0) {
        const s = new Set(filters.grants);
        rows = rows.filter((r) => r.grant != null && s.has(r.grant));
      }
      if (!exclude.includes("types") && filters.types.length > 0) {
        const s = new Set<string>(filters.types.map((t) => (t === 0 ? "აკად" : "მოსამზ")));
        rows = rows.filter((r) => s.has(r.type));
      }
      if (!exclude.includes("programSearch") && filters.programSearch) {
        const q = filters.programSearch.toLowerCase();
        rows = rows.filter((r) => r.progName.toLowerCase().includes(q) || r.uniName.toLowerCase().includes(q));
      }
      return rows;
    };

    const uniRows = filterExcluding("universities", "programs");
    const uniCodes = new Set(uniRows.map((r) => r.uniCode));
    const unis = Object.entries(dataset.unis)
      .filter(([code]) => uniCodes.has(Number(code)))
      .map(([code, name]) => ({ value: Number(code), label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, "ka"));

    const progRows = filterExcluding("programs");
    const progNameIndices = new Set<number>();
    for (const r of progRows) {
      const info = dataset.programs[r.progCode];
      if (info) progNameIndices.add(info[1]);
    }
    const progs = Array.from(progNameIndices)
      .map((i) => ({ value: i, label: dataset.programNames[i] }))
      .sort((a, b) => a.label.localeCompare(b.label, "ka"));

    const langRows = filterExcluding("languages");
    const langSet = new Set<number>();
    for (const r of langRows) {
      if (r.langName != null) {
        const idx = dataset.languages.indexOf(r.langName);
        if (idx >= 0) langSet.add(idx);
      }
    }
    const langs = Array.from(langSet)
      .map((i) => ({ value: i, label: dataset.languages[i] }))
      .sort((a, b) => a.label.localeCompare(b.label, "ka"));

    const subRows = filterExcluding("subjects");
    const subSet = new Set<number>();
    for (const r of subRows) {
      if (r.sub1Name != null) {
        const idx = dataset.subjects.indexOf(r.sub1Name);
        if (idx >= 0) subSet.add(idx);
      }
    }
    const subs = Array.from(subSet)
      .map((i) => ({ value: i, label: dataset.subjects[i] }))
      .sort((a, b) => a.label.localeCompare(b.label, "ka"));

    const grantRows = filterExcluding("grants");
    const grantSet = new Set<number>();
    for (const r of grantRows) { if (r.grant != null) grantSet.add(r.grant); }
    const grants = [
      { value: 100, label: "100%" },
      { value: 70, label: "70%" },
      { value: 50, label: "50%" },
    ].filter((g) => grantSet.has(g.value));

    const typeRows = filterExcluding("types");
    const typeSet = new Set<string>(typeRows.map((r) => r.type));
    const types = [
      { value: 0, label: "აკადემიური", type: "აკად" },
      { value: 1, label: "მოსამზადებელი", type: "მოსამზ" },
    ].filter((t) => typeSet.has(t.type)).map(({ value, label }) => ({ value, label }));

    return { unis, progs, langs, subs, grants, types };
  }, [dataset, allRows, filters]);

  // Prune stale selections
  useEffect(() => {
    const prune = (selected: number[], options: { value: number }[]) => {
      const available = new Set(options.map((o) => o.value));
      const valid = selected.filter((v) => available.has(v));
      return valid.length !== selected.length ? valid : null;
    };
    const pU = prune(filters.universities, filterOptions.unis);
    const pP = prune(filters.programs, filterOptions.progs);
    const pL = prune(filters.languages, filterOptions.langs);
    const pS = prune(filters.subjects, filterOptions.subs);
    const pG = prune(filters.grants, filterOptions.grants);
    const pT = prune(filters.types, filterOptions.types);
    if (pU || pP || pL || pS || pG || pT) {
      setFilters((f) => ({
        ...f,
        ...(pU && { universities: pU }),
        ...(pP && { programs: pP }),
        ...(pL && { languages: pL }),
        ...(pS && { subjects: pS }),
        ...(pG && { grants: pG }),
        ...(pT && { types: pT }),
      }));
    }
  }, [filterOptions]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!dataset || allRows.length === 0) return [];
    let filtered = allRows;

    if (filters.universities.length > 0) {
      const uSet = new Set(filters.universities);
      filtered = filtered.filter((r) => uSet.has(r.uniCode));
    }
    if (filters.programs.length > 0) {
      const progNames = new Set(filters.programs.map((i) => dataset.programNames[i]));
      filtered = filtered.filter((r) => progNames.has(r.progName));
    }
    if (filters.languages.length > 0) {
      const langNames = new Set(filters.languages.map((i) => dataset.languages[i]));
      filtered = filtered.filter((r) => r.langName != null && langNames.has(r.langName));
    }
    if (filters.subjects.length > 0) {
      const subNames = new Set(filters.subjects.map((i) => dataset.subjects[i]));
      filtered = filtered.filter((r) => r.sub1Name != null && subNames.has(r.sub1Name));
    }
    if (filters.grants.length > 0) {
      const gSet = new Set(filters.grants);
      filtered = filtered.filter((r) => r.grant != null && gSet.has(r.grant));
    }
    if (filters.types.length > 0) {
      const tSet = new Set<string>(filters.types.map((t) => (t === 0 ? "აკად" : "მოსამზ")));
      filtered = filtered.filter((r) => tSet.has(r.type));
    }
    if (filters.programSearch) {
      const q = filters.programSearch.toLowerCase();
      filtered = filtered.filter(
        (r) => r.progName.toLowerCase().includes(q) || r.uniName.toLowerCase().includes(q)
      );
    }

    if (activeView === "favorites") {
      const favRowSet = new Set(lists.favorites.rows);
      const favProgSet = new Set(lists.favorites.programs);
      const favUniSet = new Set(lists.favorites.universities);
      filtered = filtered.filter((r) => favRowSet.has(r.examId) || favProgSet.has(r.progCode) || favUniSet.has(r.uniCode));
    } else if (activeView !== "all") {
      const list = lists.lists.find((l) => l.id === activeView);
      if (list) {
        const rowSet = new Set(list.rows);
        const progSet = new Set(list.programs);
        const uniSet = new Set(list.universities);
        filtered = filtered.filter((r) => rowSet.has(r.examId) || progSet.has(r.progCode) || uniSet.has(r.uniCode));
      }
    }

    // Filter to shared items when viewing a shared link
    if (shared && (shared.r?.length || shared.p?.length || shared.u?.length)) {
      const sharedRowSet = shared.r?.length ? new Set(shared.r) : null;
      const sharedProgSet = shared.p?.length ? new Set(shared.p) : null;
      const sharedUniSet = shared.u?.length ? new Set(shared.u) : null;
      filtered = filtered.filter((r) =>
        (sharedRowSet && sharedRowSet.has(r.examId)) ||
        (sharedProgSet && sharedProgSet.has(r.progCode)) ||
        (sharedUniSet && sharedUniSet.has(r.uniCode))
      );
    }

    return filtered;
  }, [allRows, filters, dataset, activeView, lists, shared]);

  const sortedRows = useMemo(() => applySort(filteredRows, sort), [filteredRows, sort]);

  const handleSort = useCallback((key: keyof Row) => {
    setSort((prev) => {
      if (prev?.key === key) {
        if (prev.dir === "asc") return { key, dir: "desc" };
        return null;
      }
      return { key, dir: "asc" };
    });
  }, []);

  const activeColumns = useMemo(
    () => COLUMNS.filter((c) => visibleCols.includes(c.key)),
    [visibleCols]
  );

  const favRows = useMemo(() => new Set(lists.favorites.rows), [lists]);
  const favProgs = useMemo(() => new Set(lists.favorites.programs), [lists]);
  const favUnis = useMemo(() => new Set(lists.favorites.universities), [lists]);
  const sharedRows = useMemo(() => (shared?.r ? new Set(shared.r) : undefined), [shared]);
  const sharedProgs = useMemo(() => (shared?.p ? new Set(shared.p) : undefined), [shared]);

  const toggleFavRow = useCallback((examId: number) => {
    setLists((prev) => {
      const rows = prev.favorites.rows.includes(examId)
        ? prev.favorites.rows.filter((r) => r !== examId)
        : [...prev.favorites.rows, examId];
      return { ...prev, favorites: { ...prev.favorites, rows } };
    });
  }, []);

  const toggleFavProg = useCallback((code: number) => {
    setLists((prev) => {
      const programs = prev.favorites.programs.includes(code)
        ? prev.favorites.programs.filter((p) => p !== code)
        : [...prev.favorites.programs, code];
      return { ...prev, favorites: { ...prev.favorites, programs } };
    });
  }, []);

  const toggleFavUni = useCallback((code: number) => {
    setLists((prev) => {
      const universities = prev.favorites.universities.includes(code)
        ? prev.favorites.universities.filter((u) => u !== code)
        : [...prev.favorites.universities, code];
      return { ...prev, favorites: { ...prev.favorites, universities } };
    });
  }, []);

  const handleAddToList = useCallback((examId: number) => { setAddToListExamId(examId); }, []);

  const addRowToList = (listId: string, examId: number) => {
    setLists((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => {
        if (l.id !== listId) return l;
        if (l.rows.includes(examId)) return l;
        return { ...l, rows: [...l.rows, examId] };
      }),
    }));
    setAddToListExamId(null);
    showToastMsg("დამატებულია!");
  };

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const clearFilters = () => setFilters(emptyFilters());


  const hasActiveFilters = filters.universities.length > 0 || filters.programs.length > 0 ||
    filters.languages.length > 0 || filters.subjects.length > 0 || filters.grants.length > 0 ||
    filters.types.length > 0 || filters.programSearch.length > 0;

  const saveSharedToList = () => {
    if (!shared) return;
    const newList: SavedList = {
      id: genId(),
      name: shared.n ?? "გაზიარებული სია",
      rows: shared.r ?? [],
      programs: shared.p ?? [],
      universities: shared.u ?? [],
    };
    setLists((prev) => ({ ...prev, lists: [...prev.lists, newList] }));
    showToastMsg("სიაში შენახულია!");
    setShared(null);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const progNameMap = useMemo(() => {
    if (!dataset) return new Map<number, string>();
    const m = new Map<number, string>();
    for (const [code, [, nameIdx]] of Object.entries(dataset.programs))
      m.set(Number(code), dataset.programNames[nameIdx]);
    return m;
  }, [dataset]);

  const progUniMap = useMemo(() => {
    if (!dataset) return new Map<number, string>();
    const m = new Map<number, string>();
    for (const [code, [uniCode]] of Object.entries(dataset.programs))
      m.set(Number(code), dataset.unis[uniCode]);
    return m;
  }, [dataset]);

  const uniNameByIdMap = useMemo(() => {
    if (!dataset) return new Map<number, string>();
    const m = new Map<number, string>();
    for (const [code, name] of Object.entries(dataset.unis))
      m.set(Number(code), name);
    return m;
  }, [dataset]);

  const currentSharedFilters = useMemo((): SharedState["f"] => {
    const f: SharedState["f"] = {};
    if (filters.universities.length) f.u = filters.universities;
    if (filters.programs.length) f.pr = filters.programs;
    if (filters.languages.length) f.l = filters.languages;
    if (filters.subjects.length) f.s = filters.subjects;
    if (filters.grants.length) f.g = filters.grants;
    if (filters.types.length) f.t = filters.types;
    if (filters.programSearch) f.q = filters.programSearch;
    return f;
  }, [filters]);

  // Sync current state to URL in real time
  useEffect(() => {
    // Don't overwrite URL while viewing a shared link
    if (shared) return;

    const hasFilters = currentSharedFilters && Object.keys(currentSharedFilters).length > 0;
    const hasView = activeView !== "all";

    if (!hasFilters && !hasView) {
      // Clean URL when no filters active
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      return;
    }

    const state: SharedState = { d: year };
    if (hasFilters) state.f = currentSharedFilters;
    if (activeView === "favorites") {
      if (lists.favorites.rows.length) state.r = lists.favorites.rows;
      if (lists.favorites.programs.length) state.p = lists.favorites.programs;
      if (lists.favorites.universities.length) state.u = lists.favorites.universities;
      state.n = "ფავორიტები";
    } else if (activeView !== "all") {
      const list = lists.lists.find((l) => l.id === activeView);
      if (list) {
        if (list.rows.length) state.r = list.rows;
        if (list.programs.length) state.p = list.programs;
        if (list.universities.length) state.u = list.universities;
        state.n = list.name;
      }
    }
    const url = encodeShareUrl(state);
    const hash = url.split("#")[1] ?? "";
    window.history.replaceState(null, "", hash ? `#${hash}` : window.location.pathname);
  }, [currentSharedFilters, activeView, lists, year, shared]);

  const shareCurrentView = () => {
    const state: SharedState = { d: year };
    if (currentSharedFilters && Object.keys(currentSharedFilters).length > 0) state.f = currentSharedFilters;
    // Include favorites if viewing favorites
    if (activeView === "favorites") {
      if (lists.favorites.rows.length) state.r = lists.favorites.rows;
      if (lists.favorites.programs.length) state.p = lists.favorites.programs;
      if (lists.favorites.universities.length) state.u = lists.favorites.universities;
      state.n = "ფავორიტები";
    } else if (activeView !== "all") {
      const list = lists.lists.find((l) => l.id === activeView);
      if (list) {
        if (list.rows.length) state.r = list.rows;
        if (list.programs.length) state.p = list.programs;
        if (list.universities.length) state.u = list.universities;
        state.n = list.name;
      }
    } else {
      state.n = "ფილტრი";
    }
    const url = encodeShareUrl(state);
    navigator.clipboard.writeText(url).then(() => {
      showToastMsg("ბმული დაკოპირებულია!");
    });
  };

  const toggleCol = (key: string) => {
    setVisibleCols((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <div className="text-gray-500 text-sm">მონაცემები იტვირთება...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-xl mb-2">&#x26A0;&#xFE0F;</div>
          <div className="text-red-600 mb-4">{error}</div>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm">
            <GithubIcon /> GitHub
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0" style={{ height: "var(--header-h)" }}>
        <Link to="/" className="font-bold text-lg text-gray-800 whitespace-nowrap hover:text-blue-600 transition-colors">
          NAEC Results
        </Link>

        {AVAILABLE_YEARS.length > 1 && (
          <select value={year} onChange={(e) => setYear(e.target.value)} className="border border-gray-200 rounded-md px-2 py-1 text-sm">
            {AVAILABLE_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        <span className="text-xs text-gray-400 whitespace-nowrap">{year}</span>
        <div className="flex-1" />

        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
          <button
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${activeView === "all" ? "bg-gray-100 text-gray-800" : "text-gray-500 hover:bg-gray-50"}`}
            onClick={() => setActiveView("all")}
          >ყველა</button>
          <button
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${activeView === "favorites" ? "bg-yellow-100 text-yellow-800" : "text-gray-500 hover:bg-gray-50"}`}
            onClick={() => setActiveView(activeView === "favorites" ? "all" : "favorites")}
          >
            {"\u2665"} ფავორიტები
            {(lists.favorites.rows.length + lists.favorites.programs.length + lists.favorites.universities.length) > 0 && (
              <span className="ml-1 text-[10px] bg-yellow-200 text-yellow-800 rounded-full px-1">
                {lists.favorites.rows.length + lists.favorites.programs.length + lists.favorites.universities.length}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <button className="btn btn-ghost text-xs" onClick={() => setShowColPicker(!showColPicker)} title="სვეტების არჩევა">
            &#x2699; სვეტები
          </button>
          {showColPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColPicker(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
                {COLUMNS.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
                    <input type="checkbox" checked={visibleCols.includes(col.key)} onChange={() => toggleCol(col.key)} className="rounded border-gray-300 text-blue-600" />
                    {col.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <button className={`btn ${showListPanel ? "btn-primary" : "btn-ghost"} text-xs`} onClick={() => setShowListPanel(!showListPanel)}>
          &#x1F4CB; სიები
        </button>

        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors" title="GitHub">
          <GithubIcon />
        </a>
      </header>

      {/* Warning banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center gap-2 shrink-0 text-xs text-amber-800">
        <span>&#x26A0;&#xFE0F;</span>
        <span>მონაცემები შეიძლება არ იყოს სრულყოფილი. გადაწყვეტილების მიღებამდე გადაამოწმეთ ოფიციალური წყაროები.</span>
      </div>

      {/* Shared state banner */}
      {shared && (shared.r?.length || shared.p?.length || shared.u?.length || shared.f) && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-3 shrink-0 flex-wrap">
          <span className="text-sm text-blue-700">
            &#x1F517; გაზიარებული: <strong>{shared.n ?? "სია"}</strong>
            {shared.u && shared.u.length > 0 && ` (${shared.u.length} უნივერსიტეტი)`}
            {shared.p && shared.p.length > 0 && ` (${shared.p.length} პროგრამა)`}
            {shared.r && shared.r.length > 0 && ` (${shared.r.length} ჩანაწერი)`}
          </span>
          {(shared.r?.length || shared.p?.length || shared.u?.length) ? (
            <button className="btn btn-primary text-xs" onClick={saveSharedToList}>შენახვა</button>
          ) : null}
          <button className="btn btn-ghost text-xs" onClick={() => { setShared(null); window.history.replaceState(null, "", window.location.pathname); }}>დახურვა</button>
        </div>
      )}

      {/* Routes */}
      <Routes>
        <Route path="/" element={
          <>
            {/* Filter bar */}
            <div className="px-4 py-2 bg-white border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <MultiSelect label="უნივერსიტეტი" options={filterOptions.unis} selected={filters.universities} onChange={(v) => setFilters((f) => ({ ...f, universities: v }))} />
                <MultiSelect label="პროგრამა" options={filterOptions.progs} selected={filters.programs} onChange={(v) => setFilters((f) => ({ ...f, programs: v }))} />
                <MultiSelect label="უცხო ენა" options={filterOptions.langs} selected={filters.languages} onChange={(v) => setFilters((f) => ({ ...f, languages: v }))} />
                <MultiSelect label="არჩევითი საგანი" options={filterOptions.subs} selected={filters.subjects} onChange={(v) => setFilters((f) => ({ ...f, subjects: v }))} />
                <MultiSelect label="გრანტი" options={filterOptions.grants} selected={filters.grants} onChange={(v) => setFilters((f) => ({ ...f, grants: v }))} />
                <MultiSelect label="ტიპი" options={filterOptions.types} selected={filters.types} onChange={(v) => setFilters((f) => ({ ...f, types: v }))} />
                <input
                  type="text" value={filters.programSearch}
                  onChange={(e) => setFilters((f) => ({ ...f, programSearch: e.target.value }))}
                  placeholder="ძიება..."
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 w-44"
                />
                {hasActiveFilters && (
                  <button className="text-xs text-blue-600 hover:underline" onClick={clearFilters}>გასუფთავება</button>
                )}
                <div className="flex-1" />
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {sortedRows.length.toLocaleString()} / {allRows.length.toLocaleString()}
                </span>
                <button className="btn btn-ghost text-xs whitespace-nowrap" onClick={shareCurrentView} title="მიმდინარე ხედის გაზიარება">
                  &#x1F517; გაზიარება
                </button>
              </div>
            </div>

            {/* Table + list panel */}
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <DataTable
                  rows={sortedRows} columns={activeColumns} sort={sort} onSort={handleSort}
                  favRows={favRows} favProgs={favProgs} favUnis={favUnis}
                  onToggleFavRow={toggleFavRow} onToggleFavProg={toggleFavProg} onToggleFavUni={toggleFavUni}
                  sharedRows={sharedRows} sharedProgs={sharedProgs}
                  onAddToList={lists.lists.length > 0 ? handleAddToList : undefined}
                  year={year}
                />
              </div>
              {showListPanel && (
                <ListPanel
                  lists={lists} onUpdate={setLists} activeView={activeView} onViewChange={setActiveView}
                  datasetYear={year} currentFilters={currentSharedFilters}
                  onClose={() => setShowListPanel(false)} programNames={progNameMap} uniNames={progUniMap} uniNamesById={uniNameByIdMap}
                />
              )}
            </div>
          </>
        } />

        <Route path="/:year/uni/:uniCode" element={
          <div className="flex-1 overflow-hidden">
            <UniDetail dataset={dataset!} rows={allRows} favProgs={favProgs} favUnis={favUnis} onToggleFavProg={toggleFavProg} onToggleFavUni={toggleFavUni} onYearChange={setYear} />
          </div>
        } />

        <Route path="/:year/program/:progCode" element={
          <div className="flex-1 overflow-hidden">
            <ProgramDetail dataset={dataset!} rows={allRows} favRows={favRows} favProgs={favProgs} onToggleFavRow={toggleFavRow} onToggleFavProg={toggleFavProg} onYearChange={setYear} />
          </div>
        } />
      </Routes>

      {/* Add to list modal */}
      {addToListExamId !== null && lists.lists.length > 0 && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setAddToListExamId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-72 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">სიაში დამატება</div>
            {lists.lists.map((list) => (
              <button key={list.id} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => addRowToList(list.id, addToListExamId)}>
                &#x1F4CB; {list.name}
                {list.rows.includes(addToListExamId) && <span className="ml-auto text-xs text-green-600">&#x2713;</span>}
              </button>
            ))}
            <button className="w-full px-4 py-2.5 text-left text-sm text-gray-400 hover:bg-gray-50 border-t border-gray-100" onClick={() => setAddToListExamId(null)}>გაუქმება</button>
          </div>
        </>
      )}

      {toast && (
        <div className="toast fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">{toast}</div>
      )}
    </div>
  );
}
