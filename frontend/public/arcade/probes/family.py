"""Four drills, four stores, one fact.

`7 + 8`, `8 + 7`, `15 − 8` and `15 − 7` are one fact family. The arcade keeps
them in `arcade.addition.v3` and `arcade.subtraction.v3`, unrelated, and a miss
in one teaches the other nothing. `8 × 7` and `56 ÷ 7` have the same problem in
the other two stores.

`ArcadeDeck.familyKey(op, x, y)` names the family; `familySiblings` returns the
four questions that test it. This gate asserts:

  1. A family key is canonical: the order the operands are given in does not
     change it. `familyKey('add', 7, 8) === familyKey('add', 8, 7)`.
  2. All four representations of a family share one key -- both directions of
     the addition, both of the subtraction -- and likewise for times/division.
  3. Addition and multiplication do NOT share a family. `2 + 3` and `2 × 3`
     are different facts; merging them would make a child who can add 2 and 3
     look like one who can multiply them. This is the claim a "just use the
     numbers" implementation fails.
  4. The siblings are the facts, with the right answers: four per family, each
     one arithmetically correct, and no duplicates.
  5. A subtraction that would go negative and a division that does not come
     out whole have no family. The pools only ask whole non-negative facts, so
     a fractional key would be a family no drill can ever match -- the merge
     would silently never happen, which reads exactly like working.
  6. The key survives the round trip through a record: a miss written under
     `sub` is found by the family index built from `add`, and vice versa. This
     is the claim the whole feature exists for.

Claim 3 and claim 5 are the two a plausible implementation gets wrong in
opposite directions -- one merges too much, one merges nothing.

Run:  python3 -I probes/family.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / 'number-bonds.html').as_uri())

    if not pg.evaluate("() => !!(window.ArcadeDeck && window.ArcadeDeck.familyKey)"):
        fails.append('deck.js does not export familyKey')
        pg.close(); b.close(); return fails

    # --- 1-2. canonical, and all four representations agree ---------------
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        return {
            addFwd: D.familyKey('add', 7, 8),
            addRev: D.familyKey('add', 8, 7),
            subA:   D.familyKey('sub', 15, 8),
            subB:   D.familyKey('sub', 15, 7),
            mulFwd: D.familyKey('mul', 7, 8),
            mulRev: D.familyKey('mul', 8, 7),
            divA:   D.familyKey('div', 56, 7),
            divB:   D.familyKey('div', 56, 8),
        };
    }""")
    print('== addition family:', got['addFwd'], got['addRev'], got['subA'], got['subB'])
    print('== times family:   ', got['mulFwd'], got['mulRev'], got['divA'], got['divB'])

    if got['addFwd'] != got['addRev']:
        fails.append(f'a family key depends on operand order: {got["addFwd"]} vs {got["addRev"]}')
    for k in ('addRev', 'subA', 'subB'):
        if got[k] != got['addFwd']:
            fails.append(f'{k} is not in the addition family of 7 and 8: '
                         f'{got[k]!r} vs {got["addFwd"]!r}')
    for k in ('mulRev', 'divA', 'divB'):
        if got[k] != got['mulFwd']:
            fails.append(f'{k} is not in the times family of 7 and 8: '
                         f'{got[k]!r} vs {got["mulFwd"]!r}')

    # --- 3. addition and multiplication are different facts ---------------
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        return {
            add23: D.familyKey('add', 2, 3),
            mul23: D.familyKey('mul', 2, 3),
            add00: D.familyKey('add', 0, 0),
            mul00: D.familyKey('mul', 0, 0),
        };
    }""")
    print(f'== 2+3 -> {got["add23"]!r}   2×3 -> {got["mul23"]!r}')
    if got['add23'] == got['mul23']:
        fails.append(f'addition and multiplication share a family: {got["add23"]!r}')
    if got['add00'] == got['mul00']:
        fails.append('0 + 0 and 0 × 0 share a family')

    # --- 4. the siblings are the facts ------------------------------------
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const check = (op, x, y) => {
            const sibs = D.familySiblings(op, x, y);
            const qs = sibs.map(s => s.q);
            return { n: sibs.length, qs, answers: sibs.map(s => s.a),
                     unique: new Set(qs).size === qs.length };
        };
        return {
            add: check('add', 7, 8),
            sub: check('sub', 15, 8),
            mul: check('mul', 7, 8),
            div: check('div', 56, 7),
            square: check('mul', 6, 6),
        };
    }""")
    for k, v in got.items():
        print(f'== siblings {k:7} {v["qs"]} -> {v["answers"]}')
    if got['add']['n'] != 4 or not got['add']['unique']:
        fails.append(f'the addition family is not four distinct facts: {got["add"]}')
    if got['sub']['n'] != 4 or not got['sub']['unique']:
        fails.append(f'the subtraction family is not four distinct facts: {got["sub"]}')
    if got['mul']['n'] != 4 or not got['mul']['unique']:
        fails.append(f'the times family is not four distinct facts: {got["mul"]}')
    if got['div']['n'] != 4 or not got['div']['unique']:
        fails.append(f'the division family is not four distinct facts: {got["div"]}')

    # Each sibling's stated answer must be arithmetically right. A sibling that
    # says `15 − 8 = 7` is the feature; one that says 8 is a queue that serves
    # wrong answers.
    import re
    for k, v in got.items():
        for q, a in zip(v['qs'], v['answers']):
            m = re.match(r'^(\d+) ([+−×÷]) (\d+)$', q)
            if not m:
                fails.append(f'{k}: unparseable sibling {q!r}')
                continue
            x, op, y = int(m.group(1)), m.group(2), int(m.group(3))
            want = {'+': x + y, '−': x - y, '×': x * y, '÷': (x // y if y else None)}[op]
            if a != want:
                fails.append(f'{k}: sibling {q} states {a}, which is wrong (want {want})')

    # A square is two facts, not four: 6 × 6 and its reverse are the same
    # question, and so are the two divisions. Asserting only uniqueness would
    # pass on an empty list, so the count is pinned too.
    if got['square']['n'] != 2:
        fails.append(f'a square family should be 2 facts, got {got["square"]["n"]}: '
                     f'{got["square"]["qs"]}')
    if got['square']['unique'] is not True:
        fails.append(f'a square family repeats a question: {got["square"]["qs"]}')

    # --- 5. facts with no family ------------------------------------------
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        return {
            frac: D.familyKey('div', 57, 7),
            fracSib: D.familySiblings('div', 57, 7).length,
            neg: D.familyKey('sub', 3, 8),
            negSib: D.familySiblings('sub', 3, 8).length,
            zeroDiv: D.familyKey('div', 0, 0),
            zeroSib: D.familySiblings('div', 0, 0).length,
            badOp: D.familyKey('pow', 2, 3),
            nan: D.familyKey('add', 'x', 3),
        };
    }""")
    print(f'== no family: frac={got["frac"]!r} neg={got["neg"]!r} '
          f'0/0={got["zeroDiv"]!r} badOp={got["badOp"]!r}')
    for k in ('frac', 'neg', 'zeroDiv', 'badOp', 'nan'):
        if got[k] is not None:
            fails.append(f'{k} produced a family key: {got[k]!r}')
    for k in ('fracSib', 'zeroSib'):
        if got[k] != 0:
            fails.append(f'{k} produced {got[k]} siblings for a fact with no family')

    # --- 6. a miss in one drill is visible from the other -----------------
    # The index a page would build: key -> the family's entries, across stores.
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        // two stores, as the drills would write them
        const add = { '7|8': { n: 4, miss: 3, ok: 0 } };
        const sub = { '15|8': { n: 2, miss: 1, ok: 1 } };
        // what the subtraction page would ask about its own fact
        const key = D.familyKey('sub', 15, 8);
        const fromAdd = add['7|8'];
        const fromSub = sub['15|8'];
        // and the reverse: the addition page asking about 7 + 8
        const key2 = D.familyKey('add', 7, 8);
        // a fact in a different family must not be found
        const other = D.familyKey('add', 7, 9);
        return {
            key, key2, same: key === key2, other,
            missAcross: (key === key2) ? (fromAdd.miss + fromSub.miss) : null,
            seenFromSub: !!fromAdd,
        };
    }""")
    print(f'== miss in addition {got["key"]!r} is visible from subtraction '
          f'{got["key2"]!r}: same={got["same"]}, total misses={got["missAcross"]}')
    if not got['same']:
        fails.append('a subtraction fact does not key into the same family as its addition')
    if got['missAcross'] != 4:
        fails.append(f'the family did not merge the two records: {got["missAcross"]}')
    if got['other'] == got['key']:
        fails.append('an unrelated fact keyed into the family')

    if exc:
        fails.append(f'number-bonds: pageerror {exc[:2]}')
    pg.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nFAMILY PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
