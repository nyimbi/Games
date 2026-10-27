/* One deck, one identity.
 *
 * `freshFirst` existed six times, `markSeen` five, `newCycle` twice, and the
 * signatures disagreed. The maths consolidation moved four of five copies and
 * left one behind -- and the copy left behind had a defaulted `keyOf` that was
 * wrong for division, which is how the division freshness key came to be the
 * shared default while division's real key is `divisor|dividend`.
 *
 * So: one implementation, and `keyOf` is a required argument with no default.
 * A default that is right for four of five callers is a default that will be
 * wrong for the fifth, and it fails silently when it is -- the queue still
 * builds, it just orders by the wrong identity. Making it required turns that
 * into a load-time TypeError on the first question rather than a wrong deck.
 *
 * The one thing the six copies disagreed on that matters:
 *
 *   `freshFirst` shuffles the stale half *before* sorting it. Array.prototype
 *   .sort is stable, so ties keep their order -- shuffling first is what makes
 *   ties random rather than insertion order. `newCycle` does not shuffle: it
 *   is the pass after the deck is exhausted, where the point is least-recently
 *   -served first and a shuffle would throw that away for the never-served
 *   facts that all tie at zero.
 *
 * Both behaviours are preserved here deliberately. Collapsing them would be a
 * tidy refactor that quietly changed how a deck repeats.
 */
(function () {
  'use strict';

  const SEEN_CAP = 900;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function requireKeyOf(keyOf, fn) {
    if (typeof keyOf !== 'function') {
      throw new TypeError('ArcadeDeck.' + fn + ': keyOf is required');
    }
  }

  /* Never-served facts first, in random order; then served facts, least
     recently served first, with ties broken by the shuffle above. */
  function freshFirst(pool, bucket, keyOf) {
    requireKeyOf(keyOf, 'freshFirst');
    bucket = bucket || {};
    const fresh = [], stale = [];
    pool.forEach(f => ((bucket[keyOf(f)] || 0) === 0 ? fresh : stale).push(f));
    shuffle(stale).sort((x, y) => (bucket[keyOf(x)] || 0) - (bucket[keyOf(y)] || 0));
    shuffle(fresh);
    return fresh.concat(stale);
  }

  /* Mark a fact served. Evicts the oldest entries when the bucket is full: an
     unbounded record in localStorage is a leak that eventually throws on write,
     and the throw lands inside a save() that swallows it.
     Evicts down to the cap, not one per call. Every one of the five copies this
     replaces deleted a single entry, which holds the line only if the bucket
     starts at or below it -- a bucket restored from an older build, or one
     whose cap was lowered, stays over forever and evicts one while adding one.
     `while`, not `if`, so the invariant is the postcondition. */
  function markSeen(bucket, key) {
    const now = Date.now();
    const had = Object.prototype.hasOwnProperty.call(bucket, key);
    if (!had) {
      while (Object.keys(bucket).length >= SEEN_CAP) {
        const oldest = Object.entries(bucket).sort((a, b) => a[1] - b[1])[0];
        if (!oldest) break;
        delete bucket[oldest[0]];
      }
    }
    bucket[key] = now;
    return bucket;
  }

  /* The pass after the deck is exhausted: least recently served first, no
     shuffle, so a fact served 400 questions ago comes back before one served
     ten questions ago. Never-served facts tie at zero and keep pool order,
     which is the order the caller built the pool in. */
  function newCycle(pool, bucket, keyOf) {
    requireKeyOf(keyOf, 'newCycle');
    bucket = bucket || {};
    return pool.slice().sort((x, y) => (bucket[keyOf(x)] || 0) - (bucket[keyOf(y)] || 0));
  }

  /* ---------- the schedule ----------
   *
   * Every drill carried a boolean `due`. It says one thing -- "this fact was
   * missed and has not been answered right REVIEW_PASSES times since" -- and
   * one bit cannot express the question a schedule asks: how long since this
   * was last served, and how well is it known.
   *
   * The consequences are concrete, not theoretical:
   *
   *   - A fact missed once and answered right twice leaves the queue forever.
   *     It is not scheduled to come back; it is only picked up again by the
   *     freshness deck, at the same rate as a fact never missed.
   *   - The queue has no ordering among due facts beyond miss count. A fact
   *     missed forty minutes ago and one missed eight times outrank by count,
   *     not by how far it has decayed.
   *   - "12 due for review" on the home screen counts facts that were missed
   *     once, last month, and answered right since. It is a number that only
   *     goes up and only ever describes the past.
   *
   * The replacement is the smallest schedule that is one: a ladder of
   * intervals, chosen by whether the last answer was right, and a `nextAt`
   * stamp. The intervals are in minutes and short because a child plays for
   * ten minutes, not ten days -- a schedule whose first step is "tomorrow"
   * never fires inside a session and is indistinguishable from no schedule.
   *
   * A miss resets to the first rung. A hit climbs one. The interval is read
   * off the entry's own `n` (successes since the last miss), so the entry is
   * self-describing: there is no separate ladder position to get out of sync.
   *
   * Deliberately NOT a streak. README.md:778 forbids anything that punishes
   * absence: `nextAt` moving into the past while the child is away is the
   * whole mechanism, and nothing about it reports lateness.
   */
  const LADDER = [2, 10, 60, 240, 1440];   // minutes

  function nextInterval(step) {
    const i = Math.max(0, Math.min(LADDER.length - 1, step | 0));
    return LADDER[i] * 60000;
  }

  /* Is this entry ready to be served? An entry written by an older build has
     no `nextAt`; it is due if it was flagged due, which is exactly the old
     behaviour, so a record mid-migration does not lose its queue. */
  function isDue(r, now) {
    if (!r) return false;
    if (typeof r.nextAt === 'number') return r.nextAt <= (now || Date.now());
    return !!r.due;
  }

  function dueCount(review, now) {
    const t = now || Date.now();
    return Object.values(review || {}).filter(r => isDue(r, t)).length;
  }

  /* Record one attempt. A miss schedules the fact for now -- the child got it
     wrong, so it belongs at the front of the next deck, which is exactly what
     the boolean did. A success climbs the ladder.
   *
   * The asymmetry is deliberate and it is the whole schedule: the ladder
   * describes how long a fact stays out of the queue once it is known, and a
   * fact just missed is not known. A miss that pushed the fact even two
   * minutes out would leave the home screen reading "0 due for review" the
   * moment the child missed something, which is both false and the opposite of
   * what a review count is for.
   *
   * `ok` is kept as the count of consecutive successes because capReview ranks
   * on it and because a record written by the previous build carries it; `due`
   * is kept in sync so the same record stays readable by both. The new fields
   * are the ones the schedule actually reads. */
  function noteAttempt(review, key, right, now) {
    const t = now || Date.now();
    const r = review[key] || (review[key] = { n: 0, miss: 0, ok: 0, nextAt: t });
    r.n = (r.n || 0) + 1;
    r.lastAt = t;
    if (right) {
      r.ok = (r.ok || 0) + 1;
      r.nextAt = t + nextInterval(r.ok - 1);
      r.due = false;
    } else {
      r.miss = (r.miss || 0) + 1;
      r.ok = 0;
      r.nextAt = t;
      r.due = true;
    }
    return r;
  }

  /* Due first, most-missed first, then the rest of the deck. */
  function reviewFirst(pool, review, keyOf, now) {
    requireKeyOf(keyOf, 'reviewFirst');
    const t = now || Date.now();
    const due = pool.filter(f => isDue(review[keyOf(f)], t))
      .sort((x, y) => ((review[keyOf(y)] || {}).miss || 0) - ((review[keyOf(x)] || {}).miss || 0));
    const seenKeys = new Set(due.map(keyOf));
    return { due, rest: pool.filter(f => !seenKeys.has(keyOf(f))) };
  }

  window.ArcadeDeck = {
    freshFirst, markSeen, newCycle, shuffle, SEEN_CAP,
    LADDER, nextInterval, isDue, dueCount, noteAttempt, reviewFirst
  };
})();
