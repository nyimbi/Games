"""Assert a question was really answered, not just clicked.

A click that lands proves a button is wired; it does not prove the answer was
graded. The signal is what the game does next: a correct answer advances to a
new question by itself, a wrong one reveals the Next button and waits. Either
means the submit ran and the answer was judged. Neither means the page took a
keystroke and did nothing.

`markSeen` fires when a question is rendered, not when it is answered, so the
size of the freshness record is not the signal -- it is already one before the
first answer.

Run:  python3 -I probes/grading.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

GAMES = {
    'number-bonds': '#playBtn',
    'addition-quest': '#tabPractice',
    'subtraction-safari': '#tabPractice',
    'times-table-academy': '#tabPractice',
    'division-diner': '#tabPractice',
}


def run(pw):
    b = pw.chromium.launch()
    fails = []
    for game, enter in GAMES.items():
        print(f'== {game}')
        pg = b.new_page()
        exc = []
        pg.on('pageerror', lambda e: exc.append(str(e)))
        pg.goto((ARCADE / f'{game}.html').as_uri())
        pg.wait_for_timeout(250)
        pg.evaluate("localStorage.clear()")
        pg.reload()
        pg.wait_for_timeout(250)
        pg.click(enter)
        pg.wait_for_timeout(400)

        q_before = pg.inner_text('#qsay') if pg.locator('#qsay').count() else ''
        # The four-digit answer the games document; any value exercises submit.
        pg.keyboard.type('4')
        pg.keyboard.press('Enter')
        pg.wait_for_timeout(800)

        q_after = pg.inner_text('#qsay') if pg.locator('#qsay').count() else ''
        next_shown = pg.evaluate(
            "() => { const n = document.querySelector('#nextBtn'); return !!n && !n.hidden; }")
        advanced = q_after != q_before
        print(f'   {q_before[:40]!r} -> {q_after[:40]!r}  advanced={advanced} next={next_shown}')

        # A correct answer auto-advances; a wrong one shows Next. Both prove the
        # submit was graded. Doing neither means the keystroke was dropped.
        if not (advanced or next_shown):
            fails.append(f'{game}: submit was not graded')
        if advanced and q_after.strip() == '':
            fails.append(f'{game}: advanced to an empty question')
        if exc:
            fails.append(f'{game}: {exc[:1]}')
        pg.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nGRADE PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
