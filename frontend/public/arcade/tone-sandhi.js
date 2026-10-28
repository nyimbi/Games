/* What is written and what is said, for Mandarin tones.
 *
 * `chinese.html`'s tone mode asks which tone pattern a word has, and it asks
 * against `tones` -- the field the bank stores. That field is pinyin
 * orthography, and pinyin orthography is not pronunciation. Standard pinyin
 * writes citation tones: 你好 is written `nǐ hǎo`, 3 then 3, and every speaker
 * says 2 then 3. The writing is correct and the child who reads it as spoken
 * is wrong, which is the hardest thing about Mandarin listening and the one
 * thing the tone mode cannot currently teach.
 *
 * This module is the mapping between the two:
 *
 *   written  the tones as spelled, one per character
 *   spoken   the tones as said, after tone sandhi
 *
 * Only one rule changes `written` into `spoken`: 3 + 3, where the first
 * becomes 2. 你好 nǐ hǎo is said ní hǎo; 所以 suǒ yǐ is said suó yǐ; a run of
 * three is 2 2 3, not 2 3 3, because the rule reads the written tone of the
 * next syllable rather than the already-changed one.
 *
 * 一 and 不 are *not* handled by a rule here, and that is the point. Pinyin
 * spells their changes: 一起 is written yìqǐ and 一定 is written yídìng, so
 * the written field already holds the spoken tone. A module that read them as
 * citation -- 一 as first tone, 不 as fourth -- and then applied the sandhi
 * rules would apply them twice and produce yí for 一起, which nobody says.
 * `yi` and `bu` state the rule anyway, and the probe checks the bank's own
 * spellings against them, but `spoken` takes the spelling as given.
 *
 * What is out of scope, stated so it is not mistaken for an oversight: which
 * 一 is an ordinal (第一 dì yī keeps its first tone, because it is not the
 * numeral), and lexical neutralisation (对不起 duìbuqǐ, where 不 is said
 * neutral rather than fourth). Both are decided by the word, not by the pair.
 *
 * The pair space is 4x4 and the bank's own single syllables fill every cell,
 * so a generated pair is a pair a learner could meet rather than a synthetic
 * one.
 */
(function () {
  'use strict';

  /* The pinyin diacritics, as tone numbers. Written out because they are
     orthography, not arithmetic: the mark sits on a vowel chosen by rules
     this module has no business reimplementing. */
  const MARKS = {
    'ā': 1, 'á': 2, 'ǎ': 3, 'à': 4,
    'ē': 1, 'é': 2, 'ě': 3, 'è': 4,
    'ī': 1, 'í': 2, 'ǐ': 3, 'ì': 4,
    'ō': 1, 'ó': 2, 'ǒ': 3, 'ò': 4,
    'ū': 1, 'ú': 2, 'ǔ': 3, 'ù': 4,
    'ǖ': 1, 'ǘ': 2, 'ǚ': 3, 'ǜ': 4,
    'ń': 2, 'ň': 3, 'ǹ': 4, 'ḿ': 2
  };

  const ONE = '一', BU = '不';

  /* The tones as spelled. Neutral syllables carry 5, which is how the bank
     stores them; anything unparseable also reads as 5 rather than as a
     guess. */
  function written(entry) {
    const chars = Array.from(entry.hanzi || '');
    const stored = String(entry.tones || '').trim().split(/\s+/).map(Number);
    return chars.map((c, i) => (stored[i] >= 1 && stored[i] <= 5 ? stored[i] : 5));
  }

  /* 一 and 不, as rules. Not applied by `spoken` -- see the header -- but
     stated here so the bank's spellings can be checked against them, and so
     the page can explain a word that uses one. `next` is the written tone of
     the following syllable, or undefined when the character ends the word. */
  function yi(next) {
    if (next === undefined) return 1;       // alone or final: yī
    return next === 4 ? 2 : 4;              // yí before 4, yì otherwise
  }
  function bu(next) {
    if (next === undefined) return 4;       // alone or final: bù
    return next === 4 ? 2 : 4;              // bú before 4, bù otherwise
  }

  /* The tones as said.
   *
   * Left to right over the *written* values, so a run of three thirds is
   * 2 2 3: 洗手间 xǐ shǒu jiān is said xí shóu jiān. Reading the changed
   * value would leave the middle one at 3 and give a pattern nobody says.
   *
   * Neutral syllables (5) do not trigger the rule and are not changed by it:
   * a third tone before a neutral is still said third. */
  function spoken(entry) {
    const w = written(entry);
    const out = w.slice();
    for (let i = 0; i < w.length - 1; i++) {
      if (w[i] === 3 && w[i + 1] === 3) out[i] = 2;
    }
    return out;
  }

  /* Whether the word is said differently from how it is written. */
  function changes(entry) {
    const a = written(entry), b = spoken(entry);
    return a.some((t, i) => t !== b[i]);
  }

  /* Which rule changes this syllable, for the page to name. */
  function ruleAt(entry, i) {
    const w = written(entry);
    if (w[i] === 3 && w[i + 1] === 3) return '3-3';
    return null;
  }

  /* The 4x4 space, filled with the bank's own single syllables.
   *
   * A cell is `{a, b, first, second}`: every single-syllable character with
   * written tone `a`, paired with every one with tone `b`. Built from single
   * syllables so each half is a character that exists on its own.
   *
   * 一 and 不 are excluded. Their written tone is not their citation tone, so
   * a pair built from them would be asking about a rule this module does not
   * own; they are drilled from the bank's compounds instead. */
  function cells(bank) {
    const single = {};
    for (const e of bank) {
      const chars = Array.from(e.hanzi || '');
      if (chars.length !== 1) continue;
      if (chars[0] === ONE || chars[0] === BU) continue;
      const t = written(e)[0];
      if (!(t >= 1 && t <= 4)) continue;
      (single[t] = single[t] || []).push({ hanzi: chars[0], pinyin: e.pinyin, tone: t, en: e.en });
    }
    const out = [];
    for (let a = 1; a <= 4; a++) {
      for (let b = 1; b <= 4; b++) {
        const A = single[a] || [], B = single[b] || [];
        out.push({ a, b, n: A.length * B.length, first: A, second: B });
      }
    }
    return out;
  }

  /* One pair, as a bank-shaped entry the page can serve.
   *
   * The question is the spoken pattern; the two options worth offering are
   * the written one and the spoken one, because that is the confusion. A pair
   * whose two patterns are equal has no question in it, so `interesting`
   * says so and the caller can skip it -- the probe asserts that the cells
   * with a question are exactly the 3+3 ones. */
  function pairEntry(first, second) {
    const hanzi = first.hanzi + second.hanzi;
    const w = [first.tone, second.tone];
    const e = { hanzi, tones: w.join(' ') };
    const said = spoken(e);
    return {
      hanzi, pinyin: first.pinyin + ' ' + second.pinyin,
      tones: w.join(' '), spoken: said.join(' '),
      interesting: said.join(' ') !== w.join(' '),
      en: first.en + ' + ' + second.en,
      pos: 'pair', tier: 1, family: 'sandhi',
      ex_zh: hanzi, ex_en: first.en + '; ' + second.en,
      trap: w[0] === 3 && w[1] === 3
        ? 'Written 3 3, said 2 3: the first third tone rises before another.'
        : 'Written ' + w.join(' ') + ', said the same. No change.',
      sandhi: true
    };
  }

  /* A deck of pair questions, drawn from all sixteen cells.
   *
   * Only 3+3 changes, so a drill built from that cell alone would be one
   * question repeated forty times. The skill is not "apply the rule" -- it is
   * knowing *when* it applies, which needs the fifteen cells where nothing
   * happens as much as the one where something does. A child who answers 2
   * for every pair has learned the rule and not the condition, and this deck
   * marks that wrong fifteen times in sixteen.
   *
   * `rnd` is injected rather than taken from `Math.random`, so the probe can
   * make the deck reproducible and check every card rather than a sample. */
  function deck(bank, n, rnd) {
    const all = cells(bank).filter(c => c.n > 0);
    if (!all.length) return [];
    const out = [];
    for (let i = 0; i < n; i++) {
      const c = all[Math.floor(rnd() * all.length)];
      const f = c.first[Math.floor(rnd() * c.first.length)];
      const s = c.second[Math.floor(rnd() * c.second.length)];
      out.push(pairEntry(f, s));
    }
    return out;
  }

  /* The options for a pair card: four tone patterns, of which the answer is
     the spoken one.
   *
   * The written pattern is always among the wrong ones when it differs from
   * the answer, because that is the mistake the card exists to catch: reading
   * the spelling aloud. The rest are drawn from the other patterns, so the
   * card is a real choice in every cell rather than only in the 3+3 one.
   *
   * `rnd` again, and the answer is not put first: an unshuffled option list
   * puts the right answer in the same place on every card. */
  function options(pair, rnd) {
    const answer = pair.spoken, writtenForm = pair.tones;
    const wrong = [];
    if (writtenForm !== answer) wrong.push(writtenForm);
    for (let a = 1; a <= 4 && wrong.length < 3; a++) {
      for (let b = 1; b <= 4 && wrong.length < 3; b++) {
        const v = a + ' ' + b;
        if (v !== answer && wrong.indexOf(v) < 0) wrong.push(v);
      }
    }
    const all = wrong.slice(0, 3).concat([answer]);
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = all[i]; all[i] = all[j]; all[j] = t;
    }
    return all.map(v => ({
      value: v,
      label: v + (v === answer ? '' : v === writtenForm ? ' · as written' : '')
    }));
  }

  window.ArcadeToneSandhi = { MARKS, written, spoken, changes, ruleAt, yi, bu, cells, pairEntry, deck, options };
})();
