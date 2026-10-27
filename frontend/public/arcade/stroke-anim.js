/* The order a character is written in, as a schedule.
 *
 * `calligraphy.html` grades one stroke at a time: the child draws stroke 1,
 * and only then is stroke 2 named. That teaches the order by refusing to
 * proceed out of it, which is correct and is not the same as showing it. A
 * child who does not know where stroke 3 starts has to fail to find out.
 *
 * The bank records every stroke as a polyline in a 0..100 box, so the whole
 * character can be written on screen in the order the bank gives. This module
 * is that schedule and nothing else: pure functions of the stroke list, no
 * DOM, no timers. The page renders it; a probe can read it.
 *
 * The separation is the point. An animation tested by watching it end is
 * tested by whatever the frame rate did; a schedule can be asserted exactly.
 */
(function () {
  'use strict';

  /* Milliseconds per unit of stroke length. A stroke across the whole box is
     ~100 units and wants to be readable, not fast: 14 ms/unit puts it at 1.4 s
     before clamping. Short strokes would otherwise flash by in 30 ms, which
     is a flicker rather than a stroke, so every duration is clamped. */
  const MS_PER_UNIT = 14;
  const MIN_MS = 220;
  const MAX_MS = 900;
  /* Time between the end of one stroke and the start of the next. The pause
     is where the order is read: without it the strokes run together and the
     character looks drawn rather than written. */
  const GAP = 160;

  function num(v, dflt) {
    return typeof v === 'number' && isFinite(v) && v >= 0 ? v : dflt;
  }

  function lengthOf(pts) {
    if (!Array.isArray(pts) || pts.length < 2) return 0;
    let L = 0;
    for (let i = 1; i < pts.length; i++) {
      L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    return L;
  }

  function pathD(pts) {
    if (!Array.isArray(pts) || !pts.length) return '';
    return pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  }

  /* `strokes` is the bank's `strokes` array, in writing order. The schedule
     keeps that order -- sorting or re-indexing it here would animate a
     different character from the one the page grades against.
   *
   * Returns `{ strokes: [{ i, d, len, dur, start, end }], total }`, where
   * `total` is the end of the last stroke, not including a trailing gap.
   * `i` is the index into the input, so the page can name the stroke it is
   * currently writing. */
  function timeline(strokes, opts) {
    const o = opts || {};
    const msPerUnit = num(o.msPerUnit, MS_PER_UNIT);
    const gap = num(o.gap, GAP);
    const list = Array.isArray(strokes) ? strokes : [];
    const out = [];
    let t = 0;
    list.forEach((s, i) => {
      const pts = (s && Array.isArray(s.pts)) ? s.pts : [];
      const len = lengthOf(pts);
      const dur = Math.max(MIN_MS, Math.min(MAX_MS, Math.round(len * msPerUnit)));
      out.push({ i, d: pathD(pts), len, dur, start: t, end: t + dur });
      t += dur + gap;
    });
    return { strokes: out, total: out.length ? out[out.length - 1].end : 0 };
  }

  /* Which stroke is being written at time `ms`, or -1 before the first and
     after the last. The gaps belong to the stroke they follow: at 10 ms past
     the end of stroke 2 the character has not started stroke 3, and naming
     stroke 3 would show the child a hint for a stroke that is not yet on
     screen. */
  function at(plan, ms) {
    if (!plan || !Array.isArray(plan.strokes)) return -1;
    for (const s of plan.strokes) {
      if (ms >= s.start && ms < s.end) return s.i;
    }
    return -1;
  }

  window.ArcadeStrokeAnim = {
    MS_PER_UNIT, MIN_MS, MAX_MS, GAP,
    lengthOf, pathD, timeline, at
  };
})();
