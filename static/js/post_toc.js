/**
 * post_toc.js — toc.sh panel level switch on post pages.
 *
 * Rendered by partials/panel-post-toc.html when a post has 2+ headings.
 * Two radio inputs (levels 1/2) control how deep the Hugo TableOfContents
 * is shown; CSS reads `.post-toc[data-visible-level]`. Self-gates when the
 * panel is absent.
 */
(() => {
  const toc = document.querySelector(".post-toc");
  const controls = document.querySelector(".post-toc-controls");
  const radios = document.querySelectorAll('input[name="post-toc-level"]');
  const currentLevel = document.querySelector(".post-toc-current-level");
  const tocRoot = document.querySelector(".post-toc #TableOfContents");

  if (!toc || !controls || !radios.length || !currentLevel || !tocRoot) return;

  const maxDepth = (() => {
    let depth = 1;
    tocRoot.querySelectorAll("li").forEach((item) => {
      let current = 1;
      let node = item.parentElement;
      while (node && node !== tocRoot) {
        if (node.tagName === "UL" || node.tagName === "OL") current += 1;
        node = node.parentElement;
      }
      depth = Math.max(depth, current);
    });
    return Math.min(depth, 2);
  })();

  if (maxDepth <= 1) {
    controls.hidden = true;
  }

  const applyLevel = (level) => {
    const clamped = Math.max(1, Math.min(maxDepth, level));
    toc.dataset.visibleLevel = String(clamped);
    currentLevel.textContent = String(clamped);
    radios.forEach((radio) => {
      radio.checked = radio.value === String(clamped);
    });
  };

  applyLevel(1);
  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) applyLevel(Number(radio.value));
    });
  });
})();
