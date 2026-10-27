"""The record must survive leaving the browser.

Everything the arcade knows about a child is in eighteen `localStorage` keys,
and until now there was no way out of them. "Clear browsing data" ends a year
of progress; a replaced device ends it; two children on one machine cannot each
have a record.

`backup.js` writes those keys to one JSON file and reads them back. This gate
asserts:

  1. Export carries every record key, byte for byte, and two exports of the
     same state are identical -- the round trip is compared against itself.
  2. Diagnostics are NOT exported: `arcade.errors.v1` is a ring of crashes, not
     the child's work, and `arcade.corrupt.*` is evidence of damage. Restoring
     either onto another machine re-plants a fault.
  3. Round trip: dump, wipe, parse, restore, and every key reads exactly what
     it did. This is Gate 2's first item.
  4. Refusals. A file that is not JSON, not a backup, from a newer build, or
     carrying no records must be refused before anything is written -- a
     half-applied import is worse than a failed one.
  5. Keys outside the `arcade.` namespace, and values that are not the raw
     string a game wrote, are reported and refused. A key inside it that this
     build does not know is still the child's record -- a backup made by a
     build with a nineteenth game must restore here.
  6. Merge is the default and replace is explicit: importing an old file must
     not delete a game the child has played since, and replacing must not
     delete the stash that records the damage.
  7. A record written by the previous build (no `nextAt`, no `savedAt`) is
     carried through untouched, because the export stores the raw string the
     game wrote and never re-serialises it.
  8. The live page: the buttons exist, the download carries the record, the
     file input restores it, and a game renders from the restored record.

Claims 4-6 are the ones a plausible implementation gets wrong. The temptation
is to `JSON.parse` and `setItem` in a loop, which passes claim 3 and destroys
the record on the first malformed file.

Run:  python3 -I probes/export.py
"""
import json
import pathlib
import sys
import tempfile

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

# A representative record. The shapes are the ones the games actually write,
# including the previous build's (`arcade.arena.v1` without `nextAt`).
SEED = {
    'arcade.times.v2': {"v": 1, "best": 9, "perMode": {"1-10": 90}, "savedAt": 1700000000000},
    'arcade.bonds.v4': {"v": 2, "best": 4, "perLevel": {"1-10": 80}, "savedAt": 1700000000000},
    'arcade.arena.v1': {"v": 1, "best": 5, "skill": {"add": {"ema": 0.9, "n": 9}},
                        "seen": {}, "savedAt": 1700000000000},
    'arcade.session.v1': {"days": {"2026-10-26": {"done": {"maths": 1700000000000},
                                                  "best": {"maths": 70}}}},
    'arcade.typing.v1': {"v": 1, "bestWpm": 22, "runs": [{"wpm": 22, "acc": 96}]},
    'arcade.lastplay': {"number-bonds": 1700000000000},
    'arcade.errors.v1': {"list": [{"kind": "storage", "msg": "quota"}]},
    'arcade.corrupt.times.v2': {"at": 1700000000000, "raw": "{bad"},
    'not-arcade': "leave me alone",
}

SKIP = {'arcade.errors.v1', 'arcade.corrupt.times.v2', 'not-arcade'}
WANT = sorted(k for k in SEED if k not in SKIP)


def seed(pg):
    pg.evaluate("""(seed) => {
        localStorage.clear();
        for (const [k, v] of Object.entries(seed)) {
            localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
    }""", SEED)


def read_all(pg):
    return pg.evaluate("""() => {
        const out = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            out[k] = localStorage.getItem(k);
        }
        return out;
    }""")


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / 'session.html').as_uri())

    if not pg.evaluate("() => !!(window.ArcadeBackup && window.ArcadeBackup.parse)"):
        fails.append('backup.js did not load ArcadeBackup')
        pg.close(); b.close(); return fails

    # --- 1-3. export, wipe, import, compare -------------------------------
    seed(pg)
    before = read_all(pg)

    got = pg.evaluate("""() => {
        const B = window.ArcadeBackup;
        const d = B.dump(1700000000000);
        return { keys: Object.keys(d.data).sort(), format: d.format, v: d.v,
                 at: d.at, bytes: B.toJSON(1700000000000).length,
                 again: B.toJSON(1700000000000) };
    }""")
    print(f'== exported {len(got["keys"])} keys, {got["bytes"]} bytes, format={got["format"]} v={got["v"]}')
    print(f'== keys: {got["keys"]}')

    if got['keys'] != WANT:
        missing = [k for k in WANT if k not in got['keys']]
        extra = [k for k in got['keys'] if k not in WANT]
        fails.append(f'export key set is wrong — missing {missing}, unexpected {extra}')
    if got['format'] != 'arcade.backup' or got['v'] != 1:
        fails.append(f'export header is wrong: {got["format"]} v{got["v"]}')
    if got['at'] != 1700000000000:
        fails.append(f'export did not stamp the given time: {got["at"]}')

    # --- 2. diagnostics must not leave the machine ------------------------
    for k in ('arcade.errors.v1', 'arcade.corrupt.times.v2', 'not-arcade'):
        if k in got['keys']:
            fails.append(f'{k} was exported; it is not part of the record')

    # --- 3. the round trip -------------------------------------------------
    rt = pg.evaluate("""() => {
        const B = window.ArcadeBackup;
        const text = B.toJSON(1700000000000);
        localStorage.clear();
        const parsed = B.parse(text);
        if (!parsed.ok) return { parsed: parsed.reason };
        const r = B.restore(parsed, { replace: true });
        const after = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            after[k] = localStorage.getItem(k);
        }
        return { parsed: true, written: r.written, error: r.error, after,
                 again: B.toJSON(1700000000000) };
    }""")
    if rt.get('parsed') is not True:
        fails.append(f'the export did not parse back: {rt.get("parsed")}')
    else:
        if rt['error']:
            fails.append(f'restore reported {rt["error"]}')
        after = rt['after']
        print(f'== round trip restored {len(after)} keys')
        for k in WANT:
            if k not in after:
                fails.append(f'{k} did not survive the round trip')
            elif after[k] != before[k]:
                fails.append(f'{k} changed across the round trip:\n'
                             f'     before {before[k][:90]}\n'
                             f'     after  {after[k][:90]}')
        for k in ('arcade.errors.v1', 'arcade.corrupt.times.v2', 'not-arcade'):
            if k in after:
                fails.append(f'{k} came back through the import')
        if rt['again'] != got['again']:
            fails.append('two exports of the same restored state differ')

    # --- 4. refusals -------------------------------------------------------
    refusals = [
        ('not JSON at all', 'this is not json {'),
        ('a bare array', '[]'),
        ('a foreign JSON object', json.dumps({"format": "something.else", "data": {}})),
        ('a backup from a newer build',
         json.dumps({"format": "arcade.backup", "v": 99, "data": {"arcade.times.v2": "{}"}})),
        ('a backup with no data',
         json.dumps({"format": "arcade.backup", "v": 1})),
        ('a backup whose data is an array',
         json.dumps({"format": "arcade.backup", "v": 1, "data": []})),
        ('a backup of only diagnostics',
         json.dumps({"format": "arcade.backup", "v": 1,
                     "data": {"arcade.errors.v1": "{}", "arcade.corrupt.times.v2": "{}"}})),
    ]
    for name, text in refusals:
        got_r = pg.evaluate("""(text) => {
            const p = window.ArcadeBackup.parse(text);
            const r = window.ArcadeBackup.restore(p, { replace: true });
            return { ok: p.ok, reason: p.reason || null, written: r.written };
        }""", text)
        print(f'== refuse {name}: ok={got_r["ok"]} reason={got_r["reason"]!r} written={got_r["written"]}')
        if got_r['ok']:
            fails.append(f'{name} was accepted as a backup')
        if got_r['written']:
            fails.append(f'{name} wrote {got_r["written"]} keys anyway')

    # A refused import must not have touched the record. Re-seed, refuse, read.
    seed(pg)
    pg.evaluate("""() => {
        const B = window.ArcadeBackup;
        B.restore(B.parse('{"format":"arcade.backup","v":1,"data":{"arcade.times.v2":"{bad"}'), {replace: true});
    }""")
    survived = read_all(pg)
    if survived.get('arcade.times.v2') != json.dumps(SEED['arcade.times.v2'], separators=(',', ':')) \
            and survived.get('arcade.times.v2') != json.dumps(SEED['arcade.times.v2']):
        fails.append(f'a refused import still changed the record: {survived.get("arcade.times.v2")!r}')
    if 'arcade.bonds.v4' not in survived:
        fails.append('a refused import deleted a key it did not carry')

    # --- 5. keys, and what happens to the ones that are not keys ----------
    # The record key set is every `arcade.*` key this browser holds, not an
    # allowlist of the eighteen the current build writes. A backup made by a
    # build that ships a nineteenth game must restore on this one, and an
    # allowlist would silently drop that game's progress. What IS refused is
    # anything outside the namespace, and any value that is not the raw string
    # a game wrote -- a number here would be re-serialised into a shape no
    # game reads.
    got = pg.evaluate("""() => {
        const B = window.ArcadeBackup;
        const text = JSON.stringify({ format: 'arcade.backup', v: 1, data: {
            'arcade.times.v2': '{"v":1,"perMode":{"1-10":90}}',
            'arcade.nonesuch.v9': '{"v":1}',
            'theme': 'dark',
            'arcade.bonds.v4': 42
        }});
        localStorage.clear();
        const p = B.parse(text);
        const r = B.restore(p, { replace: true });
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
        return { ok: p.ok, skipped: p.skipped, written: r.written, keys: keys.sort() };
    }""")
    print(f'== mixed keys: skipped={got["skipped"]} written={got["written"]} stored={got["keys"]}')
    if not got['ok']:
        fails.append('a backup with one known and one unknown key was refused entirely')
    if 'theme' in got['keys']:
        fails.append('a non-arcade key was written to storage')
    if 'arcade.bonds.v4' in got['keys']:
        fails.append('a non-string record value was written to storage')
    for k in ('theme', 'arcade.bonds.v4'):
        if k not in (got['skipped'] or []):
            fails.append(f'{k} was dropped without being reported')
    for k in ('arcade.times.v2', 'arcade.nonesuch.v9'):
        if k not in got['keys']:
            fails.append(f'{k} was not restored; an unknown arcade key is still the '
                         f'child\'s record')

    # --- 6. merge keeps, replace clears -----------------------------------
    got = pg.evaluate("""() => {
        const B = window.ArcadeBackup;
        localStorage.clear();
        localStorage.setItem('arcade.times.v2', '{"v":1,"perMode":{"1-10":90}}');
        localStorage.setItem('arcade.bonds.v4', '{"v":2,"perLevel":{"1-10":80}}');
        localStorage.setItem('arcade.corrupt.bonds.v4', '{"at":1,"raw":"x"}');
        localStorage.setItem('not-arcade', 'keep');
        const file = JSON.stringify({ format: 'arcade.backup', v: 1, data: {
            'arcade.times.v2': '{"v":1,"perMode":{"1-10":40}}'
        }});
        const p = B.parse(file);
        const m = B.restore(p, {});
        const merged = { times: localStorage.getItem('arcade.times.v2'),
                         bonds: localStorage.getItem('arcade.bonds.v4') };
        const r = B.restore(p, { replace: true });
        const replaced = { times: localStorage.getItem('arcade.times.v2'),
                           bonds: localStorage.getItem('arcade.bonds.v4'),
                           stash: localStorage.getItem('arcade.corrupt.bonds.v4'),
                           other: localStorage.getItem('not-arcade') };
        return { merged, replaced, mw: m.written, rw: r.written };
    }""")
    print(f'== merge  -> {got["merged"]}')
    print(f'== replace-> {got["replaced"]}')
    if '40' not in got['merged']['times']:
        fails.append(f'merge did not apply the file: {got["merged"]["times"]}')
    if 'bonds' in str(got['merged']) and got['merged']['bonds'] is None:
        fails.append('merge deleted a key the file did not carry')
    if got['merged']['bonds'] is None:
        fails.append('merge deleted a game the file did not mention')
    if got['replaced']['bonds'] is not None:
        fails.append('replace kept a key the file did not carry')
    if got['replaced']['stash'] is None:
        fails.append('replace deleted the corrupt stash — the evidence of damage')
    if got['replaced']['other'] != 'keep':
        fails.append('replace deleted a non-arcade key')

    # --- 7. a previous build's record survives untouched -------------------
    # Written with the spacing and key order that build used. An export that
    # parsed and re-serialised would hand back a different string, and a game
    # that reads its own record by shape would not care -- but a migration
    # that keys off the text would, and nothing here has the right to reformat
    # what another writer wrote.
    old = '{ "v": 1, "best": 5, "skill": { "add": { "ema": 0.9 } }, "seen": { "x": 1 } }'
    got = pg.evaluate("""(old) => {
        const B = window.ArcadeBackup;
        localStorage.clear();
        localStorage.setItem('arcade.arena.v1', old);
        const text = B.toJSON();
        localStorage.clear();
        B.restore(B.parse(text), { replace: true });
        return { after: localStorage.getItem('arcade.arena.v1'), text };
    }""", old)
    if got['after'] != old:
        fails.append(f'a previous-build record was rewritten by the export: {got["after"]!r}')

    # --- 8. the live page --------------------------------------------------
    q = b.new_page()
    errs = []
    q.on('pageerror', lambda e: errs.append(str(e)))
    q.goto((ARCADE / 'session.html').as_uri())
    seed(q)

    if not q.evaluate("() => !!document.getElementById('exportBtn')"):
        fails.append('the session page has no export button')
    if not q.evaluate("() => !!document.getElementById('importFile')"):
        fails.append('the session page has no file input')

    with tempfile.TemporaryDirectory() as td:
        out = pathlib.Path(td) / 'backup.json'
        with q.expect_download() as dl:
            q.click('#exportBtn')
        dl.value.save_as(str(out))
        text = out.read_text()
        print(f'== downloaded {dl.value.suggested_filename} ({len(text)} bytes)')
        try:
            doc = json.loads(text)
        except ValueError as e:
            doc = None
            fails.append(f'the downloaded file is not JSON: {e}')
        if doc:
            if doc.get('format') != 'arcade.backup':
                fails.append(f'the downloaded file has no backup header: {doc.get("format")}')
            if sorted(doc.get('data', {})) != WANT:
                fails.append(f'the download carries the wrong keys: {sorted(doc.get("data", {}))}')
        if 'arcade.errors.v1' in text:
            fails.append('the downloaded file carries the error ring')

        # wipe, then import through the real file input (two taps: arm, commit)
        q.evaluate("localStorage.clear()")
        q.reload(); q.wait_for_timeout(250)
        q.set_input_files('#importFile', str(out))
        q.wait_for_timeout(300)
        armed = q.evaluate("() => document.getElementById('importBtn').dataset.armed")
        note = q.evaluate("() => (document.getElementById('backupNote') || {}).textContent || ''")
        print(f'== after first tap: armed={armed!r} note={note!r}')
        if armed != '1':
            fails.append('the import was not armed on the first tap')
        if 'record' not in note:
            fails.append(f'the first tap did not say what the file holds: {note!r}')
        if q.evaluate("() => localStorage.length"):
            fails.append('the first tap wrote to storage before the second')

        # the second tap needs the same file; the input was cleared for reuse
        q.set_input_files('#importFile', str(out))
        q.wait_for_timeout(1200)
        q.reload(); q.wait_for_timeout(300)
        restored = read_all(q)
        for k in WANT:
            if k not in restored:
                fails.append(f'{k} was not restored by the page import')
            elif restored[k] != json.dumps(SEED[k], separators=(',', ':')) \
                    and restored[k] != json.dumps(SEED[k]):
                fails.append(f'{k} changed through the page import: {restored[k][:90]}')

        # --- 8b. a game must read the restored record --------------------
        # The restore has already happened on this page. Open the hub in the
        # same context (file:// shares one storage area) and read the card the
        # record feeds. The blank control runs first, so "the card shows the
        # seeded value" cannot pass on a page that would show it anyway.
        q.goto((ARCADE / 'index.html').as_uri())
        q.wait_for_timeout(300)
        after_import = q.evaluate("""() => {
            const c = document.querySelector('[data-key="arcade.times.v2"]');
            return c ? c.querySelector('.prog .lb').textContent : null;
        }""")

        q.evaluate("localStorage.clear()")
        q.reload(); q.wait_for_timeout(300)
        blank = q.evaluate("""() => {
            const c = document.querySelector('[data-key="arcade.times.v2"]');
            return c ? c.querySelector('.prog .lb').textContent : null;
        }""")

        q.evaluate("""() => {
            localStorage.setItem('arcade.times.v2', JSON.stringify({
                v: 1, best: 9, perMode: { '1-10': 90 }, savedAt: Date.now() }));
        }""")
        q.reload(); q.wait_for_timeout(350)
        fresh = q.evaluate("""() => {
            const c = document.querySelector('[data-key="arcade.times.v2"]');
            return c ? c.querySelector('.prog .lb').textContent : null;
        }""")

        # The control is the SAME bytes, written directly rather than through
        # the file. Comparing against a record stamped `now` was the first
        # version and it compared the clock, not the import: the seeded file
        # carries `savedAt: 1700000000000`, so mastery had correctly decayed it
        # to 56% against a fresh record's 100%.
        q.evaluate("""(raw) => { localStorage.setItem('arcade.times.v2', raw); }""",
                   json.dumps(SEED['arcade.times.v2'], separators=(',', ':')))
        q.reload(); q.wait_for_timeout(350)
        direct = q.evaluate("""() => {
            const c = document.querySelector('[data-key="arcade.times.v2"]');
            return c ? c.querySelector('.prog .lb').textContent : null;
        }""")

        print(f'== hub card: imported {after_import!r} · blank {blank!r} · '
              f'seeded now {fresh!r} · same bytes direct {direct!r}')
        if not after_import or after_import == blank:
            fails.append(f'the hub did not render the imported record: {after_import!r} '
                         f'(blank reads {blank!r})')
        if after_import != direct:
            fails.append(f'the imported record renders differently from the same bytes '
                         f'written directly: {after_import!r} vs {direct!r}')
        if blank == fresh:
            fails.append('the blank control rendered the same as the seeded card')

    if errs:
        fails.append(f'session.html threw: {errs[:2]}')
    q.close()

    if exc:
        fails.append(f'session.html: pageerror {exc[:2]}')
    pg.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nEXPORT PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
