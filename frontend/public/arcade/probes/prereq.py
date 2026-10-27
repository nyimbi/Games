"""The daily plan's order satisfies the skill graph, and a bad order throws.

F-12 asked for the session order to be derived from the prerequisite graph.
It was checked before it was written and it is a no-op: all five subject edges
already hold in the hand-written order, so deriving the order renders
identically to not deriving it. A change that renders identically to no change
is not a feature, it is a change nobody can see fail.

So the graph became a guard instead: `session.js` throws at load if a future
edit moves a subject ahead of something it depends on. The order still exists
for the alternation reason it was written for; the graph now has a veto.

That form is only worth having if the veto works, and the shipped order cannot
exercise it -- which is exactly the shape of gate this repo has been fooled by
before. Every claim here is therefore either a fact about the shipped order or
a fact about a *mutated* copy of `session.js` loaded in a real page:

  1. The shipped order satisfies every edge whose two ends are both in the
     plan, and the guard is not passing vacuously: every plan subject is a node
     in the graph, so no edge is skipped by the "unknown subject" branch.
  2. A copy with `physics` and `howthingswork` swapped throws, and the throw
     comes from the graph check, not from `checkOrder` -- both guards can
     throw on the same edit, so the message is asserted, not the count.
  3. A copy with `chinese` and `calligraphy` swapped throws likewise. Two
     independent edges, because a guard keyed to one pair would pass a probe
     that only ever moved that pair.
  4. A control: a copy with `french` and `swahili` swapped -- both languages,
     no edges either way -- loads clean. Without this, a guard that threw on
     any edit at all would pass claims 2 and 3.
  5. The guard is skipped, not fatal, when `skills.js` is absent. Eleven drill
     pages load `session.js` without the graph and must still open.

Run:  python3 -I probes/prereq.py
"""
import pathlib
import re
import sys
import tempfile

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
SESSION = (ARCADE / 'session.js').read_text()
SKILLS_URI = (ARCADE / 'skills.js').as_uri()


def swapped(ids):
    """A copy of session.js with two whole subject lines exchanged.

    Whole lines, not the `id` fields: the point is a reordered plan, and an
    entry whose id moved but whose `games` did not is a different bug wearing
    the fixture's clothes. Both guards read this one array, so the pairs are
    chosen same-kind -- `checkOrder` stays satisfied and only the graph check
    can speak.
    """
    a, b = ids
    lines = SESSION.splitlines(keepends=True)
    at = {}
    for i, line in enumerate(lines):
        m = re.match(r"\s*\{ id: '([a-z]+)',", line)
        if m and m.group(1) in (a, b):
            at[m.group(1)] = i
    assert sorted(at) == sorted([a, b]), f'fixture found {sorted(at)}, wanted {list(ids)}'
    # Strip the trailing comma, swap, then put one back on whichever of the two
    # ends up not last. The final entry in the literal carries no comma, so a
    # naive swap of whole lines leaves a comma dangling before `];` and the
    # fixture fails to parse -- which reads as "the guard threw" if the probe
    # only counts page errors.
    def body(i):
        return lines[i].rstrip('\n').rstrip().rstrip(',')
    end = next(i for i in range(max(at.values()) + 1, len(lines)) if lines[i].strip() == '];')
    # Both bodies before either assignment: reading `lines[at[a]]` after
    # writing it yields the other entry's text, which silently deletes one
    # subject and leaves the fixture failing the manifest check instead of the
    # graph check.
    ba, bb = body(at[a]), body(at[b])
    lines[at[a]] = bb + (',' if at[a] < end - 1 else '') + '\n'
    lines[at[b]] = ba + (',' if at[b] < end - 1 else '') + '\n'
    return ''.join(lines)


def fixture(tmp, name, ids=None, with_skills=True):
    """A blank page that loads the graph (optionally) and a session.js copy.

    `record.js` too: `session.js` reads `ArcadeRecord.is` at load, so a fixture
    without it throws before either guard runs and the probe reports the
    missing dependency as a failure of the thing it was testing.
    """
    js = swapped(ids) if ids else SESSION
    (tmp / f'{name}.js').write_text(js)
    tags = ''
    if with_skills:
        tags += f'<script src="{SKILLS_URI}"></script>\n'
    tags += f'<script src="{(ARCADE / "record.js").as_uri()}"></script>\n'
    (tmp / f'{name}.html').write_text(
        '<!doctype html><meta charset="utf-8"><title>fixture</title>\n'
        + tags + f'<script src="./{name}.js"></script>\n<p>blank</p>\n')
    return (tmp / f'{name}.html').as_uri()


def open_page(b, uri):
    pg = b.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(uri)
    return pg, errs


def run(pw):
    fails = []
    b = pw.chromium.launch()

    # --- 1. the shipped order, read off the real page --------------------
    # The arena is one of the two pages that loads skills.js before session.js,
    # so it is the only place the guard is live on the shipped order.
    pg, errs = open_page(b, (ARCADE / 'infinite-arena.html').as_uri())
    got = pg.evaluate("""() => {
        const S = window.ArcadeSession, K = window.ArcadeSkills;
        if (!S || !K) return { missing: !S ? 'ArcadeSession' : 'ArcadeSkills' };
        const plan = S.plan(new Date()).map(x => x.id);
        const pos = {}; plan.forEach((id, i) => pos[id] = i);
        const g = K.graph('subjects');
        const all = K.edges('subjects');
        const inPlan = all.filter(([p, c]) => p in pos && c in pos);
        return {
            plan, nodes: Object.keys(g).length, edges: all.length,
            inPlan: inPlan.length,
            unknown: plan.filter(id => !g[id]),
            broken: inPlan.filter(([p, c]) => !(pos[p] < pos[c])).map(([p, c]) => p + '->' + c),
            missingNodes: Object.keys(g).filter(id => !(id in pos))
        };
    }""")
    pg.close()
    if got.get('missing'):
        fails.append(f'the arena did not expose {got["missing"]}')
    else:
        print(f'== plan {len(got["plan"])} subjects, graph {got["nodes"]} nodes / '
              f'{got["edges"]} edges, {got["inPlan"]} edges inside the plan')
        if got['unknown']:
            # The guard's `continue` branch skips an edge naming a subject the
            # plan does not run. If every plan subject were unknown to the
            # graph the guard would pass on zero edges and look green.
            fails.append(f'plan subjects absent from the graph: {got["unknown"]}')
        if got['inPlan'] != got['edges'] - len(got['missingNodes']):
            fails.append(f'guard checked {got["inPlan"]} of {got["edges"]} edges, '
                         f'expected {got["edges"] - len(got["missingNodes"])}')
        for pair in got['broken']:
            fails.append(f'shipped order violates {pair}')
    if errs:
        fails.append(f'arena threw on load: {errs[:2]}')

    # --- 2..4. the veto, on mutated copies -------------------------------
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='prereq-'))
    # Each pair is same-kind, so `checkOrder` stays satisfied and only the
    # graph check can speak. The control pair has no edges in either direction.
    cases = [
        (('physics', 'howthingswork'), True, 'howthingswork', 'physics'),
        (('chinese', 'calligraphy'), True, 'calligraphy', 'chinese'),
        (('french', 'swahili'), False, None, None),
    ]
    for i, (pair, should_throw, child, parent) in enumerate(cases):
        uri = fixture(tmp, f'swap{i}', pair)
        pg, errs = open_page(b, uri)
        ok = pg.evaluate("() => !!window.ArcadeSession")
        pg.close()
        label = f'{pair[0]}/{pair[1]} swapped'
        if should_throw:
            msg = ' '.join(errs)
            if not errs:
                fails.append(f'{label}: loaded clean, expected a throw')
            elif 'the skill graph says' not in msg:
                # `checkOrder` can throw on the same edit; that is a different
                # guard answering a different question, and it would leave the
                # graph unguarded while this probe went green.
                fails.append(f'{label}: threw, but not from the graph check: {msg[:160]}')
            elif child not in msg or parent not in msg:
                fails.append(f'{label}: message does not name both subjects: {msg[:160]}')
            else:
                print(f'== {label}: threw as designed — {msg.splitlines()[0][:110]}')
        else:
            if errs:
                fails.append(f'{label} (control): threw {errs[:1]}')
            elif not ok:
                fails.append(f'{label} (control): ArcadeSession missing after a clean load')
            else:
                print(f'== {label} (control): loaded clean, no throw')

    # --- 5. no graph, no veto -------------------------------------------
    uri = fixture(tmp, 'nograph', with_skills=False)
    pg, errs = open_page(b, uri)
    ok = pg.evaluate("() => !!window.ArcadeSession")
    hask = pg.evaluate("() => !!window.ArcadeSkills")
    pg.close()
    if hask:
        fails.append('the no-graph fixture loaded skills.js anyway; the claim is untested')
    if errs:
        fails.append(f'session.js without the graph threw: {errs[:1]}')
    if not ok:
        fails.append('session.js without the graph did not export ArcadeSession')

    # A drill page is the real instance of claim 5.
    pg, errs = open_page(b, (ARCADE / 'spelling-bee.html').as_uri())
    drill_ok = pg.evaluate("() => !!(window.ArcadeSession && !window.ArcadeSkills)")
    pg.close()
    if errs:
        fails.append(f'spelling-bee threw: {errs[:2]}')
    if not drill_ok:
        fails.append('spelling-bee does not load session.js without the graph as assumed')

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nPREREQ PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
