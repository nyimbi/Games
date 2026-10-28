/* Hearing the difference between the answer chosen and the answer that was.
 *
 * `piano-engine.js`'s `hear` mode already plays intervals and chords with the
 * staff hidden, and marks the chosen option wrong. What it cannot do is let
 * the child hear *why*: a wrong answer to "name this interval" names the right
 * interval and moves on, so the two sounds are never adjacent. Adjacency is the
 * whole skill -- a major third and a minor third are one semitone apart and
 * are learned by hearing them back to back, not by being told the name of one.
 *
 * This module turns a question into the comparison to play: the interval the
 * child named, then the interval that was actually played, on the same root.
 * It is pure -- MIDI numbers and labels, no audio -- so the probe can assert
 * the pairs rather than listen.
 *
 * The wrong answer is only reconstructible for interval and chord questions.
 * A note-naming question has no "the other answer, played" -- the child chose
 * a letter, not a sound -- so `compare` returns null and the page plays the
 * original twice instead. That is a real distinction and it is why this is not
 * a generic "play the answer" helper.
 */
(function () {
  'use strict';

  /* The semitone count of every interval name the bank asks for. Written out
     rather than derived from the array's index, because the index is the
     bank's business and this is music: a unison is 0 and an octave is 12
     whatever order the bank lists them in. */
  const SEMITONES = {
    'unison': 0, 'minor 2nd': 1, 'major 2nd': 2, 'minor 3rd': 3, 'major 3rd': 4,
    'perfect 4th': 5, 'tritone': 6, 'perfect 5th': 7, 'minor 6th': 8,
    'major 6th': 9, 'minor 7th': 10, 'major 7th': 11, 'octave': 12
  };

  const QUALITIES = {
    'major': [0, 4, 7], 'minor': [0, 3, 7], 'diminished': [0, 3, 6], 'augmented': [0, 4, 8],
    // Four-note qualities, for the one seventh-chord question the bank asks.
    'dominant seventh': [0, 4, 7, 10], 'major seventh': [0, 4, 7, 11],
    'minor seventh': [0, 3, 7, 10], 'diminished seventh': [0, 3, 6, 9]
  };

  /* A triad in a given inversion, built from its pitch classes.
   *
   * The inversion questions are not about which notes -- all three positions
   * have the same three -- but about which one is in the bass. So the
   * comparison is the same chord, rotated. `play` gives one position; the
   * root position is the rotation that starts on the lowest note, and the
   * other two follow by moving the bass up an octave. */
  const INVERSIONS = ['root position', 'first inversion', 'second inversion'];

  function rotate(notes, k) {
    const out = notes.slice();
    for (let i = 0; i < k; i++) out.push(out.shift() + 12);
    return out;
  }

  function inversionOf(play, label) {
    const k = INVERSIONS.indexOf(label);
    if (k < 0 || !Array.isArray(play) || play.length < 3) return null;

    /* The root is not the lowest note -- that is what an inversion is.
     *
     * Two earlier attempts got this wrong the same way. Sorting the played
     * notes gives root position only when the chord is already in root
     * position, and taking the index of the lowest note recovers the played
     * position only when the lowest note is the root. Both were right on root
     * position and wrong on the other two, which is why the probe checks every
     * question rather than one.
     *
     * The root is recovered from the intervals: a major triad is the rotation
     * whose steps are 4 then 3, a minor 3 then 4. Test all three rotations and
     * take the one that spells a known triad.
     */
    const sorted = play.slice().sort((a, b) => a - b);
    const TRIADS = [[4, 3], [3, 4], [3, 3], [4, 4]];   // major, minor, dim, aug
    const step = r => {
      const at = i => sorted[i % 3] + 12 * Math.floor(i / 3);
      return [at(r + 1) - at(r), at(r + 2) - at(r + 1)];
    };
    let j = -1;
    for (let r = 0; r < 3; r++) {
      const [a, b] = step(r);
      if (TRIADS.some(([x, y]) => x === a && y === b)) { j = r; break; }
    }
    if (j < 0) return null;

    /* Root position, dropped into the octave of the played chord's lowest
       note. Without this it comes out an octave above -- the rotation starts
       on the root where the root sits in the played voicing, which for a
       first inversion is the top note. */
    let root = rotate(sorted, j);
    const base = sorted[0];
    while (root[0] > base) root = root.map(m => m - 12);

    return rotate(root, k);
  }

  /* The note the question started on, and the direction it went.
   *
   * Not the lower of the two. The bank builds a descending interval as
   * `[72, 72 - i]`, so `play[0]` is the note played first and it is the
   * *upper* one. Taking the minimum -- which is what this did first -- makes
   * every descending question ascend, so the comparison plays a different
   * question from the one the child heard. Measured: 12 of the bank's 24
   * interval questions were rebuilt upwards. */
  function rootOf(play) {
    if (!Array.isArray(play) || play.length < 2) return null;
    return { root: play[0], dir: play[1] >= play[0] ? 1 : -1 };
  }

  function intervalNotes(root, semis, dir) {
    return [root, root + dir * semis];
  }

  /* What to play after a wrong answer, as a list of segments.
   *
   * `{ kind: 'interval' | 'chord' | 'repeat', a: [...], b: [...], labelA, labelB }`
   * where `a` is what the child chose and `b` is what was played. The page
   * plays `a`, then `b`, with a gap, and labels each as it sounds.
   *
   * Returns null when the question is not one where a comparison exists. */
  function compare(q, given) {
    if (!q || !given || given === q.a) return null;

    if (q.kind === 'interval' && Array.isArray(q.play) && q.play.length === 2) {
      const r = rootOf(q.play);
      const sa = SEMITONES[given], sb = SEMITONES[q.a];
      if (r === null || typeof sa !== 'number' || typeof sb !== 'number') return null;
      return {
        kind: 'interval',
        labelA: given, labelB: q.a,
        a: intervalNotes(r.root, sa, r.dir),
        b: intervalNotes(r.root, sb, r.dir)
      };
    }

    if (q.kind === 'chord' && Array.isArray(q.play) && q.play.length >= 3) {
      // Two kinds of chord question. A named chord asks for root and quality
      // ("C major", "G dominant seventh"); an inversion question asks which
      // note is in the bass, and all three answers are the same notes.
      if (INVERSIONS.indexOf(q.a) >= 0 && INVERSIONS.indexOf(given) >= 0) {
        const a = inversionOf(q.play, given), b = inversionOf(q.play, q.a);
        if (!a || !b) return null;
        return { kind: 'chord', labelA: given, labelB: q.a, a, b };
      }
      // The root is the first note played for a root-position chord question;
      // every named chord in the bank is asked in root position.
      const root = q.play[0];
      const qualityOf = label => {
        const m = /^[A-G][#b]?\s+(.+)$/.exec(String(label).trim());
        return m && QUALITIES[m[1]] ? m[1] : null;
      };
      const qa = qualityOf(given), qb = qualityOf(q.a);
      if (!qa || !qb) return null;
      return {
        kind: 'chord',
        labelA: given, labelB: q.a,
        a: QUALITIES[qa].map(s => root + s),
        b: QUALITIES[qb].map(s => root + s)
      };
    }

    return null;
  }

  /* The order to play a comparison in: the child's answer first, then the
     right one. Hearing the wrong one first is what makes the second land --
     played the other way round the child has already been given the answer
     and the first sound is just noise. */
  function segments(cmp) {
    if (!cmp) return [];
    return [
      { notes: cmp.a, label: cmp.labelA, simul: cmp.kind === 'chord' },
      { notes: cmp.b, label: cmp.labelB, simul: cmp.kind === 'chord' }
    ];
  }

  window.ArcadeEar = {
    SEMITONES, QUALITIES, INVERSIONS, rootOf, intervalNotes, inversionOf, compare, segments
  };
})();
