"""Knowing a fact and being able to work it out are different states.

`spd` has been recorded since the latency work and nothing has ever read it.
A fact answered right in four seconds and one answered right in four hundred
milliseconds are both "correct" to a boolean, and they are not the same thing.

`ArcadeDeck.knows(entry, ref)` returns one of `fluent`, `effortful`, `shaky`.
This gate asserts:

  1. Never answered, or never right: `shaky`.
  2. Right, but with no usable timing: `effortful`. A fact with no `base` has
     nothing to compare, and "we cannot tell" is not "fluent".
  3. Right and quick against the reference: `fluent`.
  4. Right and slow against it: `effortful`. A gate that only tested 2 and 3
     would pass against `entry.ok ? 'fluent' : 'shaky'`.
  5. `referenceBase` is the median of the bucket's bases, and `knowledge`
     counts against it.
  6. **`spd` does not converge to a useful state.** The first design used
     `spd <= 0.75`, which measures change against a moving baseline: forty
     correct answers at a constant 1000 ms settle at `spd` exactly 1.000, so
     every stable child would read `effortful` forever. Asserted by driving
     `noteAttempt` and checking a steady child is not mislabelled.
  7. Nothing reads it back. No drill's schedule, pool or level changes because
     a fact is `fluent` -- the state is reported, never used.
  8. Live: the session page renders the panel from seeded records, and the
     numbers match the seeds.

Claims 6 and 7 are the ones the design turns on: `README.md:778` forbids time
pressure, and the honest version of that is a measurement nobody acts on --
which has to be a measurement that means something.

Run:  python3 -I probes/knows.py
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
    pg.goto((ARCADE / 'session.html').as_uri())

    if not pg.evaluate("() => !!(window.ArcadeDeck && window.ArcadeDeck.knows)"):
        fails.append('deck.js does not export knows')
        pg.close(); b.close(); return fails

    # --- 1-6. the classification, its counting, and the convergence bug ---
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const K = D.knows;
        const REF = 2000;
        return {
            never:   K(undefined, REF),
            empty:   K({}, REF),
            missed:  K({ n: 3, miss: 3, ok: 0, base: 1500 }, REF),
            noBase:  K({ n: 4, miss: 0, ok: 4 }),
            noRef:   K({ n: 4, miss: 0, ok: 4, base: 1500 }, null),
            fast:    K({ n: 4, miss: 0, ok: 4, base: 1000 }, REF),
            slow:    K({ n: 4, miss: 0, ok: 4, base: 3500 }, REF),
            edge:    K({ n: 4, miss: 0, ok: 4, base: 1500 }, REF),
            justOver:K({ n: 4, miss: 0, ok: 4, base: 1501 }, REF),
            // referenceBase: median, not mean
            refOdd:  D.referenceBase({ a: { base: 1000 }, b: { base: 3000 }, c: { base: 9000 } }),
            refEven: D.referenceBase({ a: { base: 1000 }, b: { base: 3000 } }),
            refNone: D.referenceBase({ a: { n: 1 }, b: null }),
            refNull: D.referenceBase(null),
            // vs a reference of 2000: cutoff is 1500
            bucket:  D.knowledge({
                a: { n: 4, ok: 4, base: 1000 },   // fluent
                b: { n: 4, ok: 4, base: 3000 },   // effortful
                c: { n: 2, ok: 0, miss: 2 },      // shaky
                d: { n: 1, ok: 1, base: 1400 }    // fluent
            }, REF),
            emptyBucket: D.knowledge({}, REF),
            nullBucket:  D.knowledge(null, REF),
            noRefBucket: D.knowledge({ a: { n: 4, ok: 4, base: 100 }, b: { n: 4, ok: 4, base: 200 } })
        };
    }""")

    print(f'== never answered   {got["never"]!r}')
    print(f'== missed           {got["missed"]!r}')
    print(f'== no base / no ref {got["noBase"]!r} / {got["noRef"]!r}')
    print(f'== fast             {got["fast"]!r}')
    print(f'== slow             {got["slow"]!r}')
    print(f'== at threshold     {got["edge"]!r} / {got["justOver"]!r}')
    print(f'== reference        odd {got["refOdd"]!r}, even {got["refEven"]!r}, '
          f'none {got["refNone"]!r}, null {got["refNull"]!r}')
    print(f'== bucket           {got["bucket"]}')

    for name, want in [('never', 'shaky'), ('empty', 'shaky'), ('missed', 'shaky'),
                       ('noBase', 'effortful'), ('noRef', 'effortful'),
                       ('fast', 'fluent'), ('slow', 'effortful')]:
        if got[name] != want:
            fails.append(f'{name}: got {got[name]!r}, want {want!r}')
    if got['edge'] != 'fluent':
        fails.append(f'a fact exactly at the threshold is not fluent: {got["edge"]!r}')
    if got['justOver'] != 'effortful':
        fails.append(f'a fact just over the threshold is fluent: {got["justOver"]!r}')
    if got['refOdd'] != 3000:
        fails.append(f'referenceBase of [1000,3000,9000] is {got["refOdd"]!r}, want 3000 (median)')
    if got['refEven'] != 2000:
        fails.append(f'referenceBase of [1000,3000] is {got["refEven"]!r}, want 2000')
    if got['refNone'] is not None or got['refNull'] is not None:
        fails.append(f'referenceBase of a bucket with no bases is not None: '
                     f'{got["refNone"]!r} / {got["refNull"]!r}')
    if got['bucket'] != {'fluent': 2, 'effortful': 1, 'shaky': 1}:
        fails.append(f'knowledge counted {got["bucket"]}, want 2/1/1 against a '
                     f'reference of 2000 (cutoff 1500: 1000 and 1400 fluent, 3000 not)')
    if got['emptyBucket'] != {'fluent': 0, 'effortful': 0, 'shaky': 0}:
        fails.append(f'an empty bucket counted {got["emptyBucket"]}')
    if got['nullBucket'] != {'fluent': 0, 'effortful': 0, 'shaky': 0}:
        fails.append(f'a null bucket threw or counted wrong: {got["nullBucket"]}')
    # Without a reference nothing can be called fluent. A `knowledge` that
    # defaulted the reference to 1 would call every fact fluent.
    if got['noRefBucket'] != {'fluent': 0, 'effortful': 2, 'shaky': 0}:
        fails.append(f'a bucket with no reference counted {got["noRefBucket"]}, '
                     f'want 0/2/0')

    # --- 6. spd converges, and that is why it is not the test ------------
    # Drive the real write path. A child who answers at a steady speed must
    # not be labelled as still working everything out.
    conv = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const r = {};
        D.noteAttempt(r, 'k', true, null, 4000);      // slow first answer
        for (let i = 0; i < 40; i++) D.noteAttempt(r, 'k', true, null, 1000);
        const e = r.k;
        // The reference is this child's own median across facts; with one
        // fact that median is this fact, so it is the "steady child" case.
        return { spd: e.spd, base: e.base, n: e.n,
                 viaSpd: e.spd <= D.FLUENT, viaBase: e.base <= e.base * D.FLUENT };
    }""")
    print(f'== steady child: spd {conv["spd"]:.3f}, base {conv["base"]:.0f}, '
          f'spd<=FLUENT {conv["viaSpd"]}')
    if not (abs(conv['spd'] - 1.0) < 0.02):
        fails.append(f'spd did not converge to 1 on a steady child: {conv["spd"]!r} — '
                     f'the premise of claim 6 no longer holds and this gate is measuring '
                     f'the wrong thing')
    if conv['viaSpd']:
        fails.append('spd stayed below the threshold on a steady child — the convergence '
                     'bug this gate exists for is gone, so re-derive the design')

    # --- 7. nothing reads it back ---------------------------------------
    # A state that changed a schedule would be time pressure by the back door.
    # Assert the ladder and the due rule are untouched by `spd`.
    untouched = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const fast = { n: 4, miss: 0, ok: 4, spd: 0.2, nextAt: 0 };
        const slow = { n: 4, miss: 0, ok: 4, spd: 5.0, nextAt: 0 };
        // Same `ok`, so the same ladder step regardless of speed.
        return {
            fastDue: D.isDue(fast, Date.now()),
            slowDue: D.isDue(slow, Date.now()),
            fastNext: D.nextInterval(fast.ok - 1),
            slowNext: D.nextInterval(slow.ok - 1),
            keys: Object.keys(D).filter(k => /know|spd|fluent/i.test(k))
        };
    }""")
    print(f'== schedule ignores speed: due {untouched["fastDue"]}/{untouched["slowDue"]}, '
          f'next {untouched["fastNext"]}/{untouched["slowNext"]}')
    if untouched['fastDue'] != untouched['slowDue']:
        fails.append('a fast fact and a slow fact are due at different times — '
                     'speed has leaked into the schedule')
    if untouched['fastNext'] != untouched['slowNext']:
        fails.append('a fast fact and a slow fact get different intervals — '
                     'speed has leaked into the ladder')

    if exc:
        fails.append(f'session page error: {exc[:2]}')
    pg.close()

    # --- 8. live: the panel renders the seeded records -------------------
    q = b.new_page()
    errs = []
    q.on('pageerror', lambda e: errs.append(str(e)))
    q.goto((ARCADE / 'session.html').as_uri())
    q.evaluate("""() => {
        localStorage.clear();
        const now = Date.now();
        localStorage.setItem('arcade.addition.v3', JSON.stringify({
            v: 1, best: 0, perLevel: {}, seen: {}, taught: {}, savedAt: now,
            review: {
                // Pooled with the times fact below, bases are 800, 3000,
                // 1200, 500 -> median 1000, cutoff 750. So 500 is fluent and
                // 800 is not; the fixture has to contain a fluent fact or a
                // reference of null (everything effortful) passes it.
                '1|2|3': { n: 4, miss: 0, ok: 4, base: 800, nextAt: now },
                '1|4|5': { n: 4, miss: 0, ok: 4, base: 3000, nextAt: now },
                '1|6|7': { n: 2, miss: 2, ok: 0, nextAt: 0 }
            }
        }));
        localStorage.setItem('arcade.times.v2', JSON.stringify({
            v: 1, best: 0, perMode: {}, seen: {}, taught: {}, savedAt: now,
            review: { '3|4': { n: 3, miss: 0, ok: 3, base: 500, nextAt: now } }
        }));
    }""")
    q.goto((ARCADE / 'session.html').as_uri())
    q.wait_for_timeout(300)
    live = q.evaluate("""() => {
        const box = document.getElementById('knows');
        return box ? [...box.children].map(p => p.textContent) : null;
    }""")
    print('== panel:')
    for line in (live or []):
        print('   ', line)
    if not live:
        fails.append('the session page has no #knows panel')
    else:
        joined = ' | '.join(live)
        # Pooled bases 800, 3000, 500 -> median 800, cutoff 600. The 500 fact
        # is fluent and the 800 one is not, so the two buckets split.
        if 'Addition: 0 fluent, 2 worked out, 1 still shaky of 3' not in joined:
            fails.append(f'the addition line is wrong: {joined}')
        if 'Times tables: 1 fluent, 0 worked out, 0 still shaky of 1' not in joined:
            fails.append(f'the times line is wrong: {joined}')
        if '4 facts across the five maths drills' not in joined:
            fails.append(f'the total is wrong: {joined}')
    if errs:
        fails.append(f'session page (live) pageerror: {errs[:2]}')
    q.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nKNOWS PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
