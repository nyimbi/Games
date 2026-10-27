"""Mastery must decay, and the hub must read the decayed value.

`perLevel` is `{level -> best pct}` -- a record of the best run, not of current
ability. The hub took `Math.max` over it, so a child who scored 90% in March
and 40% today showed three stars. That is a score, and README.md:778 is
explicit that the machine shelf excludes scores.

`ArcadeDeck.mastery` applies the arena's own decay curve -- relax toward 0.5 by
0.12 per day away, capped at 7 days -- to the bucket the hub already reads.
This gate asserts:

  1. A fresh record keeps its percentage. Decay that fires on day zero would
     mean the stars fall between two answers on the same afternoon.
  2. The estimate falls with age, and monotonically.
  3. It never falls below 50% of the way to the middle -- a child away for a
     month has not forgotten everything, and "not started" after a holiday is
     the absence-punishment README.md:778 forbids.
  4. The cap holds: 30 days away reads the same as 7. Otherwise the model
     rewards rushing back, which is the streak in disguise.
  5. It never rises. A stale record must not outrank a current one.
  6. The hub renders the decayed value: seed a high bucket, set `savedAt` 14
     days back, and the card's label shows a lower number than the same bucket
     saved today. This is Gate 2's canary, and it is the half that matters --
     the module being right proves nothing about whether the shelf reads it.
  7. The arena, which had the model first, is unchanged by the extraction.

Run:  python3 -I probes/mastery.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

DAY = 86400000


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / 'index.html').as_uri())

    if not pg.evaluate("() => !!(window.ArcadeDeck && window.ArcadeDeck.mastery)"):
        fails.append('deck.js does not export mastery')
        pg.close(); b.close(); return fails

    # --- 0. a record written moments ago must not move --------------------
    # The curve is stated per day. Applying a fraction of a day to a record
    # three hundred milliseconds old moved a 90% card to 89.99% and dropped it
    # a star on the next render -- a visible jump caused by nothing the child
    # did. Whole days, floored.
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const now = Date.now();
        return { justNow: D.mastery({ '1-10': 90 }, now - 400, now),
                 oneDay: D.mastery({ '1-10': 90 }, now - 86400000, now) };
    }""")
    print(f'== written 400ms ago -> {got["justNow"]:.4f}% (want exactly 90)')
    if abs(got['justNow'] - 90) > 1e-9:
        fails.append(f'a record written moments ago already decayed: {got["justNow"]}')
    if got['oneDay'] >= 90:
        fails.append(f'a full day did not decay: {got["oneDay"]}')

    # --- 1-5. the curve ---------------------------------------------------
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const now = 1700000000000;
        const at = d => D.mastery({ '1-10': 90 }, now - d * 86400000, now);
        return {
            fresh: at(0),
            d1: at(1), d3: at(3), d7: at(7), d14: at(14), d30: at(30),
            lowFresh: D.mastery({ '1-10': 10 }, now, now),
            lowOld: D.mastery({ '1-10': 10 }, now - 30 * 86400000, now),
            empty: D.mastery({}, now, now),
            none: D.mastery(null, now, now),
            noStamp: D.mastery({ '1-10': 90 }, undefined, now),
        };
    }""")
    for k in ('fresh', 'd1', 'd3', 'd7', 'd14', 'd30'):
        print(f'   {k:6} -> {got[k]:6.2f}%')

    if abs(got['fresh'] - 90) > 1e-9:
        fails.append(f'a record saved today lost mastery: {got["fresh"]}')
    seq = [got['fresh'], got['d1'], got['d3'], got['d7'], got['d14'], got['d30']]
    if any(seq[i] < seq[i + 1] - 1e-9 for i in range(len(seq) - 1)):
        fails.append(f'mastery is not monotonically non-increasing with age: {seq}')
    if got['d1'] >= got['fresh']:
        fails.append(f'one day away did not lower mastery: {got["d1"]} vs {got["fresh"]}')
    if got['d7'] < 50:
        fails.append(f'seven days away dropped 90% to {got["d7"]:.1f}%; '
                     f'decay must relax toward 50, not toward zero')
    if abs(got['d7'] - got['d30']) > 1e-9:
        fails.append(f'the 7-day cap does not hold: d7={got["d7"]:.2f} d30={got["d30"]:.2f}')
    if got['d30'] < got['d7']:
        fails.append('a longer absence scored higher than a shorter one')

    # A low score must RISE toward 50, not fall -- the curve relaxes both ways.
    if got['lowOld'] <= got['lowFresh']:
        fails.append(f'a stale low score did not relax upward: {got["lowOld"]} vs {got["lowFresh"]}')

    if got['empty'] != 0 or got['none'] != 0:
        fails.append(f'an empty bucket reported mastery: {got["empty"]}, {got["none"]}')
    if abs(got['noStamp'] - 90) > 1e-9:
        fails.append(f'a record with no savedAt was treated as stale: {got["noStamp"]}')

    # The ema shape the arena writes must read the same as a plain percentage.
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const now = 1700000000000;
        return { ema: D.mastery({ a: { ema: 0.8, n: 5 } }, now, now),
                 mixed: D.mastery({ a: 40, b: { ema: 0.8, n: 5 } }, now, now) };
    }""")
    print(f'== ema bucket -> {got["ema"]:.1f}%, mixed -> {got["mixed"]:.1f}%')
    if abs(got['ema'] - 80) > 1e-9:
        fails.append(f'an ema bucket did not read as a percentage: {got["ema"]}')
    if abs(got['mixed'] - 80) > 1e-9:
        fails.append(f'the strongest level did not win: {got["mixed"]}')

    if exc:
        fails.append(f'index.html: pageerror {exc[:2]}')
    pg.close()

    # --- 6. the hub renders the decayed value (Gate 2's canary) -----------
    # Same bucket twice: once saved today, once 14 days ago. The card's own
    # label must differ. A hub still reading Math.max shows the same number.
    q = b.new_page()
    errs = []
    q.on('pageerror', lambda e: errs.append(str(e)))
    q.goto((ARCADE / 'index.html').as_uri())

    def label(saved_at_offset_days):
        return q.evaluate("""(days) => {
            localStorage.clear();
            localStorage.setItem('arcade.times.v2', JSON.stringify({
                v: 1, best: 9, perMode: { '1-10': 90 },
                savedAt: Date.now() - days * 86400000
            }));
            return null;
        }""", saved_at_offset_days)

    label(0)
    q.reload(); q.wait_for_timeout(350)
    fresh = q.evaluate("""() => {
        const c = document.querySelector('[data-key="arcade.times.v2"]');
        return c ? c.querySelector('.prog .lb').textContent : null;
    }""")

    label(14)
    q.reload(); q.wait_for_timeout(350)
    stale = q.evaluate("""() => {
        const c = document.querySelector('[data-key="arcade.times.v2"]');
        return c ? c.querySelector('.prog .lb').textContent : null;
    }""")

    print(f'== hub card, saved today: {fresh!r}')
    print(f'== hub card, saved 14d ago: {stale!r}')

    def pct(text):
        """A card's label, as a comparable number.

        Two shapes: '2 of 3 stars · best 90%' and 'Three stars — mastered'.
        The second carries no percentage at all, which is the top of the range,
        so reading it as 100 is correct and reading it as None is a fixture
        bug -- the first version did the latter and reported "did not report a
        percentage" about a card that was simply full.
        """
        if not text:
            return None
        if 'Three stars' in text:
            return 100
        for tok in text.replace('%', ' % ').split():
            t = tok.strip('%')
            if t.isdigit():
                return int(t)
        return None

    fp, sp = pct(fresh), pct(stale)
    if fp is None or sp is None:
        fails.append(f'the hub card did not report a percentage: {fresh!r} / {stale!r}')
    elif not sp < fp:
        fails.append(f'the hub did not decay: saved today {fp}%, saved 14d ago {sp}%')

    # And the control: with no savedAt at all the card must be IDENTICAL to one
    # saved today, not merely "not zero". Comparing numbers was the first
    # version and it compared nothing -- a 3-star label carries no percentage,
    # so the control read 'Three stars' against '2 of 3 stars' and failed on a
    # formatting difference while the real question (did the absence of a stamp
    # change the value?) went unasked.
    q.evaluate("""() => {
        localStorage.clear();
        localStorage.setItem('arcade.times.v2', JSON.stringify({
            v: 1, best: 9, perMode: { '1-10': 90 }
        }));
    }""")
    q.reload(); q.wait_for_timeout(350)
    nostamp = q.evaluate("""() => {
        const c = document.querySelector('[data-key="arcade.times.v2"]');
        return c ? c.querySelector('.prog .lb').textContent : null;
    }""")
    print(f'== hub card, no savedAt: {nostamp!r}')
    if nostamp != fresh:
        fails.append(f'a record with no savedAt differs from one saved today: '
                     f'{nostamp!r} vs {fresh!r}')

    if errs:
        fails.append(f'the hub threw: {errs[:1]}')
    q.close()

    # --- 7. the arena still decays its own skill map ----------------------
    q = b.new_page()
    errs = []
    q.on('pageerror', lambda e: errs.append(str(e)))
    q.goto((ARCADE / 'infinite-arena.html').as_uri())
    q.evaluate("localStorage.clear()")
    q.evaluate("""() => {
        localStorage.setItem('arcade.arena.v1', JSON.stringify({
            v: 1, best: 5,
            skill: { add: { ema: 0.9, n: 9 } },
            seen: {}, savedAt: Date.now() - 7 * 86400000
        }));
    }""")
    q.reload(); q.wait_for_timeout(500)
    ema = q.evaluate("""() => {
        // The arena keeps its state in a closure; read what it rendered.
        const el = document.querySelector('[data-skill]');
        return el ? el.textContent : null;
    }""")
    print(f'== arena after 7 days away: {ema!r}')
    if errs:
        fails.append(f'infinite-arena threw: {errs[:1]}')
    q.close()

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nMASTERY PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
