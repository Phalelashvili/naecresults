import { useState } from "react";
import { AppLists, SavedList, genId, encodeShareUrl, SharedState } from "./types";

interface Props {
  lists: AppLists;
  onUpdate: (lists: AppLists) => void;
  activeView: string; // "all" | "favorites" | list id
  onViewChange: (view: string) => void;
  datasetYear: string;
  currentFilters: SharedState["f"];
  onClose: () => void;
  programNames: Map<number, string>; // progCode -> name
  uniNames: Map<number, string>; // progCode -> uni name
  uniNamesById: Map<number, string>; // uniCode -> name
}

export default function ListPanel({
  lists, onUpdate, activeView, onViewChange,
  datasetYear, currentFilters, onClose,
  programNames, uniNames, uniNamesById,
}: Props) {
  const [newListName, setNewListName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const createList = () => {
    if (!newListName.trim()) return;
    const newList: SavedList = {
      id: genId(),
      name: newListName.trim(),
      rows: [],
      programs: [],
      universities: [],
    };
    onUpdate({ ...lists, lists: [...lists.lists, newList] });
    setNewListName("");
  };

  const deleteList = (id: string) => {
    onUpdate({ ...lists, lists: lists.lists.filter((l) => l.id !== id) });
    if (activeView === id) onViewChange("all");
  };

  const renameList = (id: string) => {
    if (!editName.trim()) return;
    onUpdate({
      ...lists,
      lists: lists.lists.map((l) => (l.id === id ? { ...l, name: editName.trim() } : l)),
    });
    setEditingId(null);
  };

  const share = (rows: number[], programs: number[], universities: number[], name: string) => {
    const state: SharedState = { d: datasetYear };
    if (currentFilters && Object.keys(currentFilters).length > 0) state.f = currentFilters;
    if (rows.length > 0) state.r = rows;
    if (programs.length > 0) state.p = programs;
    if (universities.length > 0) state.u = universities;
    state.n = name;
    const url = encodeShareUrl(state);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(name);
      showToast("ბმული დაკოპირებულია!");
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  const shareFiltersOnly = () => {
    const state: SharedState = { d: datasetYear };
    if (currentFilters && Object.keys(currentFilters).length > 0) state.f = currentFilters;
    state.n = "ფილტრი";
    const url = encodeShareUrl(state);
    navigator.clipboard.writeText(url).then(() => {
      showToast("ფილტრის ბმული დაკოპირებულია!");
    });
  };

  const renderItems = (rows: number[], programs: number[], universities: number[]) => {
    if (rows.length === 0 && programs.length === 0 && universities.length === 0) {
      return <div className="text-xs text-gray-400 px-2 py-1">ცარიელია</div>;
    }
    return (
      <div className="space-y-0.5">
        {universities.map((uc) => (
          <div key={`u-${uc}`} className="flex items-center gap-1.5 px-2 py-0.5 text-xs">
            <span className="text-red-400">{"\u2665"}</span>
            <span className="truncate flex-1 font-medium" title={uniNamesById.get(uc)}>
              {uniNamesById.get(uc) ?? uc}
            </span>
          </div>
        ))}
        {programs.map((pc) => (
          <div key={`p-${pc}`} className="flex items-center gap-1.5 px-2 py-0.5 text-xs group">
            <span className="text-red-400">{"\u2665"}</span>
            <span className="truncate flex-1" title={`${uniNames.get(pc) ?? ""} — ${programNames.get(pc) ?? pc}`}>
              {programNames.get(pc) ?? pc}
            </span>
            <span className="text-gray-400 truncate max-w-[100px]" title={uniNames.get(pc)}>
              {uniNames.get(pc)?.split(" ").slice(-2).join(" ") ?? ""}
            </span>
          </div>
        ))}
        {rows.map((examId) => (
          <div key={`r-${examId}`} className="flex items-center gap-1.5 px-2 py-0.5 text-xs">
            <span className="text-red-400">{"\u2665"}</span>
            <span className="font-mono text-gray-500">{examId}</span>
          </div>
        ))}
      </div>
    );
  };

  const favCount = lists.favorites.rows.length + lists.favorites.programs.length + lists.favorites.universities.length;

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-sm">სიები</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Favorites */}
        <div className="border-b border-gray-100">
          <button
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 ${activeView === "favorites" ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}
            onClick={() => onViewChange(activeView === "favorites" ? "all" : "favorites")}
          >
            <span className="text-red-500">{"\u2665"}</span>
            ფავორიტები
            {favCount > 0 && (
              <span className="ml-auto text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">{favCount}</span>
            )}
          </button>
          {activeView === "favorites" && (
            <div className="px-2 pb-2">
              {renderItems(lists.favorites.rows, lists.favorites.programs, lists.favorites.universities)}
              {favCount > 0 && (
                <div className="flex gap-1 mt-2 px-2">
                  <button
                    className="btn btn-ghost text-xs"
                    onClick={() => share(lists.favorites.rows, lists.favorites.programs, lists.favorites.universities, "ფავორიტები")}
                  >
                    🔗 გაზიარება
                  </button>
                  <button
                    className="btn btn-ghost text-xs text-red-500"
                    onClick={() => onUpdate({ ...lists, favorites: { rows: [], programs: [], universities: [] } })}
                  >
                    გასუფთავება
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom lists */}
        {lists.lists.map((list) => (
          <div key={list.id} className="border-b border-gray-100">
            <button
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 ${activeView === list.id ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}
              onClick={() => onViewChange(activeView === list.id ? "all" : list.id)}
            >
              <span className="text-blue-400">📋</span>
              {editingId === list.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => renameList(list.id)}
                  onKeyDown={(e) => e.key === "Enter" && renameList(list.id)}
                  className="flex-1 border-b border-blue-300 bg-transparent outline-none text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-left truncate">{list.name}</span>
              )}
              <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
                {list.rows.length + list.programs.length + list.universities.length}
              </span>
            </button>
            {activeView === list.id && (
              <div className="px-2 pb-2">
                {renderItems(list.rows, list.programs, list.universities)}
                <div className="flex gap-1 mt-2 px-2 flex-wrap">
                  <button
                    className="btn btn-ghost text-xs"
                    onClick={() => share(list.rows, list.programs, list.universities, list.name)}
                  >
                    🔗 გაზიარება
                  </button>
                  <button
                    className="btn btn-ghost text-xs"
                    onClick={() => { setEditingId(list.id); setEditName(list.name); }}
                  >
                    ✏️ სახელი
                  </button>
                  <button
                    className="btn btn-ghost text-xs text-red-500"
                    onClick={() => deleteList(list.id)}
                  >
                    🗑 წაშლა
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* New list input */}
        <div className="px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createList()}
              placeholder="ახალი სია..."
              className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400"
            />
            <button className="btn btn-primary text-xs" onClick={createList}>+</button>
          </div>
        </div>

        {/* Share current filters */}
        <div className="px-4 pb-3">
          <button className="btn btn-ghost text-xs w-full justify-center" onClick={shareFiltersOnly}>
            🔗 ფილტრის გაზიარება
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
