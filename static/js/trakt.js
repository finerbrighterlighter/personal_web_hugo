const TRAKT_KEY = CONFIG.trakt;
const TMDB_KEY = CONFIG.tmdb;

const TRAKT_API = "https://api.trakt.tv/users";

async function fetchTrakt(username, type) {
  const url = `${TRAKT_API}/${username}/watched/${type}`;

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

    const [shows, movies] = await Promise.all([
      fetchTrakt(username, "shows"),
      fetchTrakt(username, "movies")
    ]);

    const items = [...shows, ...movies]
      .sort((a, b) =>
        new Date(b.last_watched_at) - new Date(a.last_watched_at)
      )
      .slice(0, limit);

    const element = document.getElementById(elementID);
    element.innerHTML = "";

    const frag = document.createDocumentFragment();

    const images = await Promise.all(
      items.map(item => {

        if (item.show) {
          return fetchTMDB(item.show.ids.tmdb, "tv");
        }

        if (item.movie) {
          return fetchTMDB(item.movie.ids.tmdb, "movie");
        }

        return null;
      })
    );

    items.forEach((item, i) => {

      const image = images[i];
      if (!image) return;

      let title, year, url;

      if (item.show) {
        title = item.show.title;
        year = item.show.year;
        url = `https://trakt.tv/shows/${item.show.ids.slug}`;
      }

      if (item.movie) {
        title = item.movie.title;
        year = item.movie.year;
        url = `https://trakt.tv/movies/${item.movie.ids.slug}`;
      }

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer noopener";

      const img = document.createElement("img");
      img.src = image;
      img.title = `${title} (${year})`;
      img.alt = `${title} (${year})`;
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