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

  window.ArcadeDeck = { freshFirst, markSeen, newCycle, shuffle, SEEN_CAP };
})();
