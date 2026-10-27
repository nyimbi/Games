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

    # --- 5b. a required field is required ---------------------------------
    # The hub reads records it did not write, so the shape check has to be able
    # to say "this is not one of ours" about a record that parses cleanly.
    got = pg.evaluate("""() => {
        const R = window.ArcadeRecord;
        localStorage.clear();
        localStorage.setItem('req', JSON.stringify({ v: 1, perGroup: {} }));
        const r = R.load('req', { version: 1, require: ['explored'] });
        const withIt = (() => {
            localStorage.setItem('req', JSON.stringify({ v: 1, explored: {} }));
            return R.load('req', { version: 1, require: ['explored'] }).status;
        })();
        return { missing: r.status, present: withIt };
    }""")
    print(f'== required field: missing -> {got["missing"]}, present -> {got["present"]}')
    if got['missing'] != 'corrupt':
        fails.append(f'a record missing a required field was accepted: {got["missing"]}')
    if got['present'] != 'ok':
        fails.append(f'a record with its required field was rejected: {got["present"]}')

    # --- 5c. version 0 accepts any schema and writes nothing ---------------
    # The hub reads all seventeen keys and knows none of their versions. If it
    # enforced one, a game bumping to v2 would show "never played" for a child
    # who has played. It must also not stash: seventeen writes per hub load
    # would churn the bound for nothing.
    got = pg.evaluate("""() => {
        const R = window.ArcadeRecord;
        localStorage.clear();
        localStorage.setItem('hub', JSON.stringify({ v: 99, best: 3 }));
        const r = R.load('hub', { version: 0, stash: false });
        let stashed = 0;
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).indexOf('arcade.corrupt.') === 0) stashed++;
        }
        // still refuses garbage -- that is what stops one bad game from
        // throwing the whole shelf
        localStorage.setItem('hub', '{bad');
        const garbage = R.load('hub', { version: 0, stash: false });
        return { status: r.status, best: r.data && r.data.best, stashed, garbage: garbage.status };
    }""")
    print(f'== hub read: v99 -> {got["status"]} best={got["best"]} stashed={got["stashed"]}, garbage -> {got["garbage"]}')
    if got['status'] != 'ok' or got['best'] != 3:
        fails.append(f'a version-0 read refused a newer record: {got}')
    if got['stashed'] != 0:
        fails.append(f'a stash:false read still stashed {got["stashed"]} entries')
    if got['garbage'] != 'corrupt':
        fails.append(f'a version-0 read accepted unparseable data: {got["garbage"]}')

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

    # --- 8. the other eleven loaders, and the hub --------------------------
    # The five maths drills were the first to be wired. A page left on the old
    # try/parse/catch would still open, still play, and still lose a corrupt
    # record -- indistinguishable from working unless something opens it.
    PAGES = {
        'french':        'arcade.french.v1',
        'chemistry':     'arcade.chemistry.v1',
        'piano':         'arcade.piano.v1',
        'calligraphy':   'arcade.calligraphy.v1',
        'spelling-bee':  'arcade.spelling.v1',
        'typing-tutor':  'arcade.typing.v1',
        'infinite-arena': 'arcade.arena.v1',
    }
    for page, key in PAGES.items():
        q = b.new_page()
        errs = []
        q.on('pageerror', lambda e: errs.append(str(e)))
        q.goto((ARCADE / f'{page}.html').as_uri())
        q.evaluate("localStorage.clear()")
        q.evaluate("(k) => localStorage.setItem(k, '{bad')", key)
        q.reload(); q.wait_for_timeout(500)
        seen = q.evaluate("() => !!document.getElementById('recordNotice')")
        kept = q.evaluate("(k) => { const s = localStorage.getItem('arcade.corrupt.' + k); return s ? JSON.parse(s).raw : null; }", key)
        if not seen:
            fails.append(f'{page}: a corrupt record produced no notice')
        if kept != '{bad':
            fails.append(f'{page}: the corrupt record was not stashed ({kept!r})')
        if errs:
            fails.append(f'{page}: threw on a corrupt record: {errs[:1]}')
        q.close()
    print(f'== eleven loaders: checked {len(PAGES)} pages')

    # The hub reads every key with version 0 and must not stash. A corrupt
    # record on one card must not blank the other sixteen.
    q = b.new_page()
    errs = []
    q.on('pageerror', lambda e: errs.append(str(e)))
    q.goto((ARCADE / 'index.html').as_uri())
    q.evaluate("localStorage.clear()")
    q.evaluate("""() => {
        localStorage.setItem('arcade.french.v1', '{bad');
        localStorage.setItem('arcade.times.v2', JSON.stringify({ v: 99, best: 4, perMode: { '1-10': 80 } }));
    }""")
    q.reload(); q.wait_for_timeout(500)
    hub = q.evaluate("""() => {
        let stashed = 0;
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).indexOf('arcade.corrupt.') === 0) stashed++;
        }
        const card = document.querySelector('[data-key="arcade.times.v2"]');
        return { stashed, errs: 0, card: card ? card.textContent.trim().slice(0, 40) : null };
    }""")
    print(f'== hub: stashed={hub["stashed"]}, corrupt french + v99 times still render')
    if hub['stashed'] != 0:
        fails.append(f'the hub stashed {hub["stashed"]} records; it is a read-only observer')
    if not hub['card']:
        fails.append('a corrupt record on one card blanked the others')
    if errs:
        fails.append(f'the hub threw with a corrupt record present: {errs[:1]}')
    q.close()

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nRECORD PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
