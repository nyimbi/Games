# Fifty features

Each entry states: what it is, the primitive it deepens, why it is worth building, the evidence it rests on, and its cost. Features are grouped by the capability they extend, and numbered so `03-roadmap.md` can order them.

**Two rules applied throughout.**

1. **Nothing here needs a server.** The offline guarantee (`README.md`, `llms.txt:11-19`) is the product. Every feature below runs from `file://` with no network. Where a feature would benefit from sync, that is stated as a separate, deferred decision — not smuggled in.
2. **No feature is "add a button to X".** Each either makes the record readable, makes the content generative, or makes two existing subsystems talk to each other. A feature that does none of those was cut.

**Cost notation.** `O(1)` means independent of the fact space; `O(n)` over a bank of size n, with n given. Times are for a low-end Android at 4× CPU throttle, which is the device this product is for.

---

## A. The record becomes readable

The arcade writes a percentage per level and never reads it back. `README.md:783-788` names this as the next unit of work. These ten features are that unit, ordered so each makes the next cheap.

### F-1 — A spaced-repetition schedule that replaces the `due` boolean

**Deepens:** `review` (`number-bonds.html:551-556` and four siblings).
**Why:** `due` is a boolean and a fact is retired after one correct answer (`01-defects.md` D-8). Spaced repetition needs an interval that grows with successful retrievals. The data is already collected — `r.n` counts attempts and `r.miss` counts misses at every site — so the change is a scheduling rule, not new instrumentation.
**Evidence:** all six copies retire a missed fact after one correct answer, including `spelling-bee.html:914`, whose `r.n >= 2` guard counts *attempts* rather than successes and so only suppresses retirement for a fact missed on its first attempt (`01-defects.md` D-8 traces it). Porting that condition would change nothing.
**Cost:** `O(1)` per answer. The schedule is three fields (`n`, `miss`, `nextAt`) and a pure function `nextInterval(n, miss)`. Replaces `due` in five files without changing any call site.
**Depends on:** nothing. **Enables:** F-2, F-3, F-5.

### F-2 — Make the review queue level-correct, then cap it

**Deepens:** `buildQueue` in all five drills.
**Why:** Three drills slice before filtering and can never serve an in-level review fact (D-2, measured); the map is unbounded (D-3). Both are the same code path and must be fixed together — fixing the order without a cap turns a silent no-op into a fast-growing object.
**Evidence:** `division-diner.html:517-520` vs `addition-quest.html:652-656`. Probe `/tmp/div_review.py`.
**Cost:** `O(k log k)` per deck build where k is the review size, bounded to `REVIEW_CAP = 400` by F-2's own eviction, so `O(1)` in practice.
**Depends on:** F-1 (the sort key is the schedule).

### F-3 — A "what I keep getting wrong" panel

**Deepens:** `review`, surfaced instead of hidden.
**Why:** Every drill records misses and shows none of them. A child who has missed `7×8` four times is told nothing. The data exists per game; the panel is a read.
**Evidence:** `times-table-academy.html:779-784` writes `{n, miss, due}`. The only read of `miss` anywhere in the product is `calligraphy.html:598`, which counts characters with `miss === 0` into a "written clean" statistic — a coarse tally, not a list of what the child keeps missing. The four arithmetic drills read `miss` nowhere, and `calligraphy.html:558-560` builds a "Worth another look" list from the *current run's* `state.misses` array, which is reset at `:568` and never persisted.
**Cost:** `O(r log r)` to rank r review entries, r ≤ 400. Renders as a list on the home screen of each drill.
**Depends on:** F-1, F-2.

### F-4 — Latency as a first-class signal

**Deepens:** the answer path, which currently discards timing entirely.
**Why:** Correct-and-slow and correct-and-fast are different states of knowledge and the record cannot tell them apart. The only `performance.now()` calls in the product are the arena's run clock (`infinite-arena.html:515`) and the typing tutor's (`typing-tutor.html:482`); no drill timestamps a question.
**Evidence:** `addition-quest.html:706-709` renders a question and stamps nothing.
**Cost:** `O(1)` — one timestamp at render, one subtraction at grade, an EMA of the ratio per fact. Adds ~6 bytes per review entry.
**Depends on:** F-1. **Enables:** F-6, F-18.

### F-5 — A per-subject mastery estimate the hub can read

**Deepens:** `perLevel`/`perMode`, which is `{level → best pct}` — a record of the best run, not of current ability.
**Why:** `index.html:549-557` computes stars from `Math.max` over the bucket. A child who scored 90% in March and 40% today shows three stars. The arena is the only game with a decay model (`infinite-arena.html:411-416`), and it is correct; nothing else has one.
**Evidence:** `index.html:552-562`; `infinite-arena.html:411-416`.
**Cost:** `O(1)` per subject. Reuse the arena's day-decay rather than inventing a second.
**Depends on:** F-1, F-4.

### F-6 — A difficulty setting that follows the record rather than being chosen

**Deepens:** the level/mode picker, which is a manual choice in five drills.
**Why:** Every drill asks the child to pick a level before it knows anything about them. The record knows. This is not adaptive difficulty in the flash-card sense — it is choosing the starting level from the last session's accuracy at each, which is a read of data already stored.
**Evidence:** `number-bonds.html:533-536` (`mode: 'ten'` default), `addition-quest.html:625-627` (`level` default), five sites.
**Cost:** `O(1)`. Must be overridable — a child who wants level 3 gets level 3 — and the override must persist.
**Depends on:** F-5.

### F-7 — Session history per game, not per day

**Deepens:** `arcade.session.v1`, which records `{day → {subject → timestamp}}`.
**Why:** The session record answers "did I do maths today". It cannot answer "how did maths go today". A child's own progress over a week is the most motivating artefact the product could show and it is one field away.
**Evidence:** `session.js:139-141` — the day record holds `done: {subjectId: timestamp}` and nothing else.
**Cost:** `O(d)` for d ≤ 120 days on write; the record is already trimmed (`session.js:104-111`). Adds one number per subject per day.
**Depends on:** nothing. **Enables:** F-8, F-30.

### F-8 — A weekly strip that shows what changed, not just what was done

**Deepens:** `history(n)` (`session.js:180-196`), which returns `{key, done, total, complete}` per day.
**Why:** The strip shows completeness. Completeness is a binary and a child who does eleven subjects badly looks identical to one who does them well. Adding the day's mean accuracy per subject makes the strip informative without making it punitive — the design explicitly forbids streaks that punish absence (`README.md:778`).
**Evidence:** `session.js:180-196`; `session.html` renders the strip.
**Cost:** `O(d)` over 120 days, computed on render.
**Depends on:** F-7.

### F-9 — Export and import the whole record as one JSON file

**Deepens:** every `arcade.*` key.
**Why:** The record lives in `localStorage`, which is cleared by "clear browsing data", lost when a device is replaced, and not shared between two children using one machine. A file the child or parent saves and reloads is the only backup the offline guarantee permits. It is also the migration path for any future schema change.
**Evidence:** 17 distinct `arcade.*.v*` keys (`grep -o "arcade\.[a-z]*\.v[0-9]"`); no export path exists.
**Cost:** `O(total record)` — bounded by F-2's caps to well under 1 MB. Uses a `Blob` and a download link, which is not a network call.
**Depends on:** F-2 (the caps make the export small enough to be useful).

### F-10 — A schema version check on load that reports rather than throws

**Deepens:** the `arcade.<game>.v<N>` convention (`llms.txt:49-51`).
**Why:** Every `load()` does `JSON.parse(...)` in a `try` and falls back to defaults (`number-bonds.html:539-543`). A shape change without a version bump therefore presents as *silent total data loss* — the parse succeeds, the fields are wrong, and the defaults take over. Nothing distinguishes "new child" from "corrupt record".
**Evidence:** `number-bonds.html:539-543` and four siblings; `session.js:97-104` validates `days` and is the only loader that does.
**Cost:** `O(1)`. A `v` field is already written by `session.js` (`:140`) and by `how-things-work.html`; the other games write none.
**Depends on:** nothing.

---

## B. The learner model

The arena is the only place with a model of the learner (`infinite-arena.html:386`, `:581`). Everything else scores. These features generalise what the arena already proves works.

### F-11 — One skill graph across all eleven subjects

**Deepens:** `SUBJECTS` (`session.js:38-50`), which is a list, and `SKILLS` (`infinite-arena.html:358-386`), which is a graph with no edges.
**Why:** The arcade teaches eleven subjects and encodes no prerequisite between any two of them. `calligraphy-bank.js` has `rank` (440 characters, ordered by frequency) and `tier`; the spelling bank has `tier`; French has `tier` and `family`. Every one of these is a partial order already, stored as a flat field.
**Evidence:** `calligraphy-bank.js` first record: `{"char":"的",...,"tier":1,"rank":1}`; `french-bank.js` first record: `{"fr":"un",...,"tier":1,"family":"numbers"}`; `spelling-bank.js` first record: `{"w":"accept",...,"tier":1}`.
**Cost:** `O(V+E)` to validate a DAG of ~40 nodes at load; `O(1)` per lookup. The graph is data in one file, not logic.
**Depends on:** F-5.

### F-12 — Prerequisite-aware unlocking that is advisory, not gating

**Deepens:** F-11.
**Why:** Locking content behind prerequisites is a punishment mechanic and the design forbids it in spirit. *Ordering* the session plan by the graph is not: the plan already orders by subject (`session.js:38-50`) for a pedagogical reason — alternating language and non-language — and could additionally order within a subject by what the graph says comes first.
**Evidence:** `session.js:124-131` `gameFor()` rotates maths by day number; nothing consults a prerequisite.
**Cost:** `O(V+E)` once per plan build.
**Depends on:** F-11.

### F-13 — A "stuck" detector with a lesson as the response

**Deepens:** `taught` in the science engine (`science-engine.js:214`, `:314`), which marks a topic read, and the maths lesson dialog (`maths-engine.js:272-287`), which is opened by hand.
**Why:** `README.md:783-788` asks this question directly: "whether a drill could notice what a child keeps getting wrong and offer the one lesson that covers it". The mechanism exists in both halves and they are not connected. `review[k].miss` is the signal; `MATHS_LESSONS[drill].topics` is the target.
**Evidence:** `maths-lessons.js:718-760` maps four topics per drill; `number-bonds.html:551-556` counts misses; no code joins them.
**Cost:** `O(t)` to match a missed fact to a topic, t ≤ 4. Fires at most once per topic per session.
**Depends on:** F-1, F-2. **This is the highest-value feature in the document.**

### F-14 — The lesson picks its example from the child's actual mistake

**Deepens:** the lesson shape's `example` field (`maths-lessons.js`, every lesson).
**Why:** Every worked example is authored and deliberately uses numbers the drills never ask (`llms.txt:99-100`) — correct, because a lesson must not hand over a bank answer. But the *shape* of the child's error is not a bank answer. If the last miss was a carry across the tens, the example should carry across the tens, with different digits.
**Evidence:** `maths-lessons.js` `example: {q, steps[], a}`; the miss is in `review`.
**Cost:** `O(1)` — the lesson's example becomes a function of a seed derived from the missed fact. Content authoring is the real cost: each lesson needs an example template, not just an example.
**Depends on:** F-13.

### F-15 — The typing tutor's per-key error map becomes a drill

**Deepens:** `state.keyErr` (`typing-tutor.html:330`, `:494`), which is recorded, ranked (`:470`), displayed as a "weak keys" list, and then discarded.
**Why:** The tutor knows which keys the child misses and shows the list. It does not build practice from it. The weak-key list is computed on every `paintWeak()` call and thrown away; a generated drill over those keys is the obvious next step and needs no new data.
**Evidence:** `typing-tutor.html:470-472` sorts `keyErr` descending and takes five.
**Cost:** `O(k log k)` for k distinct keys, ≤ 40. Generating a lesson is `O(len)`.
**Depends on:** nothing.

### F-16 — A per-fact forgetting curve calibrated to this child

**Deepens:** F-1's schedule.
**Why:** A fixed interval schedule is a population average. `n` and `miss` per fact give a per-fact estimate of how fast it decays. This is the difference between a Leitner box and an SM-2 derivative, and the data to do it is already being written.
**Evidence:** `review` entries carry `n` and `miss`; nothing carries `nextAt` yet (F-1 adds it).
**Cost:** `O(1)` per answer. One parameter per fact, fitted online.
**Depends on:** F-1, F-4.

### F-17 — Recognise the same fact across drills

**Deepens:** D-9's split identity.
**Why:** `7 + 8` in addition, `15 − 8` in subtraction, `8 × 7` in times and `56 ÷ 7` in division are four representations of one fact family. The arcade treats them as four unrelated facts in four unrelated stores. A fact-family index makes a miss in one drill inform the others — which is what "number facts" means as a skill.
**Evidence:** the four pools are generated independently (`addition-quest.html:658-676`, `subtraction-safari.html:702-720`, `times-table-academy.html:790-796`, `division-diner.html:505-513`); no shared key exists.
**Cost:** `O(1)` to compute a family key from `(a, b, op)`; `O(f)` to merge f families at load, f ≤ a few thousand.
**Depends on:** F-1. **Enables:** F-33.

### F-18 — Separate "knows it" from "can do it under time"

**Deepens:** F-4's latency.
**Why:** The design forbids time pressure (`README.md:778-779`) and that is right for the drill. It does not forbid *measuring* time and reporting it. A fact answered correctly in 4 seconds and one in 400 ms are different, and the record can say so without ever showing a clock.
**Evidence:** no drill timestamps a question; only the arena (`:515`) and typing (`:482`) have clocks at all.
**Cost:** `O(1)`. Reporting only — never gates anything.
**Depends on:** F-4.

### F-19 — A mastery estimate that survives a level change

**Deepens:** `perLevel`, keyed by level.
**Why:** `perLevel` stores `{level → pct}`. A child who has mastered level 1 has a 90% there and 0% at level 2, and the hub reads `Math.max` over the bucket — so it reports the mastered level forever. Mastery of a *skill* is not mastery of a *level*, and the level is an artefact of how the pool is generated.
**Evidence:** `index.html:552-562` (`Math.max` over `Object.values`); `addition-quest.html:856` writes `Math.max` into the bucket too.
**Cost:** `O(1)`. Requires F-17 to have a skill identity that is not the level.
**Depends on:** F-17, F-5.

### F-20 — A "today's plan" that is a plan, not a list

**Deepens:** `plan()` (`session.js:124-131`), which returns all eleven subjects in a fixed order.
**Why:** The plan's order is fixed by the alternation constraint and that is deliberate (`session.js:59-71`). But it is the same eleven every day, at the same length, regardless of what the record says. A plan that names two or three subjects — chosen by the model, still alternating language and non-language — is a different product from a checklist of eleven.
**Evidence:** `session.js:126-131`; the `checkOrder()` invariant (`:70-81`) constrains the *order*, not the *membership*.
**Cost:** `O(s log s)` for s = 11.
**Depends on:** F-5, F-12. **Touches a design invariant — see `03-roadmap.md` Phase 3 gate.**

---

## C. Generative content

The banks are large and static: 1,239 words, 440 characters with 3,086 strokes, 181 piano questions, 1.42 MB total. Generation already happens in the maths drills (`poolFor`, `factsFor`) and in the arena (`SKILLS[].gen`). These features extend generation to the subjects that have none.

### F-21 — Generate arithmetic word problems from the same fact pools

**Deepens:** `poolFor` in the five drills.
**Why:** Every maths question is symbolic. Word problems are where the arithmetic is actually used and where children fail for reasons that are not arithmetic. The pool already enumerates the facts; a template layer over it produces a problem whose answer is a fact the drill knows.
**Evidence:** `addition-quest.html:658-676` builds `{a, b, level}`; `division-diner.html:505-513` builds `{dividend, divisor, quotient}`.
**Cost:** `O(1)` per question. The real cost is authoring templates that are not twee, which is a content problem, not a code one.
**Depends on:** F-17.

### F-22 — A spelling-bank synthesiser for the phonetic rules the bank already encodes

**Deepens:** `spelling-bank.js`'s `rule` field.
**Why:** Every one of the 1,239 entries carries an authored `rule` ("accept begins ac- and means to take in; except begins ex- and means to leave out"). Those rules are generalisable: a rule that distinguishes two words can generate a discrimination pair the bank does not contain. The bank's `pairs` field already does this for some entries.
**Evidence:** `spelling-bank.js` first record has `"rule"` and `"pairs"`.
**Cost:** `O(1)` per generated pair from an indexed rule table. Correctness is the risk — a generated pair with a wrong rule teaches a wrong thing. Mitigation: generate only from rules with an explicit minimal-pair template, and gate generation behind F-44's content check.
**Depends on:** F-44.

### F-23 — Calligraphy stroke-order practice from the 3,086 recorded strokes

**Deepens:** `calligraphy-bank.js`'s `strokes[].pts`, which is a polyline per stroke.
**Why:** The bank records every stroke of all 440 characters as an ordered point list with a hint per stroke. The page grades a drawn character (F-24 needs it), but the polyline means it can also *animate* the correct order and *check* the child's order against it, which is the thing calligraphy practice is actually about.
**Evidence:** 440 characters, 3,086 strokes, each `{name, pts: [[x,y],...], hint}`. `calligraphy.html:507-508` handles pointer drawing.
**Cost:** `O(s × p)` to compare a drawn stroke to a template stroke, s ≤ 30 strokes, p ≤ 20 points. `O(s × p)` to animate.
**Depends on:** nothing.

### F-24 — Stroke-order scoring that separates shape from order

**Deepens:** F-23.
**Why:** Two different errors — drawing the right shape in the wrong order, and drawing the wrong shape — need two different responses. A shape-only check cannot tell them apart. Comparing stroke *sequences* against the template, with a shape distance per stroke, can.
**Evidence:** `calligraphy.html:507-530` records pointer paths; nothing compares them to `strokes[].pts`.
**Cost:** `O(s² p)` for a sequence alignment over s strokes; s ≤ 30, so ~18,000 point comparisons worst case, under a millisecond.
**Depends on:** F-23.

### F-25 — Music generation constrained by the pieces already in the bank

**Deepens:** `piano-bank.js`'s `PIECES` (`:560-613`), eight public-domain pieces as `{m, b}` note lists.
**Why:** The bank has eight pieces and 181 generated questions. Sight-reading practice needs more material than eight pieces, and the pieces define a distribution — key, range, interval size — that a generator can sample. Generating a short piece in the same distribution is not composition; it is more of the same, which is what practice needs.
**Evidence:** `piano-bank.js:560-613`, `PIECES.forEach(p => { p.timeSig = PIECE_SIG })` at `:610`.
**Cost:** `O(n)` per piece, n ≤ 64 notes. The generation is a constrained walk over the interval distribution the eight pieces imply.
**Depends on:** nothing.

### F-26 — An interval and chord ear-trainer built on the existing pitch synthesis

**Deepens:** `piano-engine.js`'s `playNote`/`playChord`/`playSeq` and the `hear` answer channel.
**Why:** The `hear` channel already plays a question with the staff hidden (`llms.txt:60-64`). The synthesis is there; the question space is small. Interval recognition by ear is a distinct skill from reading and the machinery for both exists.
**Evidence:** `piano-engine.js:58` (`tone` with a delay parameter), `:126`; `piano-bank.js:178` (interval questions).
**Cost:** `O(1)` per question.
**Depends on:** nothing.

### F-27 — A generated French conjugation drill

**Deepens:** `french-bank.js`'s `pos` and `family` fields.
**Why:** The French bank is words and sentences with part of speech and semantic family. Verbs are a `pos`; conjugation is systematic and is exactly the kind of content that should be generated rather than authored — the same argument the piano bank makes for generating "every staff position, every interval" (`llms.txt:86-89`).
**Evidence:** `french-bank.js` first record: `{"fr":"un","en":"one","say":"UHN","pos":"number",...,"family":"numbers"}`.
**Cost:** `O(1)` per form from a conjugation table; the table is the authoring cost.
**Depends on:** F-11 (conjugation is a prerequisite chain).

### F-28 — Kiswahili noun-class agreement generated from the class system

**Deepens:** `swahili-bank.js`.
**Why:** Noun classes are a productive system: a class and a root determine the agreement prefix. `llms.txt:81-83` describes the bank as "noun classes". Generating agreement forms exercises the system rather than a vocabulary list, and the system is finite and checkable.
**Evidence:** `swahili-bank.js`, 71 KB, structured by class.
**Cost:** `O(1)` per generated form.
**Depends on:** nothing.

### F-29 — A Mandarin tone-pair drill generated from the four tones

**Deepens:** `chinese-bank.js`'s `pinyin` and the `tonePrompt` path (`chinese.html:240`).
**Why:** Tone sandhi between adjacent syllables is systematic and is the hardest part of Mandarin listening. The bank records pinyin with tone marks; the pair space is 4×4 and the audio is synthesised.
**Evidence:** `chinese-bank.js`, 77 KB; `chinese.html:240`.
**Cost:** `O(1)` per pair.
**Depends on:** nothing.

### F-30 — A "one thing I could not do last week, now I can" retrospective

**Deepens:** F-7's per-game history and F-1's schedule.
**Why:** The product's motivational model is a completed day, not a comparison to yesterday. A retrospective that names a specific fact the child missed last week and now answers correctly is the one form of progress comparison that does not punish absence — it is a fact about the child's own past, not a streak.
**Evidence:** `review` retains `miss` counts; `session.js:180-196` retains 120 days.
**Cost:** `O(r)` over the review map at week boundaries.
**Depends on:** F-7, F-1.

---

## D. Cross-subject capability

The arcade's eleven subjects share a shell (`session.js`), four engines, and nothing else. These features make subsystems talk.

### F-31 — A word list the child builds, used by spelling and typing together

**Deepens:** `spelling-bee.html`'s bank and `typing-tutor.html`'s `LESSONS`.
**Why:** A child's own spelling words are the highest-value content in the product and the arcade cannot accept them. One typed list, used by two drills, turns a fixed product into a personal one. It also makes `esc()` (D-4) live, which is why F-44 must land first.
**Evidence:** `spelling-bee.html` reads `SPELL_BANK`; `typing-tutor.html:300` `LESSONS` is static. No input path exists.
**Cost:** `O(1)` per word. Storage bounded by F-2's cap discipline. **This is the one feature that introduces user-authored markup into the product** — D-4 stops being latent the moment it ships.
**Depends on:** F-44, F-42.

### F-32 — The maths drills read numbers out of the science banks

**Deepens:** `physics-bank.js` and `chemistry-bank.js`, which contain quantitative questions.
**Why:** Physics and chemistry ask arithmetic inside a context. The maths drills ask arithmetic with no context. A physics question whose arithmetic is a fact the child has just practised is the cheapest possible cross-subject link and needs no new content.
**Evidence:** `physics-bank.js`, 76 KB; `chemistry-bank.js`, 78 KB; both carry numeric questions with explanations.
**Cost:** `O(1)` to match a question's operands to a practised fact.
**Depends on:** F-17.

### F-33 — A fact-family view across the four arithmetic drills

**Deepens:** F-17.
**Why:** Once a family key exists, the four drills can show the same family four ways: `7+8`, `15−8`, `8×7` (no — that is a different family), `56÷7`. The relationship is addition↔subtraction and multiplication↔division. A child who knows `7+8` but not `15−8` has a specific gap the product can name.
**Evidence:** the four pools are independent; no inverse relationship is encoded.
**Cost:** `O(1)` per family lookup.
**Depends on:** F-17.

### F-34 — The machine shelf's figures become a source of questions

**Deepens:** `how-things-work.html` and the 26 figures.
**Why:** `README.md:789-791` names this as the second likely unit: the shelf records a visit and the figures expose far more. The figures are complete pages with working controls; the wrapper knows only their title, hint and idea line. Anything built here must stay derived from the figures rather than described by the wrapper — that constraint is stated in the README and is correct.
**Evidence:** `how-things-work.html:165` (`<iframe id="figFrame">`), `:232` (`GROUPS`); `figures/` has 26 files; `llms.txt:121` — 7 of 26 ship without an `idea` line.
**Cost:** `O(1)` per figure to record what was explored; the hard part is deriving anything at all across a `file://` frame boundary, which `llms.txt:118-120` documents as not readable in Chromium and WebKit.
**Depends on:** nothing. **Constraint:** must not become a second source of truth.

### F-35 — A single "today" surface that reads every game's record

**Deepens:** `index.html`'s card grid and `session.html`'s plan.
**Why:** Two surfaces answer "what should I do now" and they read different stores. The hub reads `arcade.*.v*` for stars; the session page reads `arcade.session.v1` for the plan. A child sees two answers.
**Evidence:** `index.html:552-562` (`bestPct`); `session.js:126-131` (`plan`).
**Cost:** `O(g)` for g = 16 cards.
**Depends on:** F-5.

### F-36 — A printed worksheet from any deck

**Deepens:** `poolFor` and the deck builder.
**Why:** A parent's most common request of a learning product is paper. The deck builder already produces an ordered list of 50 questions; rendering it to a print stylesheet is a pure function of data the product already computes, and needs no network. No page has `@media print` (`grep -c "@media print" *.html` → no match).
**Evidence:** `number-bonds.html:563-600` builds the queue; no print styles anywhere.
**Cost:** `O(n)` for n = 50 questions. Must not print the answers.
**Depends on:** nothing.

### F-37 — The lesson content becomes addressable from any page

**Deepens:** `MATHS_LESSONS` (`maths-lessons.js:718-760`), `physics-lessons.js`, `chemistry-lessons.js`, `piano-lessons.js`.
**Why:** Four lesson files, four loaders, one shape (`llms.txt:96-105`). A lesson about carrying is the same lesson whether it is opened from the addition drill or from a physics question that needs it. One registry keyed by topic id, with the drill id as a tag, makes every lesson reachable from every place that needs it.
**Evidence:** the four files share `{title, why, rule, beats[], example, remember, trap, figs[]}`; each is loaded by its own page.
**Cost:** `O(t)` to find a lesson by topic, t ≈ 50.
**Depends on:** F-13.

### F-38 — The session plan suggests a lesson when a subject is being skipped

**Deepens:** `plan()` and the lesson registry.
**Why:** The alternation puts spelling first because "it is the drill a child is most likely to skip" (`session.js:62-63`). That is a static guess about a dynamic child. If the record shows spelling skipped three days running, the plan could offer the reason rather than the order.
**Evidence:** `session.js:59-71` states the reasoning; `session.js:180-196` records the days.
**Cost:** `O(d)` over 120 days.
**Depends on:** F-7, F-37.

### F-39 — A shared "explain this" surface for the science and maths engines

**Deepens:** `science-engine.js`'s lesson view and `maths-engine.js`'s dialog — two implementations of one idea.
**Why:** Both show a lesson before or beside a question. They differ in presentation (stage vs dialog) for a documented reason (`llms.txt:101-105`: the five drills have five stage machines). The *content pipeline* is the same and is duplicated.
**Evidence:** `science-engine.js:214` (`lessonFor`), `maths-engine.js:272-287` (`open`/`close`).
**Cost:** `O(1)`; this is a refactor with no new behaviour, which is why it is listed as a feature: it is the prerequisite for F-37 being cheap.
**Depends on:** F-37.

### F-40 — A keyboard-first path through every drill

**Deepens:** the `document`-level `keydown` handlers in four drills.
**Why:** `division-diner.html:700-704` is a complete keyboard answer path (digits, backspace, enter). `number-bonds.html:519` has arrow-key support for the drag handle. `addition-quest.html:970`, `subtraction-safari.html:952`, `times-table-academy.html:1035` have handlers whose coverage differs. A child on a laptop should never need the mouse.
**Evidence:** four sites, four different key sets; `number-bonds.html:452` and `:519` are separate handlers for different targets.
**Cost:** `O(1)`. The work is enumerating what each drill's answer actually is.
**Depends on:** nothing.

---

## E. Observability and integrity

There is no error handler, no CSP, and no way to tell a corrupt record from a new one. These features make failure visible inside the offline guarantee.

### F-41 — A local error ring, surfaced on the session page

**Deepens:** the 19 `catch (_) { }` sites and the absence of `window.onerror`.
**Why:** Telemetry cannot leave the device, so it should not try. It can be recorded locally: a bounded ring of `{page, message, at}` that a parent can read. This turns every silent swallow into a place that can report without changing behaviour.
**Evidence:** no `window.onerror` or `unhandledrejection` anywhere; `catch (_) { }` in 8 files (`01-defects.md` D-10).
**Cost:** `O(1)` per event, ring capped at 50.
**Depends on:** nothing. **Enables:** every other observability feature.

**Landed.** `errors.js`, loaded first in every `<head>` so it catches errors the engines raise while parsing banks. The ring is memory-first with localStorage as a best-effort copy, because quota exhaustion — the failure most worth recording — is the one that makes the ring unwritable. Repeats collapse to one entry with a count. Surfaced on `session.html` as a disclosure; `probes/errors.py` covers an uncaught error, a real storage catch driven with `setItem` stubbed to throw, the memory-vs-storage split, the collapse and the cap.

### F-42 — A record integrity check that distinguishes empty from corrupt

**Deepens:** F-10.
**Why:** Every loader falls back to defaults on a parse failure (`number-bonds.html:539-543`). A child whose record is corrupt is indistinguishable from a child who has never played, and the first thing the product does is overwrite the corrupt record with defaults.
**Evidence:** five `load()` sites; `session.js:97-104` is the only one that validates shape.
**Cost:** `O(1)` per key, 17 keys.
**Depends on:** F-10, F-41.

### F-43 — A self-test page that runs the four probes' assertions in the browser

**Deepens:** `probes/` (370 lines, four files, Python + Playwright).
**Why:** The probes need a developer with Python and a browser driver. The product ships to a machine with neither. A `selftest.html` that asserts the invariants the probes assert — the deck is 50 long, no duplicate ids, every lesson renders, every `keyOf` reads what `markSeen` writes — runs anywhere the product runs.
**Evidence:** `probes/freshness.py:14-17` states a coverage limit that a browser-resident check could close; `probes/shell.py:43` checks for duplicate ids.
**Cost:** `O(pages)` — 18 page loads. The duplicate-id and lesson-render checks are already written twice (Python and inline); this makes them run without Python.
**Depends on:** F-42.

### F-44 — A content gate that canary-checks a lesson before it ships

**Deepens:** the lesson shape's invariants (`llms.txt:96-100`: ≥2 figures, examples the bank never asks).
**Why:** Every lesson rule is currently enforced by a human reading a probe's output. A gate that asserts "this lesson's example numbers appear nowhere in the bank" is a predicate the product can run on itself, and it is exactly the rule the docs state.
**Evidence:** `llms.txt:99-100`; `probes/lessons.py` checks figures render but not that examples are absent from the bank.
**Cost:** `O(b × e)` for b bank entries and e example numbers, once per lesson at authoring time. Run offline, not in the browser.
**Depends on:** F-43. **Required before:** F-22, F-31.

### F-45 — A storage budget that reports before it fails

**Deepens:** D-3.
**Why:** `localStorage` fails at a quota the product never measures. A budget check on write — total bytes across `arcade.*` keys, reported on the session page when above a threshold — turns a silent failure into a visible one, and gives F-2's caps a number to target.
**Evidence:** `session.js:104-111` trims to 120 days *because* an unbounded object throws, and says so; no game does the same for `review`.
**Cost:** `O(k)` over 17 keys per check, throttled to once per session.
**Depends on:** F-41, F-2.

### F-46 — Deterministic replay of a session from a seed

**Deepens:** the generated pools, which use `Math.random()` directly (`number-bonds.html`, `rnd` in every drill).
**Why:** A bug report of the form "it asked me 7+8 twice" cannot be reproduced. A seeded PRNG with the seed recorded per session makes every session replayable, and costs nothing when nobody needs it. It also makes F-43's self-test able to assert exact decks.
**Evidence:** `rnd` is `Math.floor(Math.random() * n)` in every drill; nothing seeds.
**Cost:** `O(1)` per draw (a linear congruential generator is fine). One number per session stored.
**Depends on:** F-41.

---

## F. Platform and topology

The structural changes that make the rest maintainable. These are listed last because they are prerequisites for several features above, not because they are least important.

### F-47 — One deck module, four consumers

**Deepens:** D-7.
**Why:** `freshFirst` exists six times and its signatures disagree. The maths consolidation moved four of five copies and left one behind — a consolidation that leaves one copy guarantees the next divergence. One module with `keyOf` as a required parameter (not a default) eliminates the class of bug that produced the division `keyOf` regression and D-2.
**Evidence:** six `freshFirst` definitions, five `markSeen`, three distinct signatures (`01-defects.md` D-7).
**Cost:** `O(1)` runtime; the cost is touching six files and re-running four probes.
**Depends on:** nothing. **Required before:** F-1, F-2, F-9.

### F-48 — Make `keyOf` required, not defaulted

**Deepens:** F-47.
**Why:** The division regression happened because `freshFirst` had a default (`f => f.a + '|' + f.b`) that was wrong for one caller. A default that is right for four of five callers is a default that will be wrong for the fifth. Requiring it makes the wrongness a load-time error.
**Evidence:** `maths-engine.js:46`, `:72` — both default to `a|b`.
**Cost:** `O(1)`. Five call sites gain an argument they already pass in three cases.
**Depends on:** F-47.

### F-49 — A single `esc` with an explicit context argument

**Deepens:** D-4.
**Why:** `'` belongs in an attribute value and not in a text node, which is why `spelling-bee.html:487` differs from the other eight copies. Encoding that distinction — `esc(text)` and `escAttr(value)` — is correct where a union is merely safe. `addition-quest.html:413`'s narrow copy then has no reason to exist.
**Evidence:** three semantics across eleven definitions (`01-defects.md` D-4); `spelling-bee.html:555` interpolates into `data-pair="..."`.
**Cost:** `O(1)`.
**Depends on:** nothing. **Required before:** F-31.

### F-50 — A page manifest that `session.js` and the hub both read

**Deepens:** `SUBJECTS` (`session.js:38-50`), `BY_GAME` (`:87-88`), and `index.html`'s card `data-key`/`data-bucket` attributes (`:201-488`).
**Why:** Three places encode the same fact — which games exist, which subject each belongs to, and which storage key and bucket each uses. They are kept in sync by hand. `SUBJECTS` lists 11 subjects; the hub has 16 cards; `BY_GAME` is derived from `SUBJECTS` and silently returns `undefined` for a game that is not listed (`session.js:203`: `const HERE = BY_GAME[FILE]`, and `start()` returns early if `HERE` is falsy, `:296`). A game missing from `SUBJECTS` therefore never marks its day complete and never reports an error.
**Evidence:** `session.js:38-50` vs `index.html:201-488`; the silent-undefined path at `session.js:203`/`:296`.
**Cost:** `O(g)` for g = 16 games, validated at load like `checkOrder()` already does (`session.js:70-81`).
**Depends on:** nothing. **This is the cheapest structural fix in the document** — it is a load-time assertion, and `checkOrder()` proves the pattern works.

---

## Dependency summary

| Feature | Needs |
|---|---|
| F-1, F-10, F-15, F-23, F-26, F-36, F-40, F-41, F-46, F-47, F-49, F-50 | nothing |
| F-2, F-3, F-16, F-42, F-45, F-48 | F-1 / F-47 |
| F-4, F-5 | F-1 |
| F-6, F-19, F-35 | F-5 |
| F-7 | nothing → enables F-8, F-30, F-38 |
| F-11 | F-5 |
| F-12 | F-11 |
| F-13 | F-1, F-2 |
| F-14, F-37, F-39 | F-13 / F-37 |
| F-17 | F-1 |
| F-18, F-33 | F-4 / F-17 |
| F-20 | F-5, F-12 |
| F-21, F-32 | F-17 |
| F-22 | F-44 |
| F-24 | F-23 |
| F-27 | F-11 |
| F-30, F-38 | F-7 |
| F-31 | F-44, F-42 |
| F-43, F-44 | F-42 |
| F-34, F-25, F-28, F-29 | nothing |

**Critical path:** F-47 → F-48 → F-1 → F-2 → F-13 → F-37 → F-39. That is one refactor, one argument, one schedule, one queue fix, and then the feature the README asks for.
