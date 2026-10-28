"""A miss in one drill must reach the queue of the drill that asks the same fact.

`familyKey` names a family and `crossDue` reads the other store. Neither is
worth anything unless a child who missed `12 − 7` in subtraction meets `5 + 7`
in addition. This gate asserts the wiring, not the arithmetic:

  1. A due fact in the paired store appears in this drill's queue, as the
     sibling this drill asks, and says where it came from.
  2. The other drill's record is READ, never written. The miss stays where it
     happened -- two pages writing one record is how a record gets two owners.
  3. Level membership is honoured in both directions. `15 − 8` gives the
     sibling `7 + 8`, which belongs at 1-digit and not at bond (sum 15 > 12) or
     2-digit (both operands < 10); `12 − 7` gives `5 + 7`, which belongs at bond
     and not at 2-digit. Serving a sibling from a level the child is not in is
     the bug D-2 already found in this same queue.
  4. A fact this drill already has its own due entry for is not merged.
  5. A fact that is not due in the other store is not served at all. The merge
     is a review queue, not a copy of the other record.
  6. A corrupt record in the other store does not throw and does not poison
     this one.
  7. Addition and multiplication stay separate: a times miss is not served by
     an addition drill, even when the store is named explicitly.
  8. The cap holds.
  9. Live: seed subtraction with a due miss, open addition, and the sibling is
     the first question asked.

Claim 2 is the one a plausible implementation gets wrong: the easy way to merge
is to write the miss into both stores, which makes the two drills disagree the
first time either is cleared.

Run:  python3 -I probes/cross.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
SUB = 'arcade.subtraction.v3'
SUB_STORE = [{ 'key': SUB, 'game': 'subtraction-safari', 'op': 'sub' }]


def seed_sub(pg, review):
    pg.evaluate("""([key, review]) => {
        localStorage.clear();
        localStorage.setItem(key, JSON.stringify({
            v: 1, best: 0, perLevel: {}, review, seen: {}, taught: {},
            savedAt: Date.now()
        }));
    }""", [SUB, review])


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto((ARCADE / 'addition-quest.html').as_uri())

    if not pg.evaluate("() => !!(window.MathsGame && window.MathsGame.crossDue)"):
        fails.append('maths-engine.js does not export crossDue')
        pg.close(); b.close(); return fails

    # --- 1, 3. the merge, and the level it lands in -----------------------
    # 15 − 8 is the family {7, 8}: addition asks 7 + 8, sum 15.
    # 12 − 7 is the family {5, 7}: addition asks 5 + 7, sum 12.
    # Seeded LOW miss first: insertion order is the record's own order, so a
    # fixture that already descends cannot tell sorting from enumeration.
    seed_sub(pg, {
        '2|12|7': {'n': 3, 'miss': 1, 'ok': 0, 'nextAt': 0},
        '2|15|8': {'n': 3, 'miss': 2, 'ok': 0, 'nextAt': 0},
    })
    got = pg.evaluate("""(stores) => {
        const M = window.MathsGame;
        const base = { op: 'add', now: Date.now(), review: {}, stores };
        const at = f => M.crossDue({ ...base, fits: f });
        return {
            bond:  at((a, b) => a + b <= 12),
            one:   at((a, b) => a <= 9 && b <= 9),
            two:   at((a, b) => a >= 10 && b >= 10),
            all:   M.crossDue({ ...base, fits: () => true }),
            limit: M.crossDue({ ...base, fits: () => true, limit: 1 }),
        };
    }""", SUB_STORE)

    for name in ('bond', 'one', 'two', 'all', 'limit'):
        print(f'== {name:5}: {[(c["x"], c["y"], c["from"]) for c in got[name]]}')

    # bond admits 5 + 7 (sum 12) and rejects 7 + 8 (sum 15)
    if [(c['x'], c['y']) for c in got['bond']] != [(5, 7)]:
        fails.append(f'bond level served the wrong siblings: {got["bond"]}')
    # 1-digit admits both
    if sorted((c['x'], c['y']) for c in got['one']) != [(5, 7), (7, 8)]:
        fails.append(f'1-digit served the wrong siblings: {got["one"]}')
    # 2-digit admits neither: both siblings are single-digit facts
    if got['two']:
        fails.append(f'2-digit served a single-digit sibling: {got["two"]}')

    if not got['all']:
        fails.append('a due subtraction fact did not reach the addition queue')
    for c in got['all']:
        if c['x'] + c['y'] != c['a']:
            fails.append(f'a merged sibling states a wrong answer: {c}')
        if c['from'] != 'subtraction-safari':
            fails.append(f'a merged fact does not say where it came from: {c}')
    # miss 2 outranks miss 1, so 7 + 8 is first
    if got['all'] and (got['all'][0]['x'], got['all'][0]['y']) != (7, 8):
        fails.append(f'the merge is not ordered by miss count: {got["all"]}')
    if len(got['limit']) != 1:
        fails.append(f'the limit was not honoured: {len(got["limit"])}')

    # --- 2. the other store is not written -------------------------------
    # Byte comparison alone cannot see a write that re-serialises to the same
    # text, and a merge that round-trips the record through load/save is
    # exactly that. Hook the setter and count the calls instead.
    before = pg.evaluate("([k]) => localStorage.getItem(k)", [SUB])
    got = pg.evaluate("""(stores) => {
        const hits = [];
        const real = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) { hits.push(k); return real.call(this, k, v); };
        try {
            window.MathsGame.crossDue({
                op: 'add', now: Date.now(), review: {}, fits: () => true, stores
            });
        } finally {
            Storage.prototype.setItem = real;
        }
        return hits;
    }""", SUB_STORE)
    after = pg.evaluate("([k]) => localStorage.getItem(k)", [SUB])
    print(f'== writes during crossDue: {got}')
    if got:
        fails.append(f"crossDue wrote to storage during a read: {got}")
    if before != after:
        fails.append("crossDue changed the other drill's record")

    # --- 4. the drill's own due entry suppresses the merge ---------------
    got = pg.evaluate("""(stores) => {
        const M = window.MathsGame;
        const base = { op: 'add', now: Date.now(), fits: () => true, stores };
        // `ownFamily` is called with a family key, and derives from this
        // drill's own review exactly as the pages derive it.
        const fam = window.ArcadeDeck.familyKey('sub', 15, 8);   // 'add:7,8'
        const ownOf = review => f => Object.keys(review).some(k => {
            const [, a, b] = k.split('|');
            return window.ArcadeDeck.familyKey('add', +a, +b) === f;
        });
        const ownReview = { '1|7|8': { miss: 1, nextAt: 0 } };
        const otherReview = { '1|9|9': { miss: 1, nextAt: 0 } };
        return {
            fam,
            // this drill already owes the child 7 + 8, so the other store's
            // copy of it is not a discovery
            own: M.crossDue({ ...base, review: ownReview, ownFamily: ownOf(ownReview) }),
            // an unrelated own entry must not suppress it
            other: M.crossDue({ ...base, review: otherReview, ownFamily: ownOf(otherReview) }),
        };
    }""", SUB_STORE)
    print(f'== own entry suppresses: {got["own"]}; unrelated does not: '
          f'{[(c["x"], c["y"]) for c in got["other"]]}')
    if any((c['x'], c['y']) == (7, 8) for c in got['own']):
        fails.append(f'a fact this drill already owes was merged anyway: {got["own"]}')
    if not any((c['x'], c['y']) == (7, 8) for c in got['other']):
        fails.append('an unrelated own entry suppressed the merge')

    # --- 5. not due, not served ------------------------------------------
    seed_sub(pg, {'2|15|8': {'n': 3, 'miss': 2, 'ok': 3, 'nextAt': 9e15}})
    got = pg.evaluate("""(stores) => window.MathsGame.crossDue({
        op: 'add', now: Date.now(), review: {}, fits: () => true, stores
    })""", SUB_STORE)
    if got:
        fails.append(f'a fact that is not due was served: {got}')

    # --- 8. two keys of one family are one question ----------------------
    # 15 − 8 and 15 − 7 are both the family {7, 8}. A child who missed both
    # must not be handed 7 + 8 twice: the merge is per family, not per key.
    seed_sub(pg, {
        '2|15|8': {'n': 3, 'miss': 2, 'ok': 0, 'nextAt': 0},
        '2|15|7': {'n': 3, 'miss': 2, 'ok': 0, 'nextAt': 0},
        '2|12|7': {'n': 3, 'miss': 1, 'ok': 0, 'nextAt': 0},
    })
    got = pg.evaluate("""(stores) => window.MathsGame.crossDue({
        op: 'add', now: Date.now(), review: {}, fits: () => true, stores, limit: 10
    })""", SUB_STORE)
    pairs = [(c['x'], c['y']) for c in got]
    print(f'== one family from two keys -> {pairs}')
    if len(pairs) != len(set(pairs)):
        fails.append(f'a family was merged twice from two keys: {pairs}')
    if (7, 8) not in pairs:
        fails.append(f'the shared family was not merged at all: {pairs}')

    # --- 6. a corrupt other store ----------------------------------------
    pg.evaluate("([k]) => localStorage.setItem(k, '{not json')", [SUB])
    got = pg.evaluate("""(stores) => {
        try {
            return { ok: true, n: window.MathsGame.crossDue({
                op: 'add', now: Date.now(), review: {}, fits: () => true, stores
            }).length };
        } catch (e) { return { ok: false, err: String(e) }; }
    }""", SUB_STORE)
    print(f'== corrupt other store -> {got}')
    if not got['ok']:
        fails.append(f'a corrupt record in the other store threw: {got["err"]}')
    if got.get('n'):
        fails.append(f'a corrupt record produced {got["n"]} merged facts')

    # --- 7. addition does not serve multiplication -----------------------
    pg.evaluate("""() => {
        localStorage.clear();
        localStorage.setItem('arcade.times.v2', JSON.stringify({
            v: 1, best: 0, perMode: {}, review: { '7|8': { n: 3, miss: 3, nextAt: 0 } },
            seen: {}, taught: {}, savedAt: Date.now()
        }));
    }""")
    got = pg.evaluate("""() => window.MathsGame.crossDue({
        op: 'add', now: Date.now(), review: {}, fits: () => true,
        stores: [{ key: 'arcade.times.v2', game: 'times-table-academy', op: 'mul' }]
    })""")
    print(f'== a times miss offered to an addition drill -> {got}')
    if got:
        fails.append(f'an addition drill served a multiplication fact: {got}')

    if exc:
        fails.append(f'addition-quest: pageerror {exc[:2]}')
    pg.close()

    # --- 9. live: the sibling is the first question ---------------------
    q = b.new_page()
    errs = []
    q.on('pageerror', lambda e: errs.append(str(e)))
    q.goto((ARCADE / 'addition-quest.html').as_uri())
    seed_sub(q, {
        '2|12|7': {'n': 3, 'miss': 2, 'ok': 0, 'nextAt': 0},
        '2|11|6': {'n': 3, 'miss': 1, 'ok': 0, 'nextAt': 0},
    })
    q.reload(); q.wait_for_timeout(300)
    # Practice starts from the tab; the page opens on the lesson.
    q.click('#tabPractice'); q.wait_for_timeout(400)

    asked = []
    for _ in range(4):
        # Read the rendered bond, not `#qsay`. The spoken sentence used to name
        # the missing part outright ("5 plus 7"), which spoke the answer to a
        # screen reader; it now asks the question ("5 plus what makes 12?").
        # Asserting on the wording would pin whichever leak the drill has.
        bot = q.evaluate("() => (document.getElementById('qBot') || {}).textContent || ''")
        asked.append(' '.join(bot.split()))
        q.keyboard.type('0')
        q.keyboard.press('Enter')
        q.wait_for_timeout(120)
        q.evaluate("() => { const b = document.getElementById('nextBtn'); if (b && !b.hidden) b.click(); }")
        q.wait_for_timeout(120)

    print(f'== live addition asked: {asked}')
    # The bond level asks a missing addend, so the sibling `5 + 7` is served as
    # `5 + ? = 12`, and `5 + 6` as `5 + ? = 11`.
    want = ('5 + ? = 12', '5 + ? = 11')
    if not any(w in asked[0] for w in want):
        fails.append(f'the merged sibling was not the first question: {asked[:2]}')
    if asked and asked[0] not in want:
        fails.append(f'the first question was {asked[0]!r}, not a merged sibling')

    if errs:
        fails.append(f'addition-quest (live): pageerror {errs[:2]}')
    q.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nCROSS PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
