"""A timed-out typing lesson must not count as a finished deck.

`finish()` is called from two places: the child completing the text, and the
clock running out (typing-tutor.html:510). Both used to show `#done.show`, and
session.js:203-213 reads exactly that class as "this deck is finished" -- so a
child who typed one letter and waited out a 30-second clock got the day's
typing subject credited.

The gate is two-sided. It asserts the timeout does NOT finish, and it asserts a
real completion DOES. A one-sided gate passes if the summary never shows at all,
which would be a worse bug than the one being fixed.

Run:  python3 -I probes/typing_timeout.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
SESSION_KEY = 'arcade.session.v1'


def open_lesson(pg, seconds):
    pg.goto((ARCADE / 'typing-tutor.html').as_uri())
    pg.evaluate("localStorage.clear()")
    pg.reload()
    pg.wait_for_timeout(300)
    if seconds:
        pg.click(f'.mode[data-len="{seconds}"]')
    pg.click('#lessons button')
    pg.wait_for_timeout(300)
    pg.evaluate("() => document.getElementById('capture').focus()")


def state(pg):
    return pg.evaluate("""() => ({
        doneShown: document.getElementById('done').classList.contains('show'),
        timeUpShown: !!document.getElementById('timeUp')
            && document.getElementById('timeUp').classList.contains('show'),
        finished: window.ArcadeSession ? window.ArcadeSession.isFinished() : null,
        session: localStorage.getItem('arcade.session.v1'),
        typed: document.getElementById('target').textContent.length,
    })""")


def run(pw):
    b = pw.chromium.launch()
    fails = []

    # --- arm 1: run out the clock having typed almost nothing -------------
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    open_lesson(pg, 30)
    pg.keyboard.type('a')
    pg.wait_for_timeout(32000)
    s = state(pg)
    print(f'timeout  -> done={s["doneShown"]} timeUp={s["timeUpShown"]} '
          f'isFinished={s["finished"]} session={s["session"]!r}')
    if s['doneShown']:
        fails.append('timeout: the completion panel was shown, so session.js credits the day')
    if not s['timeUpShown']:
        fails.append('timeout: no result was shown at all; the child gets a frozen screen')
    if s['finished']:
        fails.append('timeout: ArcadeSession.isFinished() is true')
    if s['session'] and 'typing' in s['session']:
        fails.append(f'timeout: the session record was written: {s["session"]}')
    if exc:
        fails.append(f'timeout: pageerror {exc[:1]}')
    pg.close()

    # --- arm 2: actually complete the lesson ------------------------------
    # The other half of the gate. Without it, "never show the panel" passes.
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    open_lesson(pg, 0)
    # paintTarget renders a space as NBSP so it does not collapse on screen
    # (typing-tutor.html, `s.textContent = ch === ' ' ? ' ' : ch`), so the
    # rendered text is not the text to type. Type what state.text holds.
    text = pg.evaluate(
        "() => document.getElementById('target').textContent.replace(/\\u00a0/g, ' ')")
    pg.keyboard.type(text)
    pg.wait_for_timeout(500)
    s = state(pg)
    print(f'complete -> done={s["doneShown"]} timeUp={s["timeUpShown"]} '
          f'isFinished={s["finished"]}')
    if not s['doneShown']:
        fails.append('complete: the completion panel did not show on a real completion')
    if s['finished'] is not True:
        fails.append('complete: ArcadeSession.isFinished() is not true')
    if exc:
        fails.append(f'complete: pageerror {exc[:1]}')
    pg.close()

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nTYPING TIMEOUT PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
