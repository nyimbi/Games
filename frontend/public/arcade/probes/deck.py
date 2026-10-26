"""Pass two is least-recently-served first, and pass one is never-served first.

`freshness.py` covers pass zero only. A deck that gets pass zero right and pass
two wrong passes every probe in the tree, which is why this one exists: it is
the gate the roadmap names as a precondition for touching the deck at all.

Three claims about `ArcadeDeck`, each with a way to come out false:

  1. `freshFirst` puts never-served facts before served ones, whatever order
     the pool arrives in.
  2. `newCycle` orders by ascending timestamp -- least recently served first --
     and does NOT shuffle. The never-served facts all tie at zero, so they keep
     pool order; a shuffle here would be a silent change to how a deck repeats.
  3. `keyOf` is required. Calling without it throws rather than defaulting to
     `a|b`, which is the default that made division order by the wrong
     identity for as long as it did.

Claim 2 is driven on a fixed pool with distinct timestamps so the expected
order is exact, not statistical. Claim 3 is the one that protects the next
caller rather than this one.

Run:  python3 -I probes/deck.py
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
    pg.goto((ARCADE / 'index.html').as_uri())

    if not pg.evaluate("() => !!window.ArcadeDeck"):
        fails.append('deck.js did not define ArcadeDeck on index.html')
        pg.close(); b.close(); return fails

    # --- 1. never-served first ---------------------------------------------
    # The pool arrives newest-first so a passing result cannot be pool order.
    got = pg.evaluate("""() => {
        const D = window.ArcadeDeck, k = f => f.id;
        const bucket = { c: 100, d: 200 };
        const pool = [{id:'d'},{id:'c'},{id:'b'},{id:'a'}];
        return D.freshFirst(pool, bucket, k).map(f => f.id);
    }""")
    print(f'== freshFirst: {got}')
    if sorted(got[:2]) != ['a', 'b']:
        fails.append(f'freshFirst did not put the never-served facts first: {got}')
    if got[2:] != sorted(got[2:], key=lambda i: {'c': 100, 'd': 200}[i]):
        fails.append(f'the stale half is not least-recently-served first: {got}')

    # --- 1b. ties in the stale half are shuffled, not insertion order ------
    # This is the property the six copies disagreed on and the one a refactor
    # is most likely to drop: `shuffle(stale)` before `.sort` exists solely to
    # make equal timestamps come out in random order. It cannot be seen in one
    # run -- every order is legal -- so it is measured over many draws against
    # the uniform distribution it should produce.
    #
    # Four stale facts with identical timestamps: under the shuffle, each of the
    # 24 orderings is equally likely; without it, the single insertion order
    # repeats forever. 200 draws puts the expected count per ordering at ~8.3,
    # so "only one ordering ever appears" is unambiguous rather than marginal.
    tie = pg.evaluate("""() => {
        const D = window.ArcadeDeck, k = f => f.id;
        const bucket = { a: 500, b: 500, c: 500, d: 500 };
        const pool = [{id:'a'},{id:'b'},{id:'c'},{id:'d'}];
        const seen = new Set();
        for (let i = 0; i < 200; i++) {
            seen.add(D.freshFirst(pool, bucket, k).map(f => f.id).join(''));
        }
        return { distinct: seen.size, sample: [...seen].slice(0, 3) };
    }""")
    print(f'== stale ties over 200 draws: {tie["distinct"]} distinct orderings')
    if tie['distinct'] < 2:
        fails.append(f'freshFirst does not shuffle equal timestamps: only '
                     f'{tie["distinct"]} ordering(s) in 200 draws ({tie["sample"]})')

    # --- 2. newCycle is ascending and unshuffled ---------------------------    # Ten facts with distinct timestamps; the expected order is exact.
    res = pg.evaluate("""() => {
        const D = window.ArcadeDeck, k = f => f.id;
        const pool = [];
        for (let i = 0; i < 10; i++) pool.push({id: 'f' + i});
        const bucket = {};
        pool.forEach((f, i) => { bucket[f.id] = (i + 1) * 1000; });
        // Pool in reverse so "already sorted" cannot be the explanation.
        const order = D.newCycle(pool.slice().reverse(), bucket, k).map(f => f.id);
        // Never-served facts all tie at zero and must keep pool order.
        const tiePool = [{id:'x'},{id:'y'},{id:'z'}];
        const ties = D.newCycle(tiePool, {}, k).map(f => f.id);
        return { order, ties };
    }""")
    print(f'== newCycle: {res["order"]}')
    print(f'== ties (never served): {res["ties"]}')
    want = [f'f{i}' for i in range(10)]
    if res['order'] != want:
        fails.append(f'newCycle is not least-recently-served first: {res["order"]} != {want}')
    if res['ties'] != ['x', 'y', 'z']:
        fails.append(f'newCycle reordered facts that all tie at zero: {res["ties"]}')

    # --- 3. keyOf is required ----------------------------------------------
    threw = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const out = {};
        try { D.freshFirst([{a:1,b:2}], {}); out.freshFirst = false; }
        catch (e) { out.freshFirst = e instanceof TypeError; }
        try { D.newCycle([{a:1,b:2}], {}); out.newCycle = false; }
        catch (e) { out.newCycle = e instanceof TypeError; }
        return out;
    }""")
    print(f'== keyOf required: {threw}')
    if not threw.get('freshFirst'):
        fails.append('freshFirst did not throw without keyOf')
    if not threw.get('newCycle'):
        fails.append('newCycle did not throw without keyOf')

    # --- 4. markSeen evicts the oldest at the cap --------------------------
    cap = pg.evaluate("""() => {
        const D = window.ArcadeDeck;
        const bucket = {};
        for (let i = 0; i < D.SEEN_CAP + 5; i++) {
            bucket['k' + i] = 1000 + i;       // ascending timestamps
        }
        const before = Object.keys(bucket).length;
        D.markSeen(bucket, 'fresh');
        return {
            before, after: Object.keys(bucket).length, cap: D.SEEN_CAP,
            oldestGone: !('k0' in bucket) && !('k1' in bucket),
            newestKept: 'k' + (D.SEEN_CAP + 4) in bucket,
            added: 'fresh' in bucket,
        };
    }""")
    print(f'== markSeen at the cap: {cap}')
    if cap['after'] > cap['cap']:
        fails.append(f'markSeen left {cap["after"]} entries against a cap of {cap["cap"]}')
    if not cap['oldestGone']:
        fails.append('markSeen did not evict the oldest entries')
    if not cap['newestKept'] or not cap['added']:
        fails.append('markSeen evicted the wrong end of the bucket')

    if exc:
        fails.append(f'pageerror: {exc[:2]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nDECK PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
