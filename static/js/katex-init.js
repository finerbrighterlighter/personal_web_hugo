/**
 * katex-init.js — runs KaTeX auto-render on posts with `math: true`.
 *
 * Loaded with `defer` after the self-hosted katex.min.js and
 * contrib/auto-render.min.js (static/vendor/katex/). Deferred scripts run in
 * document order, so renderMathInElement is defined by the time this runs.
 * Delimiters mirror the goldmark passthrough config in hugo.toml.
 */
(() => {
  if (typeof renderMathInElement !== 'function') return;
  renderMathInElement(document.body, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$',  right: '$',  display: false },
    ],
  });
})();
