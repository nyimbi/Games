"""A generated piece is the same drawer as the eight, not a different one.

F-25. `piano-bank.js` ships eight pieces. Eight is enough to learn a tune and
not enough to learn to read from -- a child who has played them twice is
recognising the pieces, not reading the notes.

The eight pieces are also a distribution: a range, a set of pitch classes, a
step distribution and a set of note lengths. `piecegen.js` walks that
distribution from a seed. The claims here are about the distribution, because
that is the whole content of "generated in the same style" -- a generator that
produced pleasant music outside the range would be worse material for reading,
not better.

  1. The profile is the bank's. Recomputed here from `PIANO_PIECES` by
     different code, so a profile that drifts from the pieces is caught rather
     than restated.
  2. Every note of every generated piece is in the set: inside the range and
     on one of the bank's pitch classes. The naive walk leaves the set
     constantly, so this is the claim the fallbacks exist for.
  3. Every piece is a whole number of bars and no note crosses a barline.
     All eight bank pieces satisfy this (checked, 0 crossings), so a straddling
     note would be the one thing in the material the child has never seen --
     and the play stage draws barlines from the running beat total.
  4. Same seed, same piece; different seeds, different pieces. A generator
     that ignored its seed would produce the same practice piece for everyone.
  5. The step distribution of a thousand generated pieces is close to the
     bank's -- and a control that varies *only* the step distribution is far
     from it. Without the control the claim is satisfied by any walk that
     happens to have the right shape.
  6. Durations come only from the bank's own set, and the first note only from
     the bank's first notes.
  7. `generate` does not mutate the profile. A walk that bumped into it would
     make every later piece a little less like the bank, and nothing would
     fail.
  8. The page offers it: the button is present and visible, pressing it opens a
     play stage with a piece in the set, and the generator is loaded before the
     engine that uses it.

Run:  python3 -I probes/pieces.py
"""
import pathlib
import re
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

    if not pg.evaluate("() => !!(window.ArcadePieceGen && window.PIANO_PIECES)"):
        fails.append('piecegen.js or the pieces did not load: '
                     + (f'page errors {exc[:2]}' if exc else 'no page error'))
        pg.close(); b.close(); return fails

    # --- 1..7. the generator, over its own bank -------------------------
    got = pg.evaluate("""() => {
        const G = window.ArcadePieceGen, P = window.PIANO_PIECES;
        const out = { problems: [], generated: 0, notes: 0 };

        // 1. the profile, recomputed independently.
        const lo = Math.min(...P.flatMap(p => p.notes.map(n => n.m)));
        const hi = Math.max(...P.flatMap(p => p.notes.map(n => n.m)));
        const pcs = [...new Set(P.flatMap(p => p.notes.map(n => ((n.m % 12) + 12) % 12)))].sort((a, b) => a - b);
        const dur = [...new Set(P.flatMap(p => p.notes.map(n => n.b)))].sort((a, b) => a - b);
        const firsts = [...new Set(P.map(p => p.notes[0].m))].sort((a, b) => a - b);
        const prof = G.profile(P);
        if (prof.lo !== lo || prof.hi !== hi) out.problems.push(`profile range ${prof.lo}-${prof.hi}, bank ${lo}-${hi}`);
        if (prof.pcs.join(',') !== pcs.join(',')) out.problems.push('profile pitch classes ' + prof.pcs + ', bank ' + pcs);
        const pd = Object.keys(prof.beats).map(Number).sort((a, b) => a - b);
        if (pd.join(',') !== dur.join(',')) out.problems.push('profile durations ' + pd + ', bank ' + dur);
        const pf = Object.keys(prof.firsts).map(Number).sort((a, b) => a - b);
        if (pf.join(',') !== firsts.join(',')) out.problems.push('profile first notes ' + pf + ', bank ' + firsts);
        out.profile = { lo, hi, pcs, dur, pieces: P.length, notes: P.reduce((a, p) => a + p.notes.length, 0) };

        const inSet = m => m >= lo && m <= hi && pcs.includes(((m % 12) + 12) % 12);

        // 7. the profile must survive generation untouched.
        const before = JSON.stringify(prof);
        const N = 1000;
        const made = [];
        for (let s = 1; s <= N; s++) made.push(G.generate(prof, s));
        if (JSON.stringify(prof) !== before) out.problems.push('generate mutated the profile');

        // 2, 3, 6. every note, in the set, inside a bar, from the bank's set.
        let crossed = 0, offBar = 0, badDur = 0, badFirst = 0, nonInt = 0;
        for (const p of made) {
            out.generated++;
            if (!firsts.includes(p.notes[0].m)) badFirst++;
            let at = 0;
            for (const n of p.notes) {
                out.notes++;
                if (!inSet(n.m)) { out.problems.push('note ' + n.m + ' outside the bank set'); break; }
                if (!Number.isInteger(n.m)) nonInt++;
                if (!dur.includes(n.b)) badDur++;
                if (at % 4 + n.b > 4) crossed++;
                at += n.b;
            }
            if (at % 4 !== 0) offBar++;
        }
        out.shape = { crossed, offBar, badDur, badFirst, nonInt };

        // 4. determinism and variety.
        //
        // Compare the *notes*, not the objects. The returned piece carries its
        // own `seed`, so stringifying two pieces built from seeds 42 and 43
        // always differs -- the field alone makes them unequal. Measured: with
        // `mulberry32(seed)` replaced by `mulberry32(1)`, a whole-object
        // comparison stayed green and only the page claim caught it.
        const notesOf = p => JSON.stringify(p.notes);
        const a = notesOf(G.generate(prof, 42));
        const b2 = notesOf(G.generate(prof, 42));
        const c = notesOf(G.generate(prof, 43));
        out.det = { same: a === b2, differs: a !== c };
        const ids = new Set(made.map(p => p.id));
        out.ids = [...ids];

        // 5. the step distribution, against the bank and against a control
        // that changes the step distribution and nothing else.
        const stepsOf = list => {
            const h = {};
            for (const p of list) for (let i = 1; i < p.notes.length; i++) {
                const d = p.notes[i].m - p.notes[i - 1].m;
                h[d] = (h[d] || 0) + 1;
            }
            return h;
        };
        const tv = (x, y) => {
            const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
            const A = Object.values(x).reduce((u, v) => u + v, 0);
            const B = Object.values(y).reduce((u, v) => u + v, 0);
            let s = 0;
            for (const k of keys) s += Math.abs((x[k] || 0) / A - (y[k] || 0) / B);
            return s / 2;
        };
        const bank = stepsOf(P);
        const gen = stepsOf(made);
        const uniform = {};
        for (const k of Object.keys(bank)) uniform[k] = 1;
        const ctrl = stepsOf(Array.from({ length: N }, (_, i) => G.generate(prof, i + 1, { steps: uniform })));
        // The noise floor: the same generator, split in half, compared with
        // itself. Two halves of one sample differ by sampling error alone, so
        // this is what "the same distribution" reads as when it is true.
        const half = stepsOf(made.slice(0, N / 2));
        const other = stepsOf(made.slice(N / 2));
        out.dist = {
            bank: tv(gen, bank), control: tv(ctrl, bank), floor: tv(half, other),
            keys: Object.keys(bank).length
        };

        return out;
    }""")

    print(f'== profile: {got["profile"]["pieces"]} pieces, {got["profile"]["notes"]} notes, '
          f'range {got["profile"]["lo"]}-{got["profile"]["hi"]}, '
          f'{len(got["profile"]["pcs"])} pitch classes, durations {got["profile"]["dur"]}')
    for p in got['problems'][:10]:
        fails.append(p)
    if len(got['problems']) > 10:
        fails.append(f'... and {len(got["problems"]) - 10} more generator problems')

    sh = got['shape']
    print(f'== {got["generated"]} pieces, {got["notes"]} notes; '
          f'{sh["crossed"]} notes across a barline, {sh["offBar"]} pieces off a whole bar, '
          f'{sh["badDur"]} bad durations, {sh["badFirst"]} bad first notes')
    if sh['crossed']:
        fails.append(f'{sh["crossed"]} generated notes cross a barline; no bank piece does')
    if sh['offBar']:
        fails.append(f'{sh["offBar"]} generated pieces are not a whole number of bars')
    if sh['badDur']:
        fails.append(f'{sh["badDur"]} generated notes use a duration the bank never uses')
    if sh['badFirst']:
        fails.append(f'{sh["badFirst"]} generated pieces start on a note the bank never starts on')
    if sh['nonInt']:
        fails.append(f'{sh["nonInt"]} generated notes have a non-integer MIDI number')

    det = got['det']
    if not det['same']:
        fails.append('the same seed produced two different pieces')
    if not det['differs']:
        fails.append('two different seeds produced the same piece')
    if got['ids'] != ['generated']:
        fails.append(f'generated pieces carry ids {got["ids"]}; one id, or the record grows on every press')

    d = got['dist']
    print(f'== step distribution: TV to the bank {d["bank"]:.3f}, '
          f'split-half noise floor {d["floor"]:.3f}, '
          f'control (uniform steps, same walk) {d["control"]:.3f}')
    # Both sides, and both measured. The generator is close to the bank; the
    # control, which differs only in the step distribution, is far from it. A
    # single-sided bound would pass against a walk that reproduced the
    # distribution by construction rather than by sampling it.
    #
    # The floor is printed rather than asserted against: it is the distance
    # two halves of the *same* sample show, so it is what "same distribution"
    # reads as, and the generator's 0.069 is that plus the bank's own 143-step
    # granularity. Comparing the two would be comparing a sample to its
    # population.
    #
    # 0.10, not 0.15. The bound has to fail the variant it exists to catch.
    # Measured over ten seed offsets of 1000 pieces each: with the reflection
    # step the distance is 0.069-0.075; with the reflection deleted and
    # nothing else changed it is 0.123-0.143. A 0.15 bound passed the
    # no-reflection canary, which is a bound that does not test the step it
    # was written for.
    if d['bank'] > 0.10:
        fails.append(f'the generated steps are {d["bank"]:.3f} from the bank; wanted under 0.10')
    if d['control'] < 0.30:
        fails.append(f'the uniform-step control is only {d["control"]:.3f} from the bank; '
                     f'the claim does not separate from a walk that ignores the distribution')
    if d['control'] < 3 * d['floor']:
        fails.append(f'the control is {d["control"]:.3f} from the bank against a noise floor of '
                     f'{d["floor"]:.3f}; the separation is within sampling error')

    # --- 8. the page ----------------------------------------------------
    vis = pg.evaluate("""() => {
        const b = document.getElementById('pGen');
        return b ? { exists: true, hidden: b.hidden, text: b.textContent.trim() } : { exists: false };
    }""")
    if not vis['exists']:
        fails.append('piano.html has no #pGen button')
    elif vis['hidden']:
        fails.append('#pGen is hidden although the generator loaded')
    elif 'practice' not in vis['text'].lower():
        fails.append(f'#pGen does not say what it makes: {vis["text"]!r}')

    # The generator must be loaded before the engine that reads it -- a script
    # order that leaves `ArcadePieceGen` undefined at wiring time hides the
    # button, which reads as "the feature is not here".
    html = (ARCADE / 'piano.html').read_text()
    order = re.findall(r'<script src="\./([a-z-]+)\.js">', html)
    if 'piecegen' not in order or 'piano-engine' not in order:
        fails.append(f'piano.html script order is {order}; piecegen and piano-engine are not both loaded')
    elif order.index('piecegen') > order.index('piano-engine'):
        fails.append('piecegen.js loads after piano-engine.js, which reads it at wiring time')

    pg.click('#pGen')
    pg.wait_for_selector('#play.on', timeout=5000)
    pg.wait_for_timeout(300)
    play = pg.evaluate("""() => {
        const G = window.ArcadePieceGen;
        const title = document.getElementById('pTitle').textContent;
        const note = document.getElementById('pNote').textContent;
        const count = document.getElementById('pCount').textContent;
        const staff = document.getElementById('pStaff').innerHTML.length;
        const next = document.getElementById('pNext').textContent;
        // The piece the page is playing is the one it generated; read the
        // count back off the stage rather than trusting a fixed number.
        return { title, note, count, staff, next };
    }""")
    print(f'== page: {play["title"]!r} · {play["count"]} · next {play["next"]!r} · staff {play["staff"]} chars')
    if 'Practice' not in play['title']:
        fails.append(f'the practice button opened {play["title"]!r}')
    if not re.match(r'^0 / \d+$', play['count']):
        fails.append(f'the play stage did not start at note 0: {play["count"]!r}')
    if play['staff'] < 200:
        fails.append('the play stage drew no staff for the generated piece')
    if not re.match(r'^[A-G][0-9]$', play['next']):
        fails.append(f'the stage names no next note: {play["next"]!r}')

    # Pressing the lit key advances. The stage marks the key by pitch class, so
    # the first `[data-midi]` in the keyboard is the lowest C, not the lit one
    # -- clicking that is a wrong answer. Find the key by the label the stage
    # itself printed as the next note.
    before = play['count']
    want = play['next']
    clicked = pg.evaluate("""(want) => {
        const keys = Array.from(document.querySelectorAll('#pKeys [data-midi]'));
        const b = keys.find(k => k.getAttribute('aria-label') === want);
        if (b) { b.click(); return true; }
        return false;
    }""", want)
    if not clicked:
        fails.append(f'the stage named {want!r} but no key carries that label')
    pg.wait_for_timeout(250)
    after = pg.evaluate("() => document.getElementById('pCount').textContent")
    if after == before:
        fails.append(f'pressing the key the stage named did not advance the piece ({before} then {after})')

    # A second press gives a different piece: the seed advances.
    first = pg.evaluate("() => document.getElementById('pStaff').innerHTML")
    pg.click('#pExit')
    pg.wait_for_timeout(200)
    pg.click('#pGen')
    pg.wait_for_selector('#play.on', timeout=5000)
    pg.wait_for_timeout(300)
    second = pg.evaluate("() => document.getElementById('pStaff').innerHTML")
    if first == second:
        fails.append('two presses of the practice button drew the same piece; the seed is not advancing')

    if exc:
        fails.append(f'piano pageerror: {exc[:3]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nPIECES PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
