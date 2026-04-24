/**
 * research.js — Research tag cloud renderer
 *
 * Reads tag frequency data injected by panel-research.html and renders
 * a shuffled word cloud where font size and opacity reflect how often
 * each tag appears across works pages.
 *
 * WHAT TO CONFIGURE WHERE
 * ─────────────────────────────────────────────────────────────────────
 * hugo.toml → window.CONFIG      researchTagLimit   how many top tags to show
 * Constants below (this file)    MIN_PX / MAX_PX    font size range in pixels
 *                                MIN_ALPHA / MAX_ALPHA  opacity range (0–1)
 *                                SEP_OPACITY        opacity of the · separator
 *                                MAX_HEIGHT         cloud container height
 * ─────────────────────────────────────────────────────────────────────
 */

/* ── Tunables (edit here) ───────────────────────────────────────────────── */

const MIN_PX      = 10;   // font size for the least common tag
const MAX_PX      = 18;   // font size for the most common tag
const MIN_ALPHA   = 0.6; // opacity for the least common tag
const MAX_ALPHA   = 1.0;  // opacity for the most common tag
const SEP_OPACITY = 0.25; // opacity of the · separator between tags
const MAX_HEIGHT  = '13em'; // clips the cloud to ~5 lines; set to '' to disable

/* ── Main ───────────────────────────────────────────────────────────────── */

(() => {
  const container = document.getElementById('research-cloud');
  const rawTags   = window.__researchTags; // flat string[] injected by Hugo at build time
  if (!container || !rawTags?.length) return;

  // Count tag frequencies
  const tagMap = {};
  for (const tag of rawTags) tagMap[tag] = (tagMap[tag] || 0) + 1;

  // Take top N by frequency; N comes from hugo.toml → researchTagLimit
  const limit = window.CONFIG?.researchTagLimit ?? 30;
  const top   = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  if (!top.length) return;

  // Compute scaling bounds over the selected subset only
  const counts   = top.map(([, n]) => n);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  const range    = maxCount - minCount || 1;

  // Shuffle so high-frequency tags don't always cluster together
  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top[i], top[j]] = [top[j], top[i]];
  }

  container.style.cssText =
    `line-height:2;word-spacing:5px;` +
    (MAX_HEIGHT ? `max-height:${MAX_HEIGHT};overflow:hidden;` : '');

  for (let i = 0; i < top.length; i++) {
    const [tag, count] = top[i];

    // sqrt scale: compresses large frequency gaps so sizing feels proportional
    const t     = Math.sqrt((count - minCount) / range);
    const size  = MIN_PX + t * (MAX_PX  - MIN_PX);
    const alpha = MIN_ALPHA + t * (MAX_ALPHA - MIN_ALPHA);

    // Each tag is a link → /works/?search=TAG (pre-fills the search box)
    const a = document.createElement('a');
    a.href  = `/works/?search=${encodeURIComponent(tag)}`;
    a.title = `${count} work${count !== 1 ? 's' : ''}`;
    a.style.cssText = `font-size:${size.toFixed(1)}px;opacity:${alpha.toFixed(2)};color:var(--secondary-color);text-decoration:none;`;

    const span = document.createElement('span');
    span.textContent = tag;
    a.appendChild(span);
    container.appendChild(a);

    // Separator between tags (not after the last one)
    if (i < top.length - 1) {
      const sep = document.createElement('span');
      sep.textContent = ' · ';
      sep.style.cssText = `opacity:${SEP_OPACITY};font-size:9px;`;
      container.appendChild(sep);
    }
  }
})();
