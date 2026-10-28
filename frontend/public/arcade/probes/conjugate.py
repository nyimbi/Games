"""A verb the child only ever meets in the infinitive is not a verb.

F-27. `french-bank.js` lists twenty-two verbs as `pos: 'verb'`, and every one
of them is an infinitive; the bank's example sentences use them in the
infinitive too ("Je veux être médecin", "Je vais prendre le bus"). So the child
learns what a verb means and never sees it agree with anything, which is the
half of French a learner cannot avoid.

`conjugation.js` holds the present tense of the bank's verbs and derives the
regular -er class from its stem, so the table has something to be checked
against.

  1. Every verb the bank lists has a table entry, and the table has nothing
     the bank does not list. A verb added to the bank without a conjugation
     would otherwise produce an empty drill rather than a failure.
  2. Every entry has six forms, and none is empty.
  3. The -er class, derived from stem + ending, agrees with the table for
     every regular -er verb. `aller` ends in -er and is excluded, with the
     exclusion asserted rather than assumed: deriving it gives "alle, alles,
     alle" for a verb that is vais, vas, va.
  4. The elision: je + vowel is j'. Read against the table's own forms, so a
     form beginning with a vowel that does not elide is caught.
  5. The table is right where it can be checked against the bank's own text.
     The bank's sentences use a handful of forms -- "je ne comprends pas" --
     and those are read off `ex_fr` rather than restated.
  6. The page serves it: the mode exists, a card asks one verb in one person,
     the four options are the same verb in different persons, and the answer
     is the form the table gives.
  7. No second copy of the table in `french.html`.

Run:  python3 -I probes/conjugate.py
"""
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ARCADE = pathlib.Path(__file__).resolve().parent.parent
PAGE = (ARCADE / 'french.html').as_uri()


def run(pw):
    fails = []
    b = pw.chromium.launch()
    pg = b.new_page()
    exc = []
    pg.on('pageerror', lambda e: exc.append(str(e)))
    pg.goto(PAGE)

    if not pg.evaluate("() => !!(window.ArcadeConjugation && window.FRENCH_BANK)"):
        fails.append('conjugation.js or the bank did not load: '
                     + (f'page errors {exc[:2]}' if exc else 'no page error'))
        pg.close(); b.close(); return fails

    got = pg.evaluate("""() => {
        const C = window.ArcadeConjugation, B = window.FRENCH_BANK;
        const out = { problems: [] };
        const verbs = B.filter(e => e.pos === 'verb').map(e => e.fr);
        out.verbs = verbs.length;

        // 1. the table against the bank, both directions.
        const missing = verbs.filter(v => !C.forms(v));
        const extra = Object.keys(C.FORMS).filter(v => verbs.indexOf(v) < 0);
        if (missing.length) out.problems.push('bank verbs with no conjugation: ' + missing.join(', '));
        if (extra.length) out.problems.push('conjugation entries not in the bank: ' + extra.join(', '));

        // 2. six forms, none empty.
        const badLen = [], empty = [];
        for (const v of Object.keys(C.FORMS)) {
            const f = C.FORMS[v];
            if (f.length !== 6) badLen.push(v + '(' + f.length + ')');
            if (f.some(x => !x)) empty.push(v);
        }
        if (badLen.length) out.problems.push('verbs without six persons: ' + badLen.join(', '));
        if (empty.length) out.problems.push('verbs with an empty form: ' + empty.join(', '));

        // 2b. The plural persons never share a form, with each other or with
        // a singular. This is a fact about the language, not about this table:
        // "ils vois" is not a form that exists. It matters because a wrong
        // plural form still answers every card correctly for the person it is
        // asked about -- only the distractor is wrong, and a distractor that
        // is a correct answer elsewhere is invisible to a check that reads
        // only the answer. Singular twins are real (je/tu share, and the -er
        // class shares je/tu/il), so only 3, 4 and 5 are pinned.
        const collide = [];
        for (const v of Object.keys(C.FORMS)) {
            const f = C.FORMS[v];
            if (f.length !== 6) continue;
            for (const i of [3, 4, 5]) {
                for (let j = 0; j < 6; j++) {
                    if (j !== i && f[i] === f[j]) {
                        collide.push(`${v}: person ${i} (${f[i]}) is also person ${j}`);
                    }
                }
            }
        }
        if (collide.length) out.problems.push('plural forms that collide: ' + collide.join(', '));

        // 2c. Every third-person plural present form ends in -nt. That is a
        // fact about French, not about this table -- it holds for the regular
        // class (mangent), for the -oir verbs (peuvent, veulent) and for the
        // ones with nothing else in common (sont, ont, vont, font). A typo in
        // the ils slot is otherwise the hardest error to see: nothing else in
        // the probe reads that cell except a bank sentence that happens to
        // use it, and `sonts` agrees with no sentence, so it passes.
        const noNt = [];
        for (const v of Object.keys(C.FORMS)) {
            const f = C.FORMS[v];
            if (f.length === 6 && !/nt$/.test(f[5])) noNt.push(v + ': ils ' + f[5]);
        }
        if (noNt.length) out.problems.push('third-person plural forms not ending in -nt: ' + noNt.join(', '));

        // 3. the derived -er class against the table.
        let derived = 0;
        const derr = [];
        for (const v of verbs) {
            const r = C.regular(v);
            if (!r) continue;
            derived++;
            const t = C.forms(v);
            if (r.join(',') !== t.join(',')) derr.push(v + ': derived ' + r.join(',') + ', table ' + t.join(','));
        }
        if (derr.length) out.problems.push('derived -er forms disagree: ' + derr.join(' | '));
        out.derived = derived;
        // aller must be excluded, and that is a claim about aller, not a gap.
        if (C.regular('aller') !== null) {
            out.problems.push('aller is treated as a regular -er verb: derived ' + C.regular('aller').join(','));
        }
        // and a regular one must not be, or the exclusion is doing nothing.
        if (C.regular('jouer') === null) out.problems.push('jouer is excluded from the regular class');

        // 4. elision, against the table's own forms.
        const elided = [], notElided = [];
        for (const v of Object.keys(C.FORMS)) {
            const f = C.FORMS[v];
            for (let i = 0; i < 6; i++) {
                const s = C.subject(i, f[i]);
                if (i === 0 && /^[aeiouâêîôûéèàù]/i.test(f[i])) {
                    if (s !== "j'") elided.push(v + ' ' + f[i] + ' -> ' + s.trim());
                } else if (s === "j'") {
                    notElided.push(v + ' ' + f[i]);
                }
            }
        }
        if (elided.length) out.problems.push('je + vowel did not elide: ' + elided.join(', '));
        if (notElided.length) out.problems.push('je + consonant elided: ' + notElided.join(', '));
        out.elisions = Object.keys(C.FORMS).reduce((n, v) =>
            n + C.FORMS[v].filter((f, i) => i === 0 && /^[aeiouâêîôûéèàù]/i.test(f)).length, 0);

        // 5. The bank's own sentences as a check on the table. A sentence that
        // opens with a subject pronoun states the person, and the first word
        // after it that is one of the table's forms must be that person's
        // form of the verb it belongs to. "Vous comprenez" fails if the table
        // puts `comprenez` on nous, and the sentence was written by someone
        // else for a different purpose -- which is what makes it evidence.
        //
        // A flat "which forms appear anywhere in the bank" check would not do:
        // `a` and `est` are the commonest words in the bank and most of their
        // occurrences are in sentences about numbers and colours, not about
        // avoir and être. Position is what makes the occurrence a use.
        const PERSON_OF = { 'je': 0, "j'": 0, 'tu': 1, 'il': 2, 'elle': 2, 'on': 2,
                            'nous': 3, 'vous': 4, 'ils': 5, 'elles': 5 };
        // Which verbs spell each form. `sais` is both je and tu of savoir, so
        // the value is a list and a form alone does not name a verb.
        const byForm = new Map();
        for (const v of Object.keys(C.FORMS)) for (const f of C.FORMS[v]) {
            const cur = byForm.get(f) || [];
            if (cur.indexOf(v) < 0) cur.push(v);
            byForm.set(f, cur);
        }
        const agree = [], disagree = [];
        for (const e of B) {
            const toks = String(e.ex_fr || '').toLowerCase().replace(/[.,!?]/g, '').split(/\\s+/);
            const person = PERSON_OF[toks[0]];
            if (person === undefined) continue;
            for (const t of toks.slice(1)) {
                if (!byForm.has(t)) continue;
                const hits = [];
                for (const v of byForm.get(t)) C.FORMS[v].forEach((x, i) => { if (x === t) hits.push({ v, i }); });
                const row = { sentence: e.ex_fr, subject: toks[0], form: t, hits };
                if (hits.some(h => h.i === person)) agree.push(row);
                else disagree.push(row);
                break;
            }
        }
        out.agreement = { n: agree.length + disagree.length, agree: agree.length,
                          bad: disagree.map(r => `${r.sentence} -- ${r.subject} wants person ${PERSON_OF[r.subject]}, `
                                              + `"${r.form}" is ${r.hits.map(h => h.v + ':' + h.i).join('/')}`) };
        if (disagree.length) {
            out.problems.push(disagree.length + ' bank sentences disagree with the table: '
                              + out.agreement.bad.slice(0, 4).join(' | '));
        }
        // The count is pinned, not floored. A floor at 40 passed while the
        // table's `a` was mistyped as `as`: "La table a quatre pieds" then
        // contains no table form at all, so it is skipped rather than
        // disagreed with, and 70 agreeances became 54 under a floor of 40.
        // A missing form has to fail, and the only way to see it is to know
        // how many sentences the check is supposed to read.
        if (agree.length !== 70) {
            out.problems.push(`${agree.length} bank sentences agree with the table, wanted 70; `
                              + 'a form missing from the table drops its sentences out of the check');
        }
        out.attested = agree;

        // 6. the questions the drill can ask.
        out.questions = C.questions(verbs).length;
        const q0 = C.questions(verbs)[0];
        out.sample = C.phrase(q0.infinitive, q0.person);
        return out;
    }""")

    print(f'== {got["verbs"]} bank verbs; {got["derived"]} regular -er; '
          f'{got["questions"]} verb/person questions; {got["elisions"]} elisions')
    for p in got['problems'][:10]:
        fails.append(p)
    if len(got['problems']) > 10:
        fails.append(f'... and {len(got["problems"]) - 10} more conjugation problems')

    att = got['agreement']
    print(f'== {att["agree"]} of {att["n"]} bank sentences read as subject + verb agree with the table')
    if att['bad']:
        for b_ in att['bad'][:5]:
            print('   ' + b_)

    # --- 6. the page ----------------------------------------------------
    modes = pg.evaluate("() => Array.from(document.querySelectorAll('#modes [data-mode]')).map(b => b.dataset.mode)")
    if 'conjugate' not in modes:
        fails.append(f'the conjugation mode is not offered; modes are {modes}')
    else:
        pg.click('#modes [data-mode="conjugate"]')
        pg.wait_for_selector('#drill.on', timeout=5000)
        pg.wait_for_timeout(400)
        card = pg.evaluate("""() => ({
            prompt: document.getElementById('dPrompt').textContent,
            opts: Array.from(document.querySelectorAll('#dChoices [data-opt]')).map(b => b.dataset.opt)
        })""")
        print(f'== page card: {card["prompt"][:80]!r}')
        print(f'   options: {card["opts"]}')
        if len(card['opts']) != 4:
            fails.append(f'a conjugation card offered {len(card["opts"])} options, wanted 4')
        if 'present tense' not in card['prompt']:
            fails.append(f'the conjugation card does not name the tense: {card["prompt"][:100]!r}')
        # The four options must be one verb, not four verbs: read each option
        # back through the table and check they name the same verb. Stripping
        # endings off the surface string would not work -- "ont" and "as" do
        # not share a stem, and that is the point of an irregular verb.
        owner = pg.evaluate("""(opts) => {
            const C = window.ArcadeConjugation;
            // Deduplicated: `sais` is both je and tu, so the form alone names
            // one verb twice and a set of one would read as two.
            const byForm = new Map();
            for (const v of Object.keys(C.FORMS)) for (const f of C.FORMS[v]) {
                const cur = byForm.get(f) || [];
                if (cur.indexOf(v) < 0) cur.push(v);
                byForm.set(f, cur);
            }
            return opts.map(o => {
                const bare = o.replace(/^(j'|je |tu |il |nous |vous |ils )/, '');
                return { opt: o, bare, verbs: byForm.get(bare) || [] };
            });
        }""", card['opts'])
        verbs_seen = {tuple(sorted(o['verbs'])) for o in owner if o['verbs']}
        unread = [o['opt'] for o in owner if not o['verbs']]
        if unread:
            fails.append(f'options that are no verb form in the table: {unread}')
        if len(verbs_seen) != 1:
            fails.append(f'the options are not one verb in different persons: {owner}')

        exercised = False
        for attempt in range(6):
            if attempt:
                pg.click('#dExit')
                pg.wait_for_timeout(200)
                pg.click('#modes [data-mode="conjugate"]')
                pg.wait_for_selector('#drill.on', timeout=5000)
                pg.wait_for_timeout(300)
            opts = pg.evaluate("() => Array.from(document.querySelectorAll('#dChoices [data-opt]')).map(b => b.dataset.opt)")
            if not opts:
                continue
            pick = opts[attempt % len(opts):] + opts[:attempt % len(opts)]
            for v in pick:
                # Clicked by index, not by an interpolated selector. An option
                # is a French phrase and `j'ai` carries an apostrophe, which
                # closes the JS string the selector is built in and throws
                # before the click -- the failure reads as a page error and the
                # claim goes untested on every card that offers an elision.
                ok = pg.evaluate("""(want) => {
                    const bs = Array.from(document.querySelectorAll('#dChoices [data-opt]'));
                    const b = bs.find(x => x.dataset.opt === want);
                    if (!b || b.disabled) return false;
                    b.click(); return true;
                }""", v)
                if not ok:
                    break
                pg.wait_for_timeout(400)
                st = pg.evaluate("""() => ({
                    cls: document.getElementById('dFb').className,
                    text: document.getElementById('dFb').textContent
                })""")
                if 'bad' in st['cls']:
                    m = re.search(r'The answer is (.+?)\.', st['text'])
                    if not m:
                        fails.append(f'a wrong conjugation answer did not name the answer: {st["text"][:120]!r}')
                    else:
                        named = m.group(1).split(' — ')[0].strip()
                        print(f'== wrong {v!r}: the answer is {named!r}')
                        if named == v:
                            fails.append(f'the page marked {v!r} wrong and named it as the answer')
                        # The named answer must be a form the table holds for
                        # this verb, or the card teaches a form that does not
                        # exist.
                        if not pg.evaluate("""(n) => {
                            const C = window.ArcadeConjugation;
                            const bare = n.replace(/^(j'|je |tu |il |nous |vous |ils )/, '');
                            return Object.keys(C.FORMS).some(v => C.FORMS[v].indexOf(bare) >= 0);
                        }""", named):
                            fails.append(f'the page named {named!r} as the answer, which is no form in the table')
                    # The note lists all six forms; that is the teaching half.
                    if 'six forms' not in st['text']:
                        fails.append('a conjugation answer did not show the six forms')
                    exercised = True
                    break
            if exercised:
                break
        if not exercised:
            fails.append('no wrong answer on a conjugation card was reached; the page claim is untested')

    # --- 7. no second table ----------------------------------------------
    html = (ARCADE / 'french.html').read_text()
    body = re.sub(r'/\*.*?\*/', '', html, flags=re.S)
    body = re.sub(r'^\s*//.*$', '', body, flags=re.M)
    for pat, what in [
        (r"'vais'", 'the table (aller)'),
        (r"ER_ENDINGS|'e',\s*'es',\s*'e',\s*'ons'", 'the -er endings'),
    ]:
        if re.search(pat, body):
            fails.append(f'french.html still carries {what}; the module is not the only copy')
    if 'ArcadeConjugation' not in body:
        fails.append('french.html never calls ArcadeConjugation')

    if exc:
        fails.append(f'french pageerror: {exc[:3]}')
    pg.close(); b.close()
    return fails


with sync_playwright() as pw:
    fails = run(pw)
print(f'\nCONJUGATE PROBE {"PASS" if not fails else "FAIL"} — {len(fails)} failure(s)')
for f in fails:
    print('  -', f)
sys.exit(1 if fails else 0)
