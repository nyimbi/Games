"""The freshness deck must read the keys it writes.

A drill plays fine with a broken freshness key: every question renders, every
answer is graded, and the only thing that goes wrong is that the drill forgets
what it has already served. That is invisible to a probe that just plays, so
this one seeds the record.

For each drill: mark every fact in the mode as served *except one*, all with the
same timestamp, then start a fresh deck. The one unserved fact must come first.
If the read key differs from the write key -- the drill writes `divisor|dividend`
but reads `a|b` -- no fact looks served, the deck is unordered, and the first
question is whatever the shuffle happened to produce.

Scope, stated so the gate is not believed past it: this exercises the *first*
pass of the deck, which is where `freshFirst` runs. A key lost only in
`newCycle` (pass two) is not covered, because a pass-two ordering is only
observable after a whole deck has been served.

The "unseen fact comes first" check is only meaningful if the served set is
non-empty, so the probe also asserts that the seed actually landed.

Run:  python3 -I probes/freshness.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

# drill -> (storage key, bucket, entry selector, how to name the fact the
# question is about, in the drill's own key shape)
DRILLS = {
    'number-bonds': {
        'key': 'arcade.bonds.v4', 'bucket': 'ten', 'enter': '#playBtn',
        # 10 splits: {whole:10, a:1..9}; the drill's key is `whole|a`
        'facts': 'a => [1,2,3,4,5,6,7,8,9].map(n => `10|${n}`)',
        # Bonds blank a random part, so the same fact appears two ways:
        #   "10 split into 9 and what?"  -- whole known, part a shown
        #   "9 and 1. What is the whole?" -- the whole blanked, both parts shown
        # Both name the fact `10|9`. The drill's key is whole|a, and the parts
        # are a and b with a + b = whole; the identity of the fact is the whole
        # plus whichever part is displayed, so the split form gives a and the
        # sum form gives the whole and its two parts.
        # THREE forms, not two. The blank can be the whole, the first part or
        # the second part, and each names the fact differently:
        #   "10 split into 9 and what?"   -> a shown,  key 10|9
        #   "10 split into what and 5?"   -> b shown,  key 10|5  (a = whole - b)
        #   "7 and 3. What is the whole?" -> both shown, key 10|7
        # The second was missing, so whenever the drill opened on it the
        # matcher returned null and the probe reported "first question is
        # None". That read as flake for as long as it existed -- the drill
        # blanks at random, so it failed roughly one run in three.
        'match': 'q => { let m = /(\\d+) split into (\\d+) and what/.exec(q); if (m) return {whole: +m[1], a: +m[2]}; m = /(\\d+) split into what and (\\d+)/.exec(q); if (m) return {whole: +m[1], a: +m[1] - +m[2]}; m = /(\\d+) and (\\d+)\\. What is the whole/.exec(q); if (!m) return null; return {whole: +m[1] + +m[2], a: +m[1]}; }',
        'asked': 'm => m ? `${m.whole}|${m.a}` : null',
    },
    'addition-quest': {
        'key': 'arcade.addition.v3', 'bucket': 'bond', 'enter': '#tabPractice',
        'facts': 'a => { const o=[]; for (let x=0;x<=10;x++) o.push(`${x}|${10-x}`); for (let w=5;w<=12;w++) for (let x=0;x<=w;x++) o.push(`${x}|${w-x}`); return o; }',
        # The bond speaks "6 plus what makes 10?", not "6 plus 4": the old
        # wording read the missing part aloud to a screen reader while the
        # sighted child saw a blank. The fact is still `a|b`, with b recovered
        # from the whole.
        'match': 'q => { let m = /(\\d+) plus what makes (\\d+)/.exec(q); if (m) return {a: +m[1], b: +m[2] - +m[1]}; m = /(\\d+) plus (\\d+)/.exec(q); if (!m) return null; return {a: +m[1], b: +m[2]}; }',
        'asked': 'm => m ? `${m.a}|${m.b}` : null',
    },
    'subtraction-safari': {
        'key': 'arcade.subtraction.v3', 'bucket': 'bond', 'enter': '#tabPractice',
        'facts': 'a => { const o=[]; for (let b=0;b<=10;b++) o.push(`10|${b}`); for (let w=5;w<=12;w++) for (let b=0;b<=w;b++) o.push(`${w}|${b}`); return o; }',
        'match': 'q => /(\\d+) minus (\\d+)/.exec(q)',
        'asked': 'm => m ? `${m[1]}|${m[2]}` : null',
    },
    'times-table-academy': {
        'key': 'arcade.times.v2', 'bucket': '1-10', 'enter': '#tabPractice',
        'facts': 'a => { const o=[]; for (let x=1;x<=10;x++) for (let y=1;y<=10;y++) o.push(`${x}|${y}`); return o; }',
        'match': 'q => /(\\d+) times (\\d+)/.exec(q)',
        'asked': 'm => m ? `${m[1]}|${m[2]}` : null',
    },
    'division-diner': {
        'key': 'arcade.division.v1', 'bucket': '1-5', 'enter': '#tabPractice',
        # divisors 2..5 x quotient 1..20, keyed `divisor|dividend`
        'facts': 'a => { const o=[]; for (let d=2;d<=5;d++) for (let q=1;q<=20;q++) o.push(`${d}|${d*q}`); return o; }',
        'match': 'q => /(\\d+) divided by (\\d+)/.exec(q)',
        'asked': 'm => m ? `${m[2]}|${m[1]}` : null',
    },
}


def run(pw):
    b = pw.chromium.launch()
    fails = []
    for game, cfg in DRILLS.items():
        print(f'== {game}')
        pg = b.new_page()
        exc = []
        pg.on('pageerror', lambda e: exc.append(str(e)))
        pg.goto((ARCADE / f'{game}.html').as_uri())
        pg.wait_for_timeout(250)
        pg.evaluate("localStorage.clear()")

        # Seed: every fact served except the last, all stamped at the same time.
        seeded = pg.evaluate("""(args) => {
            const [key, bucket, factSrc] = args;
            const facts = (eval(factSrc))();
            const held = facts[facts.length - 1];
            const m = {};
            for (const f of facts) if (f !== held) m[f] = 1;
            const s = { seen: { [bucket]: m }, perLevel: {}, perMode: {}, review: {} };
            localStorage.setItem(key, JSON.stringify(s));
            return { total: facts.length, served: Object.keys(m).length, held };
        }""", [cfg['key'], cfg['bucket'], cfg['facts']])
        print(f'   seeded {seeded["served"]} of {seeded["total"]}, holding back {seeded["held"]!r}')
        if seeded['served'] == 0:
            fails.append(f'{game}: seed wrote nothing, so the check cannot fire')
            pg.close()
            continue

        pg.reload()
        pg.wait_for_timeout(250)
        pg.click(cfg['enter'])
        pg.wait_for_timeout(450)

        said = pg.inner_text('#qsay') if pg.locator('#qsay').count() else ''
        match = pg.evaluate(f"() => ({cfg['match']})(document.querySelector('#qsay').textContent)")
        asked = pg.evaluate(f"(m) => ({cfg['asked']})(m)", match)
        print(f'   first question: {said!r} -> key {asked!r}')

        if asked != seeded['held']:
            fails.append(
                f'{game}: first question is {asked!r}, expected the unserved {seeded["held"]!r}')
        if exc:
            fails.append(f'{game}: {exc[:1]}')
        pg.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nFRESHNESS PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
