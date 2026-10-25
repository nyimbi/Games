"""Division's review queue: does slice-before-filter starve an in-level fact?

Two seeds that differ in ONE dimension -- the presence of two out-of-level
due facts -- with the same in-level due fact in both.

A: review = {'3|12': due}                     -> '3|12' must be served first
B: review = {'9|18': due, '9|27': due, '3|12': due}
   Level '1-5' serves divisors 2..5, so 9|18 and 9|27 are out of level.

division-diner.html:517-520 filters `due`, slices to 2, maps, THEN filters by
divisor. If the slice is taken first, the two out-of-level facts take both
slots and the in-level fact is never queued. The deck is still 50 long, so
nothing looks wrong.
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path('/Users/nyimbiodero/src/pjs/games/frontend/public/arcade')
fails = []


def first_question(pw, review):
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.goto((ARCADE / 'division-diner.html').as_uri())
    pg.evaluate("localStorage.clear()")
    pg.evaluate("""(review) => {
        const s = { best: 0, perLevel: {}, review, seen: {} };
        localStorage.setItem('arcade.division.v1', JSON.stringify(s));
    }""", review)
    pg.reload()
    pg.wait_for_timeout(300)
    pg.click('#tabPractice')
    pg.wait_for_timeout(400)
    said = pg.inner_text('#qsay')
    pg.close()
    b.close()
    return said


with sync_playwright() as pw:
    a = first_question(pw, {'3|12': {'n': 3, 'miss': 2, 'due': True}})
    print(f'A  one in-level due fact      -> first question: {a!r}')

    bq = first_question(pw, {
        '9|18': {'n': 3, 'miss': 2, 'due': True},
        '9|27': {'n': 3, 'miss': 2, 'due': True},
        '3|12': {'n': 3, 'miss': 2, 'due': True},
    })
    print(f'B  + two out-of-level due     -> first question: {bq!r}')

if '12 divided by 3' not in a:
    fails.append(f'A: the in-level due fact was not served first ({a!r}); '
                 'the control case itself is broken, so B proves nothing')
if '12 divided by 3' not in bq:
    print('    CONFIRMED: two out-of-level due facts starve the in-level one')
else:
    fails.append('B: the in-level due fact was still served, claim not reproduced')

print(f'\nDIVISION REVIEW PROBE — {len(fails)} problem(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
