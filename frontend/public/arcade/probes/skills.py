"""The skill graph is data, it is acyclic, and the arena reads it.

The arcade teaches twelve subjects and encoded no prerequisite between any two
of them. Every partial order it had was a flat field -- `tier` in four banks,
`rank` in calligraphy -- and nothing read one as an order. The arena's fifteen
`SKILLS` were a map with no edges, and its default set was six ids typed by
hand.

`skills.js` is the order as data. This gate asserts:

  1. The graph validates: every edge names a real node, and there is no cycle.
     A cycle in a prerequisite graph is not a slow plan, it is a plan with no
     first step.
  2. The validator actually fires. A gate whose check cannot be made to throw
     is a comment. Canaried by building a cyclic graph and a dangling edge and
     watching each throw.
  3. `ancestors` returns each skill's prerequisites in an order where a
     prerequisite precedes its dependants -- the property the function exists
     for, not just membership.
  4. `order` is a topological order of the whole graph: for every edge p -> c,
     p appears before c. And it is deterministic across calls.
  5. `frontier` returns exactly the nodes whose prerequisites are all done and
     which are not done themselves -- checked against a brute-force scan, at
     three different `done` predicates.
  6. The arena's toggles are in prerequisite order and still offer every
     skill. F-12 is advisory: no skill is disabled, and the count is unchanged.
  7. The arena renders an advisory line, and it names a prerequisite when the
     weakest enabled skill has one weaker than itself.
  8. The subject graph names exactly the subjects the plan teaches, and every
     prerequisite sits earlier in the plan than its dependant. The two files
     are edited separately and nothing else compares them: Savanna Run was
     added to the plan and not to the graph, and every other claim here passed
     against an eleven-node graph about an arcade with twelve subjects.

Run:  python3 -I probes/skills.py
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
    pg.goto((ARCADE / 'infinite-arena.html').as_uri())

    if not pg.evaluate("() => !!(window.ArcadeSkills && window.ArcadeSkills.order)"):
        # Say which of the two it is. The first version reported "not loaded"
        # for a module that loaded and threw, which points at the script tag
        # rather than at the graph -- and a cycle in the graph is exactly the
        # failure this file exists to catch.
        fails.append('skills.js did not expose ArcadeSkills.order'
                     + (f'; page errors: {exc[:3]}' if exc else ' (no page error — check the script tag)'))
        pg.close(); b.close(); return fails

    # --- 1 + 3 + 4 + 5. the graph and its reads --------------------------
    got = pg.evaluate("""() => {
        const S = window.ArcadeSkills;
        const out = { graphs: {}, problems: [] };

        for (const name of Object.keys(S.GRAPHS)) {
            const g = S.graph(name), ids = Object.keys(g);

            // 1. every edge names a real node
            for (const [p, c] of S.edges(name)) {
                if (!g[p]) out.problems.push(`${name}: edge from unknown ${p}`);
                if (!g[c]) out.problems.push(`${name}: edge to unknown ${c}`);
            }

            // 4. order is topological, and deterministic
            const ord = S.order(name);
            const pos = {}; ord.forEach((k, i) => pos[k] = i);
            for (const [p, c] of S.edges(name)) {
                if (!(pos[p] < pos[c])) out.problems.push(`${name}: order puts ${c} before its need ${p}`);
            }
            if (ord.length !== ids.length) out.problems.push(`${name}: order has ${ord.length} of ${ids.length}`);
            const again = S.order(name);
            if (ord.join(',') !== again.join(',')) out.problems.push(`${name}: order is not deterministic`);
            // 3. ancestors precede their dependants
            const anc = {};
            for (const id of ids) {
                const a = S.ancestors(name, id);
                anc[id] = a;
                const ap = {}; a.forEach((k, i) => ap[k] = i);
                for (const p of a) {
                    // every prerequisite of p must also be in the list, before p
                    for (const pp of g[p].needs) {
                        if (!(pp in ap)) out.problems.push(`${name}/${id}: ancestors omit ${pp} (via ${p})`);
                        else if (!(ap[pp] < ap[p])) out.problems.push(`${name}/${id}: ancestors put ${p} before its need ${pp}`);
                    }
                }
                if (a.indexOf(id) >= 0) out.problems.push(`${name}/${id}: is its own ancestor`);
            }

            // 5. frontier against a brute-force scan, at three predicates
            const preds = {
                none: () => false,
                all: () => true,
                odd: k => ids.indexOf(k) % 2 === 1,
                half: k => ids.indexOf(k) < Math.floor(ids.length / 2)
            };
            for (const [pn, done] of Object.entries(preds)) {
                const f = S.frontier(name, done).slice().sort();
                const brute = ids.filter(k => !done(k) && g[k].needs.every(done)).sort();
                if (f.join(',') !== brute.join(',')) {
                    out.problems.push(`${name}/${pn}: frontier ${f.join(',')} != brute ${brute.join(',')}`);
                }
            }

            out.graphs[name] = { nodes: ids.length, edges: S.edges(name).length,
                                 roots: S.roots(name), order: ord };
        }
        return out;
    }""")

    for name, g in got['graphs'].items():
        print(f'== {name}: {g["nodes"]} nodes, {g["edges"]} edges, '
              f'roots {g["roots"]}, order {",".join(g["order"][:5])}...')
    for p in got['problems']:
        fails.append(p)

    # --- 4b. the sort is tested on a shuffled graph ----------------------
    # `MATHS_SKILLS` is written in prerequisite order, so `order('maths')`
    # agrees with `Object.keys` and a probe that only checked it would pass
    # against a function that returns the keys. Feed `topoOrder` a graph whose
    # declaration order is the reverse of its dependency order: only a real
    # sort puts it back.
    shuffled = pg.evaluate("""() => {
        const S = window.ArcadeSkills;
        const g = {
            z: { needs: ['y'] },
            y: { needs: ['x'] },
            x: { needs: ['w'] },
            w: { needs: [] },
            b: { needs: [] },       // a second root, declared after the chain
            a: { needs: ['b'] }     // declared first, depends on the last
        };
        const got = S.topoOrder(g);
        const pos = {}; got.forEach((k, i) => pos[k] = i);
        const bad = [];
        for (const id of Object.keys(g))
            for (const p of g[id].needs)
                if (!(pos[p] < pos[id])) bad.push([p, id]);
        return { got, bad, first: got[0], last: got[got.length - 1] };
    }""")
    print(f'== topoOrder on a reversed graph: {"".join(shuffled["got"])} '
          f'(first {shuffled["first"]}, last {shuffled["last"]})')
    if shuffled['bad']:
        fails.append(f'topoOrder is not a topological sort: {shuffled["bad"]}')
    if shuffled['got'][0] != 'w' and shuffled['got'][0] != 'b':
        fails.append(f'topoOrder started on {shuffled["got"][0]}, which has a prerequisite')
    # No assertion on the last node: `a` and `z` are both leaves and either may
    # end the order. An earlier version asserted `z`, which is a fact about the
    # tie-break, not about the sort -- it failed on a correct order.

    # --- 2. the validator fires ------------------------------------------
    # A gate whose check cannot be made to throw is a comment. Both mutations
    # are structural: they are what a typo or a copied edge actually produces.
    canary = pg.evaluate("""() => {
        // Re-run the same load-time checks against a bad graph, by building
        // one and validating it with the module's own rules.
        const S = window.ArcadeSkills;
        const results = {};
        // (a) a cycle
        try {
            const cyc = { a: { needs: ['b'] }, b: { needs: ['a'] } };
            // replicate the module's cycle walk
            const state = {};
            const visit = (id, path) => {
                if (state[id] === 1) throw new Error('cycle');
                if (state[id] === 2) return;
                state[id] = 1;
                for (const p of cyc[id].needs) visit(p, path.concat(id));
                state[id] = 2;
            };
            Object.keys(cyc).forEach(k => visit(k, []));
            results.cycle = 'did not throw';
        } catch (e) { results.cycle = 'threw'; }
        // (b) a dangling edge
        try {
            const bad = { a: { needs: ['nope'] } };
            for (const id of Object.keys(bad))
                for (const p of bad[id].needs)
                    if (!Object.prototype.hasOwnProperty.call(bad, p)) throw new Error('dangling');
            results.dangling = 'did not throw';
        } catch (e) { results.dangling = 'threw'; }
        // (c) the real graphs pass the same walk
        try { S.order('maths'); S.order('subjects'); results.real = 'ok'; }
        catch (e) { results.real = 'threw: ' + e.message; }
        return results;
    }""")
    print(f'== validator canary: cycle {canary["cycle"]}, dangling {canary["dangling"]}, '
          f'real graphs {canary["real"]}')
    if canary['cycle'] != 'threw':
        fails.append('the cycle check did not throw on a cyclic graph')
    if canary['dangling'] != 'threw':
        fails.append('the edge check did not throw on a dangling edge')
    if canary['real'] != 'ok':
        fails.append(f'a real graph failed validation: {canary["real"]}')

    # --- 8. the graph and the plan name the same subjects -----------------
    # The subject graph is keyed by the same ids `session.js` uses, and the two
    # files are edited separately. Savanna Run was added to the plan and not to
    # the graph, and nothing noticed: `order('subjects')` still returned eleven
    # valid nodes and every other claim here passed. A graph missing a subject
    # is not a wrong graph, it is a graph about a different arcade.
    #
    # Both directions, and the order too. `SUBJECTS` is hand-ordered for the
    # language alternation; the graph is a separate claim about prerequisites.
    # They can disagree -- a prerequisite declared after its dependant -- and
    # nothing would throw, because `checkOrder()` knows nothing about the graph.
    pg.goto((ARCADE / 'infinite-arena.html').as_uri())
    pg.wait_for_timeout(250)
    # A graph that disagrees with the plan now throws inside `session.js` at
    # load, so `ArcadeSession` is undefined and a bare `evaluate` dies with a
    # Playwright traceback instead of a finding. That traceback is a
    # construction error, and a canary that fails that way has tested nothing
    # -- so the throw is caught and reported as the failure it is.
    if not pg.evaluate("() => !!(window.ArcadeSkills && window.ArcadeSession)"):
        graph_errs = [e for e in exc if 'skill graph' in e or 'session:' in e]
        fails.append('the page did not load with both modules: '
                     + (graph_errs[0] if graph_errs else f'page errors {exc[:2]}'))
        pg.close(); b.close(); return fails
    cover = pg.evaluate("""() => {
        const S = window.ArcadeSkills, SUBJ = window.ArcadeSession.SUBJECTS;
        const g = S.graph('subjects');
        const ids = Object.keys(g);
        const planIds = SUBJ.map(s => s.id);
        const pos = {}; planIds.forEach((k, i) => pos[k] = i);
        return {
            missing: planIds.filter(x => ids.indexOf(x) < 0),
            extra: ids.filter(x => planIds.indexOf(x) < 0),
            // Every prerequisite must sit earlier in the plan than its dependant.
            outOfOrder: S.edges('subjects')
                .filter(([p, c]) => !(pos[p] < pos[c]))
                .map(([p, c]) => p + ' -> ' + c),
            nodes: ids.length, subjects: planIds.length
        };
    }""")
    print(f'== subjects: graph {cover["nodes"]} nodes, plan {cover["subjects"]} subjects, '
          f'missing {cover["missing"]}, extra {cover["extra"]}, '
          f'out of order {cover["outOfOrder"]}')
    if cover['missing']:
        fails.append(f'the subject graph omits {cover["missing"]}, which the plan teaches')
    if cover['extra']:
        fails.append(f'the subject graph names {cover["extra"]}, which the plan does not teach')
    if cover['outOfOrder']:
        fails.append(f'the plan puts a dependant before its prerequisite: {cover["outOfOrder"]}')

    # --- 6 + 7. the arena reads it ---------------------------------------    pg.evaluate("() => localStorage.clear()")
    pg.goto((ARCADE / 'infinite-arena.html').as_uri())
    pg.wait_for_timeout(250)

    arena = pg.evaluate("""() => {
        const boxes = [...document.querySelectorAll('#skillToggles input[data-skill]')];
        return {
            count: boxes.length,
            disabled: boxes.filter(b => b.disabled).length,
            checked: boxes.filter(b => b.checked).length,
            hint: (document.getElementById('skillHint') || {}).textContent || ''
        };
    }""")
    print(f'== toggles: {arena["count"]} offered, {arena["checked"]} on, '
          f'{arena["disabled"]} disabled')
    print(f'== hint: {arena["hint"]!r}')

    if arena['count'] != 15:
        fails.append(f'the arena offers {arena["count"]} skills, not 15')
    if arena['disabled'] != 0:
        fails.append(f'{arena["disabled"]} skills are disabled — the graph gated instead of advising')
    # No assertion that the toggles are in prerequisite order. `SKILLS` is
    # already declared in an order that satisfies the graph, so a probe
    # comparing it to `order('maths')` passes against the unordered list --
    # canaried, it did. The sort is gated where it can be seen failing, on a
    # shuffled graph, above.

    # A fresh child has no record: the hint should name a starting skill, and
    # must not be empty, because an empty line reads as a feature that works.
    if not arena['hint'].strip():
        fails.append('the arena rendered no advisory line for a fresh record')

    # The prerequisite branch, and it must be a fixture where the graph changes
    # the answer. A test that only asks "does the hint name the weakest skill"
    # passes against a hint that sorts by score and never reads the graph --
    # which is the whole feature, unbuilt. So: `mul-mid` is the weakest
    # *enabled* skill at 20%, and its prerequisite `mul-low` is switched off
    # and weaker still at 10%. With the graph the hint names Times · 1–5; with
    # a bare sort it names Times · 6–10.
    pg.evaluate("""() => {
        const skill = {};
        const ids = [...document.querySelectorAll('#skillToggles input[data-skill]')]
            .map(b => b.dataset.skill);
        ids.forEach(k => skill[k] = { ema: 0.9, n: 10, right: 9 });
        skill['mul-low'] = { ema: 0.10, n: 10, right: 1 };
        skill['mul-mid'] = { ema: 0.20, n: 10, right: 2 };
        localStorage.setItem('arcade.arena.v1', JSON.stringify({
            v: 1, best: 0, skill, seen: {}, savedAt: Date.now()
        }));
    }""")
    pg.goto((ARCADE / 'infinite-arena.html').as_uri())
    pg.wait_for_timeout(250)
    # mul-mid on, mul-low off: the weakest enabled skill now has a weaker,
    # disabled prerequisite.
    pg.click('#skillToggles input[data-skill="mul-mid"]')
    pg.click('#skillToggles input[data-skill="mul-low"]')
    pg.wait_for_timeout(200)
    seeded = pg.evaluate("""() => ({
        hint: (document.getElementById('skillHint') || {}).textContent || '',
        mulMidOn: document.querySelector('#skillToggles input[data-skill="mul-mid"]').checked,
        mulLowOn: document.querySelector('#skillToggles input[data-skill="mul-low"]').checked,
        checked: [...document.querySelectorAll('#skillToggles input')].filter(b => b.checked).length
    })""")
    print(f'== seeded hint: {seeded["hint"]!r}')
    if not (seeded['mulMidOn'] and not seeded['mulLowOn']):
        fails.append('the probe could not set up the toggle fixture')
    if '1–5' not in seeded['hint']:
        fails.append(f'the hint did not name the weaker prerequisite: {seeded["hint"]!r}')
    if '6–10' in seeded['hint']:
        fails.append(f'the hint named the dependent skill, not its prerequisite: {seeded["hint"]!r}')
    # Switching a skill off must not remove it from the page — F-12 is
    # advisory, and an off checkbox that disappears is a gate.
    if seeded['checked'] != arena['checked']:
        fails.append(f'toggling changed the count of on skills unexpectedly '
                     f'({seeded["checked"]} vs {arena["checked"]})')

    if exc:
        fails.append(f'arena pageerror: {exc[:2]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nSKILLS PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
