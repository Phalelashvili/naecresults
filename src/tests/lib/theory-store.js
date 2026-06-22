// Local-only persistence for theory bookmarks + per-topic notes (localStorage).
// Nothing here is sent anywhere — it lives in the user's browser. Components
// subscribe via useSyncExternalStore so a change in one place updates all.
import { useSyncExternalStore } from 'react'

const BM_KEY = 'eg:theoryBookmarks'
const NT_KEY = 'eg:theoryNotes'

function read(key, def) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return v == null ? def : v
  } catch {
    return def
  }
}

let bookmarks = read(BM_KEY, []) // array of topic ids, newest first
let notes = read(NT_KEY, {}) // { topicId: text }

const subs = new Set()
const emit = () => subs.forEach((f) => f())
function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === BM_KEY) { bookmarks = read(BM_KEY, []); emit() }
    if (e.key === NT_KEY) { notes = read(NT_KEY, {}); emit() }
  })
}

export function toggleBookmark(id) {
  bookmarks = bookmarks.includes(id) ? bookmarks.filter((x) => x !== id) : [id, ...bookmarks]
  try { localStorage.setItem(BM_KEY, JSON.stringify(bookmarks)) } catch { /* quota */ }
  emit()
}

export function setNote(id, text) {
  notes = { ...notes }
  if (text && text.trim()) notes[id] = text
  else delete notes[id]
  try { localStorage.setItem(NT_KEY, JSON.stringify(notes)) } catch { /* quota */ }
  emit()
}

export function useBookmarks() {
  return useSyncExternalStore(subscribe, () => bookmarks, () => bookmarks)
}
export function useNotes() {
  return useSyncExternalStore(subscribe, () => notes, () => notes)
}
