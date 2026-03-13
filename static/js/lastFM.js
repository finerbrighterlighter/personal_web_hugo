const LASTFM_USER = "fibrili";
const LASTFM_API = CONFIG.lastfm;

/*
--------------------------------------------------------
Session cache helper
Stores API responses in sessionStorage so they persist
while the browser tab is open but disappear afterwards.
--------------------------------------------------------
*/
function getCache(key) {
  const cached = sessionStorage.getItem(key);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

function setCache(key, data) {
  sessionStorage.setItem(key, JSON.stringify(data));
}

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
  }
}

function renderRecentTrack(data, element) {
  const track = data.recenttracks.track[0];

  const isNowPlaying = !!track["@attr"]?.nowplaying;
  const icon = isNowPlaying ? "🔊" : "🔈";
  const statusText = isNowPlaying ? "now listening:" : "last played:";

  const artist = track.artist["#text"].replace(/'/g, '"');
  const song = track.name.replace(/'/g, '"');
  const songURL = track.url;

  element.innerHTML = `
    <span class="footer-icon">${icon}</span>
    <div class="scrobble-marquee">
      <a href="https://www.last.fm/user/${LASTFM_USER}/library" target="_blank" rel="noreferrer noopener">
        ${statusText}
      </a>
      &nbsp;
      <a href="${songURL}" target="_blank" rel="noreferrer noopener">
        ${artist} - ${song}
      </a>
    </div>
  `;
}

function renderTopAlbums(data, element, limit) {
  element.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (let i = 0; i < limit; i++) {
    const album = data.topalbums.album[i];
    const imageUrl = album.image?.[1]?.["#text"];
    if (!imageUrl) continue;

    const artist = album.artist.name.replace(/'/g, '"');
    const name = album.name.replace(/'/g, '"');

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
