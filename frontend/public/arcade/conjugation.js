/* The verb a sentence needs, from the infinitive the bank teaches.
 *
 * `french-bank.js` lists twenty-two verbs as `pos: 'verb'`, all in the
 * infinitive, and the bank's example sentences use them in the infinitive
 * too: "Je veux **être** médecin", "Je vais **prendre** le bus". So the
 * child learns what a verb means and never sees it do anything. Conjugation
 * is the part of French that is systematic enough to generate and frequent
 * enough that a learner cannot avoid it.
 *
 * Two things are generated and one is authored:
 *
 *   authored   the six present-tense forms of each of the bank's verbs. This
 *              is the cost the plan names, and it is authored rather than
 *              derived because most of these verbs are irregular: aller is
 *              vais/vas/va/allons/allez/vont, and no ending table produces
 *              that.
 *   generated  the pronoun, including elision (je + aime is j'aime)
 *   generated  the -er class, from stem + ending, so the one regular class
 *              in the bank can be checked rather than trusted
 *
 * The `-er` derivation is not how the forms are produced -- the table is --
 * but it is how they are *checked*: `regular()` derives the six forms of an
 * -er verb from its stem and the class endings, and the probe asserts the
 * table agrees. That catches a typo in either direction, which a table
 * alone cannot.
 *
 * Present tense only. The passé composé needs an auxiliary and agreement,
 * the imparfait needs a stem rule with more exceptions than the present, and
 * a drill that mixes tenses before the present is solid teaches the wrong
 * thing. The plan's cost line is "O(1) per form from a conjugation table";
 * this is that table, for the tense that comes first.
 */
(function () {
  'use strict';

  const PERSONS = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

  /* The one regular class. `-ir`, `-re` and `-oir` are not regular enough to
     derive: dormir takes -s/-s/-t while finir takes -is/-is/-it, and both are
     spelled -ir. */
  const ER_ENDINGS = ['e', 'es', 'e', 'ons', 'ez', 'ent'];

  /* -er verbs that are not regular, so `regular` must not claim to derive
     them. `aller` is the only one in the bank and it is the worst in the
     language: vais, vas, va, allons, allez, vont, from a stem `all-` that
     only two of the six forms use. */
  const ER_IRREGULAR = ['aller'];

  /* Present tense, six persons, in PERSONS order. Every verb the bank lists
     as `pos: 'verb'` is here; the probe asserts that rather than trusting
     this comment. */
  const FORMS = {
    'être': ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
    'avoir': ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
    'aller': ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
    'faire': ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'],
    'dire': ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'],
    'voir': ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'],
    'savoir': ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'],
    'pouvoir': ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'],
    'vouloir': ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'],
    'venir': ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'],
    'prendre': ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'],
    'manger': ['mange', 'manges', 'mange', 'mangeons', 'mangez', 'mangent'],
    'boire': ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'],
    'dormir': ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'],
    'attendre': ['attends', 'attends', 'attend', 'attendons', 'attendez', 'attendent'],
    'répondre': ['réponds', 'réponds', 'répond', 'répondons', 'répondez', 'répondent'],
    'apprendre': ['apprends', 'apprends', 'apprend', 'apprenons', 'apprenez', 'apprennent'],
    'comprendre': ['comprends', 'comprends', 'comprend', 'comprenons', 'comprenez', 'comprennent'],
    'écrire': ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'],
    'lire': ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'],
    'jouer': ['joue', 'joues', 'joue', 'jouons', 'jouez', 'jouent'],
    'aimer': ['aime', 'aimes', 'aime', 'aimons', 'aimez', 'aiment']
  };

  /* The stem of an -er verb: the infinitive less its ending. */
  function stemOf(infinitive) {
    return String(infinitive || '').replace(/er$/, '');
  }

  /* The six forms of a regular -er verb, derived rather than looked up.
   *
   * Returns null for anything that is not a regular -er verb, `aller`
   * included: it ends in -er and its stem is all-, and all six forms come
   * from somewhere else. Returning a derivation for it would be a rule that
   * is right about the class and wrong about the word, which is the kind of
   * rule this module exists to avoid.
   *
   * `manger` is the reason this has a special case and `jouer` is the reason
   * it needs only one: a verb whose stem ends in `g` keeps the soft sound
   * before `a` and `o` by inserting an `e`, so mangeons, not mangons. The
   * same applies to `c` (commençons) which no bank verb uses; it is left out
   * rather than written untested.
   */
  function regular(infinitive) {
    const v = String(infinitive || '');
    if (!/er$/.test(v) || ER_IRREGULAR.indexOf(v) >= 0) return null;
    const stem = stemOf(v);
    if (!stem) return null;
    const soft = /g$/.test(stem);
    return ER_ENDINGS.map(e => {
      const needsE = soft && /^[ao]/.test(e);
      return stem + (needsE ? 'e' : '') + e;
    });
  }

  /* The verb's six forms, from the table. */
  function forms(infinitive) {
    const f = FORMS[infinitive];
    return Array.isArray(f) ? f.slice() : null;
  }

  /* The subject pronoun, with elision.
   *
   * `je` loses its vowel before another vowel: j'ai, j'aime, j'attends. The
   * rule is written here rather than baked into the table because it is a
   * property of the pronoun and the first letter of the form, not of the
   * verb -- and a table that spelled "j'ai" as a unit would have to be
   * rechecked every time a form was added. */
  function subject(person, form) {
    const p = PERSONS[person];
    if (!p) return null;
    if (p === 'je' && /^[aeiouâêîôûéèàùh]/i.test(form || '')) return "j'";
    return p + ' ';
  }

  /* A full phrase: "j'ai", "nous allons". */
  function phrase(infinitive, person) {
    const f = forms(infinitive);
    if (!f || !f[person]) return null;
    return subject(person, f[person]) + f[person];
  }

  /* Every (verb, person) the drill can ask, for the caller to sample. */
  function questions(verbs) {
    const out = [];
    for (const v of verbs) {
      const f = forms(v);
      if (!f) continue;
      for (let i = 0; i < PERSONS.length; i++) out.push({ infinitive: v, person: i });
    }
    return out;
  }

  window.ArcadeConjugation = {
    PERSONS, ER_ENDINGS, FORMS,
    stemOf, regular, forms, subject, phrase, questions
  };
})();
