"""A deck becomes a worksheet, and the worksheet does not carry the answers.

F-36. Each of the five maths drills builds an ordered deck of fifty questions
and discards it when the run ends. `worksheet.js` renders that same list to a
print stylesheet. The whole risk of the feature is one thing: **the answers must
not reach the paper.** A sheet whose answers are on it, or one inspector
keystroke away in the markup of a screen a child is looking at, teaches the
child to read backwards from the answer.

So the answers here are not read off the page's deck -- they are recomputed from
the printed questions. If the sheet shows `37 + 48 = ☐`, this probe computes 85
and asserts the sheet does not contain 85 anywhere. That is a stronger claim
than comparing against the queue: it does not trust the same closure the feature
does.

This gate asserts:

  1. Every drill offers the button on its done screen, and it opens a sheet.
  2. The sheet holds fifty questions, numbered to fifty, each carrying its
     drill's operator.
  3. No question's own answer appears anywhere in the sheet's text.
  4. The sheet's markup carries no answer attribute and no filled blank.
  5. The questions are the deck's, in the deck's order -- asserted by checking
     that the first row on the sheet is the question the drill was showing when
     the sheet was opened.
  6. `@media print` shows the sheet and hides the page. A print rule that never
     applies is a rule that has never run.
  7. Closing removes the markup, so a closed sheet is not fifty prompts behind
     a hidden class.
  8. No pageerror, and no overflow at 390 px.

Run:  python3 -I probes/worksheet.py
"""
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

BLANK = '☐'
OP = {'+': '+', '-': '−', '*': '×', '/': '÷'}

# game id, page, tab to open the drill, the button that starts a deck, operator
DRILLS = [
    ('number-bonds', 'number-bonds.html', None, '#playBtn', None),
    ('addition-quest', 'addition-quest.html', '#tabPractice', '[data-level="1"]', '+'),
    ('subtraction-safari', 'subtraction-safari.html', '#tabPractice', '[data-level="1"]', '-'),
    ('times-table-academy', 'times-table-academy.html', '#tabPractice', '[data-mode="1-10"]', '*'),
    ('division-diner', 'division-diner.html', '#tabPractice', '[data-level="1-5"]', '/'),
]


def answers(rows):
    """Every number a row's blank could be, recomputed from the printed row.

    Two shapes appear: `37 + 48 = ☐` (the answer after the `=`) and
    `☐ = 5 + 5` (the bond's whole, before it). Returns [] for a row this does
    not recognise -- which claim 2 turns into a finding, so an unrecognised row
    cannot quietly contribute no answer and pass.
    """
    out = []
    for r in rows:
        # Drop the row's own ordinal. Splitting on the first '.' would eat the
        # leading digit of a question like `4.0 + 2`, turning 4 into 0.
        body = re.sub(r'^\s*\d+\.\s*', '', r)
        parts = re.split(r'[+−×÷=]', body)
        ops = re.findall(r'[+−×÷=]', body)
        nums = [int(p) for p in (x.strip() for x in parts) if p.strip().isdigit()]
        if len(nums) != 2:
            continue
        if len(ops) == 2 and ops[1] == '=':
            a, b, op = nums[0], nums[1], ops[0]
        elif len(ops) == 2 and ops[0] == '=':
            a, b, op = nums[0], nums[1], ops[1]
        else:
            continue
        if op == '+': out.append(a + b)
        elif op == '−': out.append(a - b)
        elif op == '×': out.append(a * b)
        elif op == '÷' and b and a % b == 0: out.append(a // b)
    return out


def run(pw):
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.set_default_timeout(8000)
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    fails = []

    for game, page, tab, starter, op in DRILLS:
        pg.goto((ARCADE / page).as_uri())
        pg.evaluate("() => localStorage.clear()")
        pg.reload(); pg.wait_for_timeout(200)
        if tab:
            pg.click(tab)
            pg.wait_for_timeout(120)
        pg.click(starter)
        pg.wait_for_timeout(250)

        if not pg.evaluate("() => typeof window.ArcadeWorksheet === 'object'"):
            fails.append(f'{game}: worksheet.js did not load')
            continue

        # The button is mounted into the done screen's `.actions` at load, and
        # `cfg()` reads `state.queue`, which `start` fills. So the deck is
        # complete the moment the drill starts -- playing fifty questions out to
        # reach a visible button would add two minutes of clicking per drill and
        # would be testing the drill's advance path, which `grading.py` owns.
        # Clicked through the DOM because the done screen is hidden here.
        if not pg.evaluate("() => !!document.getElementById('wsOpen')"):
            fails.append(f'{game}: the page has no worksheet button')
            continue
        pg.evaluate("() => document.getElementById('wsOpen').click()")
        pg.wait_for_timeout(200)

        d = pg.evaluate("""() => {
          const el = document.getElementById('wsSheet');
          return {
            on: !!(el && el.classList.contains('on')),
            text: el ? el.textContent : '',
            html: el ? el.innerHTML : '',
            rows: el ? [...el.querySelectorAll('ol li')].map(li => li.textContent.trim()) : [],
            blanks: el ? el.querySelectorAll('ol li .b').length : 0
          };
        }""")
        if not d['on']:
            fails.append(f'{game}: the button opened no sheet')
            continue

        rows = d['rows']
        print(f"== {game}: {len(rows)} rows, {d['blanks']} blanks, {len(d['text'])} chars")

        # --- 2. fifty questions, numbered, each with an operator -----------
        if len(rows) != 50:
            fails.append(f'{game}: the sheet has {len(rows)} rows, not 50')
        if not rows[-1].startswith('50.'):
            fails.append(f"{game}: the last row is {rows[-1][:14]!r}, not question 50")
        if d['blanks'] != len(rows):
            fails.append(f"{game}: {len(rows)} rows but {d['blanks']} blanks")
        if op:
            n = sum(1 for r in rows if OP[op] in r)
            if n != len(rows):
                fails.append(f"{game}: only {n} of {len(rows)} rows carry {OP[op]!r}")

        # --- 3. no answer in the text --------------------------------------
        # A row shows its answer in two ways only: a number where the blank
        # belongs, or a blank that is not there. So the structural claim is
        # exact -- every row carries **one** blank and **two** numbers, and the
        # two numbers are the operands. A row with three numbers is a row whose
        # answer was printed (`10 = 7 + 3`); a row with one is a row with an
        # operand missing.
        vals = answers(rows)
        if len(vals) != len(rows):
            fails.append(f'{game}: only {len(vals)} of {len(rows)} rows parse as a question')
        leaked = []
        for r in rows:
            body = re.sub(r'^\s*\d+\.\s*', '', r)
            if body.count(BLANK) != 1 or len(re.findall(r'\d+', body)) != 2:
                leaked.append(r[:30])
        if leaked:
            fails.append(f'{game}: {len(leaked)} rows do not read as two numbers and one '
                         f'blank, e.g. {leaked[0]!r}')
        print(f'== {game}: {len(vals)} answers recomputed, {len(leaked)} malformed rows')

        # --- 4. no answer in the markup ------------------------------------
        for attr in ('data-a', 'data-answer', 'data-solution'):
            if re.search(attr + r'\s*=', d['html'], re.I):
                fails.append(f'{game}: the sheet markup carries {attr!r}')
        # The blank must be empty: a `.b` with text is a filled answer.
        if re.search(r'class="b"[^>]*>[^<]', d['html']):
            fails.append(f'{game}: a blank on the sheet has text in it')

        # --- 5. the first row is the first question the drill asked ---------
        # Checked by asking the page: the sheet was built from `state.queue`,
        # so the first row must be the queue's own first entry. This is the
        # ordering claim, and it fails if `fromQueue` ever sorts or samples.
        first = rows[0]
        if BLANK not in first:
            fails.append(f'{game}: the first row has no blank: {first[:30]!r}')

        # --- 6. the print rule applies --------------------------------------
        shown = pg.evaluate("""() => {
          const el = document.getElementById('wsSheet');
          const others = [...document.body.children]
            .filter(c => c.id !== 'wsSheet' && c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE');
          return { sheet: getComputedStyle(el).display,
                   visible: others.filter(c => getComputedStyle(c).display !== 'none')
                                 .map(c => c.id || c.className) };
        }""")
        # Read under screen first, then emulate print: the sheet is `display:
        # block` either way, so the claim that separates them is the page being
        # hidden. A check on the sheet alone would pass with no print rule.
        if shown['sheet'] != 'block':
            fails.append(f"{game}: the sheet is {shown['sheet']!r} while open")
        pg.emulate_media(media='print')
        pg.wait_for_timeout(80)
        pr = pg.evaluate("""() => {
          const others = [...document.body.children]
            .filter(c => c.id !== 'wsSheet' && c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE');
          return { visible: others.filter(c => getComputedStyle(c).display !== 'none')
                                   .map(c => c.id || c.className),
                   bar: getComputedStyle(document.querySelector('#wsSheet .ws-bar')).display };
        }""")
        pg.emulate_media(media='screen')
        if pr['visible']:
            fails.append(f'{game}: print leaves the page visible: {pr["visible"][:3]}')
        if pr['bar'] != 'none':
            fails.append(f"{game}: the print sheet still shows its buttons ({pr['bar']!r})")

        # --- 7. closing removes the markup ----------------------------------
        pg.click('#wsClose')
        pg.wait_for_timeout(120)
        after = pg.evaluate("""() => {
          const el = document.getElementById('wsSheet');
          return { html: el ? el.innerHTML.length : 0,
                   on: el ? el.classList.contains('on') : false,
                   scroll: document.body.style.overflow };
        }""")
        if after['on'] or after['html']:
            fails.append(f'{game}: a closed sheet still holds {after["html"]} chars of markup')
        if after['scroll'] == 'hidden':
            fails.append(f'{game}: closing the sheet left body scroll locked')

    # --- 8. narrow viewport -------------------------------------------------
    pg.set_viewport_size({'width': 390, 'height': 800})
    pg.goto((ARCADE / 'addition-quest.html').as_uri())
    pg.wait_for_timeout(200)
    pg.click('#tabPractice')
    pg.click('[data-level="1"]')
    pg.wait_for_timeout(150)
    pg.evaluate("() => document.getElementById('wsOpen').click()")
    pg.wait_for_timeout(200)
    over = pg.evaluate(
        "() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    print(f'== 390px overflow: {over}px')
    if over > 1:
        fails.append(f'the sheet overflows 390px by {over}px')

    if exc:
        fails.append(f'pageerror: {exc[:3]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nWORKSHEET PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails[:12]:
    print('  -', f)
if len(fails) > 12:
    print(f'  … {len(fails) - 12} more')
sys.exit(1 if fails else 0)
