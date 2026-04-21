import { getCache, setCache } from "./cache.js";

const LASTFM_USER = "fibrili";
const LASTFM_API = CONFIG.lastfm;

async function lastFM_request(method, limit, elementID) {

  const url =
    `https://ws.audioscrobbler.com/2.0/?method=${method}` +
    `&user=${LASTFM_USER}` +
    `&api_key=${LASTFM_API}` +
    `&limit=${limit}` +
    `&period=1month&format=json`;

  const element = document.getElementById(elementID);

  // Unique key for this request
  const cacheKey = `lastfm-${method}-${limit}`;

  /*
  --------------------------------------------------------
  Try cache first
  We only cache stable data (top albums).
  Recent track changes frequently so we skip caching it.
  --------------------------------------------------------
  */
  if (method !== "user.getrecenttracks") {
    const cachedData = getCache(cacheKey);

    if (cachedData) {
      renderTopAlbums(cachedData, element, limit);
      return;
    }
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (method === "user.getrecenttracks") {
      renderRecentTrack(data, element);
    }

    if (method === "user.gettopalbums") {
      setCache(cacheKey, data); // save for this tab session
      renderTopAlbums(data, element, limit);
    }

  } catch (err) {
    console.error("LastFM request failed:", err);
    if (element) element.innerHTML = '<span class="api-error">$ api is not aping 🐒</span>';
  }
}

function renderRecentTrack(data, element) {
  const track = data.recenttracks.track[0];

  const isNowPlaying = !!track["@attr"]?.nowplaying;
  const label     = isNowPlaying ? "[now]" : "[last]";
  const titleAttr = isNowPlaying ? "Rare moment! You caught this live — I’m listening right now" : "";

  const artist = track.artist["#text"];
  const song = track.name;
  const songURL = track.url;

  const icon = document.createElement("span");
  icon.className = "footer-icon";
  icon.textContent = label;
  if (titleAttr) icon.title = titleAttr;

  const marquee = document.createElement("div");
  marquee.className = "scrobble-marquee";

  const link = document.createElement("a");
  link.href = songURL;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.textContent = `${artist} - ${song}`;

  marquee.appendChild(link);

  element.textContent = "";
  element.appendChild(icon);
  element.appendChild(marquee);
}

function renderTopAlbums(data, element, limit) {
  const albums = data.topalbums?.album;
  if (!albums?.length) return;

  element.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const album of albums) {
    const imageUrl = album.image?.[1]?.["#text"];
    if (!imageUrl) continue;

    const artist = album.artist.name;
    const name = album.name;

    const link = document.createElement("a");
    link.href = album.url;
    link.target = "_blank";
    link.rel = "noreferrer noopener";

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = `${artist} - ${name}`;
    img.title = `${artist} - ${name} - ${album.playcount} plays`;
    img.loading = "lazy";
    img.decoding = "async";

    link.appendChild(img);
    frag.appendChild(link);
  }

  element.appendChild(frag);
}

lastFM_request("user.getrecenttracks", 1, "lasttrack");
lastFM_request("user.gettopalbums", 10, "topalbums");

function updateRecentTrack() {
  lastFM_request("user.getrecenttracks", 1, "lasttrack");
}

setInterval(updateRecentTrack, 30000);
