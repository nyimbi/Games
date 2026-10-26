/* Piano course engine.
 *
 * One engine behind three ways of asking the same question. A question in the
 * bank is a set of notes plus a right answer; which channel it arrives through
 * is a property of the mode, not of the question:
 *
 *   read  -- the staff is shown, name what you see
 *   hear  -- the notes are played and the staff is hidden, name what you hear
 *   find  -- the staff is shown and you press the key
 *
 * That split is deliberate. Naming a note from the page and naming it from the
 * sound are different skills, and a learner who can do one cannot necessarily
 * do the other; keeping them as separate decks is what lets the record say
 * which one is weak.
 *
 * The staff is drawn, not loaded. Every vertical position is computed from the
 * note's diatonic index, so a note is on the line the theory says it is on,
 * and a wrong note is visibly wrong rather than plausible.
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

  /* ---------- pitch ---------- */
  const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const LETTER = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
  const LETTER_AT = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const BLACK = [1, 3, 6, 8, 10];
  const pc = m => ((m % 12) + 12) % 12;
  const octaveOf = m => Math.floor(m / 12) - 1;
  const letterOf = m => LETTER[pc(m)];
  const diatonic = m => octaveOf(m) * 7 + LETTER_AT[pc(m)];
  const BOTTOM = { treble: 30, bass: 18 };
  const freqOf = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- audio ----------
   *
   * Oscillators, not samples: the offline guarantee is worth more than the
   * timbre. Two oscillators a fifth apart and slightly detuned give something
   * closer to a struck string than a bare sine, and cost nothing to ship.
   */
  let ctx = null;
  function audio() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (_) { return null; }
  }

  function tone(freq, dur, type, gain, delay) {
    const c = audio(); if (!c) return;
    try {
      const t0 = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain || .07, t0 + .012);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(g).connect(c.destination);
      o.start(t0); o.stop(t0 + dur + .02);
    } catch (_) { }
  }

  /* A struck note: a sine for the body, a quieter triangle an octave up for
     the attack, both decaying. Enough to hear the pitch clearly. */
  function playNote(midi, when, dur) {
    const f = freqOf(midi);
    tone(f, dur || .7, 'sine', .085, when || 0);
    tone(f * 2, (dur || .7) * .6, 'triangle', .022, when || 0);
  }
  const playChord = notes => notes.forEach((m, i) => playNote(m, i * .035, .9));
  /* A sequence of MIDI numbers, or of `{m, b}` pairs. The pairs carry their
     own durations, which is what makes a piece sound like itself: playing
     Hot Cross Buns at one beat per note removes the minims that give it its
     shape. A bare number is one beat. */
  const playSeq = (notes, bpm) => {
    const beat = 60 / (bpm || 80);
    let t = 0;
    notes.forEach(n => {
      const m = typeof n === 'number' ? n : n.m;
      const b = typeof n === 'number' ? 1 : (n.b || 1);
      playNote(m, t, Math.max(.35, beat * b * .9));
      t += beat * b;
    });
  };

  const goodSound = s => { const b = 523.25 * Math.pow(2, Math.min(s, 7) / 12); tone(b, .1, 'sine', .05); setTimeout(() => tone(b * 1.25, .12, 'sine', .045), 70); };
  const badSound = () => { tone(196, .16, 'triangle', .05); setTimeout(() => tone(155, .2, 'triangle', .045), 110); };

  function burst(n) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = $('confetti'); if (!c) return;
    const cx = c.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = ['#c1272d', '#f5a300', '#0aa392', '#4a5cf0', '#8b46d9', '#191c3a'];
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

  /* ---------- the staff ----------
   *
   * A note's height is its diatonic index: lines and spaces, not semitones.
   * C♯ and C sit on the same place and differ by the accidental in front, so
   * a black key is drawn at its letter's position with a ♯ before it.
   *
   * Half a space is HALF; a ledger line is drawn wherever a note sits on a
   * line outside the staff, at every even step between the staff and it.
   */
  const HALF = 6;

  /* A flat is a lowered letter, and a sharp a raised one -- but the bank's
     notes arrive as MIDI, which has lost that distinction. C♯4 and D♭4 are
     the same key and the same staff position; only the spelling says which
     sign is drawn. A caller that cares passes the letter it means; the
     default falls back to the sharp, which is what the bank uses. */
  function accidentalOf(midi, spelled) {
    const p = pc(midi);
    if (BLACK.indexOf(p) < 0) return '';
    if (spelled) return spelled;
    return '♯';
  }

  /* One note as it is written. `beats` drives the shape: four beats hollow
     and stemless, two hollow with a stem, one filled, half filled with one
     flag, a quarter filled with two. Anything shorter than a semiquaver is
     drawn as a semiquaver, because a third flag at this size is a smudge
     rather than a fact.
   */
  function noteHead(x, y, beats, dot) {
    const v = beats >= 4 ? 'w' : beats >= 2 ? 'h' : beats >= 1 ? 'q' : beats >= 0.5 ? 'e' : 's';
    const filled = v !== 'w' && v !== 'h';
    let out = `<ellipse cx="${x}" cy="${y}" rx="7" ry="5.2" fill="${filled ? '#191c3a' : '#fffdf8'}" stroke="#191c3a" stroke-width="1.5" transform="rotate(-16 ${x} ${y})"/>`;
    if (v !== 'w') out += `<line x1="${x + 6.5}" y1="${y}" x2="${x + 6.5}" y2="${y - 32}" stroke="#191c3a" stroke-width="1.7"/>`;
    // A quaver has one flag, a semiquaver two. The second sits a little lower
    // on the same stem; they are the difference between half a beat and a
    // quarter, so drawing one for both would misname the note.
    if (v === 'e') out += `<path d="M${x + 6.5} ${y - 32}q10 6 8 16" fill="none" stroke="#191c3a" stroke-width="1.7"/>`;
    if (v === 's') {
      out += `<path d="M${x + 6.5} ${y - 32}q10 6 8 16" fill="none" stroke="#191c3a" stroke-width="1.7"/>`;
      out += `<path d="M${x + 6.5} ${y - 22}q10 6 8 16" fill="none" stroke="#191c3a" stroke-width="1.7"/>`;
    }
    if (dot) out += `<circle cx="${x + 15}" cy="${y - 1}" r="2.6" fill="#191c3a"/>`;
    return out;
  }

  /* The time signature, drawn the way it is printed: two numbers stacked on
     the middle of the staff, numerator above the middle line and
     denominator below it. */
  function timeSigGlyph(x, middleY, sig) {
    const [num, den] = sig.split('/');
    return `<text x="${x}" y="${middleY - 5}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="19" font-weight="900" fill="#191c3a">${num}</text>` +
      `<text x="${x}" y="${middleY + 19}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="19" font-weight="900" fill="#191c3a">${den}</text>`;
  }

  function staffSvg(opts) {
    const clef = opts.clef || 'treble';
    const notes = opts.notes || [];
    const simul = !!opts.simul;
    const show = opts.show !== false;
    const W = opts.w || 300, H = opts.h || 158;
    const left = 48, right = W - 22, top = 46;
    const bottomY = top + 4 * (HALF * 2);

    const lines = [0, 1, 2, 3, 4].map(i =>
      `<line x1="${left}" y1="${top + i * HALF * 2}" x2="${right}" y2="${top + i * HALF * 2}" stroke="#191c3a" stroke-width="1.5"/>`).join('');

    const clefGlyph = clef === 'treble'
      ? `<text x="${left - 40}" y="${bottomY + 8}" font-family="serif" font-size="62" fill="#191c3a">𝄞</text>`
      : `<text x="${left - 38}" y="${bottomY + 2}" font-family="serif" font-size="44" fill="#191c3a">𝄢</text>`;

    const sig = opts.timeSig || '';
    const sigGlyph = sig ? timeSigGlyph(left + 30, top + 2 * HALF * 2, sig) : '';
    // One sign per note, for the notes that need one. An array on the option
    // rather than a property of each note keeps the bank's notes plain MIDI.
    const spell = opts.spell || [];
    const beats = opts.beats || [];
    const dots = opts.dots || [];

    const span = simul ? 0 : Math.min(56, (right - left - 70) / Math.max(notes.length - 1, 1));
    const startX = simul ? left + (right - left) / 2 : left + 52 + (sig ? 22 : 0);

    const parts = notes.map((midi, i) => {
      const delta = diatonic(midi) - BOTTOM[clef];
      const y = bottomY - delta * HALF;
      const x = startX + i * span;
      let out = '';
      // Ledger lines: every even step outside the staff between it and the note.
      if (delta < 0 || delta > 8) {
        const from = delta < 0 ? -2 : 10;
        const to = delta < 0 ? delta : delta;
        const lo = Math.min(from, to), hi = Math.max(from, to);
        for (let s = lo; s <= hi; s += 2) {
          if (s === 0 || s === 8) continue;
          if (delta < 0 && s > 0) continue;
          if (delta > 8 && s < 8) continue;
          out += `<line x1="${x - 13}" y1="${bottomY - s * HALF}" x2="${x + 13}" y2="${bottomY - s * HALF}" stroke="#191c3a" stroke-width="1.5"/>`;
        }
      }
      // An accidental, for a black key, before the note head. The sign is
      // whatever spelling the caller gave; `♯` is the default because that is
      // what the bank's accidental questions are about.
      const sign = accidentalOf(midi, spell[i]);
      if (sign) {
        out += `<text x="${x - 24}" y="${y + 5}" font-family="ui-monospace,Menlo,monospace" font-size="17" font-weight="700" fill="#191c3a">${sign}</text>`;
      }
      // A caller that knows the duration gets a note drawn at that duration,
      // stem and fill included. A caller that does not -- every bank question,
      // which is about pitch -- gets the plain filled head it always got.
      const known = typeof beats[i] === 'number';
      out += known ? noteHead(x, y, beats[i], !!dots[i]) : `<ellipse cx="${x}" cy="${y}" rx="7" ry="5.2" fill="#191c3a" transform="rotate(-16 ${x} ${y})"/>`;
      return { out, x, y, delta, selfStem: known };
    });

    // Stems: one per note, up when the note is low and down when it is high.
    // In a chord the stem is shared and its direction follows the chord's
    // furthest note, which is what an engraver does. A note drawn from a known
    // duration already carries its own stem, so it is left alone here.
    let stems = '';
    if (simul && parts.length) {
      const d = Math.max.apply(null, parts.map(p => p.delta));
      const x = parts[0].x, topY = Math.min.apply(null, parts.map(p => p.y)), botY = Math.max.apply(null, parts.map(p => p.y));
      stems = d >= 4
        ? `<line x1="${x + 6.5}" y1="${topY}" x2="${x + 6.5}" y2="${botY + 34}" stroke="#191c3a" stroke-width="1.7"/>`
        : `<line x1="${x - 6.5}" y1="${topY - 34}" x2="${x - 6.5}" y2="${botY}" stroke="#191c3a" stroke-width="1.7"/>`;
    } else {
      stems = parts.filter(p => !p.selfStem).map(p => p.delta >= 4
        ? `<line x1="${p.x + 6.5}" y1="${p.y}" x2="${p.x + 6.5}" y2="${p.y + 32}" stroke="#191c3a" stroke-width="1.7"/>`
        : `<line x1="${p.x - 6.5}" y1="${p.y - 32}" x2="${p.x - 6.5}" y2="${p.y}" stroke="#191c3a" stroke-width="1.7"/>`).join('');
    }

    // Barlines. The note list carries beats, so a bar ends where the running
    // total reaches the time signature's numerator. A note that straddles a
    // barline would put the line through the middle of a note head; the
    // pieces are checked for that when they are written, and the line is
    // simply not drawn here if the totals do not divide.
    let bars = '';
    const timed = sig && beats.length === notes.length && !simul;
    if (timed) {
      const per = parseInt(sig.split('/')[0], 10);
      // A window into the middle of a piece starts mid-bar, so the running
      // total begins at the beats already elapsed rather than at zero. Without
      // this the barlines land on the wrong notes for every window but the
      // first, which is worse than no barlines at all.
      let acc = opts.offset || 0;
      notes.forEach((_, i) => {
        acc += beats[i];
        const endsBar = Math.abs(acc / per - Math.round(acc / per)) < 1e-9;
        const x = Math.round(startX + i * span + (span || 0) / 2 + 6);
        if (endsBar && i < notes.length - 1 && x < right) {
          bars += `<line x1="${x}" y1="${top}" x2="${x}" y2="${bottomY}" stroke="#191c3a" stroke-width="1.5"/>`;
        }
      });
    }

    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="staff notation" class="staffsvg">` +
      (show ? lines + clefGlyph + sigGlyph + bars + stems + parts.map(p => p.out).join('') : '') + `</svg>`;
  }

  /* ---------- rhythm figures ----------
   *
   * A note value drawn as it is written: hollow for a semibreve, hollow with a
   * stem for a minim, filled with a stem for a crotchet, filled with a stem
   * and a flag for a quaver. A dot sits to the right.
   *
   * The figures sit on a staff with a time signature and barlines, because a
   * note value on its own is a fact about arithmetic and a note value in a bar
   * is the thing a reader has to decode. Width follows duration, so the bar a
   * learner sees is the bar they would count.
   *
   * The two rests are drawn where an engraver puts them: the semibreve rest
   * hangs under the fourth line, the minim rest sits on the third. They were
   * the same rectangle at the same height, which made the figure for "how long
   * is a minim rest" identical to the one for a semibreve rest.
   */
  function rhythmSvg(items, w, opts) {
    const W = w || 300;
    const gap = 12, top = 22, bottomY = top + 4 * gap, midY = top + 2 * gap;
    const H = bottomY + 26;
    // Two signatures, because they answer different questions. `timeSig` is
    // printed on the staff; `barSig` is the numerator the barlines are drawn
    // from. They differ only for "which signature is this bar in", where
    // printing the signature would print the answer.
    const sig = (opts && opts.timeSig) || '';
    const barSig = (opts && opts.barSig) || sig;
    const per = barSig ? parseInt(barSig.split('/')[0], 10) : 0;
    const UNIT = 26;              // pixels per beat at the widest
    const startX = 26 + (sig ? 34 : 0);

    const lines = [0, 1, 2, 3, 4].map(i =>
      `<line x1="16" y1="${top + i * gap}" x2="${W - 12}" y2="${top + i * gap}" stroke="#191c3a" stroke-width="1.3"/>`).join('');
    const sigGlyph = sig ? timeSigGlyph(startX - 16, midY, sig) : '';

    // `v` here is the bank's own vocabulary: w, h, q and e are whole, half,
    // quarter and eighth -- `e` is a quaver, not a semiquaver. It is a
    // different scale from `noteHead`'s beats argument, which is why the two
    // are not derived from each other.
    let x = startX, out = '', acc = 0;
    items.forEach((it, i) => {
      const v = it.v || 'q';
      const beats = { w: 4, h: 2, q: 1, e: 0.5 }[v] || 1;
      const dur = beats * (it.dot ? 1.5 : 1);
      const adv = Math.max(26, dur * UNIT);
      const cx = x + adv / 2;

      if (it.rest) {
        // Rests hang from or sit on the line that names them, not on the note
        // head's line. The semibreve rest is the one that hangs from the
        // fourth line; every shorter rest sits inside the staff.
        if (v === 'w') out += `<rect x="${cx - 9}" y="${top + 3 * gap + 1}" width="18" height="7" fill="#191c3a"/>`;
        else if (v === 'h') out += `<rect x="${cx - 9}" y="${midY - 8}" width="18" height="7" fill="#191c3a"/>`;
        else out += `<path d="M${cx - 4} ${midY - 14}l7 9-7 9-4-6 5-3-5-3z" fill="#191c3a"/>`;
      } else {
        const filled = v === 'q' || v === 'e';
        out += `<ellipse cx="${cx}" cy="${midY}" rx="7" ry="5.2" fill="${filled ? '#191c3a' : '#fffdf8'}" stroke="#191c3a" stroke-width="1.6" transform="rotate(-16 ${cx} ${midY})"/>`;
        if (v !== 'w') out += `<line x1="${cx + 6.4}" y1="${midY}" x2="${cx + 6.4}" y2="${midY - 32}" stroke="#191c3a" stroke-width="1.7"/>`;
        if (v === 'e') out += `<path d="M${cx + 6.4} ${midY - 32}q10 6 8 16" fill="none" stroke="#191c3a" stroke-width="1.7"/>`;
        if (it.dot) out += `<circle cx="${cx + 15}" cy="${midY - 2}" r="2.6" fill="#191c3a"/>`;
      }

      acc += dur;
      x += adv;
      // A barline after the item that completes a bar, never after the last.
      if (per && i < items.length - 1 && Math.abs(acc / per - Math.round(acc / per)) < 1e-9) {
        out += `<line x1="${Math.round(x - 6)}" y1="${top}" x2="${Math.round(x - 6)}" y2="${bottomY}" stroke="#191c3a" stroke-width="1.5"/>`;
      }
    });
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="note values in a bar">${lines}${sigGlyph}${out}</svg>`;
  }

  /* ---------- the keyboard ----------
   *
   * Two octaves from C4. White keys are laid out evenly and black keys sit
   * between the white keys they belong between, which is what makes the 2-3
   * grouping visible. Each key carries `data-midi`, so a click is a pitch
   * rather than a guess at a rectangle.
   */
  const KB_LOW = 60, KB_HIGH = 72;

  function keyboardHtml(mark) {
    const whites = [];
    for (let m = KB_LOW; m <= KB_HIGH; m++) if (BLACK.indexOf(pc(m)) < 0) whites.push(m);
    const kw = 100 / whites.length;
    let html = '';
    // A black key sits between two whites, and only after the whites whose
    // pitch class has one above it: C, D, F, G and A. Testing the white key's
    // own pitch class instead finds a black key after every white key but the
    // two pairs that have none, which is the same set read backwards -- so the
    // gap has to be computed from the *next* white key, not this one.
    const HAS_BLACK_ABOVE = [0, 2, 5, 7, 9];
    const blacks = [];
    whites.forEach((m, i) => {
      const on = mark && mark.indexOf(pc(m)) >= 0;
      html += `<button type="button" class="wkey${on ? ' on' : ''}" data-midi="${m}" aria-label="${NAMES[pc(m)]}${octaveOf(m)}" style="left:${i * kw}%;width:${kw}%">` +
        `<span>${NAMES[pc(m)]}${pc(m) === 0 ? octaveOf(m) : ''}</span></button>`;
      if (i < whites.length - 1 && HAS_BLACK_ABOVE.indexOf(pc(m)) >= 0) blacks.push({ m: m + 1, x: (i + 1) * kw });
    });
    blacks.forEach(({ m, x }) => {
      const on = mark && mark.indexOf(pc(m)) >= 0;
      html += `<button type="button" class="bkey${on ? ' on' : ''}" data-midi="${m}" aria-label="${NAMES[pc(m)]}${octaveOf(m)}" style="left:${x - kw * 0.31}%;width:${kw * 0.62}%"></button>`;
    });
    return html;
  }

  /* ---------- the game ---------- */
  function init(cfg) {
    const BANK = Array.isArray(cfg.bank) ? cfg.bank : [];
    const PIECES = Array.isArray(cfg.pieces) ? cfg.pieces : [];
    const LESSONS = cfg.lessons && typeof cfg.lessons === 'object' ? cfg.lessons : null;
    const TOTAL = cfg.total || 20;
    const KEY = cfg.key;
    const keyOf = q => q.id;
    const SEEN_CAP = window.ArcadeDeck.SEEN_CAP;

    const state = {
      tier: 1, mode: 'read', queue: [], index: 0, right: 0, score: 0,
      streak: 0, best: 0, misses: [], answered: false, seen: {}, review: {}, perTier: {},
      taught: {}, lessonTopic: null, lessonResume: null,
      piece: null, pieceIndex: 0, pieceRight: 0, pieceMiss: 0, playing: false
    };

    function load() {
      try {
        const s = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (s) {
          state.best = s.best || 0; state.seen = s.seen || {}; state.review = s.review || {};
          state.perTier = s.perTier || {}; state.taught = s.taught || {};
          state.piecesDone = s.piecesDone || {};
          if (s.tier) state.tier = s.tier;
        }
      } catch (_) { }
    }
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          best: state.best, seen: state.seen, review: state.review, perTier: state.perTier,
          tier: state.tier, taught: state.taught, piecesDone: state.piecesDone || {}
        }));
      } catch (_) { }
    };

    /* One deck, in deck.js. This copy closed over `keyOf` instead of taking it,
       which is why it had a different signature from the other five -- and why
       migrating it is the one place the shared signature had to be spelled out
       at the call site. */
    const markSeen = (bucket, key) => window.ArcadeDeck.markSeen(bucket, key);
    const freshFirst = (pool, bucket) => window.ArcadeDeck.freshFirst(pool, bucket, keyOf);

    const tierKey = () => 't' + state.tier;
    const poolFor = t => BANK.filter(q => q.tier === t);
    const topicOf = t => BANK.filter(q => q.topic === t);

    /* Which questions a mode can ask. A text question has nothing to hear and
       no single key to press, so it is only asked by reading. */
    function modePool(pool) {
      if (state.mode === 'hear') return pool.filter(q => Array.isArray(q.play) && q.play.length);
      if (state.mode === 'find') return pool.filter(q => typeof q.midi === 'number');
      return pool;
    }

    function noteFact(q, ok) {
      const r = state.review[keyOf(q)] || { n: 0, miss: 0, due: false };
      r.n++; if (!ok) { r.miss++; r.due = true; } else if (r.due) r.due = false;
      state.review[keyOf(q)] = r;
    }

    function buildQueue(pool, name, total) {
      const bucket = state.seen[name] || (state.seen[name] = {});
      const due = Object.entries(state.review).filter(([, r]) => r.due)
        .map(([k]) => pool.find(q => keyOf(q) === k)).filter(Boolean).slice(0, 2);
      const order = freshFirst(pool.filter(q => !due.includes(q)), bucket);
      return due.concat(order).slice(0, Math.min(total, due.length + order.length));
    }

    function show(id) {
      document.querySelectorAll('.stage').forEach(s => s.classList.toggle('on', s.id === id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const lessonFor = topic => (LESSONS && LESSONS[topic]) || null;

    function paintLesson(topic, resume) {
      const L = lessonFor(topic);
      if (!L) return false;
      state.lessonTopic = topic;
      state.lessonResume = resume || 'home';
      $('lTopic').textContent = L.title;
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

    /* ---------- the question screen ---------- */
    function render() {
      if (state.index >= state.queue.length) return finish();
      const q = state.queue[state.index];
      if (q.topic && lessonFor(q.topic) && !state.taught[q.topic]) {
        paintLesson(q.topic, 'render');
        return;
      }
      state.answered = false;
      $('qNum').textContent = state.index + 1;
      $('qTot').textContent = state.queue.length;
      $('qScore').textContent = state.right + ' right';
      $('qProg').style.width = (state.index / state.queue.length * 100) + '%';
      $('qTopic').textContent = (cfg.topics.find(t => t.id === q.topic) || {}).name || q.topic;
      $('qText').textContent = q.q;
      $('qFb').className = 'feedback';
      $('qFb').innerHTML = '';
      $('qNext').hidden = true;
      $('qExplain').hidden = true;
      $('qExplain').innerHTML = '';
      $('qHintBox').hidden = true;
      $('qHintBox').textContent = '';

      // The figure. Read and find show the staff; hear must not, or the
      // answer is on the screen and the ear is never used.
      const fig = $('qFigure');
      if (state.mode === 'hear') {
        fig.innerHTML = `<div class="earbox"><span class="earicon" aria-hidden="true">♪</span>
          <p>Listen, then name what you heard.</p>
          <button class="btn primary" type="button" id="qReplay">Play it again</button></div>`;
      } else if (q.staff) {
        fig.innerHTML = staffSvg(q.staff);
      } else if (q.rhythm) {
        fig.innerHTML = rhythmSvg(q.rhythm, 300, { timeSig: q.shownSig || '', barSig: q.barSig || '' });
      } else {
        fig.innerHTML = '';
      }
      fig.hidden = !fig.innerHTML;
      if ($('qReplay')) $('qReplay').addEventListener('click', () => playQuestion(q));

      // The answer channel. Find mode replaces the buttons with the keyboard;
      // every other question is multiple choice, because a typed note name
      // adds a spelling problem to a reading problem.
      const kb = $('qKeyboard');
      if (state.mode === 'find') {
        $('qChoices').hidden = true;
        kb.hidden = false;
        kb.innerHTML = `<div class="kb" role="group" aria-label="keyboard">${keyboardHtml(null)}</div>`;
        kb.querySelectorAll('[data-midi]').forEach(b => b.addEventListener('click', () => answerFind(+b.dataset.midi, q)));
      } else {
        kb.hidden = true;
        kb.innerHTML = '';
        $('qChoices').hidden = false;
        const opts = shuffle([q.a, q.d1, q.d2, q.d3].filter((v, i, a) => v && a.indexOf(v) === i));
        $('qChoices').innerHTML = opts.map(v =>
          `<button class="opt" type="button" data-opt="${escAttr(v)}">${esc(v)}</button>`).join('');
        $('qChoices').querySelectorAll('[data-opt]').forEach(b =>
          b.addEventListener('click', () => answerChoice(b.dataset.opt, q)));
      }

      const bucket = state.seen[tierKey() + ':' + state.mode];
      if (bucket) markSeen(bucket, keyOf(q));
      save();

      // A heard question is played on arrival; a read one is not, because
      // hearing it would give away the note's name for free.
      if (state.mode === 'hear') setTimeout(() => playQuestion(q), 260);
    }

    function playQuestion(q) {
      if (!q.play || !q.play.length) return;
      if (q.staff && q.staff.simul) playChord(q.play);
      else if (q.play.length > 1) playSeq(q.play, 90);
      else playNote(q.play[0], 0, .9);
    }

    function answerChoice(given, q) {
      if (state.answered) return;
      state.answered = true;
      settle(given === q.a, given, q);
    }

    /* Find mode compares pitch class, not MIDI. The question asks which note
       this is; the keyboard shows two octaves, and a learner who presses C5
       for a C4 question has answered the question that was asked. */
    function answerFind(midi, q) {
      if (state.answered) return;
      state.answered = true;
      const ok = pc(midi) === pc(q.midi);
      playNote(midi, 0, .6);
      if (!ok) setTimeout(() => playNote(q.midi, 0, .6), 420);
      settle(ok, NAMES[pc(midi)], q);
      // The marking reads the verdict rather than recomputing the comparison.
      // Recomputing it here is how a page ends up highlighting a key green
      // under a "Not quite" heading: two expressions of one rule drift the
      // first time one of them is edited.
      $('qKeyboard').querySelectorAll('[data-midi]').forEach(b => {
        b.disabled = true;
        if (ok && pc(+b.dataset.midi) === pc(q.midi)) b.classList.add('right');
        else if (!ok && +b.dataset.midi === midi) b.classList.add('wrong');
        else if (!ok && pc(+b.dataset.midi) === pc(q.midi)) b.classList.add('right');
      });
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

      let why = '';
      if (!ok && state.mode !== 'find') {
        const hit = [['d1', q.d1], ['d2', q.d2], ['d3', q.d3]].find(([, v]) => v === given);
        if (hit) why = q.trap || '';
      }
      fb.className = 'feedback on ' + (ok ? 'good' : 'bad');
      fb.innerHTML = `<h3>${ok ? 'Correct' : 'Not quite'}</h3>
        ${ok ? '' : `<p class="answerline">The answer is <b>${esc(q.a)}</b>.</p>`}
        ${why ? `<p class="trickline">${esc(why)}</p>` : ''}
        <p>${esc(q.explain)}</p>`;
      $('qExplain').hidden = false;
      $('qExplain').innerHTML = `<b>Why:</b> ${esc(q.explain)}`;
      $('qNext').hidden = false; $('qNext').focus();

      if (state.mode !== 'find') {
        $('qChoices').querySelectorAll('[data-opt]').forEach(b => {
          b.disabled = true;
          if (b.dataset.opt === q.a) b.classList.add('right');
          else if (b.dataset.opt === given) b.classList.add('wrong');
        });
      }
      // A wrong answer waits for Next; a right one moves on by itself, unless
      // the question was heard -- then the learner gets to hear it once more
      // in the light of the answer.
      if (ok && state.mode !== 'hear') setTimeout(() => { state.index++; render(); }, 1100);
      save();
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

    function begin(mode, queue) {
      state.mode = mode;
      state.queue = queue;
      state.index = 0; state.right = 0; state.score = 0; state.streak = 0; state.misses = [];
      state.answered = false;
      show('quiz'); render();
    }

    function start(mode) {
      state.mode = mode;
      const pool = modePool(poolFor(state.tier));
      if (!pool.length) return;
      begin(mode, buildQueue(pool, tierKey() + ':' + mode, TOTAL));
    }

    function afterLesson() {
      const t = state.lessonTopic;
      if (t) { state.taught[t] = true; save(); }
      const resume = state.lessonResume;
      state.lessonResume = null;
      if (resume === 'keep') { show('quiz'); return; }
      if (resume === 'render') { show('quiz'); render(); return; }
      paintHome(); show('home');
    }

    function lessonFromQuiz() {
      const q = state.queue[state.index];
      if (!q || !lessonFor(q.topic)) return;
      paintLesson(q.topic, 'keep');
    }

    /* ---------- the play stage ----------
     *
     * A piece is a list of notes and beats. The page shows a window of it,
     * lights the key that comes next, and waits. Nothing is timed: a learner
     * who is slow is still playing it right, and a metronome they cannot keep
     * up with teaches them to guess.
     */
    const WINDOW = 9;

    function openPiece(piece) {
      state.piece = piece;
      state.pieceIndex = 0;
      state.pieceRight = 0; state.pieceMiss = 0;
      state.playing = true;
      $('pTitle').textContent = piece.title;
      $('pNote').textContent = piece.note;
      show('play');
      paintPiece();
    }

    function paintPiece() {
      const p = state.piece;
      if (!p) return;
      const start = Math.max(0, Math.min(state.pieceIndex - 2, p.notes.length - WINDOW));
      const slice = p.notes.slice(start, start + WINDOW);
      const midis = slice.map(n => n.m);
      let elapsed = 0;
      for (let i = 0; i < start; i++) elapsed += p.notes[i].b;
      $('pStaff').innerHTML = staffSvg({
        clef: 'treble', notes: midis, w: 340, h: 150,
        timeSig: start === 0 ? (p.timeSig || '4/4') : '',
        beats: slice.map(n => n.b),
        offset: elapsed,
        spell: slice.map(n => n.s || '')
      });
      const next = p.notes[state.pieceIndex];
      $('pNext').textContent = next ? NAMES[pc(next.m)] + octaveOf(next.m) : '—';
      $('pProgress').style.width = (state.pieceIndex / p.notes.length * 100) + '%';
      $('pCount').textContent = state.pieceIndex + ' / ' + p.notes.length;
      $('pKeys').innerHTML = `<div class="kb" role="group" aria-label="keyboard">${keyboardHtml(next ? [pc(next.m)] : [])}</div>`;
      $('pKeys').querySelectorAll('[data-midi]').forEach(b =>
        b.addEventListener('click', () => pressKey(+b.dataset.midi)));
    }

    function pressKey(midi) {
      if (!state.playing) return;
      const p = state.piece;
      const want = p.notes[state.pieceIndex];
      if (!want) return;
      playNote(midi, 0, .7);
      if (pc(midi) === pc(want.m)) {
        state.pieceRight++;
        state.pieceIndex++;
        if (state.pieceIndex >= p.notes.length) return finishPiece();
        paintPiece();
      } else {
        state.pieceMiss++;
        badSound();
        $('pNext').classList.add('shake');
        setTimeout(() => $('pNext').classList.remove('shake'), 400);
      }
    }

    function finishPiece() {
      state.playing = false;
      const p = state.piece;
      const tries = state.pieceRight + state.pieceMiss;
      const pct = Math.round(state.pieceRight / Math.max(tries, 1) * 100);
      state.piecesDone = state.piecesDone || {};
      state.piecesDone[p.id] = Math.max(state.piecesDone[p.id] || 0, pct);
      save();
      $('pStaff').innerHTML = staffSvg({
        clef: 'treble', notes: p.notes.map(n => n.m), w: 340, h: 150,
        timeSig: p.timeSig || '4/4',
        beats: p.notes.map(n => n.b),
        spell: p.notes.map(n => n.s || '')
      });
      $('pKeys').innerHTML = '';
      $('pNext').textContent = 'Done';
      $('pCount').textContent = p.notes.length + ' / ' + p.notes.length;
      $('pProgress').style.width = '100%';
      const fb = $('pFeedback');
      fb.className = 'feedback on good';
      fb.innerHTML = `<h3>${pct === 100 ? 'Every key right.' : 'Piece finished.'}</h3>
        <p>${state.pieceRight} correct of ${tries} presses · ${pct}% accurate.</p>
        <p>Play it again and the notes will come faster; the fingering stays the same.</p>`;
      burst(60);
    }

    /* ---------- home ---------- */
    function paintHome() {
      $('tiers').innerHTML = [1, 2, 3].map(t => {
        const n = poolFor(t).length;
        const name = ['Read', 'Connect', 'Stretch'][t - 1];
        const note = ['one fact at a time', 'two ideas at once', 'keys and harmony'];
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
        const mark = has ? (taught ? '<em class="tick" title="Lesson read">✓</em>' : '<em class="new" title="Lesson not read yet">new</em>') : '';
        return `<button class="topicchip" type="button" data-topic="${t.id}">
          <b>${esc(t.name)}</b><span>${n}</span>${mark}</button>`;
      }).join('');
      $('topics').querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => {
        const pool = topicOf(b.dataset.topic);
        if (!pool.length) return;
        const queue = shuffle(pool.slice()).slice(0, Math.min(TOTAL, pool.length));
        begin('read', queue);
      }));

      $('modes').innerHTML = cfg.modes.map(m => {
        const n = modePool(poolFor(state.tier)).length;
        return `<button class="modebtn" type="button" data-mode="${m.id}">
          <span class="ic" aria-hidden="true">${m.icon}</span>
          <span><b>${esc(m.name)}</b><small>${esc(m.desc)} · ${n} here</small></span></button>`;
      }).join('');
      $('modes').querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => start(b.dataset.mode)));

      $('pieces').innerHTML = PIECES.map(p => {
        const done = (state.piecesDone || {})[p.id];
        return `<button class="piecebtn" type="button" data-piece="${p.id}">
          <b>${esc(p.title)}</b><small>${esc(p.note)}</small>
          <span class="pmeta">${p.notes.length} notes${done ? ' · ' + done + '%' : ''}</span></button>`;
      }).join('');
      $('pieces').querySelectorAll('[data-piece]').forEach(b => b.addEventListener('click', () => {
        const p = PIECES.find(x => x.id === b.dataset.piece);
        if (p) openPiece(p);
      }));

      const known = Object.values(state.review).filter(r => r.n > 0).length;
      const clean = Object.values(state.review).filter(r => r.n >= 1 && r.miss === 0).length;
      const best = Math.max(...Object.values(state.perTier), 0) || 0;
      $('stats').innerHTML = `
        <div class="stat"><b>${BANK.length}</b><span>questions</span></div>
        <div class="stat"><b>${known}</b><span>attempted</span></div>
        <div class="stat"><b>${clean}</b><span>got clean</span></div>
        <div class="stat"><b>${best}%</b><span>best deck</span></div>`;
    }

    /* ---------- wiring ---------- */
    $('qNext').addEventListener('click', () => { state.index++; render(); });
    $('qExit').addEventListener('click', () => { paintHome(); show('home'); });
    $('qHint').addEventListener('click', () => {
      const box = $('qHintBox');
      const q = state.queue[state.index];
      if (!q) return;
      if (!box.hidden) { box.hidden = true; return; }
      box.hidden = false;
      box.textContent = q.trap || 'Read the question again.';
    });
    $('qPlay').addEventListener('click', () => {
      const q = state.queue[state.index];
      if (q) playQuestion(q);
    });
    $('qLesson').addEventListener('click', lessonFromQuiz);
    $('rAgain').addEventListener('click', () => start(state.mode));
    $('rHome').addEventListener('click', () => { paintHome(); show('home'); });
    $('lDone').addEventListener('click', afterLesson);
    $('lHome').addEventListener('click', () => {
      const resume = state.lessonResume;
      state.lessonResume = null;
      if (resume === 'keep') { show('quiz'); return; }
      paintHome(); show('home');
    });
    $('pExit').addEventListener('click', () => {
      state.playing = false; state.piece = null;
      paintHome(); show('home');
    });
    $('pHear').addEventListener('click', () => {
      const p = state.piece;
      if (!p) return;
      playSeq(p.notes, 84);   // the pairs, so each note lasts as long as it is written
    });
    $('pAgain').addEventListener('click', () => { if (state.piece) openPiece(state.piece); });
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && $('lesson') && $('lesson').classList.contains('on')) {
        ev.preventDefault(); afterLesson();
      }
    });

    load(); paintHome(); show('home');
  }

  window.PianoGame = { init, staffSvg, rhythmSvg, esc };
})();
