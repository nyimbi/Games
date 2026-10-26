/* A local error ring, because nothing else here can tell you what broke.
 *
 * The arcade is offline by design: no network, no server, no telemetry leaving
 * the device. That constraint is worth keeping, and it does not mean failures
 * have to be invisible. Nineteen `catch (_) { }` sites and no `window.onerror`
 * anywhere meant a child's broken session presented as "my progress keeps
 * disappearing" with nothing to confirm the cause.
 *
 * So this records locally and stays local. An uncaught error, an unhandled
 * rejection, or an explicit `ArcadeErrors.note(...)` from a catch site lands in
 * a bounded ring in localStorage, which the session page shows behind a
 * disclosure. Nothing here can throw into a caller: a recorder that fails the
 * thing it is recording is worse than no recorder.
 *
 * Load this FIRST on every page. `window.onerror` only catches errors raised
 * after it is registered, and the engines above it in the script order parse
 * banks at load time.
 */
(function () {
  'use strict';

  const KEY = 'arcade.errors.v1';
  const CAP = 50;

  /* The page is identified by filename rather than by any of the ids in
     session.js, because this has to work on pages that do not load session.js
     and must not depend on the manifest being correct -- a broken manifest is
     one of the things it exists to report. */
  function pageName() {
    return (location.pathname.split('/').pop() || 'unknown').replace(/\.html$/, '') || 'unknown';
  }

  function read() {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (_) { return []; }
  }

  /* Memory is the source of truth for the life of the page; localStorage is a
     best-effort copy.
     This is not belt-and-braces, it is the one case that matters. The failure
     most worth recording is quota exhaustion, and that is exactly the failure
     that makes this ring unwritable -- a recorder that needs storage to report
     a storage problem reports nothing. So an in-memory ring always holds the
     session's errors and is shown on the session page; a successful write is
     what lets them survive a reload. */
  let mem = read();
  let persistFailed = false;

  function write(a) {
    try {
      localStorage.setItem(KEY, JSON.stringify(a));
      persistFailed = false;
    } catch (e) {
      // Once is enough: this fires on every subsequent save, and a console
      // flooded with the same line is the noise this module exists to remove.
      if (!persistFailed) {
        persistFailed = true;
        try { console.warn('arcade: error ring could not be persisted', e && e.message); } catch (_) { }
      }
    }
  }

  /* Newest first, so the cap evicts the oldest by construction rather than by
     a sort that has to agree with insertion order. */
  function note(kind, message, where) {
    try {
      const text = String(message == null ? 'unknown' : message).slice(0, 300);
      // The same failure firing on every animation frame would otherwise fill
      // the ring with one message and destroy its usefulness. Collapse repeats
      // onto the existing entry with a count.
      const page = pageName();
      const at = where || '';
      // Compare against what is stored, field for field. An earlier version
      // compared `e.at` against `page + ':' + where` while storing the bare
      // `where`, so the match could never fire and the collapse never happened
      // -- 120 identical notes filled the ring with 50 copies of one message.
      const hit = mem.find(e => e.page === page && e.at === at && e.msg === text);
      if (hit) {
        hit.n = (hit.n || 1) + 1;
        hit.t = Date.now();
      } else {
        mem.unshift({ page, at, kind, msg: text, t: Date.now(), n: 1 });
        if (mem.length > CAP) mem.length = CAP;
      }
      write(mem);
    } catch (_) { /* a recorder must never be the thing that throws */ }
  }

  window.ArcadeErrors = {
    note,
    get all() { return mem.slice(); },
    clear() { mem = []; write(mem); },
    CAP
  };

  /* Third argument false: these are ours, not a third party's, so they are not
     cross-origin noise. Returning false leaves the default console logging
     intact -- this records, it does not swallow. */
  window.addEventListener('error', e => {
    if (e.target && e.target !== window && e.target.tagName) {
      // A resource failed to load. The message is empty for these; the URL is
      // the only useful fact, and a missing bank file is exactly the kind of
      // failure that otherwise shows as an empty deck.
      note('resource', e.target.tagName + ' ' + (e.target.src || e.target.href || ''), 'load');
      return;
    }
    note('error', e.message, (e.filename || '').split('/').pop() + ':' + e.lineno);
  }, false);

  window.addEventListener('unhandledrejection', e => {
    const r = e.reason;
    note('rejection', r && r.message ? r.message : r, 'promise');
  });
})();
