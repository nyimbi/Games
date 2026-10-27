"""A stroke drawn out of order is not a stroke drawn wrongly.

F-24. The page compared each drawn stroke against exactly one template stroke,
the one at the current position. A child who drew stroke 3 when stroke 2 was
asked for got the same "Not that one" as a child who drew a shape that is not
in the character. The corrections differ -- "that stroke comes later" versus
"that is not this stroke" -- and only one of them is true in each case.

`stroke-grade.js` holds both the page's original shape test and the
classification. The page keeps no copy, so there is one threshold.

  1. The shape test still passes and fails where it did. Moving it into a
     module is only safe if the verdict is unchanged, so the boundary is
     asserted from both sides: a stroke within the threshold passes, the same
     stroke scaled past it fails.
  2. A reversed stroke fails. It covers the same pixels, so only the endpoint
     term rejects it -- the term exists for exactly this and a probe that only
     tested shapes would never exercise it.
  3. `diagnose` returns `right` for the asked-for stroke, `later` for one from
     further on with the index, `earlier` for one already drawn, and `shape`
     for a stroke that matches nothing.
  4. `later` beats `earlier` when a stroke would match both. A stroke drawn
     backwards matches nothing; a stroke that is its own mirror image at two
     positions is possible, and the child who has lost their place is ahead
     far more often than behind.
  5. The page's message changes with the verdict. Read off the rendered
     feedback, not off the code: the two cases must produce different text.
  6. The page has no second implementation. A copy of `resample` or a
     `mean < 9` literal in `calligraphy.html` is the drift this avoids.

Run:  python3 -I probes/strokeorder.py
"""
import pathlib
import re
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

    if not pg.evaluate("() => !!(window.ArcadeStrokeGrade && window.CALLIGRAPHY_BANK)"):
        fails.append('stroke-grade.js or the bank did not load: '
                     + (f'page errors {exc[:2]}' if exc else 'no page error'))
        pg.close(); b.close(); return fails

    # --- 1..4. the classifier, over the real bank ------------------------
    got = pg.evaluate("""() => {
        const G = window.ArcadeStrokeGrade, BANK = window.CALLIGRAPHY_BANK;
        const out = { problems: [], chars: 0, verdicts: { right: 0, later: 0, earlier: 0, shape: 0 } };

        // The four verdicts, at every character with enough strokes to have a
        // 'later' and an 'earlier'.
        for (const e of BANK) {
            const p = e.strokes;
            if (p.length < 3) continue;
            out.chars++;
            const cases = [
                [p[1].pts, 1, 'right'],
                [p[2].pts, 1, 'later'],
                [p[0].pts, 1, 'earlier'],
                [[[0, 0], [100, 100]], 1, 'shape']
            ];
            for (const [user, step, want] of cases) {
                const d = G.diagnose(user, p, step);
                out.verdicts[want]++;
                if (d.verdict !== want) {
                    out.problems.push(e.char + ': drew stroke at step ' + step + ', wanted '
                        + want + ', got ' + d.verdict);
                }
                if (want === 'later' && d.at !== 2) {
                    out.problems.push(e.char + ': later named position ' + d.at + ', wanted 2');
                }
                if (want === 'earlier' && d.at !== 0) {
                    out.problems.push(e.char + ': earlier named position ' + d.at + ', wanted 0');
                }
            }
        }

        // 1. the threshold, from both sides.
        //
        // Scaling about the centroid is the wrong probe: both paths are
        // resampled to equal arc length first, so a scaled copy is identical
        // point for point and the test can never fail. Measured -- 0.6x and
        // 1.6x both pass with the same mean as the original. What the
        // resampling does not remove is a change of *shape*, so the distortion
        // is a bow perpendicular to the chord.
        const e0 = BANK.find(c => c.strokes.length >= 2);
        const base = e0.strokes[0].pts;
        const bow = k => {
            const a = base[0], z = base[base.length - 1];
            const dx = z[0] - a[0], dy = z[1] - a[1], L = Math.hypot(dx, dy) || 1;
            const nx = -dy / L, ny = dx / L;
            return base.map((p, i) => {
                const t = i / (base.length - 1), s2 = Math.sin(Math.PI * t) * k;
                return [p[0] + nx * s2, p[1] + ny * s2];
            });
        };
        // Over the whole bank: a bow of 6 units passes everything, 16 fails
        // most of it. The threshold has to sit between, and it does.
        const rates = {};
        for (const k of [6, 16]) {
            let pass = 0, n = 0;
            for (const e of BANK) for (const st of e.strokes) { n++; if (G.strokeScore(bow2(st.pts, k), st.pts).ok) pass++; }
            rates['bow' + k] = pass / n;
        }
        function bow2(pts, k) {
            const a = pts[0], z = pts[pts.length - 1];
            const dx = z[0] - a[0], dy = z[1] - a[1], L = Math.hypot(dx, dy) || 1;
            const nx = -dy / L, ny = dx / L;
            return pts.map((p, i) => {
                const t = i / (pts.length - 1), s2 = Math.sin(Math.PI * t) * k;
                return [p[0] + nx * s2, p[1] + ny * s2];
            });
        }
        out.threshold = { near: G.strokeScore(base, base), rates };

        // 2. every stroke in the bank, drawn backwards. The endpoint term alone
        // misses 437 of 3,086 (dots and short horizontals, where a reversal is
        // only a few units off); the chord cosine rejects all of them.
        let revAccepted = 0, fwdAccepted = 0, nStrokes = 0;
        for (const e of BANK) for (const st of e.strokes) {
            nStrokes++;
            if (G.strokeScore(st.pts.slice().reverse(), st.pts).ok) revAccepted++;
            if (G.strokeScore(st.pts, st.pts).ok) fwdAccepted++;
        }
        out.reversed = { n: nStrokes, accepted: revAccepted, forward: fwdAccepted };

        // 4. later beats earlier: a stroke that is within threshold of both a
        // later and an earlier template. Construct one rather than hope the
        // bank has one -- a short stroke drawn on top of another's midpoint.
        const p2 = e0.strokes;
        const both = p2.length >= 4 ? (() => {
            // midpoint of stroke 1, drawn as a tiny dot: close to the middle of
            // every long stroke, so it is a shape match for several.
            const a = p2[1].pts, b2 = p2[3].pts;
            const midOf = s => s.reduce((q, p) => [q[0] + p[0] / s.length, q[1] + p[1] / s.length], [0, 0]);
            const m = midOf(a), n = midOf(b2);
            return [[m[0], m[1]], [n[0], n[1]]];
        })() : null;
        if (both) {
            const d = G.diagnose(both, p2, 2);
            out.both = { verdict: d.verdict, at: d.at };
        }
        return out;
    }""")

    print(f'== {got["chars"]} characters with 3+ strokes; verdicts {got["verdicts"]}')
    for p in got['problems'][:10]:
        fails.append(p)
    if len(got['problems']) > 10:
        fails.append(f'... and {len(got["problems"]) - 10} more classification problems')

    t = got['threshold']
    if not t['near']['ok']:
        fails.append(f'a stroke against itself does not pass: mean {t["near"]["mean"]:.2f}')
    rates = t['rates']
    # Both directions: a threshold that rejects everything is as useless as one
    # that accepts everything, and only asserting one side would pass against
    # either.
    if rates['bow6'] < 0.99:
        fails.append(f'a 6-unit bow rejects {100 - rates["bow6"] * 100:.1f}% of the bank: too strict')
    if rates['bow16'] > 0.5:
        fails.append(f'a 16-unit bow still passes {rates["bow16"] * 100:.1f}% of the bank: too loose')
    print(f'== threshold: self mean {t["near"]["mean"]:.2f}; '
          f'bow6 {rates["bow6"] * 100:.0f}% pass, bow16 {rates["bow16"] * 100:.0f}% pass')

    r = got['reversed']
    if r['accepted']:
        fails.append(f'{r["accepted"]} of {r["n"]} strokes pass when drawn backwards')
    if r['forward'] != r['n']:
        fails.append(f'{r["n"] - r["forward"]} of {r["n"]} strokes fail when drawn exactly')
    print(f'== reversed: {r["accepted"]} of {r["n"]} accepted backwards, '
          f'{r["forward"]} accepted forwards')

    # --- 5. the page says different things for the two mistakes ---------
    # Tier 3 is the 8+ stroke tier, but its shortest character has two strokes,
    # so the queue is not a guarantee. Seed `seen` for every character with
    # fewer than three strokes so `freshFirst` cannot offer one -- the page
    # picks by tier and freshness, and this is the same mechanism it uses.
    pg.evaluate("""() => {
        const short = window.CALLIGRAPHY_BANK.filter(c => c.strokes.length < 3).map(c => c.char);
        const seen = { 3: {} };
        short.forEach(ch => { seen[3][ch] = Date.now(); });
        localStorage.setItem('arcade.calligraphy.v1',
            JSON.stringify({ v: 1, best: 0, seen, review: {}, perTier: {}, tier: 3, savedAt: Date.now() }));
    }""")
    pg.reload()
    pg.click('#tiers [data-tier="3"]')
    pg.click('#modes [data-mode="order"]')
    pg.wait_for_selector('#practice.on', timeout=5000)
    # `show()` scrolls the stage into view with `behavior: 'smooth'`. Reading
    # the board's rect during that scroll gives a position the board has left
    # by the time the pointer arrives, and the stroke lands nowhere -- which
    # reads as "the page said nothing" rather than as a harness fault.
    pg.wait_for_timeout(700)

    def draw(pts):
        """Drag the pointer through `pts` in the 0-100 box."""
        box = pg.evaluate("""() => {
            const r = document.getElementById('mizige').getBoundingClientRect();
            return { x: r.left, y: r.top, w: r.width, h: r.height };
        }""")
        def at(p):
            return (box['x'] + p[0] / 100 * box['w'], box['y'] + p[1] / 100 * box['h'])
        pg.mouse.move(*at(pts[0]))
        pg.mouse.down()
        for p in pts[1:]:
            pg.mouse.move(*at(p), steps=6)
        pg.mouse.up()
        pg.wait_for_timeout(120)

    fb = lambda: pg.evaluate("() => document.getElementById('pFb').textContent")
    strokes = pg.evaluate("""() => {
        // The character the page is actually asking for, read off the page.
        const ch = document.getElementById('charGhost').textContent;
        const e = window.CALLIGRAPHY_BANK.find(c => c.char === ch);
        return e ? e.strokes.map(s => s.pts) : null;
    }""")
    if not strokes or len(strokes) < 3:
        fails.append('the page did not open on a character with 3+ strokes; claim 5 is untested')
    else:
        # (a) a stroke from later in the character
        draw(strokes[2])
        later_text = fb()
        print(f'== out of order: {later_text[:90]!r}')
        if 'too soon' not in later_text:
            fails.append(f'a stroke from later in the character was not called out of order: {later_text[:120]!r}')

        # (b) a stroke that is in no character at all
        pg.evaluate("() => { const b = document.getElementById('pClear'); if (b) b.click(); }")
        draw([[4, 96], [96, 4]])
        shape_text = fb()
        print(f'== wrong shape:  {shape_text[:90]!r}')
        if shape_text == later_text:
            fails.append('the two mistakes produced the same message')
        if 'too soon' in shape_text:
            fails.append(f'a shape that matches nothing was called out of order: {shape_text[:120]!r}')
        if 'Not that one' not in shape_text:
            fails.append(f'a wrong shape did not get the shape message: {shape_text[:120]!r}')

    # --- 6. no second implementation in the page ------------------------
    html = (ARCADE / 'calligraphy.html').read_text()
    # The page may *call* the module; it must not carry its own copy. Comments
    # are stripped first so a sentence mentioning the threshold does not fail
    # the check -- and so a commented-out copy would still be found.
    body = re.sub(r'/\*.*?\*/', '', html, flags=re.S)
    body = re.sub(r'^\s*//.*$', '', body, flags=re.M)
    for pat, what in [
        (r'function\s+resample\s*\(', 'a local resample()'),
        (r'function\s+scoreStroke\s*\(', 'a local scoreStroke()'),
        (r'mean\s*<\s*9', 'the threshold literal mean < 9'),
    ]:
        if re.search(pat, body):
            fails.append(f'calligraphy.html still carries {what}; the module is not the only copy')
    # And the page must actually use the module.
    if 'ArcadeStrokeGrade' not in body:
        fails.append('calligraphy.html never calls ArcadeStrokeGrade')

    if exc:
        fails.append(f'calligraphy pageerror: {exc[:3]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nSTROKE ORDER PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
