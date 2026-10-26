/* Load a record, and say what happened.
 *
 * Every one of the seventeen `arcade.*` keys was read the same way:
 *
 *     try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); ... }
 *     catch (_) {}
 *
 * which cannot tell four different situations apart. A child who has never
 * played, a child whose record was written by an older build, a child whose
 * record is half-written because the tab closed mid-save, and a child whose
 * record is fine all arrive at the same defaults. Then the first save
 * overwrites whatever was there, so the corrupt case is not just invisible --
 * it is destroyed by the act of opening the game.
 *
 * This module makes the distinction explicit and hands it back to the caller:
 *
 *   fresh    nothing stored; this is a new record
 *   ok       parsed and passed the shape check
 *   migrated parsed, but carried no version or an older one
 *   corrupt  did not parse, or parsed into the wrong shape
 *
 * On `corrupt` the raw string is copied to `arcade.corrupt.<key>` before the
 * caller can save over it, and the event goes to ArcadeErrors. That copy is the
 * whole point: it turns "my progress vanished" into something a parent can read
 * off the session page and something a later version could attempt to repair.
 *
 * The version is a field in the record, not the suffix of the key. The key
 * suffix (`arcade.bonds.v4`) is the *schema generation*: bumping it abandons
 * the old record entirely, which is the right move for an incompatible change
 * and the wrong one for adding a field. The field is what lets a record say
 * what it is.
 */
(function () {
  'use strict';

  const CORRUPT_PREFIX = 'arcade.corrupt.';
  const CORRUPT_CAP = 8;

  /* Keep the stash bounded. A child whose storage is full would otherwise
     double every corrupt record on every open, and the copy is only useful
     until someone reads it. */
  function stash(key, raw) {
    try {
      const mine = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(CORRUPT_PREFIX) === 0) mine.push(k);
      }
      if (mine.length >= CORRUPT_CAP) {
        // Oldest first by the timestamp we suffix, falling back to name.
        mine.sort();
        localStorage.removeItem(mine[0]);
      }
      localStorage.setItem(CORRUPT_PREFIX + key, JSON.stringify({ at: Date.now(), raw: String(raw).slice(0, 20000) }));
    } catch (_) { /* the stash is best-effort; never block the load */ }
  }

  /* `shape` is a map of field -> predicate. Missing fields are allowed (an
     older record legitimately lacks a newer one); a present field of the wrong
     type is what makes a record corrupt, because that is the signature of a
     half-written or foreign record rather than an old one. */
  function checkShape(obj, shape) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    if (!shape) return true;
    for (const field of Object.keys(shape)) {
      if (!(field in obj)) continue;
      if (!shape[field](obj[field])) return false;
    }
    return true;
  }

  /* Returns { data, status, version }. Never throws: a loader that throws is a
     page that does not open. */
  function load(key, opts) {
    opts = opts || {};
    const version = opts.version || 1;
    const shape = opts.shape || null;
    let raw = null;
    try { raw = localStorage.getItem(key); } catch (_) { return { data: null, status: 'corrupt', version: 0 }; }

    if (raw == null || raw === '') return { data: null, status: 'fresh', version };

    let obj;
    try { obj = JSON.parse(raw); } catch (e) {
      stash(key, raw);
      if (window.ArcadeErrors) window.ArcadeErrors.note('record', 'unparseable: ' + (e && e.message), key);
      return { data: null, status: 'corrupt', version: 0 };
    }

    if (!checkShape(obj, shape)) {
      stash(key, raw);
      if (window.ArcadeErrors) window.ArcadeErrors.note('record', 'wrong shape', key);
      return { data: null, status: 'corrupt', version: 0 };
    }

    const v = typeof obj.v === 'number' ? obj.v : 0;
    if (v === 0 || v < version) {
      // Readable, just older. The caller uses it; the next save stamps the
      // current version. Not an error -- a record from last month is the
      // normal case, not a fault.
      if (window.ArcadeErrors) window.ArcadeErrors.note('record', 'migrated from v' + v, key);
      return { data: obj, status: 'migrated', version: v };
    }
    if (v > version) {
      // Written by a newer build than this page. Using it would mean guessing
      // at fields we do not know; refusing is the honest move, and the stash
      // keeps it recoverable.
      stash(key, raw);
      if (window.ArcadeErrors) window.ArcadeErrors.note('record', 'newer schema v' + v, key);
      return { data: null, status: 'corrupt', version: v };
    }
    return { data: obj, status: 'ok', version: v };
  }

  /* The shape predicates, so callers do not each invent their own. */
  const is = {
    num: x => typeof x === 'number' && isFinite(x),
    str: x => typeof x === 'string',
    obj: x => !!x && typeof x === 'object' && !Array.isArray(x),
    arr: x => Array.isArray(x),
  };

  window.ArcadeRecord = { load, is, CORRUPT_PREFIX };
})();
