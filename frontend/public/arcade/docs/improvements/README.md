# The arcade: functional expansion and architectural audit

Three documents. Read them in this order.

| File | What it is |
|---|---|
| `01-defects.md` | Everything wrong, ranked by consequence. Every claim cites a file and line. |
| `02-features.md` | Fifty capabilities the arcade does not have, each with the primitive it deepens and the defect it closes. |
| `03-roadmap.md` | Dependency graph, five phases, critical path, and the gates each phase must pass. |

## What was measured, and what was read

Claims in these documents are one of three kinds, and each says which:

- **Measured** — a Playwright probe ran against the real page and the output is quoted. The probes are in `/tmp/audit_probe.py` and `/tmp/div_review.py`; both are reproduced in `04-probes.md` because `/tmp` is not durable.
- **Read** — a line of source states it, and the line number is given. Where a read contradicts another read, both are cited.
- **Argued** — a design judgement. Says so.

No claim here was inferred from a filename, a docstring, or a previous document. Two claims that earlier documents in this repo assert turned out to be false when tested, and both are recorded in `01-defects.md` under D-1 and D-2 with the probe output that refutes them.

## The platform's own thesis, stated so the audit can be judged against it

`README.md:777-779`:

> **What is deliberately absent** — do not add these without a design argument that overturns the
> existing one: accounts and sync; leaderboards; streaks that punish absence; time pressure in the
> drills (the typing tutor's optional clock is the only one); a score on the machine shelf.

`02-features.md` respects this. Where a feature touches an excluded category it names the category and either (a) shows how the feature stays inside the existing argument, or (b) states the argument it would need to overturn and does not assume it. Features that cannot be justified this way were not proposed. There are fifty entries; none is "add accounts".

## Scale, as counted

| | |
|---|---|
| Pages | 18 (`ls *.html \| wc -l`) |
| JavaScript | 16,309 lines across 36 files |
| Content banks | 8 files, 1.42 MB, largest `calligraphy-bank.js` at 562 KB |
| Figures | 26 MIT-licensed, `figures/` |
| Probes | 4 committed (`probes/`), 370 lines |
| Build step | none |
| Dependencies | none |
| Network calls at runtime | none |

The absence of a build step, a package manager, a test runner and a network is not an oversight to be fixed. It is the product: the arcade opens from `file://` on a machine with no internet, and every capability below is constrained to preserve that. `03-roadmap.md` names, per phase, what would break it.

## The three structural facts everything else follows from

1. **Six copies of the deck.** `freshFirst` exists six times (`lang-engine.js:30`, `maths-engine.js:45`, `science-engine.js:39`, `calligraphy.html:321`, `piano-engine.js:441`, `spelling-bee.html:459`), `markSeen` five times, `tone` eight times. The maths engine was the first consolidation; it moved four of the five maths drills' copies and left the other eleven alone. Every divergence between copies is a defect that has already happened or will.
2. **The record is write-only.** Each game writes a percentage into a bucket. Nothing reads it back to change what the child is asked, except the arena's EMA and the `due` flag. `README.md:783-788` already names this as the next unit of work; the audit confirms it and finds the mechanism that makes it cheap.
3. **Completion is a CSS class.** `session.js:203-213` reads a marker the page declares. That is the right design — the page owns its own completion — but the marker is set in places where the deck did not actually complete, and one of them is measured below.

## Headline findings

Five, in descending order of what they cost a child.

**A timed-out typing lesson counts as a completed subject for the day.** `typing-tutor.html:531` sets `#done.show` outside any `if (completed)` check; `session.js:203-213` reads exactly that class as finished. Measured: with a 30-second clock and one keystroke, `ArcadeSession.isFinished()` returns `true` and the day's typing subject is credited. A child who starts typing, types one letter and walks away gets credit. This is the only finding here that corrupts the record rather than wasting effort.

**Three of the five maths drills can never serve a review fact from the level you are playing.** `division-diner.html:517-520`, `number-bonds.html:566-571`, `times-table-academy.html:800-803` all filter `due`, `slice(0, 2)`, then filter by level. Addition (`addition-quest.html:652-656`) and subtraction (`subtraction-safari.html:696-700`) filter by level first. Measured on division: one in-level due fact is served first when it is the only one, and is not served at all when two out-of-level due facts exist. The deck is still 50 long, so nothing looks wrong.

**The review map has no cap and grows without bound.** `SEEN_CAP` bounds `seen` in every engine. Nothing bounds `review`, in any game (`grep "delete state.review" → no match`). Its key space is the level × fact space: subtraction level 3 alone generates 260 facts per queue (`subtraction-safari.html:714-718`), each keyed `level|a|b` (`:689`), and `state.review[k]` is written on every answer (`:692-694`) and persisted on every question (`:685`). Over months this is the object that eventually makes `localStorage.setItem` throw — the exact failure `session.js:105-112` guards against for the session record and no game guards against for review.

**`esc()` is not one function.** Eleven definitions across three semantics. Eight escape `& < > "` and not `'` — the four engines (`maths-engine.js:26`, `lang-engine.js:21`, `science-engine.js:24`, `piano-engine.js:29`), `calligraphy.html:246`, and the aliases. `spelling-bee.html:487` escapes all five. `addition-quest.html:413` escapes only `& < >` and is the narrowest copy in the codebase — it is also the one page that keeps a local `esc` after the maths consolidation, so it is the copy most likely to drift further. Nothing currently interpolates user input into `innerHTML` — checked, `grep -n "innerHTML = .*\.value"` finds no match — so this is latent, not live. It is listed because the moment a feature that takes typed input into markup lands (F-31), it becomes live on whichever page holds the narrowest copy.

**`aria-modal="true"` with no focus trap.** `maths-engine.js:262-263` declares the dialog modal and `:279` focuses the close button. Measured: six Tabs from there leave the dialog (`BUTTON, BUTTON, BUTTON, BUTTON, BODY, back`). A keyboard user tabs into the page behind a dialog that claims to be modal. The science engine's lesson view has the same shape.

## What is genuinely good, stated because a list of defects is not an audit

- **The offline guarantee is real and mechanically enforced.** Zero `fetch`, zero `XMLHttpRequest`, zero CDN links, no third-party library, audio synthesised from oscillators (`maths-engine.js:83-110`), figures copied whole rather than linked.
- **The deck mechanism is correct where it is consolidated.** `freshFirst` (`maths-engine.js:45-53`) puts unseen first, orders the stale by age, and shuffles both halves so ordering within a half is not fixed. `newCycle` (`:71-75`) exists so a deck larger than its pool terminates.
- **The freshness stamp fires at render, not at build** (`addition-quest.html:709`). A fact the child saw but did not answer is not re-served as if unseen. This is subtle and right.
- **`session.js`'s completion detection reads a marker the page declares** rather than guessing (`session.js:203-213`), with a comment explaining the failure it prevents. The bug in D-1 is not this design; it is a page setting its marker in the wrong branch.
- **The lesson content is authored, not generated from the bank.** `llms.txt:92` states the rule — a lesson must not hand over a bank answer — and every worked example in `maths-lessons.js` uses numbers the drills do not ask.
