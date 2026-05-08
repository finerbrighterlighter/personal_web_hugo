import { getCache, setCache } from './cache.js';

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


async function fetchRepo(owner, { name, label }) {
  const key    = `github-${owner}-${name}`;
  const cached = getCache(key);
  if (cached) { cached._label = label; return cached; }

  const [repoRes, langRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${name}`),
    fetch(`https://api.github.com/repos/${owner}/${name}/languages`),
  ]);
  if (!repoRes.ok || !langRes.ok) throw new Error(`GitHub API ${repoRes.status}`);
  const data  = await repoRes.json();
  data._langs = await langRes.json();
  data._label = label;
  setCache(key, data);
  return data;
}

const BAR_WIDTH = 10;

function makeBar(colors) {
  const wrap = document.createElement('span');
  wrap.style.cssText = 'letter-spacing:1px;cursor:default;';
  for (const color of colors) {
    const s = document.createElement('span');
    s.textContent = '█';
    s.style.color = color;
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
  if (repoUrl) {
    bar.style.cursor = 'pointer';
    bar.addEventListener('click', () => window.open(repoUrl, '_blank', 'noopener'));
  }

  /* Tooltip HTML — events attached at row level by caller */
  const header = repoName
    ? `<span style="color:var(--primary-color);font-weight:bold">${repoName}</span><br>`
    : '';
  const lines = entries.map(([lang, bytes]) => {
    const pct = ((bytes / total) * 100).toFixed(1);
    return `<span style="color:${colorMap.get(lang)}">■</span> ${lang} ${pct}%`;
  });
  const footer = repoUrl ? `<span style="color:var(--secondary-color);opacity:0.6"> · click to open repo</span>` : '';
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
    ownerLink.rel         = 'noopener';
    ownerLink.textContent = group.label || group.owner;
    ownerLink.style.cssText = 'color:var(--primary-color);text-decoration:none;';
    ownerLink.addEventListener('mouseover', () => ownerLink.style.textDecoration = 'underline');
    ownerLink.addEventListener('mouseout',  () => ownerLink.style.textDecoration = 'none');
    tdOwner.appendChild(ownerLink);
    trOwner.appendChild(tdOwner);
    tbody.appendChild(trOwner);

    const sorted = [...group.repos].sort((a, b) =>
      new Date(b.pushed_at) - new Date(a.pushed_at)
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
      a.rel         = 'noopener';
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
      tdTime.textContent   = relativeTime(repo.pushed_at);
      tdTime.style.cssText = 'text-align:right;color:var(--secondary-color);white-space:pre;';
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

  const config = window.__githubProjects;
  if (!config?.length) return;

  try {
    _groups = await Promise.all(
      config.map(async ({ owner, label, repos }) => ({
        owner,
        label,
        repos: await Promise.all(repos.map(repo => fetchRepo(owner, repo))),
      }))
    );
    render(_groups);
  } catch (err) {
    console.error('GitHub request failed:', err);
    container.innerHTML = '<span class="api-error">$ api is not aping 🐒</span>';
  }
}

load();
