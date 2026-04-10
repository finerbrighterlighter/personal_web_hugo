/**
 * OpenAlex Terminal Metrics
 * Adapted for Hugo Console Theme
 */

const authorId = "A5065083669";
const graphDisplayYears = 10;

/* ---------------------------- */
/* FETCH DATA */
/* ---------------------------- */

async function fetchOpenAlexData() {

  const cacheKey = "openalex-author-data";

  /* --------------------------------------
     Check session cache first
  -------------------------------------- */

  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  /* --------------------------------------
     Otherwise fetch from OpenAlex API
  -------------------------------------- */

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

  /* --------------------------------------
     Save raw API response for this tab
  -------------------------------------- */

  sessionStorage.setItem(cacheKey, JSON.stringify(data));

  return data;
}


function cssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

/* ---------------------------- */
/* PROCESS DATA */
/* ---------------------------- */

function processData(author, works, cutoffYear) {

  const journalWorks = works.filter(w =>
    w.type === "article" || w.type === "preprint"
  );

  const recentWorks = journalWorks.filter(
    w => w.publication_year >= cutoffYear
  );

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

  const startYear = Math.min(...author.counts_by_year.map(y => y.year));
  const endYear = new Date().getFullYear();

  const timeline = [];
  let runningCitationTotal = 0;

  for (let y = startYear; y <= endYear; y++) {

    const yearData =
      author.counts_by_year.find(d => d.year === y) ||
      { works_count: 0, cited_by_count: 0 };

    runningCitationTotal += yearData.cited_by_count;

    timeline.push({
      year: y,
      pubs: yearData.works_count,
      cumulativeCitations: runningCitationTotal
    });

  }

  return {

    metrics: {

      all: {
        pubs: journalWorks.length,
        h: author.summary_stats.h_index,
        i10: author.summary_stats.i10_index,
        totalCites: author.cited_by_count
      },

      recent: {
        pubs: recentWorks.length,
        h: calculateH(recentWorks),
        i10: recentWorks.filter(w => w.cited_by_count >= 10).length,
        inflow: author.counts_by_year
          .filter(y => y.year >= cutoffYear)
          .reduce((s, y) => s + y.cited_by_count, 0)
      }

    },

    timeline

  };

}


/* ---------------------------- */
/* RENDER SVG CHART */
/* ---------------------------- */

function renderChartSVG(timeline) {

    const width = 450;
    const height = 150;
    const paddingX = 40;
    const paddingY = 30;
    const buffer = 0.1;
  
    /* read theme colors from CSS root */
    const css = getComputedStyle(document.documentElement);
  
    const primary = css.getPropertyValue("--primary-color").trim();
    const secondary = css.getPropertyValue("--secondary-color").trim();
    const fontColor = css.getPropertyValue("--font-color").trim();
    const invertFont = css.getPropertyValue("--invert-font-color").trim();
    const codeBg = css.getPropertyValue("--code-bg-color").trim();
  
    const maxPubs = Math.max(...timeline.map(d => d.pubs), 1);
    const minPubs = Math.min(...timeline.map(d => d.pubs));
    const maxCites = Math.max(...timeline.map(d => d.cumulativeCitations), 1);
    const minCites = Math.min(...timeline.map(d => d.cumulativeCitations));
  
    const barWidth = (width - (paddingX * 2)) / timeline.length;
  
    const getLineY = (val) => {
      const range = maxCites - minCites;
      if (range === 0) return height / 2;
      const normalized = (val - minCites) / range;
      const buffered = buffer + (normalized * (1 - 2 * buffer));
      return height - paddingY - (buffered * (height - paddingY * 2));
    };
  
    const getBarH = (val) => {
      if (val === 0) return 0;
      const range = maxPubs - minPubs;
      const availableHeight = height - paddingY * 2;
      if (range === 0) return availableHeight * (buffer + 0.5 * (1 - 2 * buffer));
      const normalized = (val - minPubs) / range;
      const bufferedScale = buffer + (normalized * (1 - buffer));
      return bufferedScale * availableHeight;
    };
  
    const linePoints = timeline.map((d, i) => {
      const x = paddingX + (i * barWidth) + (barWidth / 2);
      return `${x},${getLineY(d.cumulativeCitations)}`;
    }).join(" ");
  
    return `
  <svg viewBox="0 0 ${width} ${height}"
       id="oa-svg"
       style="width:100%; height:auto; font-family:monospace; overflow:visible; background:${codeBg};">
  
    <!-- LEFT AXIS (PUBLICATIONS) -->
    <circle cx="18" cy="${paddingY}" r="10" fill="${secondary}" />
    <text x="18" y="${paddingY + 4}" font-size="11" font-weight="bold"
          fill="${invertFont}" text-anchor="middle">${maxPubs}</text>
  
    <circle cx="18" cy="${height - paddingY}" r="10" fill="${secondary}" />
    <text x="18" y="${height - paddingY + 4}" font-size="11" font-weight="bold"
          fill="${invertFont}" text-anchor="middle">${minPubs}</text>
  
    <line x1="${paddingX - 5}" y1="${paddingY}"
          x2="${paddingX - 5}" y2="${height - paddingY}"
          stroke="${secondary}" />
  
    <!-- RIGHT AXIS (CUMULATIVE CITATIONS) -->
    <circle cx="${width - 18}" cy="${paddingY}" r="10" fill="${primary}" />
    <text x="${width - 18}" y="${paddingY + 4}" font-size="11" font-weight="bold"
          fill="${invertFont}" text-anchor="middle">${maxCites}</text>
  
    <circle cx="${width - 18}" cy="${height - paddingY}" r="10" fill="${primary}" />
    <text x="${width - 18}" y="${height - paddingY + 4}" font-size="11" font-weight="bold"
          fill="${invertFont}" text-anchor="middle">${minCites}</text>
  
    <line x1="${width - paddingX + 5}" y1="${paddingY}"
          x2="${width - paddingX + 5}" y2="${height - paddingY}"
          stroke="${secondary}" />
  
    <!-- PUBLICATION BARS -->
    ${timeline.map((d, i) => `
      <rect class="oa-bar"
            data-year="${d.year}"
            data-pubs="${d.pubs}"
            data-cites="${d.cumulativeCitations}"
            x="${paddingX + (i * barWidth) + 2}"
            y="${height - paddingY - getBarH(d.pubs)}"
            width="${barWidth - 4}"
            height="${getBarH(d.pubs)}"
            fill="${secondary}"
            opacity="0.8"
            rx="2" />
    `).join("")}
  
    <!-- CITATION LINE -->
    <polyline points="${linePoints}"
              fill="none"
              stroke="${primary}"
              stroke-width="2" />
  
    ${timeline.map((d, i) => `
      <circle cx="${paddingX + (i * barWidth) + (barWidth / 2)}"
              cy="${getLineY(d.cumulativeCitations)}"
              r="3"
              fill="${primary}" />
    `).join("")}
  
    <!-- YEAR LABELS -->
    <text x="${paddingX}" y="${height - 10}" font-size="10"
          fill="${secondary}">
          ${timeline[0].year}
    </text>
  
    <text x="${width - paddingX}" y="${height - 10}" font-size="10"
          fill="${secondary}" text-anchor="end">
          ${timeline[timeline.length - 1].year}
    </text>
  
  </svg>`;
  }

/* ---------------------------- */
/* MAIN LOADER */
/* ---------------------------- */

async function loadOpenAlexMetrics(elementId) {

  const element = document.getElementById(elementId);

  if (!element)
    return;

  const cutoffYear = new Date().getFullYear() - 5;

  try {

    const raw = await fetchOpenAlexData();

    const data = processData(raw.author, raw.works, cutoffYear);

    const graphTimeline =
      data.timeline.slice(-graphDisplayYears);

    element.innerHTML = `

<a href="https://openalex.org/authors/A5065083669" class="panel-terminal">
$ openalex --metrics
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

<a href="https://openalex.org/authors/A5065083669" class="panel-terminal">$ openalex --timeline</a>

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

<div style="display:flex;justify-content:space-between;font-size:10px;margin-top:8px;color:#aaa">
<span>Source: OpenAlex API</span>
<span>Updated: ${new Date(raw.author.updated_date).toISOString().slice(0,10)}</span>
</div>

`;

  }
  catch (err) {

    element.innerHTML =
      `<pre style="color:red">Error: ${err.message}</pre>`;

  }

}

/* ---------------------------- */
/* TOOLTIP INTERACTION */
/* ---------------------------- */

const tooltip = document.getElementById("oa-tooltip");
const container = document.getElementById("oa-chart-container");

document.querySelectorAll(".oa-bar").forEach(bar => {

  bar.addEventListener("mouseenter", () => {

    tooltip.innerHTML = `
<strong>${bar.dataset.year}</strong><br>
works: ${bar.dataset.pubs}<br>
citations: ${bar.dataset.cites}
`;

    tooltip.style.opacity = 1;

  });

  bar.addEventListener("mousemove", (e) => {

    const rect = container.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    /* prevent sidebar cutoff */

    if (mouseX > rect.width / 2) {

      tooltip.style.left = "auto";
      tooltip.style.right = (rect.width - mouseX + 15) + "px";

    } else {

      tooltip.style.right = "auto";
      tooltip.style.left = (mouseX + 15) + "px";

    }

    tooltip.style.top = (mouseY - 40) + "px";

  });

  bar.addEventListener("mouseleave", () => {
    tooltip.style.opacity = 0;
  });

});

/* ---------------------------- */
/* RUN */
/* ---------------------------- */

loadOpenAlexMetrics("openalex-metrics");

document.addEventListener("theme-changed", () => {
  loadOpenAlexMetrics("openalex-metrics");
});