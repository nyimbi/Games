# The Arcade

Fourteen games and a daily session page, each one self-contained HTML, with no build step, no
accounts, and no network. A child opens `index.html` — from a web server or straight from the
file system (`file://` works; nothing is fetched) — picks a game or follows today's session, and
every bit of progress lives in that browser's `localStorage`.

Nothing here talks to a server, ever. That is the first rule of the arcade and every other rule
serves it. The folder is meant to be lifted out as its own repository wholesale; it is already
self-contained, including the design narrative in `docs/design.md`.

---

## The folder

```
index.html             the hub: every game, grouped by subject
session.html           the daily pass: nine subjects in one sitting
session.js             session state — plan, streak, completion, the alternation guard

── shared engines (hold the interaction; banks hold the content) ──
lang-engine.js         French, Kiswahili, Mandarin — one quiz engine, three vocabularies
science-engine.js      physics, chemistry — one quiz engine plus the lesson system

── content banks ──
spelling-bank.js       the thousand words, graded
french-bank.js         words and sentences
swahili-bank.js        noun classes
chinese-bank.js        characters with pinyin and glosses
calligraphy-bank.js    the 440 characters and their stroke orders
calligraphy-sketch.js  hand-drawn pictograms and composition sketches
physics-bank.js        physics questions, by topic
chemistry-bank.js      chemistry questions, by topic
physics-lessons.js     ten physics lessons, each with two figures
chemistry-lessons.js   ten chemistry lessons, each with two figures

── one page per game ──
number-bonds.html  addition-quest.html  subtraction-safari.html  times-table-academy.html
division-diner.html  infinite-arena.html            — maths (six decks, one subject)
typing-tutor.html    spelling-bee.html               — skills
french.html  swahili.html  chinese.html  calligraphy.html          — languages
physics.html  chemistry.html                                  — science
docs/design.md        the design narrative: what each game teaches and why each
                      interaction is shaped the way it is
```

The split is deliberate: a page that carried its own thousand words inline would triple in size
and bury the engine. Content that is large and tabular is written as data; interaction that
differs only in vocabulary is written once.

## How a game is built

A game page carries its whole interface inline — CSS, mark-up, JS — and pulls in at most a bank
and an engine. There are three shapes:

**Maths decks.** Five drills plus `infinite-arena.html`. Each declares `const TOTAL = 50`; the
deck is the unit of completion. Question pools are *generated*, not stored — `poolFor(level)`
for the four operations, `factsFor(mode, table)` for times tables, the splits of each whole for
number bonds. Because no question is stored, none can be deleted; the deck size decides how much
of the generated space a session walks. A freshness map (`seen: {bucket: {factKey: timestamp}}`)
keeps unseen facts ahead of seen ones and stamps a fact when it is served, not when the deck is
built — quitting at question 3 spends three facts. Maps are capped and drop their oldest entry,
so they cannot grow without bound. A deck shorter than its pool cycles rather than repeats,
governed by a pass counter so the fill loop cannot spin on a small pool.

**Language decks.** `lang-engine.js` runs the French, Kiswahili and Mandarin pages at 30
questions each. The page supplies a bank, the completion target and a speech locale; the engine
holds queueing, answering, scoring and the tick that flips the page's `#done` element. The
spelling bee is its own engine — it declares `TOTAL = 50` plus a separate run length for its
"bee" mode, and carries the thousand-word bank's grading.

**Science decks with lessons.** `science-engine.js` runs physics and chemistry at 20 questions per
deck. Its lesson system is described below — the one mechanism the language engine lacks, because
a science fact without its concept is trivia.

Thirteen of the fourteen game pages toggle a single `#done` element when a deck ends;
`infinite-arena` shows a `#summaryPanel`. The session tracker reads whichever the page declares —
see "The three ways a page says 'finished'" below, which exists because that variety is a trap
for anyone extending the session.

## The daily session

`session.html` is not a game. It reads a fixed plan of nine subjects, each mapped to its games,
and walks the child through one deck per subject per day: which subject, which game, done or not,
in order, with a streak and a 120-day history strip. The maths subject has six games and plays
the one that `dayNumber % 6` selects, derived from the date — nothing stored, nothing to drift.

**The order is not alphabetical and not arbitrary.** Five of the nine subjects are languages —
spelling, French, Mandarin, Kiswahili, and calligraphy, which is Chinese character writing. Five
languages back-to-back is one skill practised five ways, so five `lang` subjects alternate with
four `other` subjects in the only order that leaves no two languages adjacent:

  spelling · maths · French · physics · Mandarin · chemistry · Kiswahili · typing · calligraphy

Each subject carries a `kind` (`'lang' | 'other'`), and `session.js` throws at load if any two
`kind: 'lang'` subjects end up adjacent — a sixth language added later would otherwise break the
property silently.

Storage is one record, `arcade.session.v1`:

```json
{ "v": 1,
  "days": { "2026-10-21": { "done": { "maths": 1761042000000, "french": 1761042600000 } } } }
```

Trimmed to 120 days on write (`KEEP_DAYS`), keyed on the *local* date so a child finishing at
nine in the evening gets the day they actually played.

## The three ways a page says "finished"

| Shape             | Pages                                    | Element toggles |
|-------------------|------------------------------------------|-----------------|
| `.stage`          | all four languages, calligraphy, both sciences | `#done` gets class `on` |
| `.done`           | five maths drills, typing tutor           | `#done` gets class `show` |
| summary panel     | `infinite-arena.html` only                | `#summaryPanel` gets class `show` |

`session.js` does not guess. An element either declares `class="stage"` or `class="done"`, and
the page's own class name decides which marker means completion — because accepting either
marker on any page would let a class a game never uses count as a finished deck (`.stage.on` is
true on every stage game's *home screen*). If you add a game, it must declare one of these
shapes, and the session tracker will read it without further wiring.

The tracker exposes `window.ArcadeSession` — `plan()`, `progress()`, `mark()`, `streak()`,
`history(n)` — and every game page loads `session.js` so finishing a deck can drop a toast that
points at the next subject.

## Lessons: teaching before asking

Physics and chemistry do not only quiz. Each topic in either subject has one written lesson, and
the lesson is shown **immediately before the first question from that topic** in any deck — not
as a preamble, which a twenty-question deck makes a wall, and not on demand only, which a child
will not click. The engine checks each question's topic against a persistent `taught` set and
intervenes once; afterwards, that topic's questions arrive plainly and the topic chip carries a
tick. A chip that has never been taught carries a `new` badge, and pressing one runs that topic's
lesson even outside a deck.

A lesson has: why it matters, the rule, two or three beats of reasoning, a worked example with
numbers the bank does not ask about (the bank asks; the lesson must not answer it), one line to
remember, the usual mistake, and **two SVG diagrams**. Diagrams are authored inline in the lesson
data, never as `<img>` — an external reference would break the offline guarantee — and only the
caption passes through `esc()`. They are checked at 390 px for overflow and collapsed height.

## Storage contract

| Key                        | Lives on          | Shape                                             |
|----------------------------|-------------------|---------------------------------------------------|
| `arcade.session.v1`        | every page        | `{ v, days: { 'YYYY-MM-DD': { done: {...} } } }`  |
| `arcade.addition.v3`, `arcade.bonds.v4`, `arcade.subtraction.v3`, `arcade.times.v2`, `arcade.division.v1` | the five maths drills | `{ seen, history, level, ... }` per deck |
| `arcade.arena.v1`          | infinite-arena    | arena state                                        |
| `arcade.typing.v1`         | typing tutor      | lesson level, per-lesson best |
| `arcade.spelling.v1`       | spelling bee      | freshness map, words seen |
| `arcade.french.v1` / `arcade.swahili.v1` / `arcade.chinese.v1` | language pages | proficiency per word: seen, correct count |
| `arcade.calligraphy.v1`    | calligraphy       | characters traced, strokes known |
| `arcade.physics.v1` / `arcade.chemistry.v1` | science pages | freshness map **plus `taught: {topic: true}`** |

Two rules are invisible but binding. Every key is namespaced with the game and a version, and the
version is bumped when the shape changes — never reused with a new meaning. And the `taught` map
rides the same record as the freshness map, so a learner who has read ten lessons keeps that
credit whatever happens to their streak.

## Rules any change must keep

- **No network.** No fetch, no CDN, no font file, no icon font. If a diagram is needed, inline
  SVG. If data is needed, a `.js` file beside the page.
- **Escape anything that passes through `innerHTML`.** `esc()` exists in every engine; the
  lessons, banks and errors reach the DOM through it. The SVG figures are the one sanctioned
  exception, because authored figure markup needs to be markup.
- **Completion is the page's own decision.** Read the marker the page declares; never assume
  `.on` means finished.
- **Decks are 50** unless the game's design document says otherwise, and the freshness rules above
  are what make 50 work — an unbounded or unshuffled deck trains recall, not the table.
- **`localStorage` writes are bounded.** Caps and trims exist because a record a child's browser
  cannot write is a record that silently never saves.
- **Order of subjects asserts itself.** Adding a ninth, tenth, eleventh subject means choosing a
  `kind` and keeping the alternation; the guard in `session.js` will say if you have not.
- **Design says paper, not glass.** Cream and ink, 2.5 px borders, hard offset shadows, nothing
  that glows or floats. Tokens: `--paper:#fdf7ea`, `--ink:#191c3a`, `--muted:#6d7194`,
  `--card:#fffdf8`, `--accent:#2f6fd0`, `--good:#1e9e6a`, `--bad:#e5484d`. The full rationale is
  in `docs/design.md` — why cream over white, why `ui-rounded`, why `1.05rem`, why confetti is
  the only spectacle and `prefers-reduced-motion` bounds it.

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

The three failure modes worth hunting for by name, because they are the ones this codebase has
actually produced:

1. *A predicate that is a strict subset of what it tests* — accepting either completion marker is
   the canonical case.
2. *A gate that passes on a construction error* — a probe whose fixture broke reads as a suite
   that failed wholesale; read the failure reason, not the count.
3. *Colliding names* — a `.note` class meaning one thing in a step row and another thing on the
   page as a whole; an id the game and the tracker both use.

## Making it its own repo

Pick up the folder as-is. `git mv` the contents into a fresh repository and the site runs
unchanged — nothing refers outside the folder, and `docs/design.md` travels with it. To serve
from a web server:

```
python3 -m http.server 8080 --directory <this folder>
```

or drop the folder behind any static server; no config, no proxy paths, no MIME surprises beyond
the ordinary ones.