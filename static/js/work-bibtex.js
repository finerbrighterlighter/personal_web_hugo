import { getCache, setCache } from './cache.js';

(() => {
  const article = document.querySelector('article[data-doi]');
  if (!article) return;

  const doi = article.dataset.doi;
  if (!doi) return;

  const btn = document.getElementById('bibtex-btn');
  if (!btn) return;

  /* ── Helpers ────────────────────────────────────────────────────── */

  /* Remove LaTeX brace groups: {COVID-19} → COVID-19 */
  function clean(s) { return (s || '').replace(/\{([^{}]*)\}/g, '$1').trim(); }

  function parseAuthor(raw) {
    const trimmed = clean(raw).trim();
    if (trimmed.includes(',')) {
      const [last, rest = ''] = trimmed.split(',');
      const firsts = rest.trim().split(/\s+/).filter(Boolean);
      return { last: last.trim(), firsts };
    }
    const words = trimmed.split(/\s+/);
    return { last: words.at(-1), firsts: words.slice(0, -1) };
  }

  /* Last FM  (NLM / AMA) */
  function fmtNLM({ last, firsts }) {
    return last + (firsts.length ? ' ' + firsts.map(f => f[0].toUpperCase()).join('') : '');
  }

  /* Last, F. M.  (APA) */
  function fmtAPA({ last, firsts }) {
    return last + (firsts.length ? ', ' + firsts.map(f => f[0].toUpperCase() + '.').join(' ') : '');
  }

  function authorList(field, fmt, limit, etAl = 'et al.') {
    const raw = (field || '').split(/\s+and\s+/i).map(a => parseAuthor(a));
    const kept = raw.length > limit ? raw.slice(0, limit) : raw;
    const names = kept.map(fmt);
    if (raw.length > limit) names.push(etAl);
    return names;
  }

  /* ── Citation formatters ────────────────────────────────────────── */

  function fmtBibTeX(raw) { return raw; }

  function fmtCiteNLM(f) {
    const authors = authorList(f.author, fmtNLM, 6).join(', ');
    const pages   = (f.pages || '').replace(/--?/, '-');
    let s = (authors ? authors + '. ' : '') + clean(f.title) + '. ';
    s += clean(f.journal) + '. ';
    s += (f.year || '');
    if (f.volume) s += ';' + f.volume;
    if (f.number) s += '(' + f.number + ')';
    if (pages)    s += ':' + pages;
    s += '.';
    if (f.doi)    s += ' doi: ' + f.doi;
    return s;
  }

  function fmtCiteAMA(f) {
    const authors = authorList(f.author, fmtNLM, 6).join(', ');
    const pages   = (f.pages || '').replace(/--?/, '-');
    let s = (authors ? authors + '. ' : '') + clean(f.title) + '. ';
    s += clean(f.journal) + '. ';
    s += (f.year || '');
    if (f.volume) s += ';' + f.volume;
    if (f.number) s += '(' + f.number + ')';
    if (pages)    s += ':' + pages;
    s += '.';
    if (f.doi)    s += ' doi:' + f.doi;
    return s;
  }

  function fmtCiteAPA(f) {
    const raw    = (f.author || '').split(/\s+and\s+/i).map(a => parseAuthor(a));
    let authorStr;
    if (raw.length > 20) {
      authorStr = raw.slice(0, 19).map(fmtAPA).join(', ') + ', … ' + fmtAPA(raw.at(-1));
    } else if (raw.length > 1) {
      authorStr = raw.slice(0, -1).map(fmtAPA).join(', ') + ', & ' + fmtAPA(raw.at(-1));
    } else {
      authorStr = raw.map(fmtAPA).join('');
    }
    const pages = (f.pages || '').replace(/--?/, '–');
    let s = (authorStr ? authorStr + ' ' : '') + '(' + (f.year || '') + '). ';
    s += clean(f.title) + '. ';
    s += clean(f.journal);
    if (f.volume) s += ', ' + f.volume;
    if (f.number) s += '(' + f.number + ')';
    if (pages)    s += ', ' + pages;
    s += '.';
    if (f.doi)    s += ' https://doi.org/' + f.doi;
    return s;
  }

  /* ── BibTeX parser (for RIS + citation formatters) ──────────────── */

  function parseBibTeX(src) {
    const m = src.match(/@(\w+)\s*\{([^,]+),/);
    if (!m) return null;
    const type = m[1].toLowerCase();
    const key  = m[2].trim();
    const fields = {};
    let body = src.slice(src.indexOf(',') + 1);
    let i = 0;
    while (i < body.length) {
      while (i < body.length && /[\s,]/.test(body[i])) i++;
      if (i >= body.length) break;
      const eq = body.indexOf('=', i);
      if (eq === -1) break;
      const name = body.slice(i, eq).trim().toLowerCase();
      i = eq + 1;
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
        const start = ++i;
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

  /* ── BibTeX prettifier (display only — copy/download use raw) ───── */

  const BIBTEX_FIELD_ORDER = [
    'title', 'author', 'journal', 'booktitle', 'year', 'month',
    'volume', 'number', 'pages', 'doi', 'url', 'publisher', 'issn',
    'abstract', 'keywords', 'editor', 'note',
  ];

  function prettifyBibTeX(src) {
    const p = parseBibTeX(src);
    if (!p) return src;
    const { type, key, fields: f } = p;
    const known   = BIBTEX_FIELD_ORDER.filter(k => f[k] !== undefined);
    const rest    = Object.keys(f).filter(k => !BIBTEX_FIELD_ORDER.includes(k));
    const ordered = [...known, ...rest];
    const pad     = Math.max(...ordered.map(k => k.length));
    const lines   = [`@${type}{${key},`];
    ordered.forEach(k => {
      lines.push(`  ${k.padEnd(pad)} = {${f[k]}},`);
    });
    lines.push('}');
    return lines.join('\n');
  }

  /* ── BibTeX → RIS (for download) ───────────────────────────────── */

  function bibtexToRIS(src) {
    const p = parseBibTeX(src);
    if (!p) return null;
    const { type, key, fields: f } = p;
    const typeMap = {
      article: 'JOUR', inproceedings: 'CONF', conference: 'CONF',
      book: 'BOOK', incollection: 'CHAP', phdthesis: 'THES',
      mastersthesis: 'THES', techreport: 'RPRT', misc: 'GEN',
      unpublished: 'UNPB', preprint: 'UNPB',
    };
    const lines = [`TY  - ${typeMap[type] ?? 'GEN'}`];
    if (f.title)     lines.push(`TI  - ${clean(f.title)}`);
    if (f.author)    f.author.split(/\s+and\s+/i).forEach(a => lines.push(`AU  - ${clean(a)}`));
    if (f.editor)    f.editor.split(/\s+and\s+/i).forEach(e => lines.push(`ED  - ${clean(e)}`));
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
    if (f.keywords)  f.keywords.split(/[;,]/).forEach(kw => { if (kw.trim()) lines.push(`KW  - ${clean(kw)}`); });
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

  /* ── Action row: [Copy] [RIS]  ·  • bibtex • nlm • apa • ama • ── */

  const actionRow = document.createElement('div');
  actionRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;flex-wrap:wrap;gap:0.5rem;';

  /* Left: Copy + BIB + RIS */
  const leftBtns = document.createElement('div');

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.className = 'work-link-btn';
  copyBtn.disabled = true;

  const bibBtn = document.createElement('button');
  bibBtn.textContent = 'BIB';
  bibBtn.className = 'work-link-btn';
  bibBtn.disabled = true;

  const risBtn = document.createElement('button');
  risBtn.textContent = 'RIS';
  risBtn.className = 'work-link-btn';
  risBtn.disabled = true;

  leftBtns.appendChild(copyBtn);
  leftBtns.appendChild(bibBtn);
  leftBtns.appendChild(risBtn);

  /* Right: format selector */
  const fmtSelector = document.createElement('div');
  fmtSelector.style.cssText = 'font-family:monospace;font-size:var(--font-xs);color:var(--secondary-color);';

  const FORMATS = ['bibtex', 'nlm', 'apa', 'ama'];
  const FMT_LABELS = {
    bibtex: 'BibTeX',
    nlm:    'National Library of Medicine',
    apa:    'American Psychological Association',
    ama:    'American Medical Association',
  };
  let currentFmt = 'bibtex';
  let rawBibTeX  = '';
  let parsedFields = null;

  const fmtBtns = {};
  fmtSelector.appendChild(Object.assign(document.createElement('span'), { textContent: '• ' }));
  FORMATS.forEach((fmt, i) => {
    const b = document.createElement('button');
    b.textContent = fmt;
    b.dataset.fmt = fmt;
    b.style.cssText = 'background:none;border:none;padding:0;cursor:pointer;font-family:monospace;font-size:var(--font-xs);';
    fmtBtns[fmt] = b;
    fmtSelector.appendChild(b);
    fmtSelector.appendChild(Object.assign(document.createElement('span'), { textContent: ' • ' + (i < FORMATS.length - 1 ? '' : '') }));
  });

  /* Re-render bullets cleanly: • bibtex • nlm • apa • ama • */
  fmtSelector.innerHTML = '';
  fmtSelector.appendChild(Object.assign(document.createElement('span'), { textContent: '• ' }));
  FORMATS.forEach((fmt, i) => {
    const b = document.createElement('button');
    b.textContent = fmt;
    b.title       = FMT_LABELS[fmt];
    b.dataset.fmt = fmt;
    b.style.cssText = 'background:none;border:none;padding:0;cursor:pointer;font-family:monospace;font-size:var(--font-xs);transition:color 0.15s;';
    fmtBtns[fmt] = b;
    fmtSelector.appendChild(b);
    fmtSelector.appendChild(Object.assign(document.createElement('span'), { textContent: i < FORMATS.length - 1 ? ' • ' : ' •' }));
  });

  actionRow.appendChild(leftBtns);
  actionRow.appendChild(fmtSelector);

  content.appendChild(prompt);
  content.appendChild(pre);
  content.appendChild(actionRow);

  panel.appendChild(header);
  panel.appendChild(content);
  btn.closest('.work-links').appendChild(panel);

  /* ── Format switching ───────────────────────────────────────────── */

  function setFormat(fmt) {
    currentFmt = fmt;
    prompt.textContent = `$ doi.org/${doi} --format=${fmt}`;

    /* Highlight active format */
    FORMATS.forEach(f => {
      fmtBtns[f].style.color = f === fmt ? 'var(--primary-color)' : 'var(--secondary-color)';
    });

    if (!parsedFields) return;
    const f = parsedFields;
    switch (fmt) {
      case 'bibtex': pre.textContent = prettifyBibTeX(rawBibTeX); break;
      case 'nlm':    pre.textContent = fmtCiteNLM(f);     break;
      case 'ama':    pre.textContent = fmtCiteAMA(f);     break;
      case 'apa':    pre.textContent = fmtCiteAPA(f);     break;
    }
  }

  FORMATS.forEach(fmt => {
    fmtBtns[fmt].addEventListener('click', () => setFormat(fmt));
  });

  /* ── Copy ───────────────────────────────────────────────────────── */

  copyBtn.addEventListener('click', () => {
    const text = currentFmt === 'bibtex' ? rawBibTeX : pre.textContent;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    });
  });

  /* ── BIB download ───────────────────────────────────────────────── */

  bibBtn.addEventListener('click', () => {
    const parsed = parseBibTeX(rawBibTeX);
    if (!parsed) return;
    const blob = new Blob([rawBibTeX], { type: 'application/x-bibtex' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${parsed.key}.bib` });
    a.click();
    URL.revokeObjectURL(url);
  });

  /* ── RIS download ───────────────────────────────────────────────── */

  risBtn.addEventListener('click', () => {
    const result = bibtexToRIS(rawBibTeX);
    if (!result) return;
    const blob = new Blob([result.ris], { type: 'application/x-research-info-systems' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${result.key}.ris` });
    a.click();
    URL.revokeObjectURL(url);
  });

  /* ── Fetch ──────────────────────────────────────────────────────── */

  let fetched = false;

  async function fetchBibTeX() {
    const cacheKey = `bibtex-${doi}`;
    const cached = getCache(cacheKey);
    if (cached !== null) return cached;
    const res = await fetch(`https://doi.org/${doi}`, { headers: { Accept: 'application/x-bibtex' } });
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    setCache(cacheKey, text);
    return text;
  }

  /* ── CITE / EXIT toggle ─────────────────────────────────────────── */

  let isOpen = false;

  /* Init format selector to bibtex active */
  setFormat('bibtex');

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
        rawBibTeX    = await fetchBibTeX();
        parsedFields = parseBibTeX(rawBibTeX)?.fields ?? null;
        fetched      = true;
        copyBtn.disabled = false;
        bibBtn.disabled  = false;
        risBtn.disabled  = false;
        setFormat(currentFmt);
      } catch {
        pre.textContent = '! doi.org did not return BibTeX for this entry.';
      }
    }
  });
})();
