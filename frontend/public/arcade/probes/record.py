"""A record that will not parse is kept, not overwritten.

Every loader in the arcade did the same thing: parse in a try, fall back to
defaults in the catch. That makes four situations identical -- never played,
older schema, half-written record, fine -- and the first save then overwrites
whatever was there. The corrupt case is not just invisible, it is destroyed by
opening the game.

`record.js` separates them. This gate asserts:

  1. fresh / ok / migrated / corrupt are distinguished, not collapsed.
  2. A corrupt record is copied to arcade.corrupt.<key> before any caller can
     save over it, and the copy holds the original bytes.
  3. A record from a newer schema is refused rather than guessed at.
  4. A missing field is fine; a field of the wrong type is corrupt. That is the
     line between "older record" and "half-written record".
  5. The stash is bounded, so a full disk does not double on every open.

Claim 2 is the one that matters and the one a naive fix skips -- it is easy to
report a parse failure and still lose the data on the next save.

Run:  python3 -I probes/record.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

SHAPE = "{ best: R.is.num, perMode: R.is.obj, review: R.is.obj, seen: R.is.obj }"


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / 'index.html').as_uri())

    if not pg.evaluate("() => !!window.ArcadeRecord"):
        fails.append('record.js did not define ArcadeRecord')
        pg.close(); b.close(); return fails

    def call(raw, version=1):
        # Python's None must reach JS as null, not as the identifier None.
        lit = 'null' if raw is None else repr(raw)
        return pg.evaluate(f"""() => {{
            const R = window.ArcadeRecord;
            localStorage.clear();
            if ({lit} !== null) localStorage.setItem('test.key', {lit});
            const r = R.load('test.key', {{ version: {version}, shape: {SHAPE} }});
            const stash = localStorage.getItem('arcade.corrupt.test.key');
            return {{ status: r.status, version: r.version,
                     hasData: !!r.data, stash: stash ? JSON.parse(stash).raw : null }};
        }}""")

    # --- 1. the four states are distinct ----------------------------------
    cases = [
        ('fresh',    None,                                              'fresh'),
        ('ok',       '{"v":1,"best":10,"perMode":{},"review":{},"seen":{}}', 'ok'),
        ('migrated', '{"best":5,"perMode":{},"review":{},"seen":{}}',    'migrated'),
        ('corrupt',  '{"best":',                                         'corrupt'),
    ]
    for name, raw, want in cases:
        got = call(raw)
        print(f'== {name:9} -> {got["status"]:9} (want {want})')
        if got['status'] != want:
            fails.append(f'{name}: status {got["status"]!r}, expected {want!r}')

    # --- 2. corrupt keeps the original bytes ------------------------------
    raw = '{"best": 7, "perMode": '
    got = call(raw)
    print(f'== corrupt stash: {got["stash"]!r}')
    if got['stash'] != raw:
        fails.append(f'the corrupt record was not stashed verbatim: {got["stash"]!r} != {raw!r}')

    # A wrong-shape record is stashed too -- it parses but is not ours.
    raw2 = '{"best":"not a number"}'
    got = call(raw2)
    print(f'== wrong-shape -> {got["status"]}, stash {got["stash"]!r}')
    if got['status'] != 'corrupt':
        fails.append(f'a wrong-typed field was accepted: {got["status"]}')
    if got['stash'] != raw2:
        fails.append('a wrong-shape record was not stashed')

    # --- 3. a newer schema is refused -------------------------------------
    got = call('{"v":9,"best":1}', version=1)
    print(f'== newer schema -> {got["status"]} v{got["version"]}')
    if got['status'] != 'corrupt' or got['version'] != 9:
        fails.append(f'a newer schema was not refused: {got}')

    # --- 4. missing field ok, wrong type corrupt --------------------------
    got = call('{"v":1,"best":3}')
    print(f'== missing fields -> {got["status"]}')
    if got['status'] != 'ok':
        fails.append(f'a record missing optional fields was rejected: {got["status"]}')
    got = call('{"v":1,"perMode":[]}')
    print(f'== array where object expected -> {got["status"]}')
    if got['status'] != 'corrupt':
        fails.append(f'an array where an object was expected was accepted: {got["status"]}')

    # --- 5. the stash is bounded ------------------------------------------
    n = pg.evaluate("""() => {
        const R = window.ArcadeRecord;
        localStorage.clear();
        for (let i = 0; i < 20; i++) {
            localStorage.setItem('k' + i, '{bad');
            R.load('k' + i, { version: 1 });
        }
        let c = 0;
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).indexOf('arcade.corrupt.') === 0) c++;
        }
        return c;
    }""")
    print(f'== stash entries after 20 corrupt loads: {n}')
    if n > 8:
        fails.append(f'the corrupt stash grew to {n} entries, unbounded')

    # --- 6. it never throws -----------------------------------------------
    threw = pg.evaluate("""() => {
        const R = window.ArcadeRecord;
        const weird = [null, '', '[]', 'null', '"str"', '0', '{}', '{]'];
        for (const w of weird) {
            try {
                localStorage.clear();
                if (w !== null) localStorage.setItem('w', w);
                R.load('w', { version: 1, shape: { best: R.is.num } });
            } catch (e) { return 'threw on ' + JSON.stringify(w) + ': ' + e.message; }
        }
        return null;
    }""")
    print(f'== degenerate inputs: {threw or "no throw"}')
    if threw:
        fails.append(threw)

    if exc:
        fails.append(f'pageerror: {exc[:2]}')
    pg.close()

    # --- 7. the live page reports and preserves a corrupt record ----------
    # The module distinguishing the states is worth nothing if the page still
    # saves defaults over the top. Drive number-bonds: seed a broken record,
    # open, finish a deck, and check both the notice and the stash.
    pg = b.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ARCADE / 'number-bonds.html').as_uri())
    pg.evaluate("localStorage.clear()")
    pg.evaluate("""() => localStorage.setItem('arcade.bonds.v4', '{"best": 7, "perMod')""")
    pg.reload(); pg.wait_for_timeout(400)
    notice = pg.evaluate("() => !!document.getElementById('recordNotice')")
    stashed = pg.evaluate("() => { const s = localStorage.getItem('arcade.corrupt.arcade.bonds.v4'); return s ? JSON.parse(s).raw : null; }")
    print(f'== live page: notice={notice} stash={stashed!r}')
    if not notice:
        fails.append('the corrupt record produced no notice on the page')
    if stashed != '{"best": 7, "perMod':
        fails.append(f'the live page did not stash the corrupt record: {stashed!r}')
    if errs:
        fails.append(f'number-bonds threw on a corrupt record: {errs[:1]}')

    # A fresh record must NOT produce a notice -- the control. Without it, a
    # notice that always shows would pass the check above.
    pg.evaluate("localStorage.clear()")
    pg.reload(); pg.wait_for_timeout(400)
    notice2 = pg.evaluate("() => !!document.getElementById('recordNotice')")
    print(f'== fresh record: notice={notice2}')
    if notice2:
        fails.append('a fresh record produced a corrupt-record notice')
    pg.close()

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nRECORD PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
