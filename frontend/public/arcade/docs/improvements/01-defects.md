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

## D-8 — A review fact is cleared by one correct answer

**Severity: medium. It is the difference between review and a queue.**
**Read.**

`number-bonds.html:553-555`, `addition-quest.html:646-650`, `subtraction-safari.html:692-694`, `times-table-academy.html:782-784`, `division-diner.html:492-494`, `calligraphy.html:516-518`:

```js
r.n++; if (!right) { r.miss++; r.due = true; } else if (r.due) r.due = false;
```

`spelling-bee.html:910-916` is the exception and gets it right:

```js
if (!right) { r.miss++; r.due = true; }
else if (r.due && r.n >= 2) r.due = false;
```

**Consequence.** A fact answered wrongly then correctly once is retired. The literature this product is built on (spaced repetition) needs the interval to grow with successful retrievals; here it is one, everywhere but spelling. Combined with D-2, review in three drills is: never served; in the other two, served once.

**Fix.** Port `spelling-bee.html:914`'s condition. `r.n` is already recorded at every site, so this is a one-line change in six places, and it is the cheapest real improvement in this document.

---

## D-9 — `review` and `seen` disagree about what a fact is

**Severity: low-medium. Two identity functions for one object.**
**Read.**

In every drill, `seen` is keyed by the fact's display identity and `review` by a composite that includes the level or the blank:

| Game | `seen` key (`markSeen`) | `review` key (`factKey`) |
|---|---|---|
| number-bonds | `whole\|a` (`:605`) | `whole\|a\|blank` (`:550`) |
| addition | `a\|b` (`:709`) | `level\|a\|b` (`:643`) |
| subtraction | `a\|b` (`:743`) | `level\|a\|b` (`:689`) |
| times | `a\|b` (`:825`) | `a\|b` (`:779`) |
| division | `divisor\|dividend` (`:540`) | `divisor\|dividend` (`:489`) |

Three games have two identity functions for the same fact. `freshFirst` orders by `seen`; `buildQueue` seeds from `review`. A fact can be simultaneously "never served" to the deck and "due for review" to the queue.

**Consequence.** Not a live bug — the two are read by different mechanisms and neither corrupts the other. It is the shape that produces D-2, and it is why a fact served in level 2 does not count as seen for the same fact in level 1.

**Fix.** Decide whether identity is the fact or the fact-in-context, write it once, and pass it. The `keyOf` parameter exists for this.

---

## D-10 — No global error handler; every persistence failure is swallowed

**Severity: medium. Observability is zero, and the swallow hides D-3.**
**Read.**

```
$ grep -rn "window.onerror\|unhandledrejection" *.html *.js
(none)
```

`catch (_) { }` appears 19 times across 8 files (`lang-engine.js` 3, `science-engine.js` 3, `calligraphy.html` 3, `piano-engine.js` 3, `session.js` 2, `how-things-work.html` 2, `maths-engine.js` 1, `session.html` 1).

**Consequence.** A child's session can break in a way nobody can diagnose. There is no console breadcrumb, no counter, no visible signal. Combined with D-3, quota exhaustion presents as "my progress keeps disappearing" with no way to confirm the cause.

**Fix.** The constraint is no network, so telemetry cannot leave the device. It can still be recorded locally: a bounded `arcade.errors.v1` ring of `{page, message, at}` written by `window.onerror`, shown on the session page behind a "Something went wrong?" disclosure. That is observability inside the offline guarantee, and it turns every `catch (_) {}` into a place that can report without changing behaviour.

---

## D-11 — `#done.show` is set before the percentage is computed in three drills

**Severity: low. Cosmetic unless the write throws.**
**Read.**

`addition-quest.html:852`, `division-diner.html:622`, `number-bonds.html:690` set `$('done').classList.add('show')` before the `pct` is written to `state.perLevel`/`perMode`. If `save()` throws — which it will, per D-3 — the summary is already visible and the record is not written. `session.js:290` then marks the subject done on a run whose percentage was never stored, so the hub's star rating and the session record disagree permanently.

**Fix.** Compute, persist, then show. Three lines moved in three files.

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
