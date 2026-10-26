"""A missed fact must survive one correct answer.

Every drill retired a review fact after a single correct answer, so "review"
was a queue that forgot. The obvious model -- spelling-bee.html's `r.n >= 2`
guard -- does not work either, because `n` counts attempts: correct, correct,
miss, correct lands the miss at n=3, so the guard is already satisfied.

This gate drives the real page and reads the stored record. For each drill:
answer one question WRONG, then answer the same fact RIGHT once, and assert it
is still due. Then answer it right a second time and assert it is retired.

The second half is the control. A gate that only checks "still due after one"
passes if the fact is never retired at all, which would be a worse bug -- the
queue would grow until capReview evicted it.

Run:  python3 -I probes/review_passes.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

# drill -> storage key, enter selector, answer input, and the read-back of the
# question currently on screen as a review key.
DRILLS = {
    'division-diner': {
        'key': 'arcade.division.v1', 'enter': '#tabPractice',
        'qkey': """() => {
            const t = document.getElementById('qsay').textContent;
            const m = /(\\d+) divided by (\\d+)/.exec(t);
            return m ? `${m[2]}|${m[1]}` : null;
        }""",
        'answer': """() => {
            const t = document.getElementById('qsay').textContent;
            const m = /(\\d+) divided by (\\d+)/.exec(t);
            return String(+m[1] / +m[2]);
        }""",
    },
    'times-table-academy': {
        'key': 'arcade.times.v2', 'enter': '#tabPractice',
        'qkey': """() => {
            const t = document.getElementById('qsay').textContent;
            const m = /(\\d+) times (\\d+)/.exec(t);
            return m ? `${m[1]}|${m[2]}` : null;
        }""",
        'answer': """() => {
            const t = document.getElementById('qsay').textContent;
            const m = /(\\d+) times (\\d+)/.exec(t);
            return String(+m[1] * +m[2]);
        }""",
    },
    'addition-quest': {
        'key': 'arcade.addition.v3', 'enter': '#tabPractice',
        'qkey': """() => {
            const t = document.getElementById('qsay').textContent;
            const m = /(\\d+) plus (\\d+)/.exec(t);
            return m ? `${m[1]}|${m[2]}` : null;
        }""",
        'answer': """() => {
            const t = document.getElementById('qsay').textContent;
            const m = /(\\d+) plus (\\d+)/.exec(t);
            return String(+m[1] + +m[2]);
        }""",
    },
    'subtraction-safari': {
        'key': 'arcade.subtraction.v3', 'enter': '#tabPractice',
        'qkey': """() => {
            const t = document.getElementById('qsay').textContent;
            const m = /(\\d+) minus (\\d+)/.exec(t);
            return m ? `${m[1]}|${m[2]}` : null;
        }""",
        'answer': """() => {
            const t = document.getElementById('qsay').textContent;
            const m = /(\\d+) minus (\\d+)/.exec(t);
            return String(+m[1] - +m[2]);
        }""",
    },
    'number-bonds': {
        'key': 'arcade.bonds.v4', 'enter': '#playBtn',
        # `whole|a` -- the same key markSeen writes
        'qkey': """() => {
            const t = document.getElementById('qsay').textContent;
            let m = /(\\d+) split into (\\d+) and what/.exec(t);
            if (m) return `${m[1]}|${m[2]}`;
            m = /(\\d+) split into what and (\\d+)/.exec(t);
            if (m) return `${m[1]}|${+m[1] - +m[2]}`;
            m = /(\\d+) and (\\d+)\\. What is the whole/.exec(t);
            return m ? `${+m[1] + +m[2]}|${m[1]}` : null;
        }""",
        'answer': """() => {
            const t = document.getElementById('qsay').textContent;
            let m = /(\\d+) split into (\\d+) and what/.exec(t);
            if (m) return String(+m[1] - +m[2]);
            m = /(\\d+) split into what and (\\d+)/.exec(t);
            if (m) return String(+m[1] - +m[2]);
            m = /(\\d+) and (\\d+)\\. What is the whole/.exec(t);
            return m ? String(+m[1] + +m[2]) : '';
        }""",
    },
}


def due_entry(pg, key):
    """The single due entry in the map, whatever key shape the drill uses.

    Reading the question text and rebuilding the key was wrong for three of the
    five: addition keys `level|a|b`, bonds keys `whole|a|blank`, and neither is
    recoverable from what the drill says. Ask the record instead.
    """
    return pg.evaluate("""(key) => {
        const s = JSON.parse(localStorage.getItem(key) || '{}');
        const r = s.review || {};
        const due = Object.keys(r).filter(k => r[k] && r[k].due);
        return due.length === 1 ? [due[0], r[due[0]]] : [null, null];
    }""", key)


def reseed(pg, key, rkey, entry):
    pg.evaluate("""(args) => {
        const [key, rkey, e] = args;
        const s = JSON.parse(localStorage.getItem(key) || '{}');
        s.review = { [rkey]: e };
        localStorage.setItem(key, JSON.stringify(s));
    }""", [key, rkey, entry])


def answer(pg, wrong):
    """Type a wrong answer, submit, then advance to the same fact again."""
    ans = pg.evaluate(f"() => ({DRILLS_CURRENT['answer']})()")
    if wrong:
        # a wrong answer must differ from the right one and be non-empty
        bad = '0' if ans != '0' else '1'
        pg.keyboard.type(bad)
    else:
        pg.keyboard.type(ans)
    pg.keyboard.press('Enter')
    pg.wait_for_timeout(700)


def run(pw):
    fails = []
    global DRILLS_CURRENT
    for game, cfg in DRILLS.items():
        DRILLS_CURRENT = cfg
        print(f'== {game}')
        b = pw.chromium.launch()
        pg = b.new_page()
        exc = []
        pg.on('pageerror', lambda e: exc.append(str(e)))
        pg.goto((ARCADE / f'{game}.html').as_uri())
        pg.evaluate("localStorage.clear()")
        pg.reload()
        pg.wait_for_timeout(300)
        pg.click(cfg['enter'])
        pg.wait_for_timeout(450)

        rkey = pg.evaluate(f"() => ({cfg['qkey']})()")
        if not rkey:
            fails.append(f'{game}: could not read the question key; fixture broken')
            pg.close(); b.close(); continue
        print(f'   fact {rkey!r}')

        answer(pg, wrong=True)
        rkey, after_miss = due_entry(pg, cfg['key'])
        print(f'   after a miss:      key={rkey!r} {after_miss}')
        if not after_miss:
            fails.append(f'{game}: a miss left no due entry ({after_miss})')
            pg.close(); b.close(); continue

        # Force the same fact back on screen by seeding it as the only due fact
        # and reloading, so the "one correct answer" is on the same fact.
        reseed(pg, cfg['key'], rkey, after_miss)
        pg.reload(); pg.wait_for_timeout(300)
        pg.click(cfg['enter']); pg.wait_for_timeout(450)

        answer(pg, wrong=False)
        after_one = pg.evaluate("""(args) => {
            const [key, rkey] = args;
            const s = JSON.parse(localStorage.getItem(key) || '{}');
            return (s.review || {})[rkey] || null;
        }""", [cfg['key'], rkey])
        print(f'   after 1 correct:   {after_one}')
        if after_one is None:
            fails.append(f'{game}: the reseeded fact {rkey!r} was not served at all')
            pg.close(); b.close(); continue
        if not after_one.get('due'):
            fails.append(f'{game}: one correct answer retired the fact ({after_one})')

        # Second correct answer, same reseed dance.
        reseed(pg, cfg['key'], rkey, after_one)
        pg.reload(); pg.wait_for_timeout(300)
        pg.click(cfg['enter']); pg.wait_for_timeout(450)
        answer(pg, wrong=False)
        after_two = pg.evaluate("""(args) => {
            const [key, rkey] = args;
            const s = JSON.parse(localStorage.getItem(key) || '{}');
            return (s.review || {})[rkey] || null;
        }""", [cfg['key'], rkey])
        print(f'   after 2 correct:   {after_two}')
        if after_two and after_two.get('due'):
            fails.append(f'{game}: two correct answers did not retire the fact ({after_two})')

        if exc:
            fails.append(f'{game}: pageerror {exc[:1]}')
        pg.close(); b.close()
    return fails


DRILLS_CURRENT = None
with sync_playwright() as pw:
    fails = run(pw)
print(f'\nREVIEW PASSES PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
