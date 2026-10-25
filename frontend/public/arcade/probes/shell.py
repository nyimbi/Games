"""Probe every page loads from file:// with no exception and no duplicate id.

The shared engines mount elements lazily, and a lazy mount is exactly the kind
of change that ends up with two elements carrying one id. This catches that,
plus any exception on any page, on all 18 pages.

Run:  python3 -I probes/shell.py
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent


def run(pw):
    b = pw.chromium.launch()
    bad = []
    for name in sorted(p.name for p in ARCADE.glob('*.html')):
        pg = b.new_page()
        exc = []
        pg.on('pageerror', lambda e: exc.append(str(e)))
        pg.goto((ARCADE / name).as_uri())
        pg.wait_for_timeout(280)
        dup = pg.evaluate(
            "document.querySelectorAll('[id]').length - "
            "new Set([...document.querySelectorAll('[id]')].map(e => e.id)).size")
        ok = not exc and dup == 0
        if not ok:
            bad.append(f'{name}: exc={exc[:1]} dup={dup}')
        print(('ok   ' if ok else 'FAIL ') + f'{name}  exc={exc[:1]} dup={dup}')
        pg.close()
    b.close()
    return bad


with sync_playwright() as pw:
    bad = run(pw)
print(f'\nSHELL PROBE {"PASS" if not bad else "FAIL"} — {len(bad)} failure(s)')
for x in bad:
    print('  -', x)
sys.exit(1 if bad else 0)
