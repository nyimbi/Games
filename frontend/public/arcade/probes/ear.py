"""A wrong ear answer is followed by the sound of the difference.

F-26. `piano-engine.js`'s `hear` mode already plays intervals and chords with
the staff hidden -- the drill F-26 asks for was there. What was missing is the
half after the answer: the child was told the right name and moved on, so the
interval they chose and the one that was played were never adjacent. A major
third and a minor third differ by one semitone and are learned by hearing them
back to back.

`ear.js` turns a wrong answer into that comparison: the child's interval, then
the played one, on the same root and in the same direction. It is pure, so the
claims are about MIDI numbers rather than about what a speaker did.

  1. The semitone table agrees with the bank. The bank has its own list of
     interval names and its own semitone strings; two tables that disagree is
     a comparison played one semitone out, which is the exact confusion the
     feature exists to teach.
  2. `compare` rebuilds the played interval exactly when the child's answer is
     the right one -- so the second segment is the sound they already heard,
     not a near miss.
  3. Direction is preserved. The bank asks descending intervals too, and a
     comparison played ascending would be a different question.
  4. The two segments are the child's answer first, then the right one.
  5. A note-naming question has no comparison. The child chose a letter, not
     a sound; `compare` returns null and the page replays instead.
  6. Chords rebuild by quality on the played root.
  7. The page plays it: a wrong hear-mode answer produces the label, and a
     right one does not.

Run:  python3 -I probes/ear.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
PAGE = (ARCADE / 'piano.html').as_uri()


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto(PAGE)

    if not pg.evaluate("() => !!(window.ArcadeEar && window.PIANO_BANK)"):
        fails.append('ear.js or the bank did not load: '
                     + (f'page errors {exc[:2]}' if exc else 'no page error'))
        pg.close(); b.close(); return fails

    # --- 1..6. the comparison, over the real bank -----------------------
    got = pg.evaluate("""() => {
        const E = window.ArcadeEar, BANK = window.PIANO_BANK;
        const out = { problems: [], intervals: 0, chords: 0, notes: 0, rebuilt: 0 };

        // 1. the semitone table against the bank's own strings. The bank's
        // interval questions carry `explain` like '... is 4 semitones, which
        // is a major 3rd.' -- parse the number rather than trusting a second
        // hand-written table.
        const ivs = BANK.filter(q => q.kind === 'interval');
        for (const q of ivs) {
            const m = /is (\\d+) semitones/.exec(q.explain || '');
            if (!m) { out.problems.push(q.a + ': no semitone count in explain'); continue; }
            if (E.SEMITONES[q.a] !== +m[1]) {
                out.problems.push(q.a + ': table says ' + E.SEMITONES[q.a] + ', bank says ' + m[1]);
            }
            out.intervals++;
        }

        // 2 + 3 + 4. for every interval question, compare against its own
        // right answer's neighbours, and check the right segment reproduces
        // the played notes exactly.
        for (const q of ivs) {
            const cmp = E.compare(q, q.a === q.d1 ? q.d2 : q.d1);
            if (!cmp) { out.problems.push(q.a + ': compare returned null for a real wrong answer'); continue; }
            if (cmp.labelB !== q.a) out.problems.push(q.a + ': labelB is ' + cmp.labelB);
            // the second segment is what was played
            const want = q.play.slice().sort((x, y) => x - y);
            const gotB = cmp.b.slice().sort((x, y) => x - y);
            if (want.join(',') !== gotB.join(',')) {
                out.problems.push(q.a + ': rebuilt ' + cmp.b.join(',') + ', played ' + q.play.join(','));
            } else out.rebuilt++;
            // direction: the sign of b[1]-b[0] must match the played sign
            const dirPlayed = Math.sign(q.play[1] - q.play[0]);
            if (Math.sign(cmp.b[1] - cmp.b[0]) !== dirPlayed) {
                out.problems.push(q.a + ': rebuilt interval runs the wrong way');
            }
            // 4. child's answer first
            const segs = E.segments(cmp);
            if (segs.length !== 2 || segs[0].label !== cmp.labelA || segs[1].label !== cmp.labelB) {
                out.problems.push(q.a + ': segments are not [chosen, right]');
            }
            if (segs[0].simul || segs[1].simul) out.problems.push(q.a + ': an interval was marked simultaneous');
        }

        // 5. a note-naming question has no comparison
        const notes = BANK.filter(q => q.kind === 'note');
        for (const q of notes.slice(0, 40)) {
            if (E.compare(q, q.d1) !== null) out.problems.push('note question ' + q.a + ' produced a comparison');
            out.notes++;
        }

        // 6. chords
        for (const q of BANK.filter(x => x.kind === 'chord')) {
            out.chords++;
            const wrong = q.d1;
            const cmp = E.compare(q, wrong);
            if (!cmp) { out.problems.push('chord ' + q.a + ': no comparison against ' + wrong); continue; }
            const root = q.play[0];
            if (cmp.b.join(',') !== q.play.join(',')) {
                out.problems.push('chord ' + q.a + ': rebuilt ' + cmp.b.join(',') + ', played ' + q.play.join(','));
            }
            // Only the named chords are in root position. An inversion's
            // lowest note is not its root -- that is the question -- so
            // asserting the rebuilt chord starts on `play[0]` is true for a
            // triad question and false for an inversion one.
            if (E.INVERSIONS.indexOf(q.a) < 0 && cmp.b[0] !== root) {
                out.problems.push('chord ' + q.a + ': rebuilt on a different root');
            }
            if (!E.segments(cmp).every(s => s.simul)) out.problems.push('chord ' + q.a + ': not played together');
        }

        // a right answer is not a comparison
        const q0 = ivs[0];
        if (E.compare(q0, q0.a) !== null) out.problems.push('a right answer produced a comparison');

        return out;
    }""")

    print(f'== {got["intervals"]} interval, {got["chords"]} chord, {got["notes"]} note questions; '
          f'{got["rebuilt"]} intervals rebuilt exactly')
    for p in got['problems'][:10]:
        fails.append(p)
    if len(got['problems']) > 10:
        fails.append(f'... and {len(got["problems"]) - 10} more comparison problems')
    if got['intervals'] == 0 or got['chords'] == 0:
        fails.append('the bank has no interval or no chord questions; the claims are vacuous')
    if got['rebuilt'] != got['intervals']:
        fails.append(f'only {got["rebuilt"]} of {got["intervals"]} intervals rebuilt to the played notes')

    # --- 7. the page plays it -------------------------------------------
    # Seed the deck so a playable interval or chord question comes up first.
    # The tier-1 hear pool is 34 questions, of which 16 are intervals or
    # chords; a queue drawn fresh can be all notes, and a note question has no
    # comparison to show. Marking the notes as seen puts them behind the rest,
    # which is the page's own `freshFirst` order rather than a new mechanism.
    pg.evaluate("""() => {
        const B = window.PIANO_BANK;
        const seen = { 't1:hear': {} };
        B.filter(q => q.tier === 1 && q.kind === 'note').forEach(q => { seen['t1:hear'][q.id] = Date.now(); });
        localStorage.setItem('arcade.piano.v1', JSON.stringify({
            v: 1, best: 0, seen, review: {}, perTier: {}, taught: {}, piecesDone: {},
            tier: 1, savedAt: Date.now()
        }));
    }""")
    pg.reload()
    pg.wait_for_timeout(300)
    pg.click('#modes [data-mode="hear"]')
    # A first run in a mode opens the lesson for that topic before the quiz.
    # The lesson is part of the flow, not a detour around it: the comparison
    # only makes sense once the child has been told what an interval is.
    if pg.evaluate("() => document.getElementById('lesson').classList.contains('on')"):
        pg.click('#lDone')
    pg.wait_for_selector('#quiz.on', timeout=5000)
    pg.wait_for_timeout(600)

    # Answer wrong deliberately, then read the label. The right answer is not
    # exposed, so click a choice and read the verdict off the feedback class
    # rather than assuming.
    # Click every choice in turn until one is wrong. A single click on the
    # first choice is right about a quarter of the time, and on those runs the
    # claim is not exercised -- the first version reported "not exercised" and
    # passed, which is a gate that skips itself. The page reloads between
    # attempts so each starts from a fresh question.
    exercised = False
    for attempt in range(6):
        if attempt:
            pg.reload()
            pg.wait_for_timeout(300)
            pg.click('#modes [data-mode="hear"]')
            if pg.evaluate("() => document.getElementById('lesson').classList.contains('on')"):
                pg.click('#lDone')
            pg.wait_for_selector('#quiz.on', timeout=5000)
            pg.wait_for_timeout(500)
        q = pg.evaluate("() => Array.from(document.querySelectorAll('#qChoices [data-opt]')).map(b => b.dataset.opt)")
        if not q:
            continue
        # Rotate which choice is clicked by attempt, so repeated reloads do not
        # keep picking the same option and keep being right.
        q = q[attempt % len(q):] + q[:attempt % len(q)]
        for opt in q:
            # One answer per question: the page disables the choices after the
            # first, and clicking a disabled button throws in Playwright rather
            # than returning. Check before clicking.
            if pg.evaluate(f"() => {{ const b = document.querySelector('#qChoices [data-opt=\"{opt}\"]'); return !b || b.disabled; }}"):
                break
            pg.click(f'#qChoices [data-opt="{opt}"]')
            pg.wait_for_timeout(800)
            st = pg.evaluate("""() => {
                const box = document.getElementById('qCompare');
                const fb = document.getElementById('qFb');
                return { cmpHidden: box.hidden, cmpText: box.textContent, fbClass: fb.className };
            }""")
            if 'on bad' in st['fbClass']:
                # A note-naming question has no comparison -- the child chose a
                # letter, not a sound -- so a wrong answer there is correct to
                # show nothing. Only interval and chord questions exercise the
                # claim, and the deck mixes them, so keep going until one is
                # reached.
                kind = pg.evaluate("""() => {
                    const qs = Array.from(document.querySelectorAll('#qChoices [data-opt]'))
                        .map(b => b.dataset.opt);
                    const bank = window.PIANO_BANK;
                    const q = bank.find(x => x.d1 === qs[0] || x.a === qs[0]);
                    return q ? q.kind : null;
                }""")
                if kind in ('interval', 'chord'):
                    exercised = True
                    print(f'== wrong answer on a {kind} question ({opt!r}): '
                          f'comparison {st["cmpText"]!r}')
                    if st['cmpHidden']:
                        fails.append(f'a wrong answer on a {kind} question showed no comparison label')
                    elif '—' not in st['cmpText']:
                        fails.append(f'the comparison label is not a pair: {st["cmpText"]!r}')
                    break
        if exercised:
            break
    if not exercised:
        fails.append('no wrong answer on an interval or chord question was reached; the page claim is untested')

    if exc:
        fails.append(f'piano pageerror: {exc[:3]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nEAR PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
