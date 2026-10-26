"""Every game page that ships is named by a subject, and vice versa.

`BY_GAME[FILE]` is `undefined` for a game that `SUBJECTS` does not list.
`start()` then returns early and the page silently never marks its day -- a
child plays it, the hub says it is not done, and no error is anywhere. This
checks the reference list against the table in both directions, at load.

The gate has two halves:

  the live tree, on every page, must not throw -- a check that fires on a
  correct table is not a check, it is an outage.

  a mutated copy of `session.js`, served beside the real pages, must throw for
  each of the four ways the table can be wrong. This half is the only half that
  proves the assertion has teeth; the first half passes just as well with the
  whole block deleted.

Each canary writes to a scratch copy under a temp dir and loads the page from
there, so the shipped file is never touched and there is nothing to restore.

Run:  python3 -I probes/manifest.py
"""
import pathlib
import shutil
import sys
import tempfile

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
SRC = (ARCADE / 'session.js').read_text()

# The four ways the table and the manifest can disagree, as (name, old, new).
# Each `old` must occur exactly once -- a canary whose patch does not apply is
# a canary that did not run.
CANARIES = [
    ('a page with no subject',
     "    'how-things-work'\n  ];",
     "    'how-things-work', 'new-game'\n  ];"),
    ('a subject naming a missing page',
     "{ id: 'piano', kind: 'other', name: 'Piano', note: 'Read, hear, play', games: ['piano'] }",
     "{ id: 'piano', kind: 'other', name: 'Piano', note: 'Read, hear, play', games: ['piano', 'ghost'] }"),
    ('two subjects claiming one game',
     "{ id: 'piano', kind: 'other', name: 'Piano', note: 'Read, hear, play', games: ['piano'] }",
     "{ id: 'piano', kind: 'other', name: 'Piano', note: 'Read, hear, play', games: ['piano', 'physics'] }"),
    # Adding a game to MATHS also duplicates a claim, which trips the check
    # before this one. Rename the subject id instead: every key still resolves,
    # nothing is claimed twice, and the maths check is the only thing left.
    ('the maths subject under another id',
     "{ id: 'maths', kind: 'other', name: 'Maths'",
     "{ id: 'arithmetic', kind: 'other', name: 'Maths'"),
]


def page_error(pg, url):
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto(url)
    pg.wait_for_timeout(250)
    return exc


def run(pw):
    fails = []
    b = pw.chromium.launch()

    # Half one: the shipped tree must load clean on every page.
    for p in sorted(ARCADE.glob('*.html')):
        pg = b.new_page()
        exc = page_error(pg, p.as_uri())
        if exc:
            fails.append(f'live tree: {p.name} threw {exc[0]}')
        pg.close()
    print('== live tree: no page throws')

    # Half two: each canary must make some game page throw.
    for name, old, new in CANARIES:
        if SRC.count(old) != 1:
            fails.append(f'{name}: the canary patch matched {SRC.count(old)} times, not 1')
            continue
        tmp = pathlib.Path(tempfile.mkdtemp())
        try:
            # A copy of the page and the mutated script, side by side, so the
            # page's relative `session.js` src resolves to the mutation.
            (tmp / 'session.js').write_text(SRC.replace(old, new, 1))
            (tmp / 'spelling-bee.html').write_bytes((ARCADE / 'spelling-bee.html').read_bytes())
            pg = b.new_page()
            exc = page_error(pg, (tmp / 'spelling-bee.html').as_uri())
            caught = [e for e in exc if 'session:' in e]
            print(f'   {name:38} -> {caught[:1]}')
            if not caught:
                fails.append(f'{name}: nothing threw (pageerrors={exc[:2]})')
            pg.close()
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nMANIFEST PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
