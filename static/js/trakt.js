const TRAKT_KEY = CONFIG.trakt;
const TMDB_KEY = CONFIG.tmdb;

const TRAKT_API = "https://api.trakt.tv/users";

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

async function loadWatched(username, limit, elementID) {

  try {

    const history = await fetchHistory(username);

    const items = [];
    let lastId = null;

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

      /* skip only if the previous item is the same title */
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

    const element = document.getElementById(elementID);
    if (!element) return;

    element.innerHTML = "";

    const frag = document.createDocumentFragment();

    const images = await Promise.all(
      items.map(item => fetchTMDB(item.tmdb, item.type))
    );

    items.forEach((item, i) => {

      const image = images[i];
      if (!image) return;

      const url =
        item.type === "tv"
          ? `https://trakt.tv/shows/${item.slug}`
          : `https://trakt.tv/movies/${item.slug}`;

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer noopener";

      const img = document.createElement("img");
      img.src = image;
      img.title = `${item.title} (${item.year})`;
      img.alt = `${item.title} (${item.year})`;
      img.loading = "lazy";
      img.decoding = "async";

      link.appendChild(img);
      frag.appendChild(link);

    });

    element.appendChild(frag);

  } catch (err) {
    console.error("Trakt widget failed:", err);
  }
}

loadWatched("hteza", 10, "last-watched");
