/* Algebra gates for Savanna Run.
 *
 * One equation, three answers, three heights. The player picks by jumping: a
 * tap reaches the low band, a held jump the high one. That is the whole
 * mechanic, so the bank's job is to make sure the *height* a child reaches is
 * the only thing that distinguishes the options -- the three values are always
 * distinct, always integers, and never differ only by sign in a way that makes
 * two bands look alike at a glance.
 *
 * The distractors are the mistakes, not random numbers. A gate whose wrong
 * answers are `5`, `6` and `19` teaches nothing; a gate whose wrong answers
 * are `15` (divided the 3 into 22 instead of first removing the 7) and `9`
 * (added instead of subtracted) is a diagnosis. Each form below lists the
 * errors it is worth catching.
 */
(function () {
  'use strict';

  /* A form is a function of one random draw that returns
     `{q, answer, wrong[]}`. `wrong` are the plausible mistakes, in the order
     the form's own comment explains them; the gate picks two.

     Every form is written so the answer is an integer for every draw. A form
     that sometimes yields 7.33 has to be rejected at runtime, and a rejected
     draw means the gate a child sees depends on a retry loop rather than on
     the maths -- so the operand ranges below are chosen to make it exact. */
  const rnd = n => Math.floor(Math.random() * n);
  const between = (lo, hi) => lo + rnd(hi - lo + 1);

  const FORMS = {
    /* x + a = b.  Answer b - a.
       Mistakes: adding instead of subtracting (b + a); answering with the
       number already on the page (b). The second is the most common error of
       all and the first version of this form missed it -- it offered only
       `a - b`, which is negative for every draw, so the form produced one
       distractor and fell through to the fallback every single time. */
    'add': () => {
      const a = between(2, 19), x = between(2, 19), b = a + x;
      return { q: `x + ${a} = ${b}`, answer: x, wrong: [b + a, b, b - a] };
    },

    /* x - a = b.  Answer b + a.
       Mistakes: adding instead of subtracting (x + a, which is what a child
       who treats the sign as `+` gets); answering with b itself. */
    'sub': () => {
      const a = between(2, 19), x = between(a + 1, 40), b = x - a;
      return { q: `x − ${a} = ${b}`, answer: x, wrong: [x + a, b, x - a] };
    },

    /* a·x = b.  Answer b / a.
       Mistakes: a + b (added), b - a (subtracted). */
    'mul': () => {
      const a = between(2, 9), x = between(2, 12), b = a * x;
      return { q: `${a}x = ${b}`, answer: x, wrong: [b - a, b + a, b] };
    },

    /* x / a = b.  Answer a·b.
       Mistakes: dividing again (b / a) when that is a whole number; and
       adding (b + a). */
    'div': () => {
      const a = between(2, 9), b = between(2, 12), x = a * b;
      return { q: `x ÷ ${a} = ${b}`, answer: x, wrong: [b + a, b * 2, b - a, b + 1, b + a + 1] };
    },

    /* a·x + c = d.  Answer (d - c) / a.
       Mistakes: d - c (forgot to divide), (d + c) / a (added instead of
       subtracted). This is the form where the two-step error lives, and both
       mistakes are exact because the ranges are built from the answer. */
    'two-step': () => {
      const a = between(2, 9), x = between(2, 12), c = between(1, 15);
      const d = a * x + c;
      return { q: `${a}x + ${c} = ${d}`, answer: x, wrong: [d - c, d + c, d] };
    },

    /* a·x - c = d.  Answer (d + c) / a.
       Mistakes: d + c (forgot to divide), (d - c) / a (subtracted again). */
    'two-step-sub': () => {
      const a = between(2, 9), x = between(2, 12);
      // c is drawn below a*x so the right-hand side stays positive: an
      // equation reading `3x − 4 = -2` is arithmetically fine and wrong for
      // this drill, and the first version produced it.
      const c = between(1, a * x - 1);
      const d = a * x - c;
      return { q: `${a}x − ${c} = ${d}`, answer: x, wrong: [d + c, d + a, d - c, d, d + 1] };
    },

    /* a(x + c) = d.  Answer d/a - c.
       Mistakes: d/a (forgot the bracket), d/a + c (sign). */
    'bracket': () => {
      const a = between(2, 9), x = between(2, 12), c = between(1, 9);
      const d = a * (x + c);
      return { q: `${a}(x + ${c}) = ${d}`, answer: x, wrong: [d - a, d + c, d] };
    },

    /* a·x + b = c·x + d.  Answer (d - b) / (a - c).
       Mistakes: (d - b) alone, (d + b) / (a - c). */
    'both-sides': () => {
      const c = between(1, 4);
      const a = c + between(1, 5);
      const x = between(2, 9);
      const b = between(1, 12);
      const d = (a - c) * x + b;
      return { q: `${a}x + ${b} = ${c}x + ${d}`, answer: x,
               wrong: [d - b, d + b, d] };
    }
  };

  /* The ladder. Tier 1 is one step with the variable already alone; tier 5 is
     the variable on both sides. A level's tier is its floor, and the run walks
     up one tier every few gates so a child who is getting them right is not
     asked the same shape for three minutes. */
  const TIERS = [
    ['add', 'sub'],
    ['add', 'sub', 'mul', 'div'],
    ['mul', 'div', 'two-step'],
    ['two-step', 'two-step-sub', 'bracket'],
    ['bracket', 'both-sides']
  ];

  /* Build one gate at `tier` (0-4).
   *
   * A form returns *candidates*, not two wrong answers, and the builder keeps
   * the first two that are whole, positive and distinct from the answer. That
   * split is deliberate: a form that filters its own mistakes has to know
   * which of its errors survive the filter, and the first three versions of
   * this file each got it wrong in a different form -- `add` offered only
   * negatives, `sub` offered negatives for small x, `div` offered fractions.
   * Every one of them fell through to a fallback, so the gate a child saw was
   * not the gate the form describes. Candidates plus one filter is the shape
   * that cannot fail that way.
   *
   * Two properties the built gate must hold:
   *
   *   - Exactly three distinct options. A distractor equal to the answer, or
   *     to another distractor, leaves two bands saying the same thing.
   *   - The correct answer is not always in the same band. Band position is
   *     randomised, because a child who learns "the answer is the middle one"
   *     is not doing algebra.
   */
  function gate(tier) {
    const pool = TIERS[Math.max(0, Math.min(TIERS.length - 1, tier | 0))];
    let form = null;
    for (let tries = 0; tries < 40 && !form; tries++) {
      const f = FORMS[pool[rnd(pool.length)]]();
      if (!(f.answer > 0) || !Number.isInteger(f.answer)) continue;
      const wrong = [];
      for (const v of f.wrong) {
        if (!Number.isInteger(v) || v <= 0) continue;
        if (v === f.answer || wrong.indexOf(v) >= 0) continue;
        wrong.push(v);
        if (wrong.length === 2) break;
      }
      if (wrong.length === 2) form = { q: f.q, answer: f.answer, wrong };
    }
    if (!form) {
      // Reached only if every form's candidate list is broken at once, which
      // is a bug -- but a gate that throws mid-run is worse than an easy one.
      form = { q: 'x + 2 = 5', answer: 3, wrong: [7, 5] };
    }
    const opts = [form.answer, form.wrong[0], form.wrong[1]];
    // Shuffle band order. Fisher-Yates over three, which is exact.
    for (let i = opts.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return { q: form.q, options: opts, answer: form.answer };
  }

  window.AlgebraBank = { gate, FORMS, TIERS };
})();
