/**
 * Trakt Recently Watched Panel
 * Fetches watch history from Trakt and images from TMDB
 * Uses sessionStorage to cache results for the lifetime of the tab
 */

const TRAKT_KEY = CONFIG.trakt;
const TMDB_KEY = CONFIG.tmdb;

const TRAKT_API = "https://api.trakt.tv/users";


/* -------------------------------------------------- */
/* FETCH TRAKT HISTORY */
/* -------------------------------------------------- */

async function fetchHistory(username) {

  const url = `${TRAKT_API}/${username}/history?limit=100`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key": TRAKT_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Trakt error: ${response.status}`);
  }

  return response.json();
}


/* -------------------------------------------------- */
/* FETCH TMDB IMAGE */
/* -------------------------------------------------- */

async function fetchTMDB(tmdbId, type) {

  try {

    if (!tmdbId) return null;

    const url =
      `https://api.themoviedb.org/3/${type}/${tmdbId}` +
      `?api_key=${TMDB_KEY}&append_to_response=images`;

    const response = await fetch(url);
    const data = await response.json();

    const backdrop = data.images?.backdrops?.[0]?.file_path;
    if (!backdrop) return null;

    return `https://image.tmdb.org/t/p/w300${backdrop}`;

  } catch {
    return null;
  }

}


/* -------------------------------------------------- */
/* RENDER PANEL */
/* -------------------------------------------------- */

function renderWatched(items, elementID) {

  const element = document.getElementById(elementID);
  if (!element) return;

  element.innerHTML = "";

  const frag = document.createDocumentFragment();

  items.forEach(item => {

    if (!item.image) return;

    const url =
      item.type === "tv"
        ? `https://trakt.tv/shows/${item.slug}`
        : `https://trakt.tv/movies/${item.slug}`;

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer noopener";

    const img = document.createElement("img");
    img.src = item.image;
    img.title = `${item.title} (${item.year})`;
    img.alt = `${item.title} (${item.year})`;
    img.loading = "lazy";
    img.decoding = "async";

    link.appendChild(img);
    frag.appendChild(link);

  });

  element.appendChild(frag);

}


/* -------------------------------------------------- */
/* MAIN LOADER */
/* -------------------------------------------------- */

async function loadWatched(username, limit, elementID) {

  if (!document.getElementById(elementID)) return;

  const cacheKey = `trakt-${username}-${limit}`;

  /* -----------------------------------------
     Check session cache first
     If cached, render immediately
  ----------------------------------------- */

  const TTL = (window.CONFIG?.cacheTTLMinutes ?? 60) * 60 * 1000;
  const raw = localStorage.getItem(cacheKey);
  if (raw) {
    try {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts <= TTL) { renderWatched(data, elementID); return; }
    } catch {}
    localStorage.removeItem(cacheKey);
  }

  try {

    const history = await fetchHistory(username);

    const items = [];
    let lastId = null;

    /* -----------------------------------------
       Extract unique titles from watch history
       (skip consecutive duplicates)
    ----------------------------------------- */

    for (const entry of history) {

      let id, title, year, slug, tmdb, type;

      if (entry.movie) {

        id = `movie-${entry.movie.ids.trakt}`;
        title = entry.movie.title;
        year = entry.movie.year;
        slug = entry.movie.ids.slug;
        tmdb = entry.movie.ids.tmdb;
        type = "movie";

      }

      if (entry.show) {

        id = `show-${entry.show.ids.trakt}`;
        title = entry.show.title;
        year = entry.show.year;
        slug = entry.show.ids.slug;
        tmdb = entry.show.ids.tmdb;
        type = "tv";

      }

      if (!id) continue;

      /* skip if same as previous item */

      if (id === lastId) continue;

      lastId = id;

      items.push({
        title,
        year,
        slug,
        tmdb,
        type
      });

      if (items.length >= limit) break;

    }

    /* -----------------------------------------
       Fetch images from TMDB
    ----------------------------------------- */

    const images = await Promise.all(
      items.map(item => fetchTMDB(item.tmdb, item.type))
    );

    const result = items.map((item, i) => ({
      ...item,
      image: images[i]
    }));


    /* -----------------------------------------
       Save to session cache
    ----------------------------------------- */

    localStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() }));


    /* -----------------------------------------
       Render panel
    ----------------------------------------- */

    renderWatched(result, elementID);

  }

  catch (err) {

    console.error("Trakt widget failed:", err);
    const el = document.getElementById(elementID);
    if (el) el.innerHTML = '<span class="api-error">$ api is not aping 🐒</span>';

  }

}


/* -------------------------------------------------- */
/* RUN */
/* -------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  loadWatched("hteza", 10, "last-watched");
});
