/**
 * mermaid-init.js — renders ```mermaid fences on posts with `mermaid: true`.
 *
 * Mermaid itself is loaded from jsDelivr (pinned major); the CSP in
 * netlify.toml allows only that path prefix. Diagrams take their colours
 * from the active palette's CSS variables and re-render on `theme-changed`.
 */
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function buildConfig() {
  return {
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      background:          cssVar('--background-color'),
      primaryColor:        cssVar('--code-bg-color'),
      primaryBorderColor:  cssVar('--secondary-color'),
      primaryTextColor:    cssVar('--font-color'),
      lineColor:           cssVar('--primary-color'),
      edgeLabelBackground: cssVar('--background-color'),
      fontFamily:          cssVar('--mono-font-stack'),
      fontSize:            cssVar('--font-base'),
    }
  };
}

async function renderAll() {
  mermaid.initialize(buildConfig());
  for (const el of document.querySelectorAll('[data-mermaid-src]')) {
    const { svg } = await mermaid.render(el.id + '-svg', el.dataset.mermaidSrc);
    el.innerHTML = svg;
  }
}

document.querySelectorAll('pre code.language-mermaid').forEach((el, i) => {
  const div = Object.assign(document.createElement('div'), {
    id: 'mermaid-' + i,
    className: 'mermaid'
  });
  div.dataset.mermaidSrc = el.textContent;
  el.parentElement.replaceWith(div);
});

renderAll();
document.addEventListener('theme-changed', renderAll);
