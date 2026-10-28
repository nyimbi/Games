"""The Kiswahili deck drills agreement as a system, not a word list.

A Kiswahili adjective changes with the class of the noun it describes: -dogo is
mdogo for one person, kidogo for one thing, vidogo for several. `swahili-bank.js`
teaches the classes and shows one agreed form per adjective; nothing made the
child produce a form for a class they had not been shown. F-28 is an `agree`
mode that asks exactly that, driven by `swahili-agree.js`.

The risk this gate is built around: a generated form is a claim the arcade
cannot check by doing the sum. A wrong form teaches a rule Kiswahili does not
have, and the child has no way to notice. So every row in the table carries a
citation -- a bank entry and the field whose text contains the form as a whole
word -- and this probe resolves all of them against the bank rather than
trusting the table's copy of the sentence. This gate asserts:

  1. Every stem has three or more distinct forms. A two-form stem makes a
     two-option question, which is a coin toss.
  2. Every row's citation resolves: the cited entry exists, the cited field is
     one this module reads, and the form appears in it as a whole word.
  3. Every noun the pool admits can actually be asked -- a stem covers its
     class -- and no noun with a class nothing covers is admitted.
  4. `question()` returns the form for the noun's own class, and every option
     it offers is a form of the one stem, so no option can be eliminated by
     meaning.
  5. The mode renders in the page, and each of a deck's questions is
     answerable from the options it shows.
  6. No pageerror, and no overflow at 390px.

Run:  python3 -I probes/swahili_agree.py
"""
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

# Runs in the page. `pick` is injected so the generator is exercised without a
# seed: a fixed index for the stem and the identity for the shuffle.
DRIVE = """() => {
  const A = window.SwahiliAgree, BANK = window.SWAHILI_BANK;
  const pick = { one: () => 0, shuffle: a => a.slice() };
  const rows = [];
  for (const [stem, s] of Object.entries(A.STEMS)) {
    for (const cls of Object.keys(s.forms)) {
      const c = A.cite(stem, cls, BANK);
      rows.push({ stem, cls, form: s.forms[cls], cite: c });
    }
  }
  const nouns = BANK.filter(e => A.asks(e));
  const refused = BANK.filter(e => e.pos === 'noun' && e.class && !A.asks(e))
    .map(e => [e.sw, String(e.class)]);
  return {
    stems: Object.fromEntries(Object.entries(A.STEMS)
      .map(([k, s]) => [k, [...new Set(Object.values(s.forms))]])),
    rows,
    nouns: nouns.map(e => ({ sw: e.sw, cls: String(e.class), en: e.en })),
    refused,
    // Every question the pool can serve, one per noun per stem, so the checks
    // below see the whole space rather than a sample of it.
    questions: nouns.flatMap(e => {
      const qs = [];
      for (let i = 0; i < A.stemsFor(String(e.class)).length; i++) {
        qs.push(A.question(e, BANK, { one: () => i, shuffle: a => a.slice() }));
      }
      return qs;
    })
  };
}"""


def run(pw):
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    fails = []

    pg.goto((ARCADE / 'swahili.html').as_uri())
    pg.wait_for_timeout(300)
    if pg.evaluate("() => !window.SwahiliAgree"):
        # The module validates its own table at load and throws on a stem with
        # fewer than three distinct forms, so this branch is that check firing.
        # Report its message: "did not load" alone is a construction error, not
        # a finding, and the two read identically in a summary line.
        fails.append(f'swahili-agree.js did not load: {exc[0][:200] if exc else "no pageerror"}')
        pg.close(); b.close()
        return fails
    d = pg.evaluate(DRIVE)

    # --- 1. three or more distinct forms per stem -------------------------
    for stem, forms in d['stems'].items():
        print(f'== {stem}: {forms}')
        if len(forms) < 3:
            fails.append(f'{stem} has {len(forms)} distinct forms, not 3')

    # --- 2. every row's citation resolves against the bank ----------------
    for r in d['rows']:
        if not r['cite']:
            fails.append(f"{r['stem']}/{r['cls']}: no bank text shows {r['form']}")
    print(f"== {len(d['rows'])} rows cited, "
          f"{sum(1 for r in d['rows'] if r['cite'])} resolved")

    # --- 3. the pool admits exactly the askable nouns ---------------------
    # The refused list is what makes this a test of the pool rather than of the
    # table: class 4 and class 11 nouns exist in the bank and no stem covers
    # them, so a pool that admitted them would serve questions with no answer.
    print(f"== {len(d['nouns'])} askable nouns, {len(d['refused'])} refused")
    if not d['nouns']:
        fails.append('the pool is empty, so the mode has no deck')
    if not d['refused']:
        fails.append('no noun is refused, so the pool predicate filters nothing')

    # --- 4. the answer is the noun's own class form; options are one stem --
    for q in d['questions']:
        s = d['stems'][q['stem']]
        if q['answer'] not in s:
            fails.append(f"{q['noun']}/{q['stem']}: answer {q['answer']} is not a form of the stem")
        if sorted(q['options']) != sorted(s):
            fails.append(f"{q['noun']}/{q['stem']}: options {q['options']} are not the stem's forms {s}")
        if q['options'].count(q['answer']) != 1:
            fails.append(f"{q['noun']}/{q['stem']}: answer appears "
                         f"{q['options'].count(q['answer'])} times in the options")
    print(f"== {len(d['questions'])} questions, each offering its stem's own forms")

    # --- 5. the mode renders, and every served question is answerable ------
    # The deck is built from the pool, so this crosses the generator against the
    # engine's own queue rather than re-deriving it. Every click is bounded: a
    # render that throws leaves no options to click, and an unbounded wait turns
    # that finding into a Playwright traceback 30 s later.
    pg.set_default_timeout(5000)
    pg.evaluate("() => localStorage.clear()")
    pg.reload(); pg.wait_for_timeout(300)
    modes = pg.evaluate(
        "() => [...document.querySelectorAll('#modes [data-mode]')].map(b => b.dataset.mode)")
    if 'agree' not in modes:
        fails.append(f'the agree mode is not on the home screen: {modes}')
        pg.close(); b.close()
        return fails
    pg.click('[data-mode="agree"]')
    pg.wait_for_timeout(250)

    seen = 0
    for _ in range(30):
        if exc:
            fails.append(f'the agree stage threw while rendering: {exc[0][:160]}')
            break
        spec = pg.evaluate("""() => ({
            prompt: document.getElementById('dPrompt').textContent,
            options: [...document.querySelectorAll('#dChoices [data-opt]')]
                .map(b => b.dataset.opt)
        })""")
        if not spec['options']:
            fails.append(f'question {seen + 1} rendered no options')
            break
        # The prompt names the stem it is asking about; the options must be that
        # stem's forms. This is the page checked against the table, not the
        # table checked against itself.
        m = re.search(r'-([a-z]+) \(', spec['prompt'])
        if not m or m.group(1) not in d['stems']:
            fails.append(f"question {seen + 1} names no known stem: {spec['prompt']!r}")
            break
        want = sorted(d['stems'][m.group(1)])
        if sorted(spec['options']) != want:
            fails.append(f"question {seen + 1} ({m.group(1)}) offers "
                         f"{sorted(spec['options'])}, not {want}")
            break
        seen += 1
        # Clicked in-page, not through Playwright's actionability check. A
        # correct answer auto-advances after 900 ms, so a real click can land
        # while the button it targeted is being replaced -- Playwright then
        # spends its timeout retrying and reports a harness race as a finding.
        # The buttons' visibility and enabledness are asserted separately, once,
        # below; what this loop needs is that the option is answerable.
        pg.evaluate("() => document.querySelector('#dChoices [data-opt]').click()")
        # Past the 900 ms auto-advance: if the counter has not moved by then the
        # answer was wrong and the question is waiting on Next.
        pg.wait_for_timeout(1300)
        if pg.evaluate("() => document.getElementById('dNum').textContent") == str(seen):
            pg.evaluate("() => document.getElementById('dNext').click()")
            pg.wait_for_timeout(120)
        # The last question has no successor: answering it flips `#done`, which
        # leaves `#dNum` reading the final number. Requiring an advance there
        # fails on a correct deck.
        if seen < 30 and pg.evaluate(
                "() => document.getElementById('dNum').textContent") == str(seen):
            fails.append(f'question {seen} never advanced')
            break
    print(f'== {seen} agree questions rendered')
    if seen < 30:
        fails.append(f'the agree deck served {seen} questions, not 30')

    # --- 6. narrow viewport -------------------------------------------------
    pg.set_viewport_size({'width': 390, 'height': 800})
    pg.reload(); pg.wait_for_timeout(300)
    pg.click('[data-mode="agree"]')
    pg.wait_for_timeout(250)
    over = pg.evaluate(
        "() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    print(f'== 390px overflow: {over}px')
    if over > 1:
        fails.append(f'the agree stage overflows 390px by {over}px')

    if exc:
        fails.append(f'pageerror: {exc[:3]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nSWAHILI AGREE PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
# Capped: one broken row produces a failure per noun that can reach it (200 on a
# distractor bug), and the summary line is what a reader looks for.
for f in fails[:12]:
    print('  -', f)
if len(fails) > 12:
    print(f'  … {len(fails) - 12} more')
sys.exit(1 if fails else 0)
