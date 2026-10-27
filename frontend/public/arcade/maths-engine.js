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

  function noteReview(review, key, right) {
    return window.ArcadeDeck.noteAttempt(review, key, right);
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
     an empty dialog. */
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
    b.addEventListener('click', () => open(null));
    document.body.append(b);
    return null;
  }

  window.MathsGame = {
    $, rnd, shuffle, esc,
    freshFirst, markSeen, newCycle, SEEN_CAP, capReview, REVIEW_CAP, noteReview, REVIEW_PASSES,
    tone, goodSound, badSound, clickSound, burst, audio,
    init, open: () => open(null), close, lessonTopic: () => current
  };
})();
