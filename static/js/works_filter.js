/**
 * works_filter.js — Client-side filtering and search for the works page
 *
 * Filter state is kept in sync with the URL query string, so filters
 * survive page shares and browser back/forward. The tag cloud in
 * panel-research.html links here via ?search=TAG.
 *
 * WHAT TO CONFIGURE WHERE
 * ─────────────────────────────────────────────────────────────────────
 * works.html (Hugo template)   data-filter / data-value on buttons,
 *                              data-search on each .post — these drive
 *                              which filter keys exist and what they match
 * This file                    Nothing needs changing for normal use;
 *                              filter keys below must match data-filter
 *                              values in the template
 * ─────────────────────────────────────────────────────────────────────
 */

/* ── DOM refs ───────────────────────────────────────────────────────────── */

const buttons     = document.querySelectorAll("#works-filters button[data-filter]");
const posts       = document.querySelectorAll(".post");
const countEl     = document.getElementById("works-count");
const searchInput = document.getElementById("works-search");

/* ── Filter state ───────────────────────────────────────────────────────── */

// Keys must match the data-filter attribute values used in works.html
let filters = {
  condition:  "all",
  datasource: "all",
  method:     "all",
  year:       "all"
};

let searchQuery = "";

/* ── URL sync ───────────────────────────────────────────────────────────── */

// Restore all filter state from the URL on load.
// Supports ?condition=X, ?method=Y, ?search=Z, or any combination.
// Tag cloud links arrive as ?search=TAG — this handles that too.
function readFromURL() {
  const params = new URLSearchParams(window.location.search);
  for (const key of Object.keys(filters)) {
    if (params.has(key)) filters[key] = params.get(key);
  }
  if (params.has('search')) {
    searchQuery = params.get('search').toLowerCase().trim();
    if (searchInput) searchInput.value = params.get('search');
  }
}

// Reflect the current filter state back into the URL (replaceState, no history entry).
// Active filters appear as query params; "all" / empty search are omitted.
function writeToURL() {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(filters)) {
    if (val !== 'all') params.set(key, val);
  }
  if (searchQuery) params.set('search', searchQuery);
  const qs = params.toString();
  history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

/* ── Button active states ───────────────────────────────────────────────── */

// Highlight the button whose data-value matches the current filter for that type.
// Runs on init (after readFromURL) and after every button click.
function syncButtonStates() {
  for (const [type, val] of Object.entries(filters)) {
    document.querySelectorAll(`#works-filters button[data-filter="${type}"]`)
      .forEach(b => b.classList.toggle('active', b.dataset.value === val));
  }
}

/* ── Visibility ─────────────────────────────────────────────────────────── */

// Show/hide .post elements based on current filters and search query.
// Also collapses empty year-groups and works-category sections.
function updateVisibility() {
  posts.forEach(post => {
    // data-* attributes on each .post are set by works.html at build time
    const cond       = post.dataset.condition  || "";
    const datasource = post.dataset.datasource || "";
    const method     = post.dataset.method     || "";
    const year       = post.dataset.year       || "";
    const searchable = (post.dataset.search    || "").toLowerCase();

    const visible =
      (filters.condition  === "all" || cond.includes(filters.condition))        &&
      (filters.datasource === "all" || datasource.includes(filters.datasource)) &&
      (filters.method     === "all" || method.includes(filters.method))         &&
      (filters.year       === "all" || year === filters.year)                   &&
      (!searchQuery       || searchable.includes(searchQuery));

    post.classList.toggle("hidden", !visible);
  });

  // Hide year headings with no visible papers under them
  document.querySelectorAll(".year-group").forEach(group => {
    group.classList.toggle("hidden", !group.querySelectorAll(".post:not(.hidden)").length);
  });

  // Hide category headings (Journal, Conference, etc.) with no visible papers
  document.querySelectorAll(".works-category").forEach(cat => {
    cat.classList.toggle("hidden", !cat.querySelectorAll(".post:not(.hidden)").length);
  });

  if (countEl) {
    const n = document.querySelectorAll(".post:not(.hidden)").length;
    countEl.textContent = `showing ${n} of ${posts.length}`;
  }
}

/* ── More-toggle (expand hidden filter tags) ────────────────────────────── */

document.querySelectorAll(".more-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    const tags = btn.parentElement.querySelector(".more-tags");
    tags.classList.toggle("collapsed");
    btn.textContent = tags.classList.contains("collapsed") ? "+ more" : "− less";
  });
});

/* ── Search input ───────────────────────────────────────────────────────── */

if (searchInput) {
  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value.toLowerCase().trim();
    writeToURL();
    updateVisibility();
  });
}

/* ── Filter buttons ─────────────────────────────────────────────────────── */

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    filters[btn.dataset.filter] = btn.dataset.value;
    writeToURL();
    syncButtonStates();
    updateVisibility();
  });
});

/* ── Init ───────────────────────────────────────────────────────────────── */

readFromURL();      // restore state from URL (tag-cloud links, shared URLs, back button)
syncButtonStates(); // highlight the correct filter buttons
updateVisibility(); // apply initial filter
