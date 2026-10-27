/* Shared engine for the vocabulary arcade games.
 *
 * The three language games (French, Kiswahili, Mandarin) differ in what a
 * learner has to produce — an article and an accent, a noun-class prefix, a
 * tone — but the deck, the freshness record, the scoring and the results
 * screen are the same object. That machinery lives here once.
 *
 * A game supplies: a bank, a way to name each side of an entry, a list of
 * prompt types, and a normaliser for typed answers. Everything else is
 * handled below.
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

  /* Diacritics are a keyboard problem, not a knowledge problem. Compare the
     folded forms so an answer typed without accents is accepted, and report
     the accent separately rather than marking the whole word wrong. */
  const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

  // One deck, in deck.js. `keyOf` is required there and passed through here
  // unchanged: this engine has always taken it, and the callers that omitted
  // it were the maths drills, not these.
  const SEEN_CAP = window.ArcadeDeck.SEEN_CAP;
  const freshFirst = (pool, bucket, keyOf) => window.ArcadeDeck.freshFirst(pool, bucket, keyOf);
  const markSeen = (bucket, key) => window.ArcadeDeck.markSeen(bucket, key);
  const newCycle = (pool, bucket, keyOf) => window.ArcadeDeck.newCycle(pool, bucket, keyOf);


  /* ---------------- audio ---------------- */
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
  const goodSound = s => {
    const b = 523.25 * Math.pow(2, Math.min(s, 7) / 12);
    tone(b, .1, 'sine', .045);
    setTimeout(() => tone(b * 1.25, .12, 'sine', .04), 70);
  };
  const badSound = () => {
    tone(196, .16, 'triangle', .045);
    setTimeout(() => tone(155, .2, 'triangle', .04), 110);
  };

  /* ---------------- speech ---------------- */
  let voice = null;
  function pickVoice(tag) {
    const vs = speechSynthesis.getVoices() || [];
    const base = tag.split('-')[0].toLowerCase();
    voice = vs.find(v => v.lang.toLowerCase() === tag.toLowerCase())
      || vs.find(v => v.lang.toLowerCase().startsWith(base))
      || null;
  }
  function speak(text, rate) {
    if (!('speechSynthesis' in window) || !text) return false;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : '';
    if (voice) u.voice = voice;
    u.rate = rate || .82;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    return true;
  }

  /* ---------------- confetti ---------------- */
  function burst(n) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = $('confetti');
    if (!c) return;
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
      r: 3 + Math.random() * 5, rot: Math.random() * 6.28,
      vr: (Math.random() - .5) * .3, c: cols[i % cols.length], life: 1
    });
    let raf = null;
    const tick = () => {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      let live = false;
      bits.forEach(b => {
        if (b.life <= 0) return;
        live = true;
        b.vy += .32; b.x += b.vx; b.y += b.vy; b.rot += b.vr; b.life -= .011;
        cx.save(); cx.translate(b.x, b.y); cx.rotate(b.rot);
        cx.globalAlpha = Math.max(b.life, 0); cx.fillStyle = b.c;
        cx.fillRect(-b.r, -b.r / 2, b.r * 2, b.r); cx.restore();
      });
      if (live) raf = requestAnimationFrame(tick);
      else { cx.clearRect(0, 0, innerWidth, innerHeight); raf = null; }
    };
    if (!raf) tick();
  }

  /* ================= game ================= */
  function init(cfg) {
    const BANK = Array.isArray(cfg.bank) ? cfg.bank : [];
    const TOTAL = cfg.total || 30;
    const KEY = cfg.key;
    const BY_KEY = new Map(BANK.map(e => [cfg.keyOf(e), e]));

    const state = {
      tier: 1, mode: 'learn', queue: [], index: 0, input: '',
      score: 0, streak: 0, best: 0, right: 0, answered: false,
      hintUsed: false, review: {}, seen: {}, perTier: {}
    };

    const R = window.ArcadeRecord;
    const SHAPE = { best: R.is.num, perTier: R.is.obj, review: R.is.obj, seen: R.is.obj };
    const RECORD_V = 1;
    let loadStatus = 'fresh';

    function load() {
      const res = R.load(KEY, { version: RECORD_V, shape: SHAPE });
      loadStatus = res.status;
      const s = res.data;
      if (s) {
        state.best = s.best || 0;
        state.perTier = s.perTier || {};
        state.review = s.review || {};
        state.seen = s.seen || {};
        if (s.tier) state.tier = s.tier;
      }
    }
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          v: RECORD_V, best: state.best, perTier: state.perTier,
          review: state.review, seen: state.seen, tier: state.tier
        }));
      } catch (e) { ArcadeErrors.note('storage', e && e.message, KEY); }
    };

    const tierKey = t => 't' + t;
    const bucket = k => state.seen[k] || (state.seen[k] = {});

    function poolFor(tier) {
      return BANK.filter(e => e.tier === tier);
    }

    /* A mode that only makes sense for one part of speech draws from that
       part of speech, so every question in it can be answered. Falling back
       to the whole tier would pad the deck with questions the mode cannot
       ask. */
    function modePool(mode, tier) {
      const all = poolFor(tier);
      const kept = cfg.pool ? all.filter(e => cfg.pool(mode, e)) : all;
      return kept.length ? kept : all;
    }

    function noteFact(e, ok) {
      const ms = state.shownAt ? performance.now() - state.shownAt : null;
      window.ArcadeDeck.noteAttempt(state.review, cfg.keyOf(e), ok, null, ms);
    }

    /* Same queue discipline as the maths drills: due reviews first, then
       unseen, then least recently seen; a pool smaller than a deck starts a
       new cycle rather than spinning on a duplicate check. */
    function buildQueue(pool, name, total) {
      const out = [];
      Object.entries(state.review)
        .filter(([, r]) => window.ArcadeDeck.isDue(r))
        .map(([k]) => BY_KEY.get(k))
        .filter(e => e && pool.includes(e))
        .slice(0, 3)
        .forEach(e => out.push(e));

      let order = freshFirst(pool, bucket(name), cfg.keyOf);
      let i = 0, pass = 0, guard = 0;
      while (out.length < total && guard++ < total * 400) {
        if (i >= order.length) {
          order = pool.slice().sort((x, y) =>
            (bucket(name)[cfg.keyOf(x)] || 0) - (bucket(name)[cfg.keyOf(y)] || 0));
          i = 0; pass++;
        }
        const e = order[i++];
        if (pass === 0 && out.some(o => cfg.keyOf(o) === cfg.keyOf(e))) continue;
        if (out.length && cfg.keyOf(out[out.length - 1]) === cfg.keyOf(e)) continue;
        out.push(e);
      }
      return out;
    }

    /* ---------------- screens ---------------- */
    function show(id) {
      document.querySelectorAll('.stage').forEach(s => s.classList.toggle('on', s.id === id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function paintHome() {
      $('tiers').innerHTML = cfg.tiers.map(t => {
        const n = poolFor(t.n).length;
        return `<button class="tierbtn" type="button" data-tier="${t.n}" aria-pressed="${state.tier === t.n}">
          <b>${esc(t.name)}</b><span>${esc(t.note)} · ${n} entries</span></button>`;
      }).join('');
      $('tiers').querySelectorAll('[data-tier]').forEach(b => b.addEventListener('click', () => {
        state.tier = +b.dataset.tier; save(); paintHome();
      }));

      $('modes').innerHTML = cfg.modes.map(m =>
        `<button class="modebtn" type="button" data-mode="${m.id}">
          <span class="ic" aria-hidden="true">${m.icon}</span>
          <span><b>${esc(m.name)}</b><small>${esc(m.desc)}</small></span></button>`).join('');
      $('modes').querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
        start(b.dataset.mode);
      }));

      const known = Object.values(state.review).filter(r => r.n > 0).length;
      const due = window.ArcadeDeck.dueCount(state.review);
      const clean = Object.values(state.review).filter(r => r.n >= 3 && r.miss === 0).length;
      $('stats').innerHTML = `
        <div class="stat"><b>${BANK.length}</b><span>entries in the bank</span></div>
        <div class="stat"><b>${known}</b><span>met so far</span></div>
        <div class="stat"><b>${clean}</b><span>known clean</span></div>
        <div class="stat"><b>${due}</b><span>due for review</span></div>`;
      $('hudBest').textContent = 'Best ' + state.best + '%';
    }

    function start(mode) {
      state.mode = mode;
      const name = tierKey(state.tier) + ':' + mode;
      const pool = modePool(mode, state.tier);
      state.queue = buildQueue(pool, name, mode === 'learn' ? Math.min(TOTAL, pool.length) : TOTAL);
      state.index = 0; state.right = 0; state.misses = []; state.hintUsed = false;
      state.modeName = name;
      show(mode === 'learn' ? 'learn' : 'drill');
      render();
    }

    function render() {
      if (state.index >= state.queue.length) return finish();
      const e = state.queue[state.index];
      if (state.mode === 'learn') return renderLearn(e);
      return renderQuestion(e);
    }

    /* ---------------- learn ---------------- */
    function renderLearn(e) {
      $('lNum').textContent = state.index + 1;
      $('lTot').textContent = state.queue.length;
      $('lProg').style.width = (state.index / state.queue.length * 100) + '%';

      const badges = cfg.badges(e).filter(Boolean)
        .map(b => `<span class="badge ${esc(b.kind)}">${esc(b.text)}</span>`).join('');

      $('lCard').innerHTML = `
        <div class="badges">${badges}</div>
        <p class="wordbig">${esc(cfg.word(e))}</p>
        <p class="sayline">${esc(cfg.say(e))}</p>
        <div class="actions" style="margin-top:0;margin-bottom:16px">
          <button class="btn soft small" type="button" data-say="word">🔊 Say it</button>
          <button class="btn soft small" type="button" data-say="sent">🔊 Say the sentence</button>
        </div>
        <p class="def">${esc(cfg.meaning(e))}</p>
        <p class="sent">${cfg.sentenceHTML(e)}</p>
        <div class="explain">
          <div class="exrow"><span class="extag rule">Watch</span><p>${esc(e.trap || '')}</p></div>
          ${cfg.extra ? cfg.extra(e) : ''}
        </div>`;

      $('lCard').querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => {
        speak(b.dataset.say === 'word' ? cfg.speechWord(e) : cfg.speechSentence(e));
      }));
      $('lPrev').disabled = state.index === 0;
      markSeen(bucket(state.modeName), cfg.keyOf(e));
      save();
    }

    /* ---------------- drill ---------------- */
    function renderQuestion(e) {
      state.shownAt = performance.now();
      const spec = cfg.prompt(state.mode, e, BANK);
      $('dNum').textContent = state.index + 1;
      $('dTot').textContent = state.queue.length;
      $('dScore').textContent = state.right + ' right';
      $('dProg').style.width = (state.index / state.queue.length * 100) + '%';
      $('dKind').textContent = spec.kind;
      $('dFb').className = 'feedback';
      $('dFb').innerHTML = '';
      $('dNext').hidden = true;
      state.answered = false; state.input = ''; state.spec = spec;

      $('dPrompt').innerHTML = spec.prompt;
      $('dHintBox').hidden = true;
      $('dHintBox').textContent = spec.hint || '';

      if (spec.type === 'choose') {
        $('dType').hidden = true;
        $('dChoices').hidden = false;
        $('dChoices').innerHTML = spec.options.map(o =>
          `<button class="opt" type="button" data-opt="${escAttr(o.value)}">${o.html || esc(o.label || o.value)}</button>`).join('');
        $('dChoices').querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => {
          if (state.answered) return;
          pick(b.dataset.opt, spec);
        }));
      } else {
        $('dChoices').hidden = true;
        $('dType').hidden = false;
        $('dInput').value = '';
        $('dInput').focus();
        paintAccents(spec.accents);
      }
      markSeen(bucket(state.modeName), cfg.keyOf(e));
      save();
    }

    function paintAccents(chars) {
      const row = $('dAccents');
      if (!chars || !chars.length) { row.hidden = true; row.innerHTML = ''; return; }
      row.hidden = false;
      row.innerHTML = chars.map(c => `<button class="akey" type="button">${esc(c)}</button>`).join('');
      row.querySelectorAll('.akey').forEach(b => b.addEventListener('click', () => {
        const inp = $('dInput');
        const at = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
        inp.value = inp.value.slice(0, at) + b.textContent + inp.value.slice(at);
        inp.focus();
        inp.selectionStart = inp.selectionEnd = at + b.textContent.length;
      }));
    }

    function checkTyped(e, spec) {
      const raw = $('dInput').value;
      const exact = cfg.check(raw, e, spec);
      if (exact === true) return { ok: true, accent: false };
      if (exact === 'accent') return { ok: true, accent: true };
      return { ok: false, accent: false };
    }

    function pick(value, spec) {
      spec.typed = value;
      const ok = value === spec.answer;
      finishAnswer(ok, false, spec);
    }

    function submitTyped() {
      if (state.answered) return;
      const e = state.queue[state.index], spec = state.spec;
      const raw = $('dInput').value;
      if (raw.trim() === '') return;
      spec.typed = raw;
      const r = checkTyped(e, spec);
      finishAnswer(r.ok, r.accent, spec);
    }

    function finishAnswer(ok, accentNote, spec) {
      if (state.answered) return;
      state.answered = true;
      const e = state.queue[state.index];
      const fb = $('dFb');
      state.right += ok ? 1 : 0;
      if (ok) {
        state.score += 10 + Math.min(state.streak, 5) * 2 - (state.hintUsed ? 4 : 0);
        state.streak++; state.best = Math.max(state.best, state.streak);
        goodSound(state.streak); burst(20 + Math.min(state.streak, 6) * 4);
      } else {
        state.streak = 0;
        badSound();
        state.misses.push({ prompt: spec.short, right: spec.answer, typed: spec.typed || '' });
      }
      noteFact(e, ok);
      $('dScore').textContent = state.right + ' right';

      const head = ok
        ? (accentNote ? 'Right — mind the accent' : 'Correct')
        : 'Not quite';
      fb.className = 'feedback on ' + (ok ? 'good' : 'bad');
      fb.innerHTML = `<h3>${head}</h3>
        ${ok ? '' : `<p class="answerline">The answer is <b>${esc(spec.answer)}</b>${spec.typed ? ` — you wrote <s>${esc(spec.typed)}</s>` : ''}.</p>`}
        <p>${esc(e.trap || '')}</p>
        ${spec.note ? `<p class="trickline">${esc(spec.note)}</p>` : ''}`;
      $('dNext').hidden = false;
      $('dNext').focus();

      if (spec.type === 'choose') {
        $('dChoices').querySelectorAll('[data-opt]').forEach(b => {
          b.disabled = true;
          if (b.dataset.opt === spec.answer) b.classList.add('right');
          else if (b.dataset.opt === spec.typed) b.classList.add('wrong');
        });
      }
      if (ok) setTimeout(next, 900);
      save();
    }

    function next() {
      state.index++;
      render();
    }

    function finish() {
      $('dScore').textContent = state.right + ' right';
      show('done');
      const pct = Math.round(state.right / state.queue.length * 100);
      state.perTier[state.tier] = Math.max(state.perTier[state.tier] || 0, pct);
      save();
      $('doneText').textContent =
        `${state.right} of ${state.queue.length} correct · ${state.score} points · best streak ${state.best}`;
      const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
      [...$('stars').children].forEach((s, i) => s.classList.toggle('on', i < stars));
      $('doneTitle').textContent = stars === 3 ? 'Deck complete!' : stars === 2 ? 'Strong run!' : 'Good start!';
      if (state.misses.length) {
        $('missed').hidden = false;
        $('missed').innerHTML = '<h4>Worth another look</h4>' +
          state.misses.slice(0, 12).map(m =>
            `<div class="missrow"><span>${esc(m.prompt)}</span><b>${esc(m.right)}</b></div>`).join('');
      } else {
        $('missed').hidden = true;
      }
      if (stars >= 2) burst(70);
    }

    /* ---------------- wiring ---------------- */
    $('lNext').addEventListener('click', next);
    $('lPrev').addEventListener('click', () => { if (state.index > 0) { state.index--; render(); } });
    $('lExit').addEventListener('click', () => { paintHome(); show('home'); });
    $('dNext').addEventListener('click', next);
    $('dSubmit').addEventListener('click', submitTyped);
    $('dInput').addEventListener('keydown', ev => {
      if (ev.key === 'Enter') { ev.preventDefault(); submitTyped(); }
    });
    $('dHint').addEventListener('click', () => {
      const box = $('dHintBox');
      if (box.hidden && box.textContent) { box.hidden = false; state.hintUsed = true; }
      else box.hidden = true;
    });
    $('dSay').addEventListener('click', () => {
      const e = state.queue[state.index];
      if (e) speak(cfg.speechWord(e));
    });
    $('dExit').addEventListener('click', () => { paintHome(); show('home'); });
    $('rAgain').addEventListener('click', () => start(state.mode));
    $('rHome').addEventListener('click', () => { paintHome(); show('home'); });

    if ('speechSynthesis' in window) {
      pickVoice(cfg.lang);
      speechSynthesis.onvoiceschanged = () => pickVoice(cfg.lang);
    }

    load();
    R.notice(loadStatus);
    paintHome();
    show('home');
  }

  window.LangGame = { init, fold, esc, shuffle, speak };
})();
