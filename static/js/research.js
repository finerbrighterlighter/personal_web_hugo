/**
 * research.js — Research topics renderer
 *
 * Reads tag frequency data injected by panel-research.html and renders
 * a sorted list of topics with counts, styled as terminal command output.
 *
 * WHAT TO CONFIGURE WHERE
 * ─────────────────────────────────────────────────────────────────────
 * hugo.toml → window.CONFIG      researchTagLimit   how many top tags to show
 * Constants below (this file)    MAX_BAR            fixed bar width in segments (scales to top tag)
 * ─────────────────────────────────────────────────────────────────────
 */

/* ── Tunables ───────────────────────────────────────────────────────────── */

const MAX_BAR = 10; // 10 segments = each segment is 10%; fractional part shown as partial opacity

/* ── Main ───────────────────────────────────────────────────────────────── */

(() => {
  const container = document.getElementById('research-cloud');
  const rawTags   = window.__researchTags;
  if (!container || !rawTags?.length) return;

  const tagMap = {};
  for (const tag of rawTags) tagMap[tag] = (tagMap[tag] || 0) + 1;

  const limit = window.CONFIG?.researchTagLimit ?? 10;
  const top   = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  if (!top.length) return;

  const totalCount = window.__worksCount || 1;

  /* ── Tooltip ─────────────────────────────────────────────────────────── */
  /* Single floating div shared across all rows; positioned on mousemove.  */
  const tooltip = document.createElement('div');
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
    line-height:1.6;
  `;
  document.body.appendChild(tooltip);

  /* ── Table ───────────────────────────────────────────────────────────── */
  const table = document.createElement('table');
  table.className = 'cli-table';
  table.style.tableLayout = 'auto'; // let first column stretch with content

  const caption = document.createElement('caption');
  caption.className = 'sr-only';
  caption.textContent = 'Research topics by frequency';
  table.appendChild(caption);

  const thead = document.createElement('thead');
  thead.className = 'sr-only';
  const headerRow = document.createElement('tr');
  ['Topic', 'Frequency', 'Count'].forEach(text => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (const [tag, count] of top) {
    const tr = document.createElement('tr');
    tr.style.cursor = 'default';

    /* Tag name — links to works search */
    const tdTag = document.createElement('td');
    tdTag.style.width = '100%'; // take all available space
    const a = document.createElement('a');
    a.href        = `/works/?search=${encodeURIComponent(tag)}`;
    a.textContent = tag;
    a.title       = `${tag}: ${count} of ${totalCount} works`;
    a.style.cssText = 'color:var(--secondary-color);text-decoration:none;white-space:nowrap;';
    a.addEventListener('mouseover', () => a.style.color = 'var(--primary-color)');
    a.addEventListener('mouseout',  () => a.style.color = 'var(--secondary-color)');
    tdTag.appendChild(a);
    tr.appendChild(tdTag);

    /* Block bar — 10 segments (1 segment = 10%).
       Whole segments are full opacity; the remainder drives the opacity
       of one extra partial segment so sub-10% differences are visible. */
    const totalFilled  = (count / totalCount) * MAX_BAR;
    const fullSegments = Math.floor(totalFilled);
    const fraction     = totalFilled - fullSegments;
    const emptyCount   = MAX_BAR - fullSegments - (fraction > 0 ? 1 : 0);

    const tdBar = document.createElement('td');
    tdBar.style.cssText = 'white-space:nowrap;padding:0 0.5em;letter-spacing:1px;';

    if (fullSegments > 0) {
      const s = document.createElement('span');
      s.textContent = '█'.repeat(fullSegments);
      s.style.color = 'var(--primary-color)';
      tdBar.appendChild(s);
    }
    if (fraction > 0) {
      const s = document.createElement('span');
      s.textContent = '█';
      s.style.cssText = `color:var(--primary-color);opacity:${fraction.toFixed(2)};`;
      tdBar.appendChild(s);
    }
    if (emptyCount > 0) {
      const s = document.createElement('span');
      s.textContent = '░'.repeat(emptyCount);
      s.style.cssText = 'color:var(--secondary-color);opacity:0.3;';
      tdBar.appendChild(s);
    }

    tr.appendChild(tdBar);

    /* Count */
    const tdCount = document.createElement('td');
    tdCount.textContent = count;
    tdCount.style.cssText = 'text-align:right;color:var(--secondary-color);white-space:nowrap;';
    tr.appendChild(tdCount);

    /* Tooltip events on the whole row */
    tr.addEventListener('mouseenter', () => {
      tooltip.innerHTML =
        `<span style="color:var(--primary-color)">${tag}</span><br>` +
        `${count} of ${totalCount} works &nbsp;·&nbsp; click to search`;
      tooltip.style.opacity = '1';
    });
    tr.addEventListener('mousemove', (e) => {
      const offset = 14;
      const tWidth = tooltip.offsetWidth;
      const left = e.clientX + offset + tWidth > window.innerWidth
        ? e.clientX - tWidth - offset
        : e.clientX + offset;
      tooltip.style.left = `${left}px`;
      tooltip.style.top  = `${e.clientY + offset}px`;
    });
    tr.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);
})();
