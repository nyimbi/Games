"""Three drills could not serve an in-level review fact. This is the gate.

Division, number-bonds and times-tables all filtered `due`, sliced to two,
mapped, and THEN filtered by level (division-diner.html:517-520 and siblings).
Two due facts from any other level took both slots before the level filter ran,
so the in-level fact never entered the queue. The deck stayed 50 long and the
score stayed out of 50, so nothing observable was wrong -- the only thing lost
was the mechanism that makes a drill adapt.

Addition and subtraction filtered by level first and were correct; they are the
model this gate checks the other three against.

Each drill gets two seeds that differ in ONE dimension: the presence of two
out-of-level due facts. The control arm (in-level fact alone) must be served
first, or the fixture is broken and the test arm proves nothing.

Run:  python3 -I probes/review_level.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
fails = []

# Each drill: storage key, how to enter practice, and the two seeds.
# `in_level` is the fact that must be served; `out_level` are two due facts the
# current level cannot ask.
DRILLS = {
    'division-diner': {
        'key': 'arcade.division.v1', 'enter': '#tabPractice',
        'control': {'3|12': {'n': 3, 'miss': 2, 'due': True}},
        'compete': {
            '9|18': {'n': 3, 'miss': 2, 'due': True},
            '9|27': {'n': 3, 'miss': 2, 'due': True},
            '3|12': {'n': 3, 'miss': 2, 'due': True},
        },
        'want': '12 divided by 3',
    },
    'number-bonds': {
        'key': 'arcade.bonds.v4', 'enter': '#playBtn',
        # mode 'ten' asks whole=10 only; a whole of 18 is out of level.
        'control': {'10|3|part': {'n': 3, 'miss': 2, 'due': True}},
        'compete': {
            '18|5|part': {'n': 3, 'miss': 2, 'due': True},
            '18|6|part': {'n': 3, 'miss': 2, 'due': True},
            '10|3|part': {'n': 3, 'miss': 2, 'due': True},
        },
        'want': '10 split into 3 and what?',
    },
    'times-table-academy': {
        'key': 'arcade.times.v2', 'enter': '#tabPractice',
        # mode '1-10' asks factors up to 10; 17 is out of level.
        'control': {'3|4': {'n': 3, 'miss': 2, 'due': True}},
        'compete': {
            '17|2': {'n': 3, 'miss': 2, 'due': True},
            '17|3': {'n': 3, 'miss': 2, 'due': True},
            '3|4': {'n': 3, 'miss': 2, 'due': True},
        },
        'want': '3 times 4',
    },
    # These two were already correct -- they filtered by level before slicing.
    # They are in the gate as controls: if a future refactor breaks them, the
    # gate should say so rather than only protecting the three that were wrong.
    'addition-quest': {
        'key': 'arcade.addition.v3', 'enter': '#tabPractice',
        # level 'bond' asks a + b = 10, so a keyed '3|9' (level 3) is out of level
        'control': {'bond|3|7': {'n': 3, 'miss': 2, 'due': True}},
        'compete': {
            '3|12|4': {'n': 3, 'miss': 2, 'due': True},
            '3|13|5': {'n': 3, 'miss': 2, 'due': True},
            'bond|3|7': {'n': 3, 'miss': 2, 'due': True},
        },
        'want': '3 plus 7',
    },
    'subtraction-safari': {
        'key': 'arcade.subtraction.v3', 'enter': '#tabPractice',
        'control': {'bond|10|3': {'n': 3, 'miss': 2, 'due': True}},
        'compete': {
            '2|45|7': {'n': 3, 'miss': 2, 'due': True},
            '2|46|8': {'n': 3, 'miss': 2, 'due': True},
            'bond|10|3': {'n': 3, 'miss': 2, 'due': True},
        },
        'want': '10 minus 3',
    },
}


def first_question(pw, cfg, review):
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / f"{cfg['file']}.html").as_uri())
    pg.evaluate("localStorage.clear()")
    pg.evaluate("""(args) => {
        const [key, review] = args;
        localStorage.setItem(key, JSON.stringify({
            best: 0, perLevel: {}, perMode: {}, review, seen: {}
        }));
    }""", [cfg['key'], review])
    pg.reload()
    pg.wait_for_timeout(300)
    pg.click(cfg['enter'])
    pg.wait_for_timeout(450)
    said = pg.inner_text('#qsay')
    pg.close()
    b.close()
    return said, exc


def run(pw):
    for game, cfg in DRILLS.items():
        cfg['file'] = game
        print(f'== {game}')
        control, exc1 = first_question(pw, cfg, cfg['control'])
        print(f'   control (in-level alone)   -> {control!r}')
        compete, exc2 = first_question(pw, cfg, cfg['compete'])
        print(f'   competing (two out-of-level) -> {compete!r}')

        if cfg['want'] not in control:
            fails.append(f'{game}: control arm did not serve {cfg["want"]!r} ({control!r}); '
                         'fixture is broken, so the competing arm proves nothing')
            continue
        if cfg['want'] not in compete:
            fails.append(f'{game}: an in-level due fact was starved by out-of-level ones '
                         f'(got {compete!r}, wanted {cfg["want"]!r})')
        for e in (exc1, exc2):
            if e:
                fails.append(f'{game}: pageerror {e[:1]}')
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nREVIEW LEVEL PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
