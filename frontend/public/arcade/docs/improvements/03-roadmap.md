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
| F-14 example from the mistake | `maths-engine.js` — `spaceOf`, `sameFact`, `distance`, `RENDER`, `exampleFor`; `offer` carries the record into the dialog | `example.py` |
| F-11 skill graph | `skills.js` — `MATHS_SKILLS` (15), `SUBJECT_SKILLS` (12), validated acyclic at load; `order`, `ancestors`, `descendants`, `frontier`, `weakestNeed`, `edges`. The arena reads the graph for one advisory line (`#skillHint`); `DEFAULT_ON` stays hand-written. `session.js:109` `checkPrerequisites()` asserts coverage (`:128-134`) and edge order (`:136-145`) | `skills.py` |
| F-6 starting level | `maths-engine.js` — `startLevel`, `SOLID`; five drills each carry a `startAt()` and keep `savedAt` from the load so the score is the decayed one | `startlevel.py` |
| F-18 knows vs can do | `deck.js` — `knows`, `knowledge`, `referenceBase`, `FLUENT`; the session page renders a count per drill from a reference pooled across all five | `knows.py` |
| F-12 plan follows the graph | `session.js` — `checkPrerequisites()` throws at load if a subject precedes something it needs; skips cleanly when `skills.js` is absent | `prereq.py` |

**F-18's original premise was wrong, and the probe is what found it.** The plan says "deepens F-4's latency" and `deck.js:164` said `spd` was recorded precisely so F-18 could use it. `spd` cannot carry this. It is the ratio of each answer to a **moving** baseline, so it measures change, not level: a child answering forty times at a constant 1000 ms settles at `spd = 1.000`, and a `spd <= 0.75` test calls them permanently `effortful`. It says "faster than usual", and once a child's usual is fast nothing is faster than usual. The first implementation used `spd`; every stable child would have been told they were still working everything out.

The fix is to compare `base` — the fact's own exponential millisecond average — against the child's **other facts**, which is the comparison `deck.js`'s own comment always called meaningful. No absolute millisecond appears; the reference is the child's own median. `knows(entry, ref)` takes the reference explicitly.

Three things F-18 changed that the plan did not anticipate:

- **A bucket of one fact is its own median.** With a per-drill reference, a child with one answered fact in a drill has `base === ref`, and `base <= ref * 0.75` is false — every such fact reads `effortful`. The session page pools the median across all five maths drills, which is also the right question: how quick is this child at an arithmetic fact, not at this particular drill.
- **`n < 2` was an unreachable guard.** I wrote it to stop a first answer reading fluent, then measured: the first sample sets `spd` to 1 by construction, so `n === 1 && spd < 0.75` never occurs in 2,000 trials. Removed rather than kept as protection. The guard that *is* needed is "no usable `base` ⇒ `effortful`", because a record written before the timing work has no baseline.
- **The live fixture has to contain a fluent fact.** The first version seeded only slow facts, so a `ref = null` mutation — which makes everything `effortful` — passed. Canaried and fixed: the seed now has one fact below the cutoff and one above, so removing the pooled reference fails.

**F-6's claim is the decay, not the ordering.** Reading `perLevel` for "the first level under 70" is a lookup, and a lookup would send a child back to level 3 after a month away because `perLevel` stores a best-ever and a best-ever never comes down. `startLevel` runs the stored value through `ArcadeDeck.mastery` against the record's `savedAt`, so a 95% written thirty days ago reads below solid and the drill opens where the child actually is. Canaried: replacing `D.mastery(...)` with the raw value leaves the ordering claims green and fails only on the stale fixture.

Three things F-6 changed that the plan did not anticipate:

- **`division-diner` has four levels, not three.** `mixed` carries its own `perLevel` entry and its own button, and the first probe table omitted it — the gate was written from the plan's prose rather than from the page. Transcribing the level lists from the markup is now what the probe does, and the comment says so.
- **Reading the record is half the change.** Leaving the hard-coded `aria-pressed="true"` in the markup means `times-table-academy` opens on the tournament with `Mixed 1–10` still highlighted — the record obeyed and the page saying the opposite. The pressed state has to be synced to the level that started; canaried by deleting the sync, which fails the live claim alone.
- **`savedAt` was not retained.** Every drill wrote `savedAt` on save and none kept it on load, so a decayed score would have been decayed from *now* — no decay at all. All five now assign it in `load()`.

**F-11 nearly shipped as a gate.** The plan says the graph is "data, not logic", and the obvious use is to derive the arena's default skill set from the graph's frontier — replace the hand-written six with whatever has no unmet prerequisite. That is what I built first, and it produced two defaults where there had been six: `add-10` and `sub-10`, because every other skill needs one of them. A child opening the arena for the first time would have been offered two of fifteen skills. That is the punishment mechanic `README.md:778` forbids, reached by algorithm instead of by intent, and it would have read as a feature.

The distinction that saves it: **a default is a judgement about where a beginner starts; a frontier is a computation about what is *permitted*.** Those are different questions and the second is not the first's answer. So `DEFAULT_ON` stays hand-written and the graph is read for a sentence — "Try Times · 1–5 next — 30%" — which can change what a child tries first and cannot remove anything. `skills.py` asserts zero disabled toggles.

Three things F-11 changed that the plan did not anticipate:

- **The sort has to be tested on an unsorted graph.** `MATHS_SKILLS` is written in prerequisite order, so `order('maths')` agrees with `Object.keys` and a probe comparing the two passes against a function that returns the keys unchanged. Canaried: replacing `topoOrder`'s body with `return Object.keys(g)` left the arena probe green. `topoOrder` now takes a graph object so the probe can hand it a reversed one, and that canary fails as it should.
- **`frontier`'s `done` filter is the fail-open edge.** `needs.every(isDone)` is vacuously true for a root, so dropping `!isDone(id)` returns every root forever. Only the `done: () => true` predicate catches it — with `() => false` the two forms agree, and a probe testing one predicate would have shipped the bug.
- **A graph that omits a node is not a wrong graph, it is a graph about a different arcade.** Savanna Run was added to `SUBJECTS` and not to `SUBJECT_SKILLS`, and every check stayed green: `order('subjects')` returned eleven valid nodes, the acyclic walk passed, the frontier agreed with brute force, and the arena hint rendered. The load-time guard that already existed skipped edges naming subjects outside the plan, so it could not see the omission either — it guarded the direction that throws and not the direction that silently loses a subject. `checkPrerequisites()` now asserts coverage first, and `skills.py`'s claim 8 asserts it independently of the guard (canaried by disarming the guard and removing the node: the probe still fails).
- **A gate can fail on a correct chain.** The first `topoOrder` test asserted the deepest node came last; `a` and `z` are both leaves and either may end the order. That assertion was a fact about the tie-break, not about the sort, and it failed on a correct implementation. Removed rather than loosened.

**F-26's drill already existed; the missing half was the comparison.** The plan asks for an interval and chord ear trainer on the existing synthesis, and `piano-engine.js`'s `hear` mode is exactly that: 24 interval and 16 chord questions played with the staff hidden. Building a second one would have been a duplicate with its own bug surface.

What `hear` mode could not do is let a child hear the difference. A wrong answer named the right interval and moved on, so the interval they chose and the one that was played were never adjacent — and adjacency is the whole skill. A major third and a minor third are one semitone apart and are learned by hearing them back to back.

Three things F-26 changed that the plan did not anticipate:

- **The bank's descending intervals are `[72, 72 - i]`, so `play[0]` is the upper note.** The first `rootOf` took `Math.min` and rebuilt every descending question ascending — 12 of the 24 interval questions played the wrong direction. The root is the note played *first*, and the sign of the difference is the direction.
- **An inversion's root is not its lowest note.** `inversionOf` was wrong twice before it was right: sorting the played notes gives root position only when the chord already is, and taking the index of the lowest note recovers the played position only when the lowest note is the root. Both passed on root position and failed on the other two. The root is now recovered from the triad's intervals — the rotation whose steps are 4-then-3 or 3-then-4 — and every question is checked, which is what caught both.
- **A note question has no comparison, and that is correct.** The child chose a letter, not a sound. The probe's first version counted that as a failure, then as "not exercised"; it now seeds the deck so note questions sort last, which is the page's own `freshFirst` order rather than a new mechanism, and asserts on an interval or chord question every run.

**F-24 found a live grading bug and a false comment.** The page compared a drawn stroke against exactly one template stroke and reported "Not that one" for every failure, so "right shape, wrong order" and "not a stroke in this character" were the same message. Splitting them meant scoring the attempt against the whole character, which is what `diagnose` does.

Two things came out of building it that the plan did not ask for:

- **A stroke drawn out of order was being accepted as correct.** `diagnose` returns the score against the stroke the attempt *does* match, and for a `later` verdict that score has `ok: true`. The page tested `if (r.ok)`, so drawing stroke 3 when stroke 2 was asked for incremented the position and drew it in. The branch is now on `verdict === 'right'`. Canaried: restoring `if (r.ok)` makes the probe's out-of-order claim fail with an empty feedback panel, which is what the child saw.
- **437 of 3,086 strokes passed when drawn backwards.** The comment above `renderStroke` claimed a backwards stroke fails "even though it covers the same pixels", and the endpoint term is supposed to be what rejects it. Measured over the bank: it does not. The mean and endpoint distances are absolute in a 0–100 box, so a reversed dot is only ~7 units off and passes -- 14% of all strokes, across 236 characters, overwhelmingly 点 and 横. A chord cosine is scale-free, rejects all 437, and still accepts every stroke drawn within ±3 units and 3 units of jitter (measured: 100%). The comment is corrected rather than left as a claim the code does not keep.

The probe's first threshold canary was also worthless: it scaled a stroke about its centroid, and both paths are resampled to equal arc length first, so a scaled copy is identical point for point. It passed at 0.6x and 1.6x with the same mean. The distortion is now a bow perpendicular to the chord — 6 units passes the whole bank, 16 units fails 60% of it — and both directions are asserted, because a threshold that rejects everything is as useless as one that accepts everything.

**F-23 is a schedule with a renderer, not an animation.** The obvious build is a `setTimeout` chain in the page, and its probe can only watch it finish. The bank gives every stroke as a polyline in a 0–100 box, so the whole character is a pure function of the stroke list: durations from stroke length, clamped at both ends, separated by a fixed gap. `stroke-anim.js` is that function and nothing else. The page's job is to draw whatever the schedule says, and `stroke.py` asserts the schedule over all 440 characters and 3,086 strokes rather than watching one run end.

Three things F-23 changed that the plan did not anticipate:

- **A gap belongs to the stroke it follows.** `at(plan, ms)` returns `-1` during the pause, not the next stroke's index. Naming the next stroke while it is not yet on screen shows the child a hint for something they cannot see. Canaried: `ms >= s.start` instead of `ms >= s.start && ms < s.end` fails on four of the seven probe points.
- **The reduced-motion branch is not "the same thing slower".** It steps one whole stroke every 700 ms with no interpolation, so the information is identical and the movement is gone. The first probe asserted "more strokes at 3 s than at 0.6 s", which is true of *both* branches — it passed against a page that ignored the preference. The claim is now the mechanism: no path in the stepped branch carries a non-zero `stroke-dashoffset`, and every path in the animated branch does.
- **A canary hit the copy of a guard that was not the one under test.** `renderStroke(..., 'guide')` appears twice — once in the stepped branch, once in the frame loop — and patching the first left the probe green. Patched by line number instead, and the frame-loop copy then failed as it should. This is the same duplication trap as the earlier approval-input/post-posting pair; the probe now reads the RAF branch's markup, which only that branch produces.

**F-12 is a guard because the feature it specifies is a no-op.** The plan says to order the session by the skill graph. All five subject edges were checked against the shipped plan before a line was written — `maths->savanna`, `maths->physics`, `maths->chemistry`, `chinese->calligraphy`, `physics->howthingswork` — and every one already holds, because the plan was written to alternate languages and that put maths first by luck of the counting. Deriving the order from the graph therefore renders exactly what the hand-written list renders. A change indistinguishable from no change is not a feature, and its probe would pass against the reverted file.

What the graph can honestly do is veto. `checkPrerequisites()` throws at load if a future edit moves a subject ahead of something it needs — a subject moved for an alternation reason, which is the only reason anything in that list moves. The order keeps its own justification; the graph gets a say it did not have.

Three things F-12 changed that the plan did not anticipate:

- **The branch that reorders `next()` is dead code and never shipped.** The first implementation had `next()` return a later prerequisite when the first undone subject needed one. `checkPrerequisites()` throws at load on exactly that condition, so the branch cannot fire in a page that loaded — it is a guard wearing a feature's clothes. Deleted before commit; the hub reads `p.plan.find(x => !x.done)` as it always did, and `session.js` exports no `next`.
- **The veto is live on one page of nineteen.** Only `infinite-arena.html` loads `skills.js`, so the guard only runs where the arena is. On the other eighteen the check returns at `if (!K || !K.edges)`. That is the intended trade — a drill page must open without the graph — but it means the guard's coverage is a fact about script tags, not about the plan. `prereq.py` asserts both: the throw on the arena, and the clean load on `spelling-bee.html`.
- **A fixture that reorders the plan fails for its own reasons before the guard speaks.** Three times over. `session.js` reads `ArcadeRecord.is` at load, so a blank page without `record.js` throws `Cannot read properties of undefined` before either guard runs. The last entry in `SUBJECTS` carries no trailing comma, so swapping whole lines leaves a comma dangling before `];` and the fixture is a parse error — which a probe counting page errors reads as "the guard threw". And reading `lines[at[a]]` after writing it yields the other entry's text, silently deleting a subject and failing `checkManifest()` instead. The probe now loads `record.js`, rewrites the comma, and captures both bodies before either assignment; the pairs are same-kind so `checkOrder` stays satisfied and only the graph check can speak. Canaried by disabling the guard: both order claims fail and the control stays green.

**Gate 3 item 2 is withdrawn as written, and the reason matters.** It required "F-14's generated example contains no number the drill asks", citing `llms.txt:99`. That citation is wrong twice over.

*The rule it cites is a science rule, and it holds there.* `llms.txt:99` sits under "Lessons + figures" beside `physics-lessons.js` and `chemistry-lessons.js`; it says nothing about maths. For a bank of authored questions it is a decidable, satisfiable predicate — and **two shipped science lessons violate it**: physics `motion` works "A train slows from 30 m/s to 10 m/s in 5 s" against a bank question that asks for its deceleration on the same numbers, and chemistry `moles` works calcium carbonate with `Ar: Ca = 40, C = 12, O = 16` — the prompt string the bank uses for five separate questions. Chemistry `periodic` (Group 2, Period 3) collides too. Those are F-44's to catch, and F-44 is Phase 5.

*For maths the same predicate cannot be met.* `addition-quest` enumerates its full pool — level 2 is all 8,100 two-digit pairs, level 1 all 100 single-digit pairs — and `times-table-academy`'s 1–20 mode all 400. Every sum and every table fact *is* a fact the drill asks, so no example drawn from those drills' number range can satisfy it. Ten of the twenty shipped maths examples already break it (`68 + 47`, `74 + 38`, `6 × 7`, `56 ÷ 8`, `72 ÷ 9` and five more are in their drill's pool). A gate on it could only ever fail.

What the rule protects is decidable in both subjects: a lesson must not hand over the answer to the question in front of the child. For maths `example.py` asserts the direct form — the example is never the fact just missed — plus two claims the original item never had: the example's own fact classifies back to the lesson's topic, and its stated answer follows from its stated question. The science form needs a bank-versus-lesson check, which is F-44.

Three things F-14 changed that the plan did not anticipate:

- **A hand-built neighbour does not preserve the topic.** Moving a digit by one looks like "the same kind of mistake" and is not: `2 + 8` is exact-ten `place`, `2 + 9` is `carrying`. The first version worked a non-carrying example under a "Carrying" heading and every other test passed. The generator now searches the fact space and keeps a candidate only if `TOPIC_OF` returns the lesson's topic — true by construction rather than by arithmetic luck.
- **A bond's identity is what it asks, not its `a` field.** `3|1|whole` and `3|2|whole` are the same question ("what is the whole, given parts 1 and 2"), written with the parts in the other order. Comparing `a` called them different and the example handed over the answer. `sameFact` now keys on the whole and the unordered part pair when the whole is blanked.
- **`llms.txt:99` is correct for science and inapplicable to maths.** The roadmap cited it as a maths rule; it governs `physics-lessons.js` and `chemistry-lessons.js` only. It stays as written. The maths rule the plan wanted is now `example.py`'s, and the science rule is F-44's — which is now known to have three live violations to find.

Three things F-17 changed that the plan did not anticipate:

- **`familyKey` must recover the family, not name the operands.** The first version returned `add:8,15` for `familyKey('sub', 15, 8)` — the minuend and subtrahend. No addition drill ever writes that pair, so the merge would have silently never fired and read exactly like working. The subtraction family is `(a − b, b)`; division is `(a ÷ b, b)`.
- **The merge reads, never writes.** `crossDue` takes `{ version: 0, stash: false }` on the other store, like the hub. A cross-drill write would make two pages the owners of one record, and the first one cleared would overwrite the other's miss. `cross.py` hooks `Storage.prototype.setItem` to assert zero writes: byte equality cannot see a write that re-serialises to the same text.
- **`ownFamily` is supplied by the page, because the review key is not a family key.** A review key is `level|a|b` or `a|b`; a family key is `add:7,8`. An `own[key]` lookup inside `crossDue` was a check that could never fire — dead code wearing a guard's clothes. It was removed rather than left to read as protection.

**F-20 is deliberately deferred.** A plan that is a subset of eleven subjects touches `checkOrder()`'s invariant (`session.js:70-81`), which is the one place the codebase throws rather than degrades. Changing the membership while preserving "opens on a language, no two languages adjacent" is possible but needs its own argument. It is not in this phase.

**Gate 3.**

1. F-13 fires at most once per topic per session, and only after ≥3 misses of facts mapped to that topic.
2. ~~F-14's generated example contains no number the drill asks.~~ **Withdrawn** — see the note above. Unsatisfiable for the maths pools (full enumeration) and misattributed to maths (the cited rule is science-only). Replaced by the three claims `example.py` asserts. F-44 still owns the science form of the rule, where it is satisfiable and currently violated by three lessons.
3. ~~`checkOrder()` still passes; no phase-3 change touches `SUBJECTS`' order.~~ **Restated.**
   A phase-3 change did touch it: Savanna Run was added as a twelfth subject, slotted beside
   maths so the two `other`-`other` pairs are maths/savanna at the top and piano/howthingswork at
   the end. Both load-time guards pass — `checkOrder()` (opens on a language, no two `lang`
   adjacent) and `checkPrerequisites()` (every plan subject has a graph node, every edge respects
   the plan's order) — and `skills.py` claim 8 asserts the same three properties independently.
   The claim was never "the order is frozen"; it was "the order's two invariants hold", and
   stating it as a freeze was the mistake.

---

## Phase 4 — Content generation

| Item | Depends on |
|---|---|
| F-23 stroke-order practice ✅ | — |
| F-24 shape vs order scoring ✅ | F-23 |
| F-26 ear trainer | — |
| F-25 generated pieces | — |
| F-15 typing weak-key drill ✅ | — |
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

**Landed so far.**

| Item | Landed | Probe |
|---|---|---|
| F-23 stroke-order animation | `stroke-anim.js` — `timeline`, `at`, `lengthOf`, `pathD`; `calligraphy.html`'s `playOrder`/`stopOrder` draw the whole character in bank order | `stroke.py` |
| F-24 shape vs order | `stroke-grade.js` — `strokeScore` (16-point resample + chord cosine), `diagnose` (`right`/`later`/`earlier`/`shape`); the page branches on the verdict and names the position | `strokeorder.py` |
| F-26 ear trainer | `hear` mode already played intervals and chords with the staff hidden; `ear.js` adds the comparison after a wrong answer — the chosen interval, then the played one, same root and direction | `ear.py` |
| F-15 typing weak-key drill | `typing-tutor.html` — `state.weak` (cumulative, saved), `buildDrill`, `curriculum`, `easeDrill`; a thirteenth card appended after the twelve, generated from the five worst keys and halved by a clean run | `typing_drill.py` |

**F-15 needed a second counter.** The spec said the weak-key list was "computed on every `paintWeak()` call and thrown away", which is half true: it was also cleared at `startLesson`, so it was per-run as well as per-render. A drill built from `keyErr` would have existed only while a lesson was being played badly and vanished when the child started the drill. `state.weak` is the same count kept across runs and saved with the record, and it is what `buildDrill` reads; `keyErr` stays the on-screen chips.

**The cover rule was tested by a fixture that could not fail.** The first probe seeded four keys the corpus carries in many words. The canary that removed the cover rule passed clean, because every seeded key already appeared in the top fourteen words — the test was a fixture where the bug could not appear. The fixture that works pits `e`, the commonest letter in the corpus, against `;`, which appears in one word: `e` fills all fourteen slots and `;` is crowded out, which is the case the rule exists for. Same lesson as the `href="/…"` link checker: a predicate that only ever sees the passing case is not a predicate.

**Two guards were redundant, and the probe said so.** `buildDrill` had `if (!ranked.length) return null` and `if (!text) return null`. Disabling either alone left every claim passing — an empty `weak` map produces no scored words, so `text` is empty and the second guard catches it; and an empty `text` cannot arise while `ranked` is non-empty except through the space-only path, which the fallback now handles. The first guard was removed rather than kept as belt-and-braces: a guard no test can distinguish is a line that will drift.


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
