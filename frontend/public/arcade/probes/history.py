"""A finished deck must record how it went, not only that it happened.

`arcade.session.v1` held `{day -> {done: {subject -> timestamp}}}`. It could
answer "did I do maths today" and not "how did maths go today". The strip on
the session page shows completeness, and completeness is a binary: a child who
does eleven subjects badly looks identical to one who does them well.

`mark(subjectId, result)` now keeps the day's best percentage per subject, and
`history(n)` reports the day's mean of what was actually scored. This gate
asserts:

  1. `mark` with a percentage stores it, and `history` reports it as that day's
     accuracy.
  2. A second attempt keeps the better score, and `changed` stays false — the
     child is told once that the subject is done, not once per replay.
  3. A day with no score reports `acc: null`, not 0. A day of unscored games
     is not a day of zeroes and the strip must be able to tell them apart.
  4. A result outside 0..100 or not a number is refused rather than stored,
     because it would poison the day's mean.
  5. The live page reports its own percentage: play a drill to its summary and
     the day record carries a number that matches the summary text.
  6. `resultPct` reads all the shapes the games actually use. This is the
     fixture that matters — twelve pages share one reader, and a reader that
     handles only the shape in front of me would silently report null for the
     rest.

Claim 6 is driven from synthetic DOM rather than twelve real playthroughs,
because the parsing is the risk and playing twelve decks does not test it
better — it tests it slower. Claim 5 is the one real playthrough, and it is
there to prove the wiring, not the parser.

Run:  python3 -I probes/history.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

DAY = 86400000


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    # session.js is inert on the hub (no #done), so this is a clean host for
    # driving mark/history directly.
    pg.goto((ARCADE / 'index.html').as_uri())

    if not pg.evaluate("() => !!(window.ArcadeSession && window.ArcadeSession.mark)"):
        fails.append('session.js did not load ArcadeSession')
        pg.close(); b.close(); return fails

    # --- 1-4. the record --------------------------------------------------
    got = pg.evaluate("""() => {
        const S = window.ArcadeSession;
        localStorage.clear();
        const out = {};
        S.mark('maths', 70);
        const h = S.history(1)[0];
        out.first = { done: h.done, acc: h.acc };

        // a replay, worse
        const r2 = S.mark('maths', 40);
        out.worse = { acc: S.history(1)[0].acc, changed: r2.changed };

        // a replay, better
        S.mark('maths', 95);
        out.better = S.history(1)[0].acc;

        // a second subject, so the mean is a mean and not the one value
        S.mark('french', 61);
        out.mean = S.history(1)[0].acc;

        // refusals
        const day0 = S.history(1)[0].acc;
        S.mark('maths', 500);
        S.mark('maths', -3);
        S.mark('maths', '80');
        S.mark('maths', NaN);
        out.afterJunk = S.history(1)[0].acc;

        // an unscored day
        localStorage.clear();
        S.mark('maths');
        out.unscored = S.history(1)[0].acc;
        out.unscoredDone = S.history(1)[0].done;
        return out;
    }""")
    print(f'== first mark 70 -> {got["first"]}')
    print(f'== replay 40    -> {got["worse"]}')
    print(f'== replay 95    -> {got["better"]}')
    print(f'== with french 61 -> mean {got["mean"]}')
    print(f'== after junk results -> {got["afterJunk"]}')
    print(f'== unscored day -> acc={got["unscored"]} done={got["unscoredDone"]}')

    if got['first']['acc'] != 70 or got['first']['done'] != 1:
        fails.append(f'the first mark was not recorded: {got["first"]}')
    if got['worse']['acc'] != 70:
        fails.append(f'a worse replay lowered the day: {got["worse"]}')
    if got['worse']['changed']:
        fails.append('a replay was announced as a new completion')
    if got['better'] != 95:
        fails.append(f'a better replay did not raise the day: {got["better"]}')
    if got['mean'] != round((95 + 61) / 2):
        fails.append(f'the day mean is not the mean of scored subjects: {got["mean"]}')
    if got['afterJunk'] != got['mean']:
        fails.append(f'an out-of-range result was stored: {got["mean"]} -> {got["afterJunk"]}')
    if got['unscored'] is not None:
        fails.append(f'a day with no score reported acc={got["unscored"]!r}, expected null')
    if got['unscoredDone'] != 1:
        fails.append(f'an unscored completion was not counted as done: {got["unscoredDone"]}')

    # --- 6. the reader handles every shape the games use -------------------
    # Twelve pages share one reader. A reader that handles only the shape in
    # front of me reports null for the rest, and null is indistinguishable from
    # "this game does not report a score". Driven from synthetic DOM rather
    # than twelve playthroughs: the parsing is the risk, and playing twelve
    # decks tests it slower, not better.
    shapes = [
        # id,          text,                                            want
        ('doneText', '7 of 10 correct · 90 points · best streak 4',     70),
        ('doneText', '0 of 20 correct · 0 points · best streak 0',       0),
        ('doneText', '22 words per minute · 96% accuracy · 3 mistakes', 96),
        ('rPct',     '90%',                                             90),
        ('doneText', '18 of 20 correct · 240 points · best streak 9',   90),
        # a percentage wins over a fraction when both are present
        ('doneText', '3 of 4 correct · 75%',                            75),
        # nothing to read
        ('doneText', 'Finished — keep practising',                      None),
    ]
    for el_id, text, want in shapes:
        got = pg.evaluate("""(args) => {
            const [id, txt] = args;
            const old = document.getElementById('shapeProbe');
            if (old) old.remove();
            document.body.insertAdjacentHTML('beforeend',
                '<p id="shapeProbe"><span id="' + id + '"></span></p>');
            document.getElementById(id).textContent = txt;
            const v = window.ArcadeSession.resultPct();
            document.getElementById('shapeProbe').remove();
            return v;
        }""", [el_id, text])
        print(f'== shape {text!r} -> {got!r} (want {want!r})')
        if got != want:
            fails.append(f'resultPct read {text!r} as {got!r}, expected {want!r}')

    # A percentage elsewhere on the page must NOT be read as the result. The
    # reader is scoped to the ids the games actually use for this reason.
    got = pg.evaluate("""() => {
        const old = document.getElementById('shapeProbe');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend',
            '<p id="shapeProbe"><b id="levelPct">40%</b></p>');
        const v = window.ArcadeSession.resultPct();
        document.getElementById('shapeProbe').remove();
        return v;
    }""")
    print(f'== a stray percentage elsewhere -> {got!r} (want None)')
    if got is not None:
        fails.append(f'resultPct read a percentage that is not the result: {got!r}')

    # --- 5. one real playthrough ------------------------------------------
    q = b.new_page()
    errs = []
    q.on('pageerror', lambda e: errs.append(str(e)))
    q.goto((ARCADE / 'number-bonds.html').as_uri())
    q.evaluate("localStorage.clear()")
    q.reload(); q.wait_for_timeout(300)
    q.click('#playBtn'); q.wait_for_timeout(400)
    # Answer every question wrong on purpose: 0% is still a result, and it is
    # the one a "did it record anything" gate is least likely to confuse with
    # a default.
    for _ in range(60):
        done = q.evaluate("() => document.getElementById('done').classList.contains('show')")
        if done:
            break
        q.keyboard.type('99999')
        q.keyboard.press('Enter')
        q.wait_for_timeout(120)
        q.evaluate("() => { const b = document.getElementById('nextBtn'); if (b && !b.hidden) b.click(); }")
        q.wait_for_timeout(120)
    summary = q.evaluate("() => (document.getElementById('doneText') || {}).textContent || null")
    rec = q.evaluate("""() => {
        const s = JSON.parse(localStorage.getItem('arcade.session.v1') || 'null');
        if (!s) return null;
        const days = s.days || {};
        const k = Object.keys(days)[0];
        return k ? { key: k, day: days[k] } : null;
    }""")
    print(f'== live drill summary: {summary!r}')
    print(f'== session day: {rec}')

    if not rec:
        fails.append('finishing a drill wrote no session day')
    else:
        best = (rec['day'].get('best') or {})
        if 'maths' not in best:
            fails.append(f'the completion recorded no percentage: {rec["day"]}')
        elif summary and ' of ' in summary:
            # the summary says "N of M correct"; the record must agree
            try:
                num, rest = summary.split(' of ', 1)
                den = rest.split(' ', 1)[0]
                want = round(int(num) / int(den) * 100)
                if abs(best['maths'] - want) > 1:
                    fails.append(f'the recorded {best["maths"]}% disagrees with '
                                 f'the summary {summary!r} (expected {want}%)')
            except (ValueError, ZeroDivisionError):
                fails.append(f'could not parse the summary {summary!r}')
    if errs:
        fails.append(f'number-bonds threw: {errs[:1]}')
    q.close()

    if exc:
        fails.append(f'index.html: pageerror {exc[:2]}')
    pg.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nHISTORY PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
