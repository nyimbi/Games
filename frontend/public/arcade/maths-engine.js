/* Shared machinery for the five maths games.
 *
 * The five were written separately and had drifted into five copies of the
 * same four things: a `$` shorthand, a shuffle, the freshness deck that keeps
 * a fact out of the next set until the unseen ones have had their turn, and
 * the WebAudio blips. Copies drift: `freshFirst` took four different
 * signatures across the five, and only two of them could be called the same
 * way twice.
 *
 * What is *not* here is the interaction. Number bonds drag a bead along a
 * track, addition and subtraction animate base-ten blocks column by column,
 * the times tables have an explore mode with an array picture, and division
 * has a cookie-and-plate model you can deal by hand. Those are the games. An
 * engine that owned them would be an engine that made five games one game.
 *
 * So this file owns what is genuinely shared, and the lesson overlay -- which
 * every maths game needed and none had. The overlay injects its own CSS
 * rather than asking five stylesheets to agree, because the five games have
 * five different palettes and a lesson should look like the page it is on.
 */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const rnd = n => Math.floor(Math.random() * n);
  // Shared escapes: esc for text nodes, escAttr for quoted attribute
  // values. See escape.js for why the split is not a union.
  const esc = window.ArcadeEscape.esc, escAttr = window.ArcadeEscape.escAttr;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ---------- freshness ----------
   *
   * A fact served in an earlier set goes behind every unseen one, so the same
   * week's second deck is a second deck. Within each group the least recently
   * served comes first, and ties are shuffled so two facts seen at the same
   * moment do not always reappear in the same order.
   *
   * The bucket is keyed by whatever the game says identifies a fact; the
   * default is `a|b`, which is what four of the five use.
   */
  /* One deck, in deck.js. These are adapters, not copies: the maths drills
     pass the whole `seen` map plus a bucket name, the shared module takes the
     bucket object, and a wrapper is cheaper than rewriting twelve call sites
     in the same commit that changes the behaviour. `keyOf` has no default here
     either -- it is required by ArcadeDeck and the TypeError surfaces on the
     first question rather than as a deck ordered by the wrong identity. */
  const SEEN_CAP = window.ArcadeDeck.SEEN_CAP;

  const freshFirst = (pool, seen, bucket, keyOf) =>
    window.ArcadeDeck.freshFirst(pool, seen[bucket] || {}, keyOf);

  function markSeen(seen, bucket, key) {
    return window.ArcadeDeck.markSeen(seen[bucket] || (seen[bucket] = {}), key);
  }

  /* ---------- the review map ----------
   *
   * `seen` is capped above; `review` was capped nowhere. Its key space is the
   * level x fact space, and subtraction level 3 draws its operands at random,
   * so it grows with every distinct question ever asked. Every save() is
   * inside a bare catch, so the eventual QuotaExceededError presents as
   * progress silently not saving -- the failure session.js guards against for
   * its own record and no drill guarded against for this one.
   *
   * Eviction is by miss count, not age: a fact the child keeps getting wrong
   * is the one review exists for, and dropping it to bound the object would
   * bound the object by deleting its purpose. Entries not `due` go first, so
   * a clean fact outranks a missed one of the same count.
   */
  const REVIEW_CAP = 400;

  function capReview(review) {
    const keys = Object.keys(review);
    if (keys.length <= REVIEW_CAP) return review;
    keys.sort((x, y) => {
      const a = review[x], b = review[y];
      // due first (kept), then most misses, then most attempts. The due flag
      // is read through isDue so an entry on the new schedule ranks by its
      // nextAt rather than by a boolean that only ever describes the last
      // answer -- a fact answered right an hour ago and one answered right a
      // minute ago both carry due:false, and only the stamp separates them.
      const aDue = window.ArcadeDeck.isDue(a), bDue = window.ArcadeDeck.isDue(b);
      if (aDue !== bDue) return aDue ? 1 : -1;
      if ((a.miss || 0) !== (b.miss || 0)) return (a.miss || 0) - (b.miss || 0);
      return (a.n || 0) - (b.n || 0);
    });
    const drop = keys.length - REVIEW_CAP;
    for (let i = 0; i < drop; i++) delete review[keys[i]];
    return review;
  }

  /* Record one attempt against a review entry.
   *
   * All six drills used to inline `if (!right) due = true; else if (due) due =
   * false`, which retires a missed fact after a single correct answer -- review
   * that forgets. spelling-bee.html had a guard, `r.due && r.n >= 2`, but `n`
   * counts attempts, not successes: trace correct, correct, miss, correct and
   * the miss lands at n=3, so one right answer still retires it.
   *
   * The boolean was replaced by a ladder of intervals and a `nextAt` stamp in
   * deck.js, because one bit cannot say how long a fact should stay out of the
   * queue. The entry still carries `ok` (successes since the last miss) and
   * `due` (kept in sync), so a record written by the previous build reads the
   * same way. See `ArcadeDeck.noteAttempt` for why a miss is due now rather
   * than two minutes out.
   */
  const REVIEW_PASSES = 2;

  function noteReview(review, key, right, ms) {
    return window.ArcadeDeck.noteAttempt(review, key, right, null, ms);
  }

  /* ---------- which lesson answers this mistake ----------
   *
   * README.md:783 asks the question directly: "whether a drill could notice
   * what a child keeps getting wrong and offer the one lesson that covers it".
   * Both halves already exist -- `review[k].miss` is the signal and
   * `MATHS_LESSONS[drill].topics` is the target -- and nothing joined them. A
   * child who has missed nine carrying sums gets the Learn button, which opens
   * on a lesson they have not read.
   *
   * The classifier is a function of the fact, not of the lesson text. That is
   * the only way it can be right for a pool generated at runtime: `a` and `b`
   * are all the record holds, and every topic below is decidable from them.
   *
   * Each drill gets its own function because "carrying" means something
   * different in each. They live here, beside the engine, rather than in the
   * five pages, because five copies of a classifier is how five copies of a
   * deck algorithm happened.
   *
   * What this deliberately does NOT do:
   *
   *   - It does not fire on one miss. Three is the threshold, and it is three
   *     misses across the topic, not three on one fact: a deck forbids repeats
   *     in its first pass, so the same fact three times is a signal the deck
   *     actively prevents. Two misses is a bad afternoon; a lesson offered
   *     after two interrupts a child who is about to get it.
   *   - It does not fire twice for one topic in a session. `sessionTopics`
   *     lives in the page, not the record, so tomorrow offers it again if the
   *     misses are still there.
   *   - It does not fire for a topic the child has already read. `taught` is
   *     not a gate on the drill; it only stops the same lesson being offered.
   */
  const STUCK_MISSES = 3;

  /* Addition and subtraction: which column, and whether it needed a carry or
     a borrow. A two-digit column that carries is the case the lessons are
     about, so the digits decide the topic rather than the level.
   *
   * `ten` is NOT here. It is a number-bonds topic, and a classifier that
   * returned it for an addition page would name a lesson that page does not
   * have -- the dialog would render blank and every other test would pass.
   * `stuckTopic` filters unknown ids, and the probe's claim 6 is what caught
   * the first version doing exactly this. */
  function placeTopic(a, b, op) {
    if (op === 'sub') {
      // The ones column borrows when the top digit is smaller than the bottom.
      if (a % 10 < b % 10) return 'borrowing';
      if (a < 20 && b < 20) return 'takeaway';
      return 'counting';
    }
    // A single-digit pair that makes ten is the *place value* case on an
    // addition page: the ones column overflows into a ten, which is what
    // `place` means there. `ten` is a bonds topic, not an addition one.
    if (a < 10 && b < 10 && a + b === 10) return 'place';
    if (a % 10 + b % 10 >= 10) return 'carrying';
    if (a >= 10 || b >= 10) return 'place';
    return 'place';
  }

  const TOPIC_OF = {
    /* Bonds: the blank is what the question asks, so it decides the topic
       before the numbers do. A blanked whole is a different question from a
       blanked part even when the numbers are the same. */
    'number-bonds': q => {
      if (q.blank === 'whole') return 'parts';
      if (q.whole === 10) return 'ten';
      if (q.whole > 10) return 'teen';
      return 'missing';
    },
    'addition-quest': q => placeTopic(+q.a, +q.b, 'add'),
    'subtraction-safari': q => placeTopic(+q.a, +q.b, 'sub'),
    /* Times: a fact in the 10x10 grid that is one of the squares, or that
       sits above 10, is a different lesson from the small ones. `commutative`
       is the topic for the pair whose reverse is also in the deck, which is
       every pair off the diagonal. */
    'times-table-academy': q => {
      const a = +q.a, b = +q.b;
      if (a > 10 || b > 10) return 'patterns';
      if (a === b) return 'meaning';
      if (a === 1 || b === 1) return 'meaning';
      return 'commutative';
    },
    /* Division: a remainder is the lesson, and it is decidable exactly. */
    'division-diner': q => {
      const d = +q.divisor, n = +q.dividend;
      if (d === 0) return 'sharing';
      if (n % d !== 0) return 'remainder';
      if (n / d === 1) return 'sharing';
      return 'inverse';
    }
  };

  /* A fact key is `a|b` or `level|a|b` or `whole|a|blank` or `divisor|dividend`.
     The drills each parse their own; this is the one place that knows all five,
     and it returns the two numbers plus whatever third field the key carries. */
  function parseFact(game, key) {
    const parts = String(key).split('|');
    if (game === 'number-bonds') return { whole: +parts[0], a: +parts[1], blank: parts[2] };
    if (game === 'division-diner') return { divisor: +parts[0], dividend: +parts[1] };
    if (game === 'times-table-academy') return { a: +parts[0], b: +parts[1] };
    return { level: parts[0], a: +parts[1], b: +parts[2] };
  }

  /* The topic the child is stuck on, or null.
   *
   * `review` is the drill's record, `game` is the page name, `skip` is the set
   * of topics already offered this session. Ties break on total misses across
   * the topic, then on the topic's position in the drill's own list, so the
   * answer is stable between two renders of the same record. */
  function stuckTopic(game, review, topics, skip) {
    const classify = TOPIC_OF[game];
    if (!classify || !Array.isArray(topics) || !topics.length) return null;
    const known = new Set(topics.map(t => t.id));
    const tally = {};
    for (const [key, r] of Object.entries(review || {})) {
      const misses = (r && r.miss) || 0;
      if (misses < 1) continue;
      let topic;
      try { topic = classify(parseFact(game, key)); } catch (_) { continue; }
      if (!topic || !known.has(topic)) continue;
      const t = tally[topic] || (tally[topic] = { misses: 0, facts: 0 });
      t.misses += misses;
      t.facts += 1;
    }
    // The threshold is on the topic, not on the fact. A deck forbids repeats
    // in its first pass, so "the same fact missed three times" is a state the
    // deck works against; "three facts of this kind missed" is the state a
    // child actually reaches, and it is the one a topic lesson is for.
    for (const k of Object.keys(tally)) {
      if (tally[k].misses < STUCK_MISSES) delete tally[k];
    }
    const order = topics.map(t => t.id);
    const ranked = Object.entries(tally)
      .filter(([id]) => !(skip && skip.has(id)))
      .sort((x, y) => (y[1].misses - x[1].misses) || (order.indexOf(x[0]) - order.indexOf(y[0])));
    return ranked.length ? ranked[0][0] : null;
  }

  /* Every fact, ordered by how long ago it was served. A deck shorter than the
     fact space needs the whole space in that order, not a slice of it. */
  const newCycle = (pool, seen, bucket, keyOf) =>
    window.ArcadeDeck.newCycle(pool, seen[bucket] || {}, keyOf);

  /* ---------- audio ----------
   *
   * Oscillators, not samples: the arcade opens from file:// and ships no
   * assets. Lazy context, resumed on use, everything in try/catch because a
   * browser that refuses audio must not break the game.
   */
  let ctx = null;
  function audio() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (_) { return null; }
  }

  function tone(freq, dur, type, gain) {
    const c = audio(); if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(gain || .05, c.currentTime + .012);
      g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + (dur || .12));
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + (dur || .12) + .02);
    } catch (_) { }
  }

  /* A rising third for a right answer, and a step up again for a streak, so
     the sound reports how well it is going without a word. The third note at
     five in a row is the flourish all five games already had; dropping it here
     would have been a silent regression in the engine's first week. */
  function goodSound(streak) {
    const s = streak || 0;
    const b = 523.25 * Math.pow(2, Math.min(s, 7) / 12);
    tone(b, .1, 'sine', .045);
    setTimeout(() => tone(b * 1.25, .12, 'sine', .04), 70);
    if (s >= 5) setTimeout(() => tone(b * 1.5, .16, 'triangle', .035), 150);
  }
  function badSound() {
    tone(196, .16, 'triangle', .05);
    setTimeout(() => tone(155, .2, 'triangle', .045), 110);
  }
  function clickSound() { tone(660, .05, 'square', .02); }

  /* Canvas confetti, mounted on first use. All five games carried the same
     fifty lines with the same six colours and the same gravity; the only thing
     that differed was the count, which is now the argument.
   *
   * Mounted lazily rather than declared in five documents: a page that never
   * wins a round should not pay for a full-screen canvas it does not draw on. */
  let conf = null;
  const CONF_COLORS = ['#5b6cff', '#ffb703', '#ff6b6b', '#0fb5a1', '#9b5de5', '#7cb518'];

  function mountConfetti() {
    if (conf) return conf;
    // The five pages already declare `#confetti`; reuse it rather than adding a
    // second element with the same id. A page that does not gets one built.
    let canvas = document.getElementById('confetti');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40';
      document.body.append(canvas);
    }
    conf = { canvas, cx: canvas.getContext('2d'), bits: [], raf: null };
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
      conf.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    addEventListener('resize', size); size();
    conf.size = size;
    return conf;
  }

  function confTick() {
    const { cx, canvas } = conf;
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (const b of conf.bits) {
      b.vy += .32; b.vx *= .992; b.x += b.vx; b.y += b.vy; b.rot += b.vr; b.life -= .008;
      cx.save(); cx.translate(b.x, b.y); cx.rotate(b.rot); cx.globalAlpha = Math.max(b.life, 0);
      cx.fillStyle = b.c; cx.fillRect(-b.r / 2, -b.r / 2, b.r, b.r * 1.7); cx.restore();
    }
    conf.bits = conf.bits.filter(b => b.life > 0 && b.y < innerHeight + 40);
    if (conf.bits.length) conf.raf = requestAnimationFrame(confTick);
    else { cx.clearRect(0, 0, innerWidth, innerHeight); conf.raf = null; }
  }

  function burst(n) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    mountConfetti();
    const N = n || 30;
    for (let i = 0; i < N; i++) {
      conf.bits.push({
        x: innerWidth / 2 + (Math.random() - .5) * 160,
        y: innerHeight * .34 + (Math.random() - .5) * 40,
        vx: (Math.random() - .5) * 9, vy: -Math.random() * 10 - 2,
        r: 3 + Math.random() * 5, rot: Math.random() * 6.28,
        vr: (Math.random() - .5) * .3, c: CONF_COLORS[i % CONF_COLORS.length], life: 1
      });
    }
    if (!conf.raf) confTick();
  }

  /* ---------- the lesson overlay ----------
   *
   * Every maths game had a model you could play with and no page that said
   * what the idea was. The model teaches the one case in front of you; a
   * lesson is what you can carry to the next one.
   *
   * The overlay is a dialog rather than a stage, because the five games have
   * five different stage machines (`#stage`, `.stage`, tabs, none at all) and
   * a shared engine that guessed which would be wrong on three of them. A
   * dialog sits over whatever the page is doing and leaves it alone.
   */
  const CSS = `
  .maths-lesson-btn{position:fixed;right:16px;bottom:16px;z-index:9990;display:flex;align-items:center;gap:7px;
    background:#ffb703;color:#191c3a;border:2.5px solid #191c3a;border-radius:999px;padding:10px 16px;
    font:900 .92rem/1 ui-rounded,system-ui,sans-serif;cursor:pointer;box-shadow:4px 4px 0 #191c3a}
  .maths-lesson-btn:hover{transform:translate(-1px,-1px);box-shadow:5px 5px 0 #191c3a}
  .maths-lesson-btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #191c3a}
  .maths-lesson-btn .ic{font-size:1.05rem}
  .maths-lesson-wrap{position:fixed;inset:0;z-index:9991;display:none;background:rgba(25,28,58,.55);
    padding:16px;overflow-y:auto;-webkit-overflow-scrolling:touch}
  .maths-lesson-wrap.on{display:block}
  .maths-lesson{max-width:620px;margin:24px auto;background:#fdf7ea;color:#191c3a;border:2.5px solid #191c3a;
    border-radius:20px;box-shadow:6px 6px 0 #191c3a;padding:22px 22px 20px;font:400 1rem/1.55 ui-rounded,system-ui,sans-serif}
  .maths-lesson h2{font-size:1.35rem;font-weight:900;letter-spacing:-.02em;margin:0 0 4px}
  .maths-lesson .pick{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 4px}
  .maths-lesson .pick button{background:#fffdf8;border:2px solid #191c3a;border-radius:999px;
    padding:7px 13px;font:800 .84rem/1 ui-rounded,system-ui,sans-serif;cursor:pointer;color:#191c3a}
  .maths-lesson .pick button[aria-pressed="true"]{background:#191c3a;color:#fdf7ea}
  .maths-lesson .lwhy{font-size:1.02rem;margin:14px 0}
  .maths-lesson .lrule{background:#fff8e6;border:2px dashed #f0cd7a;border-radius:14px;padding:12px 14px;margin:14px 0}
  .maths-lesson .lrule b{display:block;font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;color:#8a6d1f;margin-bottom:3px}
  .maths-lesson .lrule p{margin:0;font-weight:700}
  .maths-lesson .lbeats{margin:14px 0;padding-left:20px}
  .maths-lesson .lbeats li{margin:8px 0}
  .maths-lesson .lex{background:#fffdf8;border:2px solid #191c3a;border-radius:14px;padding:13px 15px;margin:14px 0}
  .maths-lesson .lex>b{display:block;font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;color:#6d7194;margin-bottom:6px}
  .maths-lesson .lex .lq{font-weight:800;margin:0 0 8px}
  .maths-lesson .lex ol{margin:0 0 8px;padding-left:20px}
  .maths-lesson .lex li{margin:5px 0}
  .maths-lesson .lex .la{font-weight:900;margin:0;color:#1f6f4a}
  .maths-lesson .lremember{display:flex;gap:10px;align-items:baseline;border-top:2px solid #191c3a;
    border-bottom:2px solid #191c3a;padding:10px 0;margin:16px 0}
  .maths-lesson .lremember b{font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;color:#6d7194;flex:0 0 auto}
  .maths-lesson .lremember span{font-weight:800}
  .maths-lesson .ltrap{background:#fdecec;border:2px solid #e63946;border-radius:12px;padding:11px 13px;
    margin:0 0 14px;font-size:.95rem}
  .maths-lesson .ltrap b{color:#a4131e}
  .maths-lesson .figs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:14px 0}
  .maths-lesson figure{margin:0;background:#fffdf8;border:2px solid #191c3a;border-radius:12px;padding:8px}
  .maths-lesson figcaption{font-size:.8rem;font-weight:700;color:#6d7194;margin-top:5px;text-align:center}
  .maths-lesson .close{position:sticky;top:0;float:right;background:#191c3a;color:#fdf7ea;border:2px solid #191c3a;
    border-radius:999px;width:34px;height:34px;font:900 1rem/1 ui-rounded,system-ui,sans-serif;cursor:pointer}
  @media (max-width:420px){.maths-lesson{padding:18px 15px}.maths-lesson h2{font-size:1.18rem}}
  `;

  let lessonCfg = null, wrap = null, current = null;

  function injectCSS() {
    if ($('mathsLessonCSS')) return;
    const s = document.createElement('style');
    s.id = 'mathsLessonCSS';
    s.textContent = CSS;
    document.head.append(s);
  }

  /* Build the dialog once. The topic buttons are the whole point: a learner
     who is stuck on remainders should not have to read six lessons to find
     the one about remainders. */
  function build() {
    if (wrap) return;
    injectCSS();
    wrap = document.createElement('div');
    wrap.className = 'maths-lesson-wrap';
    wrap.id = 'mathsLessonWrap';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Maths lessons');
    wrap.innerHTML = `<div class="maths-lesson" id="mathsLessonBody"></div>`;
    document.body.append(wrap);

    // Clicking the backdrop closes; clicking inside does not.
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && wrap.classList.contains('on')) close();
    });
  }

  function open(topicId) {
    if (!lessonCfg) return;
    build();
    render(topicId);
    wrap.classList.add('on');
    document.body.style.overflow = 'hidden';
    const first = wrap.querySelector('.close');
    if (first) first.focus();
  }

  function close() {
    if (!wrap) return;
    wrap.classList.remove('on');
    document.body.style.overflow = '';
    if (lessonCfg && lessonCfg.onClose) lessonCfg.onClose();
  }

  function render(topicId) {
    const topics = lessonCfg.topics;
    const id = topics.some(t => t.id === topicId) ? topicId : topics[0].id;
    current = id;
    const L = lessonCfg.lessons[id];
    const picker = topics.map(t =>
      `<button type="button" data-ltopic="${t.id}" aria-pressed="${t.id === id}">${esc(t.name)}</button>`).join('');
    const figs = Array.isArray(L.figs) && L.figs.length
      ? `<div class="figs">${L.figs.map(f =>
          `<figure>${f.svg}<figcaption>${esc(f.cap)}</figcaption></figure>`).join('')}</div>`
      : '';
    // Authored text is escaped; figures are SVG and go in as markup. A lesson
    // is written by hand, so a stray `<` should print rather than break the
    // page -- the figures are the only part that is meant to be markup.
    $('mathsLessonBody').innerHTML = `
      <button class="close" type="button" id="mathsLessonClose" aria-label="Close lessons">✕</button>
      <h2>${esc(L.title)}</h2>
      <div class="pick">${picker}</div>
      <p class="lwhy">${esc(L.why)}</p>
      <div class="lrule"><b>The rule</b><p>${esc(L.rule)}</p></div>
      ${figs}
      <ul class="lbeats">${L.beats.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      <div class="lex">
        <b>Worked example</b>
        <p class="lq">${esc(L.example.q)}</p>
        <ol>${L.example.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
        <p class="la">${esc(L.example.a)}</p>
      </div>
      <div class="lremember"><b>Remember</b><span>${esc(L.remember)}</span></div>
      <p class="ltrap"><b>The usual mistake:</b> ${esc(L.trap)}</p>`;
    $('mathsLessonClose').addEventListener('click', close);
    $('mathsLessonBody').querySelectorAll('[data-ltopic]').forEach(b =>
      b.addEventListener('click', () => render(b.dataset.ltopic)));
  }

  /* Mount the button. `cfg` is {lessons, topics, game}. A game that passes no
     lessons gets no button, so a page without written content does not show
     an empty dialog.
   *
   * The button is also the surface for a stuck offer: when a topic has three
   * misses behind it, the button says which lesson and opens on that topic
   * instead of on the picker. It is a change of label and a default, never a
   * modal -- a lesson that interrupts a drill is a lesson the child closes. */
  function init(cfg) {
    if (!cfg || !cfg.lessons || !cfg.topics || !cfg.topics.length) return null;
    lessonCfg = cfg;
    if ($('mathsLessonBtn')) return current;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'maths-lesson-btn';
    b.id = 'mathsLessonBtn';
    b.innerHTML = '<span class="ic" aria-hidden="true">📖</span><span>Learn</span>';
    b.setAttribute('aria-label', 'Open the maths lessons');
    b.addEventListener('click', () => open(offered || null));
    document.body.append(b);
    return null;
  }

  /* The topic the button is currently offering, or null. Set by `offer`. */
  let offered = null;
  const offeredTopics = new Set();

  /* Look at the record and decide whether to offer a lesson.
   *
   * Called by the page after a save. `taught` is the page's own set of topics
   * already read; a topic the child has read is not offered again, but the
   * drill is not gated on it either. Returns the topic it is now offering, or
   * null. */
  function offer(review, taught) {
    if (!lessonCfg) return null;
    const skip = new Set(offeredTopics);
    for (const id of (taught || [])) skip.add(id);
    const topic = stuckTopic(lessonCfg.game, review, lessonCfg.topics, skip);
    if (!topic) return offered;
    offeredTopics.add(topic);
    offered = topic;
    const name = (lessonCfg.topics.find(t => t.id === topic) || {}).name || topic;
    const b = $('mathsLessonBtn');
    if (b) {
      b.innerHTML = `<span class="ic" aria-hidden="true">📖</span><span>Learn: ${esc(name)}</span>`;
      b.setAttribute('aria-label', `Open the lesson on ${name}`);
    }
    return topic;
  }

  /* ---------- the family index ----------
   *
   * A miss in addition must reach subtraction's queue. `familyKey` says which
   * facts are the same fact; this reads the other stores and hands back the
   * ones that are due here.
   *
   * Three constraints shape it:
   *
   *   - It reads the other drills' records with `{ version: 0, stash: false }`.
   *     A drill that cannot know another drill's schema version must not
   *     enforce one, and an observer must not churn the corrupt stash it is
   *     only looking at. That is the same reasoning the hub uses.
   *   - It never writes the other store. The miss stays where it happened;
   *     this is a reader, and a cross-drill write would make two pages the
   *     owners of one record.
   *   - A sibling is filtered by `fits`, the drill's own level membership.
   *     `15 − 8` is a level-2 fact here and a level-1 fact nowhere; serving a
   *     cross-drill fact from a level the child is not in is the bug D-2
   *     already found once, in the same queue.
   *
   * `limit` caps what is merged into the head of a deck. Two is what the
   * drills already reserve for review, and it is deliberately small: a deck is
   * fifty questions and a child who missed one fact in another drill should
   * meet it, not be handed a remedial set.
   */
  const CROSS_LIMIT = 2;

  function crossDue(cfg) {
    if (!cfg || !cfg.stores || !cfg.stores.length || !cfg.op) return [];
    const limit = typeof cfg.limit === 'number' ? cfg.limit : CROSS_LIMIT;
    const out = [];
    const seenFamilies = new Set();

    for (const store of cfg.stores) {
      if (!store || !store.key || !store.game || !store.op) continue;
      const res = window.ArcadeRecord.load(store.key, { version: 0, stash: false });
      const rec = (res && res.data) || {};
      const review = rec.review || {};
      for (const [k, r] of Object.entries(review)) {
        if (!window.ArcadeDeck.isDue(r, cfg.now)) continue;
        // The other drill's key parsed into the two numbers its own classifier
        // uses. `crossKeys` is per game because each key has a different
        // shape; an unparseable key is skipped rather than guessed at.
        const pair = crossKeys(store.game, k);
        if (!pair) continue;
        const fam = window.ArcadeDeck.familyKey(store.op, pair.x, pair.y);
        if (!fam || seenFamilies.has(fam)) continue;
        // What this drill already has its own entry for is not a discovery.
        // The drill supplies this, because only it knows its own key shape --
        // a review key is `level|a|b` or `a|b`, never a family key, so
        // comparing the two here would be a check that never fires.
        if (cfg.ownFamily && cfg.ownFamily(fam)) continue;
        const sibs = window.ArcadeDeck.familySiblings(store.op, pair.x, pair.y)
          .filter(s => s.op === cfg.op);
        let took = false;
        for (const s of sibs) {
          if (cfg.fits && !cfg.fits(s.x, s.y)) continue;
          out.push({ x: s.x, y: s.y, q: s.q, a: s.a, miss: r.miss || 0,
                     from: store.game, family: fam });
          took = true;
          break;
        }
        if (took) seenFamilies.add(fam);
      }
    }

    out.sort((p, q) => q.miss - p.miss);
    return out.slice(0, limit);
  }

  /* The two numbers a drill's own review key carries, in the order that
     drill's `familyKey` call expects. Each entry mirrors the `parseFact`
     branch for the same game; a key that does not split into the right
     arity is null, not a guess. */
  function crossKeys(game, key) {
    const parts = String(key).split('|');
    if (game === 'addition-quest') {
      if (parts.length < 3) return null;
      return { x: +parts[1], y: +parts[2] };
    }
    if (game === 'subtraction-safari') {
      if (parts.length < 3) return null;
      return { x: +parts[1], y: +parts[2] };
    }
    if (game === 'times-table-academy') {
      if (parts.length < 2) return null;
      return { x: +parts[0], y: +parts[1] };
    }
    if (game === 'division-diner') {
      if (parts.length < 2) return null;
      return { x: +parts[1], y: +parts[0] };   // dividend, divisor
    }
    return null;
  }

  window.MathsGame = {
    $, rnd, shuffle, esc,
    freshFirst, markSeen, newCycle, SEEN_CAP, capReview, REVIEW_CAP, noteReview, REVIEW_PASSES,
    STUCK_MISSES, stuckTopic, offer, crossDue, CROSS_LIMIT,
    tone, goodSound, badSound, clickSound, burst, audio,
    init, open: () => open(null), close, lessonTopic: () => current
  };
})();
