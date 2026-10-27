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
     half-written or foreign record rather than an old one.

     `require` names fields whose absence is itself the fault. A record that
     has lost the one thing it is for -- a session with no `days`, a machine
     shelf with no `explored` -- is not an older version of itself, and reading
     it as empty would report "you have never played" about a record that is
     right there. */
  function checkShape(obj, shape, require) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    if (require) for (const field of require) if (!(field in obj)) return false;
    if (!shape) return true;
    for (const field of Object.keys(shape)) {
      if (!(field in obj)) continue;
      if (!shape[field](obj[field])) return false;
    }
    return true;
  }

  /* Returns { data, status, version }. Never throws: a loader that throws is a
     page that does not open.

     `version: 0` means the caller does not know the record's schema -- the hub
     reads all seventeen keys and cannot track each game's version. Refusing a
     newer record there would zero a child's stars the day any game bumps its
     version, and the failure would look like "never played". So 0 accepts
     whatever is written; it still refuses to parse garbage.

     `stash: false` is for read-only callers. The hub looking at a record is
     not the same as the game opening it, and seventeen stash writes per hub
     load would churn the bound for nothing. */
  function load(key, opts) {
    opts = opts || {};
    const version = opts.version == null ? 1 : opts.version;
    const shape = opts.shape || null;
    const doStash = opts.stash !== false;
    const put = raw => { if (doStash) stash(key, raw); };
    let raw = null;
    try { raw = localStorage.getItem(key); } catch (_) { return { data: null, status: 'corrupt', version: 0 }; }

    if (raw == null || raw === '') return { data: null, status: 'fresh', version };

    let obj;
    try { obj = JSON.parse(raw); } catch (e) {
      put(raw);
      if (window.ArcadeErrors) window.ArcadeErrors.note('record', 'unparseable: ' + (e && e.message), key);
      return { data: null, status: 'corrupt', version: 0 };
    }

    if (!checkShape(obj, shape, opts.require)) {
      put(raw);
      if (window.ArcadeErrors) window.ArcadeErrors.note('record', 'wrong shape', key);
      return { data: null, status: 'corrupt', version: 0 };
    }

    const v = typeof obj.v === 'number' ? obj.v : 0;
    if (version === 0) return { data: obj, status: v === 0 ? 'migrated' : 'ok', version: v };
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
      put(raw);
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

  /* Say it out loud, once. A caller that distinguishes the states and then
     starts fresh without a word has told the child nothing, and the next save
     writes defaults over the record anyway -- the stash would be the only copy
     left and nobody would know to look at it.

     Fixed position and role="alert" so it is announced rather than merely
     present; it stays for the session because it is a fact about the record,
     not a transient notification. */
  function notice(status) {
    if (status !== 'corrupt') return null;
    const el = document.createElement('div');
    el.id = 'recordNotice';
    el.setAttribute('role', 'alert');
    el.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9998;max-width:min(420px,calc(100vw - 32px));' +
      'background:#fff3e0;color:#191c3a;border:2.5px solid #191c3a;border-radius:16px;padding:12px 15px;' +
      'box-shadow:5px 5px 0 #191c3a;font:600 .9rem/1.45 ui-rounded,system-ui,sans-serif';
    el.append(document.createTextNode(
      'This game could not read its saved progress, so it is starting fresh. ' +
      'The old record has been kept and can be seen on the session page.'));
    (document.body || document.documentElement).append(el);
    return el;
  }

  window.ArcadeRecord = { load, notice, is, CORRUPT_PREFIX };
})();
