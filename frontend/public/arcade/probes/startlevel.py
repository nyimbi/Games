"""The drill opens on the level the record says, not the one it was written on.

Every maths drill opened on a hard-coded level: `addition-quest` on `bond`,
`division-diner` on `1-5`, `number-bonds` on `ten`. The record already knew
better -- `perLevel` is `{level: best pct}` -- and nothing read it. A child who
has finished level 3 four times still opens on the ten-bond each morning.

`MathsGame.startLevel(levels, bucket, savedAt)` returns where to open. This gate
asserts:

  1. The first level they are not solid on, in the drill's own order. Not the
     hardest they have done, not the easiest: the next one.
  2. A slipped level comes before an untried one. Coming back after a break,
     what regressed matters more than what is new.
  3. The score is the *decayed* one. A 95% written 30 days ago is not a 95%
     today, and a startLevel that read the raw value would send a child back to
     level 3 after a month away. This is the claim that makes the feature
     F-5's rather than a lookup.
  4. An empty record opens where the page always opened. No record, no change.
  5. Everything solid opens on the last level, not the first.
  6. Live: each of the five drills opens on the level its record names, and
     the pressed button agrees with the level that started.

Claim 6 is the one a plausible implementation misses: reading the record and
then leaving the hard-coded `aria-pressed` in the markup means the page opens
on level 2 with `Make 10` still highlighted.

Run:  python3 -I probes/startlevel.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
DAY = 86400000

# The five drills, their record key, their bucket field and their level list.
# Transcribed from the pages so a change to one shows up here as a failure
# rather than being quietly followed. `division-diner` has four levels, not
# three -- `mixed` is a level with its own record, and the first version of
# this table omitted it.
DRILLS = {
    'addition-quest':     ('arcade.addition.v3',   'perLevel', ['bond', '1', '2', '3']),
    'subtraction-safari': ('arcade.subtraction.v3', 'perLevel', ['bond', '1', '2', '3']),
    'division-diner':     ('arcade.division.v1',   'perLevel', ['1-5', '6-10', '11-20', 'mixed']),
    'number-bonds':       ('arcade.bonds.v4',      'perMode',  ['ten', 'teen', 'mixed']),
    'times-table-academy': ('arcade.times.v2',     'perMode',  ['1-10', '1-20', 'tournament']),
}


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / 'addition-quest.html').as_uri())

    if not pg.evaluate("() => !!(window.MathsGame && window.MathsGame.startLevel)"):
        fails.append('maths-engine.js does not export startLevel')
        pg.close(); b.close(); return fails

    # --- 1-5. the decision, as a pure function --------------------------
    got = pg.evaluate("""(day) => {
        const S = window.MathsGame.startLevel;
        const L = ['bond', '1', '2', '3'];
        const now = Date.now();
        const out = {};

        // 1. the first level not solid on
        out.frontier = S(L, { bond: 95, 1: 90, 2: 40, 3: 0 }, now);
        // 2. a slipped level before an untried one
        out.slipped = S(L, { bond: 95, 1: 30 }, now);
        // 3. decay: 95% written 30 days ago is not 95% today
        out.stale = S(L, { bond: 95 }, now - 30 * day);
        //    and the same score written now is solid
        out.fresh = S(L, { bond: 95 }, now);
        // 4. no record at all
        out.empty = S(L, {}, now);
        out.emptyNoStamp = S(L, null, null);
        // 5. everything solid
        out.all = S(L, { bond: 95, 1: 95, 2: 95, 3: 95 }, now);
        //    and a level list that is empty must not throw
        out.none = S([], {}, now);
        return out;
    }""", DAY)

    print(f'== frontier  {got["frontier"]!r} (want "2")')
    print(f'== slipped   {got["slipped"]!r} (want "1", not "2")')
    print(f'== stale 30d {got["stale"]!r} (want "bond" — 95% has decayed below solid)')
    print(f'== fresh     {got["fresh"]!r} (want "1")')
    print(f'== empty     {got["empty"]!r} / {got["emptyNoStamp"]!r} (want "bond")')
    print(f'== all solid {got["all"]!r} (want "3")')
    print(f'== no levels {got["none"]!r} (want None)')

    if got['frontier'] != '2':
        fails.append(f'frontier: got {got["frontier"]!r}, want "2"')
    if got['slipped'] != '1':
        fails.append(f'a slipped level did not come before an untried one: {got["slipped"]!r}')
    if got['stale'] != 'bond':
        fails.append(f'a 30-day-old 95% was still read as solid: {got["stale"]!r}')
    if got['fresh'] != '1':
        fails.append(f'a fresh 95% was not read as solid: {got["fresh"]!r}')
    if got['empty'] != 'bond' or got['emptyNoStamp'] != 'bond':
        fails.append(f'an empty record did not open on the default: '
                     f'{got["empty"]!r} / {got["emptyNoStamp"]!r}')
    if got['all'] != '3':
        fails.append(f'everything solid did not open on the last level: {got["all"]!r}')
    if got['none'] is not None:
        fails.append(f'an empty level list returned {got["none"]!r}, not None')

    pg.close()

    # --- 6. live: each drill opens on its record's level ------------------
    for game, (key, bucket, levels) in DRILLS.items():
        q = b.new_page()
        errs = []
        q.on('pageerror', lambda e: errs.append(str(e)))
        q.goto((ARCADE / f'{game}.html').as_uri())
        # Record: the first two levels solid, the third not. The expected
        # start is the third.
        want = levels[2]
        q.evaluate("""([key, bucket, levels]) => {
            localStorage.clear();
            const rec = { v: 1, best: 0, review: {}, seen: {}, taught: {}, savedAt: Date.now() };
            rec[bucket] = {};
            rec[bucket][levels[0]] = 95;
            rec[bucket][levels[1]] = 95;
            rec[bucket][levels[2]] = 30;
            localStorage.setItem(key, JSON.stringify(rec));
        }""", [key, bucket, levels])
        q.goto((ARCADE / f'{game}.html').as_uri())
        q.wait_for_timeout(300)

        # Open the practice view the way a child does.
        opened = q.evaluate("""(game) => {
            const t = document.getElementById('tabPractice');
            if (t) { t.click(); return 'tabPractice'; }
            const p = document.getElementById('playBtn');
            if (p) { p.click(); return 'playBtn'; }
            return 'none';
        }""", game)
        q.wait_for_timeout(400)

        live = q.evaluate("""(game) => {
            const sel = game === 'number-bonds'
                ? '#playpanel .mode[data-mode]'
                : (game === 'division-diner' || game === 'addition-quest'
                   || game === 'subtraction-safari')
                    ? '#practice .lv[data-level]'
                    : '#practice .lv[data-mode]';
            const btns = [...document.querySelectorAll(sel)];
            const on = btns.filter(b => b.getAttribute('aria-pressed') === 'true');
            return {
                pressed: on.map(b => b.dataset.level || b.dataset.mode),
                all: btns.map(b => b.dataset.level || b.dataset.mode),
                visible: !!document.querySelector(
                    game === 'number-bonds' ? '#playpanel.show' : '#stage, #done')
            };
        }""", game)
        print(f'== {game:<20} opened via {opened:<12} pressed {live["pressed"]} '
              f'(want ["{want}"])')
        if live['pressed'] != [want]:
            fails.append(f'{game}: opened on {live["pressed"]}, want ["{want}"]')
        if errs:
            fails.append(f'{game}: pageerror {errs[:2]}')
        q.close()

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nSTART LEVEL PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
