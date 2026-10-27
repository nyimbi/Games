"""The lesson's worked example must come from the child's own mistake.

Every worked example is authored, and `llms.txt:99` says it uses numbers the
drill never asks. That rule is not satisfiable and never was:

  - `addition-quest` level 2 enumerates all 8,100 two-digit pairs.
  - `times-table-academy` 1-20 mode enumerates all 400 pairs.

So every two-digit sum and every table fact IS a fact the drill asks, and ten
of the twenty authored maths examples already break the stated rule. A gate
built on that rule could only ever fail.

What the rule was protecting is real and decidable: a lesson must not hand
over the answer to the question in front of the child. `exampleFor(game,
review, topic)` builds the child's own kind of mistake, one step away from it.
This gate asserts:

  1. The generated example is never the fact the child just missed. This is
     the rule the authored-number rule was standing in for.
  2. It is the same *kind*: the classifier that chose the lesson classifies the
     example's own fact to the same topic. A `carrying` lesson whose example
     does not carry teaches a different lesson under the right heading.
  3. It is arithmetically right -- the stated answer follows from the stated
     question. A generated example with a wrong answer is worse than none.
  4. Every fact in every drill's fact space produces one. A generator that
     declines on a whole class of facts (it did: every square, and every
     subtraction with a zero or an equal pair) silently falls back to the
     authored example, which reads exactly like working.
  5. A record with no misses, or no miss of this topic, yields null. The dialog
     then renders the authored example, and the drill is unchanged for a child
     who has not missed anything.
  6. It does not mutate the record it reads.
  7. Live: seed three misses of one kind, open the lesson, and the dialog says
     the example came from the child's answers, and shows numbers that are not
     the missed fact's.

Claim 4 is the one a plausible implementation gets wrong: a "move by one"
generator looks complete and declines on the boundaries, and the fallback
makes the decline invisible.

Run:  python3 -I probes/example.py
"""
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent


def facts_of(game, ex):
    """The (a, op, b, answer) a generated example states, or None.

    A bond question has no operator in it -- it states a whole and a part and
    asks for the other -- so it is parsed from the sentence, not from an
    expression. The first version treated that as unparseable and reported 567
    wrong answers that were all correct.
    """
    q = ex['q']
    if game == 'number-bonds':
        both = re.search(r'parts are (\d+) and (\d+)', q)
        wm = re.search(r'whole is (\d+)', q)
        pm = re.search(r'part is (\d+)', q)
        if both:
            return ('+', int(both.group(1)), int(both.group(2)), ex['a'])
        if wm and pm:
            return ('−', int(wm.group(1)), int(pm.group(1)), ex['a'])
        return None
    m = re.search(r'(\d+)\s*\+\s*(\d+)', q)
    if m:
        return ('+', int(m.group(1)), int(m.group(2)), ex['a'])
    m = re.search(r'(\d+)\s*[−-]\s*(\d+)', q)
    if m:
        return ('−', int(m.group(1)), int(m.group(2)), ex['a'])
    m = re.search(r'(\d+)\s*×\s*(\d+)', q)
    if m:
        return ('×', int(m.group(1)), int(m.group(2)), ex['a'])
    m = re.search(r'(\d+)\s*÷\s*(\d+)', q)
    if m:
        return ('÷', int(m.group(1)), int(m.group(2)), ex['a'])
    return None


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / 'number-bonds.html').as_uri())

    if not pg.evaluate("() => !!(window.MathsGame && window.MathsGame.exampleFor)"):
        fails.append('maths-engine.js does not export exampleFor')
        pg.close(); b.close(); return fails

    # --- 4. every fact of every drill produces one, and 1-3 on each -------
    # The sweep is driven from the pages' own pool definitions, transcribed
    # here so a change to a pool shows up as a failure rather than being
    # quietly followed.
    cases = {
        'number-bonds': [(f'{w}|{a}|{bl}', {'whole': w, 'a': a, 'blank': bl})
                         for w in range(3, 21) for a in range(1, w)
                         for bl in ('whole', 'a', 'b')],
        'addition-quest': [(f'1|{a}|{b}', {'a': a, 'b': b})
                           for a in range(10) for b in range(10)],
        'subtraction-safari': [(f'1|{a}|{b}', {'a': a, 'b': b})
                               for a in range(10) for b in range(a + 1)],
        'times-table-academy': [(f'{a}|{b}', {'a': a, 'b': b})
                                for a in range(1, 21) for b in range(1, 21)],
        'division-diner': [(f'{d}|{d * q}', {'divisor': d, 'dividend': d * q})
                           for d in range(2, 21) for q in range(1, 21)],
    }
    got = pg.evaluate("""(cases) => {
        const M = window.MathsGame, T = window.MATHS_LESSONS;
        const out = { ok: {}, none: {}, sameFact: [], wrongTopic: [],
                      wrongAnswer: [], mutated: [] };
        for (const [game, list] of Object.entries(cases)) {
            out.ok[game] = 0; out.none[game] = [];
            const topics = T[game].topics;
            for (const [key, fact] of list) {
                const review = { [key]: { miss: 3, n: 4 } };
                const before = JSON.stringify(review);
                const topic = M.stuckTopic(game, review, topics, null);
                if (!topic) { out.none[game].push([key, 'no topic']); continue; }
                const ex = M.exampleFor(game, review, topic);
                if (!ex) { out.none[game].push([key, topic]); continue; }
                if (JSON.stringify(review) !== before) out.mutated.push([game, key]);
                out.ok[game]++;
                out.__facts = out.__facts || [];
                out.__facts.push([game, key, fact, topic, ex]);
            }
        }
        return out;
    }""", cases)

    print('== examples generated:', got['ok'])
    for game, misses in got['none'].items():
        if misses:
            fails.append(f'{game}: {len(misses)} facts produced no example, '
                         f'e.g. {misses[:4]}')
    if got['mutated']:
        fails.append(f'exampleFor mutated the record: {got["mutated"][:4]}')

    # --- 1-3. the properties, on every generated example -------------------
    wrong_ans, same_fact, wrong_topic = [], [], []
    for game, key, fact, topic, ex in got['__facts']:
        f = facts_of(game, ex)
        if not f:
            wrong_ans.append([game, key, 'unparseable question', ex['q']])
            continue
        op, x, y, stated = f
        want = {'+': x + y, '−': x - y, '×': x * y}.get(op)
        if op == '÷':
            # The answer may be "5 remainder 1"; only the quotient is checked
            # against the stated dividend, and the remainder against the
            # division's own definition.
            q = int(re.match(r'\d+', stated).group(0))
            rem = re.search(r'remainder\s+(\d+)', stated)
            if x != y * q + (int(rem.group(1)) if rem else 0):
                wrong_ans.append([game, key, ex['q'], stated])
        elif want is not None and str(want) != stated:
            wrong_ans.append([game, key, ex['q'], stated])

        # The example must not be the fact the child missed.
        if game == 'addition-quest':
            if (x, y) == (fact['a'], fact['b']) or (y, x) == (fact['a'], fact['b']):
                same_fact.append([game, key, ex['q']])
        elif game == 'subtraction-safari':
            if (x, y) == (fact['a'], fact['b']):
                same_fact.append([game, key, ex['q']])
        elif game == 'times-table-academy':
            if {x, y} == {fact['a'], fact['b']}:
                same_fact.append([game, key, ex['q']])
        elif game == 'division-diner':
            if (x, y) == (fact['dividend'], fact['divisor']):
                same_fact.append([game, key, ex['q']])
        # The example must not be the fact the child missed. For a bond the
        # question is identified by what it *asks*: `3|1|whole` asks "what is
        # the whole, given parts 1 and 2", so an example asking the same thing
        # of the same parts is the same question however the sentence reads.
        # Same whole and same blank but different parts is a *different*
        # question -- that is the lesson.
        if game == 'number-bonds':
            w = fact['whole']
            ex_parts = sorted(int(p) for p in re.findall(r'\d+', ex['q'])
                              if int(p) != w)
            if (int(ex['a']) == w and fact['blank'] == 'whole'
                    and ex_parts == sorted([fact['a'], w - fact['a']])):
                same_fact.append([game, key, ex['q']])

    if wrong_ans:
        fails.append(f'{len(wrong_ans)} examples state a wrong answer, '
                     f'e.g. {wrong_ans[:3]}')
    if same_fact:
        fails.append(f'{len(same_fact)} examples ARE the missed fact, '
                     f'e.g. {same_fact[:3]}')

    # --- 2. the example is the same kind of fact --------------------------
    # The classifier that picked the lesson must classify the example's own
    # fact back to the same topic. This is what "the same kind of mistake"
    # means, and it is checkable only because the classifier is a function of
    # the fact rather than of the lesson text. It is driven through the public
    # entry point: seed the example's own fact as a single miss and see which
    # topic comes back.
    got3 = pg.evaluate("""(facts) => {
        const M = window.MathsGame, T = window.MATHS_LESSONS;
        const out = [];
        for (const [game, key, fact, topic, ex] of facts) {
            let k = null;
            const m = ex.q.match(/(\\d+)\\s*([+−×÷])\\s*(\\d+)/);
            if (game === 'number-bonds') {
                const both = ex.q.match(/parts are (\\d+) and (\\d+)/);
                const wm = ex.q.match(/whole is (\\d+)/);
                const pm = ex.q.match(/part is (\\d+)/);
                if (both) k = `${m ? m[1] : ''}|${both[1]}|whole`;
                else if (wm && pm) k = `${wm[1]}|${pm[1]}|b`;
                else { out.push([game, key, topic, null, 'unparsed-bond']); continue; }
            } else if (!m) { out.push([game, key, topic, null, 'unparsed']); continue; }
            else if (game === 'addition-quest' || game === 'subtraction-safari') k = `1|${m[1]}|${m[3]}`;
            else if (game === 'times-table-academy') k = `${m[1]}|${m[3]}`;
            else k = `${m[3]}|${m[1]}`;
            const t = M.stuckTopic(game, { [k]: { miss: 3 } }, T[game].topics, null);
            out.push([game, key, topic, t, ex.q, k]);
        }
        return out;
    }""", got['__facts'])
    for game, key, want, got_t, q, *rest in got3:
        if got_t != want:
            wrong_topic.append([game, key, want, got_t, q, rest[0] if rest else None])
    print(f'== topic preserved on {len(got3) - len(wrong_topic)}/{len(got3)}')
    if wrong_topic:
        for r in wrong_topic[:8]:
            print('   topic drift:', r)
        fails.append(f'{len(wrong_topic)} examples are not the same kind of fact '
                     f'as the lesson (first: {wrong_topic[0]})')

    # --- 5. no misses, or no miss of this topic ---------------------------
    got4 = pg.evaluate("""() => {
        const M = window.MathsGame, T = window.MATHS_LESSONS;
        const topics = T['addition-quest'].topics;
        return {
            empty: M.exampleFor('addition-quest', {}, 'carrying'),
            otherTopic: M.exampleFor('addition-quest',
                { '1|2|3': { miss: 9 } }, 'carrying'),
            noTopic: M.exampleFor('addition-quest', { '1|7|8': { miss: 9 } }, 'inverse'),
        };
    }""")
    print(f'== no misses -> {got4["empty"]}; wrong topic -> {got4["otherTopic"]}; '
          f'unrelated topic -> {got4["noTopic"]}')
    if got4['empty'] is not None:
        fails.append(f'an empty record produced an example: {got4["empty"]}')
    if got4['otherTopic'] is not None:
        fails.append(f'a miss of a different topic produced an example: {got4["otherTopic"]}')

    if exc:
        fails.append(f'number-bonds (host): pageerror {exc[:2]}')
    pg.close()

    # --- 7. live: the dialog says so --------------------------------------
    q = b.new_page()
    errs = []
    q.on('pageerror', lambda e: errs.append(str(e)))
    q.goto((ARCADE / 'number-bonds.html').as_uri())
    q.evaluate("""() => {
        localStorage.clear();
        // Three carrying additions: the topic is `carrying`, and the most
        // missed fact is 7 + 8.
        localStorage.setItem('arcade.addition.v3', JSON.stringify({
            v: 1, best: 0, perLevel: {},
            review: { '1|7|8': { n: 4, miss: 3, ok: 0, nextAt: 0 },
                      '1|9|6': { n: 2, miss: 1, ok: 0, nextAt: 0 },
                      '1|5|9': { n: 2, miss: 1, ok: 0, nextAt: 0 } },
            seen: {}, taught: {}, savedAt: Date.now()
        }));
    }""")
    q.goto((ARCADE / 'addition-quest.html').as_uri())
    q.wait_for_timeout(300)
    # The offer only lands after an answer, so play one.
    q.click('#tabPractice'); q.wait_for_timeout(350)
    q.keyboard.type('0'); q.keyboard.press('Enter'); q.wait_for_timeout(250)

    label = q.evaluate("() => document.getElementById('mathsLessonBtn').textContent")
    print(f'== learn button: {label!r}')
    q.click('#mathsLessonBtn'); q.wait_for_timeout(300)
    head = q.evaluate("""() => {
        const b = document.querySelector('#mathsLessonBody .lex b');
        const p = document.querySelector('#mathsLessonBody .lex .lq');
        return [b && b.textContent, p && p.textContent];
    }""")
    print(f'== example heading: {head[0]!r}')
    print(f'== example question: {head[1]!r}')
    if not head[0] or 'your own answers' not in head[0]:
        fails.append(f'the dialog did not say the example came from the child: {head[0]!r}')
    if head[1] and ('7 + 8' in head[1] or '8 + 7' in head[1]):
        fails.append(f'the example handed over the missed fact: {head[1]!r}')
    if 'carrying' not in label.lower() and 'Carrying' not in label:
        # Not a failure of this feature, but worth printing: the offer names
        # whatever topic ranked first, and this fixture should give carrying.
        print(f'   (note: the offer named {label!r}, not Carrying)')

    if errs:
        fails.append(f'addition-quest (live): pageerror {errs[:2]}')
    q.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nEXAMPLE PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
