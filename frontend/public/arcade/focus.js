/* Keeping focus where the dialog says it is.
 *
 * Two surfaces in the arcade declare `role="dialog" aria-modal="true"`: the
 * maths lesson overlay (`maths-engine.js`) and the spelling rules sheet
 * (`spelling-bee.html`). Both put focus on their close button when they open,
 * which is the correct first move. Neither did anything after that, and
 * `aria-modal="true"` is a claim the page makes to a screen reader that the
 * rest of the document is inert. It was not.
 *
 * Measured before the fix, with six Tabs from the maths close button:
 *
 *   BUTTON(close) -> Place value -> Carrying -> Undoing -> Estimating -> BODY
 *
 * The fifth Tab left the overlay. In the spelling sheet it left on the first,
 * straight to the page's brand link. A keyboard user who tabs past the last
 * topic is now in the page behind a dialog they cannot see, and Escape -- the
 * only way back -- is handled by the same page, so the dialog closes under
 * them.
 *
 * Closing had the matching defect: focus landed on `<body>`, so the next Tab
 * started from the top of the page rather than from the button that opened
 * the dialog. In a page where the opener is four Tabs in, that is four Tabs
 * to get back to where you were.
 *
 * This module is the trap and the restore, used by both. It is deliberately
 * not a general focus manager: it does the two things a modal owes and
 * nothing else.
 */
(function () {
  'use strict';

  /* What a Tab may land on inside a container.
   *
   * `disabled` and `hidden` are excluded because the browser will not focus
   * them, and including them would make the wrap-around land on an element
   * that silently refuses focus -- which reads as the trap failing. A hidden
   * ancestor is caught by `offsetParent`, except for `position: fixed`, whose
   * `offsetParent` is null even when visible, so visibility is checked by
   * rect rather than by that property.
   */
  function focusable(root) {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), '
              + 'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return [...root.querySelectorAll(sel)].filter(el => {
      if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 || r.height > 0;
    });
  }

  let active = null;   // { root, opener, onKey }

  /* Trap Tab inside `root` and remember who opened it.
   *
   * The listener is on `document` in the capture phase rather than on `root`,
   * because a Tab from the last element moves focus to the browser chrome and
   * no keydown reaches a listener bound to an element inside the document.
   * Capturing at the document means the wrap happens before the browser moves
   * focus at all.
   */
  function trap(root, opener) {
    release();
    if (!root) return null;
    const onKey = e => {
      if (e.key !== 'Tab') return;
      const items = focusable(root);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      const now = document.activeElement;
      // Focus outside the dialog at all -- the state the old code reached
      // after one Tab too many -- is pulled back rather than left there.
      if (!root.contains(now)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && now === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && now === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    active = { root, opener: opener || document.activeElement, onKey };
    return active;
  }

  /* Drop the trap and give focus back.
   *
   * The opener is re-focused only if it is still in the document and still
   * focusable. A dialog opened from a button that the dialog itself removed
   * would otherwise leave focus on a detached node, which is worse than
   * `<body>`: the browser reports no active element and the next Tab starts
   * from nowhere.
   */
  function release() {
    if (!active) return;
    document.removeEventListener('keydown', active.onKey, true);
    const { opener } = active;
    active = null;
    if (opener && opener.isConnected && typeof opener.focus === 'function') {
      opener.focus();
    }
  }

  window.ArcadeFocus = { focusable, trap, release, get active() { return active; } };
})();
