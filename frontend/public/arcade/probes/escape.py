"""One escape module, two contexts, and no local copies left behind.

There were seven definitions of `esc` with three different character sets:
five escaping `&<>"`, one escaping `&<>`, and spelling-bee escaping `&<>"'`.
The narrow one was safe only because addition-quest interpolates it solely into
text nodes -- a fact about the call sites, not about the function.

This gate asserts the properties that make the split meaningful:

  1. `esc` neutralises `&`, `<`, `>` and leaves a quote alone.
  2. `escAttr` also neutralises `"`, because that is what closes the attribute.
  3. A quote injected through `escAttr` cannot break out of an attribute --
     driven through the real DOM, not asserted on the string.
  4. No page defines its own `esc`. A local definition shadows the shared one
     silently, so the check is on the source text, not on behaviour.

The canary for (2) is the whole point: with `escAttr` aliased to `esc`, the
attribute breaks and the injected node appears. A gate that only checked (1)
would pass against the union that caused the problem.

Run:  python3 -I probes/escape.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent

# Every page that loads the shared module. The three language pages bind
# through ArcadeEscape directly; the engines do the same.
LOCAL_DEF = ('const esc = t =>', 'const esc = s =>', 'const esc = window.LangGame.esc')


def run(pw):
    fails = []
    b = pw.chromium.launch()

    # --- 1 and 2. the two functions, on the same input ----------------------
    pg = b.new_page()
    pg.goto((ARCADE / 'index.html').as_uri())
    got = pg.evaluate("""() => {
        const E = window.ArcadeEscape;
        const probe = 'a&b<c>d"e\\'f';
        return { esc: E.esc(probe), escAttr: E.escAttr(probe) };
    }""")
    print(f"== esc:     {got['esc']}")
    print(f"== escAttr: {got['escAttr']}")
    if '&amp;' not in got['esc'] or '&lt;' not in got['esc'] or '&gt;' not in got['esc']:
        fails.append(f'esc does not neutralise &<>: {got["esc"]!r}')
    if '&quot;' in got['esc']:
        fails.append(f'esc escapes a quote, which is legal text: {got["esc"]!r}')
    if '&quot;' not in got['escAttr']:
        fails.append(f'escAttr does not escape a quote: {got["escAttr"]!r}')
    # `'` in neither, and that is the documented choice, not an omission.
    if '&#39;' in got['esc'] or '&#39;' in got['escAttr']:
        fails.append('a single quote is escaped; the module documents that it is not')

    # --- 3. a quote cannot break out of an attribute -----------------------
    # Build the markup the way the pages do, parse it, and ask the DOM what
    # happened. If the quote escaped the value, the injected element exists.
    broke = pg.evaluate("""() => {
        const E = window.ArcadeEscape;
        const evil = '" onmouseover="x';
        const mk = (fn) =>
            `<button type="button" data-opt="${fn(evil)}">ok</button>`;
        const a = document.createElement('div');
        a.innerHTML = mk(E.escAttr);
        const b2 = document.createElement('div');
        b2.innerHTML = mk(E.esc);
        const attrOf = el => el.querySelector('button').getAttribute('data-opt');
        return {
            attr: attrOf(a), attrs: a.querySelector('button').attributes.length,
            textAttr: attrOf(b2), textAttrs: b2.querySelector('button').attributes.length,
        };
    }""")
    print(f'== escaped:   data-opt={broke["attr"]!r} ({broke["attrs"]} attributes)')
    print(f'== unescaped: data-opt={broke["textAttr"]!r} ({broke["textAttrs"]} attributes)')
    if broke['attrs'] != 2:
        fails.append(f'escAttr let the value break out: {broke["attrs"]} attributes, expected 2')
    if broke['attr'] != '" onmouseover="x':
        fails.append(f'escAttr did not round-trip the value: {broke["attr"]!r}')
    # The control: with esc, the same input MUST break out. If it does not, the
    # fixture is wrong and the positive result above proves nothing.
    if broke['textAttrs'] == 2:
        fails.append('the control did not break out, so the fixture tests nothing')
    pg.close()

    # --- 4. no page keeps a local definition -------------------------------
    for p in sorted(ARCADE.glob('*.html')) + sorted(ARCADE.glob('*.js')):
        src = p.read_text()
        if p.name == 'escape.js':
            continue
        for pat in LOCAL_DEF:
            if pat in src:
                fails.append(f'{p.name} still defines its own esc ({pat!r})')
        if 'esc(' in src and 'ArcadeEscape' not in src and 'LangGame' not in src:
            fails.append(f'{p.name} calls esc but never binds the shared module')
    print('== no page defines its own esc')

    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nESCAPE PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
