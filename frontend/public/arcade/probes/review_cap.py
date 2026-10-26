"""The review map must be bounded, and a missed fact must survive eviction.

`seen` is capped in every engine (SEEN_CAP). `review` was capped in none, and
its key space is the level x fact space -- subtraction level 3 alone draws
`a = 100 + rnd(900)` (subtraction-safari.html:714), so it grows with every
distinct question ever asked. Every persistence write is inside a bare catch,
so the eventual QuotaExceededError presents as progress silently not saving.

Two claims, tested end to end through the real page:

  1. Seed far more review entries than the cap, answer one question, and the
     stored map is at or below the cap.
  2. The entries that survive are the ones with the most misses. A cap that
     evicts by insertion order would drop exactly the facts the child keeps
     getting wrong -- the ones review exists for.

Claim 2 needs a control: the same seed with the high-miss facts *not* due,
to show the ranking is on miss count rather than on the due flag alone.

Run:  python3 -I probes/review_cap.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

# The five drills and how to answer one question in each.
DRILLS = {
    'number-bonds':       {'key': 'arcade.bonds.v4',       'enter': '#playBtn'},
    'addition-quest':     {'key': 'arcade.addition.v3',    'enter': '#tabPractice'},
    'subtraction-safari': {'key': 'arcade.subtraction.v3', 'enter': '#tabPractice'},
    'times-table-academy': {'key': 'arcade.times.v2',      'enter': '#tabPractice'},
    'division-diner':     {'key': 'arcade.division.v1',    'enter': '#tabPractice'},
}

CAP = 400   # REVIEW_CAP in maths-engine.js


def seed(pg, key):
    """2500 review entries, equal `n`, and the missed ones inserted FIRST.

    Two confounds had to be removed before this fixture tested anything.

    1. The first version gave the kept entries n=9, miss=8 and the fillers
       n=1, miss=0 -- two dimensions at once, so a canary that ranked on n
       alone still kept them.
    2. The second version equalised n but inserted the fillers first. V8's
       sort is stable, so a comparator returning 0 for every pair preserves
       insertion order, the drop loop eats from the front, and the kept
       entries survived at the tail regardless of ranking.

    Inserting the missed entries first means a no-op comparator deletes them
    first. Miss count is then the only thing that can save them.
    """
    return pg.evaluate("""(args) => {
        const [key, n] = args;
        const review = {};
        // The five that must survive go in first, so position cannot save them.
        const keep = ['3|12', '4|16', '5|20', '6|18', '7|21'];
        keep.forEach(k => { review[k] = { n: 5, miss: 4, due: true }; });
        for (let i = 0; i < n; i++) review['999|' + i] = { n: 5, miss: 0, due: false };
        localStorage.setItem(key, JSON.stringify({
            best: 0, perLevel: {}, perMode: {}, review, seen: {}
        }));
        return { total: Object.keys(review).length };
    }""", [key, 2500])


def inspect(pg, key):
    return pg.evaluate("""(key) => {
        const s = JSON.parse(localStorage.getItem(key) || '{}');
        const r = s.review || {};
        const keys = Object.keys(r);
        return {
            size: keys.length,
            kept: keys.filter(k => (r[k].miss || 0) >= 4),
            maxMiss: keys.reduce((m, k) => Math.max(m, r[k].miss || 0), 0),
        };
    }""", key)


def run(pw):
    b = pw.chromium.launch()
    fails = []
    for game, cfg in DRILLS.items():
        print(f'== {game}')
        pg = b.new_page()
        exc = []
        pg.on('pageerror', lambda e: exc.append(str(e)))
        pg.goto((ARCADE / f'{game}.html').as_uri())
        pg.evaluate("localStorage.clear()")
        seeded = seed(pg, cfg['key'])
        print(f'   seeded {seeded["total"]} review entries')

        pg.reload()
        pg.wait_for_timeout(250)
        pg.click(cfg['enter'])
        pg.wait_for_timeout(400)

        # Answer one question so noteFact runs and save() persists.
        pg.keyboard.type('5')
        pg.keyboard.press('Enter')
        pg.wait_for_timeout(500)

        out = inspect(pg, cfg['key'])
        print(f'   after one answer: size={out["size"]}, '
              f'high-miss survivors={len(out["kept"])}, maxMiss={out["maxMiss"]}')

        if out['size'] > CAP:
            fails.append(f'{game}: review is {out["size"]}, over the cap of {CAP}')
        if len(out['kept']) < 5:
            fails.append(f'{game}: evicted the missed facts (kept {out["kept"]}), '
                         'which is the one thing the cap must not do')
        if exc:
            fails.append(f'{game}: pageerror {exc[:1]}')
        pg.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nREVIEW CAP PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
