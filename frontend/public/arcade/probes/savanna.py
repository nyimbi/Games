"""Savanna Run: the jump height is the answer, and the algebra is honest.

The game's claim is narrow enough to test: three bands, each reachable by a
different hold time, and the option on a band is the answer if and only if it
equals the equation's solution. Everything else -- the parallax, the dust --
is decoration, and this file does not test decoration.

Eight claims:

  1. Every gate the bank builds has exactly three distinct options, and one of
     them is the equation's own solution. A gate with a duplicate option, or
     with the answer missing, has no right band to reach.
  2. The bands are separated by more than the physics can blur. Two bands
     closer together than a frame of travel are one band wearing two labels.
  3. The band reading is by apex, not by "highest passed". A jump that reaches
     the top passes through the lower bands; if the reading were "highest
     passed", every long hold would score as the low answer.
  4. Jumping reaches the band it aims at. Driven through the real input path
     (press, hold, release), each of the three hold times lands in its own
     band. This is the claim that a wrong constant breaks, and it is the one
     no amount of reading the code can settle.
  5. A wrong answer costs a try, not the gate: the same equation is still
     there and the same three options, and one gate submitted twice is still
     one gate.
  6. The history bank is sourced and complete: every level has a palette, an
     intro, at least three facts, and every fact names a source.
  7. Live: the run starts, a gate opens, and answering it correctly advances.
  8. The session tracker sees the run: ending it writes a ratio into an
     element `session.js` reads, sets a marker class `session.js` accepts, and
     the day's record gains the subject.

Run:  python3 -I probes/savanna.py
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
    reqs = []
    pg.on('request', lambda r: reqs.append(r.url))
    pg.goto((ARCADE / 'savanna-run.html').as_uri())

    if not pg.evaluate("() => !!(window.SavannaRun && window.AlgebraBank)"):
        fails.append('the page did not expose SavannaRun/AlgebraBank'
                     + (f'; page errors: {exc[:3]}' if exc else ' (no page error — check the script tags)'))
        pg.close(); b.close(); return fails

    # --- 1 + 2. the bank ---------------------------------------------------
    bank = pg.evaluate("""() => {
        // Solve an equation of the bank's forms for x. Returns null if the
        // shape is not one this understands -- which is a finding, not a skip.
        function solve(q) {
            const t = q.replace(/\\s+/g, '');
            let m;
            if ((m = /^(\\d+)\\(x([+−-])(\\d+)\\)=(\\d+)$/.exec(t))) {
                const a = +m[1], c = +m[3] * (m[2] === '+' ? 1 : -1), d = +m[4];
                return (d / a) - c;
            }
            if ((m = /^(\\d*)x([+−-])(\\d+)=(\\d*)x([+−-])(\\d+)$/.exec(t))) {
                const a = m[1] ? +m[1] : 1, b = +m[3] * (m[2] === '+' ? 1 : -1);
                const c = m[4] ? +m[4] : 1, d = +m[6] * (m[5] === '+' ? 1 : -1);
                if (a === c) return null;
                return (d - b) / (a - c);
            }
            if ((m = /^(\\d*)x([+−-])(\\d+)=(\\d+)$/.exec(t))) {
                const a = m[1] ? +m[1] : 1, c = +m[3] * (m[2] === '+' ? 1 : -1), d = +m[4];
                return (d - c) / a;
            }
            if ((m = /^(\\d*)x=(\\d+)$/.exec(t))) return +m[2] / (m[1] ? +m[1] : 1);
            if ((m = /^x([+−-])(\\d+)=(\\d+)$/.exec(t))) {
                const a = +m[2] * (m[1] === '+' ? 1 : -1), d = +m[3];
                return d - a;
            }
            if ((m = /^x÷(\\d+)=(\\d+)$/.exec(t))) return +m[1] * +m[2];
            return null;
        }

        const out = { gates: 0, problems: [], bands: null };
        for (let tier = 0; tier < 5; tier++) {
            for (let i = 0; i < 200; i++) {
                const g = window.AlgebraBank.gate(tier);
                out.gates++;
                if (!Array.isArray(g.options) || g.options.length !== 3) {
                    out.problems.push(['not three options', tier, g]);
                    continue;
                }
                if (new Set(g.options).size !== 3) out.problems.push(['duplicate options', tier, g]);
                if (g.options.indexOf(g.answer) < 0) out.problems.push(['answer not among options', tier, g]);
                for (const o of g.options) {
                    if (!Number.isInteger(o) || o <= 0) out.problems.push(['non-positive or fractional option', tier, g]);
                }
                // The stated equation must actually have the stated answer.
                // Parsed by shape, not by one regex: the bank has eight forms
                // and the first version's single pattern only matched the four
                // that start with a bare `x`, so every `x ÷ a = b` was reported
                // as unparseable while being correct.
                const m = solve(g.q);
                if (m === null) out.problems.push(['unparsed equation', g.q]);
                else if (m !== g.answer) out.problems.push(['stated answer is wrong', g.q, 'says', g.answer, 'but x =', m]);
            }
        }
        out.bands = window.SavannaRun.BAND_H;
        return out;
    }""")
    print(f'== gates built: {bank["gates"]}')
    print(f'== bands (px): {[round(x, 1) for x in bank["bands"]]}')
    for p in bank['problems'][:6]:
        fails.append(f'bank: {p}')

    bands = bank['bands']
    if not (bands[0] < bands[1] < bands[2]):
        fails.append(f'bands are not increasing: {bands}')
    # A band gap smaller than the rise in one 60fps frame is unreachable: the
    # runner passes through it between samples.
    frame_rise = 520 * (1 / 60)
    for i in range(1, 3):
        if bands[i] - bands[i - 1] < frame_rise:
            fails.append(f'bands {i-1} and {i} are {bands[i]-bands[i-1]:.1f}px apart, '
                         f'under one frame of rise ({frame_rise:.1f}px)')

    # --- 3. the band reading is by apex -----------------------------------
    # A jump to the top band passes every lower one. If `bandOf` were "highest
    # passed", this would return 0 for a top-band apex.
    #
    # The `between` cases are the ones that actually distinguish the two
    # readings. Testing only the exact band heights proves nothing: "nearest"
    # and "highest passed" agree at BAND_H[i] by construction, so the first
    # version of this claim passed against a bandOf that returned the wrong
    # band for every jump in the game. An apex just under the middle band is
    # the discriminator -- nearest says 1, highest-passed says 0.
    read = pg.evaluate("""() => {
        const S = window.SavannaRun, B = S.BAND_H;
        return {
            atTop: S.bandOf(B[2]),
            atMid: S.bandOf(B[1]),
            atLow: S.bandOf(B[0]),
            aboveTop: S.bandOf(B[2] + 40),
            belowLow: S.bandOf(0),
            justUnderMid: S.bandOf(B[1] - 6),
            justUnderTop: S.bandOf(B[2] - 6),
            midwayLowMid: S.bandOf((B[0] + B[1]) / 2 + 4)
        };
    }""")
    print(f'== bandOf: top {read["atTop"]}, mid {read["atMid"]}, low {read["atLow"]}, '
          f'above {read["aboveTop"]}, ground {read["belowLow"]}, '
          f'under-mid {read["justUnderMid"]}, under-top {read["justUnderTop"]}')
    if (read['atTop'], read['atMid'], read['atLow']) != (2, 1, 0):
        fails.append(f'bandOf does not read the apex: {read}')
    if read['aboveTop'] != 2:
        fails.append('a jump above the top band does not read as the top band')
    if read['belowLow'] != 0:
        fails.append('a jump below the low band does not read as the low band')
    # Nearest, not highest-passed. These three are the discriminator.
    if read['justUnderMid'] != 1:
        fails.append(f'an apex just under the middle band reads as '
                     f'{read["justUnderMid"]}, not 1 — bandOf is not nearest-apex')
    if read['justUnderTop'] != 2:
        fails.append(f'an apex just under the top band reads as '
                     f'{read["justUnderTop"]}, not 2 — bandOf is not nearest-apex')
    if read['midwayLowMid'] != 1:
        fails.append(f'an apex just above the low/mid midpoint reads as '
                     f'{read["midwayLowMid"]}, not 1')

    # --- 4. the real input path reaches each band -------------------------
    # Driven through press/hold/release on the actual state, stepped with a
    # fixed dt. A busy-wait loop was the first version and it tested nothing:
    # the main rAF loop cannot run while the page's JS is spinning, so every
    # hold reported apex 0. Stepping `physics` directly uses the real constants
    # and the real state machine without needing wall-clock.
    reached = pg.evaluate("""() => {
        const S = window.SavannaRun, st = S.state;
        const out = [];
        for (const hold of [0, 100, 250]) {
            st.phase = 'gate';
            st.gate = { q: 'x + 1 = 2', options: [1, 2, 3], answer: 1 };
            st.answered = true;      // keep the landing from scoring
            st.onGround = true; st.y = 0; st.vy = 0;
            st.holding = false; st.holdS = 0; st.apex = 0; st.landT = 0; st.buffered = 0;
            S.press();
            let t = 0;
            const dt = 1 / 60;
            while (t < hold / 1000 - 1e-9) { st.t += dt * 1000; S.step(dt); t += dt; }
            S.release();
            // Fall and land.
            let guard = 0;
            while (!st.onGround && guard++ < 600) { st.t += dt * 1000; S.step(dt); }
            out.push({ hold, apex: st.apex, band: S.bandOf(st.apex), landed: st.onGround });
        }
        return out;
    }""")
    for r in reached:
        print(f'== hold {r["hold"]:>3}ms -> apex {r["apex"]:6.1f}px -> band {r["band"]}'
              f'{"" if r["landed"] else "  (never landed)"}')
    got_bands = [r['band'] for r in reached]
    if got_bands != [0, 1, 2]:
        fails.append(f'hold times 0/100/250ms reached bands {got_bands}, not [0, 1, 2]')
    if not all(r['landed'] for r in reached):
        fails.append('a jump never landed within 10 seconds of simulated time')

    # --- 5. a wrong answer keeps the gate ---------------------------------
    # Driven through the real landing path: land on the band that does NOT
    # hold the answer, and check the same equation is still there.
    retry = pg.evaluate("""() => {
        const S = window.SavannaRun, st = S.state;
        const gate = { q: 'x + 1 = 2', options: [9, 1, 8], answer: 1 };
        st.phase = 'gate';
        st.gate = gate;
        st.answered = false;
        st.hearts = 3; st.attempts = 0; st.gates = 0; st.missed = {};
        st.onGround = false; st.holding = false; st.vy = 60;
        st.apex = S.BAND_H[0];       // the low band, which holds 9, not 1
        st.y = 0.1;
        // One physics step lands the runner and fires the answer path.
        S.step(1 / 60);
        const afterOne = { gates: st.gates, hearts: st.hearts };
        // Land on a wrong band a second time. A gate is one gate however many
        // submissions it takes, so this must not move the count. One
        // submission cannot tell the two readings apart -- both give 1 -- and
        // the first version of this check tested exactly one and passed
        // against the bug. Band 2 holds 8, also wrong.
        st.onGround = false; st.holding = false; st.vy = 60;
        st.apex = S.BAND_H[2];
        st.y = 0.1;
        S.step(1 / 60);
        return {
            phase: st.phase, hearts: st.hearts,
            sameQ: !!(st.gate && st.gate.q === gate.q),
            sameOpts: !!(st.gate && JSON.stringify(st.gate.options) === JSON.stringify(gate.options)),
            answered: st.answered,
            gates: st.gates, afterOne: afterOne,
            missed: Object.keys(st.missed || {})
        };
    }""")
    print(f'== after two wrong answers: phase {retry["phase"]}, hearts {retry["hearts"]}, '
          f'same gate {retry["sameQ"] and retry["sameOpts"]}, '
          f'gates {retry["afterOne"]["gates"]} then {retry["gates"]}')
    if retry['afterOne']['hearts'] != 2 or retry['hearts'] != 1:
        fails.append(f'wrong answers did not cost one try each '
                     f'(hearts {retry["afterOne"]["hearts"]} then {retry["hearts"]})')
    if not (retry['sameQ'] and retry['sameOpts']):
        fails.append('a wrong answer replaced the gate instead of keeping it')
    if not retry['missed']:
        fails.append('a wrong answer was not recorded in `missed`')
    # A gate is one gate however many submissions it takes. The first version
    # counted submissions, so a retried gate read as two -- which inflated the
    # end panel and deflated the first-try ratio the session record keeps.
    if retry['afterOne']['gates'] != 1 or retry['gates'] != 1:
        fails.append(f'one gate submitted twice counted as {retry["afterOne"]["gates"]} then '
                     f'{retry["gates"]} gate(s), not 1 both times')

    # --- 6. the history bank ----------------------------------------------
    hist = pg.evaluate("""() => {
        const L = window.AfricanHistory.LEVELS, probs = [];
        const seenIds = new Set();
        for (const l of L) {
            if (!l.id || seenIds.has(l.id)) probs.push(['missing or duplicate id', l.name]);
            seenIds.add(l.id);
            for (const k of ['name', 'where', 'when', 'intro']) {
                if (!l[k] || !String(l[k]).trim()) probs.push([k + ' missing', l.id]);
            }
            if (!l.palette || !Array.isArray(l.palette.sky) || l.palette.sky.length !== 2) {
                probs.push(['palette incomplete', l.id]);
            }
            if (!Array.isArray(l.scenery) || l.scenery.length < 2) probs.push(['too little scenery', l.id]);
            if (!Array.isArray(l.facts) || l.facts.length < 3) probs.push(['fewer than 3 facts', l.id]);
            for (const f of (l.facts || [])) {
                if (!f.t || !f.d) probs.push(['fact missing title or body', l.id]);
                if (!f.source || !String(f.source).trim()) probs.push(['fact has no source', l.id, f.t]);
            }
        }
        return { levels: L.map(l => l.name), count: L.length, facts: L.reduce((n, l) => n + (l.facts || []).length, 0), probs };
    }""")
    print(f'== history: {hist["count"]} levels, {hist["facts"]} facts — {", ".join(hist["levels"])}')
    for p in hist['probs'][:6]:
        fails.append(f'history: {p}')
    if hist['count'] < 5:
        fails.append(f'only {hist["count"]} history levels')

    # --- 7. live ----------------------------------------------------------    pg.evaluate("() => localStorage.clear()")
    pg.goto((ARCADE / 'savanna-run.html').as_uri())
    pg.wait_for_timeout(200)
    pg.click('#startBtn')
    pg.wait_for_timeout(120)
    live = pg.evaluate("() => ({ phase: window.SavannaRun.state.phase, "
                       "startHidden: document.getElementById('startPanel').hidden })")
    if live['phase'] != 'run' or not live['startHidden']:
        fails.append(f'start did not begin the run: {live}')

    # Let the runner reach the first gate. The gate is at world x GATE_GAP and
    # the runner moves at RUN_SPEED, so this is bounded.
    pg.wait_for_timeout(3400)
    gate = pg.evaluate("""() => {
        const st = window.SavannaRun.state;
        return { phase: st.phase, q: st.gate && st.gate.q,
                 opts: st.gate && st.gate.options, chip: document.getElementById('chipGate').textContent };
    }""")
    print(f'== live gate: phase {gate["phase"]}, {gate["q"]!r}, options {gate["opts"]}')
    if gate['phase'] != 'gate' or not gate['q']:
        fails.append(f'the runner did not reach a gate: {gate}')
    elif len(set(gate['opts'])) != 3:
        fails.append(f'live gate has duplicate options: {gate["opts"]}')

    # Answer it right: land on the band that holds the answer, through the
    # real landing path.
    if gate['phase'] == 'gate':
        after = pg.evaluate("""() => {
            const S = window.SavannaRun, st = S.state;
            const want = st.gate.options.indexOf(st.gate.answer);
            st.answered = false;
            st.onGround = false; st.holding = false; st.vy = 60;
            st.apex = S.BAND_H[want];
            st.y = 0.1;
            const before = { score: st.score, gateNo: st.gateNo };
            S.step(1 / 60);
            return { want, before, phase: st.phase, gateNo: st.gateNo,
                     score: st.score, hearts: st.hearts, gateCleared: !st.gate };
        }""")
        print(f'== after a right answer: band {after["want"]}, phase {after["phase"]}, '
              f'gate {after["gateNo"]}, score {after["score"]}, hearts {after["hearts"]}')
        if after['score'] <= after['before']['score']:
            fails.append(f'a correct answer scored nothing: {after}')
        if not after['gateCleared']:
            fails.append('a correct answer did not clear the gate')
        if after['hearts'] != 3:
            fails.append(f'a correct answer cost a try (hearts {after["hearts"]})')

    # --- 8. the session tracker sees the run ------------------------------
    # The wiring claim, not the game's own. `session.js` marks a subject by
    # reading `#done` and `resultPct()`, and a page can finish a run without
    # either being reachable: the marker's class has to be one `session.js`
    # accepts, and the ratio has to sit in an element it looks at.
    #
    # Driven by *ending the run*, not by writing the panel's text by hand. The
    # first version wrote `doneText` itself and then asked `resultPct()` to read
    # it back -- so it tested `session.js` against its own fixture, and a canary
    # that redirected the real write to `endNote` passed clean. Ending the run
    # exercises the write the page actually makes.
    pg.evaluate("""() => {
        localStorage.clear();
        const S = window.SavannaRun, st = S.state;
        st.phase = 'gate';
        st.gate = { q: 'x + 1 = 2', options: [9, 1, 8], answer: 1 };
        st.answered = false;
        st.hearts = 1; st.attempts = 0; st.gates = 4; st.firstTry = 3;
        st.missed = {}; st.score = 40; st.level = 0;
        st.onGround = false; st.holding = false; st.vy = 60;
        st.apex = S.BAND_H[0];       // holds 9, not 1 -- a wrong landing
        st.y = 0.1;
        S.step(1 / 60);              // lands, costs the last try, ends the run
    }""")
    pg.wait_for_timeout(400)
    track = pg.evaluate("""() => ({
        pct: window.ArcadeSession.resultPct(),
        finished: window.ArcadeSession.isFinished(),
        phase: window.SavannaRun.state.phase,
        text: document.getElementById('doneText').textContent,
        rec: JSON.parse(localStorage.getItem('arcade.session.v1') || 'null')
    })""")
    day = (track['rec'] or {}).get('days', {})
    marked = [d for d in day.values() if 'savanna' in (d.get('done') or {})]
    print(f'== session: run ended ({track["phase"]}) at {track["text"]!r} -> '
          f'pct {track["pct"]}, finished {track["finished"]}, '
          f'marked {bool(marked)}, best {[d.get("best") for d in day.values()]}')
    if track['phase'] != 'end':
        fails.append(f'the last try did not end the run (phase {track["phase"]})')
    # 3 first-try of 5 gates: the last landing is a *first* submission of its
    # gate, so it counts as a gate without counting as a first try.
    if track['pct'] != 60:
        fails.append(f'the run reports {track["pct"]}%, not 60% for 3 first-try of 5 gates '
                     f'(panel reads {track["text"]!r})')
    if not track['finished']:
        fails.append('session.js does not read savanna-run as finished')
    if not marked:
        fails.append('the run did not mark the savanna subject for today')

    # --- no external requests --------------------------------------------
    outside = [u for u in reqs if not (u.startswith('file://') or u.startswith('data:'))]
    if outside:
        fails.append(f'the page requested {len(outside)} external URL(s): {outside[:3]}')

    if exc:
        fails.append(f'pageerror: {exc[:3]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nSAVANNA PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
