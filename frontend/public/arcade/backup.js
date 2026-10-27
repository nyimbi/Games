/* The record, as one file.
 *
 * The record lives in `localStorage`, which is cleared by "clear browsing
 * data", lost when a device is replaced, and not shared between two children
 * using one machine. Everything the arcade knows about a child is in eighteen
 * keys and there is no way out of them.
 *
 * A file the child or parent saves and reloads is the only backup the offline
 * guarantee permits: a Blob and a download link, which is not a network call.
 * It is also the migration path for any future schema change -- the alternative
 * is that a bump to `arcade.bonds.v5` abandons a year of progress.
 *
 * What is deliberately NOT exported:
 *
 *   `arcade.errors.v1`  -- a diagnostic ring, not the child's work. Restoring
 *                          one machine's errors onto another is noise.
 *   `arcade.corrupt.*`  -- the stash is evidence of damage, and importing it
 *                          would re-plant the damage on a healthy machine.
 *
 * Both are skipped on export AND on import, so a file that carries them
 * anyway (edited by hand, or from a newer build) cannot smuggle them in.
 */
(function () {
  'use strict';

  const PREFIX = 'arcade.';
  const SKIP = ['arcade.errors.v1'];
  const SKIP_PREFIX = ['arcade.corrupt.'];
  const FORMAT = 'arcade.backup';
  const FORMAT_V = 1;

  function isRecordKey(k) {
    if (typeof k !== 'string' || k.indexOf(PREFIX) !== 0) return false;
    if (SKIP.indexOf(k) >= 0) return false;
    for (const p of SKIP_PREFIX) if (k.indexOf(p) === 0) return false;
    return true;
  }

  /* Every record key, sorted so two exports of the same state are byte
     identical. That matters for the one thing a backup is compared against:
     itself, after a round trip. */
  function keys() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (isRecordKey(k)) out.push(k);
      }
    } catch (_) { }
    return out.sort();
  }

  function dump(now) {
    const data = {};
    for (const k of keys()) {
      try { data[k] = localStorage.getItem(k); } catch (_) { }
    }
    return {
      format: FORMAT,
      v: FORMAT_V,
      at: now || Date.now(),
      data,
    };
  }

  function toJSON(now) {
    return JSON.stringify(dump(now), null, 2);
  }

  /* Parse and validate, without touching storage. Split from `restore` so a
     caller can show what a file contains before agreeing to replace what is
     there -- and so the probe can test the validation without writing. */
  function parse(text) {
    let obj;
    try { obj = JSON.parse(text); }
    catch (e) { return { ok: false, reason: 'not JSON: ' + (e && e.message) }; }

    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { ok: false, reason: 'not a backup object' };
    }
    if (obj.format !== FORMAT) {
      return { ok: false, reason: 'not an arcade backup (format ' + JSON.stringify(obj.format) + ')' };
    }
    if (typeof obj.v !== 'number' || obj.v > FORMAT_V) {
      return { ok: false, reason: 'backup version ' + obj.v + ' is newer than this build' };
    }
    if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
      return { ok: false, reason: 'backup has no data' };
    }

    const data = {};
    const skipped = [];
    for (const k of Object.keys(obj.data)) {
      if (!isRecordKey(k)) { skipped.push(k); continue; }
      const v = obj.data[k];
      // The export stores the raw string the game wrote, verbatim. Anything
      // else is not a record, and re-serialising it here would be a second
      // writer of a format record.js owns.
      if (typeof v !== 'string') { skipped.push(k); continue; }
      data[k] = v;
    }
    if (!Object.keys(data).length) return { ok: false, reason: 'backup contains no records' };

    return { ok: true, data, skipped, at: obj.at || null, v: obj.v };
  }

  /* Write the parsed records. `replace` clears the existing record keys first;
     without it the import merges, keeping whichever value is already present.
     Merge is the safe default: importing an old file should not silently
     delete a newer game the child has since played. */
  function restore(parsed, opts) {
    if (!parsed || !parsed.ok) return { written: 0, error: 'nothing to restore' };
    const replace = !!(opts && opts.replace);
    const written = [];
    try {
      if (replace) for (const k of keys()) localStorage.removeItem(k);
      for (const k of Object.keys(parsed.data)) {
        localStorage.setItem(k, parsed.data[k]);
        written.push(k);
      }
    } catch (e) {
      if (window.ArcadeErrors) window.ArcadeErrors.note('backup', 'restore failed: ' + (e && e.message), '');
      return { written: written.length, error: e && e.message };
    }
    return { written: written.length, error: null };
  }

  /* Hand the file to the browser. A Blob URL is local; nothing leaves the
     machine. The anchor is removed on the next tick because a detached node
     with a click handler is a leak the page never cleans up. */
  function download(filename, now) {
    const text = toJSON(now);
    const name = filename || ('arcade-backup-' + new Date(now || Date.now()).toISOString().slice(0, 10) + '.json');
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.style.display = 'none';
      document.body.append(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
      return { name, bytes: blob.size };
    } catch (e) {
      if (window.ArcadeErrors) window.ArcadeErrors.note('backup', 'export failed: ' + (e && e.message), '');
      return { name, bytes: 0, error: e && e.message };
    }
  }

  window.ArcadeBackup = { FORMAT, FORMAT_V, keys, dump, toJSON, parse, restore, download };
})();
