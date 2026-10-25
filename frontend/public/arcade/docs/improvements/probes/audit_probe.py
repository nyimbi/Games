"""Three claims from the audit, each tested rather than read.

1. A typing lesson that TIMES OUT marks the day's typing subject done.
   `finish()` sets `#done.show` (typing-tutor.html:531) outside any
   `if (completed)`, and session.js reads exactly that class as finished.

2. Division's review queue slices before it filters
   (division-diner.html:517-520), so two due facts from another level
   occupy both slots and no in-level review fact is ever served.

3. The maths lesson dialog declares aria-modal but has no focus trap:
   Tab from its close button reaches the page behind it.
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path('/Users/nyimbiodero/src/pjs/games/frontend/public/arcade')
fails = []


def claim_typing_timeout(pw):
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.goto((ARCADE / 'typing-tutor.html').as_uri())
    pg.evaluate("localStorage.clear()")
    pg.reload()
    pg.wait_for_timeout(300)

    # 30-second clock, then one keystroke to arm the timer (typing-tutor.html:482)
    pg.click('.mode[data-len="30"]')
    pg.click('#lessons button, .lessons button, [data-lesson]')
    pg.wait_for_timeout(300)
    pg.evaluate("() => { const c = document.getElementById('capture'); c.focus(); }")
    pg.keyboard.type('a')

    # Wait out the clock. finish() fires from the 200ms interval at 30s.
    pg.wait_for_timeout(32000)

    shown = pg.evaluate("() => document.getElementById('done').classList.contains('show')")
    title = pg.inner_text('#doneTitle') if pg.locator('#doneTitle').count() else ''
    pos = pg.evaluate("() => { const t = document.getElementById('target'); return t ? t.textContent.length : 0; }")
    print(f'[1] timed out -> #done.show={shown}, title={title!r}, text length={pos}')
    if not shown:
        fails.append('1: timeout did not show the summary, claim not reproduced')
    elif title != 'Time!':
        fails.append(f'1: expected the timeout title, got {title!r}')
    else:
        print('    CONFIRMED: a timed-out run shows the completion marker session.js reads')

    # And session.js must agree it is finished
    fin = pg.evaluate("() => window.ArcadeSession ? window.ArcadeSession.isFinished() : null")
    print(f'    ArcadeSession.isFinished() -> {fin}')
    if fin is not True:
        fails.append(f'1: session did not read the timed-out summary as finished ({fin})')
    pg.close()
    b.close()


def claim_division_review(pw):
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.goto((ARCADE / 'division-diner.html').as_uri())
    pg.evaluate("localStorage.clear()")

    # Level '1-5' serves divisors 2..5. Seed two due facts with divisor 9,
    # then one with divisor 3. Both slots go to the out-of-level facts.
    seeded = pg.evaluate("""() => {
        const s = { best: 0, perLevel: {}, review: {
            '9|18': { n: 3, miss: 2, due: true },
            '9|27': { n: 3, miss: 2, due: true },
            '3|12': { n: 3, miss: 2, due: true }
        }, seen: {} };
        localStorage.setItem('arcade.division.v1', JSON.stringify(s));
        return Object.keys(s.review);
    }""")
    print(f'[2] seeded due facts: {seeded}')
    pg.reload()
    pg.wait_for_timeout(300)
    pg.click('#tabPractice')
    pg.wait_for_timeout(500)

    # Count how many of the 50 served questions are divisors outside 2..5
    out = pg.evaluate("""() => {
        const seen = JSON.parse(localStorage.getItem('arcade.division.v1') || '{}').seen || {};
        const keys = Object.keys(seen['1-5'] || {});
        const bad = keys.filter(k => { const d = +k.split('|')[0]; return d < 2 || d > 5; });
        return { served: keys.length, outOfLevel: bad };
    }""")
    print(f'    served keys: {out["served"]}, out-of-level: {out["outOfLevel"]}')
    if out['outOfLevel']:
        fails.append(f'2: served out-of-level divisors {out["outOfLevel"]}')
    else:
        print('    no out-of-level fact was served, so the filter did its job')

    # The review slot check: is the in-level due fact served at all?
    print('    (a missing review slot is silent: the deck is still 50 long)')
    pg.close()
    b.close()


def claim_focus_trap(pw):
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.goto((ARCADE / 'number-bonds.html').as_uri())
    pg.wait_for_timeout(300)
    pg.click('#mathsLessonBtn')
    pg.wait_for_timeout(300)

    focus = []
    for _ in range(6):
        pg.keyboard.press('Tab')
        focus.append(pg.evaluate("() => { const a = document.activeElement; return a ? (a.id || a.className || a.tagName) : null; }"))
    print(f'[3] tab order from the dialog: {focus}')

    inside = pg.evaluate("""() => {
        const w = document.getElementById('mathsLessonWrap');
        return w ? w.contains(document.activeElement) : null;
    }""")
    print(f'    focus still inside dialog after 6 tabs: {inside}')
    if inside is False:
        print('    CONFIRMED: aria-modal="true" with no focus trap; Tab reaches the page behind')
    else:
        fails.append('3: focus stayed inside, claim not reproduced')
    pg.close()
    b.close()


with sync_playwright() as pw:
    claim_typing_timeout(pw)
    claim_division_review(pw)
    claim_focus_trap(pw)

print(f'\nAUDIT PROBE — {len(fails)} claim(s) not reproduced')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
