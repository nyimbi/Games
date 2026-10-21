/* Daily session tracking for the arcade.
 *
 * A session is one pass over nine subjects in a fixed order. The order is the
 * point: maths first, because it is the one a child is most likely to skip,
 * then the two word drills, then the three languages, then the three that ask
 * for the most from a learner. Rotating it by day would let a child dodge the
 * same subject every time.
 *
 * Nothing here talks to a server and nothing leaves the browser. The record is
 * a small object in localStorage beside the per-game progress each game
 * already keeps, so the arcade still opens from file:// with no build step.
 *
 * A game counts as done for its subject when its deck reaches its own summary
 * screen. Three games signal that three different ways -- `.stage` games
 * toggle `#done.on`, the maths and typing games toggle `#done.show`, and the
 * arena shows `#summaryPanel.show` -- so the tracker watches all three rather
 * than asking fourteen games to change how they finish.
 */
(function () {
  'use strict';

  const KEY = 'arcade.session.v1';
  const KEEP_DAYS = 120;

  /* Maths is six games under one subject. The one to play rotates by the day
     number, so over six days every maths game comes up once, and it is
     derived from the date rather than stored -- there is no state to drift. */
  const MATHS = ['number-bonds', 'addition-quest', 'subtraction-safari',
    'times-table-academy', 'division-diner', 'infinite-arena'];

  /* Order matters as much as content. Five of the nine subjects are languages
     -- spelling, French, Kiswahili, Mandarin and calligraphy, which is Chinese
     character writing -- and a run of five language drills back to back is one
     skill practised five ways, not five subjects. With five languages and four
     others, strict alternation is the only order that never puts two languages
     together, and it uses every subject exactly once. `kind` is what the order
     is built from; adding a subject means adding it to the right half. */
  const SUBJECTS = [
    { id: 'spelling', kind: 'lang', name: 'Spelling', note: 'A thousand words', games: ['spelling-bee'] },
    { id: 'maths', kind: 'other', name: 'Maths', note: 'Number facts', games: MATHS },
    { id: 'french', kind: 'lang', name: 'French', note: 'Words and sentences', games: ['french'] },
    { id: 'physics', kind: 'other', name: 'Physics', note: 'Forces to waves', games: ['physics'] },
    { id: 'chinese', kind: 'lang', name: 'Mandarin', note: 'Tones and characters', games: ['chinese'] },
    { id: 'chemistry', kind: 'other', name: 'Chemistry', note: 'Atoms to moles', games: ['chemistry'] },
    { id: 'swahili', kind: 'lang', name: 'Kiswahili', note: 'Noun classes', games: ['swahili'] },
    { id: 'typing', kind: 'other', name: 'Typing', note: 'Home row to speed', games: ['typing-tutor'] },
    { id: 'calligraphy', kind: 'lang', name: 'Calligraphy', note: 'Stroke order', games: ['calligraphy'] }
  ];

  /* The order above is asserted, not trusted: a subject added to the wrong
     place, or a sixth language, would break the one property the order exists
     for, and it would break it silently. Fail loudly at load instead. */
  (function checkOrder() {
    for (let i = 1; i < SUBJECTS.length; i++) {
      if (SUBJECTS[i].kind === 'lang' && SUBJECTS[i - 1].kind === 'lang') {
        throw new Error('session: ' + SUBJECTS[i].name + ' follows ' + SUBJECTS[i - 1].name +
          ', two languages in a row');
      }
    }
  })();

  const BY_GAME = {};
  SUBJECTS.forEach(s => s.games.forEach(g => { BY_GAME[g] = s; }));

  /* Local date, not UTC: a child finishing at nine in the evening should get
     credit for that day, whatever the server's clock says. */
  function dayKey(d) {
    d = d || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function dayNumber(d) {
    d = d || new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }

  function read() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && typeof s === 'object' && s.days && typeof s.days === 'object') return s;
    } catch (_) { }
    return { v: 1, days: {} };
  }

  function write(s) {
    // Keep the record bounded. A hundred and twenty days is more history than
    // a streak can use, and an unbounded object in localStorage is a leak that
    // eventually throws on write.
    const keys = Object.keys(s.days).sort();
    while (keys.length > KEEP_DAYS) delete s.days[keys.shift()];
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) { }
  }

  function todayRecord(create) {
    const s = read();
    const k = dayKey();
    if (!s.days[k] && create) { s.days[k] = { done: {} }; write(s); }
    return s.days[k] || { done: {} };
  }

  /* The game to play for a subject today. Maths rotates; everything else has
     exactly one game. */
  function gameFor(subject, d) {
    if (subject.games.length === 1) return subject.games[0];
    return subject.games[dayNumber(d) % subject.games.length];
  }

  /* The day's plan: every subject in order, with its game and whether it is
     done. Reading this never writes. */
  function plan(d) {
    const rec = todayRecord(false);
    return SUBJECTS.map(s => ({
      id: s.id, name: s.name, note: s.note,
      game: gameFor(s, d),
      href: './' + gameFor(s, d) + '.html',
      done: !!rec.done[s.id]
    }));
  }

  function progress() {
    const p = plan();
    return { done: p.filter(x => x.done).length, total: p.length, plan: p };
  }

  /* Mark a subject done for today. Returns what changed, so the caller can
     decide whether to say anything: a second deck in the same subject is not
     news. */
  function mark(subjectId) {
    const s = read();
    const k = dayKey();
    const day = s.days[k] || (s.days[k] = { done: {} });
    if (day.done[subjectId]) return { changed: false, done: Object.keys(day.done).length, total: SUBJECTS.length };
    day.done[subjectId] = Date.now();
    write(s);
    return { changed: true, done: Object.keys(day.done).length, total: SUBJECTS.length };
  }

  /* A streak is the run of consecutive complete days ending today. Today only
     counts once it is complete, so an unfinished day does not break the run
     until it is over. */
  function streak(d) {
    const s = read();
    const start = d ? new Date(d) : new Date();
    let n = 0;
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    // If today is not finished yet, the streak is the run ending yesterday.
    if (!isComplete(s, dayKey(cur))) cur.setDate(cur.getDate() - 1);
    while (isComplete(s, dayKey(cur))) { n++; cur.setDate(cur.getDate() - 1); }
    return n;
  }

  function isComplete(s, key) {
    const day = s.days[key];
    return !!day && SUBJECTS.every(x => day.done[x.id]);
  }

  /* The last n days, oldest first, for the strip on the session page. A day
     the child never opened is present with done 0 rather than missing, so the
     strip has a fixed width and a gap is visible as a gap. */
  function history(n) {
    const s = read();
    const out = [];
    const cur = new Date();
    cur.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(cur);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const day = s.days[key];
      out.push({
        key,
        done: day ? SUBJECTS.filter(x => day.done[x.id]).length : 0,
        total: SUBJECTS.length,
        complete: isComplete(s, key)
      });
    }
    return out;
  }

  /* ---------- completion detection ---------- */

  const FILE = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  const HERE = BY_GAME[FILE];

  const isFinished = () => {
    const d = document.getElementById('done');
    if (d) {
      // Which class means "finished" is declared by the page, not guessed by
      // us. The stage games carry `class="stage"` and toggle `on`; the maths
      // and typing games carry `class="done"` and toggle `show`. Accepting
      // either on either page would let a class the game never uses count as a
      // finished deck -- and `.stage.on` is true on the home screen.
      const marker = d.classList.contains('stage') ? 'on' : d.classList.contains('done') ? 'show' : null;
      return marker ? d.classList.contains(marker) : false;
    }
    const p = document.getElementById('summaryPanel');
    return !!p && p.classList.contains('show');
  };

  /* Inline styles, because the games do not share a stylesheet and several do
     not define the accent variables. The banner must look the same on all
     fourteen pages without any of them having to know it exists. */
  function toast(title, body, href, label) {
    // The games already carry their own `<div role="status">` for answer
    // feedback, so this needs an id of its own: querying by role would find
    // theirs first, and a second live region with the same role is two
    // announcements for one event.
    document.getElementById('sessionToast')?.remove();
    const el = document.createElement('div');
    el.id = 'sessionToast';
    el.setAttribute('role', 'status');
    el.style.cssText = [
      'position:fixed', 'right:16px', 'bottom:16px', 'z-index:9999', 'max-width:min(360px,calc(100vw - 32px))',
      'background:#fffdf8', 'color:#191c3a', 'border:2.5px solid #191c3a', 'border-radius:18px',
      'padding:14px 16px', 'box-shadow:5px 5px 0 #191c3a', 'font:600 .95rem/1.4 ui-rounded,system-ui,sans-serif',
      'display:flex', 'flex-direction:column', 'gap:8px', 'opacity:0', 'transform:translateY(8px)',
      'transition:opacity .2s ease,transform .2s ease'
    ].join(';');
    const h = document.createElement('b');
    h.style.cssText = 'font-size:1.02rem;font-weight:900;letter-spacing:-.01em';
    h.textContent = title;
    const p = document.createElement('span');
    p.textContent = body;
    el.append(h, p);
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label || 'Next →';
      a.style.cssText = 'align-self:flex-start;background:#ffb703;color:#191c3a;border:2.5px solid #191c3a;' +
        'border-radius:999px;padding:7px 14px;text-decoration:none;font-weight:900;box-shadow:0 3px 0 #191c3a';
      el.append(a);
    }
    const x = document.createElement('button');
    x.type = 'button';
    x.textContent = '✕';
    x.setAttribute('aria-label', 'Dismiss');
    x.style.cssText = 'position:absolute;top:8px;right:10px;background:none;border:0;font-size:.95rem;' +
      'cursor:pointer;color:#6d7194;font-weight:900;padding:2px 4px';
    x.addEventListener('click', () => el.remove());
    el.append(x);
    document.body.append(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    // Long enough to read, short enough not to sit over the next question.
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 220);
    }, 9000);
  }

  function announce(res) {
    const p = plan();
    const next = p.find(x => !x.done);
    if (res.done >= res.total) {
      toast('Session complete', 'All nine subjects done today. That is the whole arcade.', './session.html', 'See the day →');
    } else {
      toast('One down', `${res.done} of ${res.total} today. Next: ${next ? next.name : ''}.`,
        next ? next.href : './session.html', next ? `Play ${next.name} →` : 'See the day →');
    }
  }

  /* Watch for the summary screen appearing. The observer is on the class
     attribute only: the games repaint their DOM constantly while playing and a
     subtree observer without a filter would run on every keystroke. */
  let armed = false;
  let fired = false;

  function check() {
    if (fired || !armed || !HERE) return;
    if (!isFinished()) return;
    fired = true;
    const res = mark(HERE.id);
    if (res.changed) announce(res);
  }

  function start() {
    if (!HERE) return;
    // A deck that was already finished when the page loaded is not a
    // completion of this visit: the child may have reopened the summary.
    armed = !isFinished();
    new MutationObserver(check).observe(document.body, {
      subtree: true, attributes: true, attributeFilter: ['class', 'hidden']
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  }

  window.ArcadeSession = {
    SUBJECTS, plan, progress, mark, streak, history, dayKey, isFinished,
    get here() { return HERE || null; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
