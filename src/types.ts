import LZString from "lz-string";

// ── Data types ──────────────────────────────────────────────────

export interface Dataset {
  year: number;
  unis: Record<string, string>; // uniCode -> name
  programNames: string[];
  programs: Record<string, [number, number]>; // progCode -> [uniCode, nameIdx]
  languages: string[];
  subjects: string[];
  data: RawRow[];
}

// Compact row array from JSON
// [progCode, examId, geoRaw, geoScaled, langIdx, langRaw, langScaled,
//  sub1Idx, sub1Raw, sub1Scaled, sub2Idx, sub2Raw, sub2Scaled,
//  compScore, grant, choice, type]
export type RawRow = (number | null)[];

export enum Col {
  ProgCode = 0,
  ExamId = 1,
  GeoRaw = 2,
  GeoScaled = 3,
  LangIdx = 4,
  LangRaw = 5,
  LangScaled = 6,
  Sub1Idx = 7,
  Sub1Raw = 8,
  Sub1Scaled = 9,
  Sub2Idx = 10,
  Sub2Raw = 11,
  Sub2Scaled = 12,
  CompScore = 13,
  Grant = 14,
  Choice = 15,
  Type = 16,
}

// Processed row with resolved lookups
export interface Row {
  idx: number; // original index in data array (stable ID)
  progCode: number;
  examId: number;
  uniCode: number;
  uniName: string;
  progName: string;
  geoRaw: number | null;
  geoScaled: number | null;
  langName: string | null;
  langRaw: number | null;
  langScaled: number | null;
  sub1Name: string | null;
  sub1Raw: number | null;
  sub1Scaled: number | null;
  sub2Name: string | null;
  sub2Raw: number | null;
  sub2Scaled: number | null;
  compScore: number | null;
  grant: number | null;
  choice: number;
  type: string; // "აკად" | "მოსამზ"
}

// ── Column definitions ──────────────────────────────────────────

export interface ColumnDef {
  key: keyof Row;
  label: string;
  shortLabel?: string;
  defaultVisible: boolean;
  sortable: boolean;
  numeric: boolean;
  width: number; // min-width in px
}

// Column order matches the Excel source
export const COLUMNS: ColumnDef[] = [
  { key: "uniCode", label: "უსდ კოდი", defaultVisible: false, sortable: true, numeric: true, width: 70 },
  { key: "uniName", label: "უნივერსიტეტი", shortLabel: "უნივ.", defaultVisible: true, sortable: true, numeric: false, width: 220 },
  { key: "progCode", label: "პროგ. კოდი", defaultVisible: false, sortable: true, numeric: true, width: 85 },
  { key: "progName", label: "პროგრამა", defaultVisible: true, sortable: true, numeric: false, width: 200 },
  { key: "examId", label: "საგამოცდო", defaultVisible: true, sortable: true, numeric: true, width: 120 },
  { key: "geoRaw", label: "ქართ. ნედლი", defaultVisible: true, sortable: true, numeric: true, width: 90 },
  { key: "geoScaled", label: "ქართ. სკალ.", defaultVisible: true, sortable: true, numeric: true, width: 90 },
  { key: "langName", label: "უცხო ენა", defaultVisible: true, sortable: true, numeric: false, width: 110 },
  { key: "langRaw", label: "უცხ. ნედლი", defaultVisible: true, sortable: true, numeric: true, width: 85 },
  { key: "langScaled", label: "უცხ. სკალ.", defaultVisible: true, sortable: true, numeric: true, width: 85 },
  { key: "sub1Name", label: "არჩევითი 1", defaultVisible: true, sortable: true, numeric: false, width: 110 },
  { key: "sub1Raw", label: "არჩ.1 ნედლი", defaultVisible: true, sortable: true, numeric: true, width: 90 },
  { key: "sub1Scaled", label: "არჩ.1 სკალ.", defaultVisible: true, sortable: true, numeric: true, width: 90 },
  { key: "sub2Name", label: "არჩევითი 2", defaultVisible: false, sortable: true, numeric: false, width: 100 },
  { key: "sub2Raw", label: "არჩ.2 ნედლი", defaultVisible: false, sortable: true, numeric: true, width: 90 },
  { key: "sub2Scaled", label: "არჩ.2 სკალ.", defaultVisible: false, sortable: true, numeric: true, width: 90 },
  { key: "compScore", label: "საკონკ. ქულა", defaultVisible: true, sortable: true, numeric: true, width: 100 },
  { key: "grant", label: "გრანტი %", defaultVisible: true, sortable: true, numeric: true, width: 80 },
  { key: "choice", label: "არჩევანი", defaultVisible: true, sortable: true, numeric: true, width: 75 },
  { key: "type", label: "აკად/მოსამზ", defaultVisible: false, sortable: true, numeric: false, width: 90 },
];

// ── Filter state ────────────────────────────────────────────────

export interface Filters {
  universities: number[];
  programs: number[];    // indices into programNames
  languages: number[];
  subjects: number[];
  grants: number[];
  types: number[];
  programSearch: string;
}

export const emptyFilters = (): Filters => ({
  universities: [],
  programs: [],
  languages: [],
  subjects: [],
  grants: [],
  types: [],
  programSearch: "",
});

// ── Sort state ──────────────────────────────────────────────────

export interface SortState {
  key: keyof Row;
  dir: "asc" | "desc";
}

// ── List / Favorites ────────────────────────────────────────────

export interface SavedList {
  id: string;
  name: string;
  rows: number[];          // exam IDs (საგამოცდო)
  programs: number[];      // program codes
  universities: number[];  // university codes
}

export interface AppLists {
  favorites: { rows: number[]; programs: number[]; universities: number[] };
  lists: SavedList[];
}

export const defaultLists = (): AppLists => ({
  favorites: { rows: [], programs: [], universities: [] },
  lists: [],
});

// ── LocalStorage helpers ────────────────────────────────────────

const LS_KEY_LISTS = "naec_lists";
const LS_KEY_PREFS = "naec_prefs";

export function loadLists(): AppLists {
  try {
    const raw = localStorage.getItem(LS_KEY_LISTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultLists();
}

export function saveLists(lists: AppLists) {
  localStorage.setItem(LS_KEY_LISTS, JSON.stringify(lists));
}

export interface Prefs {
  visibleColumns: string[];
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(LS_KEY_PREFS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { visibleColumns: COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key) };
}

export function savePrefs(p: Prefs) {
  localStorage.setItem(LS_KEY_PREFS, JSON.stringify(p));
}

// ── URL Sharing ─────────────────────────────────────────────────

export interface SharedState {
  d: string; // dataset year
  f?: Partial<{
    u: number[];
    pr: number[];
    l: number[];
    s: number[];
    g: number[];
    t: number[];
    q: string;
  }>;
  r?: number[];  // shared exam IDs (საგამოცდო)
  p?: number[];  // shared program codes
  u?: number[];  // shared university codes
  n?: string;    // list name
}

export function encodeShareUrl(state: SharedState): string {
  const json = JSON.stringify(state);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${window.location.origin}${window.location.pathname}#s=${compressed}`;
}

export function decodeShareUrl(): SharedState | null {
  const hash = window.location.hash;
  if (!hash.startsWith("#s=")) return null;
  try {
    const compressed = hash.slice(3);
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ── Data processing ─────────────────────────────────────────────

export function processDataset(ds: Dataset): Row[] {
  return ds.data.map((raw, idx) => {
    const progCode = raw[Col.ProgCode]!;
    const progInfo = ds.programs[progCode];
    const uniCode = progInfo[0];
    const langIdx = raw[Col.LangIdx];
    const sub1Idx = raw[Col.Sub1Idx];
    const sub2Idx = raw[Col.Sub2Idx];

    return {
      idx,
      progCode,
      examId: raw[Col.ExamId]!,
      uniCode,
      uniName: ds.unis[uniCode],
      progName: ds.programNames[progInfo[1]],
      geoRaw: raw[Col.GeoRaw],
      geoScaled: raw[Col.GeoScaled],
      langName: langIdx != null ? ds.languages[langIdx] : null,
      langRaw: raw[Col.LangRaw],
      langScaled: raw[Col.LangScaled],
      sub1Name: sub1Idx != null ? ds.subjects[sub1Idx] : null,
      sub1Raw: raw[Col.Sub1Raw],
      sub1Scaled: raw[Col.Sub1Scaled],
      sub2Name: sub2Idx != null ? ds.subjects[sub2Idx] : null,
      sub2Raw: raw[Col.Sub2Raw],
      sub2Scaled: raw[Col.Sub2Scaled],
      compScore: raw[Col.CompScore],
      grant: raw[Col.Grant],
      choice: raw[Col.Choice]!,
      type: raw[Col.Type] === 0 ? "აკად" : "მოსამზ",
    };
  });
}

export function applyFilters(rows: Row[], filters: Filters): Row[] {
  return rows.filter((r) => {
    if (filters.universities.length && !filters.universities.includes(r.uniCode)) return false;
    if (filters.languages.length) {
      const langIdx = filters.languages;
      // We store language indices in filters, need to compare by index
      // But Row has langName, so we need a reverse lookup — handle in caller
      // Actually, let's just check the name directly using the dataset
      // For simplicity, we'll pass resolved names in the filter
      if (r.langName === null && langIdx.length > 0) return false;
    }
    if (filters.subjects.length) {
      if (r.sub1Name === null && filters.subjects.length > 0) return false;
    }
    if (filters.grants.length && !filters.grants.includes(r.grant ?? -1)) return false;
    if (filters.types.length) {
      const typeVal = r.type === "აკად" ? 0 : 1;
      if (!filters.types.includes(typeVal)) return false;
    }
    if (filters.programSearch) {
      const q = filters.programSearch.toLowerCase();
      if (!r.progName.toLowerCase().includes(q) && !r.uniName.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export function applySort(rows: Row[], sort: SortState | null): Row[] {
  if (!sort) return rows;
  const sorted = [...rows];
  const { key, dir } = sort;
  sorted.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    let cmp: number;
    if (typeof av === "number" && typeof bv === "number") {
      cmp = av - bv;
    } else {
      cmp = String(av).localeCompare(String(bv), "ka");
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

// ── Color helpers ───────────────────────────────────────────────

export function grantClass(grant: number | null): string {
  if (grant === 100) return "grant-100";
  if (grant === 70) return "grant-70";
  if (grant === 50) return "grant-50";
  return "";
}

export function scoreColor(score: number | null, min: number, max: number): string {
  if (score == null || min === max) return "";
  const t = (score - min) / (max - min); // 0..1
  // HSL: 0 = red, 60 = yellow, 120 = green
  const h = Math.round(t * 120);
  const s = 45;
  const l = 90 - t * 15; // lighter for low, richer for high
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function choiceColor(choice: number): string {
  if (choice === 1) return "bg-emerald-50 text-emerald-700";
  if (choice <= 3) return "bg-yellow-50 text-yellow-700";
  if (choice <= 5) return "bg-orange-50 text-orange-700";
  return "bg-red-50 text-red-700";
}

// ── Unique ID generator ─────────────────────────────────────────

let _idCounter = 0;
export function genId(): string {
  return `list_${Date.now()}_${++_idCounter}`;
}
