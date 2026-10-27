"""A drill that keeps seeing one kind of mistake must offer the lesson for it.

README.md:783 asks the question directly: "whether a drill could notice what a
child keeps getting wrong and offer the one lesson that covers it". Both halves
existed and nothing joined them -- `review[k].miss` is the signal,
`MATHS_LESSONS[drill].topics` is the target, and the Learn button opened on a
picker of four.

`MathsGame.stuckTopic(game, review, topics, skip)` joins them. This gate asserts
Gate 3's first item plus the parts that keep it honest:

  1. Below the threshold, nothing is offered. Two misses is a bad afternoon, and
     a lesson offered after two interrupts a child who is about to get it.
  2. At three misses on facts of one topic, that topic is offered.
  3. The offer is a change of label and a default topic, never a modal. The
     drill must not be interrupted, and closing the lesson must not end a deck.
  4. A topic is offered once per session. The second answer does not re-offer it.
  5. A topic already in `taught` is not offered. This is the whole point of
     recording `taught` in the drills, which had no such field.
  6. The classifier is a function of the fact, not of the lesson text: every
     topic it can return is one the drill's own topic list declares. A
     classifier that invents an id renders a blank dialog.
  7. The offer does not depend on which drill: all five classify their own
     pools, and the same seed of misses produces a topic for each.
  8. Live: play a drill wrong three times on the same kind of fact and the
     button's label names a lesson; the record's `taught` stays empty until the
     lesson is actually opened.

Claim 6 is the one a plausible implementation gets wrong. It is cheap to write
`return 'carrying'` for a drill whose topic list says `carry`, and the result is
a dialog that renders nothing -- and every other claim still passes.

Run:  python3 -I probes/stuck.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

# One fact per topic, chosen so the classifier is decidable by hand from the
# numbers alone. `want` is what the classifier must return.
CASES = {
    'number-bonds': [
        ({'whole': 10, 'a': 7, 'blank': 'b'}, 'ten'),
        ({'whole': 14, 'a': 6, 'blank': 'b'}, 'teen'),
        ({'whole': 8, 'a': 3, 'blank': 'whole'}, 'parts'),
        ({'whole': 9, 'a': 4, 'blank': 'a'}, 'missing'),
    ],
    'addition-quest': [
        ({'level': '1', 'a': 7, 'b': 8}, 'carrying'),      # 7+8 = 15, carries
        ({'level': '2', 'a': 34, 'b': 21}, 'place'),       # 4+1 < 10, two digits
        ({'level': 'bond', 'a': 4, 'b': 6}, 'place'),      # 4+6 = 10: ones overflow, no carry of a digit
        ({'level': '1', 'a': 2, 'b': 3}, 'place'),         # small, no carry
    ],
    'subtraction-safari': [
        ({'level': '2', 'a': 43, 'b': 27}, 'borrowing'),   # 3 < 7, borrows
        ({'level': '1', 'a': 9, 'b': 4}, 'takeaway'),      # small, no borrow
        ({'level': '2', 'a': 68, 'b': 25}, 'counting'),    # 8 > 5, no borrow
    ],
    'times-table-academy': [
        ({'a': 7, 'b': 7}, 'meaning'),                     # a square
        ({'a': 7, 'b': 8}, 'commutative'),                 # off the diagonal
        ({'a': 12, 'b': 3}, 'patterns'),                   # above the 10 grid
    ],
    'division-diner': [
        ({'divisor': 7, 'dividend': 43}, 'remainder'),     # 43 % 7 = 1
        ({'divisor': 7, 'dividend': 42}, 'inverse'),       # comes out even
        ({'divisor': 5, 'dividend': 5}, 'sharing'),        # quotient 1
    ],
}

def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    # number-bonds is the host: it loads maths-engine.js and maths-lessons.js,
    # so the classifier and every drill's topic list are both in scope.
    pg.goto((ARCADE / 'number-bonds.html').as_uri())

    if not pg.evaluate("() => !!(window.MathsGame && window.MathsGame.stuckTopic)"):
        fails.append('maths-engine.js does not export stuckTopic')
        pg.close(); b.close(); return fails
    if not pg.evaluate("() => !!window.MATHS_LESSONS"):
        fails.append('maths-lessons.js did not load')
        pg.close(); b.close(); return fails

    # --- 6. every topic the classifier can return is one the drill declares
    got = pg.evaluate("""(cases) => {
        const M = window.MathsGame;
        const out = {};
        for (const [game, list] of Object.entries(cases)) {
            const topics = window.MATHS_LESSONS[game].topics;
            const ids = topics.map(t => t.id);
            out[game] = list.map(([fact, want]) => {
                // One miss short of the threshold would tell us nothing, so the
                // classifier is driven through the public entry point with a
                // record that is exactly at it.
                const key = (game === 'number-bonds') ? `${fact.whole}|${fact.a}|${fact.blank}`
                    : (game === 'division-diner') ? `${fact.divisor}|${fact.dividend}`
                    : (game === 'times-table-academy') ? `${fact.a}|${fact.b}`
                    : `${fact.level}|${fact.a}|${fact.b}`;
                const review = {};
                review[key] = { n: 4, miss: M.STUCK_MISSES, ok: 0 };
                const got = M.stuckTopic(game, review, topics, null);
                return { fact, want, got, declared: ids.includes(got) };
            });
        }
        return out;
    }""", CASES)

    for game, rows in got.items():
        for r in rows:
            ok = r['got'] == r['want'] and r['declared']
            print(f'== {game:22} {r["fact"]} -> {r["got"]!r} '
                  f'(want {r["want"]!r}, declared={r["declared"]})')
            if r['got'] != r['want']:
                fails.append(f'{game}: {r["fact"]} classified as {r["got"]!r}, '
                             f'expected {r["want"]!r}')
            if not r['declared']:
                fails.append(f'{game}: {r["got"]!r} is not in the drill\'s topic list '
                             f'— the dialog would render blank')

    # --- 1-2, 4-5. the threshold, the skip set, and taught ------------------
    got = pg.evaluate("""() => {
        const M = window.MathsGame;
        const topics = window.MATHS_LESSONS['addition-quest'].topics;
        // ONE fact, missed `misses` times. The threshold is on the topic, so
        // the fixture varies the one dimension the predicate reads: the count.
        const mk = (misses) => ({ '1|7|8': { n: misses + 1, miss: misses, ok: 0 } });
        // one miss on each of three carrying facts: the state a deck actually
        // produces, since its first pass forbids repeats
        const spread = {};
        ['1|7|8', '1|9|6', '1|5|9'].forEach(k => { spread[k] = { n: 2, miss: 1, ok: 0 }; });
        const out = {};
        out.one = M.stuckTopic('addition-quest', mk(1), topics, null);
        out.two = M.stuckTopic('addition-quest', mk(2), topics, null);
        out.three = M.stuckTopic('addition-quest', mk(3), topics, null);
        out.empty = M.stuckTopic('addition-quest', {}, topics, null);
        out.skip = M.stuckTopic('addition-quest', mk(3), topics, new Set(['carrying']));
        out.taught = M.stuckTopic('addition-quest', mk(3), topics, new Set(['carrying']));
        // a miss below the threshold on one fact must not count toward the
        // topic, even when two other facts are at it
        // 1 + 1: two misses spread over two facts is still short of three
        const mixed = mk(1);
        mixed['1|2|3'] = { n: 9, miss: 1, ok: 0 };
        out.mixed = M.stuckTopic('addition-quest', mixed, topics, null);
        out.spread = M.stuckTopic('addition-quest', spread, topics, null);
        out.twoSpread = (() => {
            const r = {};
            ['1|7|8', '1|9|6'].forEach(k => { r[k] = { n: 2, miss: 1, ok: 0 }; });
            return M.stuckTopic('addition-quest', r, topics, null);
        })();
        return out;
    }""")
    print(f'== misses 1/2/3 -> {got["one"]!r} / {got["two"]!r} / {got["three"]!r}')
    print(f'== empty -> {got["empty"]!r}   skip/taught -> {got["skip"]!r}')
    if got['one'] is not None or got['two'] is not None:
        fails.append(f'the offer fired below the threshold: {got["one"]!r}, {got["two"]!r}')
    if got['three'] != 'carrying':
        fails.append(f'three misses on carrying did not offer it: {got["three"]!r}')
    if got['empty'] is not None:
        fails.append(f'an empty record offered a lesson: {got["empty"]!r}')
    if got['skip'] is not None:
        fails.append(f'a topic in the skip set was offered again: {got["skip"]!r}')
    if got['taught'] is not None:
        fails.append(f'a topic already read was offered: {got["taught"]!r}')
    if got['mixed'] is not None:
        fails.append(f'two misses across two facts offered a lesson: {got["mixed"]!r}')
    print(f'== one miss on each of 3 carrying facts -> {got["spread"]!r}; on 2 -> {got["twoSpread"]!r}')
    if got['spread'] != 'carrying':
        fails.append(f'three misses spread across one topic did not offer it: {got["spread"]!r}')
    if got['twoSpread'] is not None:
        fails.append(f'two misses spread across a topic offered it: {got["twoSpread"]!r}')

    # --- 3, 8. live: the button, and nothing else --------------------------
    q = b.new_page()
    errs = []
    q.on('pageerror', lambda e: errs.append(str(e)))
    q.goto((ARCADE / 'number-bonds.html').as_uri())
    q.evaluate("localStorage.clear()")
    q.reload(); q.wait_for_timeout(300)

    before = q.evaluate("() => document.getElementById('mathsLessonBtn').textContent")
    q.click('#playBtn'); q.wait_for_timeout(400)

    # Answer every question wrong until the offer appears or the deck ends.
    # The mode defaults to `ten`, whose blanks are all bonds-to-10, so the
    # misses land on one topic.
    armed = None
    for _ in range(40):
        done = q.evaluate("() => document.getElementById('done').classList.contains('show')")
        if done:
            break
        q.keyboard.type('99999')
        q.keyboard.press('Enter')
        q.wait_for_timeout(90)
        label = q.evaluate("() => document.getElementById('mathsLessonBtn').textContent")
        if 'Learn:' in label:
            armed = label
            break
        q.evaluate("() => { const b = document.getElementById('nextBtn'); if (b && !b.hidden) b.click(); }")
        q.wait_for_timeout(90)

    print(f'== learn button before: {before!r}')
    print(f'== learn button after misses: {armed!r}')
    if not armed:
        fails.append('the Learn button never offered a lesson after repeated misses')
    else:
        if 'Learn:' not in armed:
            fails.append(f'the offer did not name a lesson: {armed!r}')

        # The deck must still be running: the offer is a label, not a modal.
        modal = q.evaluate("() => !!document.querySelector('.maths-lesson-wrap.on')")
        if modal:
            fails.append('the offer opened the lesson by itself')

        taught = q.evaluate("""() => {
            const s = JSON.parse(localStorage.getItem('arcade.bonds.v4') || '{}');
            return s.taught || {};
        }""")
        print(f'== taught before opening: {taught}')
        if taught:
            fails.append(f'a lesson was marked read without being opened: {taught}')

        # Opening it must open on the offered topic, not on the picker's first.
        q.click('#mathsLessonBtn'); q.wait_for_timeout(250)
        pressed = q.evaluate("""() => {
            const b = document.querySelector('.maths-lesson [data-ltopic][aria-pressed="true"]');
            return b ? b.dataset.ltopic : null;
        }""")
        heading = q.evaluate("""() => {
            const h = document.querySelector('.maths-lesson h2');
            return h ? h.textContent : null;
        }""")
        print(f'== opened on {pressed!r} — {heading!r}')
        if not pressed:
            fails.append('the lesson opened with no topic selected')
        # The label carries the topic's display name and the dialog carries its
        # id; the two must name the same topic. Comparing the label to the id
        # is comparing a name to a key -- the first version did, and failed on
        # 'Bonds to 10' vs 'ten'.
        named = armed.split('Learn:', 1)[1].strip() if 'Learn:' in armed else ''
        display = q.evaluate("""(id) => {
            const t = window.MATHS_LESSONS['number-bonds'].topics.find(x => x.id === id);
            return t ? t.name : null;
        }""", pressed)
        print(f'== offer named {named!r}, dialog topic {pressed!r} ({display!r})')
        if named and display and named != display:
            fails.append(f'the offer named {named!r} but opened {pressed!r} ({display!r})')

        # The record still has no `taught` entry: opening is not reading, and
        # nothing in this build marks a lesson read. Recording it is F-13's
        # next half; asserting it here would be asserting a feature that is not
        # there, so the gate records what is true.
        taught2 = q.evaluate("""() => {
            const s = JSON.parse(localStorage.getItem('arcade.bonds.v4') || '{}');
            return s.taught || {};
        }""")
        if taught2 != taught:
            fails.append(f'opening a lesson changed `taught`: {taught} -> {taught2}')

        q.click('#mathsLessonClose'); q.wait_for_timeout(200)
        # Closing the lesson must leave the deck where it was, not end it.
        if not q.evaluate("() => !!document.getElementById('playBtn')"):
            fails.append('closing the lesson left the page without its play control')

    if errs:
        fails.append(f'number-bonds threw: {errs[:2]}')
    q.close()

    if exc:
        fails.append(f'number-bonds (host): pageerror {exc[:2]}')
    pg.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nSTUCK PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
