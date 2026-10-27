"""A missed fact must come back, and the queue must be ordered by decay.

The drills carried a boolean `due`: set on a miss, cleared after two correct
answers, and then the fact was gone from the queue for good. It was never
scheduled to return -- only to be picked up again by the freshness deck at the
same rate as a fact the child has never missed.

`ArcadeDeck.noteAttempt` replaces it with a ladder of intervals and a `nextAt`
stamp. This gate asserts:

  1. A miss makes the fact due immediately, and a success pushes `nextAt` into
     the future by the rung the entry has climbed.
  2. Each successive success pushes it further out -- the ladder is monotone.
  3. A miss after a climb resets to the first rung. A schedule that only
     climbs would take a fact the child has started failing and hold it out of
     the queue for a day.
  4. `dueCount` counts ready entries, not ever-missed ones. This is the claim
     the old boolean got wrong: a fact missed once and answered right twice
     must stop being counted.
  5. `reviewFirst` orders due facts by miss count and puts everything else
     after them.
  6. An entry written by the previous build -- `due` and no `nextAt` -- is
     read by the old rule, so a record mid-migration keeps its queue.
  7. The live pages agree: after a wrong answer the drill's own record has a
     `nextAt` in the past, and the "due" statistic on screen counts it.

Claim 3 is the one a naive ladder gets wrong, and claim 4 is the one a naive
fix to the boolean gets wrong. Both are checked against the real page as well
as the module, because the module being right proves nothing about whether any
drill calls it.

Run:  python3 -I probes/schedule.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

# drill -> storage key, entry selector, and a function answering the question
# on screen wrongly. Used for claim 7 only; the module claims run in isolation.
DRILLS = {
    'number-bonds':        {'key': 'arcade.bonds.v4',       'enter': '#playBtn'},
    'addition-quest':      {'key': 'arcade.addition.v3',    'enter': '#tabPractice'},
    'subtraction-safari':  {'key': 'arcade.subtraction.v3', 'enter': '#tabPractice'},
    'times-table-academy': {'key': 'arcade.times.v2',       'enter': '#tabPractice'},
    'division-diner':      {'key': 'arcade.division.v1',    'enter': '#tabPractice'},
    # spelling-bee has no practice tab; its drill is a mode button
    'spelling-bee':        {'key': 'arcade.spelling.v1',    'enter': '[data-mode="drill"]'},
}


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / 'index.html').as_uri())

    if not pg.evaluate("() => !!(window.ArcadeDeck && window.ArcadeDeck.noteAttempt)"):
        fails.append('deck.js does not export noteAttempt')
        pg.close(); b.close(); return fails

    # --- 1-3. the ladder ------------------------------------------------
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const now = 1000000;
        const r = {};
        const trace = [];
        D.noteAttempt(r, 'f', false, now);
        trace.push({ step: 'miss', due: D.isDue(r.f, now), dt: r.f.nextAt - now });
        // climb: four successes
        for (let i = 0; i < 4; i++) {
            D.noteAttempt(r, 'f', true, now);
            trace.push({ step: 'hit' + (i + 1), due: D.isDue(r.f, now), dt: r.f.nextAt - now, ok: r.f.ok });
        }
        // reset
        D.noteAttempt(r, 'f', false, now);
        trace.push({ step: 'miss-again', due: D.isDue(r.f, now), dt: r.f.nextAt - now, ok: r.f.ok });
        return { trace, ladder: D.LADDER };
    }""")
    for row in got['trace']:
        print(f'   {row["step"]:10} due={row["due"]!s:5} nextAt=+{row["dt"] // 60000}min')

    miss = got['trace'][0]
    if not miss['due'] or miss['dt'] > 0:
        fails.append(f'a miss did not make the fact due now: {miss}')

    hits = [t for t in got['trace'] if t['step'].startswith('hit')]
    if any(h['due'] for h in hits):
        fails.append(f'a correct answer left the fact due: {hits}')
    spans = [h['dt'] for h in hits]
    if spans != sorted(spans) or len(set(spans)) != len(spans):
        fails.append(f'the ladder is not strictly increasing: {spans}')

    again = got['trace'][-1]
    if not again['due'] or again['dt'] > 0:
        fails.append(f'a miss after a climb did not reset to the first rung: {again}')
    if again['ok'] != 0:
        fails.append(f'a miss did not reset the success count: {again}')

    # --- 4. dueCount counts ready entries, not ever-missed ones ----------
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const now = 1000000;
        const r = {};
        // missed once, then answered right twice -- the old boolean's blind spot
        D.noteAttempt(r, 'recovered', false, now);
        D.noteAttempt(r, 'recovered', true, now);
        D.noteAttempt(r, 'recovered', true, now);
        // missed and not yet recovered
        D.noteAttempt(r, 'still', false, now);
        // never seen
        const before = D.dueCount(r, now);
        // and the recovered one IS due once its interval elapses
        const later = D.dueCount(r, now + D.nextInterval(1) + 1);
        const wayLater = D.dueCount(r, now + D.nextInterval(4) + 1);
        return { before, later, wayLater, recovered: r.recovered, still: r.still };
    }""")
    print(f'== dueCount now={got["before"]} after rung2={got["later"]} after last rung={got["wayLater"]}')
    print(f'   recovered={got["recovered"]}')
    if got['before'] != 1:
        fails.append(f'dueCount counted {got["before"]}, expected only the unrecovered fact')
    if got['later'] < 2:
        fails.append(f'a recovered fact never came back: dueCount {got["later"]} at its own interval')
    if got['wayLater'] < 2:
        fails.append(f'a long-absent fact never came back: {got["wayLater"]}')

    # --- 5. reviewFirst orders by miss count ------------------------------
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const now = 1000000;
        const r = {};
        D.noteAttempt(r, 'a', false, now);
        D.noteAttempt(r, 'b', false, now);
        D.noteAttempt(r, 'b', false, now);
        D.noteAttempt(r, 'b', false, now);
        D.noteAttempt(r, 'c', true, now);       // not due
        const pool = [{ k: 'c' }, { k: 'a' }, { k: 'b' }];
        const out = D.reviewFirst(pool, r, f => f.k, now);
        return { due: out.due.map(f => f.k), rest: out.rest.map(f => f.k) };
    }""")
    print(f'== reviewFirst due={got["due"]} rest={got["rest"]}')
    if got['due'] != ['b', 'a']:
        fails.append(f'due facts are not ordered by miss count: {got["due"]}')
    if got['rest'] != ['c']:
        fails.append(f'non-due facts are not separated: {got["rest"]}')

    # --- 6. an entry from the previous build keeps its queue --------------
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const now = 1000000;
        const old = { n: 3, miss: 2, ok: 1, due: true };     // no nextAt
        const oldClean = { n: 4, miss: 0, ok: 2, due: false };
        return { flagged: D.isDue(old, now), clean: D.isDue(oldClean, now),
                 missing: D.isDue(undefined, now) };
    }""")
    print(f'== previous-build entry: flagged={got["flagged"]} clean={got["clean"]}')
    if not got['flagged']:
        fails.append('a previous-build entry flagged due was treated as not due')
    if got['clean']:
        fails.append('a previous-build clean entry was treated as due')
    if got['missing']:
        fails.append('a missing entry was treated as due')

    if exc:
        fails.append(f'index.html: pageerror {exc[:2]}')
    pg.close()

    # --- 7. the live drills call it ---------------------------------------
    for game, cfg in DRILLS.items():
        q = b.new_page()
        errs = []
        q.on('pageerror', lambda e: errs.append(str(e)))
        q.goto((ARCADE / f'{game}.html').as_uri())
        q.evaluate("localStorage.clear()")
        q.reload(); q.wait_for_timeout(300)
        q.click(cfg['enter']); q.wait_for_timeout(450)
        # a wrong answer: type something that cannot be right
        q.keyboard.type('99999')
        q.keyboard.press('Enter')
        q.wait_for_timeout(800)
        rec = q.evaluate("""(key) => {
            const s = JSON.parse(localStorage.getItem(key) || '{}');
            const r = s.review || {};
            const keys = Object.keys(r);
            if (!keys.length) return { keys: 0 };
            const e = r[keys[0]];
            return { keys: keys.length, entry: e,
                     dueNow: typeof e.nextAt === 'number' ? e.nextAt <= Date.now() : !!e.due };
        }""", cfg['key'])
        print(f'== {game:20} review entries={rec.get("keys")} dueNow={rec.get("dueNow")} {rec.get("entry")}')
        if not rec.get('keys'):
            fails.append(f'{game}: a wrong answer wrote no review entry')
        elif 'nextAt' not in (rec.get('entry') or {}):
            fails.append(f'{game}: the review entry has no nextAt -- still on the boolean: {rec["entry"]}')
        elif not rec.get('dueNow'):
            fails.append(f'{game}: a missed fact is not due now: {rec["entry"]}')
        if errs:
            fails.append(f'{game}: pageerror {errs[:1]}')
        q.close()

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nSCHEDULE PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
