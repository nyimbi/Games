/* One skill graph across the eleven subjects.
 *
 * The arcade teaches eleven subjects and encoded no prerequisite between any
 * two of them. Every partial order it did have was stored as a flat field --
 * `calligraphy-bank.js` has `tier` and `rank`, the spelling bank has `tier`,
 * French has `tier` and `family` -- and nothing read any of them as an order.
 * `infinite-arena.html` had a `SKILLS` map with fifteen skills and no edges at
 * all; its default set was a hand-written frontier.
 *
 * This file is the order, as data. It does not teach anything and it does not
 * gate anything -- `README.md:778` forbids mechanics that punish absence, and
 * a locked drill is that mechanic with a different name. What it provides is a
 * *read*: given what a child can already do, which skill is next, and which
 * skills does this one need first.
 *
 * Two graphs, one shape. The arena's fifteen maths skills are one; the eleven
 * subjects are the other. They are different sizes and the same code reads
 * both, because the question -- "what does this need before it makes sense" --
 * is the same question.
 *
 * Edges point from a skill to what it needs first: `needs` lists the
 * predecessors. That direction is the one a caller asks in ("what must come
 * before this?") and the reverse is one `children()` away.
 */
(function () {
  'use strict';

  /* ---------- the arena's maths skills ----------
   *
   * Fifteen skills, and the edges are the ones the skill names already imply.
   * A child who cannot add to 10 cannot add one-digit numbers fluently: both
   * are facts whose sum is under 20 and the first is the subset that makes ten.
   * Nothing here is controversial, which is the point -- an edge nobody would
   * argue with is an edge that can be asserted without a study behind it.
   *
   * `mixed` needs everything, because it draws from all four operations.
   */
  const MATHS_SKILLS = {
    'add-10':   { label: 'Add to 10',        needs: [] },
    'sub-10':   { label: 'Subtract to 10',   needs: [] },
    'add-1d':   { label: 'Add · 1 digit',    needs: ['add-10'] },
    'sub-1d':   { label: 'Subtract · 1 digit', needs: ['sub-10'] },
    'add-2d':   { label: 'Add · 2 digit',    needs: ['add-1d'] },
    'sub-2d':   { label: 'Subtract · 2 digit', needs: ['sub-1d'] },
    'add-3d':   { label: 'Add · 3 digit',    needs: ['add-2d'] },
    'sub-3d':   { label: 'Subtract · 3 digit', needs: ['sub-2d'] },
    'mul-low':  { label: 'Times · 1–5',      needs: ['add-1d'] },
    'mul-mid':  { label: 'Times · 6–10',     needs: ['mul-low'] },
    'mul-high': { label: 'Times · 11–20',    needs: ['mul-mid'] },
    'div-low':  { label: 'Divide · 1–5',     needs: ['mul-low'] },
    'div-mid':  { label: 'Divide · 6–10',    needs: ['mul-mid', 'div-low'] },
    'div-high': { label: 'Divide · 11–20',   needs: ['mul-high', 'div-mid'] },
    'mixed':    { label: 'Mixed challenge',  needs: ['add-2d', 'sub-2d', 'mul-mid', 'div-mid'] }
  };

  /* ---------- the eleven subjects ----------
   *
   * Fewer edges, and softer ones, because a subject is not a fact. Typing
   * needs nothing -- a child can hunt and peck from the first day. Piano
   * reading needs nothing either, though it is easier once a child can read
   * the numbers in a bar, which is maths.
   *
   * These are advisory in a stronger sense than the maths edges: a child who
   * starts on Kiswahili with no French is not making a mistake, and the arcade
   * will not tell them they are. The graph is here so the *plan* can be
   * ordered, not so a drill can be refused.
   */
  const SUBJECT_SKILLS = {
    spelling:      { label: 'Spelling',       needs: [] },
    maths:         { label: 'Maths',          needs: [] },
    french:        { label: 'French',         needs: [] },
    physics:       { label: 'Physics',        needs: ['maths'] },
    chinese:       { label: 'Mandarin',       needs: [] },
    chemistry:     { label: 'Chemistry',      needs: ['maths'] },
    swahili:       { label: 'Kiswahili',      needs: [] },
    typing:        { label: 'Typing',         needs: [] },
    calligraphy:   { label: 'Calligraphy',    needs: ['chinese'] },
    piano:         { label: 'Piano',          needs: [] },
    howthingswork: { label: 'How things work', needs: ['physics'] }
  };

  const GRAPHS = { maths: MATHS_SKILLS, subjects: SUBJECT_SKILLS };

  /* Validate at load, the way `checkOrder()` does and for the same reason: a
     cycle in a prerequisite graph is not a slow plan, it is a plan with no
     first step, and the failure mode is a page that renders an empty frontier
     and looks like it is working.

     Three claims. Every edge names a node that exists -- a typo in `needs` is
     otherwise a silently-dropped edge, which weakens the order without
     breaking it. There is no cycle. And every node is reachable from some
     root, which follows from acyclicity plus the edge-exists check but is
     cheap enough to state directly.

     `O(V+E)` once, at load, on 26 nodes. */
  (function checkGraphs() {
    for (const [name, g] of Object.entries(GRAPHS)) {
      const ids = Object.keys(g);
      for (const id of ids) {
        const n = g[id];
        if (!n || !Array.isArray(n.needs)) throw new Error('skills: ' + name + '/' + id + ' has no needs list');
        for (const p of n.needs) {
          if (!Object.prototype.hasOwnProperty.call(g, p)) {
            throw new Error('skills: ' + name + '/' + id + ' needs ' + p + ', which is not a skill');
          }
        }
        if (n.needs.indexOf(id) >= 0) throw new Error('skills: ' + name + '/' + id + ' needs itself');
      }
      // Depth-first cycle check. `state` is 1 on the current path, 2 when done.
      const state = {};
      const visit = (id, path) => {
        if (state[id] === 1) {
          throw new Error('skills: ' + name + ' has a cycle: ' + path.concat(id).join(' -> '));
        }
        if (state[id] === 2) return;
        state[id] = 1;
        for (const p of g[id].needs) visit(p, path.concat(id));
        state[id] = 2;
      };
      ids.forEach(id => visit(id, []));
    }
  })();

  /* ---------- reads ----------
   *
   * Every function takes the graph's name, so the two graphs share one code
   * path. Nothing here caches: the graphs are 15 and 11 nodes, and a cache is
   * a second source of truth for a computation that costs microseconds.
   */
  function graph(name) {
    const g = GRAPHS[name];
    if (!g) throw new Error('skills: no graph called ' + name);
    return g;
  }

  /* Skills with no prerequisites. This is what `DEFAULT_ON` was, written out
     by hand and kept in step with `SKILLS` by nobody. */
  function roots(name) {
    return Object.keys(graph(name)).filter(id => graph(name)[id].needs.length === 0);
  }

  /* What `id` needs, transitively, in an order where each entry's own needs
     appear before it. A child following this list meets no skill before its
     prerequisites. */
  function ancestors(name, id) {
    const g = graph(name);
    if (!g[id]) throw new Error('skills: no skill ' + name + '/' + id);
    const seen = new Set(), out = [];
    (function walk(k) {
      if (seen.has(k)) return;
      seen.add(k);
      g[k].needs.forEach(walk);
      out.push(k);
    })(id);
    out.pop();          // the node itself is not its own ancestor
    return out;
  }

  /* What `id` unlocks, transitively. */
  function descendants(name, id) {
    const g = graph(name);
    if (!g[id]) throw new Error('skills: no skill ' + name + '/' + id);
    const seen = new Set(), out = [];
    const queue = [id];
    while (queue.length) {
      const k = queue.shift();
      for (const other of Object.keys(g)) {
        if (seen.has(other) || other === id) continue;
        if (g[other].needs.indexOf(k) < 0) continue;
        seen.add(other); out.push(other); queue.push(other);
      }
    }
    return out;
  }

  /* The frontier: skills whose prerequisites are all satisfied and which are
     not yet satisfied themselves. `done` is a predicate over skill ids, so the
     caller decides what counts -- the arena passes its EMA threshold, a page
     with only a record passes "has any attempts".

     This is the read F-12 is built on. It never returns an empty list for a
     graph with a root, because a root's prerequisite set is empty and is
     vacuously satisfied. If it does return empty, the caller's `done` is true
     everywhere, which is a different answer and should be said differently. */
  function frontier(name, done) {
    const g = graph(name);
    const isDone = typeof done === 'function' ? done : () => false;
    return Object.keys(g).filter(id => !isDone(id) && g[id].needs.every(isDone));
  }

  /* The prerequisite of `id` that is least satisfied, or null if it has none.
     "What should this child work on before this one" -- ties broken by the
     caller's own order, since two unmet prerequisites are equally unmet.

     Advisory only. It names a skill to suggest; it never removes one. */
  function weakestNeed(name, id, score) {
    const g = graph(name);
    if (!g[id]) throw new Error('skills: no skill ' + name + '/' + id);
    const s = typeof score === 'function' ? score : () => 1;
    let worst = null, worstScore = Infinity;
    for (const p of g[id].needs) {
      const v = s(p);
      if (v < worstScore) { worstScore = v; worst = p; }
    }
    return worst;
  }

  /* A topological order: every skill appears after everything it needs. Kahn's
     algorithm with the node's own declaration order breaking ties, so the
     result is deterministic and a re-render does not reshuffle the page.

     `O(V+E)`. The graph is validated acyclic at load, so the "cycle" branch
     cannot fire on a named graph; it throws rather than returning a partial
     order because a partial order that renders is indistinguishable from a
     complete one.

     `topoOrder` takes the graph object rather than a name so it can be tested
     against a shuffled input. A sort whose test fixture is already sorted
     proves nothing, and `MATHS_SKILLS` is written in prerequisite order -- a
     probe that only checked `order('maths')` would pass against `Object.keys`. */
  function topoOrder(g) {
    const ids = Object.keys(g);
    const indeg = {}, out = {};
    ids.forEach(id => { indeg[id] = 0; out[id] = []; });
    ids.forEach(id => g[id].needs.forEach(p => { out[p].push(id); indeg[id]++; }));
    const ready = ids.filter(id => indeg[id] === 0);
    const result = [];
    while (ready.length) {
      const id = ready.shift();
      result.push(id);
      for (const n of out[id]) {
        if (--indeg[n] === 0) ready.push(n);
      }
      // Re-sort by declaration order so a node freed early does not jump a
      // sibling declared before it.
      ready.sort((a, b) => ids.indexOf(a) - ids.indexOf(b));
    }
    if (result.length !== ids.length) {
      throw new Error('skills: graph is not acyclic (' + result.length + ' of ' + ids.length + ' ordered)');
    }
    return result;
  }

  function order(name) {
    return topoOrder(graph(name));
  }

  /* Every edge, as [from, to] pairs where `from` must come first. For a probe
     that wants to count claims rather than trust a traversal. */
  function edges(name) {
    const g = graph(name);
    const out = [];
    for (const id of Object.keys(g)) for (const p of g[id].needs) out.push([p, id]);
    return out;
  }

  window.ArcadeSkills = {
    MATHS_SKILLS, SUBJECT_SKILLS, GRAPHS,
    graph, roots, ancestors, descendants, frontier, weakestNeed, order, topoOrder, edges
  };
})();
