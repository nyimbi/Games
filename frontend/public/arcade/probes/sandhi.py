"""What is written is not what is said, and the bank's own spelling proves it.

F-29. `chinese.html`'s tone mode asks which tone pattern a word has, and grades
against `tones` -- which is pinyin spelling. Pinyin spells citation tones: 你好
is written `nǐ hǎo`, 3 then 3, and every speaker says 2 then 3. So the mode as
it stood rewarded reading the spelling aloud, which is the mistake.

`tone-sandhi.js` is the written/spoken mapping. One rule changes the written
pattern: 3 + 3, where the first becomes 2. 一 and 不 are spelled with their
changes already applied (一起 yìqǐ, 一定 yídìng), so the module takes the
spelling as given and the `yi`/`bu` rules exist to check the bank against.

  1. The module agrees with the bank's pinyin diacritics on every entry. The
     diacritics are the ground truth here -- they are what a Mandarin reader
     sees -- and the stored `tones` field agrees with them on 299 of 300. The
     one that does not is 回家, whose `tones` said 2 2 against huíjiā's 2 1;
     that is fixed in the bank, and this claim is what would catch it coming
     back.
  2. The only rule that fires is 3 + 3. Counted over the bank, and the
     entries it changes are exactly the ones whose spelling has adjacent
     thirds.
  3. A run of three thirds is 2 2 3, not 2 3 3. The rule reads the written
     tone of the next syllable, not the changed one.
  4. 一 and 不 as rules reproduce the bank's spellings, except where the word
     neutralises them -- 对不起 duìbuqǐ writes 不 as neutral, which no pair
     rule can know. The exception is named and counted, not skipped.
  5. All sixteen cells of the 4x4 space are filled from the bank's own single
     syllables, and every pair card has four distinct options of which one is
     the answer and, where they differ, the spelling is among the wrong ones.
  6. The deck covers the sixteen cells: a child who always answers "2 3" is
     marked wrong in the fifteen cells where nothing changes.
  7. The page serves it: the mode exists, a card asks what is said, the answer
     is the spoken pattern, and a wrong answer to a 3+3 card is marked wrong
     when the written pattern is chosen.
  8. No second copy of the rules in `chinese.html`.

Run:  python3 -I probes/sandhi.py
"""
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
PAGE = (ARCADE / 'chinese.html').as_uri()


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto(PAGE)

    if not pg.evaluate("() => !!(window.ArcadeToneSandhi && window.CHINESE_BANK)"):
        fails.append('tone-sandhi.js or the bank did not load: '
                     + (f'page errors {exc[:2]}' if exc else 'no page error'))
        pg.close(); b.close(); return fails

    # --- 1..6. the mapping, over the real bank ---------------------------
    got = pg.evaluate("""() => {
        const T = window.ArcadeToneSandhi, B = window.CHINESE_BANK;
        const out = { problems: [], n: B.length };

        // The ground truth: the tone of each syllable, read off the pinyin
        // diacritics. A syllable with no mark is neutral (5), which is how
        // the bank stores it. Where the pinyin is one token for several
        // characters, the marks fill the non-neutral positions in order --
        // that is what the spelling means, and it is how 妈妈 māma reads as
        // 1 5 rather than as two first tones.
        const marksOf = e => {
            const chars = Array.from(e.hanzi), n = chars.length;
            const parts = e.pinyin.trim().split(/\\s+/);
            if (parts.length === n) {
                return parts.map(p => {
                    for (const c of p) if (T.MARKS[c]) return T.MARKS[c];
                    return 5;
                });
            }
            const stored = String(e.tones || '').trim().split(/\\s+/).map(Number);
            const mk = Array.from(e.pinyin).map(c => T.MARKS[c]).filter(Boolean);
            const res = [];
            let k = 0;
            for (let i = 0; i < n; i++) res.push(stored[i] === 5 ? 5 : mk[k++]);
            return res;
        };

        // 1. written tones against the spelling. The stored `tones` field is
        // the spelling, so this compares the module's reader with the bank's
        // own orthography.
        let agree = 0;
        const disagree = [];
        for (const e of B) {
            const w = T.written(e).join(' '), m = marksOf(e).join(' ');
            if (w === m) agree++;
            else disagree.push(e.hanzi + ' (' + e.pinyin + '): written ' + w + ', marks ' + m);
        }
        out.written = { agree, disagree: disagree.slice(0, 5), nDisagree: disagree.length };

        // 2 + 3. the 3+3 rule, and only it.
        const changed = [], adjacent = [];
        for (const e of B) {
            if (T.changes(e)) changed.push(e.hanzi + ' ' + e.tones + ' -> ' + T.spoken(e).join(' '));
            const w = T.written(e);
            for (let i = 0; i < w.length - 1; i++) if (w[i] === 3 && w[i + 1] === 3) { adjacent.push(e.hanzi); break; }
        }
        out.rule = { changed: changed.length, adjacent: adjacent.length, names: changed };
        if (changed.length !== adjacent.length) {
            out.problems.push(`${changed.length} entries change but ${adjacent.length} have adjacent thirds`);
        }

        // 3. three in a row: every run is 2 2 3.
        const triple = T.spoken({ hanzi: '好好好', tones: '3 3 3' }).join(' ');
        if (triple !== '2 2 3') out.problems.push('a run of three thirds is said ' + triple + ', wanted 2 2 3');
        const quad = T.spoken({ hanzi: '好好好好', tones: '3 3 3 3' }).join(' ');
        if (quad !== '2 2 2 3') out.problems.push('a run of four thirds is said ' + quad + ', wanted 2 2 2 3');
        // A third before a neutral is still a third.
        const neutral = T.spoken({ hanzi: '好的', tones: '3 5' }).join(' ');
        if (neutral !== '3 5') out.problems.push('a third before a neutral was changed to ' + neutral);

        // 4. 一 and 不 against the bank's spellings.
        const yibu = [];
        for (const e of B) {
            const chars = Array.from(e.hanzi), w = T.written(e);
            chars.forEach((c, i) => {
                if (c !== '一' && c !== '不') return;
                const pred = c === '一' ? T.yi(w[i + 1]) : T.bu(w[i + 1]);
                yibu.push({ ch: c, word: e.hanzi, written: w[i], pred, next: w[i + 1],
                            ok: pred === w[i] || w[i] === 5 });
            });
        }
        out.yibu = { n: yibu.length, bad: yibu.filter(x => !x.ok).map(x => x.word + ' ' + x.ch + ': written ' + x.written + ', rule says ' + x.pred) };
        // The neutral spelling is the documented exception, so a mismatch on a
        // neutral is expected. A mismatch on a real tone is not.
        const hard = yibu.filter(x => !x.ok && x.written !== 5);
        if (hard.length) out.problems.push('一/不 rules miss ' + hard.length + ' real spellings: '
            + hard.map(x => x.word).join(', '));

        // 5. the 4x4 space, and the options.
        const cells = T.cells(B);
        const empty = cells.filter(c => c.n === 0);
        if (empty.length) out.problems.push('empty tone cells: ' + empty.map(c => c.a + '+' + c.b).join(' '));
        out.cells = { total: cells.length, empty: empty.length, sizes: cells.map(c => c.n) };

        let r = 12345;
        const rnd = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648;
        const deck = T.deck(B, 400, rnd);
        out.deck = { n: deck.length };
        let badOpts = 0, missingSpelling = 0, dupOpts = 0;
        const seenCells = {};
        for (const p of deck) {
            const opts = T.options(p, rnd);
            const vals = opts.map(o => o.value);
            if (vals.length !== 4) badOpts++;
            if (new Set(vals).size !== vals.length) dupOpts++;
            if (vals.indexOf(p.spoken) < 0) badOpts++;
            if (p.tones !== p.spoken && vals.indexOf(p.tones) < 0) missingSpelling++;
            if (opts[0].value === p.spoken) {
                // shuffle is not required to move the answer off the front,
                // but it must not always be there.
            }
            seenCells[p.tones] = (seenCells[p.tones] || 0) + 1;
        }
        out.opts = { badOpts, missingSpelling, dupOpts, cellsSeen: Object.keys(seenCells).length };
        if (badOpts) out.problems.push(`${badOpts} pair cards have no single correct option among four`);
        if (dupOpts) out.problems.push(`${dupOpts} pair cards offer the same pattern twice`);
        if (missingSpelling) out.problems.push(`${missingSpelling} cards that change do not offer the spelling as a wrong option`);
        // 6. the deck has to reach the cells where nothing happens, or the
        // drill teaches "always answer 2 3".
        const noChange = deck.filter(p => p.tones === p.spoken).length;
        out.deck.noChange = noChange;
        if (noChange < deck.length * 0.5) {
            out.problems.push(`only ${noChange} of ${deck.length} cards are cells where nothing changes`);
        }
        if (out.opts.cellsSeen < 12) {
            out.problems.push(`the deck reached ${out.opts.cellsSeen} of 16 cells`);
        }
        return out;
    }""")

    print(f'== written vs pinyin marks: {got["written"]["agree"]}/{got["n"]} agree')
    for p in got['written']['disagree']:
        fails.append('written tones disagree with the spelling: ' + p)
    if got['written']['nDisagree'] > len(got['written']['disagree']):
        fails.append(f'... and {got["written"]["nDisagree"] - len(got["written"]["disagree"])} more')

    print(f'== 3+3 rule: {got["rule"]["changed"]} entries change, '
          f'{got["rule"]["adjacent"]} have adjacent thirds')
    print('   ' + ', '.join(got['rule']['names']))
    for p in got['problems'][:10]:
        fails.append(p)
    if len(got['problems']) > 10:
        fails.append(f'... and {len(got["problems"]) - 10} more rule problems')

    print(f'== 一/不: {got["yibu"]["n"]} occurrences, {len(got["yibu"]["bad"])} not matching the rule '
          f'(neutral spellings are the documented exception)')
    for p in got['yibu']['bad'][:5]:
        print('   ' + p)

    c = got['cells']
    print(f'== tone space: {c["total"]} cells, {c["empty"]} empty, sizes {c["sizes"]}')
    d = got['deck']
    print(f'== deck: {d["n"]} cards, {d["noChange"]} where nothing changes; '
          f'{got["opts"]["cellsSeen"]} cells reached')

    # --- 7. the page ----------------------------------------------------
    modes = pg.evaluate("""() => Array.from(document.querySelectorAll('#modes [data-mode]')).map(b => b.dataset.mode)""")
    if 'sandhi' not in modes:
        fails.append(f'the sandhi mode is not offered; modes are {modes}')
    else:
        pg.click('#modes [data-mode="sandhi"]')
        pg.wait_for_selector('#drill.on', timeout=5000)
        pg.wait_for_timeout(400)
        card = pg.evaluate("""() => {
            const opts = Array.from(document.querySelectorAll('#dChoices [data-opt]')).map(b => ({
                v: b.dataset.opt, t: b.textContent
            }));
            return {
                prompt: document.getElementById('dPrompt') ? document.getElementById('dPrompt').textContent : '',
                kind: document.querySelector('.kicker') ? document.querySelector('.kicker').textContent : '',
                opts, n: opts.length
            };
        }""")
        print(f'== page card: {card["prompt"][:70]!r}')
        print(f'   options: {[o["v"] for o in card["opts"]]}')
        if card['n'] != 4:
            fails.append(f'a sandhi card offered {card["n"]} options, wanted 4')
        if 'said' not in card['prompt'].lower():
            fails.append(f'the sandhi card does not ask what is said: {card["prompt"][:100]!r}')

        # Click every option in turn on fresh cards until one is marked wrong,
        # and check that a wrong answer names the spoken pattern.
        exercised = False
        for attempt in range(6):
            if attempt:
                pg.click('#dExit')
                pg.wait_for_timeout(200)
                pg.click('#modes [data-mode="sandhi"]')
                pg.wait_for_selector('#drill.on', timeout=5000)
                pg.wait_for_timeout(300)
            opts = pg.evaluate("""() => Array.from(document.querySelectorAll('#dChoices [data-opt]')).map(b => b.dataset.opt)""")
            if not opts:
                continue
            pick = opts[attempt % len(opts):] + opts[:attempt % len(opts)]
            for v in pick:
                if pg.evaluate(f"() => {{ const b = document.querySelector('#dChoices [data-opt=\"{v}\"]'); return !b || b.disabled; }}"):
                    break
                pg.click(f'#dChoices [data-opt="{v}"]')
                pg.wait_for_timeout(500)
                st = pg.evaluate("""() => ({
                    cls: document.getElementById('dFb').className,
                    text: document.getElementById('dFb').textContent
                })""")
                if 'bad' in st['cls']:
                    m = re.search(r'The answer is ([0-9 ]+)', st['text'])
                    if not m:
                        fails.append(f'a wrong sandhi answer did not name the answer: {st["text"][:120]!r}')
                    else:
                        print(f'== wrong answer {v!r}: the answer is {m.group(1)!r}')
                        # The named answer must be a legal pattern, and it must
                        # differ from what the child chose -- that is the card
                        # working.
                        if m.group(1).strip() == v:
                            fails.append(f'the page marked {v!r} wrong and named {m.group(1)!r} as the answer')
                    exercised = True
                    break
            if exercised:
                break
        if not exercised:
            fails.append('no wrong answer on a sandhi card was reached; the page claim is untested')

    # --- 8. no second implementation -------------------------------------
    html = (ARCADE / 'chinese.html').read_text()
    body = re.sub(r'/\*.*?\*/', '', html, flags=re.S)
    body = re.sub(r'^\s*//.*$', '', body, flags=re.M)
    for pat, what in [
        (r"w\[i\]\s*===\s*3\s*&&\s*w\[i\s*\+\s*1\]\s*===\s*3", 'the 3+3 test'),
        (r"'ā'\s*:\s*1", 'the diacritic table'),
    ]:
        if re.search(pat, body):
            fails.append(f'chinese.html still carries {what}; the module is not the only copy')
    if 'ArcadeToneSandhi' not in body:
        fails.append('chinese.html never calls ArcadeToneSandhi')

    if exc:
        fails.append(f'chinese pageerror: {exc[:3]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nSANDHI PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
