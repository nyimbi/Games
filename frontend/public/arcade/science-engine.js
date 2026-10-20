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
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const SEEN_CAP = 1200;
  function freshFirst(pool, bucket, keyOf) {
    const fresh = [], stale = [];
    pool.forEach(f => ((bucket[keyOf(f)] || 0) === 0 ? fresh : stale).push(f));
    shuffle(stale).sort((x, y) => (bucket[keyOf(x)] || 0) - (bucket[keyOf(y)] || 0));
    shuffle(fresh);
    return fresh.concat(stale);
  }

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
     compare equal while "9.8" and "98" do not. */
  function num(s) {
    const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }
  const unitOf = s => {
    const m = String(s).match(/-?\d+(?:\.\d+)?\s*([A-Za-z°%/·^0-9]+.*)$/);
    return m ? m[1].trim() : '';
  };

  function init(cfg) {
    const BANK = Array.isArray(cfg.bank) ? cfg.bank : [];
    const TOTAL = cfg.total || 20;
    const KEY = cfg.key;
    const keyOf = q => q.q;

    const state = {
      tier: 1, mode: 'quiz', queue: [], index: 0, right: 0, score: 0,
      streak: 0, best: 0, misses: [], answered: false, seen: {}, review: {}, perTier: {}
    };

    function load() {
      try {
        const s = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (s) { state.best = s.best || 0; state.seen = s.seen || {}; state.review = s.review || {}; state.perTier = s.perTier || {}; if (s.tier) state.tier = s.tier; }
      } catch (_) { }
    }
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ best: state.best, seen: state.seen, review: state.review, perTier: state.perTier, tier: state.tier }));
      } catch (_) { }
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

      if (state.mode === 'quiz') {
        $('qChoices').hidden = false;
        $('qType').hidden = true;
        const opts = shuffle([q.a, q.d1, q.d2, q.d3].filter((v, i, a) => v && a.indexOf(v) === i));
        $('qChoices').innerHTML = opts.map(v =>
          `<button class="opt" type="button" data-opt="${esc(v)}">${esc(v)}</button>`).join('');
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
      if (bucket) bucket[keyOf(q)] = Date.now();
      save();
    }

    const tierKey = () => 't' + state.tier;

    function answer(given, q) {
      if (state.answered) return;
      state.answered = true;
      let ok;
      if (state.mode === 'quiz') {
        ok = given === q.a;
      } else {
        const g = num(given), want = num(q.a);
        if (g === null || want === null) ok = given.trim().toLowerCase() === String(q.a).toLowerCase();
        else {
          const tol = Math.max(Math.abs(want) * 0.02, 0.05);
          ok = Math.abs(g - want) <= tol;
          // A right number with the wrong unit is not the right answer. The
          // prompt names the unit it wants; if the learner types one of their
          // own, it has to be that one.
          if (ok && q.unit) {
            const said = unitOf(given);
            if (said && said.toLowerCase() !== String(q.unit).toLowerCase()) ok = false;
          }
        }
      }
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
      const unitNote = !ok && q.unit && num(given) !== null && Math.abs((num(given) || 0) - (num(q.a) || 0)) <= Math.max(Math.abs(num(q.a) || 0) * 0.02, 0.05)
        ? `<p class="trickline">The number is right; the unit is not. This one is in ${esc(q.unit)}.</p>`
        : '';
      fb.innerHTML = `<h3>${ok ? 'Correct' : 'Not quite'}</h3>
        ${ok ? '' : `<p class="answerline">The answer is <b>${esc(q.a)}${q.unit ? ' ' + esc(q.unit) : ''}</b>.</p>`}
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
      state.mode = mode;
      const pool = poolFor(state.tier);
      state.queue = buildQueue(pool, tierKey() + ':' + mode, TOTAL);
      state.index = 0; state.right = 0; state.score = 0; state.streak = 0; state.misses = [];
      show('quiz'); render();
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
        return `<button class="topicchip" type="button" data-topic="${t.id}">
          <b>${esc(t.name)}</b><span>${n}</span></button>`;
      }).join('');
      $('topics').querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => {
        const pool = topicOf(b.dataset.topic);
        if (!pool.length) return;
        state.queue = shuffle(pool.slice()).slice(0, Math.min(TOTAL, pool.length));
        state.index = 0; state.right = 0; state.score = 0; state.streak = 0; state.misses = [];
        state.mode = 'quiz';
        show('quiz'); render();
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
      $('hudBest').textContent = 'Best ' + best + '%';
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

    load(); paintHome(); show('home');
  }

  window.ScienceGame = { init, esc, shuffle, num };
})();
