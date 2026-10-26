/* Two escapes, because there are two contexts, and conflating them is how a
 * quote becomes an attribute break.
 *
 * There were seven copies of `esc` with three different semantics: five
 * escaped `&<>"`, one escaped `&<>`, and spelling-bee escaped `&<>"'`. The
 * narrow one was reachable only in addition-quest, where every interpolation
 * is a text node, so it happened to be safe -- and would have stopped being
 * safe the first time anyone put it in an attribute.
 *
 * The distinction worth encoding:
 *
 *   esc(t)     text between tags. `&`, `<` and `>` are the whole problem;
 *              a quote is legal text and should render as one.
 *   escAttr(v) inside a quoted attribute. `"` must be escaped or it closes the
 *              attribute early and everything after it becomes markup.
 *
 * `'` is escaped by neither, and that is deliberate rather than an oversight.
 * Every attribute in this arcade is written with double quotes -- verified by
 * grep, there is not one single-quoted attribute in the tree -- so a `'` in a
 * value cannot break out of one. Escaping it anyway would be harmless but would
 * also be a claim about a context that does not occur, and the next person to
 * add a single-quoted attribute would read that as cover.
 *
 * Neither is `>` strictly necessary in an attribute value. It is kept in both
 * because the cost is nil and the asymmetry is one less thing to get wrong.
 */
(function () {
  'use strict';

  const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

  /* Text content. */
  const esc = t => String(t == null ? '' : t).replace(/[&<>]/g, c => MAP[c]);

  /* A quoted attribute value. */
  const escAttr = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => MAP[c]);

  window.ArcadeEscape = { esc, escAttr };
})();
