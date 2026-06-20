# ეროვნული გამოცდები — ტესტები &amp; შედეგები

A single static React app (no backend) with two tabs:

- **ტესტები** — Unified National Exam **math** practice (2020–2025): 14 tests / 531
  questions, two modes (instant feedback or answers-at-end), KaTeX-rendered math,
  figures, per-question explanations (why each option is right/wrong + the common
  mistake), a custom **შემთხვევითი** (random) test builder, and links to the
  official **NAEC** test &amp; answer-scheme PDFs.
- **შედეგები** — NAEC university-admission **results explorer** (virtualized table,
  filters, favorites, shareable views).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/  (static; deploy anywhere, SPA rewrite in vercel.json)
npm run preview
```

## Structure

```
src/
  main.jsx            entry (BrowserRouter)
  AppShell.jsx        shared top nav + tab routing (/tests, /results)
  tests/              math practice sub-app (components, lib, pages, styles.css)
  results/            results explorer sub-app (ResultsApp + Table/ListPanel/…)
public/
  data/               index.json, subjects.json, bank.json, tests/*.json, 2025.json
  media/              question figures
tools/                data pipeline (Python): build_data.py, validate_gen.py, …
data/                 pipeline inputs: gen/ (explanations), naec_pdfs.json,
                      answer_overrides.json  (verified answer-key corrections)
```

## Data

Exam questions and answers are processed into `public/data/` and rendered fully
client-side. Each test links to the **official NAEC (naec.ge)** test and
assessment-scheme PDFs. A few answer keys that were wrong at the source are
corrected in `data/answer_overrides.json` (each independently re-solved) and shown
with a note; questions whose source text is OCR-damaged carry a caution flag.

To regenerate `public/data/` from the pipeline inputs:

```bash
python3 tools/build_data.py
```
