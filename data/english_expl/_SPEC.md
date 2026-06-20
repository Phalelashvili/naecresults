# English MCQ explanations — authoring spec (Georgian-language)

You author **Georgian-language explanations** for every multiple-choice question in **one** English exam test, and write them to `data/english_expl/<slug>.json`. These render under each question (component `Explanation.jsx`) exactly like the math/Georgian explanations.

## Input
Read `public/data/tests/<slug>.json` (already built — has passages, questions, correct answers). Enumerate the questions you must explain with **exactly** this rule (do it in Python to avoid mistakes):

```python
import json
d = json.load(open('public/data/tests/<slug>.json'))
qs = [b for b in d['blocks'] if b.get('kind') == 'question' and b.get('type') != 'essay']
# qs[0] -> key "q1", qs[1] -> "q2", ... qs[i] -> f"q{i+1}"
```

The trailing `type:"essay"` writing task is **excluded** (no explanation). The keys `q1..qN` you produce must line up 1:1 with this `qs` list — the build merges by this exact position.

Each question block has: `stem_html`, `options` (list of `{letter, text, html}` — letters are Latin **A,B,C,D…**), `correct` (the correct letter), `listening` (true only for Task 1), `gap` (true for gap-fill items). The **reading passages, conversations, and word/sentence banks** are in the `content` (`kind:"content"`, has `html`) and `wordbank` (`kind:"wordbank"`, has `words`) blocks that **precede** each question group — grouped under `<h2>`/`<h3>` task headings ("Task 4…", a passage title, etc.). Read them to ground your explanation in the actual text.

## Output
Write `data/english_expl/<slug>.json` — a single JSON object:

```json
{
  "q1": { "explanation": { "summary": "…", "options": { "A": "…", "B": "…", "C": "…", "D": "…" }, "mistake": "…" } },
  "q2": { "explanation": { "summary": "…", "options": { … } } }
}
```

Per question, `explanation` has:
- **`summary`** (required): 1–2 sentences **in Georgian** explaining why the correct option is right, **grounded in the passage** — quote the decisive English phrase from the text in `"…"`. HTML allowed (`<b>`, `<i>`).
- **`options`** (required for reading/gap; map **every** option letter): one short Georgian clause per letter — for the correct letter say why it fits; for each wrong letter say why it doesn't (contradicts the text / wrong grammar / not mentioned).
- **`mistake`** (optional): one Georgian sentence naming the common trap.

## Rules by task type
- **Reading comprehension (Tasks 2, 3, 5 reading)**: ground every claim in the passage; quote the supporting sentence. Per-option analysis required.
- **Gap-fill word bank (Task 4) & grammar cloze**: explain why the word fits the gap — both **meaning** and **grammar** (part of speech, collocation, tense). Reference the gap number and surrounding words.
- **Conversation gaps (Task 6)**: explain why that line fits the dialogue flow (what was just said / what follows).
- **Listening (Task 1, `listening:true`)**: there is **NO transcript available** — do **NOT** invent quotes from the recording. Write a brief, honest Georgian `summary` explaining the correct option's meaning and why it is the plausible answer to the question; give a light per-option `options` analysis based on meaning. Never fabricate exact recording wording. Omit `mistake`.

## Language quality
Native, fluent Georgian (the audience is Georgian high-schoolers). Prefer native Georgian terms over loanwords. Use English **only** to quote words/phrases from the test text. Grammar terms in Georgian: noun = არსებითი სახელი, verb = ზმნა, adjective = ზედსართავი, preposition = წინდებული, tense = დრო, article = artikli/არტიკლი.

## Verify before finishing
1. Valid JSON, UTF-8. `json.load` succeeds.
2. `len(keys) == len(qs)` (the Python list above), and keys are exactly `q1..qN` (no gaps).
3. Every `options` map only uses letters that exist on that question, and includes the `correct` letter with an affirmatively-correct explanation.
4. No English prose sentences (only quoted text snippets are English).

Your final message: report the slug, how many explanations you wrote, how many were listening (limited) vs grounded, and any question you couldn't ground.
