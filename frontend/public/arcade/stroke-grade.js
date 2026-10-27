/* Telling a stroke drawn out of order from a stroke drawn wrongly.
 *
 * `calligraphy.html` compares each drawn stroke against exactly one template
 * stroke -- the one at the current position. A child who draws stroke 3 when
 * stroke 2 was asked for gets "Not that one", which is the same message they
 * get for drawing a shape that is not in the character at all. Those are
 * different mistakes and the correction is different: one is "that stroke
 * comes later", the other is "that is not this stroke".
 *
 * The character is on the grid in front of the child, so a stroke drawn early
 * is drawn in its *correct place* -- they are copying, not inventing. That is
 * what makes the two cases separable: compare the drawn stroke against every
 * template stroke, and if it matches one of them the shape is right and only
 * the position is wrong.
 *
 * `strokeScore` is the page's original test, moved here so there is one
 * implementation. `mean` is the mean distance between the two polylines
 * resampled to 16 equal-arc points, `endErr` the distance between the last
 * pair -- which is what rejects a stroke drawn backwards, since a reversed
 * stroke covers the same pixels.
 */
(function () {
  'use strict';

  const POINTS = 16;
  const MAX_MEAN = 9;
  const MAX_END = 16;
  /* Below this the two strokes point in opposite-ish directions. A correct
     stroke drawn by hand against the template is well above it; a reversed
     one is at or near -1. */
  const MIN_COS = 0;

  /* Same-arc-length resampling of both paths, so the comparison is of shape
     and not of speed or scale. */
  function resample(pts, n) {
    const A = window.ArcadeStrokeAnim;
    const total = A ? A.lengthOf(pts) : 0;
    if (total === 0 || !Array.isArray(pts) || pts.length < 2) {
      return Array.from({ length: n }, () => (pts && pts[0]) || [0, 0]);
    }
    const out = [pts[0]];
    const step = total / (n - 1);
    let acc = 0, i = 1, prev = pts[0];
    while (i < pts.length && out.length < n) {
      const seg = Math.hypot(pts[i][0] - prev[0], pts[i][1] - prev[1]);
      if (acc + seg >= step) {
        const t = (step - acc) / seg;
        const p = [prev[0] + (pts[i][0] - prev[0]) * t, prev[1] + (pts[i][1] - prev[1]) * t];
        out.push(p); prev = p; acc = 0;
      } else { acc += seg; prev = pts[i]; i++; }
    }
    while (out.length < n) out.push(pts[pts.length - 1]);
    return out;
  }

  /* The chord direction, as a unit vector. Every stroke in the bank has a
     chord of at least 6.3 units, so this is defined for all 3,086 of them --
     checked, not assumed. */
  function chord(pts) {
    if (!Array.isArray(pts) || pts.length < 2) return [0, 0];
    const dx = pts[pts.length - 1][0] - pts[0][0];
    const dy = pts[pts.length - 1][1] - pts[0][1];
    const m = Math.hypot(dx, dy);
    return m === 0 ? [0, 0] : [dx / m, dy / m];
  }

  function strokeScore(user, want) {
    if (!Array.isArray(user) || user.length < 2 || !Array.isArray(want) || want.length < 2) {
      return { mean: Infinity, endErr: Infinity, cos: -1, ok: false };
    }
    const u = resample(user, POINTS), w = resample(want, POINTS);
    let sum = 0;
    for (let i = 0; i < POINTS; i++) sum += Math.hypot(u[i][0] - w[i][0], u[i][1] - w[i][1]);
    const mean = sum / POINTS;
    const endErr = Math.hypot(u[POINTS - 1][0] - w[POINTS - 1][0],
                              u[POINTS - 1][1] - w[POINTS - 1][1]);
    /* The cosine between the two chord directions.
     *
     * The mean and endpoint terms are absolute distances in a 0-100 box, so
     * they are lenient on short strokes: a dot reversed is only a few units
     * off, and 437 of the bank's 3,086 strokes -- 14%, across 236 characters
     * -- were accepted when drawn backwards. Most of those are 点 and 横.
     *
     * This term is scale-free, so it fails a reversed dot as hard as a
     * reversed hook. A stroke drawn backwards has cos = -1. */
    const cu = chord(u), cw = chord(w);
    const cos = cu[0] * cw[0] + cu[1] * cw[1];
    return { mean, endErr, cos, ok: mean < MAX_MEAN && endErr < MAX_END && cos > MIN_COS };
  }

  /* What the child just drew, against the whole character.
   *
   * `step` is the position the page asked for. The verdicts:
   *
   *   right   -- it is the stroke that was asked for
   *   later   -- it is a stroke from further on; the shape is right, the
   *              order is not, and `at` names which one
   *   earlier -- it is a stroke already drawn; they have gone back
   *   shape   -- it matches nothing in the character
   *
   * `later` is checked before `earlier` because a child who has lost their
   * place is far more often ahead than behind, and the message should say the
   * one thing that gets them back on track.
   *
   * The nearest match is reported for `shape` too, so the page can say how
   * close the attempt was without a second pass. */
  function diagnose(user, strokes, step) {
    const list = Array.isArray(strokes) ? strokes : [];
    const scored = list.map((s, j) => ({ j, ...strokeScore(user, s.pts) }));

    const exact = scored.find(r => r.j === step && r.ok);
    if (exact) return { verdict: 'right', at: step, score: exact };

    const later = scored.filter(r => r.j > step && r.ok).sort((a, b) => a.j - b.j)[0];
    if (later) return { verdict: 'later', at: later.j, score: later };

    const earlier = scored.filter(r => r.j < step && r.ok).sort((a, b) => b.j - a.j)[0];
    if (earlier) return { verdict: 'earlier', at: earlier.j, score: earlier };

    const near = scored.slice().sort((a, b) => a.mean - b.mean)[0] || null;
    return { verdict: 'shape', at: -1, score: near };
  }

  window.ArcadeStrokeGrade = {
    POINTS, MAX_MEAN, MAX_END, MIN_COS,
    resample, chord, strokeScore, diagnose
  };
})();
