"""Every drill accepts the answer to the question it is showing.

`grading.py` proves a keystroke reaches a grader -- it types `4` and checks that
*something* happened. That is satisfiable by a drill that marks every answer
wrong. The claim here is the other half: read the question off the screen, work
out the answer independently, type it, and require the drill's own verdict to
say correct.

It also types a number the page shows but does not ask for, and requires that
one to be rejected. Addition's bond level is why. It renders `6 + ? = 10`,
speaks "6 plus 4", and grades against the whole: the missing part is rejected
and the number already on the screen is accepted. A probe that only checked
"the right answer passes" would still have caught it -- but a probe that only
checked "something was graded" would not, and that is what `grading.py` does.

The answers are computed here, in Python, from text read out of the DOM. The
page's own queue is never consulted: a probe that recomputes with the same
expression the page grades with proves the expression runs, not that it is
right.

Two failure modes this probe had to be taught to avoid, both of which read as
findings against correct code:

  - **Testing the decoy on the question just answered.** A correct answer
    auto-advances after 700 ms. Reading the screen 200 ms later returns the
    *old* question, and `submit` returns early once `state.answered` is set, so
    the answer box still reads `ok` and the decoy looks accepted. The advance is
    waited for explicitly.
  - **Assuming a bond's answer is the part on screen.** For `10 = 4 + ?` the
    answer is `10 - 4`, not `4`.

Run:  python3 -I probes/answerable.py
"""
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

# game, tab, starter button
DRILLS = [
    ('number-bonds', None, '#playBtn'),
    ('addition-quest', '#tabPractice', None),
    ('subtraction-safari', '#tabPractice', None),
    ('times-table-academy', '#tabPractice', None),
    ('division-diner', '#tabPractice', None),
]

READ = {
    'number-bonds': """() => ({
        whole: document.getElementById('nWhole').textContent.trim(),
        a: document.getElementById('nA').textContent.trim(),
        b: document.getElementById('nB').textContent.trim(),
        say: document.getElementById('qsay').textContent.trim() })""",
    'addition-quest': """() => ({
        ask: document.getElementById('ask').textContent.trim(),
        top: document.getElementById('qTop').textContent.trim(),
        bot: document.getElementById('qBot').textContent.trim(),
        say: document.getElementById('qsay').textContent.trim() })""",
    'subtraction-safari': """() => ({
        top: document.getElementById('qTop').textContent.trim(),
        bot: document.getElementById('qBot').textContent.trim(),
        say: document.getElementById('qsay').textContent.trim() })""",
    'times-table-academy': """() => ({
        a: document.getElementById('qa').textContent.trim(),
        b: document.getElementById('qb').textContent.trim(),
        say: document.getElementById('qsay').textContent.trim() })""",
    'division-diner': """() => ({
        a: document.getElementById('qa').textContent.trim(),
        b: document.getElementById('qb').textContent.trim(),
        say: document.getElementById('qsay').textContent.trim() })""",
}

N = 10


def ints(s):
    return [int(x) for x in re.findall(r'\d+', s)]


def question(game, d):
    """(answer, decoy) for the question the page is showing, or None.

    `decoy` is a number the page displays and does not ask for -- the value the
    drill must reject -- or None where the screen holds no such number.
    """
    if game == 'number-bonds':
        cells = {'whole': d['whole'], 'a': d['a'], 'b': d['b']}
        blanks = [k for k, v in cells.items() if v == '?']
        if len(blanks) != 1:
            return None
        blank = blanks[0]
        known = {k: int(v) for k, v in cells.items() if k != blank}
        if blank == 'whole':
            # Both parts are shown; each one is wrong on its own.
            return known['a'] + known['b'], known['a']
        other = 'b' if blank == 'a' else 'a'
        # The missing part is the whole minus the part on screen. The whole is
        # the decoy: it is displayed, it is not the answer, and it is what the
        # addition drill's bond level wrongly accepted.
        return known['whole'] - known[other], known['whole']
    if game == 'addition-quest':
        if d['ask'] == 'Make the whole' or '?' in d['bot']:
            n = ints(d['bot'])
            if len(n) != 2:
                return None
            a, whole = n
            return whole - a, whole
        n = ints(d['top']) + ints(d['bot'])
        if len(n) != 2:
            return None
        return n[0] + n[1], None
    if game == 'subtraction-safari':
        n = ints(d['top']) + ints(d['bot'])
        if len(n) != 2:
            return None
        return n[0] - n[1], n[0]
    if game == 'times-table-academy':
        n = ints(d['a']) + ints(d['b'])
        if len(n) != 2:
            return None
        return n[0] * n[1], None
    if game == 'division-diner':
        n = ints(d['a']) + ints(d['b'])
        if len(n) != 2 or n[1] == 0 or n[0] % n[1]:
            return None
        return n[0] // n[1], n[0]
    return None


def clear(pg):
    pg.evaluate("""() => {
      const pad = document.getElementById('pad');
      for (let i = 0; i < 6; i++) {
        const b = [...pad.querySelectorAll('button')]
          .find(x => /Del|⌫/.test(x.textContent));
        if (b) b.click();
      }
    }""")


def type_value(pg, value):
    pg.evaluate("""(v) => {
      const pad = document.getElementById('pad');
      for (const ch of String(v)) {
        const b = [...pad.querySelectorAll('button')]
          .find(x => x.textContent.trim() === ch);
        if (b) b.click();
      }
    }""", str(value))


def check(pg):
    pg.evaluate("""() => {
      const pad = document.getElementById('pad');
      const b = [...pad.querySelectorAll('button')]
        .find(x => /Check|✓/.test(x.textContent));
      if (b) b.click();
    }""")


def verdict(pg):
    return pg.evaluate("""() => {
      const el = document.getElementById('qAns') || document.getElementById('qans');
      return el ? el.className : '';
    }""")


def say(pg):
    return pg.evaluate("() => document.getElementById('qsay').textContent.trim()")


def advance(pg, was_say):
    """Leave the current question behind, however this drill does it.

    A correct answer auto-advances on a timer; a wrong one shows Next and waits.
    Both are covered by clicking Next when it is there, then waiting for the
    spoken question to change -- which is the only signal common to the five
    drills, since each renders its question into a different element.
    """
    pg.evaluate("""() => {
      const n = document.getElementById('nextBtn');
      if (n && !n.hidden) n.click();
    }""")
    for _ in range(20):
        if say(pg) != was_say:
            return True
        pg.wait_for_timeout(60)
    return False


def run(pw):
    b = pw.chromium.launch()
    pg = b.new_page()
    pg.set_default_timeout(6000)
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    fails = []

    for game, tab, starter in DRILLS:
        pg.goto((ARCADE / f'{game}.html').as_uri())
        pg.evaluate("() => localStorage.clear()")
        pg.reload()
        pg.wait_for_timeout(250)
        if tab:
            pg.click(tab)
            pg.wait_for_timeout(200)
        if starter:
            pg.click(starter)
            pg.wait_for_timeout(250)

        accepted = 0
        refused = 0
        decoy_trials = 0
        decoy_accepted = 0
        # Alternate: even rounds test the answer, odd rounds test the decoy.
        # Testing both on one question is impossible -- a rejected answer sets
        # `answered`, and the drill will not grade the same question twice.
        for i in range(N):
            clear(pg)
            d = pg.evaluate(READ[game])
            q = question(game, d)
            if q is None:
                fails.append(f'{game}: question {i + 1} does not parse: {d}')
                break
            answer, decoy = q
            before = d['say']

            if i % 2 == 0 or decoy is None or decoy == answer:
                type_value(pg, answer)
                check(pg)
                pg.wait_for_timeout(250)
                cls = verdict(pg)
                if 'ok' in cls:
                    accepted += 1
                else:
                    fails.append(f'{game}: the answer to the shown question, '
                                 f'{answer}, was not accepted ({cls!r}); screen {d}')
            else:
                decoy_trials += 1
                type_value(pg, decoy)
                check(pg)
                pg.wait_for_timeout(250)
                if 'ok' in verdict(pg):
                    decoy_accepted += 1
                    refused += 0
                    fails.append(f'{game}: {decoy} is on the screen and is not the '
                                 f'answer to {d}, but it was accepted')
            advance(pg, before)

        print(f'== {game}: {accepted} answers accepted, {decoy_trials} decoy trials, '
              f'{decoy_accepted} decoys accepted')

    if exc:
        fails.append(f'pageerror: {exc[:3]}')
    pg.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nANSWERABLE PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails[:12]:
    print('  -', f)
if len(fails) > 12:
    print(f'  … {len(fails) - 12} more')
sys.exit(1 if fails else 0)
