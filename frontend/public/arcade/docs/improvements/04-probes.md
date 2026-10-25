# The probes

Two probes, both run against the real pages from `file://`. They are the evidence for `01-defects.md` D-1, D-2 and D-5.

```
python3 -I docs/improvements/probes/audit_probe.py
python3 -I docs/improvements/probes/div_review.py
```

`-I` isolates the interpreter from the working directory, which is the rule for any script run beside untrusted files. Neither probe writes to the repo; both mutate `localStorage` in a throwaway browser profile.

| Probe | Claims | Runtime |
|---|---|---|
| `audit_probe.py` | D-1 (typing timeout credits the day), D-5 (no focus trap), and a first pass at D-2 | ~40 s, dominated by waiting out a 30-second clock |
| `div_review.py` | D-2 (slice-before-filter starves the in-level review fact), A/B with a control | ~6 s |

Both were canaried: the D-1 probe reports `ArcadeSession.isFinished() -> True` on the unfixed tree and the fix is a branch change at `typing-tutor.html:531`; the D-2 probe carries its own control case (seed A) so a pass cannot be an artefact of the fixture.

**What `audit_probe.py`'s claim 2 does not do.** Its division check counts out-of-level keys in the served set, and in the first run it found one served key and no out-of-level fact — which is consistent with the filter working and equally consistent with the queue never having been walked. It was not believed. `div_review.py` replaces it with an A/B that differs in exactly one dimension, which is the form the claim needs. Claim 2 remains in `audit_probe.py` as a cheap regression check; the real evidence is `div_review.py`.

---

## P5 — the pass-two probe that does not exist yet

`probes/freshness.py:14-17` states its own scope limit: it covers `freshFirst` (pass zero) and not `newCycle` (pass two). Phase 1 of the roadmap changes `newCycle` in a refactor that the existing suite cannot see.

**What it must do.**

1. For each drill, clear `localStorage` and play a full deck — 50 questions, answering each.
2. Record the order served.
3. Start a second deck and assert its first question is the fact served longest ago, not an arbitrary one.

**Why it is not written.** Walking 50 questions requires driving each drill's answer mechanism, and the five mechanisms differ: bonds accept digits through a `document` keydown handler (`number-bonds.html:790`), the three column drills use a pad (`buildPad()` at `addition-quest.html:882`, `subtraction-safari.html:866`, `times-table-academy.html:971`), and division accepts digits then Enter (`division-diner.html:700-704`). A probe that drives all five is ~200 lines and needs the same discipline `freshness.py` already applies: seed the record rather than play it, where seeding is possible.

**A cheaper alternative that tests the same predicate.** The deck module is a pure function. Once F-47 lands, `newCycle(pool, seen, bucket, keyOf)` can be called directly in the page context with a synthetic `seen` map, and the probe becomes:

```js
const pool = [{a:1,b:2},{a:3,b:4},{a:5,b:6}];
const seen = { test: { '1|2': 3000, '3|4': 1000 } };   // 5|6 never served
const order = window.ArcadeDeck.newCycle(pool, seen, 'test', f => f.a + '|' + f.b);
// assert order[0] is {a:5,b:6} (never served sorts first, ts 0)
// assert order[1] is {a:3,b:4} (served earlier than 1|2)
```

That is twelve lines, it is a pure function so no page driving is needed, and it fails if `newCycle` loses its `keyOf`. It cannot be written until the deck is one module — which is an argument for F-47 beyond tidiness: **the current duplication makes the predicate untestable**, because there are six `newCycle`-shaped functions and no single name to call.

---

## Probe discipline applied here

Three rules from this repo's own history (`llms.txt:156-163`, `CLAUDE.md`), and how each was applied:

1. **Canary every gate.** D-1's probe was written against the unfixed tree and returns `True`; the fix flips it to `False`. A probe that has only ever passed has tested nothing.
2. **A predicate that is a strict subset of what it tests fails open.** `audit_probe.py`'s claim 2 was exactly this — it counted keys in the served set, which is empty whether the queue is correct or never walked. It was demoted to a regression check and replaced by `div_review.py`'s A/B.
3. **A negative test must vary one dimension.** `div_review.py` seeds the same in-level fact in both arms and adds only the two out-of-level ones. Seed A is the control: if it failed, the fixture would be broken and seed B would prove nothing. The probe asserts A before it reports B.
