/**
 * OpenAlex Terminal Metrics
 * Adapted for Hugo Console Theme
 */

import { getCache, setCache } from './cache.js';

const authorId = "A5065083669";
const graphDisplayYears = 5;

/* ---------------------------- */
/* FETCH DATA                   */
/* ---------------------------- */

async function fetchOpenAlexData() {

  const cacheKey = "openalex-author-data";

  const cached = getCache(cacheKey);
  if (cached !== null) return cached;

  /* Fetch author summary and full works list in parallel */

  const [authRes, worksRes] = await Promise.all([
    fetch(`https://api.openalex.org/authors/${authorId}`),
    fetch(`https://api.openalex.org/works?filter=author.id:${authorId}&per_page=200`)
  ]);

  if (!authRes.ok || !worksRes.ok)
    throw new Error("OpenAlex API failure");

  const data = {
    author: await authRes.json(),
    works: (await worksRes.json()).results
  };

  setCache(cacheKey, data);

  return data;
}

/* ---------------------------- */
/* PROCESS DATA                 */
/* ---------------------------- */

function processData(author, works, cutoffYear) {

  /* Filter to journal articles and preprints only */

  const journalWorks = works.filter(w =>
    w.type === "article" || w.type === "preprint"
  );

  const recentWorks = journalWorks.filter(
    w => w.publication_year >= cutoffYear
  );

  /* h-index calculator for an arbitrary work list */

  const calculateH = (workList) => {

    const cites = workList
      .map(w => w.cited_by_count)
      .sort((a, b) => b - a);

    let h = 0;

    for (let i = 0; i < cites.length; i++) {
      if (cites[i] >= i + 1)
        h = i + 1;
      else
        break;
    }

    return h;
  };

  /* Build year-by-year timeline from first known year to current year.
     Fills missing years (no API entry) with zero counts. */

  const startYear = Math.min(...author.counts_by_year.map(y => y.year));
  const endYear   = new Date().getFullYear();

  const timeline = [];

  for (let y = startYear; y <= endYear; y++) {

    const yearData =
      author.counts_by_year.find(d => d.year === y) ||
      { works_count: 0, cited_by_count: 0 };

    timeline.push({
      year: y,
      pubs: yearData.works_count
    });

  }

  return {

    metrics: {

      all: {
        pubs:       journalWorks.length,
        h:          author.summary_stats.h_index,
        i10:        author.summary_stats.i10_index,
        totalCites: author.cited_by_count
      },

      recent: {
        pubs:   recentWorks.length,
        h:      calculateH(recentWorks),
        i10:    recentWorks.filter(w => w.cited_by_count >= 10).length,
        inflow: author.counts_by_year
          .filter(y => y.year >= cutoffYear)
          .reduce((s, y) => s + y.cited_by_count, 0)
      }

    },

    timeline

  };

}

/* ---------------------------- */
/* RENDER SVG CHART             */
/* ---------------------------- */

function renderChartSVG(timeline) {

  const width    = 450;
  const height   = 150;
  const paddingX = 44;
  const paddingY = 30;

  /* Read theme colors from CSS custom properties */

  const css = getComputedStyle(document.documentElement);
  const primary    = css.getPropertyValue("--primary-color").trim();
  const secondary  = css.getPropertyValue("--secondary-color").trim();
  const invertFont = css.getPropertyValue("--invert-font-color").trim();
  const codeBg     = css.getPropertyValue("--code-bg-color").trim();

  /* Scale constants */

  const maxPubs         = Math.max(...timeline.map(d => d.pubs), 1);
  const availableHeight = height - paddingY * 2;
  const barWidth        = (width - paddingX * 2) / timeline.length;

  /* Linear bar height — proportional to max, anchored at 0 */

  const getBarH = (val) => {
    if (val === 0) return 0;
    return (val / maxPubs) * availableHeight;
  };

  return `
<svg viewBox="0 0 ${width} ${height}"
     id="oa-svg"
     aria-hidden="true"
     style="width:100%; height:auto; font-family:monospace; overflow:visible; background:${codeBg}; border:0.1px dashed ${secondary}; margin-top:0.5rem;">

  <!-- LEFT AXIS: top marker -->
  <circle cx="18" cy="${paddingY}" r="10" fill="${primary}" />
  <text x="18" y="${paddingY + 4}" font-size="11" font-weight="bold"
        fill="${invertFont}" text-anchor="middle">${maxPubs}</text>

  <!-- LEFT AXIS: bottom marker -->
  <circle cx="18" cy="${height - paddingY}" r="10" fill="${primary}" />
  <text x="18" y="${height - paddingY + 4}" font-size="11" font-weight="bold"
        fill="${invertFont}" text-anchor="middle">0</text>

  <!-- LEFT AXIS: spine -->
  <line x1="${paddingX - 5}" y1="${paddingY}"
        x2="${paddingX - 5}" y2="${height - paddingY}"
        stroke="${secondary}" stroke-opacity="0.4" />

  <!-- PUBLICATION BARS -->
  ${timeline.map((d, i) => `
    <rect class="oa-bar"
          data-year="${d.year}"
          data-pubs="${d.pubs}"
          x="${paddingX + (i * barWidth) + 2}"
          y="${height - paddingY - getBarH(d.pubs)}"
          width="${barWidth - 4}"
          height="${getBarH(d.pubs)}"
          fill="${primary}"
          opacity="0.8"
          rx="2" />
  `).join("")}

  <!-- YEAR LABELS -->
  <text x="${paddingX}" y="${height - 10}" font-size="10"
        fill="${secondary}">${timeline[0].year}</text>

  <text x="${width - paddingX}" y="${height - 10}" font-size="10"
        fill="${secondary}" text-anchor="end">${timeline[timeline.length - 1].year}</text>

</svg>`;
}

/* ---------------------------- */
/* MAIN LOADER                  */
/* ---------------------------- */

async function loadOpenAlexMetrics(elementId) {

  const element = document.getElementById(elementId);

  if (!element)
    return;

  const cutoffYear = new Date().getFullYear() - graphDisplayYears;

  try {

    const raw  = await fetchOpenAlexData();
    const data = processData(raw.author, raw.works, cutoffYear);

    /* Slice to the configured display window */

    const graphTimeline = data.timeline.slice(-graphDisplayYears);

    element.innerHTML = `

<a href="https://openalex.org/authors/A5065083669" class="panel-terminal">
$ openalex stats
</a>

<table class="cli-table">
  <thead>
    <tr>
      <th>Metric</th>
      <th>Career</th>
      <th>Since ${cutoffYear}</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>Works</td>
      <td>${data.metrics.all.pubs}</td>
      <td>${data.metrics.recent.pubs}</td>
    </tr>

    <tr>
      <td>Citations</td>
      <td>${data.metrics.all.totalCites}</td>
      <td>${data.metrics.recent.inflow}</td>
    </tr>

    <tr>
      <td>h-index</td>
      <td>${data.metrics.all.h}</td>
      <td>${data.metrics.recent.h}</td>
    </tr>

    <tr>
      <td>i10-index</td>
      <td>${data.metrics.all.i10}</td>
      <td>${data.metrics.recent.i10}</td>
    </tr>
  </tbody>
</table>

<div style="margin-top:10px">

<div id="oa-chart-container" style="position:relative;margin-top:10px">

<a href="https://openalex.org/authors/A5065083669" class="panel-terminal">$ openalex history --limit=${graphDisplayYears}y</a>

<div id="oa-tooltip"
     style="
     position:absolute;
     background:var(--code-bg-color);
     color:var(--font-color);
     border:1px solid var(--secondary-color);
     font-family:monospace;
     font-size:11px;
     padding:6px;
     border-radius:3px;
     opacity:0;
     pointer-events:none;
     z-index:100;
     white-space:nowrap;
     transition:opacity 0.1s;
">
</div>

${renderChartSVG(graphTimeline)}

</div>

<div style="display:flex;justify-content:space-between;font-size:10px;margin-top:8px;color:var(--secondary-color)">
<span>Source: OpenAlex API</span>
<span>Updated: ${new Date(raw.author.updated_date).toISOString().slice(0,10)}</span>
</div>

`;

    /* ------------------------------------ */
    /* TOOLTIP                              */
    /* Attached after innerHTML is set so   */
    /* the bar elements exist in the DOM    */
    /* ------------------------------------ */

    const tooltip   = document.getElementById("oa-tooltip");
    const container = document.getElementById("oa-chart-container");

    document.querySelectorAll(".oa-bar").forEach(bar => {

      bar.addEventListener("mouseenter", () => {

        tooltip.textContent = "";
        const label = document.createElement("strong");
        label.textContent = bar.dataset.year;
        tooltip.appendChild(label);
        tooltip.appendChild(document.createElement("br"));
        tooltip.appendChild(document.createTextNode(`works: ${bar.dataset.pubs}`));
        tooltip.style.opacity = 1;

      });

      bar.addEventListener("mousemove", (e) => {

        const rect   = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        /* Flip tooltip to left side when near right edge */

        if (mouseX > rect.width / 2) {
          tooltip.style.left  = "auto";
          tooltip.style.right = (rect.width - mouseX + 15) + "px";
        } else {
          tooltip.style.right = "auto";
          tooltip.style.left  = (mouseX + 15) + "px";
        }

        tooltip.style.top = (mouseY - 40) + "px";

      });

      bar.addEventListener("mouseleave", () => {
        tooltip.style.opacity = 0;
      });

    });

  }
  catch (err) {

    element.innerHTML = '<span class="api-error">$ api is not aping 🐒</span>';

  }

}

/* ---------------------------- */
/* RUN                          */
/* ---------------------------- */

loadOpenAlexMetrics("openalex-metrics");

/* Re-render on theme switch to pick up new CSS color values */

document.addEventListener("theme-changed", () => {
  loadOpenAlexMetrics("openalex-metrics");
});