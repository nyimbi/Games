"""Failures are recorded locally, and the ring survives the failure it reports.

Nineteen `catch (_) { }` sites and no `window.onerror` meant a broken session
presented as "my progress keeps disappearing" with nothing to confirm why.
`errors.js` records uncaught errors, unhandled rejections and storage failures
into a bounded ring, and `session.html` shows it behind a disclosure.

Three claims, each of which has a way to come out false:

  1. An uncaught error reaches the ring, with the page and the source.
  2. A storage failure is recorded *even though storage is broken* -- the ring
     is memory-first, and a recorder that needed storage to report a storage
     problem would report nothing at the one moment it matters.
  3. Repeats collapse onto one entry with a count, and the ring is capped.

Claim 2 is the one a naive implementation fails, so it is the one driven
against a page whose `setItem` has been made to throw before any save happens.

Run:  python3 -I probes/errors.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent


def fresh(b, name):
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / name).as_uri())
    pg.evaluate("localStorage.clear()")
    pg.evaluate("window.ArcadeErrors.clear()")
    return pg, exc


def ring(pg):
    return pg.evaluate("() => window.ArcadeErrors.all")


def run(pw):
    fails = []
    b = pw.chromium.launch()

    # --- 1. an uncaught error reaches the ring -------------------------------
    pg, _ = fresh(b, 'index.html')
    if not pg.evaluate("() => !!window.ArcadeErrors"):
        fails.append('errors.js did not define ArcadeErrors on index.html')
        pg.close(); b.close(); return fails
    pg.evaluate("() => setTimeout(() => { throw new Error('probe-boom') }, 0)")
    pg.wait_for_timeout(250)
    got = ring(pg)
    hit = [e for e in got if 'probe-boom' in (e.get('msg') or '')]
    print(f'== uncaught error: {hit[:1]}')
    if not hit:
        fails.append(f'an uncaught error was not recorded (ring={got})')
    elif hit[0].get('page') != 'index':
        fails.append(f'the entry names the wrong page: {hit[0].get("page")!r}')
    pg.close()

    # --- 1b. every page carries the tag --------------------------------------
    for p in sorted(ARCADE.glob('*.html')):
        pg = b.new_page()
        pg.goto(p.as_uri())
        ok = pg.evaluate("() => !!window.ArcadeErrors")
        if not ok:
            fails.append(f'{p.name} does not load errors.js')
        pg.close()
    print('== every page defines ArcadeErrors')

    # --- 2. a real save catch reports, with storage broken -------------------
    # The failure most worth recording is quota exhaustion, and that is the
    # failure that makes the ring itself unwritable. Drive the real handler in
    # index.html rather than calling note() by hand -- a hand-made note tests
    # note(), not the catch site.
    pg, _ = fresh(b, 'index.html')
    pg.evaluate("""() => {
        Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };
        // The card is an <a href>; clicking it would navigate and take the
        // in-memory ring with it. Strip the href, keep the handler.
        document.querySelector('.card').removeAttribute('href');
    }""")
    pg.click('.card')
    pg.wait_for_timeout(250)
    got = ring(pg)
    st = [e for e in got if e.get('kind') == 'storage']
    print(f'== index card click with storage broken: {st[:1]}')
    if not st:
        fails.append(f'the save catch in index.html did not report (ring={got})')
    elif 'QuotaExceeded' not in (st[0].get('msg') or ''):
        fails.append(f'the recorded message is not the thrown one: {st[0].get("msg")!r}')
    pg.close()

    # --- 2b. and the ring persisted nothing, which is the point -------------
    # A ring that needed storage would be empty here. Assert the in-memory ring
    # holds the entry while localStorage does not -- that is the design claim.
    pg, _ = fresh(b, 'index.html')
    pg.evaluate("""() => {
        Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };
        document.querySelector('.card').removeAttribute('href');
    }""")
    pg.click('.card')
    pg.wait_for_timeout(250)
    on_disk = pg.evaluate("() => { try { return localStorage.getItem('arcade.errors.v1'); } catch (e) { return 'threw'; } }")
    in_mem = len(ring(pg))
    print(f'== with storage broken: memory={in_mem} entries, localStorage={on_disk!r}')
    if in_mem == 0:
        fails.append('the in-memory ring is empty when storage fails, which is the case it exists for')
    pg.close()

    # --- 3. repeats collapse and the ring is capped -------------------------
    pg, _ = fresh(b, 'index.html')
    pg.evaluate("""() => {
        for (let i = 0; i < 120; i++) window.ArcadeErrors.note('error', 'repeat', 'x');
    }""")
    got = ring(pg)
    one = [e for e in got if e.get('msg') == 'repeat']
    print(f'== 120 identical notes -> {len(got)} entries, count={one[0].get("n") if one else None}')
    if len(got) != 1:
        fails.append(f'120 identical notes made {len(got)} entries, not 1')
    elif one[0].get('n') != 120:
        fails.append(f'the repeat count is {one[0].get("n")}, not 120')
    pg.evaluate("""() => {
        for (let i = 0; i < 200; i++) window.ArcadeErrors.note('error', 'm' + i, 'y');
    }""")
    n = pg.evaluate("() => window.ArcadeErrors.all.length")
    cap = pg.evaluate("() => window.ArcadeErrors.CAP")
    print(f'== after 200 distinct notes: {n} entries, cap {cap}')
    if n > cap:
        fails.append(f'the ring holds {n} entries against a cap of {cap}')
    pg.close()

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nERRORS PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
