"""The typing tutor turns its per-key error map into a lesson.

`typeChar` counts, for every key the child was *asked* for and missed, how many
times. `paintWeak()` ranks the top five and prints them. `startLesson` clears
the map. So the one thing the tutor knows about a child -- which keys they miss
-- lasted one lesson and produced no practice.

F-15 is that count made into a drill. This gate asserts:

  1. A fresh record has twelve lessons and no drill. The card is earned by
     mistakes, and a child who has made none is not shown an empty one.
  2. A record with weak keys has a drill card, appended last, enabled even
     though the lessons around it are locked, and marked as a drill.
  3. The drill's text covers every key the drill names. A drill that says
     "your hardest keys: g ; q" and then never asks for `;` is a label, not a
     lesson -- and `jkl;` is the only word in the corpus with a semicolon, so
     the cover rule is doing real work on exactly one key.
  4. The count is cumulative, not per-run: a lesson played badly and left
     without finishing still feeds the drill after a reload.
  5. A drill played clean halves what it was built on. Without this the count
     only rises and "your hardest keys" becomes a fact about history.
  6. A drill played with a miss raises that key and rebuilds around it.
  7. Playing the drill records no star. The text is regenerated each time, so a
     best score would sit on a lesson the child cannot return to.
  8. The drill still ends the day correctly -- `#done.show` on completion, and
     `ArcadeSession.isFinished()` true -- since `session.js` reads that class.

Run:  python3 -I probes/typing_drill.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
KEY = 'arcade.typing.v1'


def seed(pg, weak, progress=None):
    pg.goto((ARCADE / 'typing-tutor.html').as_uri())
    pg.evaluate(
        """([key, weak, progress]) => localStorage.setItem(key, JSON.stringify({
            v: 1, progress, weak, savedAt: Date.now()
        }))""",
        [KEY, weak, progress or {}])
    pg.reload()
    pg.wait_for_timeout(300)


def cards(pg):
    return pg.evaluate("""() => [...document.querySelectorAll('#lessons .lesson')].map(b => ({
        no: b.querySelector('.no').textContent,
        name: b.querySelector('.nm').textContent,
        desc: b.querySelector('.ds').textContent,
        weak: b.classList.contains('weak'),
        disabled: b.disabled,
        stars: [...b.querySelectorAll('.stars span')].filter(s => s.classList.contains('on')).length
    }))""")


def record(pg):
    return pg.evaluate("""k => {
        try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; }
    }""", KEY)


def type_drill(pg, wrong_at=None):
    """Open the last card and type its text, optionally missing one character."""
    # Get back to the picker by reloading, not by clicking. Once a lesson ends,
    # `#done` covers the stage and `#backBtn` is inside it -- clicking times out
    # on visibility rather than failing a claim. A reload also re-reads the
    # record, so the drill it opens is the one built from what was saved.
    pg.reload()
    pg.wait_for_timeout(300)
    cards_ = pg.query_selector_all('#lessons .lesson')
    if not cards_ or not cards_[-1].is_enabled():
        # A locked drill is a finding claim 2 reports; clicking it anyway is a
        # Playwright timeout, which is a construction error and buries the
        # finding under a traceback. Return nothing and let the caller skip.
        return None
    cards_[-1].click()
    pg.wait_for_timeout(250)
    text = pg.evaluate(
        "() => document.getElementById('target').textContent.replace(/\\u00a0/g, ' ')")
    if wrong_at is None:
        pg.keyboard.type(text)
    else:
        i = wrong_at(text)
        pg.keyboard.type(text[:i])
        # A key that is not the wanted one. Which key does not matter: the
        # tutor records the key that was *wanted*, which is the point.
        pg.keyboard.type('~' if text[i] != '~' else '!')
        pg.keyboard.type(text[i:])
    pg.wait_for_timeout(400)
    return text


def run(pw):
    b = pw.chromium.launch()
    fails = []
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))

    # --- 1. fresh: twelve lessons, no drill -------------------------------
    pg.goto((ARCADE / 'typing-tutor.html').as_uri())
    pg.evaluate("() => localStorage.clear()")
    pg.reload(); pg.wait_for_timeout(300)
    c = cards(pg)
    print(f'== fresh: {len(c)} cards, weak cards {[x["name"] for x in c if x["weak"]]}')
    if len(c) != 12:
        fails.append(f'a fresh record shows {len(c)} lessons, not 12')
    if any(x['weak'] for x in c):
        fails.append('a fresh record already shows a weak-key drill')

    # --- 2. seeded weak keys produce the card -----------------------------
    # Two keys, one dimension of difference each: `e` is the most common letter
    # in the corpus and `;` appears in one word. The drill's body is fourteen
    # words chosen by how many weak keys they carry, so `e` fills all fourteen
    # and `;` is crowded out entirely -- which is the case claim 3 exists for.
    # A fixture with two equally well-fed keys would not test the cover rule.
    seed(pg, {'e': 10, ';': 1})
    c = cards(pg)
    drill_cards = [x for x in c if x['weak']]
    print(f'== seeded: {len(c)} cards, drill {drill_cards}')
    if len(c) != 13:
        fails.append(f'a record with weak keys shows {len(c)} lessons, not 13')
    if len(drill_cards) != 1:
        fails.append(f'expected one drill card, got {len(drill_cards)}')
    else:
        d = drill_cards[0]
        if d is not c[-1]:
            fails.append('the drill is not the last card, so it shifted an index')
        if d['disabled']:
            fails.append('the drill is locked; it is earned by mistakes, not by the lesson before it')
        if d['no'] != '★':
            fails.append(f'the drill is numbered {d["no"]!r}, not ★')

    # --- 3. the drill asks for every key it names -------------------------
    text = type_drill(pg, wrong_at=None)
    if text is None:
        fails.append('the drill card cannot be opened, so nothing below can run')
        pg.close(); b.close()
        return fails
    print(f'== drill text: {text!r}')
    named = [k for k in ('e', ';') if k in drill_cards[0]['desc']]
    missing = [k for k in ('e', ';') if k not in text]
    if len(named) != 2:
        fails.append(f'the card names {named}, not both seeded keys')
    if missing:
        fails.append(f'the drill names {named} but its text never asks for {missing}')
    if not text.strip():
        fails.append('the drill text is empty')

    # --- 7 + 8. a clean drill records no star, and finishes the day --------
    st = pg.evaluate("""() => ({
        doneShown: document.getElementById('done').classList.contains('show'),
        finished: window.ArcadeSession ? window.ArcadeSession.isFinished() : null
    })""")
    rec = record(pg)
    print(f'== after clean drill: done={st["doneShown"]} finished={st["finished"]} '
          f'progress={rec["progress"] if rec else None} weak={rec["weak"] if rec else None}')
    if not st['doneShown']:
        fails.append('a completed drill did not show the completion panel')
    if st['finished'] is not True:
        fails.append('a completed drill did not finish the session')
    if rec is None:
        fails.append('the drill run wrote no record')
    else:
        if 'weak' in rec['progress']:
            fails.append('the drill recorded a best score; its text is regenerated each run')
        # --- 5. a clean drill halves what it was built on ------------------
        if rec['weak'].get('e') != 5:
            fails.append(f'a clean drill left e at {rec["weak"].get("e")}, not halved from 10')
        if ';' in rec['weak']:
            fails.append(f'a clean drill left ; at {rec["weak"][";"]}; floor(1/2) is 0 and 0 is not a weak key')

    # --- 6. a miss in the drill raises that key ---------------------------
    # Miss on the first character, so the key missed is the one the drill put
    # first. Deliberately a key the drill already names: the claim is that the
    # count moves, and a fresh key would also pass against a counter that only
    # ever adds.
    before = record(pg)['weak']
    # The key missed is the text's own first character. The drill is rebuilt
    # after every run, so the text read in claim 3 is not the text this run
    # opens -- the ranking that put `e` first has since halved it.
    text2 = type_drill(pg, wrong_at=lambda _: 0)
    after = record(pg)['weak']
    if text2 is None:
        fails.append('the drill card cannot be reopened after a clean run')
        pg.close(); b.close()
        return fails
    missed = text2[0]
    print(f'== after a miss on {missed!r} at char 0: weak {before} -> {after}')
    # Naming the key is what stops a counter that increments on any keystroke
    # passing: the tutor records the key that was *wanted*, so exactly that one
    # may move, and by exactly one.
    if after.get(missed, 0) - before.get(missed, 0) != 1:
        fails.append(f'a miss on {missed!r} moved it by '
                     f'{after.get(missed, 0) - before.get(missed, 0)}, not 1')
    moved = [k for k in after if after.get(k, 0) > before.get(k, 0)]
    if moved != [missed]:
        fails.append(f'a single miss moved {moved}, not just {missed!r}')

    # --- 4. the count is cumulative and survives leaving mid-lesson -------
    # A lesson abandoned without finishing: the errors happened, so the keys
    # are weak, and `finish()` never ran to save them. `toLessons` is the other
    # exit and it must save.
    seed(pg, {}, {})
    pg.query_selector_all('#lessons .lesson')[0].click()
    pg.wait_for_timeout(250)
    pg.keyboard.type('xxx')          # three misses on 'a', 's', 'd' in turn
    pg.click('#backBtn')
    pg.wait_for_timeout(250)
    left = record(pg)['weak']
    pg.reload(); pg.wait_for_timeout(300)
    c = cards(pg)
    print(f'== abandoned lesson: weak {left}, cards {len(c)}, drill '
          f'{[x["name"] for x in c if x["weak"]]}')
    if not left:
        fails.append('leaving a lesson mid-way saved no weak keys')
    if len(c) != 13:
        fails.append(f'after an abandoned lesson the reload shows {len(c)} cards, not 13')
    if not any(x['weak'] for x in c):
        fails.append('the drill did not survive a reload, so the count is per-session')

    # --- 9. the space bar alone still earns a drill -----------------------
    # Space is the one key that cannot sit inside a word, so a scorer that only
    # looks at letters gives a child whose only weak key is the space bar no
    # drill at all -- and no explanation. The fallback is words, whose spaces
    # are the practice.
    seed(pg, {' ': 4})
    c = cards(pg)
    drill_cards = [x for x in c if x['weak']]
    print(f'== space only: {len(c)} cards, drill {[x["desc"] for x in drill_cards]}')
    if len(c) != 13 or not drill_cards:
        fails.append('a child whose only weak key is space got no drill')
    else:
        text = type_drill(pg, wrong_at=None)
        if not text or ' ' not in text:
            fails.append(f'the space drill has no spaces to type: {text!r}')

    if exc:
        fails.append(f'pageerror: {exc[:3]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nTYPING DRILL PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
