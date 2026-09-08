import { getCache, setCache } from './cache.js';

const isTouch = window.matchMedia('(hover: none)').matches;

/* GitHub linguist colours for common languages */
const LANG_COLORS = {
  'Jupyter Notebook':  '#DA5B0B',
  'Python':            '#3572A5',
  'R':                 '#198CE7',
  'JavaScript':        '#f1e05a',
  'TypeScript':        '#3178c6',
  'HTML':              '#e34c26',
  'CSS':               '#563d7c',
  'SCSS':              '#c6538c',
  'Shell':             '#89e051',
  'Dockerfile':        '#384d54',
  'Makefile':          '#427819',
  'Go':                '#00ADD8',
  'Rust':              '#dea584',
  'Java':              '#b07219',
  'C':                 '#555555',
  'C++':               '#f34b7d',
  'Ruby':              '#701516',
  'PHP':               '#4F5D95',
  'Swift':             '#F05138',
  'Kotlin':            '#A97BFF',
  'Scala':             '#c22d40',
  'Julia':             '#a270ba',
  'MATLAB':            '#e16737',
  'Stan':              '#b2011d',
};

/* Okabe & Ito (2008) Color Universal Design — deuteranopia/protanopia safe */
const OKABE_ITO = [
  '#E69F00', // orange
  '#56B4E9', // sky blue
  '#009E73', // bluish green
  '#F0E442', // yellow
  '#0072B2', // blue
  '#D55E00', // vermillion
  '#CC79A7', // reddish purple
];

function isColorblind() {
  const mode = document.documentElement.dataset.theme || 'light';
  return localStorage.getItem(`theme-palette-${mode}`) === 'colorblind';
}

function langColor(name) {
  return LANG_COLORS[name] ?? '#8b949e';
}

/* Build a per-language color map — Okabe & Ito by rank when colorblind mode is on */
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(min  / 60);
  const day  = Math.floor(hr   / 24);
  const mo   = Math.floor(day  / 30);
  const yr   = Math.floor(day  / 365);
  let s;
  if (yr  >= 1) s = `${yr}y ago`;
  else if (mo  >= 1) s = `${mo}mo ago`;
  else if (day >= 1) s = `${day}d ago`;
  else if (hr  >= 1) s = `${hr}h ago`;
  else s = `${min}m ago`;
  return s.padStart(10);
}

function buildColorMap(entries) {
  if (isColorblind()) {
    return new Map(entries.map(([lang], i) => [lang, OKABE_ITO[i % OKABE_ITO.length]]));
  }
  return new Map(entries.map(([lang]) => [lang, langColor(lang)]));
}


/* Baked data older than this triggers one live refresh attempt (cached via cache.js). */
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

async function fetchLive(owner, name) {
  const [repoRes, langRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${name}`),
    fetch(`https://api.github.com/repos/${owner}/${name}/languages`),
  ]);
  if (!repoRes.ok || !langRes.ok) throw new Error(`GitHub API ${repoRes.status}`);
  const data = await repoRes.json();
  return {
    name:      data.name,
    html_url:  data.html_url,
    pushed_at: data.pushed_at,
    _langs:    await langRes.json(),
  };
}

/*
 * Resolve one repo's render data. Order of preference:
 *   1. build-time data baked into the JSON blob by panel-github.html (no network)
 *   2. localStorage cache from an earlier live fetch
 *   3. live fetch — only when the baked data is missing or stale
 *   4. a minimal placeholder (name + link, no bar/time) so one failure never blanks the panel
 */
async function resolveRepo(owner, { name, label, data }, stale) {
  const key = `github-${owner}-${name}`;
  let out = null;

  if (data && !stale) {
    out = data;
  } else {
    const cached = getCache(key);
    if (cached) {
      out = cached;
    } else {
      try {
        out = await fetchLive(owner, name);
        setCache(key, out);
      } catch (err) {
        out = data || null; // stale baked data beats nothing
      }
    }
  }

  if (!out) {
    out = { name, html_url: `https://github.com/${owner}/${name}`, pushed_at: null, _langs: {} };
  }
  return { ...out, _label: label };
}

const BAR_WIDTH = 10;

function makeBar(colors) {
  const wrap = document.createElement('span');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.cssText = 'letter-spacing:1px;cursor:default;';
  for (const color of colors) {
    const s = document.createElement('span');
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = `display:inline-block;width:0.65em;height:1em;background-color:${color};vertical-align:-0.12em;`;
    wrap.appendChild(s);
  }
  return wrap;
}

function makeLangBar(langs, tooltip, repoName, repoUrl) {
  const total   = Object.values(langs).reduce((s, v) => s + v, 0);
  if (!total) return null;

  const entries  = Object.entries(langs).sort((a, b) => b[1] - a[1]);
  const colorMap = buildColorMap(entries);

  /* Largest-remainder to assign exactly BAR_WIDTH segments */
  const allotted = entries.map(([lang, bytes], i) => {
    const exact = (bytes / total) * BAR_WIDTH;
    return { lang, count: Math.floor(exact), remainder: exact % 1, i };
  });
  const spare = BAR_WIDTH - allotted.reduce((s, a) => s + a.count, 0);
  allotted.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < spare; i++) allotted[i].count++;
  allotted.sort((a, b) => a.i - b.i); // restore frequency order

  const colors = allotted.flatMap(({ lang, count }) =>
    Array(count).fill(colorMap.get(lang))
  );

  const bar = makeBar(colors);
  if (repoUrl && !isTouch) {
    bar.style.cursor = 'pointer';
    bar.addEventListener('click', () => window.open(repoUrl, '_blank', 'noopener,noreferrer'));
  }

  /* Tooltip HTML — events attached at row level by caller */
  const header = repoName
    ? `<span style="color:var(--primary-color);font-weight:bold">${repoName}</span><br>`
    : '';
  const lines = entries.map(([lang, bytes]) => {
    const pct = ((bytes / total) * 100).toFixed(1);
    return `<span style="color:${colorMap.get(lang)}">■</span> ${lang} ${pct}%`;
  });
  const footer = repoUrl ? `<br><span style="color:var(--secondary-color);opacity:0.6">click to open repo</span>` : '';
  const tooltipHTML = header + lines.join('<br>') + footer;

  return { bar, tooltipHTML };
}

/* Tooltip is module-level so re-renders don't leak extra divs into body */
const tooltip = document.createElement('div');
tooltip.id = 'github-lang-tooltip';
tooltip.style.cssText = `
  position:fixed;
  background:var(--code-bg-color);
  color:var(--font-color);
  border:1px solid var(--secondary-color);
  font-family:monospace;
  font-size:11px;
  padding:5px 8px;
  border-radius:3px;
  pointer-events:none;
  opacity:0;
  transition:opacity 0.1s;
  z-index:200;
  white-space:nowrap;
  line-height:1.8;
`;
document.body.appendChild(tooltip);

let _groups = null;

function render(groups) {
  const container = document.getElementById('github-projects');
  if (!container) return;

  container.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'cli-table';
  table.style.cssText = 'width:100%;table-layout:auto;';

  const caption = document.createElement('caption');
  caption.className = 'sr-only';
  caption.textContent = 'Open source projects';
  table.appendChild(caption);

  const thead = document.createElement('thead');
  thead.className = 'sr-only';
  const headerRow = document.createElement('tr');
  ['Repository', 'Languages', 'Updated'].forEach(text => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  groups.forEach((group, gi) => {
    if (gi > 0) {
      const trSpacer = document.createElement('tr');
      const tdSpacer = document.createElement('td');
      tdSpacer.colSpan = 3;
      tdSpacer.style.paddingTop = '0.75em';
      trSpacer.appendChild(tdSpacer);
      tbody.appendChild(trSpacer);
    }

    /* Owner */
    const trOwner = document.createElement('tr');
    const tdOwner = document.createElement('td');
    tdOwner.colSpan = 3;
    const ownerLink = document.createElement('a');
    ownerLink.href        = `https://github.com/${group.owner}`;
    ownerLink.target      = '_blank';
    ownerLink.rel         = 'noreferrer noopener';
    ownerLink.title       = `GitHub: ${group.owner}`;
    ownerLink.textContent = group.label || group.owner;
    ownerLink.style.cssText = 'color:var(--primary-color);text-decoration:none;';
    ownerLink.addEventListener('mouseover', () => ownerLink.style.textDecoration = 'underline');
    ownerLink.addEventListener('mouseout',  () => ownerLink.style.textDecoration = 'none');
    tdOwner.appendChild(ownerLink);
    trOwner.appendChild(tdOwner);
    tbody.appendChild(trOwner);

    const sorted = [...group.repos].sort((a, b) =>
      (b.pushed_at ? new Date(b.pushed_at).getTime() : 0) - (a.pushed_at ? new Date(a.pushed_at).getTime() : 0)
    );

    sorted.forEach((repo, ri) => {
      const isLast = ri === sorted.length - 1;
      const prefix = isLast ? '└─' : '├─';

      /* Name + time row */
      const trName = document.createElement('tr');
      trName.style.color = 'var(--secondary-color)';

      const tdName = document.createElement('td');
      tdName.style.cssText = 'width:100%;white-space:nowrap;';
      tdName.textContent   = `${prefix} `;
      const a = document.createElement('a');
      a.href        = repo.html_url;
      a.target      = '_blank';
      a.rel         = 'noreferrer noopener';
      a.textContent = repo._label || repo.name;
      a.style.cssText = 'color:var(--secondary-color);text-decoration:none;';
      a.addEventListener('mouseover', () => { a.style.color = 'var(--primary-color)'; });
      a.addEventListener('mouseout',  () => { a.style.color = 'var(--secondary-color)'; });
      tdName.appendChild(a);
      trName.appendChild(tdName);

      /* Language bar — middle column */
      const tdBar = document.createElement('td');
      tdBar.style.cssText = 'white-space:nowrap;padding:0 0.5em;vertical-align:middle;';
      tdBar.setAttribute('aria-hidden', 'true');
      const langs = repo._langs ?? {};
      let rowTooltipHTML = null;
      if (Object.keys(langs).length) {
        const result = makeLangBar(langs, tooltip, repo.name, repo.html_url);
        if (result) { tdBar.appendChild(result.bar); rowTooltipHTML = result.tooltipHTML; }
      } else {
        const placeholder = document.createElement('span');
        placeholder.style.cssText = 'color:var(--secondary-color);opacity:0.3;letter-spacing:1px;';
        placeholder.textContent = '░'.repeat(BAR_WIDTH);
        tdBar.appendChild(placeholder);
      }
      trName.appendChild(tdBar);

      const tdTime = document.createElement('td');
      tdTime.textContent   = repo.pushed_at ? relativeTime(repo.pushed_at) : ''.padStart(10);
      tdTime.style.cssText = 'text-align:right;color:var(--secondary-color);white-space:pre;';
      tdTime.className = 'col-hide-mobile';
      trName.appendChild(tdTime);

      /* Tooltip on the whole row */
      if (rowTooltipHTML) {
        trName.style.cursor = 'default';
        trName.addEventListener('mouseenter', () => {
          tooltip.innerHTML     = rowTooltipHTML;
          tooltip.style.opacity = '1';
        });
        trName.addEventListener('mousemove', (e) => {
          const offset = 14;
          const tw     = tooltip.offsetWidth;
          const left   = e.clientX + offset + tw > window.innerWidth
            ? e.clientX - tw - offset : e.clientX + offset;
          tooltip.style.left = `${left}px`;
          tooltip.style.top  = `${e.clientY + offset}px`;
        });
        trName.addEventListener('mouseleave', () => {
          tooltip.style.opacity = '0';
        });
      }

      tbody.appendChild(trName);
    });
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

/* Re-render on theme change so colorblind palette takes effect immediately */
document.addEventListener('theme-changed', () => {
  if (_groups) render(_groups);
});

async function load() {
  const container = document.getElementById('github-projects');
  if (!container) return;

  // Build-time payload from panel-github.html: { fetchedAt, groups: [{ owner, label, repos: [{ name, label, data? }] }] }.
  // `data` is the GitHub metadata fetched during the Hugo build; absent when that fetch failed.
  let payload = null;
  try {
    payload = JSON.parse(document.getElementById('github-projects-data')?.textContent || 'null');
  } catch (err) { payload = null; }
  const config = payload?.groups;
  if (!config?.length) return;

  const fetchedAt = payload.fetchedAt ? new Date(payload.fetchedAt).getTime() : 0;
  const stale = !fetchedAt || (Date.now() - fetchedAt > STALE_AFTER_MS);

  _groups = await Promise.all(
    config.map(async ({ owner, label, repos }) => ({
      owner,
      label,
      repos: await Promise.all(repos.map(repo => resolveRepo(owner, repo, stale))),
    }))
  );

  const anyData = _groups.some(g => g.repos.some(r => r.pushed_at));
  if (!anyData) {
    console.error('GitHub request failed: no build-time data and live fetch unavailable');
    container.innerHTML = '<span class="api-error">$ api is not aping 🐒</span>';
    return;
  }
  render(_groups);
}

load();
