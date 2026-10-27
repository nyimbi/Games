# Roadmap

Five phases. Each has a **gate**: a predicate that must hold before the next phase starts. Every gate is testable by something in `04-probes.md` or by a check named here. No phase depends on a phase after it.

The ordering principle is not "highest value first". It is: **fix what makes the record wrong, then make the record readable, then build on it.** A feature built on D-2's queue silently does nothing; a feature built on D-1's completion signal credits work that was not done.

---

## The critical path

```
F-47  one deck module
  └─ F-48  keyOf required, not defaulted
       └─ F-1  spaced repetition replaces `due`
            └─ F-2  queue: level-correct, then capped
                 └─ F-13  stuck detector → the lesson that covers it
                      └─ F-37  lessons addressable from any page
                           └─ F-39  one explain surface
```

Seven nodes. F-13 is the feature `README.md:783-788` asks for by name. Everything to its left is what makes it possible; everything to its right is what makes it reusable.

**Why this order and not another.** F-13 needs to know *what* the child keeps missing. That is `review`, which is currently wrong in three of five drills (D-2) and unbounded in all five (D-3). Fixing the queue on top of the `due` boolean would build a correct mechanism on a one-bit signal (D-8). So the schedule comes before the queue, and both come after the module that makes them one implementation instead of five.

---

## Phase 0 — Integrity

**Nothing new. Make what exists tell the truth.**

| Item | Kind | Files |
|---|---|---|
| D-1 timed-out typing credits the day | defect | `typing-tutor.html:531` |
| D-3 `review` unbounded | defect | 5 drills |
| D-8 review retired after one success | defect | 6 sites |
| D-11 marker set before persist | defect | 3 drills |
| F-50 page manifest assertion | feature | `session.js` |
| F-41 local error ring | feature | new `errors.js` |

**Phase 0 is complete.** F-41 landed as `errors.js` — memory-first ring, surfaced on `session.html`, with twelve storage catches reporting and the parse and audio catches deliberately still silent. D-11 was refuted rather than fixed.

**Why D-1 first.** It is the only defect that corrupts the record. Every other item in this document assumes the record means something; while a timed-out run credits a subject, it does not.

**Why F-50 here.** `session.js:203` reads `BY_GAME[FILE]` and `:296` returns early when it is falsy. A game missing from `SUBJECTS` silently never marks its day. `checkOrder()` (`session.js:70-81`) already proves the load-time-assertion pattern; this is the same pattern applied to the other half of the same list.

**F-50 as landed — the check has three clauses, not one.** Two-way set comparison (a page with no subject; a subject naming a page that does not exist) plus an explicit claim count. The third exists because the first two cannot see a duplicate: adding `physics` to the piano subject leaves every key in `BY_GAME` and every key a page, so both scans pass while one game answers to the wrong subject. The canary found this — the check was written without the clause, the duplicate canary returned `[]`, and the comment that claimed the forward scan caught it was wrong. A key-count comparison would also have caught it, but only by accident, and an accidental catch is one refactor from gone.

**Gate 0.**

1. `python3 -I probes/grading.py` passes (unchanged).
2. A new probe: a typing lesson run to timeout with fewer than all characters typed leaves `ArcadeSession.isFinished()` false and `arcade.session.v1` unchanged. **Canary it** by reverting `typing-tutor.html:531` to unconditional and watching it fail.
3. `review` size after 500 answers is ≤ `REVIEW_CAP`, and the evicted entries are the ones with the lowest `miss`.
4. A page not in `SUBJECTS` throws at load rather than returning `undefined`. `probes/manifest.py` carries four canaries — a page with no subject, a subject naming a missing page, two subjects claiming one game, and the maths subject under another id — each of which must throw a *distinct* message. The fourth was first written by adding `physics` to `MATHS`, which also duplicates a claim and tripped the wrong check; a canary whose mutation is not disjoint from what it tests proves nothing about its own predicate.

---

## Phase 1 — One deck, one identity

**The refactor that makes the next four phases cheap.**

| Item | Files |
|---|---|
| F-47 one deck module | `lang-engine.js`, `maths-engine.js`, `science-engine.js`, `spelling-bee.html`, `piano-engine.js` |
| F-48 `keyOf` required | same |
| F-2 queue level-correct then capped | 5 drills |
| D-9 one identity function per fact | 3 drills |
| F-49 `esc` / `escAttr` | 11 sites |
| D-7 delete the leftovers | `addition-quest.html:413` |

**Risk, stated plainly.** This is the only phase that can break five working drills at once. The mitigation is that the probes already exist: `grading.py` plays one question per drill, `freshness.py` seeds the deck per drill, `lessons.py` opens every lesson, `shell.py` loads all 18 pages. Run all four after each file, not at the end.

**The specific trap.** `freshness.py:14-17` documents that it covers pass zero only. A deck module that changes `newCycle` can pass every probe and still be wrong. Phase 1's gate must include a pass-two probe (see `04-probes.md`, P5).

**Gate 1.**

1. All four existing probes pass.
2. The pass-two probe (P5) passes: serve a full deck, assert the next cycle's first fact is the least recently served.
3. `grep -c "function freshFirst" *.js *.html` returns 1 — `deck.js` and nothing else.
4. No page defines its own `esc`. *(As first written this said `grep -n "esc = " *.html` returns nothing, which can never pass: every page has to bind `esc` to something. The assertion that means what was intended is `probes/escape.py`'s source scan, which rejects a local definition and accepts a binding to the shared module.)*
5. The division A/B test (`04-probes.md` P3) passes: with two out-of-level due facts seeded, the in-level due fact is still served first.

**Phase 1 as landed.**

- **F-47 / F-48 — `deck.js`.** One implementation; `keyOf` required. Removing the default immediately caught two callers relying on it: subtraction and times-table passed none and were right only by coincidence. `markSeen` also evicts down to the cap now, not one per call — the probe seeds 905 into a 900 cap and all five originals stayed at 905 forever.
- **The preserved disagreement.** `freshFirst` shuffles the stale half before sorting (stable sort would otherwise keep insertion order); `newCycle` does not (least-recently-served is the point). Collapsing them would have been tidy and wrong. `probes/deck.py`'s tie test measures the shuffle over 200 draws, because a single run cannot tell a shuffle from a stable sort — the first version of that probe passed the shuffle canary.
- **F-49 — `escape.js`.** Two functions, because a text node and a quoted attribute are different contexts. The probe drives the difference through the DOM and shows the union collapsing `data-opt` to `""` with an injected `onmouseover`.
- **D-9 — refuted.** `seen` keys the fact and `review` keys the question; the bucket carries the context for the first and the flat map pays for it in the second. Measured off a live run: `seen['ten']` holds `10|5`, `review` holds `10|5|whole`. Unifying them would retire the whole-blank review on a part-blank miss and stop the drill ever scheduling the harder form.
- **`tone` remains eight copies** and is not in this phase. It is not a correctness surface — a wrong tone is a wrong sound, not a wrong record — and consolidating it would add a seventh file to a commit whose risk is already concentrated in the deck.

---

## Phase 2 — The record becomes readable

| Item | Depends on |
|---|---|
| F-1 spaced repetition | F-48 |
| F-10 schema version check | — |
| F-42 empty vs corrupt | F-10, F-41 |
| F-4 latency signal | F-1 |
| F-5 mastery estimate | F-1, F-4 |
| F-7 per-game history | — |
| F-9 export/import | F-2 |

**The design constraint that binds this phase.** `README.md:778-779` forbids "streaks that punish absence". Every item here reports; none gates. F-5's mastery estimate must decay (the arena's day-decay at `infinite-arena.html:411-416` is the model) rather than accumulate a best-ever, because a best-ever is a score and a score is the thing the design excludes from the machine shelf.

**Gate 2.**

1. F-9's export round-trips: export, clear `localStorage`, import, and every probe still passes.
2. A record written by the previous schema loads without throwing and is reported as migrated, not silently defaulted.
3. The hub's stars change when a child's accuracy drops — i.e. the estimate decays. **Canary:** seed a high `perLevel`, set `savedAt` 14 days back, assert the reported mastery is lower.

**Status: complete.** Gate 2 closed 2026-10-27; all twenty probes pass.

| Item | Landed | Probe |
|---|---|---|
| F-1 spaced repetition | `deck.js:123-206` — `LADDER`, `nextAt`, `noteAttempt`, `isDue`, `dueCount`, `reviewFirst` | `schedule.py` |
| F-10 schema version check | `record.js` — four states, `require`, `version: 0`, `stash: false` | `record.py` |
| F-42 empty vs corrupt | `record.js:notice` — bounded stash (`CORRUPT_CAP = 8`), banner on the page | `record.py` |
| F-4 latency signal | `deck.js:186-194` — `ms`, `spd`, `base`; `SPEED_FLOOR` drops sub-perceptual samples | `schedule.py` |
| F-5 mastery estimate | `deck.js:241-273` — `decayed`, `mastery`; whole days, cap at 7 | `mastery.py` |
| F-7 per-game history | `session.js:mark` / `resultPct`; `acc` is `null` for an unscored day | `history.py` |
| F-9 export/import | `backup.js` — `dump`/`parse`/`restore`/`download`, wired on `session.html` | `export.py` |

Three things Phase 2 changed that the plan did not anticipate:

- **A miss schedules the fact for now, not for the first rung.** The first implementation climbed the ladder on any attempt, which made the home screen read "0 due for review" the moment a child missed something. The asymmetry is the schedule.
- **The hub reads with `version: 0, stash: false`.** A read-only observer cannot enforce a schema version it has no way to know across seventeen games, and must not churn the corrupt stash it is only looking at.
- **The export stores raw strings, never re-serialised objects.** Restoring through `JSON.parse`/`JSON.stringify` passes every round trip whose input was already canonical, and silently reformats a record another build wrote. `export.py` claim 7 is the gate.

---

## Phase 3 — The learner model

| Item | Depends on |
|---|---|
| F-11 skill graph | F-5 |
| F-17 fact families | F-1 |
| F-12 prerequisite ordering (advisory) | F-11 |
| F-6 starting level from the record | F-5 |
| F-13 stuck detector → lesson | F-1, F-2 |
| F-14 example from the child's mistake | F-13 |
| F-18 knows-it vs can-do-it | F-4 |

**Landed so far.**

| Item | Landed | Probe |
|---|---|---|
| F-13 stuck detector | `maths-engine.js:530-575` — `STUCK_MISSES`, `TOPIC_OF`, `stuckTopic`; `offer` sets the label and the default topic | `stuck.py` |
| F-17 fact families | `deck.js:349-389` — `familyOf`, `familyKey`, `familySiblings`; `maths-engine.js:583-624` — `crossDue`, `crossKeys` | `family.py`, `cross.py` |

Three things F-17 changed that the plan did not anticipate:

- **`familyKey` must recover the family, not name the operands.** The first version returned `add:8,15` for `familyKey('sub', 15, 8)` — the minuend and subtrahend. No addition drill ever writes that pair, so the merge would have silently never fired and read exactly like working. The subtraction family is `(a − b, b)`; division is `(a ÷ b, b)`.
- **The merge reads, never writes.** `crossDue` takes `{ version: 0, stash: false }` on the other store, like the hub. A cross-drill write would make two pages the owners of one record, and the first one cleared would overwrite the other's miss. `cross.py` hooks `Storage.prototype.setItem` to assert zero writes: byte equality cannot see a write that re-serialises to the same text.
- **`ownFamily` is supplied by the page, because the review key is not a family key.** A review key is `level|a|b` or `a|b`; a family key is `add:7,8`. An `own[key]` lookup inside `crossDue` was a check that could never fire — dead code wearing a guard's clothes. It was removed rather than left to read as protection.

**F-20 is deliberately deferred.** A plan that is a subset of eleven subjects touches `checkOrder()`'s invariant (`session.js:70-81`), which is the one place the codebase throws rather than degrades. Changing the membership while preserving "opens on a language, no two languages adjacent" is possible but needs its own argument. It is not in this phase.

**Gate 3.**

1. F-13 fires at most once per topic per session, and only after ≥3 misses of facts mapped to that topic.
2. F-14's generated example contains no number the drill asks. This is F-44's content gate — build it here, because this is the first feature that generates lesson text.
3. `checkOrder()` still passes; no phase-3 change touches `SUBJECTS`' order.

---

## Phase 4 — Content generation

| Item | Depends on |
|---|---|
| F-23 stroke-order practice | — |
| F-24 shape vs order scoring | F-23 |
| F-26 ear trainer | — |
| F-25 generated pieces | — |
| F-15 typing weak-key drill | — |
| F-28 Kiswahili agreement | — |
| F-29 Mandarin tone pairs | — |
| F-27 French conjugation | F-11 |
| F-21 word problems | F-17 |
| F-36 printed worksheet | — |

**Why these can run in parallel.** Each touches one page and one bank. None shares a data structure with another. This is the phase to parallelise if more than one person is working.

**Gate 4.**

1. F-44's content gate passes for every generated item type: no generated question has an answer present in the corresponding lesson.
2. Every new page passes `shell.py`'s no-duplicate-id and no-`pageerror` checks.
3. Offline sweep: all pages load from `file://` with no network request.

---

## Phase 5 — Cross-subject and platform

| Item | Depends on |
|---|---|
| F-37 lessons addressable | F-13 |
| F-39 one explain surface | F-37 |
| F-31 child's own word list | F-44, F-42, F-49 |
| F-32 maths inside science questions | F-17 |
| F-33 fact-family view | F-17 |
| F-34 machine shelf second sitting | — |
| F-35 one "today" surface | F-5 |
| F-38 plan suggests a lesson | F-7, F-37 |
| F-43 browser self-test | F-42 |
| F-45 storage budget | F-41, F-2 |
| F-46 seeded replay | F-41 |
| F-40 keyboard-first | — |
| F-22 rule-based spelling pairs | F-44 |

**F-31 is last on purpose.** It is the only feature that puts user-authored text into markup, and it is the one that turns D-4 from latent to live. It ships only after F-49 and F-44.

**F-34 carries a constraint, not a dependency.** `README.md:789-791` and `llms.txt:116-121` both state it: the shelf must stay derived from the figures, never described by the wrapper. And `llms.txt:118-120` documents that a `file://` frame cannot be read across in Chromium or WebKit, so "derived" has a hard technical ceiling. Any proposal that crosses it is a proposal to inline the figures, which `llms.txt:117` forbids because each figure sets `document.body.innerHTML` at mount.

**Gate 5.**

1. F-31's word list survives an XSS canary: a word containing `"` and `<` renders as text in every drill that shows it.
2. F-43's self-test page passes in a browser with no Python installed.
3. Offline sweep after every phase-5 item.

---

## What would break the offline guarantee, and is therefore not proposed

Stated so the absence is visible.

| Not proposed | Why |
|---|---|
| Accounts, sync, multi-device | Requires a server. `README.md:778` excludes it. |
| Leaderboards | Requires a server and makes a child's progress a comparison. `README.md:778`. |
| Server-side telemetry | Requires a network call. F-41 records locally instead. |
| A CDN-hosted library | `llms.txt:11-19`: any asset must be inline or a sibling file. |
| A build step or bundler | The product is 36 files read directly from disk. |
| A service worker | Needs an HTTP origin; `file://` pages cannot register one. The offline guarantee is achieved by having nothing to cache, which is stronger. |
| Fonts from Google | `llms.txt:11-19`. `ui-rounded` first, system stack, no download. |

**One thing that looks excluded and is not.** F-9's export writes a file to the child's disk. That is not a network call and does not break the guarantee. It is the only way the record survives a device change, and it is listed as a feature rather than a compromise.

---

## Effort, stated as risk rather than hours

Hours are guesses and would be read as measurements. What is not a guess:

| Phase | Files touched | Probes that must pass | Risk |
|---|---|---|---|
| 0 | 8 | 5 | Low. Every change is local and the gate is a canary. |
| 1 | 8 | 5 | **High.** Five working drills, one refactor, and the existing freshness probe does not cover pass two. |
| 2 | 6 | 6 | Medium. Schema migration is the risk; F-9's round-trip gate is the mitigation. |
| 3 | 4 | 6 | Medium. First generated content; F-44 must exist first. |
| 4 | 10 | 6 | Low per item, high in aggregate. Parallelisable. |
| 5 | 8 | 7 | Medium. F-31 is the only security-relevant item. |

**Phase 1 is the only phase where a mistake is silent.** Everywhere else the gate catches it, because the thing being built is observable. Phase 1 changes machinery whose output looks identical whether it works or not — which is exactly the shape of the division `keyOf` regression that motivated it. The pass-two probe is not optional.

---

## The first three commits

If work stops after three commits, these are the three.

1. **`typing-tutor.html:531` — do not show the completion marker on a timeout.** One branch. It stops the record crediting work that was not done. Canary: revert, watch `isFinished()` return true.
2. **`session.js` — assert the page manifest.** A load-time check that every `.html` game page is in `SUBJECTS`, matching `checkOrder()`'s pattern. It turns a silent no-op into a throw.
3. **The five `buildQueue` sites — filter before slice; cap `review`.** Fixes D-2 and D-3 together, because fixing one without the other trades a silent no-op for a growing object.

Each is under twenty lines. Together they make the record correct, which is the precondition for all fifty features.
