# The Arcade: design and implementation notes

Fourteen self-contained games in `frontend/public/arcade/`. No build step, no network, no accounts. Each game is one HTML file with inline CSS and JS; progress lives in `localStorage` under a per-game key. Content that is large and tabular lives beside the page rather than inside it — the spelling bee's thousand words, the four language banks, the 440-character calligraphy bank and its sketches, the physics and chemistry questions — because a thousand annotated entries inline would triple the file and make the engine unreadable. The language games share `lang-engine.js` and the science games share `science-engine.js`; the engines hold the interaction, the banks hold the content.

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

Both run on the shared `science-engine.js`. Two modes: *Quiz* (four options, one right) and *Work it out* (type the answer).

**Every distractor encodes a specific mistake.** `d1`, `d2` and `d3` are not random wrong numbers; each one is what you get by making a particular error — adding instead of subtracting, multiplying instead of dividing, leaving the unit unconverted. The engine names that error when the learner picks it. A wrong answer that says *"Adding the forces because both are given, or reversing the direction"* teaches more than a red cross.

**The answer field takes a number, and the unit is asked for separately.** `num()` pulls the leading number so `9.8 N` and `9.8` compare equal, with a 2% tolerance for rounding. But a right number with the wrong unit is not the right answer: if the learner types a unit of their own and it is not the one the prompt asked for, the answer fails, and the feedback says so specifically — *"The number is right; the unit is not"* — rather than marking the whole thing wrong. That distinction is the point of separating the two.

**The formula is a chip, not the question.** It is shown with the explanation after the answer, so the learner reasons first and checks the shape of the reasoning afterwards.

---

## The index (`index.html`)

Fourteen cards, each with an illustration, a one-sentence description, tags, and **0–3 stars read from that game's own storage**. Each game writes `{ level|mode: bestPct }`; the index scans the bucket, takes the maximum, and maps it to stars with the same thresholds the games use. The arena stores EMAs instead, so its card reads the maximum `ema × 100`.

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
