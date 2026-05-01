import { getCache, setCache } from './cache.js';

(() => {
  const article = document.querySelector('article[data-doi]');
  if (!article) return;

  const doi = article.dataset.doi;
  if (!doi) return;

  const btn = document.getElementById('bibtex-btn');
  if (!btn) return;

  /* ── Build panel ────────────────────────────────────────────────── */

  const panel = document.createElement('div');
  panel.className = 'terminal-window';
  panel.style.display = 'none';               // inline wins over .terminal-window { display:flex }
  panel.style.marginTop = 'var(--space-6)';   // equal gap: buttons↑panel and panel↓tags

  const header = document.createElement('div');
  header.className = 'window-header';
  // collapse_windows.js handles click-to-collapse for all .terminal-window headers;
  // it runs at DOMContentLoaded, after this module has appended the panel to the DOM,
  // so it finds and wires our header automatically — no duplicate listener needed here.

  const controls = document.createElement('div');
  controls.className = 'window-controls';
  controls.setAttribute('aria-hidden', 'true');
  for (const cls of ['close', 'minimize', 'maximize']) {
    const s = document.createElement('span');
    s.className = `control ${cls}`;
    controls.appendChild(s);
  }

  const titleEl = document.createElement('div');
  titleEl.className = 'window-title';
  titleEl.textContent = 'fetch.sh';

  header.appendChild(controls);
  header.appendChild(titleEl);

  const content = document.createElement('div');
  content.className = 'window-content';

  const prompt = document.createElement('pre');
  prompt.className = 'panel-terminal';
  prompt.textContent = `$ doi.org/${doi} --format=bibtex`;

  const pre = document.createElement('pre');
  pre.style.cssText = 'white-space:pre-wrap;word-break:break-all;margin:0.5rem 0;line-height:1.5;color:var(--font-color);';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.className = 'work-link-btn';
  copyBtn.disabled = true;

  content.appendChild(prompt);
  content.appendChild(pre);
  content.appendChild(copyBtn);

  panel.appendChild(header);
  panel.appendChild(content);

  btn.closest('.work-links').appendChild(panel);

  /* ── Copy ───────────────────────────────────────────────────────── */

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(pre.textContent).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    });
  });

  /* ── Fetch (once; cache handles repeats) ────────────────────────── */

  let fetched = false;

  async function fetchBibTeX() {
    const cacheKey = `bibtex-${doi}`;
    const cached = getCache(cacheKey);
    if (cached !== null) return cached;

    const res = await fetch(`https://doi.org/${doi}`, {
      headers: { Accept: 'application/x-bibtex' }
    });
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    setCache(cacheKey, text);
    return text;
  }

  /* ── CITE / EXIT toggle ─────────────────────────────────────────── */

  let isOpen = false;

  btn.addEventListener('click', async () => {
    if (isOpen) {
      panel.style.display = 'none';
      btn.textContent = 'CITE';
      isOpen = false;
      return;
    }

    panel.style.display = '';
    panel.classList.remove('collapsed');
    btn.textContent = 'EXIT';
    isOpen = true;

    if (!fetched) {
      pre.textContent = 'Fetching…';

      try {
        pre.textContent = await fetchBibTeX();
        fetched = true;
        copyBtn.disabled = false;
      } catch {
        pre.textContent = '! doi.org did not return BibTeX for this entry.';
      }
    }
  });
})();
