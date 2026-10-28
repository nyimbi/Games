/* Kiswahili adjective agreement, as a table the bank attests.
 *
 * A Kiswahili adjective is a stem plus the prefix of the class of the noun it
 * describes: -dogo is mdogo for one person, kidogo for one thing, vidogo for
 * several. That is a productive system, not a vocabulary list -- learn the
 * table and you can describe a noun you have never met. `swahili-bank.js`
 * teaches the classes and shows one agreed form per adjective entry; nothing
 * drills the system itself.
 *
 * What is deliberately not here: a rule. "Add the class prefix to the stem" is
 * true of -dogo and false of -eupe, which takes cheupe in class 7 and nyeupe in
 * class 9; -pya takes jipya, kipya, vipya and mpya. A generator applying a
 * prefix rule would emit forms the bank contradicts, and a child who learned
 * them would be learning a rule Kiswahili does not have. The table is smaller
 * than the rule, and every row is attested.
 *
 * A row is (stem, class, form) plus a citation: a bank entry and the field
 * whose text contains the form as a whole word. Where that entry is a noun, its
 * own `class` field is the class the form agrees with, so the citation carries
 * the class as well as the form. The text is read at render time rather than
 * copied here -- a copied sentence is a second source of truth that disagrees
 * with the bank the first time either is edited.
 *
 * A stem qualifies only at three or more distinct forms. Two forms give one
 * right answer and one wrong one, and a two-option question is a coin toss.
 * Padding with another adjective is worse: the child then eliminates options by
 * meaning instead of by agreement, which is the skill the drill is for. That
 * rule is why -refu (mrefu, ndefu) and -eusi (cheusi, nyeusi) are absent --
 * both are correct and both are attested, and neither can carry a drill.
 */
(function () {
  'use strict';

  /* stem -> { gloss, forms: { class: form }, cites: { class: [entry, field] } } */
  const STEMS = {
    dogo: {
      gloss: 'small; young',
      forms: { '1': 'mdogo', '7': 'kidogo', '8': 'vidogo' },
      cites: { '1': ['kaka', 'trap'], '7': ['chumba', 'ex_sw'], '8': ['vidole', 'ex_sw'] }
    },
    zuri: {
      gloss: 'good; beautiful',
      forms: { '2': 'wazuri', '7': 'kizuri', '9': 'nzuri' },
      cites: { '2': ['wazazi', 'ex_sw'], '7': ['kitanda', 'ex_sw'], '9': ['nchi', 'ex_sw'] }
    },
    pya: {
      gloss: 'new',
      forms: { '5': 'jipya', '7': 'kipya', '8': 'vipya', '9': 'mpya' },
      cites: { '5': ['gari', 'ex_sw'], '7': ['mpya', 'trap'], '8': ['vitabu', 'ex_sw'], '9': ['mpya', 'trap'] }
    },
    eupe: {
      gloss: 'white',
      forms: { '6': 'meupe', '7': 'cheupe', '9': 'nyeupe' },
      cites: { '6': ['meno', 'ex_sw'], '7': ['nyeupe', 'trap'], '9': ['karatasi', 'ex_sw'] }
    }
  };

  /* Load-time validation, the way `skills.js` validates its graph and for the
     same reason: a table that names a form for a class it cannot cite renders a
     question whose answer nothing supports, and the failure looks like a
     working drill. The bank itself is checked by the probe, not here -- this
     file loads without the bank, which is what lets a probe test it alone. */
  (function checkStems() {
    for (const [stem, s] of Object.entries(STEMS)) {
      const distinct = new Set(Object.values(s.forms));
      if (distinct.size < 3) {
        throw new Error('swahili-agree: ' + stem + ' has ' + distinct.size + ' forms, not 3');
      }
      for (const cls of Object.keys(s.forms)) {
        const c = s.cites[cls];
        if (!c) throw new Error('swahili-agree: ' + stem + '/' + cls + ' has no citation');
        if (c[1] !== 'ex_sw' && c[1] !== 'trap') {
          throw new Error('swahili-agree: ' + stem + '/' + cls + ' cites field ' + c[1]);
        }
      }
      for (const cls of Object.keys(s.cites)) {
        if (!s.forms[cls]) throw new Error('swahili-agree: ' + stem + '/' + cls + ' cites a form it lacks');
      }
    }
  })();

  /* The stems that can describe a noun of this class, in a fixed order so a
     re-render cannot reshuffle the page. */
  function stemsFor(cls) {
    return Object.keys(STEMS).filter(k => STEMS[k].forms[cls]);
  }

  /* Can this entry be asked at all? A noun whose class no stem covers has no
     agreement question, and a question with no answer is worse than no
     question. The drill's pool predicate reads this, so the deck is drawn from
     nouns that can be answered rather than padded with ones that cannot. */
  function asks(e) {
    return !!e && e.pos === 'noun' && !!e.class && stemsFor(String(e.class)).length > 0;
  }

  /* The citation, read out of the bank. Null when the bank no longer shows the
     form, which is the one case where the table and the bank disagree -- the
     caller then shows no note rather than a wrong one. */
  function cite(stem, cls, bank) {
    const c = STEMS[stem] && STEMS[stem].cites[cls];
    if (!c) return null;
    const entry = (bank || []).find(e => String(e.sw).toLowerCase() === c[0]);
    if (!entry) return null;
    const text = entry[c[1]] || '';
    const form = STEMS[stem].forms[cls];
    const re = new RegExp('\\b' + form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    return re.test(text) ? { text, entry: entry.sw } : null;
  }

  /* Build the question for `e`. `pick` supplies randomness -- `one(n)` returns
     an index below n, `shuffle(a)` permutes -- so a probe can drive this
     without a seed and without a page.

     The options are every form of the one stem, and nothing else. A distractor
     from a different adjective would let the child eliminate it by meaning, so
     the only thing left to decide is the prefix, which is the question. */
  function question(e, bank, pick) {
    const cls = String(e.class);
    const stems = stemsFor(cls);
    const stem = stems[pick.one(stems.length)];
    const s = STEMS[stem];
    const answer = s.forms[cls];
    const others = Object.keys(s.forms).filter(c => c !== cls).map(c => s.forms[c]);
    return {
      stem, cls, answer, gloss: s.gloss, noun: e.sw,
      options: pick.shuffle([answer].concat(others)),
      cite: cite(stem, cls, bank)
    };
  }

  window.SwahiliAgree = { STEMS, stemsFor, asks, cite, question };
})();
