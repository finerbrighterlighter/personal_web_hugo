import { getCache, setCache } from './cache.js';

(() => {
  const article = document.querySelector('article[data-doi]');
  if (!article) return;

  const doi = article.dataset.doi;
  if (!doi) return;

  const btn = document.getElementById('bibtex-btn');
  if (!btn) return;

  /* ── BibTeX → RIS converter ─────────────────────────────────────── */

  function parseBibTeX(src) {
    const typeMatch = src.match(/@(\w+)\s*\{([^,]+),/);
    if (!typeMatch) return null;
    const type = typeMatch[1].toLowerCase();
    const key  = typeMatch[2].trim();

    /* Walk the body char-by-char to respect nested braces */
    const fields = {};
    let body = src.slice(src.indexOf(',') + 1);
    let i = 0;
    while (i < body.length) {
      while (i < body.length && /[\s,]/.test(body[i])) i++;
      if (i >= body.length) break;

      let nameEnd = body.indexOf('=', i);
      if (nameEnd === -1) break;
      const name = body.slice(i, nameEnd).trim().toLowerCase();
      i = nameEnd + 1;
      while (i < body.length && /\s/.test(body[i])) i++;

      let value = '';
      if (body[i] === '{') {
        let depth = 0, start = i + 1;
        while (i < body.length) {
          if      (body[i] === '{') depth++;
          else if (body[i] === '}') { depth--; if (depth === 0) { value = body.slice(start, i); i++; break; } }
          i++;
        }
      } else if (body[i] === '"') {
        i++;
        const start = i;
        while (i < body.length && body[i] !== '"') i++;
        value = body.slice(start, i++);
      } else {
        const start = i;
        while (i < body.length && body[i] !== ',' && body[i] !== '}') i++;
        value = body.slice(start, i).trim();
      }
      if (name) fields[name] = value;
    }
    return { type, key, fields };
  }

  /* Remove LaTeX brace groups used for case protection: {COVID-19} → COVID-19 */
  function clean(s) { return s.replace(/\{([^{}]*)\}/g, '$1').trim(); }

  function bibtexToRIS(src) {
    const parsed = parseBibTeX(src);
    if (!parsed) return null;
    const { type, key, fields: f } = parsed;

    const typeMap = {
      article: 'JOUR', inproceedings: 'CONF', conference: 'CONF',
      book: 'BOOK', incollection: 'CHAP', phdthesis: 'THES',
      mastersthesis: 'THES', techreport: 'RPRT', misc: 'GEN',
      unpublished: 'UNPB', preprint: 'UNPB',
    };
    const lines = [`TY  - ${typeMap[type] ?? 'GEN'}`];

    if (f.title)     lines.push(`TI  - ${clean(f.title)}`);
    if (f.author)
      f.author.split(/\s+and\s+/i).forEach(a => lines.push(`AU  - ${clean(a)}`));
    if (f.editor)
      f.editor.split(/\s+and\s+/i).forEach(e => lines.push(`ED  - ${clean(e)}`));
    if (f.journal)   lines.push(`JO  - ${clean(f.journal)}`);
    if (f.booktitle) lines.push(`T2  - ${clean(f.booktitle)}`);
    if (f.year)      lines.push(`PY  - ${f.year}`);
    if (f.volume)    lines.push(`VL  - ${f.volume}`);
    if (f.number)    lines.push(`IS  - ${f.number}`);
    if (f.pages) {
      const [sp, ep] = f.pages.split(/--?/);
      lines.push(`SP  - ${sp.trim()}`);
      if (ep) lines.push(`EP  - ${ep.trim()}`);
    }
    if (f.doi)       lines.push(`DO  - ${f.doi}`);
    if (f.url)       lines.push(`UR  - ${f.url}`);
    if (f.abstract)  lines.push(`AB  - ${clean(f.abstract)}`);
    if (f.publisher) lines.push(`PB  - ${clean(f.publisher)}`);
    if (f.issn)      lines.push(`SN  - ${f.issn}`);
    if (f.keywords)
      f.keywords.split(/[;,]/).forEach(kw => { if (kw.trim()) lines.push(`KW  - ${clean(kw)}`); });
    lines.push('ER  - ');

    return { ris: lines.join('\r\n'), key };
  }

  /* ── Build panel ────────────────────────────────────────────────── */

  const panel = document.createElement('div');
  panel.className = 'terminal-window';
  panel.style.display = 'none';
  panel.style.marginTop = 'var(--space-6)';

  const header = document.createElement('div');
  header.className = 'window-header';
  // collapse_windows.js wires all .terminal-window headers at DOMContentLoaded,
  // which fires after this module runs — no duplicate listener needed here.

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

  const risBtn = document.createElement('button');
  risBtn.textContent = 'RIS';
  risBtn.className = 'work-link-btn';
  risBtn.disabled = true;

  content.appendChild(prompt);
  content.appendChild(pre);
  content.appendChild(copyBtn);
  content.appendChild(risBtn);

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

  /* ── RIS download ───────────────────────────────────────────────── */

  risBtn.addEventListener('click', () => {
    const result = bibtexToRIS(pre.textContent);
    if (!result) return;
    const blob = new Blob([result.ris], { type: 'application/x-research-info-systems' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${result.key}.ris`;
    a.click();
    URL.revokeObjectURL(url);
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
        risBtn.disabled = false;
      } catch {
        pre.textContent = '! doi.org did not return BibTeX for this entry.';
      }
    }
  });
})();
