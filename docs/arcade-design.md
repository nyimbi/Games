# The Arcade: design and implementation notes

Seven self-contained files in `frontend/public/arcade/`. No build step, no network, no accounts. Each game is one HTML file with inline CSS and JS; progress lives in `localStorage` under a per-game key.

This document records what each game teaches, why the interaction is shaped the way it is, and the implementation that carries it. The reader it is written for is a teacher or a parent who wants to know why the screen looks like that — and the next person who has to change it.

---

## Shared decisions

These apply to every file, so they are stated once.

### Paper, not glass

The palette is cream (`--paper:#fdf7ea`), ink (`--ink:#191c3a`), and hard 2.5 px borders with offset shadows. Nothing glows, nothing blurs, nothing floats. The reference object is a well-printed workbook, not a phone app.

The reason is attention. A saturated gradient and a soft shadow say *look at the surface*; a black line and a flat fill say *look at the numbers*. Eight-year-olds are easily drawn to chrome, and every pixel of chrome is a pixel not spent on the mathematics. The one place the design allows spectacle is the confetti burst on a completed deck, which is bounded by `prefers-reduced-motion`.

Typography follows the same logic. `ui-rounded` is the first family because its single-storey `a` and open counters are the shapes children are taught to write. Body text is `1.05rem` at `1.5` line height — larger and looser than the usual web default — and labels are sentence case. The uppercase micro-type that earlier drafts used for tab labels is gone: at 0.66 rem with 0.1 em tracking it is legible to an adult and a grey smear to a child.

### Ten, not fifty

Every deck is `const TOTAL = 10`. Fifty was the first design and it was wrong for a reason worth stating: a deck is a *unit of completion*, and a unit that cannot be finished in one sitting stops being one. The child who stops at question 34 has not failed, but the screen says they have. Ten questions is two to four minutes — finishable before attention lapses, so a finish is a real event and the star threshold can mean something.

Stars: `pct >= 90 → 3`, `pct >= 70 → 2`, otherwise `1`. Finishing a deck always earns at least one star. The point of the first star is to mark the act of finishing, not the accuracy of it.

### Concrete, then bar, then sentence, then symbol

Every game runs the same ladder. A ten-frame or an array or a set of plates shows the structure; a bar or a strip shows the same thing as a magnitude; a number sentence names it; the bare symbol is the last step. The drills show the symbol first and offer the picture on demand, because the drill's job is retrieval, not introduction.

### Support is never gated by level

The single worst defect in the first build: the picture was available only at the easy levels, so the child who most needed it lost it exactly when the numbers got hard. Every drill now carries a **Show picture** toggle that works at every difficulty. The toggle is a choice the learner makes, which is also the metacognitive point — knowing when you need the picture is part of knowing the fact.

### Worked-example fade

Questions 1 and 2 of every addition and subtraction set open the worked panel automatically, headed **Watch me.** Question 3 onward does not. This is Renkl and Sweller's fading procedure: novices learn more from studying a worked solution than from solving, experts learn more from solving, so the support is present at the start of a set and withdrawn as the set proceeds. The panel stays available on demand for every question — the fade is a default, not a lock.

### The error loop holds

A wrong answer does not advance on a timer. It turns the answer box red, says what went wrong, and waits for **Next →**. The first build auto-advanced after 1.8 seconds and flashed a toast. Both were wrong: a toast is gone before it is read, and a timer removes the decision from the learner. Holding the state costs nothing and makes the correction the learner's own act.

### Spaced review

Each game persists a per-fact record. Addition and subtraction key on `level|a|b`, bonds on `whole|a|blank`, division on `divisor|dividend`, times on `table|factor`. A miss sets `due: true`; the next deck pulls up to two due facts to the head of the queue, deduplicated against the generated set. A correct answer clears `due`.

The queue is deliberately small. Two injected facts per deck keeps the review present without turning the deck into a punishment, and the head position means it is met before fatigue.

### Say it

Every game has a speaker button reading `#qsay`, an `aria-live` region containing the question in words ("seven plus eight equals"). The region is `sr-only` so it does not duplicate on screen; the button calls `speechSynthesis` so a child who cannot yet read the symbols can still hear the question. Screen readers get the same text through the live region whether or not the button is pressed.

### Operator colours

`--op-plus:#5b6cff`, `--op-minus:#ff6b6b`, `--op-times:#7cb518`, `--op-div:#ffb703`. Fixed across every file. The operator sign is the one character in a question that changes the entire procedure, so it gets the strongest visual anchor in the card, and the colour is the same everywhere the sign appears. Red for minus is a mnemonic, not a warning.

---

## 01 · Number Bonds (`number-bonds.html`)

**Teaches:** part-whole decomposition, 5 → 10 → 20.

The first build drew a bond diagram — a whole circle, two part circles, dashed connectors — and asked the child to fill one part. It was accurate and it was inert. A bond diagram is a *notation* for a relationship; it does not show the relationship. A child who cannot already see that 6 and 4 make 10 gets nothing from a circle labelled 10 connected to circles labelled 6 and ?.

The redesign replaces the diagram with the object the diagram is about. The Explore tab draws a **ten-frame**: ten cells, filled teal up to the split, amber after it. Dragging the split moves the boundary, and the numbers follow. The relationship is the thing on screen, not a description of it.

The Explore frame is clickable. Tapping the fifth cell sets the split to 5; the keyboard arrows move it one cell; `Home` and `End` jump to the ends. That is deliberate: the child discovers that 5 + 5, 6 + 4, 7 + 3 are the same ten-frame with the boundary in a different place, which is the concept.

**Not always ten.** The drill's pools are `ten` (whole = 10), `teen` (11–20), and `mixed` (5–20). A bonds game that only ever asks for ten teaches one fact and a habit. The teen wholes force the same reasoning against a different anchor and break the "the answer is always the other number" reflex.

**Show me draws, never types.** The original `showMe` handler wrote `state.input = String(ans)` and painted it into the box — it solved the question. The replacement clears the drill frame, draws `whole` counters in teal and amber, and writes a hint that names what to count. The input is untouched. A help button that answers is not help.

**The bar and the ladder.** Above the frame sits a two-segment bar with a draggable handle: the same split as the frame, but as magnitude rather than count. Beside it, a ladder lists **every way to split the whole** — all nine rows for ten — with the current split highlighted. The ladder is the pattern made explicit: as one part grows the other shrinks, and the total never moves. A child who has dragged the handle to every position has seen the entire fact family of the number before being asked a single question.

---

## 02 · Addition Quest (`addition-quest.html`)

**Teaches:** ten-pairs, then 1-, 2-, and 3-digit column addition with carrying.

**The carry leak.** The first build computed the carries and wrote them above the columns before the child answered: `$('qCarry').textContent = S.P.carries.map(...)`. The drill was asking the child to copy a digit. The line is deleted; carries now appear only inside the worked panel, after an answer.

**Mental strategy before the algorithm.** The worked panel's second line is not the column method. For a multi-digit sum it says: *Another way: 47 + 28 — make a friendly ten first: 47 + 3 = 50, then + 25 = 75.* The column algorithm is a reliable procedure; the make-ten strategy is what makes it unnecessary for small numbers and comprehensible for large ones. Showing the strategy beside the algorithm teaches both, and the strategy is what a child can actually hold in working memory.

**The worked panel.** Large, rounded, bold — `1.02rem` at weight 700 in the rounded face, not the small monospace block the first build used. It opens with **Watch me.** on questions 1 and 2 and is available by button on every other question.

**Fact family.** After a correct answer the hint names the two subtraction inverses: `75 − 47 = 28`, `75 − 28 = 47`. Addition and subtraction are one structure seen from two sides, and the moment to say so is the moment the child has just produced the sum. Facts are stored as relations, not as isolated equations.

**Keypad.** `⌫ Del` and `✓ Check`, with Check disabled until a digit exists. The first build's unlabelled icons were a guessing game, and a Check that fires on an empty box is a free miss.

---

## 03 · Subtraction Safari (`subtraction-safari.html`)

**Teaches:** counting back, then borrowing across columns.

The Learn tab is a six-step lesson driven by two sliders. `A` and `B` choose the numbers, a number line shows the gap between them as the answer, and base-ten blocks below show the same quantity as rods and ones. A stepper walks the borrowing procedure one column at a time: `prevStep`, `nextStep`, and `Replay`, with the step count on screen. Counting the gap on a line is the first subtraction model and the one that survives into negative numbers; the blocks are what make borrowing physical rather than a rule about crossing out digits.

**The mental strategy.** The worked panel offers the jump-to-ten method: *75 − 38 — jump to a friendly ten: 75 − 40 = 35, then add back 2 → 37.* This is the strategy that makes borrowing unnecessary for most two-digit cases, and it is the one children who are "good at mental maths" are actually using. Presenting it beside the column algorithm makes the algorithm a fallback rather than the definition of subtraction.

**Borrowing.** `borrowPlan()` returns the per-column state after borrowing — which column lent, which digit fell by one, which gained ten. The stepper reveals that plan one column at a time, so the child sees the lend and the receive as two separate events rather than one changed number. A zero in the middle borrows first, which is the case that breaks the naive rule and the one worth showing explicitly.

**The break is the child's move.** At the borrow step the lending rod (or flat, for a three-digit example) glows, and tapping it — or pressing Enter on it — breaks it into ten ones in the correct row. The stepper's Next button still works, so the lesson is never blocked, but the *action* of borrowing is available as an act rather than only as a narration. Borrowing is a physical exchange, and the one moment a child should perform rather than watch is the moment the ten becomes ten ones.

---

## 04 · Times Table Academy (`times-table-academy.html`)

**Teaches:** the tables to 20, as arrays, skip-counts, patterns, and memory hooks.

Four tabs, in the order a learner should meet them.

**See it.** A factor bar selects 1–20. The array animates: rows and columns appear one at a time with their labels, so `4 × 3` is visibly four rows of three, and the product is the count. A skip-count strip below runs the multiples with the current one highlighted. A 20 × 20 grid marks the current fact (`.hit`), its square (`.sq`), and the commutative mirror (`.cross`), with a legend. The mirror is the point: the grid is symmetric, so every fact above the diagonal is a fact you already know from below it.

**Patterns.** Eight sections, thirty-five cards. Each card carries an icon, a title, a rule as a formula, a plain-language body, worked examples, and a *why* — the geometric or arithmetic reason the rule holds. The sections are: building blocks, the doubling family, the five and ten family, the nine family, the eleven and twelve family, the teen tables, squares and near-squares, and checking tricks. The list is longer than the four patterns the first draft had because the four were the famous ones, not the useful ones: `×19 is ×20 minus one` and `×6 is ×3 doubled` are the rules that actually reduce what has to be memorised, and the checking tricks (digit sum for 3s and 9s, parity, size check) are what let a child catch their own error without an adult.

**Memory hooks.** One per table, 1–20. Each is a concrete image that encodes the *procedure* rather than the answer: eight legs means double three times, because a spider has eight legs and 8 = 2 × 2 × 2. Plus ten rhymes for the facts that resist reasoning (`7 × 8 = 56` — "five, six, seven, eight"). A hook that says "remember 56" is not a hook; a hook that says "here is how to rebuild 56" is.

**Practise · 10.** Ten questions, with the same support toggle and review queue as the other drills. The picture toggle splits the array into two coloured rectangles — `split = min(5, b)` — so `7 × 8` shows as a 7 × 5 block plus a 7 × 3 block. That is the distributive property made visible, and it is why the split is at five rather than anywhere else: five is the anchor children already have.

---

## 05 · Division Diner (`division-diner.html`)

**Teaches:** division as fair sharing, and as multiplication read backwards.

The Explore tab is a table with plates. The child sets the cookie count and the plate count, presses deal, and the cookies animate one at a time onto the plates in round-robin order. Equal shares are the *result* of dealing, not an assertion — the child watches twelve cookies become four on each of three plates.

**Divisor 1 is removed** from every pool. `n ÷ 1 = n` teaches nothing and wastes a question.

**Both directions.** The drill's worked panel asks *how many 3s fit in 12?* and then checks the other way: `4 × 3 = 12`. Division is presented as the inverse of a known multiplication rather than as a separate operation with its own rules.

**Two models, one operation.** A **Share / Group** switch sits above the plates. Share fixes the number of plates and asks how many cookies each gets; Group fixes the size of each bag and asks how many bags you fill. Both run the same animation with the same numbers, and both end at the same quotient. Division has two meanings in ordinary language — *deal these out* and *how many of these fit in that* — and a child who has only met the first cannot use the second, which is the one word problems ask for. Showing them side by side, with the same cookies and the same quotient, is the cheapest way to make the equivalence visible.

**Repeated subtraction.** Below the plates the Explore tab writes the division out as repeated subtraction — `12 − 3 − 3 − 3 − 3 = 0` — with the remainder in its own colour. This is the bridge between the two models: sharing says *deal the cookies*, repeated subtraction says *how many plates can I fill*, and they give the same number.

**The fact family.** After a deal, four facts appear together: `3 × 4 = 12`, `4 × 3 = 12`, `12 ÷ 3 = 4`, `12 ÷ 4 = 3`. One fact, four faces. The point is that knowing any one of them is knowing all four, which halves what the multiplication tables have to carry.

**The picture toggle is always available.** The first build showed the mini-plates only when `divisor <= 10 && dividend <= 60`, which is exactly the region where the child does not need them. The toggle now works at every level.

---

## 06 · Infinite Arena (`infinite-arena.html`)

**Teaches:** everything, adaptively, with no finish line.

**Twelve skills** from `add-10` to `div-high`, each with an EMA (exponential moving average) of success. A skill's weight is `(1 − ema)² + 0.05`, squared so the weakest skill dominates rather than merely leading, with the constant floor keeping a mastered skill from disappearing entirely. A recency divisor on top — `1 / (1 + served × 0.25)` — stops one weak skill from taking every question in a run.

**Defaults.** Six skills on by default (`add-10`, `sub-10`, `add-1d`, `sub-1d`, `mul-low`, `div-low`). The first build turned everything on, which meant a child met three-digit subtraction in the first minute. The defaults are the set a beginner can actually answer.

**Forgetting.** On load, if the save is older than a day, every EMA decays toward 0.5 at 12% per day, capped at seven days. A skill the child mastered three weeks ago should not still read as mastered. This is the one place the arena is honest about time, and it is why the skill map shows stars and raw `right/n` rather than a single number.

**Run length.** 10, 20, or Endless, defaulting to 10. Same reasoning as `TOTAL = 10`: a finishable unit.

**No shaming.** When every skill is above the mastery threshold the first build said something about having nothing left to practise. It now says: *You have mastered everything here. Try the next difficulty for a fresh challenge.* A dead end is a design failure, and telling a child they are done is a way of telling them to stop.

**Operator colour is dynamic.** The operator sign in the question takes the fixed colour for its operation, so the symbol that determines the whole procedure is the most visually distinct character on screen.

---

## 07 · Typing Tutor (`typing-tutor.html`)

**Teaches:** touch typing, home row outward.

The keyboard is drawn on screen, and every key carries a **finger colour** — eight groups, left little through right little, with a matching legend. The key the learner should press next is highlighted, and the highlight moves with them. The finger colours answer the question a beginner actually has, which is not "which letter is that" but "which finger do I use".

**Progressive lessons.** Twelve, in order: home row, home-row words, top row, top-row words, bottom row, bottom-row words, all three rows, capitals, numbers, punctuation, common words, sentences. Each unlocks at 80% accuracy on the one before. The order is deliberate: letters are learned by row because the hand learns a row as a unit, and words follow immediately because isolated letters are not what typing is for.

**Accuracy over speed.** The completion screen leads with accuracy, then words per minute, then mistakes. WPM is displayed during the run because it is motivating, but the star thresholds are set on accuracy (`95 / 85 / 80`) so that rushing is not rewarded.

**Per-key diagnosis.** Every miss is recorded against the *target* key, and the five worst keys are shown as chips below the keyboard (`k 4×`). This is the feature that makes the game a tutor rather than a metronome: the learner leaves knowing which two keys to practise, not just how fast they were.

**Timing.** No timer, 30 seconds, or 60 seconds. No timer is the default, because the point at the start is accuracy and a clock is a distraction from it. The timed modes exist for a learner who wants a score.

**Input handling.** A hidden, off-screen input receives keystrokes so mobile keyboards work, and the document-level listener refocuses it. Backspace is swallowed — a typing tutor that lets you delete a mistake is a tutor that never sees one. Enter types a newline where the target has one.

---

## The index (`index.html`)

Seven cards, each with an illustration, a one-sentence description, tags, and **0–3 stars read from that game's own storage**. Each game writes `{ level|mode: bestPct }`; the index scans the bucket, takes the maximum, and maps it to stars with the same thresholds the games use. The arena stores EMAs instead, so its card reads the maximum `ema × 100`.

Above the grid, a **Today's suggestion** lane lists the three games played least recently, with "Never played" or "N days ago" beside each. It is computed on load and hidden if the list is empty. The point is to make the choice of what to play next a decision the page can help with, rather than one the child makes by picking the same card every time.

The index records a play when a card is clicked (`arcade.lastplay`), which is what the lane sorts on. That is the only state the index keeps.

---

## Verification

Each inline `<script>` block is extracted and run through `node --check` after every edit. That catches syntax errors and nothing else: it does not render the page, so it cannot catch a layout break, a missing element id, or a wrong value written into the DOM. There is no build step and no test runner; the files are the artefact, and the remaining check is opening them.

## What is deliberately absent

- **No accounts, no sync, no network.** The files open from `file://` and work offline. Progress is per-browser, and the index says so.
- **No leaderboards.** Comparison to other children is the fastest way to make a slow learner stop.
- **No streaks that punish absence.** The arena decays skill estimates; it does not break a chain or show a lost number.
- **No time pressure in the drills.** The only clock in the arcade is the optional one in the typing tutor.
