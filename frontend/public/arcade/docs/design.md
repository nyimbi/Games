# The Arcade: design and implementation notes

Seventeen self-contained games and a session page in this folder. No build step, no network, no accounts. The session page, `session.html`, is not a game: it orders the seventeen into a daily pass over twelve subjects. Each game is one HTML file with inline CSS and JS; progress lives in `localStorage` under a per-game key. Content that is large and tabular lives beside the page rather than inside it — the spelling bee's thousand words, the language banks, the 440-character calligraphy bank and its sketches, the physics and chemistry questions — because a thousand annotated entries inline would triple the file and make the engine unreadable. The language games share `lang-engine.js`, the science games share `science-engine.js` and the piano course has `piano-engine.js`; the engines hold the interaction, the banks hold the content. A companion `README.md` beside this document is the orientation for a new contributor; `llms.txt` is the same orientation, compressed and linked, for an agent.

This document records what each game teaches, why the interaction is shaped the way it is, and the implementation that carries it. The reader it is written for is a teacher or a parent who wants to know why the screen looks like that — and the next person who has to change it.

---

## Shared decisions

These apply to every file, so they are stated once.

### Paper, not glass

The palette is cream (`--paper:#fdf7ea`), ink (`--ink:#191c3a`), and hard 2.5 px borders with offset shadows. Nothing glows, nothing blurs, nothing floats. The reference object is a well-printed workbook, not a phone app.

The reason is attention. A saturated gradient and a soft shadow say *look at the surface*; a black line and a flat fill say *look at the numbers*. Eight-year-olds are easily drawn to chrome, and every pixel of chrome is a pixel not spent on the mathematics. The one place the design allows spectacle is the confetti burst on a completed deck, which is bounded by `prefers-reduced-motion`.

Typography follows the same logic. `ui-rounded` is the first family because its single-storey `a` and open counters are the shapes children are taught to write. Body text is `1.05rem` at `1.5` line height — larger and looser than the usual web default — and labels are sentence case. The uppercase micro-type that earlier drafts used for tab labels is gone: at 0.66 rem with 0.1 em tracking it is legible to an adult and a grey smear to a child.

### Fifty, and never the same fifty twice

Every deck is `const TOTAL = 50`. A deck is a *unit of completion*, and a unit has to be long enough to cover the topic: a child who plays Times Tables twice in a week and meets the same twenty facts both times has practised recall, not the table.

The bank is not a file. Every pool is generated in code from the level's parameters — `poolFor(level)` in addition, subtraction, and division, `factsFor(mode, table)` in times tables, the splits of each whole in number bonds. No question is stored, so no question can be deleted; changing the deck size changes how much of the generated space a session walks.

Freshness is a persisted map, `seen: { bucket: { factKey: timestamp } }`, written into each game's existing localStorage record. `freshFirst()` puts every unseen fact ahead of every seen one; within the seen group the least recently served comes first. `markSeen()` stamps a fact when it is *served*, not when the deck is built — a child who quits at question 3 has spent three facts, not fifty. The map is capped (`SEEN_CAP`, 600–900 keys per game) and drops its oldest entry, so it cannot grow without bound.

A pool smaller than the deck cycles rather than repeats inside one deck: `newCycle()` reorders by timestamp and the loop increments a pass counter. On the first pass a fact may not repeat at all; on later passes only an immediate repeat is forbidden. Without that counter the fill loop never terminates — Make 10 holds nine splits and three blank positions, and the unconditional duplicate check spins forever looking for a twenty-eighth unique question.

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

### A lesson is opened, not scheduled

Physics and chemistry paint a lesson *instead of* the first question on a topic. That works because their decks are drawn from a bank that has topics: there is a well-defined first question about photosynthesis, and it is the moment to teach it. A maths drill has no topics — it has a mode, and its questions are generated. There is no first question about carrying, because carrying is a property of the numbers, not a field on a record.

So the five maths drills do the opposite. A **Learn** button sits in the bottom-right corner of every drill, and the lesson is a dialog behind it: four topics, a picker, the rule, a worked example, the mistake that usually goes with it. The drill never interrupts itself.

The reason is not only mechanical. A drill is a place a child goes to *practise*, and a lesson arriving unbidden in the middle of a deck is a change of activity the child did not ask for. The child who is getting it right does not need the lesson; the child who is getting it wrong is the one who will press the button, or whose adult will point at it. Making it available rather than automatic respects both.

The overlay is a dialog rather than a stage because the five drills have five different stage machines — `#stage`, `.stage`, four tabs, none at all. A shared engine that guessed where to paint would be wrong on three of them. A fixed-position dialog sits over whatever the page is doing and leaves it alone, and it injects its own stylesheet rather than asking five palettes to agree: a lesson should look like the page it is on.

### The engine owns the deck, not the drill

The five drills had drifted into five copies of the same four things — `$`, a shuffle, the freshness deck, the WebAudio blips — and the copies had diverged. `freshFirst` took four different signatures across the five. `SEEN_CAP` was applied in three and only declared in two. The streak flourish existed in three of five. This is what a shared mechanism is for, so the four things moved into `maths-engine.js`.

What did *not* move is the interaction. Number bonds drag a divider along a track; addition and subtraction animate base-ten blocks column by column; the times tables have an array you step through; division deals cookies onto plates. Those are the drills. An engine that owned them would have made five drills into one drill, which is the opposite of what a shared engine is for — the sharing is cheap only where the five genuinely do the same thing.

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

**The plausibility check.** Three-digit questions show a dashed prompt before the answer is entered: *580 is about 600, 240 is about 240, so the answer should be around 840.* After a correct answer it confirms: *About 840? Yes — 823 is close to that.* Estimation is the only error check a child can run alone, and a mis-carried digit is exactly the error it catches — the answer is wrong by a hundred and looks plausible only to someone who never estimated. The prompt appears on three-digit sums only, because on `7 + 8` it would be noise.

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

**Practise · 50.** Fifty questions, with the same support toggle and review queue as the other drills. The picture toggle splits the array into two coloured rectangles — `split = min(5, b)` — so `7 × 8` shows as a 7 × 5 block plus a 7 × 3 block. That is the distributive property made visible, and it is why the split is at five rather than anywhere else: five is the anchor children already have.

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

**Run length.** 50, 10, or Endless, defaulting to 50. The arena draws from a twelve-skill weighted generator rather than a fixed pool, so freshness is a soft skip: a fact already in the run's `seen` map is passed over for the first 30 attempts and then allowed, because a hard exclusion on a generator that can legitimately repeat a skill would starve the run instead of enriching it.

**No shaming.** When every skill is above the mastery threshold the first build said something about having nothing left to practise. It now says: *You have mastered everything here. Try the next difficulty for a fresh challenge.* A dead end is a design failure, and telling a child they are done is a way of telling them to stop.

**Operator colour is dynamic.** The operator sign in the question takes the fixed colour for its operation, so the symbol that determines the whole procedure is the most visually distinct character on screen.

---

## 07 · Typing Tutor (`typing-tutor.html`)

**Teaches:** touch typing, home row outward.

The keyboard is drawn on screen, and every key carries a **finger colour** — eight groups, left little through right little, with a matching legend. The key the learner should press next is highlighted, and the highlight moves with them. The finger colours answer the question a beginner actually has, which is not "which letter is that" but "which finger do I use".

**Progressive lessons.** Twelve, in order: home row, home-row words, top row, top-row words, bottom row, bottom-row words, all three rows, capitals, numbers, punctuation, common words, sentences. Each unlocks at 80% accuracy on the one before. The order is deliberate: letters are learned by row because the hand learns a row as a unit, and words follow immediately because isolated letters are not what typing is for.

**Accuracy over speed.** The completion screen leads with accuracy, then words per minute, then mistakes. WPM is displayed during the run because it is motivating, but the star thresholds are set on accuracy (`95 / 85 / 80`) so that rushing is not rewarded.

**Per-key diagnosis.** Every miss is recorded against the *target* key, and the five worst keys are shown as chips below the keyboard (`k 4×`). This is the feature that makes the game a tutor rather than a metronome: the learner leaves knowing which two keys to practise, not just how fast they were.

**The diagnosis becomes a lesson.** The chips used to last one run — `startLesson` cleared the map, and the ranking was recomputed from scratch every time. Two counters now: `keyErr` for this run, which drives the chips, and `weak`, cumulative and saved, which drives a thirteenth card in the picker. Its text is generated from the five worst keys by scoring every word in the twelve lesson texts on how many of those keys it carries, taking the top fourteen, and appending a four-key run for any named key the fourteen left out — which is the only way a key like `;`, present in one word in the whole corpus, gets practised rather than merely named. The space bar cannot appear inside a word, so a child whose only weak key is space gets the shortest words instead, whose spaces are the practice.

The card is appended, never inserted, so `state.lesson` keeps indexing the same twelve; it is always unlocked, because it is earned by the mistakes that built it rather than by the lesson before it; and it records no best score, because its text is regenerated on every finish. Playing it clean halves the counts it was built on, so a fixed key stops being drilled — without that the count only rises and "your hardest keys" becomes a fact about history rather than about now.

**Timing.** No timer, 30 seconds, or 60 seconds. No timer is the default, because the point at the start is accuracy and a clock is a distraction from it. The timed modes exist for a learner who wants a score.

**Input handling.** A hidden, off-screen input receives keystrokes so mobile keyboards work, and the document-level listener refocuses it. Backspace is swallowed — a typing tutor that lets you delete a mistake is a tutor that never sees one. Enter types a newline where the target has one.

---

## 08 · Spelling Bee (`spelling-bee.html`)

**Teaches:** the spelling of 1,239 competition words, and the reasons behind them.

Most spelling software is a word list with a text box. That teaches one thing — whether you happen to know a word — and nothing about the word that would let you derive it the next time. This game is built on the opposite premise: a hard spelling is almost always the trace of a rule, a root, or a historical accident, and a learner who can name which one applies can reconstruct the word instead of recalling it.

**Every word carries four explanations**, shown together on the study card and split across the feedback in the drills:

- **Root.** The etymology, with the actual morphemes named and glossed. `photograph` is Greek *phos* (light) + *graphein* (to write), which is why it has two `ph` and no `f`. This is the highest-value field, because origin language predicts spelling: Greek says expect `ph`, `ch`, and `y`; French says expect a silent final consonant; Latin says expect the prefix to assimilate.
- **Rule.** A reusable statement the child can apply to other words — not "remember the double m" but "`ad-` assimilates to the next consonant, and *commodus* already had `mm`". The rules sheet behind the header button collects twenty of these, from *i before e* to the `-cede/-ceed/-sede` split.
- **Trap.** A chunked respelling or mnemonic with the hard letters capitalised: `acc-MM-odate`. It is shown as monospace because it is a sequence of letters, not a sentence.
- **Sentence.** The word used correctly in a child-readable sentence, with the headword bolded. The definition alone does not tell `stationary` from `stationery`; a sentence about a parked car does.

**Four modes, chosen for four different retrieval paths.** Recall is not one skill, and a spelling that is easy to produce from a definition can be impossible to produce from sound.

- **Learn** — the study card. All four explanations at once, with speech for the word and the sentence. This is the presentation phase; it is not scored.
- **Spell it** — the word is spoken and its definition is shown, and the learner types it. Fifty words. The definition is the retrieval cue, which is the cue that matters in writing.
- **Tell them apart** — four spellings, one meaning, one right answer. This is the *differentiation* drill: the failure mode for a competent speller is not an unknown word, it is `principle` where they meant `principal`. Options are drawn only from words that are themselves in the bank, so a distractor is always a real word with a real meaning — never a misspelling, which would teach the wrong form by showing it. Most words carry one hand-written confusable, so the remaining slots are filled with near neighbours from the same tier, scored on a shared prefix, shared letters, a shared ending and a similar length. Without that fallback the drill was a two-option coin flip for 871 of the 1,239 words; with it, every question is four distinct real words and the discrimination is in the spelling.
- **The Bee** — the competition format. The word is spoken and *not* shown; the learner may spend clues on the definition, the origin, or a sentence, and has three lives. Twenty words. The clue buttons are the metacognitive training: a bee speller who knows the word is French should ask for the origin, and this mode rewards knowing which question to ask.

**Word count.** `BANK.length` drives the home screen, and the bank holds 1,239 entries, split 315 / 379 / 545 across the three tiers. Tier 1 is ages 8–9, tier 2 ages 10–11, tier 3 ages 12–14; the Bee draws from the chosen tier upward, so a champion-level learner is not served `pebble`.

**Freshness.** The same `seen` map and `freshFirst`/`markSeen`/`newCycle` machinery as the maths drills, keyed by tier *and* mode, so a second visit meets words the child has not been shown. `markSeen` fires when a card is rendered, not when the deck is built.

**Speech.** `speechSynthesis` reads the word twice at 0.78 rate, then the definition or sentence on request. This is the one feature that makes the Bee usable without a reader, and it is why the mode can exist at all.

**Results.** Accuracy percentage, stars on the same `90 / 70` thresholds as the maths games, and a list of the words missed with what the child actually typed. That list is the study plan for the next session.

---

## 09 · French (`french.html`)

**Teaches:** 300 words and phrases, the gender of every noun in the bank, and the sentence frame each word lives in.

Built on the shared `lang-engine.js`, so the queue, spaced review, speech and scoring are the same machinery as the spelling bee. The bank is the content.

**Five modes, because a word is five different facts.** *Learn* is the study card: the word with its article, a respelled pronunciation, the English, an example sentence with the headword highlighted, and a watch-out. *Gender* asks for the article alone — `le`, `la` or `les` — which is the fact that French learners most often learn late and pay for longest. *French to English* and *English to French* are the two retrieval directions. *Sentence* shows the example with the headword blanked and offers four words from the same family and tier, so the answer is chosen by grammar rather than by remembering which sentence came with which word.

**The bank stores the article, not the gender.** `fr` is `le chat`, not `chat` plus `gender: m`, so the form the learner sees on every card is the form they have to produce. `gender` is derived from the article at build time and exists only so the gender drill can ask the question.

**The gender drill draws only from nouns.** A mode that can only ask about nouns must draw from nouns; without that, `articlePrompt` fell back to a translation question for the numbers and verbs in the deck, and the learner met `nineteen` in a drill about articles. `cfg.pool(mode, entry)` is the hook: the deck for a mode is `all.filter(pool)` when that leaves anything, and the whole tier otherwise.

**Elided nouns are asked as `le`/`la`, not as `l'`.** Twenty-three nouns in the bank begin with `l'` — `l'école`, `l'eau`, `l'oiseau` — and the drill originally offered only `le`/`la`/`les`, so those cards had no correct option to pick. The elision follows mechanically from the vowel, so asking for it would test a spelling rule rather than the gender. The drill asks `le`/`la`, and the feedback names the elided form in a sentence. Plural nouns are asked as `les` whatever their singular gender: `les parents` is masculine and would otherwise be asked as `le`.

**No drill puts the answer in a fixed position.** Both the article drill and the Mandarin tone drill built their option list with the answer first; unshuffled, the correct option sat in the same place on every card and the drill could be passed without reading it. Every option list in the three language games is shuffled.

**Accents are forgiven once, and named.** A right spelling without its accents returns `'accent'` rather than `false`, so `eleve` for `élève` is reported as *"right word, wrong accents"* and the card shows the accented form. Marking it simply wrong teaches nothing; marking it fully right teaches that accents do not matter.

---

## 10 · Kiswahili (`swahili.html`)

**Teaches:** 300 words, the noun class of every noun, and the greeting and sentence forms.

Same engine, different grammar. Kiswahili's difficulty for an English speaker is not vocabulary but the noun class system, which governs agreement across the whole sentence. So the drill that matters is *class*: given a noun, name its class (1/2 for people, 3/4 for trees and natural objects, 7/8 for things, 9/10 for the borrowed nouns). The bank stores `class` on nouns only, and `cfg.pool` keeps the class deck to nouns that have one, for the same reason the French gender drill is nouns-only.

**Pronunciation is written for an English reader**, not in IPA: `asante` is `ah-SAHN-teh`. The `say` field is what the speech button falls back to when no Swahili voice is installed, and it is on the study card where it is needed.

**The sentence mode uses the greeting and travel phrases**, because those are the frames a learner meets first: `Habari yako?` — `Nzuri, asante.`

---

## 11 · Mandarin (`chinese.html`)

**Teaches:** 300 words and phrases, their tones, their characters, and how the characters are built.

Mandarin is four facts stacked: the word, its pinyin, its tone, and its character. The study card shows all four at once — hanzi, pinyin with tone marks, the tone numbers, the English, an example sentence, the radical and the stroke count — because a learner who meets them separately meets them as four unrelated facts.

**Five modes.** *Learn*, *Tone* (name the tone contour of the syllable), *Chinese to English*, *Pinyin* (produce the romanisation), and *Pick the character* (four hanzi, one reading). The last two are the ones that separate recognising a word from knowing it.

**Tone is a separate fact from pinyin**, so `tones` is stored as a list (`[2, 5]` for `yéye`) and the tone drill asks about the contour, not the spelling. The distractor tones are drawn from the other tones in the same tier, never from a tone the syllable could not take.

---

## 12 · Chinese Calligraphy (`calligraphy.html`)

**Teaches:** the stroke order of 440 characters, drawn on a rice grid.

This is the game that cannot be faked by multiple choice. The learner draws each stroke with a finger or mouse; the stroke is correct only when it starts where the real stroke starts, runs in the same direction, and has the same shape. A stroke drawn backwards covers the same pixels and fails.

**Where the data comes from.** 440 characters, selected by frequency from Jun Da's Modern Chinese list, each with a complete record in four independent datasets that all agree on the stroke count: Make Me a Hanzi's stroke skeletons and dictionary, its graphics outlines, CC-CEDICT's glosses, and cnchar-order's authoritative stroke names. The build refuses a character where the datasets disagree on the count rather than guessing an alignment. Sources are archived in `sources/calligraphy/` and indexed in `sources/INDEX.md`.

The first attempt at stroke names was a geometry classifier over the skeletons. It agreed with hand-authored names on 52% of strokes, then 58%, then 51%: `竖` and `撇` overlap in their travel fractions, `捺` and `点` both move rightward and down. Three failures on correct input is not a tuning problem, it is the wrong instrument — a stroke's *name* is curriculum data, not something to infer from a polyline. cnchar-order supplies the names positionally, and the 84 hand-drawn characters served as the canary that proved the classifier wrong.

**Scoring.** Both the drawn stroke and the target are resampled to 16 points of equal arc length, so the comparison is of shape rather than of speed or scale. A stroke passes when the mean point distance is under 9 and the endpoint error under 16, which rejects a backwards stroke. The tolerance is deliberately loose: this is a hand-drawn stroke on a phone screen, not a vector match.

**Every character shows four things:** the character, its pinyin, its English gloss, and a sketch. The sketch is one of three kinds, in order of preference: one of the 84 hand-drawn pictograms the game shipped with; a composition of the character's own decomposition tree, with each component stamped into the slot its ideographic description character names (so `都` is drawn as `者` + `阝`, and `现` as `王` + `见`); or, when neither is available, the character's radical alone, and only when that radical depicts something. A radical that denotes nothing — `一`, `亅`, a lid — gets no drawing, because a made-up picture is worse than none: the learner would memorise the invention. All 440 have one of the three.

**Pronunciation is spoken, not just written.** The pinyin is on the card with tone marks, and clicking the character speaks it with `speechSynthesis` at `zh-CN`. This matters more in Mandarin than in the other languages in the arcade, because a tone is not recoverable from the spelling.

**Stroke hints are per-stroke curriculum data.** Every stroke name maps to a one-line instruction (*"Right-falling — sweep down and to the right, pressed as it lands"*), written once in a table and joined to the 3,086 strokes at build time. The Show-me button prints it and flashes the stroke in red in place.

---

## 13 · Physics (`physics.html`) and 14 · Chemistry (`chemistry.html`)

**Teach:** 240 questions each across ten topics, with worked reasoning.

Each topic also has a written lesson page that arrives before the first question from that topic — see the lesson note below.

Both run on the shared `science-engine.js`. Two modes: *Quiz* (four options, one right) and *Work it out* (type the answer).

**Every distractor encodes a specific mistake.** `d1`, `d2` and `d3` are not random wrong numbers; each one is what you get by making a particular error — adding instead of subtracting, multiplying instead of dividing, leaving the unit unconverted. The engine names that error when the learner picks it. A wrong answer that says *"Adding the forces because both are given, or reversing the direction"* teaches more than a red cross.

**The answer field takes a number, and the unit is checked wherever it appears.** `num()` pulls the leading number so `9.8 N` and `9.8` compare equal, with a 2% tolerance for rounding, and reads scientific notation whole so the mantissa of `6.02 × 10²³` is not the answer to anything. A right number with the wrong unit is not the right answer: the unit is compared whether it is in the unit field or in the answer's own text, and the feedback says so specifically — *"The number is right; the unit is not"* — rather than marking the whole thing wrong. That distinction is the point of separating the two.

**Not every answer that starts with a digit is a quantity.** `2,8,7` is an electron configuration and `2, 1, 2` is a set of coefficients. Read through `num()`, which strips commas, the first becomes 287 and the second 212 — so a learner who typed the bare number would be marked right for a fact they were never asked. `isQuantity()` gates the numeric path: a quantity is a number followed by a unit and nothing else, with no comma, operator or arrow. Everything else is matched as text. In the chemistry bank that moves 186 of 240 answers onto the text path.

**The formula is a chip, not the question.** It is shown with the explanation after the answer, so the learner reasons first and checks the shape of the reasoning afterwards.

**A quiz that only asks is a test, not a lesson.** Both subjects now carry a teaching page per topic — `physics-lessons.js` and `chemistry-lessons.js`, ten each — and the lesson arrives **immediately before the first question from that topic**, not as a preamble to the deck. A deck of twenty crosses many topics; a wall of ten lessons before question one is a barrier, and it teaches each idea too far from the moment it is needed. `render()` checks the question's topic against `taught` and shows the lesson on a first encounter. A topic is taught once and never again, so a second deck goes straight to the questions, and the topic chips on the home screen carry a tick or a `new` badge so the child can see which ideas they have met.

**Every lesson carries two diagrams.** Prose describes a resultant force or an ionic transfer; a drawing shows it, and the drawing is what a child of this age takes the idea away as. Each lesson has two inline SVG figures with captions — forty in all — drawn in the page's own palette and geometry so they read as part of the paper arcade rather than as clip art. Inline is not a preference: an `<img src>` or an icon font would break the offline guarantee, so the SVG is authored in the lesson data and injected as markup, with only the caption escaped. The figures sit between the rule and the reasoning beats, where the rule has just been stated and the beats are about to explain it. They are drawn to a `viewBox` and sized by CSS, so the same figure is legible at 390px and on a desktop; the probe checks that no figure overflows its card or the viewport at phone width and that none collapses to zero height.

**The lessons are written, not derived.** A lesson generated from the question bank would be a spoiler — it would hand over the answer to every question drawn from it — and one generated from the explanations would be a list of answers with the questions stripped off. Each lesson states why the idea matters, the rule, two or three beats of reasoning, a worked example using numbers the bank does not ask about, the line to remember, and the one mistake that usually goes with it. That last part is the same idea as the distractors: name the error rather than only marking it wrong.

The lessons are escaped on the way into the DOM. They are authored text, but they are text, and a stray angle bracket should print rather than break the page. `taught` is stored alongside the rest of the game's state, so it survives a reload.

---

## 15 · Piano (`piano.html`, `piano-engine.js`)

**Teaches:** to read music and to play it — the staff, the keyboard, the intervals, the keys, the chords, and then a tune.

Every other game in the arcade is text and numbers on a page. Music is the one subject where the answer has a sound, and a course that only ever asked "which note is this?" would teach notation the way a phrasebook teaches a language: as a set of symbols that never become speech. So this page has three answer channels and one bank, and the channels are the design.

**One bank, three channels.** A question carries notes and a right answer. The mode decides how it arrives: `read` shows the staff and asks the child to name it; `hear` plays it and hides the staff; `find` shows the staff and asks for a key to be pressed. These are three different skills and a learner can be good at one and poor at another — a child who can decode the page may not hear that a third is minor, and a child who plays by ear may not read. Keeping them as separate decks is what lets the record say which one is weak. The staff is hidden in `hear` for a reason that is easy to miss: leaving it visible would put the answer on the screen and the ear would never be used at all.

**Find mode judges pitch class, not MIDI.** The keyboard spans two octaves, and a child who presses C5 when the question meant C4 has answered the question that was asked. Judging the exact MIDI number would fail them for an octave they were never asked about.

**A flat is a sign, not a pitch.** MIDI has already lost the distinction between C♯4 and D♭4: they are one key and one staff position, and only the spelling says which glyph goes in front of the note head. The renderer therefore defaults to a sharp and takes the sign from the caller, and sixteen accidental questions carry it — eight sharp, eight flat. Drawing every black key with a ♯ would have taught half the accidentals and taught the other half wrongly, since the answer to "which note is this" is the spelled letter.

**The staff is computed from the note, not drawn beside it.** Every vertical position comes from the note's diatonic index — its letter and octave, counting lines and spaces rather than semitones — so C and C♯ occupy the same position and differ by the accidental in front. `positionOf()` derives the words *"in the third space"* from that same index. The consequence worth stating: the explanation printed under a question cannot disagree with the picture above it, because both come from one number. The alternative — an SVG per question, drawn by hand — would have drifted on the first edit, and the drift would have been invisible, because a note head one space out still looks like a note head.

**A bar is drawn, not described.** Rhythm questions were text with a picture of a note beside them: a learner could recite that 4/4 holds four crotchets and never decode a bar of them. `rhythmSvg` now draws a staff, a time signature and the barlines that fall where the running total completes the bar, and five questions ask what signature a drawn bar is in. The signature printed on the staff and the numerator the barlines are counted from are two separate options, because the identify-the-signature question has to show the bar without showing its answer.

The same reasoning puts duration on the staff. `staffSvg` takes the beats of each note and draws it hollow, stemmed or flagged accordingly, and the play stage passes the piece's real beat counts, so Hot Cross Buns shows minims and semibreves rather than eight identical crotchets. A window taken from the middle of a piece carries the beats already elapsed, or the barlines would land in the wrong places for every window but the first — a picture that is right at the start and wrong thereafter is worse than no barlines.

**Sound without assets.** Pitch is synthesised from oscillators: a sine for the body, a quieter triangle an octave up for the attack. A chord offsets its notes by 35 ms so the attacks are heard separately. The timbre is not a piano and it does not try to be; the alternative is a sample library, and the arcade's offline guarantee is worth more than the timbre. The cost is paid where it is cheapest.

**Nothing is timed.** The play stage shows a nine-note window, lights the key that comes next, and waits. A metronome that the learner cannot keep up with does not teach rhythm, it teaches guessing, and a child who is slow but right is playing it right. Speed is a consequence of accuracy, not a prerequisite for it — the same reason the drills hold a wrong answer instead of advancing on a timer.

**The distractors are the mistakes.** A note question offers the letter a second away, the one a third away, and the octave — the three ways a beginner misreads a position. An interval question offers the semitone either side and the third, because major-versus-minor is the confusion learners actually have. Choosing one prints the name of the error, exactly as the science games do. A distractor that is merely different teaches nothing when it is chosen.

**Ten topics, in the order a course goes.** Note names, the staff, the keyboard, rhythm, intervals, scales, chords, harmony, sight-reading, playing. The lessons arrive attached to the first question that needs them, on the same rule the science pages use, because a wall of ten lessons before question one is a barrier rather than teaching.

**The order of the daily session changed, and the change is the interesting part.** Eleven subjects with six non-language ones cannot alternate strictly while spelling stays first — and spelling stays first deliberately, because it is the drill a child is most likely to skip. So one pair of non-language subjects sits together, at the end, between piano and the machine shelf: the two least alike things in the list. The guard in `session.js` asserts what is true (no two languages adjacent, and the plan opens on a language) rather than what would have been convenient to assert.

---

## 16 · How Things Work (`how-things-work.html`, `figures/`)

**Teaches:** that a machine is a set of parts with a job each, and that the job is visible if you look inside.

The other seventeen games ask the child to produce an answer. This one asks them to find the part that moves. Twenty-six everyday machines — a toaster, a washing machine, a vending machine, a desk fan, a traffic light, a wind-up toy — each drawn as a real 3D model with working controls, and each with a **See-through** mode that fades the case to a ghost and draws the mechanism inside: the bimetal strip that releases the toaster's latch, the coin wheel that drops exactly one gumball, the float that shuts the cistern's fill valve, the spiral that pushes the drink off the shelf.

**The figures are not ours.** They are April Zhu's Colorfigures demo figures, MIT-licensed, copied in whole and unmodified into `figures/`, with the licence beside them. Each is already a complete page: the model, a drag-to-turn camera, a light that turns with the viewer, buttons that operate the machine, a See-through switch and a Labels switch that names each part and lights the one that is working. That is a lot of engineering, and reimplementing it inside the arcade's own design system would have produced a worse figure with the arcade's palette on it. The design decision is to **frame them rather than restyle them** — the arcade supplies the window, the figure supplies the object.

**The wrapper says as little as it can.** It shows one figure in an iframe, prints the author's own title, the author's hint, and — where the figure ships one — the figure's "big idea" line, then lists the other twenty-five on a shelf in six groups. It does not describe the machines. A description written here would be a second source of truth that the figures cannot correct, and the first time one drifted, the page would be teaching something the model contradicts. Seven of the twenty-six ship without an idea line; the page shows nothing for those rather than filling the gap.

**The frame is a window, not a component.** Each figure sets `document.body.innerHTML` when it mounts and ships its own `:root` palette and paper texture, so pasting one into the arcade's DOM would overwrite the page. An iframe gives it the document it expects. Two consequences follow. First, the frame's height is fixed — 820 px, 740 px on a phone — because a page cannot read another frame's document from `file://` in Chromium or WebKit, so fitting the height at runtime would work only when the arcade is served over HTTP; the numbers are measured against the tallest of the 26 rather than guessed. Second, the frame's own paper (`#f2efe7`, a warmer cream than the arcade's `#fdf7ea`) is left alone: the arcade's border and offset shadow around it make the difference read as depth, the way a photograph in a paper album reads as a window rather than a printing error.

**One machine met is the day's sitting.** The page declares `#done` with `class="stage"`, so the session tracker reads it like every other stage game, and the button that marks it is about today, not about ever — a machine met last week can still be the one that finishes today's session. `explored` is a `{slug: timestamp}` map, so the shelf shows what has been met and the featured machine walks forward through the ones that have not. The featured machine is derived from the date plus that map, never stored, for the same reason the maths rotation is: nothing to drift. `perGroup` holds a percentage per group purely so the hub's star rating can read this record the way it reads every other game's bucket; the shelf itself has no score, because there is nothing here to get right.

The shelf's completion marker is a judgement worth stating: a quiz scores, a shelf is *visited*. Marking a machine met means the child has opened it and pressed something, not that they have understood it. That is the honest claim the page can make without inventing an assessment, and it is why the copy says "met" rather than "learned".

---

## 17 · Savanna Run (`savanna-run.html`, `algebra-bank.js`, `african-history.js`)

**Teaches:** one-step and two-step algebra, with the answer chosen by how high you jump; and six places in African history, met as terrain.

**The mechanic is the answer, not a button.** A gate stands in the runner's path carrying an equation and three numbers, each pinned to a different height. A tap reaches the low band, a held jump the high one, and the band the runner's apex is nearest is the answer submitted. There is no "confirm": the physics is the input. That is why the bank's job is narrower than a quiz bank's — it must guarantee that the three values are distinct positive integers and that the height a child reaches is the only thing separating them.

**No gravity while the button is held.** The runner climbs at a constant rate for as long as the button is down, so apex height is *linear* in hold time rather than quadratic. A quadratic curve puts two of the three bands within a few tens of milliseconds of each other at the top, which is unreachable for a child and indistinguishable between frames. Constant climb gives three hold times — 0 ms, 100 ms, 250 ms — that land 71 px, 123 px and 201 px up: separated by more than one frame of travel at 60 fps, so the bands cannot blur into each other. Gravity resumes on release, and `COYOTE_MS` and a jump buffer soften the edges the way a platformer should.

**The distractors are the mistakes.** `3x + 7 = 22` offers `15` (divided the 3 into 22 without first removing the 7), `9` (added instead of subtracted) and `5`. A gate whose wrong answers were random would test nothing but the ability to redo the arithmetic; these diagnose which step went wrong. Each form in `algebra-bank.js` lists the errors it is worth catching, and the builder keeps the first two that survive being whole, positive and distinct from the answer.

**Candidates, not filtered answers.** A form that filters its own mistakes has to know which of its errors survive, and the first three versions of the bank each got that wrong differently — `add` offered only negatives, `sub` offered negatives for small `x`, `div` offered fractions — so every draw fell through to a fallback and the gate a child saw was not the gate the form describes. The fix is structural: forms emit a candidate list, one builder filter keeps two. A probe that builds 1,000 gates and checks all five properties against them is what confirms no form can fall through.

**History is terrain, and the facts arrive on the card.** Mid-run a child passes an obelisk, a mud-brick mosque, a dry-stone wall, a dhow, a train. Dates and names arrive at the checkpoint, where there is time to read them. Six levels: Aksum, Mali, Great Zimbabwe, Kilwa, Kenya, Adwa — the four eras the content brief named, plus Kenya with a level of its own rather than a footnote.

**Every history fact carries a source.** This is the one bank in the arcade whose claims are not checkable by doing the sum. `algebra-bank.js` is verified by solving the equation; `african-history.js` is not, and a claim that cannot be sourced does not go in. The `source` field is asserted by the probe for exactly that reason: the discipline is cheap to keep and impossible to recover once a dozen unsourced facts have accumulated.

**The art is vector, and the brief asked for photo-real.** It cannot ship here. The arcade is static and offline: no build step, no network outside the page's own origin, and every page runs from `file://`. Photo-realistic 3D needs WebGL, meshes and textures — tens of megabytes, a build step, and fetches — and those three properties are the ones `dev-llms.txt` says must survive every change. What ships instead is a 960×420 canvas with four parallax layers, silhouette figures, dust and a motion trail, all drawn from the same paper palette as every other page. The parallax is derived from scroll offset rather than from spawned objects, so the hills are in the same place on every run and nothing accumulates.

---


Seventeen cards, each with an illustration, a one-sentence description, tags, and **0–3 stars read from that game's own storage**. Each game writes `{ level|mode: bestPct }`; the index scans the bucket, takes the maximum, and maps it to stars with the same thresholds the games use. The arena stores EMAs instead, so its card reads the maximum `ema × 100`.

Above the grid, a **Today's suggestion** lane lists the three games played least recently, with "Never played" or "N days ago" beside each. It is computed on load and hidden if the list is empty. The point is to make the choice of what to play next a decision the page can help with, rather than one the child makes by picking the same card every time.

The index records a play when a card is clicked (`arcade.lastplay`), which is what the lane sorts on. That is the only state the index keeps.

---

---

## The daily session (`session.html`, `session.js`)

The arcade is seventeen games; a child needs a day. The session page is the superstructure: **twelve subjects, once each, alternating language with science, number and music** — spelling, maths, savanna run, French, physics, Mandarin, chemistry, Kiswahili, typing, calligraphy, piano, how things work. Maths is one subject with six games, and the game rotates by the day number, so over six days every maths game comes up once and a child cannot dodge the same one every day. The rotation is derived from the date, not stored, so it cannot drift.

**Five of the twelve subjects are languages.** Spelling, French, Kiswahili, Mandarin, and calligraphy — which is Chinese character writing, not a separate art. In the order the subjects were first listed, those five ran consecutively, and five language drills back to back is one skill practised five ways, not five subjects.

**With twelve subjects, strict alternation is impossible, and the page says so rather than pretending otherwise.** There are seven non-language subjects and five languages, and the plan opens on spelling — deliberately, because spelling is the drill a child is most likely to skip and it should not get to hide behind a game. Opening on a language forces two pairs of non-language subjects to sit together. One pair sits at the top, savanna run beside maths, because the run is algebra gates and reads as the same subject continued. The other sits at the end, between piano and the machine shelf, which are the two least alike things in the list. Each subject carries a `kind` (`lang` or `other`); a load-time check throws if any two `lang` subjects end up adjacent or if the plan does not open on a language. A sixth language would make even that impossible, and the guard would say so.

**The order is the point, not a preference.** Spelling comes first, then maths, because they are the two subjects most likely to be skipped, and the two word drills sit before the three languages because they ask less of a tired learner. A rotating order would let a child avoid the same subject every time; a fixed one makes avoidance visible.

**Completion is read from each game's own summary screen, not from a new signal.** The games finish three different ways: the nine `.stage` games (spelling, French, Kiswahili, Mandarin, calligraphy, physics, chemistry, piano, how things work) toggle `#done.on`; the five maths drills, the typing tutor and savanna run toggle `#done.show`; the arena shows `#summaryPanel.show`. Rather than ask seventeen games to change how they end, `session.js` is loaded by each page and watches the class attribute of whichever element the page declares. The marker is read from the element's own class — `class="stage"` means `on`, `class="done"` means `show` — because accepting either on either page would count `.stage.on`, which is true on the home screen of every stage game.

The observer is filtered to `class` and `hidden` attributes. The games repaint their DOM on every keystroke; an unfiltered subtree observer would run thousands of times per deck for one event.

**A deck already finished at load is not a completion.** If a child reopens a summary they had already seen, `armed` is false and nothing is recorded. One toast per page load: a second deck in the same subject is not news.

The record is `arcade.session.v1` — `{ v, days: { 'YYYY-MM-DD': { done: { subjectId: timestamp } } } }` — trimmed to 120 days on write, because an unbounded object in `localStorage` eventually throws on write. The day key is local, not UTC: a child finishing at nine in the evening should get credit for that evening.

**A streak is the run of consecutive complete days ending today**, and an unfinished today does not break it — it is the run ending yesterday until today is complete. That is the difference between a streak that rewards showing up and one that punishes a slow morning. There is no counter of lost days.

The session page shows the day as a numbered checklist with the next subject marked, a progress bar, a three-week history strip, and a two-step clear button. The index grows a **Today's session** card that reads the same tracker, so there is one definition of the order and one record of the day.

Every game's back link now points at `session.html` rather than `index.html`, so finishing a deck and pressing back lands on the list that says what is next. The index is still one click away.

---

## Verification

Each inline `<script>` block is extracted and run through `node --check` after every edit. That catches syntax errors and nothing else: it does not render the page, so it cannot catch a layout break, a missing element id, or a wrong value written into the DOM. There is no build step and no test runner; the files are the artefact.

Where a claim cannot be checked statically, it is probed in a real browser from `file://` — the way the pages are opened. The probes live in `probes/` and are run with `python3 -I probes/<name>.py`. They are written to fail: each was canaried by planting the defect it guards, watching it trip, and restoring the file byte-identical.

- **`probes/lessons.py` — the lesson overlay.** For each of the five drills: the engine and bank load, one Learn button mounts, the dialog opens, every topic in the picker renders its title, why, rule, remember, trap, worked answer and figures, the picker marks itself pressed, and Escape and the backdrop both close it and restore body scroll.
- **`probes/grading.py` — the drills still play.** One question is answered in each drill and the submit is confirmed *graded*: a correct answer advances by itself, a wrong one reveals **Next**. A keystroke that is dropped does neither. This is the check that a click landed is not enough for — `markSeen` runs when a question is *rendered*, so the freshness record is already one before the first answer and cannot be used as the signal.
- **`probes/shell.py` — the whole arcade.** All 19 pages load from `file://` with no page exception and no duplicate element id, which is what the confetti change risked: the engine now mounts a canvas lazily and reuses a page's existing `#confetti` rather than adding a second one.
- **`probes/savanna.py` — the jump is the answer.** A thousand gates are built and each is checked for three distinct positive options containing the equation's own solution, with the solution recomputed by a shape-dispatched parser rather than trusted from the bank. The band reading is checked to be *nearest apex* rather than *highest passed* — the exact band heights cannot tell the two apart, so the discriminating cases are apexes just under a band. Each of the three hold times is driven through the real `press`/`step`/`release` path and must land in its own band, which is the claim that caught a real bug: `doJump` set `vy = 0` instead of the upward impulse, so a 250 ms hold reached 139 px and every jump scored the low band. Finally, a wrong answer must cost one try and leave the same equation in place, and the history bank must be complete and sourced.
- **`probes/freshness.py` — the deck reads the keys it writes.** This one exists because the other three cannot see the bug it guards. A drill with a mismatched freshness key plays perfectly: every question renders, every answer is graded, and the only thing wrong is that the drill has forgotten what it served. So the probe seeds the record — every fact in a mode served except one — and asserts the unserved fact comes first. It is the check that the shared `keyOf` argument actually reaches `freshFirst`, and it caught a real regression during the engine swap.
- **`probes/typing_drill.py` — the weak-key card is a lesson, not a label.** Nine claims over the generated drill. The one that needed the most care is cover: the card names five keys and the text must ask for all of them, so the fixture is `e` at 10 misses beside `;` at 1 — `e` is the commonest letter in the corpus and fills all fourteen word slots, crowding `;` out entirely. A first version seeded four well-fed keys, the cover rule never fired, and its canary passed clean: the test was a fixture where the bug could not appear. The others: a fresh record has no card; the card is last and unlocked; a clean run halves the counts (and drops the ones that floor to zero); a miss raises exactly the key that was *wanted* and no other; a lesson abandoned mid-way still saves, so the count is cumulative and survives a reload; the drill records no best score; and the drill still ends the day for `session.js`. The space-only fixture exists because space cannot appear inside a word — the fallback to shortest-words is what gives that child a drill at all.

The session tracker and the machine shelf were probed the same way. For the session tracker: for each of the seventeen games, the class the page declares records that page's subject and the class it does not declare is ignored; a typing lesson played to its summary by typing the passage records `typing`; the maths rotation covers all six games across six days; the streak, history and 120-day trim were exercised against a stub store; and corrupt, missing and wrong-typed storage all read as empty rather than throwing. For the machine shelf, including the revisit that must not record twice: the first click writes the day and the subject, and a reload shows `#done.on` already set with `armed` false and no toast.

## What is deliberately absent

- **No accounts, no sync, no network.** The files open from `file://` and work offline. Progress is per-browser, and the index says so.
- **No leaderboards.** Comparison to other children is the fastest way to make a slow learner stop.
- **No streaks that punish absence.** The arena decays skill estimates; it does not break a chain or show a lost number. The session page counts consecutive complete days, but an unfinished today does not break the run until the day is over, and nothing anywhere reports a lost streak.
- **No time pressure in the drills.** The only clock in the arcade is the optional one in the typing tutor.
- **No score on the machine shelf.** A quiz can mark an answer; a shelf can only say a machine was met. The page says exactly that and does not dress a visit up as mastery.
