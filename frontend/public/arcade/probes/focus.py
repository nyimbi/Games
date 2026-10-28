"""A modal that says it is modal keeps the keyboard.

Two surfaces declare `role="dialog" aria-modal="true"`: the maths lesson
overlay (`maths-engine.js`) and the spelling rules sheet (`spelling-bee.html`).
`aria-modal` is a promise to a screen reader that everything outside the dialog
is inert. The pages did not keep it.

Measured before `focus.js`, six Tabs from the maths close button:

    close -> Place value -> Carrying -> Undoing -> Estimating -> BODY

The fifth left the overlay. In the spelling sheet the first Tab landed on the
page's brand link. Closing had the matching defect: focus went to `<body>`, so
the next Tab started from the top of the page instead of from the button that
opened the dialog.

The claims:

  1. Tab from inside the dialog never lands outside it, forwards or back.
  2. Shift+Tab from the first focusable wraps to the last, and Tab from the
     last wraps to the first -- the trap is a cycle, not a wall.
  3. Closing returns focus to the element that opened the dialog.
  4. Escape with no dialog open does not move focus. `spelling-bee.html` binds
     Escape at the document level, so before the guard every Escape press in a
     quiz pulled focus to the rules button.
  5. No page error, and no page loads a dialog without loading `focus.js`.

Run:  python3 -I probes/focus.py
"""
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

# page, opener selector, dialog selector, close key, pages that must load focus.js
MATHS = ('addition-quest.html', '#mathsLessonBtn', '#mathsLessonWrap', 'Escape')
SPELL = ('spelling-bee.html', '#rulesBtn', '#sheet', 'Escape')

MUST_LOAD = ['addition-quest.html', 'subtraction-safari.html', 'number-bonds.html',
             'times-table-academy.html', 'division-diner.html', 'spelling-bee.html']

FOCUS = "() => { const a = document.activeElement; return a ? (a.id || a.className || a.tagName) : 'none'; }"
INSIDE = """(sel) => { const d = document.querySelector(sel); return !!d && d.contains(document.activeElement); }"""


def start_maths(pg):
    pg.click('#tabPractice')
    pg.wait_for_timeout(120)
    pg.query_selector('#practice .lv[data-level]').click()
    pg.wait_for_timeout(200)


def run(pw):
    fails = []
    b = pw.chromium.launch()

    for page, opener, dialog, key, starter in [
        (*MATHS, start_maths),
        (*SPELL, None),
    ]:
        pg = b.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto((ARCADE / page).as_uri())
        pg.wait_for_timeout(250)
        if starter:
            starter(pg)

        # 5. the module is loaded at all -- a page that declares a modal and
        # never loads the trap fails here rather than silently in claim 1.
        if not pg.evaluate("() => !!window.ArcadeFocus"):
            fails.append(f'{page}: does not load focus.js; the dialog is modal in name only')
            pg.close()
            continue

        pg.click(opener)
        pg.wait_for_timeout(250)

        # 1. Tab never leaves, over more presses than the dialog has stops.
        n = pg.evaluate(f"""() => {{
            const d = document.querySelector({dialog!r});
            return window.ArcadeFocus.focusable(d).length;
        }}""")
        if n < 1:
            fails.append(f'{page}: the dialog has no focusable element; a keyboard user is stranded')
            pg.close()
            continue
        # Two full cycles plus one, so a trap that only works once is caught.
        for i in range(n * 2 + 1):
            pg.keyboard.press('Tab')
            if not pg.evaluate(INSIDE, dialog):
                got = pg.evaluate(FOCUS)
                fails.append(f'{page}: Tab {i + 1} of {n * 2 + 1} left the dialog (focus on {got!r}); '
                             f'the dialog has {n} focusable stops')
                break

        # 2. it is a cycle. From the first, Shift+Tab lands on the last; from
        # the last, Tab lands on the first. A trap that only blocks Tab at the
        # end and does not wrap is a wall, and a wall plus Escape is usable but
        # not what aria-modal promises.
        # By identity, not by id-or-class. A dialog's stops need not carry
        # either -- the maths overlay's topic buttons are bare `<button>`s --
        # and comparing names reported a correct trap as broken.
        if n > 1:
            pg.evaluate(f"""() => {{
                const d = document.querySelector({dialog!r});
                window.ArcadeFocus.focusable(d)[0].focus();
            }}""")
            pg.keyboard.press('Shift+Tab')
            wrapped_back = pg.evaluate(f"""() => {{
                const d = document.querySelector({dialog!r});
                const f = window.ArcadeFocus.focusable(d);
                return document.activeElement === f[f.length - 1];
            }}""")
            if not wrapped_back:
                fails.append(f'{page}: Shift+Tab from the first stop did not wrap to the last; '
                             f'the trap is not a cycle')
            pg.evaluate(f"""() => {{
                const d = document.querySelector({dialog!r});
                const f = window.ArcadeFocus.focusable(d);
                f[f.length - 1].focus();
            }}""")
            pg.keyboard.press('Tab')
            wrapped_fwd = pg.evaluate(f"""() => {{
                const d = document.querySelector({dialog!r});
                return document.activeElement === window.ArcadeFocus.focusable(d)[0];
            }}""")
            if not wrapped_fwd:
                fails.append(f'{page}: Tab from the last stop did not wrap to the first; '
                             f'the trap is not a cycle')

        # 3. closing returns focus to the opener.
        pg.keyboard.press(key)
        pg.wait_for_timeout(200)
        closed = pg.evaluate(FOCUS)
        if closed != opener.lstrip('#'):
            fails.append(f'{page}: closed the dialog and focus is on {closed!r}, '
                         f'not the {opener} that opened it')

        # 4. Escape with nothing open moves nothing. Only the spelling page
        # binds Escape unconditionally; the maths one guards on `on`.
        if page == 'spelling-bee.html':
            # Not from the opener. The defect moved focus *to* `#rulesBtn`, so
            # starting there makes the before and after identical whatever the
            # code does -- a fixture in which the bug cannot appear, the same
            # mistake as the spelling cover rule that seeded only common
            # letters. Park focus on an unrelated control instead.
            pg.evaluate("() => document.querySelector('.tierbtn').focus()")
            pg.wait_for_timeout(80)
            before = pg.evaluate(FOCUS)
            if before == opener.lstrip('#'):
                fails.append(f'{page}: could not park focus away from {opener}; the claim cannot fire')
            pg.keyboard.press('Escape')
            pg.wait_for_timeout(150)
            after = pg.evaluate(FOCUS)
            if after != before:
                fails.append(f'{page}: Escape with the sheet closed moved focus from '
                             f'{before!r} to {after!r}')

        if errs:
            fails.append(f'{page}: pageerror {errs[:2]}')
        print(f'== {page}: {n} focusable stops, trap cycle, restore ok')
        pg.close()

    # 5b. every page that can open a modal loads the module.
    for page in MUST_LOAD:
        s = (ARCADE / page).read_text()
        if 'focus.js' not in s:
            fails.append(f'{page}: loads a modal dialog but not focus.js')

    # 5c. the module is not re-implemented per page. A second `focusable`
    # in a page is the two-copies defect `escape.py` exists to catch.
    for page in MUST_LOAD:
        body = re.sub(r'/\*.*?\*/', '', (ARCADE / page).read_text(), flags=re.S)
        body = re.sub(r'^\s*//.*$', '', body, flags=re.M)
        if re.search(r'function\s+focusable\s*\(', body):
            fails.append(f'{page}: defines its own focusable(); focus.js is not the only copy')

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nFOCUS PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
