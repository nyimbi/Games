"""Every question is a sum, and a sum is not the only way to meet a fact.

F-21. The five maths drills ask `7 + 8`, `15 − 8`, `56 ÷ 7` -- symbols only.
That is the right form to drill a fact in and the wrong form to find out
whether the child can use it: a word problem fails for reasons that are not
arithmetic, which is exactly what a drill that never asks one cannot see.

`wordproblems.js` is a template layer over the fact, not over the pool. A page
hands over the question it built; the module returns a story whose answer is
that question's answer, or null and the page shows the sum. Every fourth
question is a story, never the first two -- those carry the worked example.

  1. Every drill's question shape maps to a fact, and the fact's answer is the
     answer the drill grades against. A mapping that silently disagreed would
     produce a story asking for one number and a box grading another.
  2. The story's answer equals the fact's answer, over every fact in every
     pool. This is the claim the feature exists for.
  3. The story asks a question in words. A template that states the numbers
     without saying what to do with them is a comprehension test wearing an
     arithmetic question's clothes.
  4. No red herring: the story carries exactly the two operands as numerals,
     and never a third. Where the answer coincides with an operand -- 16 − 8
     = 8 -- the numeral cannot be avoided, and those are counted, not excused.
  5. The noun agrees with the count. "1 apples" is the tell of a generator,
     and it is one function to get right.
  6. Two people in one story are two people, and two containers are two
     containers.
  7. Coverage: every fact in a pool that a story can plausibly be told about
     gets one, and the ones that do not are three-digit sums, where every
     story would need an absurd noun. Reported, not failed.
  8. The page: a story appears on every fourth question and not the first two,
     the symbolic question is hidden while it is up and restored when it is
     not, and typing the story's answer is marked right.
  9. No second copy of the templates in any of the five pages.

Run:  python3 -I probes/wordproblems.py
"""
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
PAGES = ['number-bonds.html', 'addition-quest.html', 'subtraction-safari.html',
         'times-table-academy.html', 'division-diner.html']


def run(pw):
    fails = []
    b = pw.chromium.launch()

    # --- 1..7. the module, over the real pools ---------------------------
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / 'number-bonds.html').as_uri())
    if not pg.evaluate("() => !!window.ArcadeStory"):
        fails.append('wordproblems.js did not load on number-bonds: ' + str(exc[:2]))
        pg.close(); b.close(); return fails

    got = pg.evaluate("""() => {
        const S = window.ArcadeStory;
        const out = { problems: [] };

        // The pools, rebuilt from each drill's own enumeration. These are the
        // numbers the drills actually ask, not a sample.
        const pools = {
            'number-bonds': [],
            'addition-quest': [],
            'subtraction-safari': [],
            'times-table-academy': [],
            'division-diner': []
        };
        for (let a = 0; a <= 10; a++) pools['number-bonds'].push({ whole: 10, a, b: 10 - a, blank: 'whole' });
        for (let w = 5; w <= 12; w++) for (let a = 0; a <= w; a++) pools['number-bonds'].push({ whole: w, a, b: w - a, blank: 'a' });
        for (let a = 0; a <= 9; a++) for (let bb = 0; bb <= 9; bb++) pools['addition-quest'].push({ a, b: bb });
        for (let a = 10; a <= 30; a++) for (let bb = 0; bb <= a; bb++) pools['subtraction-safari'].push({ a, b: bb });
        for (let a = 1; a <= 10; a++) for (let bb = 1; bb <= 10; bb++) pools['times-table-academy'].push({ a, b: bb });
        for (const d of [2, 3, 4, 5, 10]) for (let q = 1; q <= 20; q++) {
            pools['division-diner'].push({ dividend: d * q, divisor: d, quotient: q });
        }

        let r = 20260101;
        const rnd = () => { r = (r * 1103515245 + 12345) % 2147483648; return r / 2147483648; };

        // 1. the mapping, and the answer it implies.
        const mapBad = [];
        const drillAnswer = {
            'number-bonds': q => q.blank === 'whole' ? q.whole : (q.blank === 'a' ? q.a : q.b),
            'addition-quest': q => q.a + q.b,
            'subtraction-safari': q => q.a - q.b,
            'times-table-academy': q => q.a * q.b,
            'division-diner': q => q.quotient
        };
        for (const [game, pool] of Object.entries(pools)) {
            for (const q of pool) {
                const f = S.factOf(game, q);
                if (!f) { mapBad.push(game + ' ' + JSON.stringify(q) + ' -> null'); continue; }
                if (f.answer !== drillAnswer[game](q)) {
                    mapBad.push(game + ' ' + JSON.stringify(q) + ' fact says ' + f.answer
                              + ', the drill grades ' + drillAnswer[game](q));
                }
            }
        }
        out.mapping = { n: Object.values(pools).reduce((n, p) => n + p.length, 0), bad: mapBad.slice(0, 5) };
        if (mapBad.length) out.problems.push(`${mapBad.length} facts map to the wrong answer: ` + mapBad.slice(0, 3).join(' | '));

        // 2..6. the stories themselves.
        const wrongAnswer = [], noQuestion = [], herring = [], numberDoubt = [];
        const unitBad = [], nameBad = [], coincident = [];
        let told = 0, total = 0, unanswered = 0;
        const byGame = {};
        for (const [game, pool] of Object.entries(pools)) {
            byGame[game] = { n: pool.length, told: 0 };
            for (const q of pool) {
                total++;
                const s = S.storyFor(game, q, rnd);
                if (!s) { unanswered++; continue; }
                told++; byGame[game].told++;
                // 2. the answer.
                if (s.answer !== s.expect) {
                    wrongAnswer.push(`${game} ${s.id}: story answers ${s.answer}, the fact is ${s.expect}`);
                }
                // 3. it asks something.
                if (!/\\?\\s*$/.test(s.text)) noQuestion.push(`${s.id}: ${s.text}`);
                // 4. The numerals, as a SET, because the two operands may be
                // equal: "5 shells ... and 5 shells" for 5 + 5 carries the
                // numeral twice and nothing else, and comparing a deduplicated
                // list against a non-deduplicated one reports every square
                // fact as a red herring. The one number the template may spell
                // in words is a container count of one -- "There is one jar,
                // with 2 marbles in it" -- which is why that branch exists and
                // why the count of numerals alone is not the test.
                const nums = (s.text.match(/\\d+/g) || []).map(Number);
                const words = /\\bone\\b/.test(s.text) ? [1] : [];
                const spelled = s.fact.x === 1 || s.fact.y === 1;
                const want = Array.from(new Set([s.fact.x, s.fact.y])).sort((p, q2) => p - q2).join(',');
                const have = Array.from(new Set(nums.concat(spelled ? words : [])))
                    .sort((p, q2) => p - q2).join(',');
                if (have !== want) {
                    // The other legal extra: the answer, when it is also an
                    // operand (16 - 8 = 8) or a price in the cost template.
                    const extra = Array.from(new Set(nums.filter(n => n !== s.fact.x && n !== s.fact.y)));
                    const onlyAnswer = extra.length > 0 && extra.every(n => n === s.answer);
                    if (onlyAnswer) coincident.push(s.id);
                    else herring.push(`${s.id}: numerals ${nums.join(',')} against operands ${s.fact.x},${s.fact.y} -- ${s.text}`);
                }
                // 5. The noun agrees with its count. Every numeral in the
                // story is followed by a noun or a unit, and the pair must
                // agree: "1 drawer", not "1 drawers"; "7 books", not "7 book".
                for (const m of s.text.matchAll(/(\\d+)\\s+([a-z]+)/g)) {
                    const n = +m[1], word = m[2];
                    const sing = S.UNITS.some(u => u.one === word) || S.PLACES.some(p => p.one === word);
                    const plur = S.UNITS.some(u => u.many === word) || S.PLACES.some(p => p.many === word);
                    if (!sing && !plur) continue;
                    if (n === 1 && plur) unitBad.push(`${s.id}: "${m[0]}" -- one of a plural noun`);
                    if (n !== 1 && sing) unitBad.push(`${s.id}: "${m[0]}" -- a count of a singular noun`);
                }
                // 6. Two people in one story are two people. The template
                // picks two distinct names by construction; this reads the
                // text back and checks the construction held.
                const names = S.NAMES.filter(n => new RegExp('(^|[^a-z])' + n + '([^a-z]|$)').test(s.text));
                if (names.length === 2 && names[0] === names[1]) nameBad.push(s.id);
            }
        }
        out.stories = { total, told, unanswered, byGame };
        if (wrongAnswer.length) out.problems.push(`${wrongAnswer.length} stories answer a different number: ` + wrongAnswer.slice(0, 3).join(' | '));
        if (noQuestion.length) out.problems.push(`${noQuestion.length} stories do not ask a question: ` + noQuestion.slice(0, 2).join(' | '));
        if (herring.length) out.problems.push(`${herring.length} stories carry a number that is neither operand: ` + herring.slice(0, 3).join(' | '));
        if (unitBad.length) out.problems.push(`${unitBad.length} nouns disagree with their count: ` + unitBad.slice(0, 3).join(' | '));
        if (nameBad.length) out.problems.push(`${nameBad.length} stories name one person twice: ` + nameBad.slice(0, 2).join(' | '));
        out.coincident = coincident.length;

        // 7. coverage. Every pool whose numbers fit a story should get one;
        // the drill with no story at all is the finding.
        for (const [game, s] of Object.entries(byGame)) {
            if (s.told === 0) out.problems.push(`${game}: no fact in its pool has a story`);
        }

        // The three-digit case, which is expected to have no story.
        const big = S.storyFor('addition-quest', { a: 347, b: 288 }, rnd);
        out.big = big ? big.text : null;
        if (big) out.problems.push('a three-digit sum got a story: ' + big.text);

        // The sample the report prints.
        out.sample = S.storyFor('addition-quest', { a: 7, b: 8 }, rnd);
        out.samples = Object.keys(pools).map(g => {
            const s = S.storyFor(g, pools[g][Math.floor(pools[g].length / 3)], rnd);
            return { game: g, id: s && s.id, text: s && s.text, answer: s && s.answer };
        });
        return out;
    }""")

    print(f'== {got["mapping"]["n"]} facts mapped; {got["stories"]["told"]} of {got["stories"]["total"]} '
          f'have a story, {got["coincident"]} where the answer is also an operand')
    for g, s in got['stories']['byGame'].items():
        print(f'   {g:<24} {s["told"]}/{s["n"]}')
    for s in got['samples']:
        print(f'   [{s["id"]}] {s["text"]} -> {s["answer"]}')
    print(f'== a three-digit sum gets {"a story" if got["big"] else "no story"}')
    for p in got['mapping']['bad']:
        fails.append('fact mapped wrong: ' + p)
    for p in got['problems'][:10]:
        fails.append(p)
    if len(got['problems']) > 10:
        fails.append(f'... and {len(got["problems"]) - 10} more story problems')
    pg.close()

    # --- 8. the pages ----------------------------------------------------
    specs = [
        ('number-bonds.html', '#playBtn', None, '.bonds'),
        ('addition-quest.html', '#tabPractice', '#practice .lv[data-level="1"]', '#qTop'),
        ('subtraction-safari.html', '#tabPractice', '#practice .lv[data-level="1"]', '#qTop'),
        ('times-table-academy.html', '#tabPractice', '#practice .lv[data-mode="1-10"]', '.qcard'),
        ('division-diner.html', '#tabPractice', '#practice .lv[data-level="1-5"]', '.qcard'),
    ]
    for page, first, second, digits in specs:
        p = b.new_page()
        errs = []
        p.on('pageerror', lambda e: errs.append(str(e)))
        p.goto((ARCADE / page).as_uri())
        p.wait_for_timeout(200)
        try:
            p.click(first, timeout=4000)
            p.wait_for_timeout(250)
            if second:
                p.click(second, timeout=4000)
                p.wait_for_timeout(250)
        except Exception as e:
            fails.append(f'{page}: could not start the drill -- {str(e)[:90]}')
            p.close(); continue

        pattern = []
        graded = 0
        last_q = None
        for _ in range(8):
            st = p.evaluate("""(sel) => {
                const box = document.getElementById('storyBox');
                const d = document.querySelector(sel);
                const cur = window.ArcadeStory.shown();
                return {
                    qnum: (document.getElementById('qnum') || {}).textContent || '',
                    on: !!(box && box.classList.contains('on')),
                    text: box ? box.textContent : '',
                    hidden: d ? d.style.display === 'none' : null,
                    ask: (document.getElementById('ask') || {}).textContent || '',
                    answer: cur ? cur.answer : null
                };
            }""", digits)
            # A correct answer auto-advances in some drills and waits for the
            # Next button in others. Reading `qnum` is what tells the two
            # apart: if it did not change, the page is still on the same
            # question and clicking Next would skip one.
            if st['qnum'] == last_q:
                fails.append(f'{page}: still on question {st["qnum"]} after answering; the loop cannot advance')
                break
            # And it must advance by exactly one. A jump of two is a question
            # never shown -- which shifts every later story off the index the
            # module decided on, and reads as "no story here" rather than as
            # the skip it is.
            if last_q is not None and st['qnum'].isdigit() and last_q.isdigit():
                if int(st['qnum']) - int(last_q) != 1:
                    fails.append(f'{page}: question {last_q} advanced to {st["qnum"]}, not the next one')
            last_q = st['qnum']

            pattern.append('S' if st['on'] else '.')
            typed = '0'
            if st['on']:
                if st['hidden'] is False:
                    fails.append(f'{page}: a story is showing and the symbolic question is still visible')
                if st['ask'] != 'Story sum':
                    fails.append(f'{page}: the story is up but the ask line still reads {st["ask"]!r}')
                if st['answer'] is None:
                    fails.append(f'{page}: a story is on screen and the module does not know its answer')
                else:
                    # The story's own answer, typed into the page's own box and
                    # graded by the page's own check. This is the claim: the
                    # story and the drill agree on which number is right.
                    typed = str(st['answer'])
                    graded += 1
            elif st['hidden'] is True:
                fails.append(f'{page}: no story, but the symbolic question is still hidden')
            p.keyboard.type(typed)
            p.keyboard.press('Enter')
            p.wait_for_timeout(300)
            if st['on']:
                # The toast is the only success signal the five drills share;
                # `dFb` exists on the language pages, not here.
                ok = p.evaluate("""() => {
                    const t = document.getElementById('toast');
                    return !!(t && /\\bgood\\b/.test(t.className));
                }""")
                if not ok:
                    got_toast = p.evaluate("() => (document.getElementById('toast') || {}).textContent || ''")
                    fails.append(f'{page}: typed the story\'s own answer {typed} and it was not marked right '
                                 f'(toast: {got_toast!r})')
            # Only click Next when the drill is waiting for it. A drill that
            # auto-advances hides the button again after the delay.
            if p.evaluate("() => { const n = document.getElementById('nextBtn'); return !!(n && !n.hidden); }"):
                p.click('#nextBtn')
            p.wait_for_timeout(850)
        seq = ''.join(pattern)
        print(f'== {page:<24} {seq}  ({graded} story answers graded)')
        # The cadence is deterministic -- `wanted(index)` is true at 3, 7, 11 --
        # but whether the fact at that index has a story is not: a subtraction
        # with b = 0 has none, and the deck is shuffled. So the claim is about
        # which positions may hold a story, not which do.
        #
        # A bound of "at most three in eight" was the first version, and the
        # canary that halved the interval passed it: two questions in four is
        # three in eight, and three was allowed.
        if 'S' in seq[:3]:
            fails.append(f'{page}: a story on question {seq.index("S") + 1}; '
                         f'the first three carry the worked example and must not')
        stray = [i + 1 for i, c in enumerate(seq) if c == 'S' and i not in (3, 7)]
        if stray:
            fails.append(f'{page}: stories on questions {stray}; the cadence puts them at 4 and 8')
        if 'S' not in seq[3:]:
            fails.append(f'{page}: no story in eight questions; the cadence puts one at question 4')
        if errs:
            fails.append(f'{page}: pageerror {errs[:2]}')
        p.close()

    # --- 9. no second copy of the templates -------------------------------
    mod = (ARCADE / 'wordproblems.js').read_text()
    for page in PAGES:
        s = (ARCADE / page).read_text()
        body = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
        body = re.sub(r'^\s*//.*$', '', body, flags=re.M)
        for pat, what in [
            (r'How many .* are left', 'a story template'),
            (r"'apple',\s*many", 'the unit table'),
        ]:
            if re.search(pat, body):
                fails.append(f'{page} carries {what}; the module is not the only copy')
        if 'ArcadeStory' not in body:
            fails.append(f'{page} never calls ArcadeStory')
    if 'ArcadeStory' not in mod:
        fails.append('wordproblems.js does not export ArcadeStory')

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nWORD PROBLEMS PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
