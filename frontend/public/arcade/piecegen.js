/* More of the same, which is what practice needs.
 *
 * `piano-bank.js` ships eight pieces. Eight is enough to teach a tune and far
 * too few to practise reading from: a child who has played them twice is
 * recognising the pieces, not reading the notes.
 *
 * The eight pieces are also a *distribution*. Between them they say which
 * range is being read (G3 to C5), which pitch classes are in play (C major's
 * seven), how far a melody moves between notes (143 steps: mostly a second or
 * a repeat, occasionally a fifth), and how long a note lasts (five durations,
 * never crossing a barline). A seeded walk over those measured marginals is
 * not composition -- it is another piece from the same drawer, which is
 * exactly the material sight-reading practice wants.
 *
 * Everything here is pure and seeded, so the probe can assert the distribution
 * of a thousand generated pieces rather than listen to one.
 *
 * What the walk does *not* do: it has no phrase structure, no cadence and no
 * memory of the tune. It is a random walk, and it will occasionally produce a
 * line that goes nowhere. That is acceptable for reading practice and it is
 * the honest description -- a generator that claimed to compose would need the
 * things this does not have.
 */
(function () {
  'use strict';

  /* Deterministic PRNG. Mulberry32: 32 bits of state, one multiply and two
     shifts, and identical output in every browser. `Math.random` would make
     a generated piece impossible to reproduce, which matters when a child
     wants the one they liked back. */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Draw a key from a `{value: weight}` table, proportionally. */
  function pick(dist, rnd) {
    const keys = Object.keys(dist);
    let total = 0;
    for (const k of keys) total += dist[k];
    let x = rnd() * total;
    for (const k of keys) {
      x -= dist[k];
      if (x < 0) return +k;
    }
    return +keys[keys.length - 1];
  }

  function bump(dist, k) { dist[k] = (dist[k] || 0) + 1; }

  /* The distribution the pieces imply, measured rather than declared.
   *
   * Every field is read off the note lists, so adding a ninth piece to the
   * bank changes the generator's output without anyone editing this file. A
   * hand-written profile here would drift the first time the bank changed,
   * and nothing would fail. */
  function profile(pieces) {
    if (!Array.isArray(pieces) || !pieces.length) throw new Error('piecegen: no pieces to profile');

    const steps = {}, beats = {}, firsts = {}, totals = {};
    const pcs = {};
    let lo = Infinity, hi = -Infinity;

    for (const p of pieces) {
      if (!p || !Array.isArray(p.notes) || p.notes.length < 2) {
        throw new Error('piecegen: piece ' + (p && p.id) + ' has no notes to profile');
      }
      let beatsInPiece = 0;
      for (const n of p.notes) {
        if (!Number.isFinite(n.m) || !Number.isFinite(n.b) || n.b <= 0) {
          throw new Error('piecegen: piece ' + p.id + ' has a bad note');
        }
        lo = Math.min(lo, n.m); hi = Math.max(hi, n.m);
        pcs[((n.m % 12) + 12) % 12] = true;
        bump(beats, n.b);
        beatsInPiece += n.b;
      }
      bump(totals, beatsInPiece);
      bump(firsts, p.notes[0].m);
      for (let i = 1; i < p.notes.length; i++) bump(steps, p.notes[i].m - p.notes[i - 1].m);
    }

    return {
      pieces: pieces.length, lo, hi, pcs: Object.keys(pcs).map(Number).sort((a, b) => a - b),
      steps, beats, firsts, totals,
      notes: pieces.reduce((a, p) => a + p.notes.length, 0)
    };
  }

  /* Is this MIDI note one the pieces would have used? Range and pitch class
     both -- a note can be inside the range and outside the key, and the bank
     contains no such note. */
  function inSet(prof, m) {
    if (!(m >= prof.lo && m <= prof.hi)) return false;
    return prof.pcs.indexOf(((m % 12) + 12) % 12) >= 0;
  }

  /* The next pitch, from the current one and a drawn step.
   *
   * The naive walk -- draw a step, add it -- leaves the set constantly: the
   * steps were measured *between* notes that were already in the set, and
   * nothing makes a step from a boundary note stay inside. Three fallbacks, in
   * order, and the order is what keeps the output in the same distribution:
   *
   *   1. the drawn step, if it lands in the set (80% of steps; measured)
   *   2. the same step mirrored, which is what a melody does at the edge of a
   *      comfortable range (18%)
   *   3. a fresh draw, up to 32 tries, which keeps the step distribution
   *      intact rather than substituting a nearby one (2%)
   *
   * The nearest-feasible-step fallback was tried first and is worse: it
   * converts every out-of-set step into its nearest legal neighbour, which
   * piles weight on the small steps and takes the distribution from 0.075
   * total variation to 0.194. Rejection keeps the drawn step legal instead of
   * replacing it.
   *
   * If all three fail the note repeats. That is reachable only from a note
   * with no legal neighbour, and the profile's own pieces would have the same
   * problem, so it is a guard rather than a case.
   */
  function nextPitch(prof, m, d, rnd, steps) {
    if (inSet(prof, m + d)) return m + d;
    if (inSet(prof, m - d)) return m - d;
    for (let i = 0; i < 32; i++) {
      const e = pick(steps, rnd);
      if (inSet(prof, m + e)) return m + e;
    }
    return m;
  }

  /* The next duration: one the bank uses, that fits the beats left in the
     piece and the beats left in the bar.
   *
   * All eight pieces end their bars on the barline -- checked, 0 notes cross
   * one -- so a generated note that straddled a barline would be the one thing
   * in the material the child has never seen. The play stage draws barlines
   * from the running beat total, so it would also draw a bar it cannot fill. */
  function nextBeats(prof, rem, at, rnd) {
    const fit = {};
    let any = false;
    for (const k of Object.keys(prof.beats)) {
      const b = +k;
      if (b <= rem && (at % 4) + b <= 4) { fit[k] = prof.beats[k]; any = true; }
    }
    if (any) return pick(fit, rnd);
    // Unreachable for these pieces -- every duration is at most 4 and every
    // total is a whole number of bars -- but a bank edited to 3/4 would land
    // here, and hanging is worse than a short note.
    return Math.min(rem, 4 - (at % 4)) || rem;
  }

  /* One piece.
   *
   * `opts.steps` replaces the step distribution and nothing else. That is
   * there for the probe: the claim "the walk reproduces the bank's step
   * distribution" is only worth anything against a control that varies the
   * distribution and nothing else. */
  function generate(prof, seed, opts) {
    if (!prof || !prof.pcs || !prof.pcs.length) throw new Error('piecegen: generate needs a profile');
    const rnd = mulberry32(seed);
    const steps = (opts && opts.steps) || prof.steps;

    const total = pick(prof.totals, rnd);
    const notes = [{ m: pick(prof.firsts, rnd), b: 0 }];
    let rem = total, at = 0, m = notes[0].m;

    while (rem > 0) {
      const b = nextBeats(prof, rem, at, rnd);
      rem -= b; at += b;
      notes[notes.length - 1].b = b;
      if (rem > 0) {
        m = nextPitch(prof, m, pick(steps, rnd), rnd, steps);
        notes.push({ m, b: 0 });
      }
    }

    /* `id` is fixed, not derived from the seed. It keys the saved best score,
       and a seed-derived id would put a new entry in the record on every
       press. The eight pieces are a checklist; generated ones are practice. */
    return {
      id: 'generated', seed: seed >>> 0, title: 'Practice piece',
      note: 'Generated: the same range, the same steps, the same note lengths as the eight above.',
      timeSig: '4/4', notes
    };
  }

  window.ArcadePieceGen = { mulberry32, profile, generate, inSet };
})();
