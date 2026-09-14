/**
 * simkl.js — screen.sh panel: recently watched movies, shows and anime (Simkl).
 *
 * Same lifecycle as lastFM.js / anilist.js: on a fresh load call the Simkl API
 * directly from the browser, curate the ten most recent titles, cache the
 * result via cache.js (site-wide TTL, cleared by the privacy.sh flush) and
 * render. Refreshes inside the TTL never reach Simkl.
 *
 * Credentials come from window.CONFIG (baked from HUGO_SIMKL_CLIENT_ID /
 * HUGO_SIMKL_TOKEN at build). Like the Last.fm key they are visible in the
 * page source — an accepted weakness. Note the Simkl PIN token can also
 * write to the account; there is no read-only scope.
 *
 * Fetch strategy: `/sync/all-items?date_from=<RECENT_WINDOW_DAYS ago>` (a few
 * KB) first; only when that yields fewer than LIMIT watched titles fall back
 * to the full library (~400 KB, brotli on the wire). Anime titles come back
 * romaji, so one detail call per anime item adds the English title to the
 * hover label.
 *
 * Markup mirrors anilist.js: <a><img><span class="screen-stamp">S05E06</span></a>.
 * Stamp = progress: Simkl `last_watched` (`S05E06` shows, `E10` anime;
 * year-numbered seasons like `S2026E818` trimmed to `E818`), `FILM` for movies.
 */
import { getCache, setCache } from "./cache.js";

const STRIP_ID = "last-watched";
const API = "https://api.simkl.com";
const CLIENT_ID = window.CONFIG?.simklClientId || "";
const TOKEN = window.CONFIG?.simklToken || "";
const LIMIT = window.CONFIG?.screenLimit ?? 10;   // posters shown
const RECENT_WINDOW_DAYS = 14;                     // first, cheap request covers this span
const APP = "app-name=htunteza-site&app-version=1.0";
const PATHS = { movies: "movies", shows: "tv", anime: "anime" };

async function simkl(path, auth = true) {
  const url = `${API}${path}${path.includes("?") ? "&" : "?"}client_id=${CLIENT_ID}&${APP}`;
  const headers = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Simkl ${res.status} on ${path}`);
  return res.json();
}

/* Flatten the three library buckets into one list of watched titles. */
function flatten(library) {
  const out = [];
  for (const kind of Object.keys(PATHS)) {
    for (const it of library?.[kind] || []) {
      if (!it.last_watched_at) continue;
      const m = kind === "movies" ? it.movie : it.show;
      out.push({
        at: it.last_watched_at,
        kind,
        title: m.title,
        year: m.year,
        poster: m.poster,
        simkl: m.ids.simkl,
        slug: m.ids.slug,
        last: it.last_watched || "",
        watched: it.watched_episodes_count,
        total: it.total_episodes_count,
      });
    }
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
}

/* "S2026E818" (year-numbered seasons) → "E818" so it fits the 52px stamp. */
function stampFor(item) {
  if (item.kind === "movies") return "FILM";
  let s = item.last;
  if (s.length > 8) s = s.replace(/^S\d+/, "");
  return s;
}

/* Hover/alt: "Title (Year)" for films; "Title (English) (Year) · ep 30/36" for shows/anime. */
function labelFor(item, english) {
  let label = item.title;
  if (english && english.toLowerCase() !== item.title.toLowerCase()) label += ` (${english})`;
  if (item.year) label += ` (${item.year})`;
  if (item.kind !== "movies" && item.watched) {
    label += ` · ep ${item.watched}`;
    if (item.total) label += `/${item.total}`;
  }
  return label;
}

async function fetchRecent(limit) {
  const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 86400000).toISOString().replace(/\.\d{3}Z$/, "Z");
  let items = flatten(await simkl(`/sync/all-items?date_from=${since}`));
  if (items.length < limit) items = flatten(await simkl("/sync/all-items"));
  const top = items.slice(0, limit);

  /* English titles for anime only; a failed lookup just leaves romaji. */
  const english = await Promise.all(
    top.map((it) =>
      it.kind === "anime"
        ? simkl(`/anime/${it.simkl}?extended=full`, false).then((d) => d?.en_title || "").catch(() => "")
        : Promise.resolve("")
    )
  );

  return {
    fetchedAt: new Date().toISOString(),
    items: top.map((it, i) => ({
      href: `https://simkl.com/${PATHS[it.kind]}/${it.simkl}${it.slug ? `/${it.slug}` : ""}`,
      img: `https://simkl.in/posters/${it.poster}_c.webp`,
      label: labelFor(it, english[i]),
      stamp: stampFor(it),
    })),
  };
}

function renderStrip(payload, element) {
  element.innerHTML = "";
  if (!payload || payload.error) {
    element.innerHTML = '<span class="api-error">$ api is not aping 🐒</span>';
    return;
  }
  if (!payload.items?.length) {
    element.innerHTML = '<span class="api-error">$ no recent activity</span>';
    return;
  }

  const frag = document.createDocumentFragment();
  for (const item of payload.items) {
    const link = document.createElement("a");
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noreferrer noopener";

    const img = document.createElement("img");
    img.src = item.img;
    img.width = 64;
    img.height = 64;
    img.title = item.label;
    img.alt = item.label;
    img.loading = "lazy";
    img.decoding = "async";
    link.appendChild(img);

    if (item.stamp) {
      const stamp = document.createElement("span");
      stamp.className = "screen-stamp";
      stamp.textContent = item.stamp;
      link.appendChild(stamp);
    }
    frag.appendChild(link);
  }
  element.appendChild(frag);
}

async function loadScreen() {
  const element = document.getElementById(STRIP_ID);
  if (!element) return;

  if (!CLIENT_ID || !TOKEN) {
    console.error("Simkl: HUGO_SIMKL_CLIENT_ID / HUGO_SIMKL_TOKEN not set");
    renderStrip({ error: true }, element);
    return;
  }

  const cacheKey = `simkl-recent-${LIMIT}`;
  const cached = getCache(cacheKey);
  if (cached) { renderStrip(cached, element); return; }

  try {
    const payload = await fetchRecent(LIMIT);
    setCache(cacheKey, payload);
    renderStrip(payload, element);
  } catch (err) {
    console.error("Simkl request failed:", err);
    renderStrip({ error: true }, element);
  }
}

loadScreen();
