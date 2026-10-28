/* A deck becomes paper.
 *
 * A parent's most common request of a learning product is something to hand a
 * child away from the screen. The five maths drills each build an ordered deck
 * of fifty questions and then throw it away when the run ends; rendering that
 * list to a print stylesheet is a pure function of data the product has already
 * computed, and needs no network.
 *
 * The one rule: **the answers are never printed.** A worksheet whose answers
 * are on the same sheet, or on a second sheet in the same stack, is a worksheet
 * the child can read backwards from. The deck carries the answers; this module
 * is handed them so it can lay out the blanks, and it drops them.
 *
 * Print CSS is scoped to `body > *:not(#wsSheet)` rather than to each page's
 * own wrappers, because the five drills have five different stage machines and
 * no shared root to hide. Nothing else in the arcade has an `@media print`
 * block, so this is the only rule that can fire.
 *
 * This file is loaded only by pages that offer a worksheet. It does not touch
 * `session.js`'s completion marker and adds no stage.
 */
(function () {
  'use strict';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const CSS = `
  #wsSheet { display: none; }
  #wsSheet.on { display: block; position: fixed; inset: 0; z-index: 90;
    background: var(--paper, #fdf7ea); color: var(--ink, #191c3a);
    overflow: auto; padding: 24px 18px 90px; }
  #wsSheet .ws-bar { position: sticky; top: 0; display: flex; gap: 10px;
    justify-content: flex-end; padding: 6px 0 12px; background: inherit; }
  #wsSheet h1 { font-size: 1.35rem; margin: 6px 0 2px; }
  #wsSheet .ws-sub { font-size: .85rem; color: var(--ink-2, #4a4d6b); margin: 0 0 14px; }
  #wsSheet .ws-name { font-size: .85rem; margin: 0 0 16px; }
  #wsSheet .ws-name i { display: inline-block; min-width: 46%; border-bottom: 1.5px solid currentColor; }
  #wsSheet ol { list-style: none; margin: 0; padding: 0;
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
  #wsSheet li { display: flex; gap: 8px; align-items: baseline;
    font-size: 1.05rem; break-inside: avoid; }
  #wsSheet li .n { min-width: 1.6em; color: var(--ink-2, #4a4d6b); font-size: .8rem; }
  #wsSheet li .q { flex: 1; }
  #wsSheet li .b { display: inline-block; min-width: 3.4em;
    border-bottom: 1.5px solid currentColor; }
  @media print {
    /* Hide everything that is not the sheet, by position rather than by name:
       the five drills have five different roots and none of them is shared. */
    body > *:not(#wsSheet) { display: none !important; }
    #wsSheet { display: block !important; position: static; padding: 0; }
    #wsSheet .ws-bar { display: none !important; }
    #wsSheet ol { gap: 18px 26px; }
    @page { margin: 16mm; }
  }`;

  function injectCSS() {
    if (document.getElementById('wsCSS')) return;
    const s = document.createElement('style');
    s.id = 'wsCSS';
    s.textContent = CSS;
    document.head.append(s);
  }

  let sheet = null;

  /* `cfg` is `{title, sub, items:[{q, a}]}`. The `a` is read for the count and
     then dropped: keeping it in the DOM would put the answer one inspector
     keystroke away on a page a child is looking at, which is the same as
     printing it. */
  function render(cfg) {
    injectCSS();
    const items = (cfg.items || []).filter(x => x && x.q);
    if (!items.length) return null;

    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'wsSheet';
      document.body.append(sheet);
    }
    sheet.innerHTML = `
      <div class="ws-bar">
        <button class="btn" type="button" id="wsPrint">Print</button>
        <button class="btn ghost" type="button" id="wsClose">Close</button>
      </div>
      <h1>${esc(cfg.title || 'Worksheet')}</h1>
      <p class="ws-sub">${esc(cfg.sub || '')}</p>
      <p class="ws-name">Name <i></i> &nbsp; Date <i style="min-width:32%"></i></p>
      <ol>${items.map((x, i) =>
        `<li><span class="n">${i + 1}.</span><span class="q">${esc(x.q)} <span class="b"></span></span></li>`
      ).join('')}</ol>`;
    sheet.querySelector('#wsPrint').addEventListener('click', () => window.print());
    sheet.querySelector('#wsClose').addEventListener('click', close);
    return sheet;
  }

  function open(cfg) {
    const el = render(cfg);
    if (!el) return false;
    el.classList.add('on');
    document.body.style.overflow = 'hidden';
    el.querySelector('#wsPrint').focus();
    return true;
  }

  function close() {
    if (!sheet) return;
    sheet.classList.remove('on');
    // The markup goes with it. A closed sheet that still holds fifty prompts is
    // fifty prompts in the DOM behind a hidden class, and the next `open` would
    // have to trust that `render` overwrote all of it.
    sheet.innerHTML = '';
    document.body.style.overflow = '';
  }

  /* Mount a button into a page's own container. Kept separate from `open` so a
     page can put the button where its stage has room rather than at a fixed
     screen position -- the five drills have five different done screens. */
  function mount(host, cfg) {
    if (!host || host.querySelector('#wsOpen')) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ghost';
    b.id = 'wsOpen';
    b.textContent = 'Print a worksheet';
    b.addEventListener('click', () => open(cfg()));
    host.append(b);
    return b;
  }

  /* Turn a drill's queue into worksheet rows. The five queues are five shapes,
     so the formatting lives here rather than five times over: a page hands over
     `state.queue` and its own name, and gets `[{q, a}]` back.
     The answer is returned so `open` can count the deck; `render` never prints
     it. */
  function fromQueue(game, queue) {
    const B = '☐';
    return (queue || []).map(q => {
      if (game === 'number-bonds') {
        if (q.blank === 'whole') return { q: `${B} = ${q.a} + ${q.b}`, a: q.whole };
        if (q.blank === 'a') return { q: `${q.whole} = ${B} + ${q.b}`, a: q.a };
        return { q: `${q.whole} = ${q.a} + ${B}`, a: q.b };
      }
      if (game === 'addition-quest') return { q: `${q.a} + ${q.b} = ${B}`, a: q.sum };
      if (game === 'subtraction-safari') return { q: `${q.a} − ${q.b} = ${B}`, a: q.diff };
      if (game === 'times-table-academy') return { q: `${q.a} × ${q.b} = ${B}`, a: q.prod };
      if (game === 'division-diner') return { q: `${q.dividend} ÷ ${q.divisor} = ${B}`, a: q.quotient };
      return null;
    }).filter(Boolean);
  }

  window.ArcadeWorksheet = { open, close, mount, render, fromQueue };
})();
