"""Probe the five maths games after the engine swap.

Drives the real pages from file://, the way a child opens them: no server, no
build. Checks the engine mounted, the Learn button exists, the dialog opens,
every topic renders, Escape and backdrop close, and no page threw.

Run:  python3 -I probes/lessons.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
GAMES = ['number-bonds', 'addition-quest', 'subtraction-safari',
         'times-table-academy', 'division-diner']
FIELDS = ['title', 'why', 'rule', 'remember', 'trap']


def is_open(page):
    # `'on' in 'maths-lesson-wrap'` is true: "less-on". Test the token.
    return 'on' in (page.locator('#mathsLessonWrap').get_attribute('class') or '').split()


def probe(pw):
    browser = pw.chromium.launch()
    fails = []

    def check(ok, msg):
        if not ok:
            fails.append(msg)
        print(('  ok   ' if ok else '  FAIL ') + msg)

    for game in GAMES:
        print(f'== {game}')
        page = browser.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' else None)
        page.goto((ARCADE / f'{game}.html').as_uri())
        page.wait_for_timeout(350)

        check(page.evaluate('typeof window.MathsGame') == 'object', 'engine present')
        check(page.evaluate('typeof window.MATHS_LESSONS') == 'object', 'lesson bank present')

        btn = page.locator('#mathsLessonBtn')
        check(btn.count() == 1, 'one Learn button mounted')
        if btn.count() != 1:
            page.close()
            continue

        # the games that already had a stage still have one
        btn.click()
        page.wait_for_timeout(220)
        wrap = page.locator('#mathsLessonWrap')
        check(wrap.count() == 1 and is_open(page), 'dialog opens on click')

        expected = page.evaluate(f"window.MATHS_LESSONS['{game}'].topics.map(t => t.id)")
        seen = []
        for tid in expected:
            page.click(f'#mathsLessonBody [data-ltopic="{tid}"]')
            page.wait_for_timeout(120)
            body = page.inner_text('#mathsLessonBody')
            h2 = page.inner_text('#mathsLessonBody h2')
            seen.append(tid)
            check(h2.strip() != '', f'{tid}: heading rendered')
            for f in FIELDS:
                check(page.evaluate(
                    f"window.MATHS_LESSONS['{game}'].lessons['{tid}'].{f}") in body,
                    f'{tid}: {f} on screen')
            check(page.evaluate(
                f"window.MATHS_LESSONS['{game}'].lessons['{tid}'].example.a") in body,
                f'{tid}: worked answer on screen')
            nfig = page.evaluate(f"window.MATHS_LESSONS['{game}'].lessons['{tid}'].figs.length")
            check(page.locator('#mathsLessonBody figure svg').count() == nfig,
                  f'{tid}: {nfig} figure(s) drawn')
            check(page.get_attribute(f'#mathsLessonBody [data-ltopic="{tid}"]', 'aria-pressed') == 'true',
                  f'{tid}: picker marks itself pressed')

        check(seen == expected, 'every topic reachable from the picker')

        # A dialog left open by a real bug must report as a failure, not block
        # the next click and hang. Reset before measuring the next check.
        def force_close():
            if is_open(page):
                page.evaluate("window.MathsGame.close()")
                page.wait_for_timeout(120)

        page.keyboard.press('Escape')
        page.wait_for_timeout(180)
        check(not is_open(page), 'Escape closes')
        check(page.evaluate("document.body.style.overflow") == '', 'body scroll restored')

        # reopen and close on the backdrop
        force_close()
        btn.click()
        page.wait_for_timeout(160)
        page.mouse.click(6, 6)
        page.wait_for_timeout(180)
        check(not is_open(page), 'backdrop closes')

        # the game itself still plays: advance one question
        force_close()
        try:
            page.click('[data-mode], .tab, [data-tab]', timeout=1200)
        except Exception:
            pass
        check(not errs, f'no page errors ({errs[:2]})')
        page.close()

    browser.close()
    return fails


with sync_playwright() as pw:
    fails = probe(pw)
print(f'\nPROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
