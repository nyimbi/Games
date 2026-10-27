/* Shared engine for the science arcade games.
 *
 * Physics and chemistry differ in content, not in shape: a question, four
 * options that encode the common mistakes, an explanation, and a formula or
 * a rule. Two things matter here and are worth stating.
 *
 * The distractors are the *point*. Each one is the answer a learner gets by
 * making one specific error, so choosing it is diagnostic: the feedback can
 * name the error rather than just marking it wrong.
 *
 * The numeric mode asks for a typed answer and compares it with a tolerance,
 * accepting a bare number when the unit is asked for separately, because a
 * right number with the wrong unit is a different fact from a wrong number.
 */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  // Shared escapes: esc for text nodes, escAttr for quoted attribute
  // values. See escape.js for why the split is not a union.
  const esc = window.ArcadeEscape.esc, escAttr = window.ArcadeEscape.escAttr;

  // One deck, in deck.js; see the note there on why `keyOf` has no default.
  const SEEN_CAP = window.ArcadeDeck.SEEN_CAP;
  const freshFirst = (pool, bucket, keyOf) => window.ArcadeDeck.freshFirst(pool, bucket, keyOf);
  const markSeen = (bucket, key) => window.ArcadeDeck.markSeen(bucket, key);
  const newCycle = (pool, bucket, keyOf) => window.ArcadeDeck.newCycle(pool, bucket, keyOf);

  let ctx = null;
  function tone(freq, dur = .12, type = 'sine', gain = .05) {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + .012);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur + .02);
    } catch (_) { }
  }
  const goodSound = s => { const b = 523.25 * Math.pow(2, Math.min(s, 7) / 12); tone(b, .1, 'sine', .045); setTimeout(() => tone(b * 1.25, .12, 'sine', .04), 70); };
  const badSound = () => { tone(196, .16, 'triangle', .045); setTimeout(() => tone(155, .2, 'triangle', .04), 110); };

  function burst(n) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = $('confetti'); if (!c) return;
    const cx = c.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = ['#0aa392', '#f5a300', '#f0554f', '#4a5cf0', '#8b46d9', '#6aa312'];
    const bits = [];
    for (let i = 0; i < n; i++) bits.push({
      x: innerWidth / 2 + (Math.random() - .5) * 160, y: innerHeight * .34,
      vx: (Math.random() - .5) * 9, vy: -Math.random() * 10 - 2,
      r: 3 + Math.random() * 5, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .3,
      c: cols[i % cols.length], life: 1
    });
    let raf = null;
    const tick = () => {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      let live = false;
      bits.forEach(b => {
        if (b.life <= 0) return;
        live = true; b.vy += .32; b.x += b.vx; b.y += b.vy; b.rot += b.vr; b.life -= .011;
        cx.save(); cx.translate(b.x, b.y); cx.rotate(b.rot);
        cx.globalAlpha = Math.max(b.life, 0); cx.fillStyle = b.c;
        cx.fillRect(-b.r, -b.r / 2, b.r * 2, b.r); cx.restore();
      });
      if (live) raf = requestAnimationFrame(tick); else { cx.clearRect(0, 0, innerWidth, innerHeight); raf = null; }
    };
    if (!raf) tick();
  }

  /* Pull the leading number out of an answer string, so "9.8 N" and "9.8"
     compare equal while "9.8" and "98" do not. Scientific notation is read
     whole: the mantissa of 6.02 x 10^23 is not the answer to anything. */
  function num(s) {
    const t = String(s);
    const sci = t.match(/(-?\d+(?:\.\d+)?)\s*(?:[x×]\s*10\s*\^\s*(-?\d+)|e\s*(-?\d+))/i);
    if (sci) return parseFloat(sci[1]) * Math.pow(10, parseInt(sci[2] ?? sci[3], 10));
    const m = t.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }
  /* The unit a typed answer carries, or '' if it carries none. The unit has
     to start with a letter or a symbol: "49.5" is a number, and its trailing
     "5" is not a unit. Digits are allowed after the first character, so
     "m/s2" reads as a unit. An exponent is part of the number, not a unit:
     "6.02e23" has no unit at all. */
  const unitOf = s => {
    const t = String(s).replace(/(-?\d+(?:\.\d+)?)\s*[x×]\s*10\s*\^\s*-?\d+/gi, '$1').replace(/(\d)e-?\d+/gi, '$1');
    const m = t.match(/^-?\d+(?:\.\d+)?\s*([A-Za-z°%µΩ][A-Za-z0-9°%/·^²³\-]*.*)$/);
    return m ? m[1].trim() : '';
  };

  /* Not every answer that starts with a digit is a quantity. "2,8,7" is an
     electron configuration, "2, 1, 2" is a set of coefficients and "2+" is a
     charge; read through num() the first two collapse to 287 and 212, so a
     learner who typed the bare number would be marked right for a fact they
     were never asked. A quantity is a number followed by a unit and nothing
     else: no comma, no operator, no arrow. */
  const QUANTITY = /^-?\d+(?:\.\d+)?[^,+\->=]*$/;
  const isQuantity = s => QUANTITY.test(String(s).trim());

  /* A quantity carries its unit in one place on screen, not two. Where the
     bank's answer already ends in the unit the prompt asks for, the unit is
     not repeated. */
  const answerText = q => {
    const a = String(q.a), u = String(q.unit || '').split(',')[0].trim();
    return u && !a.toLowerCase().endsWith(u.toLowerCase()) ? `${a} ${u}` : a;
  };

  /* Grading a typed answer is a pure predicate, kept out of the render path
     so it can be exercised on its own. Returns { ok, unitOnly } -- unitOnly
     marks the case where the number was right and only the unit was not,
     which the feedback reports separately from a wrong number. */
  function gradeTyped(given, q) {
    const g = num(given), want = num(q.a);
    if (g === null || want === null || !isQuantity(q.a)) {
      return { ok: given.trim().toLowerCase() === String(q.a).trim().toLowerCase(), unitOnly: false };
    }
    const tol = Math.max(Math.abs(want) * 0.02, 0.05);
    if (Math.abs(g - want) > tol) return { ok: false, unitOnly: false };

    // A right number with the wrong unit is not the right answer. The unit
    // is checked wherever it appears: in the answer's own text ("32 g") or
    // in the unit field ("24" with unit "W"). A qualifier after the comma is
    // guidance, not part of the unit -- "N, to the right" asks for newtons.
    // Superscripts compare as digits, because a phone keyboard has no ².
    const asked = String(q.unit || '').split(',')[0].trim();
    const inAnswer = unitOf(q.a);
    const expected = asked || inAnswer;
    if (expected) {
      const said = unitOf(given) || inAnswer;
      const norm = u => u.toLowerCase().replace(/²/g, '2').replace(/³/g, '3');
      if (said && norm(said) !== norm(expected)) return { ok: false, unitOnly: true };
    }
    return { ok: true, unitOnly: false };
  }

  function init(cfg) {
    const BANK = Array.isArray(cfg.bank) ? cfg.bank : [];
    const LESSONS = cfg.lessons && typeof cfg.lessons === 'object' ? cfg.lessons : null;
    const TOTAL = cfg.total || 20;
    const KEY = cfg.key;
    const keyOf = q => q.q;

    const state = {
      tier: 1, mode: 'quiz', queue: [], index: 0, right: 0, score: 0,
      streak: 0, best: 0, misses: [], answered: false, seen: {}, review: {}, perTier: {},
      taught: {}, lessonTopic: null, lessonResume: null
    };

    const R = window.ArcadeRecord;
    const SHAPE = { best: R.is.num, seen: R.is.obj, review: R.is.obj, perTier: R.is.obj, taught: R.is.obj };
    const RECORD_V = 1;
    let loadStatus = 'fresh';

    function load() {
      const res = R.load(KEY, { version: RECORD_V, shape: SHAPE });
      loadStatus = res.status;
      const s = res.data;
      if (s) { state.best = s.best || 0; state.seen = s.seen || {}; state.review = s.review || {}; state.perTier = s.perTier || {}; state.taught = s.taught || {}; if (s.tier) state.tier = s.tier; }
    }
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ v: RECORD_V, best: state.best, seen: state.seen, review: state.review, perTier: state.perTier, tier: state.tier, taught: state.taught }));
      } catch (e) { ArcadeErrors.note('storage', e && e.message, KEY); }
    };

    const poolFor = t => BANK.filter(q => q.tier === t);
    const topicOf = t => BANK.filter(q => q.topic === t);

    function noteFact(q, ok) {
      const r = state.review[keyOf(q)] || { n: 0, miss: 0, due: false };
      r.n++; if (!ok) { r.miss++; r.due = true; } else if (r.due) r.due = false;
      state.review[keyOf(q)] = r;
    }

    function buildQueue(pool, name, total) {
      const bucket = state.seen[name] || (state.seen[name] = {});
      const due = Object.entries(state.review).filter(([, r]) => r.due)
        .map(([k]) => pool.find(q => keyOf(q) === k)).filter(Boolean).slice(0, 2);
      const order = freshFirst(pool.filter(q => !due.includes(q)), bucket, keyOf);
      return due.concat(order).slice(0, Math.min(total, due.length + order.length));
    }

    function show(id) {
      document.querySelectorAll('.stage').forEach(s => s.classList.toggle('on', s.id === id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function render() {
      if (state.index >= state.queue.length) return finish();
      const q = state.queue[state.index];
      // First question from a topic: teach it before asking it. This is the
      // whole design -- the lesson arrives attached to the question it
      // explains, not as a preamble the learner scrolls past.
      if (q.topic && lessonFor(q.topic) && !state.taught[q.topic]) {
        paintLesson(q.topic, 'render');
        return;
      }
      state.answered = false;
      $('qNum').textContent = state.index + 1;
      $('qTot').textContent = state.queue.length;
      $('qScore').textContent = state.right + ' right';
      $('qProg').style.width = (state.index / state.queue.length * 100) + '%';
      $('qTopic').textContent = q.topic;
      $('qText').textContent = q.q;
      $('qFb').className = 'feedback';
      $('qFb').innerHTML = '';
      $('qNext').hidden = true;
      $('qExplain').hidden = true;
      $('qExplain').innerHTML = '';
      // A clue opened on the previous question is about that question.
      $('qHintBox').hidden = true;
      $('qHintBox').textContent = '';

      if (state.mode === 'quiz') {
        $('qChoices').hidden = false;
        $('qType').hidden = true;
        const opts = shuffle([q.a, q.d1, q.d2, q.d3].filter((v, i, a) => v && a.indexOf(v) === i));
        $('qChoices').innerHTML = opts.map(v =>
          `<button class="opt" type="button" data-opt="${escAttr(v)}">${esc(v)}</button>`).join('');
        $('qChoices').querySelectorAll('[data-opt]').forEach(b =>
          b.addEventListener('click', () => answer(b.dataset.opt, q)));
      } else {
        $('qChoices').hidden = true;
        $('qType').hidden = false;
        $('qInput').value = '';
        $('qUnit').textContent = q.unit ? `unit: ${q.unit}` : '';
        $('qInput').focus();
      }

      const bucket = state.seen[tierKey() + ':' + state.mode];
      if (bucket) markSeen(bucket, keyOf(q));
      save();
    }

    const tierKey = () => 't' + state.tier;

    /* ---------- lessons ----------
     *
     * A topic is taught once, then quizzed. `taught` is per topic and is kept
     * across decks, so the second time a topic comes round the learner goes
     * straight to the questions. The lesson is never skipped silently: if a
     * topic has no lesson written, the learner is quizzed as before rather
     * than blocked by a missing page.
     */
    const lessonFor = topic => (LESSONS && LESSONS[topic]) || null;

    function paintLesson(topic, resume) {
      const L = lessonFor(topic);
      if (!L) return false;
      state.lessonTopic = topic;
      state.lessonResume = resume || 'home';
      $('lTopic').textContent = L.title;
      // Every piece is escaped: the lessons are authored text, but they are
      // text, and a stray angle bracket would break the page rather than
      // print. The figures are the exception -- they are SVG, so they go in
      // as markup, and only the caption is escaped.
      const figs = Array.isArray(L.figs) && L.figs.length
        ? `<div class="figs">${L.figs.map(f =>
            `<figure class="fig">${f.svg}<figcaption>${esc(f.cap)}</figcaption></figure>`).join('')}</div>`
        : '';
      $('lBody').innerHTML = `
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
      show('lesson');
      window.scrollTo({ top: 0, behavior: 'auto' });
      return true;
    }

    /* Called when a deck starts. The teaching is not done here: a deck of
       twenty questions crosses many topics, and a wall of ten lessons before
       the first question is not teaching, it is a barrier. render() shows the
       lesson for a topic the first time a question from it comes up, so the
       learner meets each idea immediately before being asked about it. */
    function begin(mode, queue) {
      state.mode = mode;
      state.queue = queue;
      state.index = 0; state.right = 0; state.score = 0; state.streak = 0; state.misses = [];
      state.answered = false;
      show('quiz'); render();
    }

    function afterLesson() {
      const t = state.lessonTopic;
      if (t) { state.taught[t] = true; save(); }
      const resume = state.lessonResume;
      state.lessonResume = null;
      if (resume === 'keep') {
        // Returning to a question that is already on screen: re-rendering
        // would wipe an answer the learner had already given.
        show('quiz');
        return;
      }
      if (resume === 'render') { show('quiz'); render(); return; }
      paintHome(); show('home');
    }

    /* The lesson for the topic of the question on screen, from the quiz.
       This is the "teach me" button: a learner who does not recognise the
       idea can read it without losing their place. */
    function lessonFromQuiz() {
      const q = state.queue[state.index];
      if (!q || !lessonFor(q.topic)) return;
      paintLesson(q.topic, 'keep');
    }

    function answer(given, q) {
      if (state.answered) return;
      state.answered = true;
      const ok = state.mode === 'quiz' ? given === q.a : gradeTyped(given, q).ok;
      settle(ok, given, q);
    }

    function settle(ok, given, q) {
      const fb = $('qFb');
      state.right += ok ? 1 : 0;
      if (ok) {
        state.score += 10 + Math.min(state.streak, 5) * 2 + (q.tier === 3 ? 4 : 0);
        state.streak++; state.best = Math.max(state.best, state.streak);
        goodSound(state.streak); burst(20 + Math.min(state.streak, 6) * 4);
      } else {
        state.streak = 0; badSound();
        state.misses.push({ prompt: q.q, right: q.a });
      }
      noteFact(q, ok);
      $('qScore').textContent = state.right + ' right';

      // If the learner picked a distractor, name the error it encodes.
      let why = '';
      if (!ok && state.mode === 'quiz') {
        const hit = [['d1', q.d1], ['d2', q.d2], ['d3', q.d3]].find(([, v]) => v === given);
        if (hit) why = q.trap || '';
      }
      fb.className = 'feedback on ' + (ok ? 'good' : 'bad');
      // A qualifier after the comma in the unit is guidance, not part of the
      const unitNote = !ok && state.mode === 'work' && gradeTyped(given, q).unitOnly
        ? `<p class="trickline">The number is right; the unit is not. This one is in ${esc(String(q.unit).split(',')[0].trim())}.</p>`
        : '';
      fb.innerHTML = `<h3>${ok ? 'Correct' : 'Not quite'}</h3>
        ${ok ? '' : `<p class="answerline">The answer is <b>${esc(answerText(q))}</b>.</p>`}
        ${unitNote}
        ${why ? `<p class="trickline">${esc(why)}</p>` : ''}
        <p>${esc(q.explain)}</p>`;
      $('qExplain').hidden = false;
      $('qExplain').innerHTML = `<b>Why:</b> ${esc(q.explain)}` +
        (q.formula ? ` <span class="fchip">${esc(q.formula)}</span>` : '');
      $('qNext').hidden = false; $('qNext').focus();

      if (state.mode === 'quiz') {
        $('qChoices').querySelectorAll('[data-opt]').forEach(b => {
          b.disabled = true;
          if (b.dataset.opt === q.a) b.classList.add('right');
          else if (b.dataset.opt === given) b.classList.add('wrong');
        });
      }
      if (ok) setTimeout(() => { state.index++; render(); }, 1100);
      save();
    }

    function submitTyped() {
      if (state.answered) return;
      const q = state.queue[state.index];
      const v = $('qInput').value.trim();
      if (!v) return;
      answer(v, q);
    }

    function finish() {
      show('done');
      const pct = Math.round(state.right / Math.max(state.queue.length, 1) * 100);
      state.perTier[state.tier] = Math.max(state.perTier[state.tier] || 0, pct);
      save();
      $('doneText').textContent = `${state.right} of ${state.queue.length} correct · ${state.score} points · best streak ${state.best}`;
      const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
      [...$('stars').children].forEach((s, i) => s.classList.toggle('on', i < stars));
      $('doneTitle').textContent = stars === 3 ? 'Deck complete!' : stars === 2 ? 'Strong run!' : 'Good start!';
      if (state.misses.length) {
        $('missed').hidden = false;
        $('missed').innerHTML = '<h4>Worth another look</h4>' + state.misses.slice(0, 10)
          .map(m => `<div class="missrow"><span>${esc(m.prompt)}</span><b>${esc(m.right)}</b></div>`).join('');
      } else $('missed').hidden = true;
      if (stars >= 2) burst(70);
    }

    function start(mode) {
      const pool = poolFor(state.tier);
      begin(mode, buildQueue(pool, tierKey() + ':' + mode, TOTAL));
    }

    function paintHome() {
      $('tiers').innerHTML = [1, 2, 3].map(t => {
        const n = poolFor(t).length;
        const name = ['Recall', 'Apply', 'Stretch'][t - 1];
        const note = ['facts and names', 'one rule at a time', 'multi-step'];
        return `<button class="tierbtn" type="button" data-tier="${t}" aria-pressed="${state.tier === t}">
          <b>${name}</b><span>${note} · ${n} questions</span></button>`;
      }).join('');
      $('tiers').querySelectorAll('[data-tier]').forEach(b => b.addEventListener('click', () => {
        state.tier = +b.dataset.tier; save(); paintHome();
      }));

      $('topics').innerHTML = cfg.topics.map(t => {
        const n = topicOf(t.id).length;
        const taught = !!state.taught[t.id];
        const has = !!lessonFor(t.id);
        // The tick is the whole point of the chip: a child can see which
        // topics they have met and which are still new.
        const mark = has ? (taught ? '<em class="tick" title="Lesson read">✓</em>' : '<em class="new" title="Lesson not read yet">new</em>') : '';
        return `<button class="topicchip" type="button" data-topic="${t.id}"${has ? ` data-lesson="1"` : ''}>
          <b>${esc(t.name)}</b><span>${n}</span>${mark}</button>`;
      }).join('');
      $('topics').querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.topic;
        const pool = topicOf(id);
        if (!pool.length) return;
        const queue = shuffle(pool.slice()).slice(0, Math.min(TOTAL, pool.length));
        // Every question from a topic chip is that topic, so render() shows
        // its lesson on the way in if it has not been taught yet.
        begin('quiz', queue);
      }));

      $('modes').innerHTML = cfg.modes.map(m =>
        `<button class="modebtn" type="button" data-mode="${m.id}">
          <span class="ic" aria-hidden="true">${m.icon}</span>
          <span><b>${esc(m.name)}</b><small>${esc(m.desc)}</small></span></button>`).join('');
      $('modes').querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => start(b.dataset.mode)));

      const known = Object.values(state.review).filter(r => r.n > 0).length;
      const clean = Object.values(state.review).filter(r => r.n >= 1 && r.miss === 0).length;
      const best = Math.max(...Object.values(state.perTier), 0) || 0;
      $('stats').innerHTML = `
        <div class="stat"><b>${BANK.length}</b><span>questions</span></div>
        <div class="stat"><b>${known}</b><span>attempted</span></div>
        <div class="stat"><b>${clean}</b><span>got clean</span></div>
        <div class="stat"><b>${best}%</b><span>best deck</span></div>`;
      // The chip already carries its own "Best" label in the markup; this is
      // the value only, or the HUD reads "Best Best 0%".
      $('hudBest').textContent = best + '%';
    }

    $('qNext').addEventListener('click', () => { state.index++; render(); });
    $('qSubmit').addEventListener('click', submitTyped);
    $('qInput').addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); submitTyped(); } });
    $('qExit').addEventListener('click', () => { paintHome(); show('home'); });
    $('qHint').addEventListener('click', () => {
      const box = $('qHintBox');
      const q = state.queue[state.index];
      if (!q) return;
      if (!box.hidden) { box.hidden = true; return; }
      box.hidden = false;
      box.textContent = q.formula ? `Formula: ${q.formula}` : (q.trap || 'Read the question again.');
    });
    $('rAgain').addEventListener('click', () => start(state.mode));
    $('rHome').addEventListener('click', () => { paintHome(); show('home'); });
    $('lDone').addEventListener('click', afterLesson);
    // Back leaves the lesson without marking the topic taught: reading is what
    // teaches it, and a learner who backs out has not read it.
    $('lHome').addEventListener('click', () => {
      const resume = state.lessonResume;
      state.lessonResume = null;
      // Opened from the quiz with "Teach me this": the question is still
      // painted, so go back to it. Opened automatically before a question,
      // there is nothing to return to but the home screen.
      if (resume === 'keep') { show('quiz'); return; }
      paintHome(); show('home');
    });
    $('qLesson').addEventListener('click', lessonFromQuiz);
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && $('lesson') && $('lesson').classList.contains('on')) {
        ev.preventDefault(); afterLesson();
      }
    });

    load();
    R.notice(loadStatus);
    paintHome(); show('home');
  }

  window.ScienceGame = { init, esc, shuffle, num, isQuantity, answerText, gradeTyped };
})();
