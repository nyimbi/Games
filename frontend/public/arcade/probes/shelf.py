"""The shelf's words are the figures' words, and the figure can say them.

`how-things-work.html` carries a hand-copied `title`, `hint` and `idea` for each
of the 26 figures. The comment above that table says the fields are "read off
the figure's own mountFigure call", and that is what the page must be able to
claim: the wrapper is a window, not a second author. It is a copy, and nothing
checked it. Two copies of one string drift, and the copy nobody reads is the one
that drifts -- `llms.txt:117` forbids exactly this ("do not re-describe the
machines there -- a second source of truth the figures cannot correct").

This probe asserts, for all 26:

  1. The wrapper's title, hint and idea are the figure's own -- read out of the
     figure's live `mountFigure({...})` call, with `//` and `/* */` stripped
     first, so a field swallowed by a comment counts as missing rather than as
     present.
  2. Every figure declares a `hint` that is actually live. `washer.html` did
     not: its hint sat after a trailing `//` on the `fig:` line, so the figure
     never received it. The wrapper's copy was the only surviving one, which is
     the second-source-of-truth failure in its purest form.
  3. The figure renders the title and the idea inside its own frame, so the
     copy the wrapper shows is a duplicate of something the child can already
     read rather than a substitute for it.
  4. The page opens each figure without a page error, at 390 px, with no
     overflow -- the shelf is the only page whose content is another document.

The comparison is against the *live* call, not against any string in the file.
A probe that regexed the whole document would have passed `washer.html` happily:
the text is there, in a comment, where the figure cannot reach it.

Run:  python3 -I probes/shelf.py
"""
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
PAGE = ARCADE / 'how-things-work.html'


def unescape(x):
    for a, b in [("\\'", "'"), ('\\"', '"'), ('\\u2014', '—'),
                 ('\\u2019', '’'), ('\\u201c', '“'),
                 ('\\u201d', '”'), ('\\u2026', '…')]:
        x = x.replace(a, b)
    return x


def strip_comments(js):
    """Remove `//` and `/* */` comments without touching string contents.

    The point is not tidiness. `washer.html` declares its hint after a trailing
    `//`, so a scan that does not strip comments finds a hint the figure never
    receives, and the probe reports agreement between two copies of a string
    only one of which exists at runtime.
    """
    out, i, n = [], 0, len(js)
    while i < n:
        c = js[i]
        if c in '"\'':
            q = c
            out.append(c)
            i += 1
            while i < n:
                out.append(js[i])
                if js[i] == '\\':
                    if i + 1 < n:
                        out.append(js[i + 1])
                        i += 2
                        continue
                elif js[i] == q:
                    i += 1
                    break
                i += 1
            continue
        if c == '/' and i + 1 < n and js[i + 1] == '/':
            while i < n and js[i] != '\n':
                i += 1
            continue
        if c == '/' and i + 1 < n and js[i + 1] == '*':
            i += 2
            while i + 1 < n and not (js[i] == '*' and js[i + 1] == '/'):
                i += 1
            i += 2
            continue
        out.append(c)
        i += 1
    return ''.join(out)


def own_call(src):
    """The figure's own `mountFigure({...})`, with comments removed."""
    js = strip_comments(src)
    calls = [m.start() for m in re.finditer(r"mountFigure\(\{", js)]
    for start in reversed(calls):
        tail = js[start:start + 8000]
        if re.search(r"title\s*:\s*'", tail):
            return tail
    return None


def field(blk, name):
    m = re.search(name + r"\s*:\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")", blk)
    if not m:
        return None
    return unescape(m.group(1) if m.group(1) is not None else m.group(2))


def wrapper_rows():
    """The wrapper's own table, parsed as JS rather than as one quote style.

    The first version of this matched `h:'...'` only. Correcting the fridge's
    copy to the figure's straight apostrophe made that row a double-quoted
    string -- still valid JS, still the same row -- and the parser silently
    dropped it, reporting 25 machines. A checker for "every row" that enumerates
    one of the two ways to write a row is the bug wearing the gate's clothes.
    """
    s = PAGE.read_text()
    q = r"""(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")"""
    rows = re.findall(
        r"\{\s*s:" + q + r",\s*n:" + q + r",\s*t:" + q + r",\s*g:" + q +
        r",\s*h:" + q + r",\s*i:" + q + r"\s*\}", s)
    out = {}
    # Each field is a pair of alternation groups (single-quoted, double-quoted),
    # so a row is twelve captures, not six.
    for row in rows:
        f = [unescape(a or b) for a, b in zip(row[0::2], row[1::2])]
        out[f[0]] = {'n': f[1], 't': f[2], 'g': f[3], 'h': f[4], 'i': f[5]}
    return out


def static_claims(fails):
    W = wrapper_rows()
    figs = sorted(p.stem for p in (ARCADE / 'figures').glob('*.html'))
    print(f'== {len(W)} wrapper rows, {len(figs)} figure files')

    if len(W) != 26:
        fails.append(f'the wrapper lists {len(W)} machines, not 26')
    missing = sorted(set(W) - set(figs))
    extra = sorted(set(figs) - set(W))
    if missing:
        fails.append(f'listed but not on disk: {missing}')
    if extra:
        fails.append(f'on disk but not listed: {extra}')

    for slug in sorted(W):
        blk = own_call((ARCADE / 'figures' / f'{slug}.html').read_text())
        if blk is None:
            fails.append(f'{slug}: no live mountFigure call')
            continue
        t, h, i = field(blk, 'title'), field(blk, 'hint'), field(blk, 'idea')
        w = W[slug]
        if t != w['t']:
            fails.append(f'{slug}: title differs\n      wrapper: {w["t"]!r}\n      figure : {t!r}')
        if h is None:
            fails.append(f'{slug}: the figure declares no live hint; the wrapper '
                         f'shows {w["h"]!r}, which the figure cannot confirm')
        elif h != w['h']:
            fails.append(f'{slug}: hint differs\n      wrapper: {w["h"]!r}\n      figure : {h!r}')
        if (i or '') != w['i']:
            fails.append(f'{slug}: idea differs\n      wrapper: {w["i"]!r}\n      figure : {i!r}')
    return W


def run(pw):
    fails = []
    W = static_claims(fails)

    b = pw.chromium.launch()
    pg = b.new_page()
    pg.set_default_timeout(8000)
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto(PAGE.as_uri())
    pg.wait_for_timeout(500)

    # --- the page shows the same three strings the table holds --------------
    shown = pg.evaluate("""() => ({
      title: document.getElementById('figTitle').textContent.trim(),
      hint: document.getElementById('figHint').textContent.trim(),
      idea: document.getElementById('figIdeaText').textContent.trim(),
      hidden: document.getElementById('figIdea').hidden })""")
    print(f'== featured: {shown["title"]!r}')
    featured = pg.evaluate("() => document.getElementById('figOpen').getAttribute('href')")
    slug = (featured or '').rsplit('/', 1)[-1].removesuffix('.html')
    w = W.get(slug)
    if not w:
        fails.append(f'the featured figure {slug!r} is not in the wrapper table')
    else:
        if shown['title'] != w['t']:
            fails.append(f'the page shows {shown["title"]!r}, the table holds {w["t"]!r}')
        if shown['hint'] != w['h']:
            fails.append(f'the page shows hint {shown["hint"]!r}, the table holds {w["h"]!r}')
        if shown['idea'] != w['i']:
            fails.append(f'the page shows idea {shown["idea"]!r}, the table holds {w["i"]!r}')
        if w['i'] and shown['hidden']:
            fails.append(f'{slug} has an idea line but the page hides it')

    # --- the frame renders the figure's own title and idea ------------------
    # `file://` will not let this page read across the frame, and neither will
    # this probe from the wrapper's context -- so the frame is driven directly,
    # which is the same document the child sees.
    frame = pg.frame_locator('#figFrame')
    frame_title = frame.locator('h1').first.text_content()
    if not frame_title or '—' not in frame_title:
        fails.append(f'the figure frame renders no title line: {frame_title!r}')
    elif w and w['t'] not in frame_title:
        fails.append(f'the frame says {frame_title!r}, the wrapper says {w["t"]!r}')

    idea_in_frame = frame.locator('p.idea').count()
    if w and w['i'] and not idea_in_frame:
        fails.append(f'{slug} has an idea line but the figure does not render one')

    # --- every figure opens without error -----------------------------------
    for s in sorted(W):
        p = b.new_page()
        errs = []
        p.on('pageerror', lambda e, errs=errs: errs.append(str(e)))
        p.goto((ARCADE / 'figures' / f'{s}.html').as_uri())
        p.wait_for_timeout(220)
        has_svg = p.evaluate("() => !!document.getElementById('fig')")
        h1 = p.evaluate("() => (document.querySelector('h1')||{}).textContent || ''")
        if not has_svg:
            fails.append(f'{s}: the figure mounted no svg')
        if W[s]['t'] not in h1:
            fails.append(f'{s}: the figure heading is {h1.strip()!r}, not {W[s]["t"]!r}')
        if errs:
            fails.append(f'{s}: pageerror {errs[:1]}')
        p.close()

    # --- phone width --------------------------------------------------------
    pg.set_viewport_size({'width': 390, 'height': 800})
    pg.goto(PAGE.as_uri())
    pg.wait_for_timeout(400)
    over = pg.evaluate(
        "() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    print(f'== 390px overflow: {over}px')
    if over > 1:
        fails.append(f'the shelf overflows 390px by {over}px')

    if exc:
        fails.append(f'pageerror: {exc[:3]}')
    pg.close()
    b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nSHELF PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails[:12]:
    print('  -', f)
if len(fails) > 12:
    print(f'  … {len(fails) - 12} more')
sys.exit(1 if fails else 0)
