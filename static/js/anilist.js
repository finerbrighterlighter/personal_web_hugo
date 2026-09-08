/**
 * anilist.js — otaku.sh panel: currently watching anime + currently reading manga.
 *
 * One GraphQL request (two aliased MediaListCollection fields) feeds both
 * strips; cached under a single key via cache.js. Covers render as links
 * with a country-of-origin stamp (`.manga-origin`, shared by both strips).
 */
import { getCache, setCache } from "./cache.js";

const ANILIST_URL  = "https://graphql.anilist.co";
const ANILIST_USER = "finer";    // AniList username
const ANILIST_LIMIT = 10;        // covers shown per strip

/* Strip id → media type. Order here does not matter; the partial fixes the layout. */
const STRIPS = {
  "last-read-manga":    "manga",
  "last-watched-anime": "anime",
};

const QUERY = `
query ($name: String) {
  manga: MediaListCollection(userName: $name, type: MANGA, status: CURRENT, sort: UPDATED_TIME_DESC) {
    lists { entries { media { ...cover } } }
  }
  anime: MediaListCollection(userName: $name, type: ANIME, status: CURRENT, sort: UPDATED_TIME_DESC) {
    lists { entries { media { ...cover } } }
  }
}
fragment cover on Media {
  siteUrl
  countryOfOrigin
  synonyms
  coverImage { medium }
  title { romaji english }
}`;

async function loadOtaku(username, limit) {
  const elements = Object.fromEntries(
    Object.keys(STRIPS).map(id => [id, document.getElementById(id)])
  );
  if (!Object.values(elements).some(Boolean)) return;

  const cacheKey = `anilist-${username}-current-${limit}`;
  const cached = getCache(cacheKey);
  if (cached) { renderAll(cached, elements, limit); return; }

  try {
    const response = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { name: username } }),
    });
    if (!response.ok) throw new Error(`AniList ${response.status}`);
    const data = await response.json();
    if (data.errors?.length) throw new Error(data.errors[0].message);
    setCache(cacheKey, data);
    renderAll(data, elements, limit);
  } catch (err) {
    console.error("AniList request failed:", err);
    for (const el of Object.values(elements)) {
      if (el) el.innerHTML = '<span class="api-error">$ api is not aping 🐒</span>';
    }
  }
}

function renderAll(data, elements, limit) {
  for (const [id, key] of Object.entries(STRIPS)) {
    const el = elements[id];
    if (el) renderStrip(data.data?.[key], el, limit);
  }
}

/* Flatten every list of the collection (AniList may split by custom list). */
function renderStrip(collection, element, limit) {
  element.innerHTML = "";
  const entries = (collection?.lists ?? []).flatMap(l => l.entries ?? []);
  if (!entries.length) {
    element.innerHTML = '<span class="api-error">$ nothing in progress</span>';
    return;
  }

  const frag = document.createDocumentFragment();

  for (const entry of entries.slice(0, limit)) {
    const work = entry.media;

    const romaji  = work.title.romaji || "";
    const english = work.title.english;
    const synonym = work.synonyms?.[0];
    const lang    = work.countryOfOrigin || "";

    let title = romaji;
    if (english)      title += ` (${english}, ${lang})`;
    else if (synonym) title += ` (${synonym}, ${lang})`;
    else              title += ` (${lang})`;

    const link = document.createElement("a");
    link.href = work.siteUrl;
    link.target = "_blank";
    link.rel = "noreferrer noopener";

    const img = document.createElement("img");
    img.src = work.coverImage.medium;
    img.title = title;
    img.alt = title;
    img.loading = "lazy";
    img.decoding = "async";

    const originLabel = document.createElement("span");
    originLabel.className = "manga-origin";
    originLabel.textContent = lang.toUpperCase();

    link.appendChild(img);
    if (lang) link.appendChild(originLabel);
    frag.appendChild(link);
  }

  element.appendChild(frag);
}

loadOtaku(ANILIST_USER, ANILIST_LIMIT);
