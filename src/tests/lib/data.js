// Static data access. Everything is fetched from public/data/*.json — no API.
import { asset } from './format.js'

const cache = new Map()

async function getJSON(path) {
  if (cache.has(path)) return cache.get(path)
  const p = fetch(asset(path)).then((r) => {
    if (!r.ok) throw new Error(`ვერ ჩაიტვირთა: ${path} (${r.status})`)
    return r.json()
  })
  cache.set(path, p)
  return p
}

export function loadIndex() {
  return getJSON('data/index.json')
}

export function loadSubjects() {
  return getJSON('data/subjects.json')
}

export function loadTest(slug) {
  return getJSON(`data/tests/${slug}.json`)
}

export function loadBank() {
  return getJSON('data/bank.json')
}

// Theory tab (math): a tree index + one file of full content per section.
export function loadTheoryIndex() {
  return getJSON('data/theory/index.json')
}

export function loadTheorySection(id) {
  return getJSON(`data/theory/${id}.json`)
}

// { topicId: [compact NAEC question] } — related questions per theory topic.
export function loadTheoryRelated() {
  return getJSON('data/theory/related.json')
}
