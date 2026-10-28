/* A fact, told as a story.
 *
 * F-21. Every maths question in the arcade is symbolic: `7 + 8`, `15 − 8`,
 * `56 ÷ 7`. That is the right way to drill a fact and the wrong way to find
 * out whether the child can use it. A word problem is where arithmetic is
 * actually met, and it fails for reasons that are not arithmetic -- so the
 * drill should ask for the same facts in that form sometimes.
 *
 * The layer sits over the fact, not over the pool. A page already knows which
 * fact it is asking (it built the queue); this module is handed that fact and
 * either returns a story whose answer is exactly that fact's answer, or
 * returns null and the page shows the sum as it always did. Nothing about
 * grading changes: the answer box takes a number either way.
 *
 * Three rules the templates hold to, and the probe checks:
 *
 *   1. The story states the operation in words. "Tom has 7 apples and Ann
 *      has 8" does not say what to do with them; "How many between them?"
 *      does. A template whose question could be answered two ways is a
 *      comprehension test wearing an arithmetic question's clothes.
 *
 *   2. The story carries exactly two numbers, and neither is the answer. No
 *      red herrings: a distractor number is a reading test, and this is not
 *      one. Where the answer happens to equal an operand -- 16 − 8 = 8 -- the
 *      numeral is unavoidable, and the probe counts those rather than
 *      pretending the rule holds.
 *
 *   3. The numbers are plausible for the noun. "903 pet rabbits" is absurd in
 *      a way that makes a child distrust the question. Each unit carries a
 *      ceiling and each template carries its own, and a fact that fits
 *      neither gets no story rather than a silly one. Level 3 addition is
 *      three-digit sums, so most of those facts simply have no story; that is
 *      the honest outcome, and `coverage` reports it.
 *
 * Every fourth question is a story. Interleaving is the point: the child
 * reads, then computes, then computes, then reads. A separate "word problems"
 * mode would let a child who can read avoid it and a child who cannot read
 * never meet the arithmetic.
 */
(function () {
  'use strict';

  /* Countable nouns with a ceiling. The ceiling is what the story may say;
     past it the sentence stops being something a person would write. */
  const UNITS = [
    { one: 'apple', many: 'apples', max: 60 },
    { one: 'sticker', many: 'stickers', max: 500 },
    { one: 'marble', many: 'marbles', max: 200 },
    { one: 'book', many: 'books', max: 300 },
    { one: 'pencil', many: 'pencils', max: 200 },
    { one: 'biscuit', many: 'biscuits', max: 100 },
    { one: 'shell', many: 'shells', max: 200 },
    { one: 'conker', many: 'conkers', max: 100 },
    { one: 'sweet', many: 'sweets', max: 100 },
    { one: 'card', many: 'cards', max: 200 },
    { one: 'seed', many: 'seeds', max: 500 },
    { one: 'stamp', many: 'stamps', max: 400 }
  ];

  /* Containers, with their plurals spelled rather than derived: "boxs" is the
     defect a `+ 's'` would produce on the most useful word in the list. */
  const PLACES = [
    { one: 'box', many: 'boxes' },
    { one: 'bag', many: 'bags' },
    { one: 'tin', many: 'tins' },
    { one: 'tray', many: 'trays' },
    { one: 'jar', many: 'jars' },
    { one: 'basket', many: 'baskets' },
    { one: 'packet', many: 'packets' },
    { one: 'drawer', many: 'drawers' }
  ];

  const NAMES = ['Tom', 'Ann', 'Mia', 'Sam', 'Leah', 'Jonah', 'Priya', 'Omar',
                 'Nia', 'Kofi', 'Rosa', 'Idris'];

  /* `1 apple`, `6 apples`. A generator that writes "1 apples" is the kind of
     thing that makes a product feel machine-made, and it is one function to
     get right. */
  function counted(n, unit) {
    return n === 1 ? '1 ' + unit.one : n + ' ' + unit.many;
  }

  /* The story shapes, per operation. `fit(c)` decides whether the numbers
     suit the sentence; `make(c)` writes it. `c` carries the two operands,
     the unit, the places and two distinct names. */
  const TEMPLATES = {
    add: [
      { id: 'add-total', max: 99,
        fit: c => c.a >= 1 && c.b >= 1,
        make: c => ({
          text: `${c.n1} has ${counted(c.a, c.u)} in one ${c.p1.one} and `
              + `${counted(c.b, c.u)} in another. How many ${c.u.many} altogether?`,
          answer: c.a + c.b }) },
      { id: 'add-more', max: 99,
        fit: c => c.b >= 1,
        make: c => ({
          text: `${c.n1} has ${counted(c.a, c.u)}. ${c.n2} gives ${c.n1} `
              + `${counted(c.b, c.u)}. How many ${c.u.many} does ${c.n1} have now?`,
          answer: c.a + c.b }) },
      { id: 'add-join', max: 99,
        fit: c => c.a >= 1 && c.b >= 1,
        make: c => ({
          text: `${c.n1} has ${counted(c.a, c.u)} and ${c.n2} has ${counted(c.b, c.u)}. `
              + `How many ${c.u.many} do they have between them?`,
          answer: c.a + c.b }) }
    ],

    /* A subtraction fact is `x − y = d`, so the story gives the whole and the
       part taken away and asks for what is left. The other order -- giving
       the difference -- would be an addition question. */
    sub: [
      { id: 'sub-left', max: 99,
        fit: c => c.y >= 1,
        make: c => ({
          text: `${c.n1} had ${counted(c.x, c.u)} and gave away ${c.y}. `
              + `How many ${c.u.many} are left?`,
          answer: c.x - c.y }) },
      { id: 'sub-difference', max: 99,
        fit: c => c.x > c.y && c.y >= 1,
        make: c => ({
          text: `${c.n1} has ${counted(c.x, c.u)} and ${c.n2} has ${counted(c.y, c.u)}. `
              + `How many more ${c.u.many} does ${c.n1} have?`,
          answer: c.x - c.y }) },
      /* This one names its own noun, so the unit's ceiling does not apply to
         it -- `ownNoun` says so, and `fits` skips that test. Without it the
         template could only fire for units that allow 300 of something, which
         is none of them, and the flag would be a dead branch. */
      { id: 'sub-pages', max: 300, ownNoun: true,
        fit: c => c.y >= 1 && c.x <= 300,
        make: c => ({
          text: `${c.n1} is reading a book of ${c.x} pages and has read ${c.y}. `
              + `How many pages are left?`,
          answer: c.x - c.y }) }
    ],

    /* A multiplication fact is `a × b`, and both orders mean the same thing:
       `b` groups of `a` or `a` groups of `b`. The templates use the grouping
       the drill's own picture draws. */
    mul: [
      { id: 'mul-groups', max: 20,
        fit: c => c.a >= 1 && c.b >= 1,
        make: c => ({
          text: (c.b === 1
              ? `There is one ${c.p1.one}, with ${counted(c.a, c.u)} in it. `
              : `There are ${counted(c.b, c.p1)}, with ${counted(c.a, c.u)} in each. `)
              + `How many ${c.u.many} altogether?`,
          answer: c.a * c.b }) },
      // `b` is a count of rows, so a single row is a sentence nobody writes:
      // "a basket holds 1 rows of 7 stamps". The other two templates read `b`
      // as a number of objects and are fine at one.
      { id: 'mul-rows', max: 20,
        fit: c => c.a >= 1 && c.b >= 2,
        make: c => ({
          text: `A ${c.p1.one} holds ${c.b} rows of ${counted(c.a, c.u)}. `
              + `How many ${c.u.many} is that?`,
          answer: c.a * c.b }) },
      { id: 'mul-cost', max: 20,
        fit: c => c.a >= 1 && c.b >= 1,
        make: c => ({
          text: `${c.n1} buys ${counted(c.b, c.u)} at ${c.a}p each. `
              + `How many pence is that?`,
          answer: c.a * c.b }) }
    ],

    /* A division fact is `x ÷ y = q`, so the story gives the whole and the
       group size and asks for the number of groups. Sharing between one
       person is not a question, so `y` must be at least two. */
    div: [
      { id: 'div-share', max: 400,
        fit: c => c.y >= 2,
        make: c => ({
          text: `${counted(c.x, c.u)} are shared equally between ${c.y} children. `
              + `How many ${c.u.many} does each child get?`,
          answer: c.x / c.y }) },
      { id: 'div-groups', max: 400,
        fit: c => c.y >= 2,
        make: c => ({
          text: `${counted(c.x, c.u)} are packed into ${c.p1.many} of ${c.y}. `
              + `How many ${c.p1.many} are filled?`,
          answer: c.x / c.y }) },
      { id: 'div-plates', max: 400,
        fit: c => c.y >= 2,
        make: c => ({
          text: `${c.n1} has ${counted(c.x, c.u)} and puts ${c.y} on each plate. `
              + `How many plates are used?`,
          answer: c.x / c.y }) }
    ]
  };

  /* Turn a page's own question into `{op, x, y}`, or null.
   *
   * Each of the five drills names its numbers differently -- a bond has
   * `whole`/`a`/`b` and a blank, a division has `dividend`/`divisor` -- so
   * the mapping lives here rather than five times over in the pages. The
   * operation for a bond depends on which cell is blank: a missing whole is
   * an addition, a missing part is a subtraction. */
  function factOf(game, q) {
    if (!q) return null;
    if (game === 'number-bonds') {
      const whole = Number(q.whole), a = Number(q.a), b = Number(q.b);
      if (![whole, a, b].every(Number.isInteger)) return null;
      if (q.blank === 'whole') return { op: 'add', x: a, y: b, answer: whole };
      if (q.blank === 'a') return { op: 'sub', x: whole, y: b, answer: a };
      if (q.blank === 'b') return { op: 'sub', x: whole, y: a, answer: b };
      return null;
    }
    if (game === 'addition-quest') {
      const a = Number(q.a), b = Number(q.b);
      if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
      return { op: 'add', x: a, y: b, answer: a + b };
    }
    if (game === 'subtraction-safari') {
      const a = Number(q.a), b = Number(q.b);
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < b) return null;
      return { op: 'sub', x: a, y: b, answer: a - b };
    }
    if (game === 'times-table-academy') {
      const a = Number(q.a), b = Number(q.b);
      if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
      return { op: 'mul', x: a, y: b, answer: a * b };
    }
    if (game === 'division-diner') {
      const n = Number(q.dividend), d = Number(q.divisor);
      if (!Number.isInteger(n) || !Number.isInteger(d) || d < 1 || n % d !== 0) return null;
      return { op: 'div', x: n, y: d, answer: n / d };
    }
    return null;
  }

  /* The operands, in the order the template family reads them: `a` and `b`
     for the commutative pair, `x` and `y` for the one that is not. */
  function operandsOf(fact) {
    if (fact.op === 'add' || fact.op === 'mul') return { a: fact.x, b: fact.y };
    return { x: fact.x, y: fact.y };
  }

  /* Does this template fit these numbers with this unit? Both ceilings apply:
     the unit's, because "500 apples" is absurd, and the template's, because
     "a book of 900 pages" is a different kind of sentence. */
  function fits(tpl, fact, unit) {
    const c = Object.assign(operandsOf(fact), { u: unit });
    const nums = [c.a, c.b, c.x, c.y].filter(v => v !== undefined);
    if (nums.some(n => !Number.isInteger(n) || n < 0)) return false;
    // A template that names its own noun is not describing `unit`, so the
    // unit's ceiling is not a fact about it.
    if (!tpl.ownNoun && nums.some(n => n > unit.max)) return false;
    if (nums.some(n => n > tpl.max)) return false;
    return tpl.fit(c);
  }

  /* Every template that could tell this fact, for a caller that wants to know
     before it picks. */
  function candidates(fact) {
    if (!fact) return [];
    const out = [];
    for (const unit of UNITS) {
      for (const tpl of TEMPLATES[fact.op] || []) {
        if (fits(tpl, fact, unit)) out.push({ tpl, unit });
      }
    }
    return out;
  }

  /* One story for one fact, or null.
   *
   * `rnd` is injectable so a probe can pin the choice; the page passes
   * `Math.random`. A fact with no fitting template returns null and the page
   * shows the sum. That is not a failure -- it is the answer for a three-digit
   * sum, where every story would need an implausible noun. */
  function storyFor(game, q, rnd) {
    const fact = factOf(game, q);
    if (!fact) return null;
    const pool = candidates(fact);
    if (!pool.length) return null;
    const pick = (rnd || Math.random)();
    const { tpl, unit } = pool[Math.floor(pick * pool.length) % pool.length];
    const c = Object.assign(operandsOf(fact), {
      u: unit,
      p1: PLACES[Math.floor((rnd || Math.random)() * PLACES.length) % PLACES.length],
      n1: NAMES[Math.floor((rnd || Math.random)() * NAMES.length) % NAMES.length]
    });
    // A second place and a second name, distinct from the first. "Tom has 7
    // and Tom has 8" is not a story about two people.
    c.p2 = PLACES[(PLACES.indexOf(c.p1) + 1 + Math.floor((rnd || Math.random)() * (PLACES.length - 1))) % PLACES.length];
    c.n2 = NAMES[(NAMES.indexOf(c.n1) + 1 + Math.floor((rnd || Math.random)() * (NAMES.length - 1))) % NAMES.length];
    const made = tpl.make(c);
    return {
      id: tpl.id, op: fact.op, text: made.text, answer: made.answer,
      fact, unit: unit.many, expect: fact.answer
    };
  }

  /* Whether this question in this deck should be a story.
   *
   * Every fourth question, never the first two. The first two carry the
   * worked example, which is a demonstration of the column method -- a story
   * on top of it would be two explanations at once. */
  function wanted(index) {
    return index >= 2 && index % 4 === 3;
  }

  /* ---------- the page side ---------- */

  const CSS = `
  .storybox { display: none; }
  .storybox.on { display: block; margin: 4px 0 14px; padding: 12px 14px;
    max-width: 34em; text-align: left; font-size: 1.12rem; line-height: 1.45;
    border: 2.5px solid var(--ink, #191c3a); border-radius: 14px;
    background: #fffdf6; box-shadow: var(--hard, 6px 6px 0 var(--ink, #191c3a)); }
  @media (max-width: 420px) { .storybox.on { font-size: 1.02rem; } }`;

  function injectCSS() {
    if (document.getElementById('storyCSS')) return;
    const s = document.createElement('style');
    s.id = 'storyCSS';
    s.textContent = CSS;
    document.head.append(s);
  }

  let box = null;

  /* The story on screen, in memory.
   *
   * Not written into the DOM: a data attribute carrying the answer is one
   * inspector keystroke from a child, and the page's own `state.queue` already
   * holds every answer for the drill. This is the same information at the same
   * exposure, and it is what lets a probe type the right number. */
  let current = null;

  function shown() { return current; }

  /* Show or clear the story box and the symbolic question together.
   *
   * `hide` is the page's list of selectors for its own digits. Both directions
   * run on every question -- the box is cleared and the digits restored when
   * there is no story -- because `style.display` set on one question outlives
   * the next one's `innerHTML` rewrite.
   *
   * Called at the end of the page's `renderQuestion`, after the page has set
   * its own hint and screen-reader text: it overwrites both when a story is
   * showing, because "Add the ones first" is advice for a column sum and the
   * child is looking at a story. */
  function apply(game, q, index, hide) {
    injectCSS();
    const sels = hide || [];
    const story = wanted(index) ? storyFor(game, q) : null;

    if (!box) {
      const anchor = document.getElementById('qsay');
      if (!anchor) return story;
      box = document.createElement('div');
      box.className = 'storybox';
      box.id = 'storyBox';
      box.setAttribute('role', 'note');
      anchor.after(box);
    }

    for (const sel of sels) {
      document.querySelectorAll(sel).forEach(el => { el.style.display = story ? 'none' : ''; });
    }

    current = story;
    box.classList.toggle('on', !!story);
    // `textContent`, not `innerHTML`: the story is generated text, and text is
    // the one context this arcade has never had to escape.
    box.textContent = story ? story.text : '';

    const ask = document.getElementById('ask');
    const hint = document.getElementById('hint');
    const say = document.getElementById('qsay');
    if (story) {
      if (ask) ask.textContent = 'Story sum';
      if (hint) hint.textContent = 'Read the story, then type the number.';
      // The screen reader gets the story and not the sum: the sum is hidden,
      // and reading a question the sighted child cannot see is a different
      // question.
      if (say) say.textContent = story.text;
    }
    return story;
  }

  window.ArcadeStory = {
    UNITS, PLACES, NAMES, TEMPLATES,
    counted, factOf, fits, candidates, storyFor, wanted, apply, shown
  };
})();
