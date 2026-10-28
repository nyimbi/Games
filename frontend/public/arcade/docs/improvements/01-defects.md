# Defects

Ranked by what they cost, not by where they live. Each entry states the claim, the evidence, the consequence, and whether it is **measured** or **read**.

The two entries marked **REFUTED** were asserted by earlier documents in this repository and are false. They are kept because a catalogue that only lists what survived hides the fact that it checked.

---

## D-1 — A timed-out typing lesson credits the day's typing subject

**Severity: high. It corrupts the only record the product keeps.**
**Measured.**

`typing-tutor.html:529-536`:

```js
$('target').classList.add('done');
$('done').classList.add('show');                     // :531 — outside any `if (completed)`
$('doneTitle').textContent = completed ? (...) : 'Time!';
```

`session.js:203-213`:

```js
const marker = d.classList.contains('stage') ? 'on' : d.classList.contains('done') ? 'show' : null;
return marker ? d.classList.contains(marker) : false;
```

The typing page's summary element is `class="done"` (`typing-tutor.html:204`), so `show` is read as *deck finished*. `finish()` sets it whether the text was completed or the clock ran out.

**Probe output** (`/tmp/audit_probe.py`, claim 1; reproduced in `04-probes.md`):

```
[1] timed out -> #done.show=True, title='Time!', text length=46
    CONFIRMED: a timed-out run shows the completion marker session.js reads
    ArcadeSession.isFinished() -> True
```

The run had typed one character of a 46-character text and let 30 seconds elapse.

**Consequence.** `session.js:290-293` calls `mark('typing')` on that signal, so the day's typing subject is marked done and the streak advances. A child who opens typing, presses one key and closes the tab gets the same credit as one who finishes the lesson. The intent is visible two lines down — `stars` is correctly gated on `completed` (`:533`) — so the marker line is an oversight, not a decision.

**Fix.** Set `#done.show` only when `completed`, or give the timed-out screen a distinct element that `isFinished()` does not read. The second is better: the child should still see their speed after a timeout.

---

## D-2 — Three of five maths drills can never serve an in-level review fact

**Severity: high. The review mechanism silently does nothing.**
**Measured.**

Three sites filter `due`, slice to two, then filter by level:

- `division-diner.html:517-520`
- `number-bonds.html:566-571`
- `times-table-academy.html:800-803`

Two sites filter by level first, then slice:

- `addition-quest.html:652-656`
- `subtraction-safari.html:696-700`

The two orders differ in one way: with the slice first, two due facts from *any other level* consume both slots before the level filter runs, so the in-level fact never enters the queue.

**Probe output** (`/tmp/div_review.py`, reproduced in `04-probes.md`), two seeds differing in one dimension:

```
A  one in-level due fact      -> first question: '12 divided by 3.'
B  + two out-of-level due     -> first question: '5 divided by 5.'
    CONFIRMED: two out-of-level due facts starve the in-level one
```

Seed A is the control: the in-level due fact is served first when nothing competes. Seed B adds two due facts from divisor 9 while the level serves divisors 2–5. The in-level fact vanishes from the deck.

**Consequence.** The deck is still 50 questions, the score is still out of 50, and the finish screen still appears. Nothing observable to a child is wrong. The only thing lost is the one mechanism that makes the drill adapt — which is the thing `README.md:783-788` names as the most valuable next unit of work. It cannot be built on top of this.

**Second-order.** Because the sliced-out facts are never cleared from `review`, they stay `due` forever and keep occupying both slots. A single wrong answer at level 3 permanently suppresses level 1's review queue. This is why the defect does not decay on its own.

**Fix.** Filter by level, then sort by `miss` descending, then slice. Five sites, one order.

---

## D-3 — `review` is unbounded in every game; `seen` is capped in every engine

**Severity: high. It is a latent write failure, not a slow leak.**
**Read.**

`SEEN_CAP` bounds `seen` in every engine: `maths-engine.js:43` (900), `lang-engine.js:29` (1200), `science-engine.js` (1200), `spelling-bee.html:424` (1400), `infinite-arena.html` (600). The eviction is written out in `maths-engine.js:55-67`.

No game bounds `review`:

```
$ grep -n "delete state.review\|review = {}" *.html
(no match outside state initialisers)
```

Its key space per game:

| Game | Key | Cardinality |
|---|---|---|
| `number-bonds.html:550` | `whole\|a\|blank` | ~3 modes × ~60 facts × 2 blanks |
| `addition-quest.html:643` | `level\|a\|b` | level 3 is sampled, unbounded over time |
| `subtraction-safari.html:689` | `level\|a\|b` | level 3: 260 per queue, `:714-718` |
| `times-table-academy.html:779` | `a\|b` | 400 |
| `division-diner.html:489` | `divisor\|dividend` | ~600 |

`state.review[k]` is written on every answer and the whole object is serialised on every question (`subtraction-safari.html:685`, and the same line in the other four). Subtraction level 3 draws `a = 100 + rnd(900)` (`:714`), so its key space is effectively the set of every distinct question ever asked.

**Consequence.** `localStorage.setItem` throws `QuotaExceededError` when the origin fills. Every write site is wrapped in `try { } catch (_) { }` — `number-bonds.html:544-547` and four siblings — so the failure is **silent**: progress stops persisting and nothing reports it. `session.js:105-112` guards exactly this for the session record, with a comment naming it. No game does.

**Fix.** Cap `review` the way `markSeen` caps `seen`: on write, if `Object.keys(review).length >= REVIEW_CAP`, drop the entries with the lowest `miss` and `n`, preferring ones not `due`. A missed fact must survive eviction; a once-missed fact need not.

---

## D-4 — `esc()` has three semantics and the narrowest copy is on the one page that kept a local definition

**Severity: medium. Latent — no live injection path today.**
**Read.**

| Copy | Escapes |
|---|---|
| `maths-engine.js:26`, `lang-engine.js:21`, `science-engine.js:24`, `piano-engine.js:29`, `calligraphy.html:246` | `& < > "` |
| `spelling-bee.html:487` | `& < > " '` |
| `addition-quest.html:413` | `& < >` only |

`addition-quest.html:413` is the narrowest in the codebase and the only page that kept a local `esc` after the maths consolidation moved the other four drills onto `MG.esc`. Its single call site (`:418`) renders a digit or `&nbsp;`, so the narrow class cannot currently be exploited.

**Consequence.** Latent. The danger is drift: the next feature that puts a word into that helper inherits the narrowest escaper in the product, on the page whose author had no reason to look at it.

**Fix.** Delete `addition-quest.html:413`; use `MG.esc`. Separately, decide whether `'` belongs in the class — it does not for text nodes, it does for attribute values, and `spelling-bee.html:555` interpolates into `data-pair="..."`, which is why that copy has it. Encode the distinction rather than the union.

---

## D-5 — `aria-modal="true"` with no focus trap

**Severity: medium. A keyboard or screen-reader user is told something false.**
**Measured.**

`maths-engine.js:259-261` sets `role="dialog"`, `aria-modal="true"` and an `aria-label`; `:279` focuses the close button on open; `:282-287` restores nothing on close.

**Probe output** (`/tmp/audit_probe.py`, claim 3):

```
[3] tab order from the dialog: ['BUTTON', 'BUTTON', 'BUTTON', 'BUTTON', 'BODY', 'back']
    focus still inside dialog after 6 tabs: False
    CONFIRMED: aria-modal="true" with no focus trap; Tab reaches the page behind
```

`back` is the page's own back button, behind the overlay.

**Consequence.** A modal that is not modal. Also: focus is not returned to the Learn button on close, so a keyboard user who closes the dialog lands wherever the page happened to leave them.

**Fix.** Trap Tab within `wrap` while it is `.on`; on close, `lastFocus.focus()`. Both are ~10 lines in `maths-engine.js`. The science engine's lesson view needs the same.

---

## D-6 — `session.js` observes the whole body with `subtree: true`

**Severity: medium. It runs on every repaint of every game.**
**Read.**

`session.js:300-302`:

```js
new MutationObserver(check).observe(document.body, {
  subtree: true, attributes: true, attributeFilter: ['class', 'hidden']
});
```

`attributeFilter` limits which attributes trigger, but `subtree: true` means every node in the document is watched, and every class change anywhere — and the games change classes constantly: `paintAll()` in `number-bonds.html`, the base-ten animations in the three column drills, `paintStats()` on every keystroke — invokes `check()`, which is guarded by `if (fired || !armed || !HERE) return;` (`:287`) and so returns immediately after the deck finishes.

**Consequence.** Bounded and cheap per call, but it is a callback per class mutation for the entire lifetime of every page, and `fired` is only set after the deck ends. During play the guard's first test is false, so the full `isFinished()` runs on every mutation — a `getElementById` and two `classList.contains` per class change. Not a bottleneck at 60fps on a modern phone; a measurable cost on the low-end Android this product is for.

**Fix.** Observe the two elements that can carry the marker, not the body. The page already declares which marker it uses; `session.js` can find the element once at `start()` and observe that node's `class` attribute with `subtree: false`.

---

## D-7 — Six copies of the deck, five of `markSeen`, eight of `tone`

**Severity: medium. It is the mechanism by which D-2 and the division `keyOf` regression happened.**
**Read.**

| Primitive | Copies |
|---|---|
| `freshFirst` | `lang-engine.js:30`, `maths-engine.js:45`, `science-engine.js:39`, `calligraphy.html:321`, `piano-engine.js:441`, `spelling-bee.html:459` |
| `markSeen` | `lang-engine.js:37`, `maths-engine.js:55`, `science-engine.js:30`, `spelling-bee.html:467`, `piano-engine.js:432` |
| `tone` | `lang-engine.js:48`, `maths-engine.js:92`, `science-engine.js:48`, `calligraphy.html:272`, `infinite-arena.html:273`, `typing-tutor.html:229`, `piano-engine.js:58`, plus `chinese.html:240` (a different function that shares the name) |
| `esc` | see D-4 |

The signatures disagree: `maths-engine.js:45` takes `(pool, seen, bucket, keyOf)` and `spelling-bee.html:459` takes `(pool, key)`. The maths consolidation (`maths-engine.js`) moved four of five and left `addition-quest.html:413`'s `esc` behind. A consolidation that leaves one copy is a consolidation that guarantees the next divergence.

**Consequence.** Already observed twice: the division `keyOf` regression (a shared default of `a|b` where a division fact has neither, so every fact keyed `undefined|undefined` while `markSeen` wrote `divisor|dividend` — the drill played, graded and scored, and only forgot what it served), and D-2. Both were silent.

**Fix.** A second consolidation is not the answer; the first one's scope was. The three quiz engines (`lang`, `science`, `maths`) and `spelling-bee.html`'s inline engine should share one deck module. `piano-engine.js` and `calligraphy.html` legitimately differ (different key shapes, different caps) and should take the module with their own `keyOf` — which is exactly the parameter `maths-engine.js:45` already exposes.

---

## D-8 — A review fact is cleared by one correct answer, in all six copies

**Severity: medium. It is the difference between review and a queue.**
**Read, then traced.**

`number-bonds.html:553-555`, `addition-quest.html:646-650`, `subtraction-safari.html:692-694`, `times-table-academy.html:782-784`, `division-diner.html:492-494`, `calligraphy.html:516-518`:

```js
r.n++; if (!right) { r.miss++; r.due = true; } else if (r.due) r.due = false;
```

`spelling-bee.html:910-916` looks like the exception:

```js
if (!right) { r.miss++; r.due = true; }
else if (r.due && r.n >= 2) r.due = false;
```

**It is not.** `r.n` counts *total attempts*, not successful ones, and it is
incremented before the branch. Tracing the spelling rule over
`correct, correct, miss, correct` gives `n=1,2,3,4` and `due=False,False,True,False`
— the miss lands at `n=3`, so `n >= 2` holds and a single correct answer retires
it. The guard only suppresses retirement for a fact missed on its *very first*
attempt, which is the one case where it does not matter. Every copy, spelling
included, retires a missed fact after one success.

This correction was made while implementing the fix: the earlier text of this
entry called spelling "the exception that gets it right" and proposed porting
its condition. That would have changed nothing, and the change would have looked
like a fix.

**Consequence.** A fact answered wrongly then correctly once is retired. Spaced
repetition needs the interval to grow with *successful retrievals*; here it is
one, everywhere. Combined with D-2, review in three drills was never served; in
the other two it was served once.

**Fix.** Track successes, not attempts. `r.ok` increments only on a correct
answer; `due` clears when `r.ok >= 2` since the last miss, and a miss resets
`r.ok` to 0. That is the two-success rule the audit claimed existed. `r.n` stays
as the attempt count for ranking.

---

## D-9 — REFUTED. `review` and `seen` key different objects, on purpose

**Status: refuted by measurement. The "fix" would have been a regression.**

In every drill, `seen` is keyed by one string and `review` by another, and the original entry called that "two identity functions for one object". They are not the same object.

| Game | `seen` bucket | `seen` key | `review` key | what the difference is |
|---|---|---|---|---|
| number-bonds | mode | `whole\|a` | `whole\|a\|blank` | the blank position |
| addition | level | `a\|b` | `level\|a\|b` | the bucket, folded in |
| subtraction | level | `a\|b` | `level\|a\|b` | the bucket, folded in |
| times | mode | `a\|b` | `a\|b` | none |
| division | level | `divisor\|dividend` | `divisor\|dividend` | none |

Read off a live run rather than from the source (`number-bonds.html`, one wrong answer, then `localStorage`): `seen['ten']` holds `10|5`; `review` holds `10|5|whole`. Two keys, one question.

**Why the difference is right.** `seen` answers *has this child met this fact*, and its bucket is already the level or mode — the bucket is the context, so the key is the fact. `review` is one flat map across every level, so a key that did not carry the level would collide between levels. That is not duplication, it is a flat map paying for its flatness.

Number-bonds is the case that settles it. `10 split into 7 and ?` and `10 split into ? and 3` are different questions with different answers and different failure modes: a child can know the bond and still freeze when the whole is the blank. Collapsing the key to `whole|a` — which is what "write it once, and pass it" would mean — would make a miss on the whole-blank retire the review for the part-blank too, and would stop the drill ever scheduling the harder form again.

**What is actually true.** The two maps are not kept in sync, and that is a real observation: a fact served in level 2 does not count as seen in level 1, because the bucket differs. Whether that is a defect depends on whether "seen" means "met this fact" or "met this fact at this level" — and for a drill that sequences by level, the second is the honest answer. It is a design question, not a bug, and it belongs to F-1's spaced repetition rather than to a rename.

---

## D-10 — FIXED. No global error handler; every persistence failure was swallowed

**Status: fixed by `errors.js` and `probes/errors.py`.**
**Read.**

```
$ grep -rn "window.onerror\|unhandledrejection" *.html *.js
(none)
```

`catch (_) { }` appears 19 times across 8 files (`lang-engine.js` 3, `science-engine.js` 3, `calligraphy.html` 3, `piano-engine.js` 3, `session.js` 2, `how-things-work.html` 2, `maths-engine.js` 1, `session.html` 1).

**Consequence.** A child's session can break in a way nobody can diagnose. There is no console breadcrumb, no counter, no visible signal. Combined with D-3, quota exhaustion presents as "my progress keeps disappearing" with no way to confirm the cause.

**Fix as landed.** `errors.js` loads first in every page's `<head>` and records uncaught errors, unhandled rejections, failed resource loads and explicit storage failures into `arcade.errors.v1`, capped at 50, newest first, shown on `session.html` behind a "Something went wrong?" disclosure. Twelve of the storage catches now report; the parse catches and the audio catches still swallow, because a corrupt record recovering to defaults and a browser refusing WebAudio are both working as intended.

**The design point worth keeping.** The ring is memory-first, localStorage best-effort. The failure most worth recording is quota exhaustion, and that is exactly the failure that makes the ring unwritable — a recorder that needs storage to report a storage problem reports nothing. The probe asserts the in-memory ring holds the entry while `localStorage` returns `[]`, and the canary that swaps the getter to read from storage fails it.

**A bug the probe found in the fix itself.** The repeat-collapse compared `e.at` against `page + ':' + where` while storing the bare `where`, so the match never fired: 120 identical notes filled the ring with 50 copies of one message. Only the canary that mutates the collapse was ever going to catch it, and it did.

---

## D-11 — REFUTED. `#done.show` before the percentage is stored cannot lose the record

**Status: refuted on re-read. The order is untidy, not wrong.**

`addition-quest.html:852`, `division-diner.html:622`, `number-bonds.html:690` set `$('done').classList.add('show')` before the `pct` is written to `state.perLevel`/`perMode`. The original claim was that a throwing `save()` would leave the summary visible with the percentage unwritten, so `session.js:290` would credit a day whose star rating never stored.

**Why that cannot happen.** Every one of the six drills wraps the write:

```js
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ..., review: capReview(state.review), seen: state.seen }));
  } catch (_) {}
}
```

`addition-quest.html:637-641`, and the same shape in `division-diner.html:596-600`, `number-bonds.html:672-676`, `subtraction-safari.html`, `times-table-academy.html`, `infinite-arena.html`. Nothing escapes `save()`. Even if it did, `session.js`'s `MutationObserver` fires in a later microtask, after `finish()` has already unwound or thrown — so the reorder would not change what gets credited in that case either.

**What is actually true.** If the quota is exhausted, `save()` swallows and the run is silently lost — but that is D-3, and it is now bounded by `capReview`. The DOM order is a cosmetic preference. The reorder was written, canaried and reverted rather than shipped, because a fix whose stated mechanism cannot occur is a change that claims a bug it does not fix.

---

## D-12 — The arena's recency penalty resets every run

**Severity: low. The adaptation is per-session where it reads as per-learner.**
**Read.**

`infinite-arena.html:466`:

```js
if (state.served[sk]) w *= 1 / (1 + state.served[sk] * .25);
```

`state.served` is reset at `:514` on every `startRun()`. The EMA (`:581`) persists; the recency penalty does not. Within one run the weight decays by skill; across runs it starts fresh.

**Consequence.** A learner returning to a run gets the least-mastered skill served repeatedly until the penalty damps it, which is arguably intended. The comment at `:463-464` says "lowest mastery gets served most" without stating the per-run scope. Not a bug; a comment that does not say what the code does.

**Fix.** State the scope in the comment, or persist `served` alongside `skill` and decay it with the same day factor (`:413`).

---

## D-13 — Subtraction level 3 and the review map together have no bound and no reuse

**Severity: low on its own; it is the mechanism behind D-3.**
**Read.**

`subtraction-safari.html:714-718` builds 260 facts from `a = 100 + rnd(900)`, `b = 10 + rnd(a - 10)`. Two runs share a fact only by collision. Every fact answered writes `review['3|a|b']` (`:689-694`). So the level designed to be the most practised is the one whose review map grows fastest and can never be fully revisited — a due fact from run 1 is one of ~900 possible `a` values, and the review queue can serve two per run.

**Consequence.** Feeds D-3. Also means review in subtraction level 3 is decorative.

**Fix.** Either enumerate level 3's pool the way level 2 is enumerated (`:711-713`, with a comment saying exactly why enumeration was chosen there), or bound `review` per level.

---

## D-14 — `100vh` on 18 pages, no `dvh`

**Severity: low. A mobile layout defect, visible but harmless.**
**Read.**

All 18 pages set `min-height:100vh` (`addition-quest.html:18` and 17 siblings). No page uses `dvh`. On mobile Safari and Chrome, `100vh` is the viewport with the URL bar retracted, so the body is taller than the visible area while the bar is shown.

**Fix.** `min-height:100dvh` with a `100vh` fallback. One line per page, mechanical.

---

## D-15 — Seven pages have no live region at all

**Severity: low-medium. A screen-reader user gets no answer feedback on half the product.**
**Read.**

```
french 0   chinese 0   swahili 0   calligraphy 0   physics 0   chemistry 0   piano 0
```

The five maths drills and the arena each have `#qsay aria-live="polite"` (`addition-quest.html:342`, `division-diner.html:247`, `number-bonds.html:297`, `infinite-arena.html:218`) and a `role="status"` toast (`:371`, `:273`, `:330`, `:259`). The spelling bee has two live regions (`:333`, `:348`). The seven listed have none, and neither `lang-engine.js` nor `science-engine.js` injects one.

**Consequence.** On French, Mandarin, Kiswahili, physics, chemistry, piano and calligraphy, a screen reader announces nothing when an answer is graded. The five maths drills — the newest work — are the ones that got this right.

**Fix.** The engines own the feedback path; they can create one `aria-live="polite"` node at init and write to it. That fixes six pages with two lines in each engine.

---

## D-16 — `inputmode` is set on two pages of five that take numeric input

**Severity: low. A phone shows the wrong keyboard.**
**Read.**

`chemistry.html` and `physics.html` set `inputmode`; `addition-quest.html`, `subtraction-safari.html`, `times-table-academy.html`, `division-diner.html` and `number-bonds.html` do not. The maths drills use an on-screen pad (`buildPad()` at `addition-quest.html:882`, `subtraction-safari.html:866`, `times-table-academy.html:971`, and the same in division), so the physical keyboard is a secondary path — but the `keydown` handlers are bound to `document` (`division-diner.html:700`, `addition-quest.html:970`, `number-bonds.html:790`), so a phone user who taps into any text field gets a full keyboard for a digit.

**Fix.** `inputmode="numeric"` on the pad's hidden input, and on any visible numeric field.

---

## D-17 — FIXED. Addition's bond level rejected every correct answer

**Severity: high. The level was unplayable, and its worked panel taught the wrong answer.**

`d3ff120` ("Align the sum columns and stop the carry giving the method away") changed the bond level from a column sum to a missing addend — `6 + ? = 10`, with the answer box standing in for the missing part — and left everything downstream on the whole:

| site | asked for | until this fix |
|---|---|---|
| `renderQuestion` | the missing part | renders `a + ? = sum` |
| `submit` | the missing part | `Number(state.input) === q.sum` |
| `workedFor` | the missing part | `Answer: 10` — the number already on screen |
| `#qsay` | the missing part | `"6 plus 4"` — speaks the answer |
| `#ask` | the missing part | `"Make the whole"` |

The consequence is total: `6 + ? = 10` accepted `10` and rejected `4`. The only bond question that worked was `a = 0`, where the missing part and the whole are the same number — and even there the drill was marking a copied digit correct. The level is the default on a first visit (`LEVELS[0] = 'bond'`), so a child opening the drill for the first time met fifty questions none of which could be answered.

**Why no probe caught it.** `grading.py` types `4` and requires that *something* happen — a correct answer advances, a wrong one reveals Next. Both happened. The claim "the drill grades what it asks" is a different claim, and nothing asserted it. `probes/answerable.py` now does, for all five drills: it reads the question off the DOM, computes the answer in Python, types it, and requires `ok`; then types a number the screen displays and does not ask for, and requires rejection. Three canaries fire (addition grading the sum, number-bonds grading the whole, division grading the dividend), each restoring byte-identical.

**The story layer would inherit the bug.** `wordproblems.js` builds a story from `factOf('addition-quest', q)`, which reads `q.a`/`q.b` and answers `a + b` — the whole. On the bond level that is a story whose answer is the number on screen. Any caller of `ArcadeStory.apply` on this page must pass `null` for a bond rather than the fact, which clears the box without asking a question the page does not grade.

---

## REFUTED-1 — "The freshness probe covers the deck"

**False as stated.** `probes/freshness.py:14-17` says so itself: it exercises pass zero (`freshFirst`) and not pass two (`newCycle`). The claim was never that it covered both — but the file's name and its place in the suite invite the stronger reading. The bonds `newCycle` canary could not be made to trip, and the docstring records that rather than overclaiming. This is correct behaviour and is listed only so the next reader does not assume coverage that does not exist.

**What is needed.** A pass-two probe: seed the deck, serve all 50, assert the second cycle's first fact is the least recently served. That requires walking a full deck in the browser, which is 50 clicks per drill — feasible, not yet written.

## REFUTED-2 — "The division freshness key is the shared default"

**Was true, is fixed.** The old local `freshFirst` hardcoded `divisor|dividend`; the shared one defaults to `a|b`, and a division fact has neither, so every fact keyed `undefined|undefined` while `markSeen` wrote `divisor|dividend`. Fixed by passing `keyOf` at `division-diner.html:521` and `number-bonds.html` (pass two). Recorded here because the failure mode — a shared helper's default being wrong for one caller, silently — is the same shape as D-2 and will recur until D-7 is addressed.

---

## What is not a defect, and why

These were checked and are correct. Listed so the audit's silence is not read as an omission.

- **Audio on a refused context.** Every `tone()` is inside `try/catch` and `audio()` returns `null` rather than throwing (`maths-engine.js:83-90`). A browser that refuses audio does not break the game.
- **The confetti canvas is mounted lazily and reuses an existing `#confetti`** (`maths-engine.js:132-139`), so a page that already has one does not get a duplicate id.
- **`prefers-reduced-motion` is honoured on all 18 pages and all 4 engines.**
- **The completion-marker design** (`session.js:203-213`) — reading a marker the page declares rather than guessing — is right. D-1 is a page setting its marker in the wrong branch, not this design failing.
- **`freshFirst`'s two-half shuffle** (`maths-engine.js:48-52`) — unseen and stale are shuffled independently before concatenation, so neither half has a fixed order.
- **No user input reaches `innerHTML`.** Checked by grep for `innerHTML = .*\.value` and `innerHTML = .*state.input`; no match. D-4 is latent only.
- **No CSP, and that is not a defect here.** The pages are `file://` documents with inline scripts and no network; a `Content-Security-Policy` meta tag would add nothing an attacker with local file access does not already have. Recorded so it is not re-raised.
