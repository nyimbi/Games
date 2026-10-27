# The Arcade

Sixteen games and a daily session page, each one a self-contained HTML file, with no build step,
no accounts, and no network. A child opens `index.html` — from a web server or straight from the
file system (`file://` works; nothing is fetched) — picks a game or follows today's session, and
every bit of progress lives in that browser's `localStorage` — and the session page can save all
of it to one JSON file and load it back, which is the only backup an offline page can offer.

Nothing here talks to a server, ever. That is the first rule of the arcade and every other rule
serves it. The folder also has its own git repository — see "This repository" at the end for what
that does and does not change.

**No third-party library is loaded, so there is nothing to vendor.** No framework, no bundler, no
icon font, no analytics, not even a polyfill. The runtime is the eighteen pages and the `.js`
files beside them. All eighteen were loaded from `file://` with the browser context forced
offline and every one initialised and stayed interactive; the same eighteen, served over HTTP,
make zero requests outside their own origin. If a future change needs a library, the answer is
still no network — copy the file into this folder and load it with a relative `<script src>`.

**The one exception is code we did not write, and it is a copy, not a dependency.** The 26
machines in `figures/` are April Zhu's Colorfigures demo figures, MIT-licensed, each already
built into a single self-contained file with its engine inlined. They are copied in whole,
unmodified, with the licence beside them; nothing is fetched and nothing is resolved at load
time. See "How Things Work" below.

---

## The folder

```
index.html             the hub: every game, grouped by subject
session.html           the daily pass: eleven subjects in one sitting
session.js             session state — plan, streak, completion, the alternation guard

── shared engines (hold the interaction; banks hold the content) ──
lang-engine.js         French, Kiswahili, Mandarin — one quiz engine, three vocabularies
science-engine.js      physics, chemistry — one quiz engine plus the lesson system
piano-engine.js        the piano course — staff renderer, keyboard, synth, play stage
maths-engine.js        the five maths drills — freshness deck, audio, confetti, lesson overlay

── content banks ──
spelling-bank.js       1,239 words in three tiers, each with a rule and an origin
french-bank.js         300 entries: words and sentences
swahili-bank.js        300 entries: noun classes
chinese-bank.js        300 entries: characters with pinyin and glosses
calligraphy-bank.js    the 440 characters and their stroke orders
calligraphy-sketch.js  hand-drawn pictograms and composition sketches
physics-bank.js        240 questions across 10 topics
chemistry-bank.js      240 questions across 10 topics
physics-lessons.js     ten physics lessons, one per bank topic, each with two figures
chemistry-lessons.js   ten chemistry lessons, one per bank topic, each with two figures
maths-lessons.js       twenty maths lessons, four per drill, keyed by the drill's id

── one page per game ──
number-bonds.html  addition-quest.html  subtraction-safari.html  times-table-academy.html
division-diner.html  infinite-arena.html            — maths (six decks, one subject)
typing-tutor.html    spelling-bee.html               — skills
french.html  swahili.html  chinese.html  calligraphy.html          — languages
physics.html  chemistry.html                                  — science
how-things-work.html  the machine shelf: one figure at a time, twenty-six on it
figures/              26 self-contained Colorfigures pages, one per machine, plus the MIT licence
docs/design.md        the design narrative: what each game teaches and why each
                      interaction is shaped the way it is
llms.txt              the one-screen orientation for an agent that has just arrived
dev-llms.txt          the implementation reference: state shapes, function index, defects
probes/               twenty-three Playwright probes run against the pages from file://
```

Which page loads what:

| Page | External scripts |
|---|---|
| `french.html`, `swahili.html`, `chinese.html` | own bank, `lang-engine.js`, `session.js` |
| `physics.html`, `chemistry.html` | own bank, `science-engine.js`, own lessons, `session.js` |
| `piano.html` | `piano-bank.js`, `piano-lessons.js`, `piano-engine.js`, `session.js` |
| `calligraphy.html` | `calligraphy-bank.js`, `calligraphy-sketch.js`, `session.js` |
| `spelling-bee.html` | `spelling-bank.js`, `session.js` |
| `how-things-work.html` | an iframe into `figures/`, `session.js` |
| the five maths drills | `maths-engine.js`, `maths-lessons.js`, `session.js` — the drill's own model inline |
| `infinite-arena.html` | `skills.js`, `session.js` — the engine is inline; the skill graph is data |
| `typing-tutor.html` | `session.js` only — carries its own engine inline |
| `index.html` | `session.js` — the hub reads every game's bucket, but never writes one |
| `session.html` | `session.js`, `backup.js` — the only page that saves or loads the record |

The split is deliberate: a page that carried its own 1,239-word bank inline would triple in size
and bury the engine. Content that is large and tabular is written as data; interaction that
differs only in vocabulary is written once.

## How it is put together

A game page carries its whole interface inline — CSS, mark-up, JS — and pulls in at most a bank
and an engine. There are four shapes:

**Maths decks.** Five drills plus `infinite-arena.html`. Each of the five declares
`const TOTAL = 50`; the arena has no fixed deck and offers 50, 20, 10 or Endless instead, because
its questions come from a weighted generator over fifteen skills rather than a pool. The deck is
the unit of completion. Question pools are *generated*, not stored — `poolFor(level)` for addition,
subtraction and division, `factsFor(mode, table)` for times tables, and the splits of each whole
for number bonds. Because no question is stored, none can be deleted; the deck size decides how
much of the generated space a session walks. A freshness map
(`seen: {bucket: {factKey: timestamp}}`) keeps unseen facts ahead of seen ones and stamps a fact
when it is served, not when the deck is built — quitting at question 3 spends three facts. Maps are
capped and drop their oldest entry, so they cannot grow without bound: 900 entries per level or
mode bucket in the five drills, 1,400 per tier in the spelling bee, 1,200 per bucket in the
language engine, 600 in the arena, which keys a single flat map. Calligraphy's map is bounded by
its bank (440 characters) and carries no cap; the science engine declares one and does not apply
it — see the defect list. A deck
shorter than its pool cycles rather than repeats, governed by a pass counter so the fill loop
cannot spin on a small pool — Make 10 has nine splits and three blank positions, and a deck is 50.

The five drills share `maths-engine.js`, which owns the freshness deck, the oscillators, the
confetti and the lesson overlay. What it does *not* own is the interaction: number bonds drag a
divider along a track, addition and subtraction animate base-ten blocks column by column, times
tables have an array you can step through, division deals cookies onto plates. Those are the
drills. An engine that owned them would have made five drills into one drill. The freshness key
stays per game — `whole|a` for bonds, `a|b` for the three column drills, `divisor|dividend` for
division — so each passes its own `keyOf`.

**Language decks.** `lang-engine.js` runs the French, Kiswahili and Mandarin pages at 30
questions each. The page supplies a bank, the completion target and a speech locale; the engine
holds queueing, answering, scoring and the tick that flips the page's `#done` element. The
spelling bee is its own engine — it declares `TOTAL = 50` plus a separate run length of 20 for its
"bee" mode, and carries the spelling bank's three tiers.

**Science decks with lessons.** `science-engine.js` runs physics and chemistry at 20 questions per
deck. Its lesson system is described below — the one mechanism the language engine lacks, because
a science fact without its concept is trivia.

**Calligraphy.** Also 20 per deck, but not a quiz engine: the child draws each stroke of a
character against the bank's authored stroke polylines, one stroke at a time, and the page carries
its own logic rather than loading `lang-engine.js`.

**The machine shelf.** `how-things-work.html` is not a quiz either, and has no deck. It shows one
of the 26 machines in an `<iframe>` — the figure is a whole page of its own, with its own camera,
shading and controls — and lets the child switch machines from a shelf below. The completion
marker is one machine met, which is the same unit as one deck: a sitting, not a score. See "How
Things Work" below.

Fifteen of the sixteen game pages toggle a single `#done` element when a deck ends;
`infinite-arena` shows a `#summaryPanel`. The session tracker reads whichever the page declares —
see "The three ways a page says 'finished'" below, which exists because that variety is a trap
for anyone extending the session.

### The five mechanisms every deck shares

Nearly all the code is per-page, but five pieces of logic recur almost verbatim across the
drills. Knowing them means you can read a new drill in a minute.

**`freshFirst(pool, bucket, keyOf)`** partitions the pool into unseen and seen, shuffles each
group, and sorts the seen group by timestamp ascending. Unseen facts come first, and among the
seen ones the least recently served comes first. It is the whole freshness policy, about twelve
lines.

**`markSeen(bucket, key)`** stamps `Date.now()` into `seen[bucket][key]` and evicts the oldest
entry once the bucket reaches `SEEN_CAP`. It is called from `renderQuestion`, not from the deck
builder — the stamp records what the child *saw*, not what the machine *planned*.

**`newCycle(pool, bucket, keyOf)`** re-sorts the pool by oldest-seen so the second pass through a
short pool starts with the facts that have waited longest.

**The fill loop** walks the ordered pool, pushes into the deck, and counts passes. On pass 0 a
fact may not appear twice at all; on later passes only an immediate repeat is forbidden. Without
that counter a pool smaller than the deck never terminates — the unconditional duplicate check
spins forever looking for a twenty-eighth unique question in a twenty-seven-card space.

**`noteFact(key, ok)`** maintains `review[key] = { n, miss, due }`. `n` counts every graded
attempt, `miss` counts wrong ones, and `due` is set on a miss and cleared on a correct answer.
`buildQueue` then pulls up to two due facts to the head of the next deck.

The stars ladder is also shared: `pct >= 90 → 3`, `pct >= 70 → 2`, otherwise 1. Finishing a deck
always earns at least one star, because the first star marks the act of finishing rather than the
accuracy of it.

## The daily session

`session.html` is not a game. It reads a fixed plan of eleven subjects, each mapped to its games,
and walks the child through one deck per subject per day: which subject, which game, done or not,
in order, with a streak and a 21-day history strip. The maths subject has six games and plays
the one that `dayNumber % 6` selects, derived from the date — nothing stored, nothing to drift.

**The order is not alphabetical and not arbitrary.** Five of the eleven subjects are languages —
spelling, French, Mandarin, Kiswahili, and calligraphy, which is Chinese character writing. Five
languages back-to-back is one skill practised five ways, so `lang` and `other` alternate for as
long as the counts allow:

  spelling · maths · French · physics · Mandarin · chemistry · Kiswahili · typing · calligraphy · piano · how things work

There are six `other` subjects and five languages, so perfect alternation is impossible while
spelling stays first — which it does deliberately, because it is the drill a child is most likely
to skip. The surplus `other` therefore sits beside another one, at the end, where piano and the
machine shelf are the two least alike things in the list.

Each subject carries a `kind` (`'lang' | 'other'`), and `session.js` throws at load if any two
`kind: 'lang'` subjects end up adjacent, or if the plan does not open on a language. A sixth
language added later would otherwise break the property silently.

Storage is one record, `arcade.session.v1`:

```json
{ "v": 1,
  "days": { "2026-10-21": { "done": { "maths": 1761042000000, "french": 1761042600000 } } } }
```

Trimmed to 120 days on write (`KEEP_DAYS`), keyed on the *local* date so a child finishing at
nine in the evening gets the day they actually played.

**How a deck becomes a tick.** `session.js` derives the page's subject from its own filename
(`location.pathname.split('/').pop()`, minus `.html`, looked up in `BY_GAME`), then installs one
`MutationObserver` on `document.body` filtered to the `class` and `hidden` attributes. On each
mutation it calls `check()`, which is inert unless `armed` is true — and `armed` is
`!isFinished()` at load, so reopening a summary you have already seen records nothing. The first
time the page's own completion marker appears, `mark(subjectId)` writes the day and a toast names
the next subject. `fired` guards against a second record in the same page load.

## The three ways a page says "finished"

| Shape             | Pages                                    | Element toggles |
|-------------------|------------------------------------------|-----------------|
| `.stage`          | French, Kiswahili, Mandarin, calligraphy, spelling bee, both sciences, how things work | `#done` gets class `on` |
| `.done`           | five maths drills, typing tutor           | `#done` gets class `show` |
| summary panel     | `infinite-arena.html` only                | `#summaryPanel` gets class `show` |

`session.js` does not guess. An element either declares `class="stage"` or `class="done"`, and
the page's own class name decides which marker means completion — because accepting either
marker on any page would let a class a game never uses count as a finished deck (`.stage.on` is
true on every stage game's *home screen*). If you add a game, it must declare one of these
shapes, and the session tracker will read it without further wiring.

The tracker exposes `window.ArcadeSession` — `SUBJECTS`, `plan()`, `progress()`, `mark()`,
`streak()`, `history(n)`, `dayKey`, `isFinished`, and a `here` getter for the page's own subject —
and every page loads `session.js` so finishing a deck can drop a toast that points at the next
subject. `mark()` is called by the tracker's own `MutationObserver` when it sees the page's
completion marker appear; nothing else calls it.

---

## The games, one by one

Each entry gives the storage key, how the deck is built, what happens on a right and a wrong
answer, and how the page signals completion. The *teaching* rationale for every game — why the
ten-frame replaced a bond diagram, why the carry row is hidden during practice, why the arena
decays mastery — is in `docs/design.md`; this section is the execution.

### 01 · Number Bonds — `number-bonds.html`

`arcade.bonds.v4` → `{ best, perMode, review, seen }`. `perMode` is keyed `'ten' | 'teen' |
'mixed'`; `review` is keyed `whole|a|blank`; `SEEN_CAP = 900`.

**Deck.** `TOTAL = 50`. `wholesFor(mode)` gives `[10]` for *ten*, `11…20` for *teen*, `5…20` for
*mixed*; for each whole `w` the pool enumerates every split `a = 1…w−1` with `b = w − a`. The
blank position is drawn per card, not per deck: `Math.random() < .3 ? 'whole' : (Math.random() <
.5 ? 'a' : 'b')`. Make 10 therefore holds nine splits × three blank positions = 27 distinct
cards against a deck of 50, which is exactly why the pass counter exists.

**Execution.** Three circles — whole, part A, part B — with the blank showing `?` and carrying
`.ask`. Typed input is compared with `Number(state.input) === answerFor(q)`. Right: `score += 10
+ Math.min(streak, 5) * 2`, `best` tracks the longest streak, auto-advance after 620 ms. Wrong:
streak resets, the hint is rewritten as the completed equation, and **Next** appears and takes
focus — nothing advances on a timer. The Show-me button paints a ten-frame of `whole` counters
(teal to the split, amber after) into `#drillFrame` and writes a hint that names what to count;
it never touches the input.

**Finish.** `#done.show`. `perMode[mode] = max(existing, round(right / 50 * 100))`.

**Explore tab.** A draggable two-segment bar, a clickable ten-frame (`Home`/`End`/arrows move
the split), and a ladder listing every split of the whole with the current one highlighted. All
three read and write the same `state.split`.

### 02 · Addition Quest — `addition-quest.html`

`arcade.addition.v3` → `{ best, perLevel, review, seen }`. `perLevel` is keyed `'bond' | '1' |
'2' | '3'`; `review` is keyed `level|a|b`; `SEEN_CAP = 900`.

**Deck.** `TOTAL = 50`, `LEVELS = ['bond', '1', '2', '3']`. `poolFor(level)` enumerates: *bond* is
the ten-pairs `a = 0…10, b = 10 − a` plus every split of `w = 5…12`; level 1 is `a, b = 0…9`
(100 facts); level 2 is `a, b = 10…99` (8,100 facts, fully enumerated); level 3 is **260 random
draws** of `a, b = 100…999` — sampled rather than enumerated, because the space is 810,000 and a
deck is fifty. Up to two due review cards are prepended, filtered to the level's own operand
range.

**Execution.** `stacked(a, b)` right-aligns the operands into column cells; `plan(a, b)` computes
the carry structure. The carry row is *hidden during practice* (`showCarry(false)`) and appears
only inside the worked solution or on the first two questions of a set. The bond level shows
`a + ? = sum` instead of a column sum. Judged by `Number(state.input) === q.sum`; right pays `10
+ Math.min(streak, 5) * 2` plus a level bonus (`+2` at level 2, `+4` at level 3) and advances
after 700 ms. Wrong reveals the worked columns, the carry row, and the Next button.

**Estimation.** From question 3 onward at level 3, `checkPlausible()` prints a dashed rounding
prompt before the answer is entered (*"580 is about 600…"*) and confirms it after a correct one.
It appears at level 3 only, because on `7 + 8` it would be noise.

**Finish.** `#done.show`; `perLevel[level]` keeps the max percentage; `#nextLevel` is populated
from the `LEVELS` index.

### 03 · Subtraction Safari — `subtraction-safari.html`

`arcade.subtraction.v3` → `{ best, perLevel, review, seen }`, `perLevel` keyed as in addition,
`SEEN_CAP = 900`.

**Deck.** `TOTAL = 50`. `poolFor(level)`: *bond* is `a = 10, b = 0…10` plus every split of
`w = 5…12`; level 1 is `a = 0…9, b = 0…a` (no negative results, so the pool is triangular rather
than square); level 2 is `a = 11…99, b = 1…a`; level 3 is 260 random `{a: 100…999, b: 10…a−10}`.
Same pass-counter fill as addition.

**Execution.** Vertical `#qTop`/`#qBot` padded to `String(q.a).length`. Judged by `Number(input)
=== q.diff`. A miss renders `workedFor()`, which prints the per-column borrow lines *and* the
jump-to-a-friendly-ten alternative beside them.

**Learn tab.** Two sliders choose `A` and `B`; a number line shows the gap as the answer, base-ten
blocks show the same quantity as rods and ones, and `borrowPlan(a, b)` returns the per-column
state after borrowing — which column lent, which digit fell, which gained ten. A stepper
(`prevStep`/`nextStep`/`Replay`) reveals that plan one column at a time, and at the borrow step
the lending rod glows and can be tapped to break it into ten ones. `animateBreak()` draws the
exchange. The stepper's Next still works, so the lesson is never blocked.

**Finish.** `#done.show`; `perLevel[level]` max percentage.

### 04 · Times Table Academy — `times-table-academy.html`

`arcade.times.v2` → `{ best, perMode, review, seen }`. The bucket key is `bucketKey()` =
`'table-' + table` when a single table is selected, otherwise the mode name; `review` is keyed
`a|b`; `SEEN_CAP = 900`.

**Deck.** `TOTAL = 50`. `factsFor(mode, table)` returns twenty facts `{a: table, b: 1…20}` when a
table is chosen, and otherwise the full product grid to `hi = 10` (mode `'1-10'`) or `hi = 20`.
A single table is twenty facts against a fifty-card deck, so it always cycles at least twice.
Review cards are filtered by the same `hi` and table membership.

**Execution.** `#qa × #qb`, typed product, `Number(input) === q.prod`. Right: `10 +
Math.min(streak, 5) * 2`, advance after 650 ms. Wrong: **there is no worked solution** — the hint
becomes `"a × b = prod. Say it once, then move on."`, which is deliberate for a retrieval drill
whose whole point is that the fact should be recalled rather than reconstructed. The Show-picture
toggle draws `a` rows of `b` dots and splits the array at `Math.min(5, b)` into two colour
blocks, so `7 × 8` reads as a 7 × 5 block plus a 7 × 3 block — the distributive property made
visible, split at five because five is the anchor children already have.

**Explore tab.** A factor bar selects 1–20; the array animates row by row with labels; a
skip-count strip highlights the current multiple; a 20 × 20 grid marks the current fact (`.hit`),
its square (`.sq`) and the commutative mirror (`.cross`). The grid is the argument: it is
symmetric, so every fact above the diagonal is one you already know from below it.

**Finish.** `#done.show`; `perMode[bucketKey()]` max percentage.

### 05 · Division Diner — `division-diner.html`

`arcade.division.v1` → `{ best, perLevel, review, seen }`. `perLevel` is keyed `'1-5' | '6-10' |
'11-20' | 'all'`; `review` is keyed `divisor|dividend`; `SEEN_CAP = 900`.

**Deck.** `TOTAL = 50`. `divisorsFor(level)` returns `[2,3,4,5]`, `[6…10]`, `[11…20]`, or `2…20`
— **divisor 1 is removed from every level**, because `n ÷ 1 = n` teaches nothing and wastes a
question. `poolFor` enumerates `d × q` for `q = 1…20`, so *all* holds 19 divisors × 20 = 380
facts.

**Execution.** `#qa` dividend over `#qb` divisor, hint `${divisor} × what makes ${dividend}?`,
judged on the quotient. Right advances after 650 ms; a miss fills `#worked` with the inverse
multiplication and its check. The picture toggle draws `divisor` plates each holding `quotient`
cookies — always available, at every level.

**Explore tab.** The child sets a cookie count and a plate count and presses deal; `deal()` moves
cookies onto plates one at a time in round-robin order, so equal shares are the *result* of
dealing rather than an assertion. A **Share / Group** switch runs the same animation with the
same numbers and ends at the same quotient; `pack()` is the grouping direction. Below the plates
the division is written as repeated subtraction with the remainder in its own colour, and after a
deal the four facts of the family appear together (`3 × 4 = 12`, `4 × 3 = 12`, `12 ÷ 3 = 4`,
`12 ÷ 4 = 3`).

**Finish.** `#done.show`; `perLevel[level]` max percentage.

### 06 · Infinite Arena — `infinite-arena.html`

`arcade.arena.v1` → `{ best, skill, seen, savedAt }`. **No `review` and no per-level bucket**;
`skill[k] = { ema, n, right }` initialised to `{ ema: .5, n: 0, right: 0 }`. `seen` is a single
flat map keyed `op|a|b`, capped at 600.

**No deck.** Fifteen skills in `SKILLS`, from `add-10` to `mixed`, each a generator closed over a
difficulty record (`DIFF`: easy/normal/hard/expert, scaling operand ceilings and multiplier
ranges). Six are enabled by default — `add-10`, `sub-10`, `add-1d`, `sub-1d`, `mul-low`,
`div-low` — because turning everything on meant a child met three-digit subtraction in the first
minute.

**Selection is weighted, not queued.** `weightFor(sk) = clamp(1 − ema, .05, 1)² + .05`, then
multiplied by `1 / (1 + served[sk] * .25)`. Squaring makes the weakest skill dominate rather than
merely lead; the `+.05` floor keeps a mastered skill from disappearing; the recency divisor stops
one weak skill from taking every question in a run. `chooseSkill()` does roulette over the
enabled set. `nextQuestion()` then rejects a key in the 200-entry `recentSet` ring buffer, and
rejects any key already in `seen` while the attempt counter is under 30 — a *soft* skip, because a
hard exclusion on a generator that legitimately repeats a skill would starve the run.

**Execution.** Judged by `Number(input) === q.answer`. Before judging, the EMA updates: `alpha =
n < 5 ? .45 : .22`, `ema = clamp(ema + alpha * (right − ema), .02, .99)` — fast early adaptation,
slower later. Right: `score += 10 + Math.min(streak, 8) * 3`, confetti every fifth streak,
advance after 520 ms. Wrong: streak resets, the hint is the fact written out, Next appears. The
whole state is saved after every answer.

**Forgetting.** On load, `ema += (0.5 − ema) * (days * 0.12)` with `days` capped at 7. A skill
mastered three weeks ago should not still read as mastered.

**Finish.** `endRun(reason)` on length reached or the Quit button; `#summaryPanel.show`. The
percentage is `correct / count` against the run's own length, not a fixed denominator.

### 07 · Typing Tutor — `typing-tutor.html`

`arcade.typing.v1` → `{ progress: { lessonId: bestAccuracy } }`. Nothing else is stored; the run
is not resumable and the timer modes leave no trace.

**Lessons.** Twelve in `LESSONS`, each `{ id, name, desc, lines }` with five lines of target text:
home row, home-row words, top row, top-row words, bottom row, bottom-row words, all three rows,
capitals, numbers, punctuation, common words, sentences. `buildText()` takes `lines.slice(0, 3)` —
a run is the first three lines joined, not all five.

**Unlocking.** `unlocked(i)` is `i === 0 || (progress[LESSONS[i-1].id] || 0) >= 80`. The lesson
picker renders every lesson with its disabled state and star count, so a locked lesson is visible
as locked rather than absent.

**Execution.** The target is painted as one `<span class="ch">` per character; the on-screen
keyboard colours every key by finger group (eight groups, left little through right little) and
marks the next expected key with `.next`. Input arrives through a visually hidden `<input
id="capture">` kept focused by a document-level listener — that is what makes a phone keyboard
work. Each `input` event drains `cap.value` through `typeChar`, which counts the keystroke, and
on a match increments `correct` and `pos`, flashes the key, and clicks. On a miss it increments
`errors` **and `keyErr[want]`** — the miss is recorded against the *expected* key, not the typed
one, which is what makes the diagnosis useful. Backspace is swallowed at `keydown`: a tutor that
lets you delete a mistake never sees one. Enter types a newline where the target has one.

**Scoring.** Accuracy is `round(correct / typed * 100)`; WPM is `(correct / 5) / elapsedMinutes`,
shown live but never used for stars. Stars are `95 / 85 / 80` on accuracy. `progress[id]` is
written **only when the text is completed**; letting the 30- or 60-second timer expire ends the
run without saving, so a timed run cannot inflate a lesson's best.

**Finish.** `#done.show`. `#nextLesson` appears only when the following lesson is unlocked.
The five worst keys are listed as chips (`k 4×`) from `keyErr`, sorted and sliced — the feature
that makes this a tutor rather than a metronome.

### 08 · Spelling Bee — `spelling-bee.html`

`arcade.spelling.v1` → `{ best, perTier, review, seen, tier }`. `perTier` keyed `'tier1…3'`,
`review` keyed by word with the usual `{n, miss, due}`, `seen` bucketed by `tier + ':' + mode`,
`SEEN_CAP = 1400`.

**Bank.** `window.SPELL_BANK`, 1,239 entries — tier 1: 315, tier 2: 379, tier 3: 545. Every entry
carries `w, say, pos, def, origin, ety, rule, sent, tricky, tier, pairs`. `pairs` is the
hand-written confusable list; 871 entries have an empty one, and every pair string names a word
that is itself in the bank.

**Decks.** `TOTAL = 50` for the drills, `BEE_RUN = 20` for the bee. `poolFor(tier)` filters the
bank to that tier; the bee filters to `tier >= state.tier` so a champion is never served
`pebble`. `buildQueue` seeds up to three due review words, then `freshFirst`, cycling with a
`guard` bound of `total * 400`.

**Four retrieval paths.** *Learn* is the study card — all four explanations at once, with speech
for the word and the sentence, and `pairchip` buttons that splice the confusable into the queue
at `index + 1`. *Spell it* speaks the word, shows the definition, and takes a typed answer. *Tell
them apart* offers four real words: the entry's own confusables first, then fillers from
`nearMiss()`, which scores other bank words on shared prefix, shared suffix, shared letters and
similar length, penalising tier distance by 3 per tier. Nothing is ever a misspelling — a
distractor that is not a word teaches the wrong form by showing it. *The Bee* speaks the word and
does not show it, offers the definition, the origin or a sentence as spendable clues, and gives
three lives; at zero the queue is truncated to the words actually attempted, so the percentage
denominator shrinks rather than reporting a score against words never asked.

**Judging.** Case-insensitive exact equality. A miss is pushed as `{ w, typed }` and de-duplicated
by word for the results list. `noteFact` clears `due` only when `r.n >= 2`, so a word missed once
and right once stays owed. Correct answers auto-advance after 900 ms (drill) or 1,000 ms (bee).

**Speech.** `pickVoice` prefers an en-GB/en-US voice by name (female, Google, Samantha), and
`sayWord` speaks the word twice 700 ms apart at rate 0.78; sentences run at 0.88. Every path is
gated on `'speechSynthesis' in window` and wrapped in `try/catch`. There is no visual fallback —
the Bee's card says "The word is spoken", and on a browser without synthesis it goes quiet.

**Finish.** `show('done')` toggles `#done` to `.on`. Results show accuracy, stars, and the missed
words with what was actually typed.

### 09 · French — `french.html`

`arcade.french.v1` → `{ best, perTier, review, seen, tier }`, run by `lang-engine.js` at
`total: 30`. The bank stores the article, not the gender: `fr` is `le chat`, and `gender` is
derived from the article at build time so the gender drill can ask the question.

**Modes.** `learn`, `gender`, `fr2en`, `en2fr`, `sentence`. `cfg.pool(mode, entry)` restricts the
gender deck to nouns — `mode !== 'gender' || isNoun(e)` — because a mode that can only ask about
nouns must draw from nouns. The sentence mode blanks the headword out of `ex_fr` and offers four
words from the same family and tier, so the answer is chosen by grammar rather than by memory of
which sentence went with which word.

**Execution.** `renderQuestion` builds either a button row or a typed input plus the accent row;
`check` returns `true`, `false`, or the string `'accent'`. An accent-only miss is reported as
*"right word, wrong accents"* and the card shows the accented form — marking it wrong teaches
nothing, and marking it right teaches that accents do not matter. Every option list is shuffled;
the article and tone drills originally put the answer first on every card.

**Finish.** `show('done')` → `#done.on`.

### 10 · Kiswahili — `swahili.html`

`arcade.swahili.v1`, same engine, same shape. **Modes.** `learn`, `class`, `sw2en`, `en2sw`. The
class drill is the one that matters: noun class governs agreement across the whole sentence, so
the bank stores `class` on nouns only and `cfg.pool` keeps the class deck to `e.pos === 'noun' &&
!!e.class`. Pronunciation is written for an English reader (`asante` → `ah-SAHN-teh`) and that
`say` field is also the fallback for speech on a machine with no Kiswahili voice.

**Finish.** `#done.on`.

### 11 · Mandarin — `chinese.html`

`arcade.chinese.v1`, same engine. **Modes.** `learn`, `tone`, `zh2en`, `pinyin`, `pick`. Tone is
stored as a list (`[2, 5]` for `yéye`) because a tone is a separate fact from a spelling, and the
tone drill asks for the contour rather than the romanisation. The `pinyin` mode carries a
24-key accent row of tone-marked vowels, since a phone keyboard cannot type them. `pick` shows
four hanzi and one reading.

**Finish.** `#done.on`.

### 12 · Calligraphy — `calligraphy.html`

`arcade.calligraphy.v1` → `{ best, perTier, review, seen, tier }`. No engine: this page carries
its own matching logic, because a stroke is not a multiple-choice answer.

**Data.** `window.CALLIGRAPHY_BANK`, 440 characters: `char, pinyin, meaning, tier, rank, strokes,
radical, decomp, hint, kind`, where each stroke is `{ name, pts, hint }` and `pts` is a polyline
of `[x, y]` pairs in a 0–100 box. `window.CALLI_SKETCH` maps characters to hand-drawn SVG
pictograms.

**Deck.** `TOTAL = 20`, `freshFirst` over the tier pool. There is no due-first injection here, so
a missed character returns only when its turn comes round again.

**Execution.** `renderStroke()` emits each authored stroke as an SVG polyline with round caps;
guide strokes are cinnabar, dashed, 85% opacity. Pointer and touch samples come through
`pointFrom()` (0–100, one decimal, clamped) and `moveDraw` drops samples closer than 1.2 units.
On `endDraw`, `scoreStroke()` resamples **both** the drawn stroke and the target to 16 points of
equal arc length — so the comparison is of shape, not speed or scale — and passes it when the
mean point distance is under 9 **and** the endpoint error is under 16. The endpoint term is the
entire direction check: a backwards stroke covers the same pixels and fails on point 15.

Each accepted stroke scores 6, extends the streak, and advances `state.step`. A wrong stroke
resets the streak and records the miss as `char + ' stroke ' + n`. When `step` reaches
`strokes.length` the character is complete: `right++`, the ghost character is revealed, the Next
button appears, and confetti fires.

**Finish.** `#done.on` when the twenty-character deck ends.

### 13 · Physics and 14 · Chemistry — `physics.html`, `chemistry.html`

`arcade.physics.v1` / `arcade.chemistry.v1` → `{ best, seen, review, perTier, tier, taught }`,
run by `science-engine.js` at `total: 20`. 240 questions each across ten topics. `seen` is keyed
`t< tier>:<mode>` and maps question text to a timestamp; `review` is keyed by question text;
`taught` is `{ topicId: true }`.

**Modes.** `quiz` builds four options from `[q.a, q.d1, q.d2, q.d3]`, de-duplicated by value and
shuffled, judged by strict equality against the button's `data-opt`. `work` takes free text and
judges it with `gradeTyped`.

**How a typed answer is judged.** `num()` pulls the leading number, reading scientific notation
whole so the mantissa of `6.02 × 10²³` is not the answer to anything. `isQuantity()` gates the
numeric path: a quantity is a number followed by a unit and nothing else, with no comma, operator
or arrow — because `2,8,7` is an electron configuration and `2, 1, 2` is a set of coefficients,
and read through `num()` they would collapse to 287 and 212. In the chemistry bank that moves 186
of 240 answers onto the text path. `gradeTyped` then allows `max(2% of the answer, 0.05)`, and
compares the unit separately: `"N, to the right"` asks for newtons, superscripts compare as plain
digits because a phone keyboard has no `²`, and a right number with the wrong unit returns
`{ ok: false, unitOnly: true }` so the feedback can say *"The number is right; the unit is not"*
rather than marking the whole thing wrong.

**Distractors are diagnoses.** On a wrong choice the engine looks up which of `d1`/`d2`/`d3`
matched and prints `q.trap` — the name of the error that produces it. A wrong answer that says
*"Adding the forces because both are given"* teaches more than a red cross.

**Finish.** `show('done')` → `#done.on`. Stars on the shared 90/70 ladder; `perTier[tier]` keeps
the max.

### 15 · Piano — `piano.html`

`arcade.piano.v1` → `{ best, seen, review, perTier, tier, taught, piecesDone }`, run by
`piano-engine.js` at `total: 20`. 181 questions across ten topics, plus eight pieces.

This is the one game that makes a sound, and it does it without a single asset. Pitch is
synthesised from oscillators: `playNote` runs a sine for the body and a quieter triangle an octave
up for the attack, both decaying. A chord is those notes offset by 35 ms so the attacks are
audible separately; a sequence is the same, stepped by `60/bpm`. Nothing is fetched, so the
offline guarantee is unchanged — the cost is timbre, which is the right thing to pay.

**Three ways to answer, one bank.** The mode decides the channel, not the question:

| Mode | What the learner sees | Pool |
|---|---|---|
| `read` | the staff, drawn | every question |
| `hear` | a play button, staff hidden | questions with `play[]` |
| `find` | the staff, and a keyboard to press | questions with a single `midi` |

`hear` hides the staff deliberately: showing it would put the answer on screen and the ear would
never be used. `find` compares **pitch class**, not MIDI — the keyboard spans two octaves and a
learner who presses C5 for a C4 question has answered the question that was asked.

**The staff is computed, not drawn by hand.** Every vertical position comes from the note's
diatonic index — lines and spaces, not semitones — so C and C♯ share a position and differ by the
accidental in front. `positionOf()` derives the words ("in the third space") from the same index,
which is why the explanation beside a question cannot disagree with the picture above it. Ledger
lines are drawn at every even step outside the staff between it and the note, so a note two
ledgers above gets two lines rather than one floating one.

**Distractors are the mistakes.** A note question offers the letter a second away, the one a third
away, and the octave. An interval offers the semitone either side and the third — major versus
minor is the confusion learners actually have. A chord offers the same root with the wrong
quality. Choosing one prints `q.trap`, the name of the error, as in the science games.

**The play stage.** A piece is `{ id, title, note, notes: [{m, b}] }` — MIDI and beats, nothing
else. The stage shows a nine-note window, lights the key that comes next, and waits. Nothing is
timed: a learner who is slow is still playing it right, and a metronome they cannot keep up with
teaches guessing. A wrong key shakes the prompt and does not advance; the piece ends when the last
note is pressed, and `piecesDone[id]` keeps the best accuracy.

**Finish.** `show('done')` → `#done.on`, the same marker as physics and chemistry.

### 16 · How Things Work — `how-things-work.html`

`arcade.howthingswork.v1` → `{ v, explored: {slug: ts}, perGroup: {group: pct}, day }`. No `best`
and no `review`: a shelf is visited, not scored.

**The shelf.** A manifest of 26 machines in six groups, each entry carrying the author's slug,
number, title, group, hint and (where one exists) idea line. The featured machine is
`dayNumber() % 26` walked forward to the first un-explored one — derived from the date and the
explored map, never stored.

**Execution.** One machine at a time in an `<iframe>` at a fixed 820 px (740 px on a phone). The
shelf below lists the other 25 by group, with a per-group percentage. Pressing **I've had a go**
writes `explored[slug]` if absent, sets `day` to today's local date, repaints, and reveals the
done stage. `paintButton()` disables the button for the rest of the day, because one machine met
is the day's sitting.

**Finish.** `#done.on`, and only for today: `day` is what stops a revisit counting as a second
sitting, and the tracker's `armed = !isFinished()` stops a reload from recording at all.

### The lessons — `physics-lessons.js`, `chemistry-lessons.js`

Ten lessons per subject, keyed by bank topic id. Shape:
`{ title, why, rule, beats[2–3], example{q, steps[2+], a}, remember, trap, figs[2]{cap, svg} }`.

**When a lesson appears.** `render()` checks `q.topic && lessonFor(q.topic) && !state.taught[q.topic]`
and, on a first encounter, paints the lesson *instead of* the question. That is the whole
scheduling policy: the lesson arrives immediately before the first question that needs it, never
as a preamble to the deck. A deck of twenty crosses many topics, and a wall of ten lessons before
question one teaches each idea too far from the moment it is used.

**Resume.** `paintLesson(topic, resume)` records the intent. `afterLesson()` sets `taught[topic] =
true`, saves, and dispatches: `'keep'` returns to the same question with an already-given answer
preserved (the *Teach me this* button); `'render'` re-renders the question (the automatic
pre-question lesson); anything else goes home.

**Chips.** Each topic chip on the home screen carries a `.tick` if taught, a `.new` badge if a
lesson exists and has not been read, and nothing if the topic has no lesson. Pressing a chip
builds a shuffled, capped queue for that topic and starts a quiz.

**Figures.** Two inline SVGs per lesson, injected as markup with only the caption escaped.
Inline is not a preference — an `<img src>` would break the offline guarantee — and they are
authored in the page's own palette and geometry so they read as part of the paper arcade.

**The lessons are written, not derived.** A lesson generated from the bank would hand over the
answer to every question drawn from it; one generated from the explanations would be a list of
answers with the questions stripped off. The worked example deliberately uses numbers the bank
never asks.

### The maths lessons — `maths-lessons.js`

Twenty lessons, four per drill, keyed by drill id and then by topic id. Same shape as the science
lessons. Two differences, both forced by the games.

**They are not scheduled.** The science engine paints a lesson *instead of* the first question on
a topic, which works because a science deck is drawn from a bank with topics. A maths drill has no
topics — it has a mode, and its questions are generated. There is no moment at which a lesson is
"the first one about this", so the drill never interrupts itself. Instead every drill grows a
**Learn** button in the bottom-right corner, and the lesson is a dialog the child opens when they
want it, or when an adult points at it.

**The dialog is not a stage.** The five drills have five different stage machines — `#stage`,
`.stage`, four tabs, none at all — so a shared engine that guessed where to paint would have been
wrong on three of them. A fixed-position dialog sits over whatever the page is doing and leaves it
alone. It injects its own stylesheet rather than asking five palettes to agree, because a lesson
should look like the page it is on.

The topic picker is the part that matters: a child stuck on remainders should not have to read
four lessons to find the one about remainders. The worked example in each lesson uses numbers the
drill does not ask, for the same reason as the science lessons — reading a lesson must never be a
rehearsal of the next question.

---

## Storage contract

| Key                        | Lives on          | Shape                                             |
|----------------------------|-------------------|---------------------------------------------------|
| `arcade.session.v1`        | every page        | `{ v, days: { 'YYYY-MM-DD': { done: {...} } } }`  |
| `arcade.addition.v3`, `arcade.bonds.v4`, `arcade.subtraction.v3`, `arcade.times.v2`, `arcade.division.v1` | the five maths drills | `{ best, perLevel or perMode, review, seen }` — `perLevel` for addition, subtraction, division; `perMode` for bonds and times tables |
| `arcade.arena.v1`          | infinite-arena    | `{ best, skill, seen, savedAt }` — no `review`; the arena has no per-fact record |
| `arcade.typing.v1`         | typing tutor      | `{ progress: { lessonId: bestAccuracy } }` — 80% unlocks the next lesson |
| `arcade.spelling.v1`       | spelling bee      | `{ best, perTier, review, seen, tier }`            |
| `arcade.french.v1` / `arcade.swahili.v1` / `arcade.chinese.v1` | language pages | `{ best, perTier, review, seen, tier }`; `review` holds `{n, miss, due}` per entry — attempts, misses, and whether it is owed |
| `arcade.calligraphy.v1`    | calligraphy       | `{ best, perTier, review, seen, tier }`            |
| `arcade.physics.v1` / `arcade.chemistry.v1` | science pages | `{ best, seen, review, perTier, tier, taught }`, where `taught` is `{topic: true}` |
| `arcade.piano.v1`          | piano             | `{ best, seen, review, perTier, tier, taught, piecesDone }` — `piecesDone` is `{pieceId: bestAccuracy}` |
| `arcade.howthingswork.v1`  | how things work   | `{ v, explored: {slug: ts}, perGroup: {group: pct}, day }` — no `best` and no `review`; the shelf has no score |
| `arcade.lastplay`          | `index.html` only | `{ './page.html': timestamp }` — what the suggestion lane sorts on |

Every `review` is `ArcadeDeck.noteAttempt`'s entry per fact key: `{n, miss, ok, lastAt, nextAt,
due}`, plus `{ms, spd, base}` when the page measures answer latency. `nextAt` is the schedule —
a miss sets it to now, a success pushes it out along `LADDER`. `due` is kept in sync so a record
written by an older build still reads. The arena is the exception: it keeps no `review` at all. The machine shelf keeps neither —
`explored` is the whole record, and `day` is the local date it was last marked.

Two rules are invisible but binding. Every key is namespaced with the game and a version, and the
version is bumped when the shape changes — never reused with a new meaning. The suffix is the
schema *generation*: bumping it abandons the old record, which is why `backup.js` stores raw
strings and a bump should ship a migration rather than a new suffix. And the `taught` map
rides the same record as the freshness map, so a learner who has read ten lessons keeps that
credit whatever happens to their streak. Every one of these writes sits inside a `try`/`catch`:
a full quota must cost a save, not the game.

**How the hub reads it.** Each card in `index.html` declares `data-key` and `data-bucket`.
`bestPct()` reads that key with `{ version: 0, stash: false }` — it cannot know seventeen games'
schema versions and must not add to the corrupt stash it is only looking at — and hands the bucket
to `ArcadeDeck.mastery`, which takes the strongest value (`v.ema * 100` for the arena's shape) and
decays it toward 50% by 0.12 per whole day away, capped at 7. The stars are then the same 90/70
the games use. A best-ever is a score; the shelf shows an estimate of what the child can do now. So a game's card is correct without the game telling the hub anything, and a new game
only has to declare the two attributes.

## Rules any change must keep

- **No network.** No fetch, no CDN, no font file, no icon font. If a diagram is needed, inline
  SVG. If data is needed, a `.js` file beside the page.
- **Escape anything that passes through `innerHTML`.** `esc()` is defined in both shared engines
  (`lang-engine.js`, `science-engine.js`) and in the pages that interpolate bank text
  (`addition-quest`, `calligraphy`, `chinese`, `french`, `spelling-bee`, `swahili`, `piano-engine`). The maths and
  typing pages interpolate only numbers and strings authored in the page itself, so they carry no
  `esc()` — if you start interpolating a word, an error string or anything a learner typed, add
  one first. The SVG figures are the one sanctioned exception, because authored figure markup
  needs to be markup; their captions are still escaped.
- **Completion is the page's own decision.** Read the marker the page declares; never assume
  `.on` means finished.
- **Decks are 50** unless the game's design document says otherwise, and the freshness rules above
  are what make 50 work — an unbounded or unshuffled deck trains recall, not the table.
- **`localStorage` writes are bounded.** Caps and trims exist because a record a child's browser
  cannot write is a record that silently never saves.
- **Order of subjects asserts itself.** Adding a subject means choosing a `kind` and keeping the
  alternation; the guard in `session.js` will say if you have not. With six `other` subjects and
  five languages, strict alternation is impossible while the plan opens on spelling, so exactly
  one `other`-`other` pair is expected — at the end. A sixth language would make the alternation
  impossible and the guard will say so.
- **A frame is a page, not a component.** Anything dropped into `how-things-work.html` runs as a
  whole document with its own `:root` and its own `document.body`; keep it in an iframe and do not
  try to reach into it, because `file://` will not let you.
- **Design says paper, not glass.** Cream and ink, 2.5 px borders, hard offset shadows, nothing
  that glows or floats. The shared tokens are `--paper:#fdf7ea`, `--ink:#191c3a`,
  `--ink-2:#343a63`, `--muted:#6d7194`, `--card:#fffdf8`, `--line:#e7dcc4`, the accent family
  (`--sun`, `--coral`, `--teal`, `--indigo`, `--grape`, `--lime`, `--sky`, and the per-subject
  `--french`, `--swahili`, `--cinnabar`, `--physics`, `--chem`, `--works`), and
  `--hard:6px 6px 0 var(--ink)`. Feedback colours are `--good:#1e9e6a` / `--bad:#e5484d` on
  eleven pages; `number-bonds.html` and `times-table-academy.html` use the darker
  `--good:#127d54` / `--bad:#c53030`; `spelling-bee.html` signals a miss with `--coral` instead of
  a `--bad` token at all — three spellings of the same idea, so check the page you are editing
  rather than assuming the shared one. `--accent` is per-page: `#2f6fd0` on physics,
  `#1e8f6a` on chemistry, `#a4581b` on how things work, and a per-card
  `var(--teal)`/`var(--indigo)`/… on the hub. The full
  rationale is in `docs/design.md` — why cream over white, why `ui-rounded`, why `1.05rem`, why
  confetti is the only spectacle and `prefers-reduced-motion` bounds it.

  The machine figures are the one place this system does not reach, and deliberately: they are
  third-party work with their own warm paper (`#f2efe7`), monospace type and paper texture. The
  frame around them is the arcade's, so the difference reads as a window into another object
  rather than a page that lost its styles.

  `index.html` once also defined `--soft:0 22px 48px rgba(25,28,58,.14)`. It is gone: nothing used
  it, and a blur shadow has no place in a system that has none.

## Plans and methods

The arcade is finished in the sense that all eighteen pages work, and unfinished in the sense
that it is a teaching artefact with a design thesis that can always be tested harder. What
follows is how changes get decided, so a new contributor does not have to guess.

**The method is: find the defect in the child's head, not in the code.** Almost every entry in
`docs/design.md` records a rewrite that was correct code and wrong teaching — the bond diagram
that was accurate and inert, the carry row that asked the child to copy a digit, the picture
toggle that vanished exactly when the numbers got hard, the arena that told a mastered child to
stop. The pattern to follow when adding anything: state what the child has to *do*, and check
that the screen makes that thing the easiest thing to do. If a support is only available at easy
levels, it is missing where it is needed.

**What is deliberately absent** — do not add these without a design argument that overturns the
existing one: accounts and sync; leaderboards; streaks that punish absence; time pressure in the
drills (the typing tutor's optional clock is the only one); a score on the machine shelf.

**The likely next units, in the order the design argues for them:**

1. **More lessons where a fact is not self-explanatory.** The science lesson system is the
   strongest mechanism in the arcade. Physics, chemistry and the five maths drills have it;
   calligraphy has per-stroke hints but no lesson. The maths lessons are opened rather than
   scheduled — a drill has no topics to hang an automatic lesson on — so the next question is
   whether a drill could notice what a child keeps getting wrong and offer the one lesson that
   covers it.
2. **A second sitting on the machine shelf.** The shelf currently records a visit; the figures
   expose more than a visit uses. Anything added must stay derived from the figures rather than
   described by the wrapper — a second source of truth the figures cannot correct is the one
   thing this page must not grow.
3. **Content, not mechanism.** The engines are done. The banks are 300 / 300 / 300 / 440 / 1,239 /
   240 / 240; growing them is the cheapest improvement available and requires no code.
4. **The nested-repository split**, described at the end of this file. It is the one piece of
   housekeeping that gets more expensive the longer it waits.

**Defects found while documenting, and fixed** — each was small, none changed what a child
learns, and all ten now have a regression probe:

- `science-engine.js` declared `SEEN_CAP = 1200` and never applied it; it now calls `markSeen()`,
  which evicts the oldest entry the way the language engine does.
- The science engine never reset `#qHintBox` between questions; `render()` now hides and clears it.
- The `#lHome` button in `physics.html` and `chemistry.html` had no listener. It now leaves the
  lesson without marking the topic taught, and returns to the quiz when the lesson was opened with
  *Teach me this*.
- `calligraphy.html` set `state.traceMode` and never read it, so trace and order were identical.
  The ghost is now populated from the character, shown from the first stroke in trace mode and
  only on completion in order mode.
- `spelling-bee.html`'s `startStudy()` reset `index` and `mode` but not `right` or `misses`, so a
  study deck that ran to its end persisted the previous mode's percentage. It resets the tally.
- `spelling-bee.html` defined `differPool()` and `hasConfusable()` and called neither; both are
  removed, and the differ drill fills its options with `nearMiss()` as designed.
- `infinite-arena.html` initialised `state.length = 10` while the markup marked the **50** button
  `aria-pressed="true"`; the default is now 50.
- `swahili.html` and `chinese.html` each carried a branch testing `mode === 'en2fr'` that called a
  function defined in neither file; the dead branch is gone.
- `favicon.svg` was referenced by no page. It is redrawn in the arcade's own palette and every page
  now declares it.
- `index.html` defined `--soft`, a blur shadow in a system that has none; it is removed.

## Verifying a change

The arcade has no test framework by design; it is checked by driving real pages in a real
browser. The pattern that has caught every regression so far: serve the folder on a private port,
drive it with Playwright, and inspect what actually landed in the DOM rather than what the state
vars claim:

```python
import threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

Handler = functools.partial(http.server.SimpleHTTPRequestHandler,
                            directory='<this folder>')
class Q(socketserver.TCPServer): allow_reuse_address = True
srv = Q(('127.0.0.1', 8830), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
# … playwright navigates to http://127.0.0.1:8830/<page>.html and asserts
```

What to check for any change, in this order: the page loads with **no page errors**; it makes
**no external requests** (wire a `request` listener — one stray CDN is a broken guarantee); every
newly-taught or newly-added feature is `>= 2` wide where the design says so; and **no figure
overflows its card at 390 px**, the phone width the arcade is designed for first.

Three probes worth keeping in your head, because each has caught something:

- **Served over HTTP**, assert every request URL starts with the served base, and assert
  `document.documentElement.scrollWidth <= clientWidth` at 390 px. That overflow check is what
  found `times-table-academy`'s explore grid: `1fr` is `minmax(auto,1fr)`, so the grid column took
  the multiplication table's min-content width and the `overflow:auto` wrapper inside it never got
  a chance to scroll. `minmax(0,1fr)` fixes it. A grid child that contains a wide table needs the
  explicit zero minimum.
- **Loaded from `file://` with `context.set_offline(True)`**, assert the page still initialises.
  A grep for `fetch(` cannot see a `<link>` to a CDN; the browser can.
- **For a page that frames another**, check the frame separately: navigate the top page, take
  `page.frames[-1]`, and assert the inner document has its `<svg>` and its buttons. A top-level
  "no page errors" says nothing about a frame that failed to mount — a frame that renders blank
  throws nothing in its parent.

Canary a probe before trusting it: plant a `<link rel="stylesheet" href="https://cdn...">`
in a page and confirm the probe fails, then remove it; for the overflow probe, set a fixed
`width:1200px` on a grid and confirm the 390 px check trips. A network check that has never seen a
network request is not a network check, and neither is an overflow check that has never seen a
page wider than its viewport.

The three failure modes worth hunting for by name, because they are the ones this codebase has
actually produced:

1. *A predicate that is a strict subset of what it tests* — accepting either completion marker is
   the canonical case.
2. *A gate that passes on a construction error* — a probe whose fixture broke reads as a suite
   that failed wholesale; read the failure reason, not the count.
3. *Colliding names* — a `.note` class meaning one thing in a step row and another thing on the
   page as a whole; an id the game and the tracker both use.

## Contributing

There is no build, no install, and no test runner. The loop is: serve, edit, drive, canary,
commit.

1. **Serve.** `python3 -m http.server 8080 --directory <this folder>`. The pages also open from
   `file://`, but a served copy is what you want for the request listener.
2. **Edit one page at a time.** A page is CSS, markup and JS in one file, so the whole change is
   one diff. If you are adding a game, copy the shape of the nearest one rather than inventing a
   structure — the five shared mechanisms above are what make a new drill cheap.
3. **Run the probes.** No page errors, no external requests, no overflow at 390 px, and — if you
   touched a completion marker — that the tracker still records the subject. Check the tracker
   explicitly: load the page, play to the summary, assert `arcade.session.v1` gained the subject
   id, then reload and assert it did *not* record a second time.
4. **Canary the probe you just wrote.** Plant the defect it is meant to catch, watch it fail,
   restore the file from a backup, and confirm the file is byte-identical. A probe that has never
   failed is not a probe.
5. **Bump a storage version if the shape changed**, and never reuse a key with a new meaning.
6. **Update the docs you invalidated.** A new game means: a card in `index.html` with `data-key`
   and `data-bucket`, a subject entry in `session.js` with the right `kind`, a row in the storage
   table here, a section in `docs/design.md` saying what it teaches and why the interaction is
   shaped that way, and an entry in `llms.txt`.
7. **Commit in the arcade repository**, not the parent — see below.

## This repository

This folder has its own `.git`, on branch `main`, with **no remote configured** and no upstream —
commits made here stay local until a remote is added. Serve it:

```
python3 -m http.server 8080 --directory <this folder>
```

or drop the folder behind any static server; no config, no proxy paths, no MIME surprises beyond
the ordinary ones. Its history starts at "Add the arcade: six number games, a typing tutor, and a
design note" and carries every later arcade commit with its own hashes, independent of the
parent's.

**It is not a subtree split, and the surrounding checkout still tracks it.** The parent repo
(`github.com/nyimbi/Games`) has `frontend/public/arcade/` in its index as ordinary files — 32
blobs, staged and tracked — while the same directory is an independent repository. That means:

- `git status` in the parent shows arcade edits as normal modifications, and a `git add` there
  writes a *second* copy of arcade history with different hashes. The two copies have already
  drifted: the parent's `README.md` and `llms.txt` at HEAD are the pre-split versions, one commit
  behind this repo's.
- `git status` in the arcade repo is the authoritative one for arcade work.

Until one side gives way, treat the nested repo as the source of truth and do not commit arcade
files from the parent. The two clean endings are a real `git subtree split` plus `git rm -r
--cached` on the parent, or dropping the nested `.git` and working only in the parent. Pick one
before the histories diverge further.

The parent app serves these files from the same path (`frontend/public/` is Next.js's static root),
so `/arcade/*.html` keeps working there; a clone of the arcade repository alone runs the whole
arcade, because nothing here refers outside the folder.
