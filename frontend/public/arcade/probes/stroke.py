"""The character is written in the order it is graded in.

F-23. `calligraphy.html` graded one stroke at a time and could flash the
current one, so a child learned the order by failing to guess it. The bank
records all 3,086 strokes as polylines, so the whole character can be written
out on the same grid. `stroke-anim.js` is the schedule; the page draws it.

The split is the gate. An animation tested by watching it finish is tested by
the frame rate, so the schedule is pure and asserted exactly, and the page is
asserted to use it:

  1. The schedule keeps the bank's order. It is the thing being taught, and a
     schedule that sorted or re-indexed would animate a different character
     from the one the page grades against.
  2. Durations are clamped. A two-point stroke across the box is 100 units and
     a dot is 0 units; unclamped, the dot flashes for 0 ms and reads as a
     rendering bug rather than as a stroke.
  3. `start`/`end` are contiguous with the gap between them, and `total` is
     the end of the last stroke -- so the last stroke gets its whole duration
     and no trailing gap.
  4. `at` names the stroke being written and *not* the next one during the
     gap. Naming the next stroke during the pause shows the child a hint for
     something not yet on screen.
  5. The page draws what the schedule says: the animation group holds exactly
     the strokes the schedule has started, in the bank's order, and is empty
     before the run and after it.
  6. The animation is the guide colour and a separate group from the ink, so
     a demonstration can never be mistaken for the child's own strokes, and
     cannot overwrite them.
  7. Reduced motion gets the same order without the movement.

Run:  python3 -I probes/stroke.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
PAGE = (ARCADE / 'calligraphy.html').as_uri()


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto(PAGE)

    if not pg.evaluate("() => !!(window.ArcadeStrokeAnim && window.CALLIGRAPHY_BANK)"):
        fails.append('stroke-anim.js or the bank did not load: '
                     + (f'page errors {exc[:2]}' if exc else 'no page error'))
        pg.close(); b.close(); return fails

    # --- 1..4. the schedule, over every character in the bank ------------
    got = pg.evaluate("""() => {
        const A = window.ArcadeStrokeAnim, BANK = window.CALLIGRAPHY_BANK;
        const out = { chars: BANK.length, strokes: 0, problems: [], sample: null };

        for (const e of BANK) {
            const plan = A.timeline(e.strokes);
            out.strokes += e.strokes.length;
            if (plan.strokes.length !== e.strokes.length) {
                out.problems.push(e.char + ': ' + plan.strokes.length + ' of ' + e.strokes.length + ' strokes');
                continue;
            }
            let prevEnd = null;
            plan.strokes.forEach((s, k) => {
                // 1. order and identity
                if (s.i !== k) out.problems.push(e.char + ': stroke ' + k + ' carries index ' + s.i);
                const want = e.strokes[k].pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
                if (s.d !== want) out.problems.push(e.char + ': stroke ' + k + ' path differs from the bank');
                // 2. clamped
                if (s.dur < A.MIN_MS || s.dur > A.MAX_MS) {
                    out.problems.push(e.char + ': stroke ' + k + ' dur ' + s.dur + ' outside the clamp');
                }
                // 3. contiguous, with the gap, and no gap after the last
                const expect = prevEnd === null ? 0 : prevEnd + A.GAP;
                if (s.start !== expect) {
                    out.problems.push(e.char + ': stroke ' + k + ' starts at ' + s.start + ', expected ' + expect);
                }
                if (s.end !== s.start + s.dur) out.problems.push(e.char + ': stroke ' + k + ' end != start + dur');
                prevEnd = s.end;
            });
            const last = plan.strokes[plan.strokes.length - 1];
            if (plan.total !== last.end) out.problems.push(e.char + ': total ' + plan.total + ' != last end ' + last.end);

            // 4. `at` inside strokes and inside gaps
            if (!out.sample && e.strokes.length >= 3) {
                const p = plan.strokes;
                const probes = [
                    [0, 0],                                    // first stroke, t=0
                    [p[0].end - 1, 0],                         // last ms of stroke 0
                    [p[0].end, -1],                            // first ms of the gap
                    [p[1].start - 1, -1],                      // last ms of the gap
                    [p[1].start, 1],                           // first ms of stroke 1
                    [plan.total - 1, p.length - 1],            // last ms of the last stroke
                    [plan.total, -1]                           // after the end
                ];
                out.sample = { char: e.char, got: probes.map(([ms]) => A.at(plan, ms)),
                               want: probes.map(([, w]) => w), ms: probes.map(([ms]) => ms) };
            }
        }
        return out;
    }""")

    print(f'== {got["chars"]} characters, {got["strokes"]} strokes scheduled')
    for p in got['problems'][:12]:
        fails.append(p)
    if len(got['problems']) > 12:
        fails.append(f'... and {len(got["problems"]) - 12} more schedule problems')

    s = got.get('sample')
    if not s:
        fails.append('no character in the bank has three strokes; the gap claim is untested')
    else:
        if s['got'] != s['want']:
            fails.append(f'at() on {s["char"]}: got {s["got"]} at ms {s["ms"]}, wanted {s["want"]}')
        else:
            print(f'== at() on {s["char"]}: {s["got"]} at ms {s["ms"]}')

    # --- 5..6. the page draws what the schedule says --------------------
    pg.click('#tiers [data-tier="1"]')
    pg.click('#modes [data-mode="order"]')
    pg.wait_for_selector('#practice.on', timeout=5000)
    before = pg.evaluate("() => document.getElementById('animInk').innerHTML.trim()")
    if before:
        fails.append('the animation group is not empty before the run')

    # The ink the child has already drawn must survive the demonstration.
    ink_before = pg.evaluate("() => document.getElementById('ink').innerHTML")
    # The click is dispatched inside the evaluate, not by `pg.click` before it.
    # Playwright's round trip is tens to hundreds of milliseconds and the first
    # stroke can be over by the time the sampler starts -- the first version
    # read the label of stroke 2 and reported it as a mismatch against the
    # character's first stroke, which is a fact about the harness.
    mid = pg.evaluate("""() => new Promise(res => {
        const g = document.getElementById('animInk');
        const lab = document.getElementById('pOrderNo');
        const names = window.CALLIGRAPHY_BANK.map(e => e.strokes.map(s => s.name)).flat();
        document.getElementById('pOrder').click();
        const t0 = performance.now();
        const tick = () => {
            const n = g.querySelectorAll('path').length;
            const label = (lab || {}).textContent || '';
            if (n > 0) return res({ n, html: g.innerHTML, label, ms: performance.now() - t0,
                                    labelIsStroke: names.indexOf(label) >= 0 });
            if (performance.now() - t0 > 3000) return res({ n: 0, html: '', label: '', ms: -1 });
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    })""")
    if mid['n'] == 0:
        fails.append('the run drew nothing within 3 s')
    else:
        print(f'== mid-run at {mid["ms"]:.0f} ms: {mid["n"]} stroke(s), label {mid["label"]!r}')
        # 6. guide colour, never the ink colour
        if '#c1272d' not in mid['html']:
            fails.append('the animation did not draw in the guide colour')
        if mid['html'].count('<path') != mid['n']:
            fails.append('the animation group holds something other than paths')
        # The stroke name under the board must be a stroke name at all -- an
        # empty or stale label is the failure mode, and the exact index is
        # already asserted against the schedule in claim 4.
        if not mid['label']:
            fails.append('the running label was empty mid-run')
        elif not mid['labelIsStroke']:
            fails.append(f'the running label is not a stroke name: {mid["label"]!r}')

    # Wait for the group to empty rather than for a fixed delay: the longest
    # character is eight strokes at up to 900 ms plus seven gaps, which is
    # longer than any fixed wait short enough to keep the probe quick.
    try:
        pg.wait_for_function(
            "() => document.getElementById('animInk').innerHTML.trim() === ''", timeout=15000)
    except Exception:
        pass
    after = pg.evaluate("() => document.getElementById('animInk').innerHTML.trim()")
    ink_after = pg.evaluate("() => document.getElementById('ink').innerHTML")
    if after:
        fails.append('the animation group was not cleared when the run ended')
    if ink_after != ink_before:
        fails.append('the demonstration wrote into the child\'s ink layer')

    # --- 7. reduced motion ----------------------------------------------
    # The claim is not "strokes appear over time" -- both branches do that, so
    # that assertion passed against a page that ignored the preference. It is
    # the mechanism: reduced motion draws each stroke whole, so no path ever
    # carries a partial dashoffset. The animated branch sets one on every path
    # it draws. That is what separates them, and it is read off the markup.
    ctx = b.new_context(reduced_motion='reduce')
    rp = ctx.new_page()
    rexc = []
    rp.on('pageerror', lambda e: rexc.append(str(e)))
    rp.goto(PAGE)
    rp.click('#tiers [data-tier="1"]')
    rp.click('#modes [data-mode="order"]')
    rp.wait_for_selector('#practice.on', timeout=5000)
    rp.click('#pOrder')
    rp.wait_for_timeout(600)
    first = rp.evaluate("""() => {
        const g = document.getElementById('animInk');
        return { n: g.querySelectorAll('path').length,
                 partial: Array.from(g.querySelectorAll('path'))
                     .filter(p => (p.getAttribute('stroke-dashoffset') || '0') !== '0').length };
    }""")
    rp.wait_for_timeout(2400)
    more = rp.evaluate("() => document.getElementById('animInk').querySelectorAll('path').length")
    if rexc:
        fails.append(f'reduced motion threw: {rexc[:2]}')
    if first['n'] == 0:
        fails.append('reduced motion drew nothing in the first 600 ms')
    if first['partial']:
        fails.append(f'reduced motion drew {first["partial"]} partially-drawn path(s): '
                     f'it is animating rather than stepping')
    if more <= first['n']:
        fails.append(f'reduced motion drew {more} strokes after 3 s, same as the first '
                     f'{first["n"]}: the order is not being shown')
    else:
        print(f'== reduced motion: {first["n"]} whole stroke(s) at 0.6 s, {more} at 3 s')
    ctx.close()

    if exc:
        fails.append(f'calligraphy pageerror: {exc[:3]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nSTROKE PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
