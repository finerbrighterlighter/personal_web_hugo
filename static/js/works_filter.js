const buttons  = document.querySelectorAll("#works-filters button[data-filter]");
const posts    = document.querySelectorAll(".post");
const countEl  = document.getElementById("works-count");

/* ── more-toggle ─────────────────────────────────────────────────────────── */

document.querySelectorAll(".more-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    const tags = btn.parentElement.querySelector(".more-tags");
    tags.classList.toggle("collapsed");
    btn.textContent = tags.classList.contains("collapsed") ? "+ more" : "− less";
  });
});

/* ── filter state ────────────────────────────────────────────────────────── */

let filters = {
  condition:  "all",
  datasource: "all",
  method:     "all",
  year:       "all"
};

let searchQuery = "";

/* ── visibility ──────────────────────────────────────────────────────────── */

function updateVisibility() {

  posts.forEach(post => {
    const cond       = post.dataset.condition  || "";
    const datasource = post.dataset.datasource || "";
    const method     = post.dataset.method     || "";
    const year       = post.dataset.year       || "";
    const searchable = (post.dataset.search    || "").toLowerCase();

    const visible =
      (filters.condition  === "all" || cond.includes(filters.condition))       &&
      (filters.datasource === "all" || datasource.includes(filters.datasource)) &&
      (filters.method     === "all" || method.includes(filters.method))         &&
      (filters.year       === "all" || year === filters.year)                   &&
      (!searchQuery || searchable.includes(searchQuery));

    post.classList.toggle("hidden", !visible);
  });

  document.querySelectorAll(".year-group").forEach(group => {
    group.classList.toggle("hidden", !group.querySelectorAll(".post:not(.hidden)").length);
  });

  document.querySelectorAll(".works-category").forEach(cat => {
    cat.classList.toggle("hidden", !cat.querySelectorAll(".post:not(.hidden)").length);
  });

  if (countEl) {
    const n = document.querySelectorAll(".post:not(.hidden)").length;
    countEl.textContent = `showing ${n} of ${posts.length}`;
  }
}

/* ── search ──────────────────────────────────────────────────────────────── */

const searchInput = document.getElementById("works-search");
if (searchInput) {
  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value.toLowerCase().trim();
    updateVisibility();
  });
}

/* ── filter buttons ──────────────────────────────────────────────────────── */

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const type  = btn.dataset.filter;
    const value = btn.dataset.value;

    filters[type] = value;

    document
      .querySelectorAll(`#works-filters button[data-filter="${type}"]`)
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    updateVisibility();
  });
});

/* ── init ────────────────────────────────────────────────────────────────── */

updateVisibility();
