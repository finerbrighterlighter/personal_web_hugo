/**
 * anilist.js — otaku.sh panel: recently updated manga + recently updated anime.
 *
 * "Recent" means the user's list entries sorted by UPDATED_TIME_DESC across
 * every status except PLANNING (watching/reading, completed, dropped, paused,
 * rewatching), capped at ANILIST_LIMIT per strip — so a show that was just
 * finished or dropped still appears. One GraphQL request (two aliased Page
 * fields) feeds both strips; cached under a single key via cache.js. Covers
 * render as links with a list-status stamp (`.otaku-stamp`: WATCHING, DONE,
 * DROPPED …); the hover title is "Romaji (English) · ep 7/24" — no status
 * (already on the stamp) and no country of origin (almost always JP).
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

/* Stamp label per AniList MediaListStatus, per media type — max 8 chars so it fits the 52px stamp. */
const STATUS_LABEL = {
  manga: { CURRENT: "reading",  REPEATING: "reread",  COMPLETED: "done", DROPPED: "dropped", PAUSED: "paused" },
  anime: { CURRENT: "watching", REPEATING: "rewatch", COMPLETED: "done", DROPPED: "dropped", PAUSED: "paused" },
};
const PROGRESS_UNIT = { manga: "ch", anime: "ep" };

const QUERY = `
query ($name: String, $perPage: Int) {
  manga: Page(perPage: $perPage) {
    mediaList(userName: $name, type: MANGA, status_not: PLANNING, sort: UPDATED_TIME_DESC) {
      status
      progress
      media { ...cover chapters }
    }
  }
  anime: Page(perPage: $perPage) {
    mediaList(userName: $name, type: ANIME, status_not: PLANNING, sort: UPDATED_TIME_DESC) {
      status
      progress
      media { ...cover episodes }
    }
  }
}
fragment cover on Media {
  siteUrl
  synonyms
  coverImage { medium }
  title { romaji english }
}`;

async function loadOtaku(username, limit) {
  const elements = Object.fromEntries(
    Object.keys(STRIPS).map(id => [id, document.getElementById(id)])
  );
  if (!Object.values(elements).some(Boolean)) return;

  const cacheKey = `anilist-${username}-recent-${limit}`;
  const cached = getCache(cacheKey);
  if (cached) { renderAll(cached, elements, limit); return; }

  try {
    const response = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { name: username, perPage: limit } }),
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
    if (el) renderStrip(data.data?.[key]?.mediaList, el, limit, key);
  }
}

function renderStrip(entries, element, limit, key) {
  element.innerHTML = "";
  if (!entries?.length) {
    element.innerHTML = '<span class="api-error">$ no recent activity</span>';
    return;
  }

  const frag = document.createDocumentFragment();

  for (const entry of entries.slice(0, limit)) {
    const work = entry.media;

    const romaji  = work.title.romaji || "";
    const english = work.title.english;
    const synonym = work.synonyms?.[0];
    const status  = STATUS_LABEL[key]?.[entry.status] || entry.status?.toLowerCase() || "";
    const total   = key === "anime" ? work.episodes : work.chapters;
    const progress = entry.progress
      ? `${PROGRESS_UNIT[key]} ${entry.progress}${total ? `/${total}` : ""}`
      : "";

    /* Hover/alt text: "Romaji (English) · ep 7/24". Status is on the stamp; origin is omitted. */
    const alt = english || synonym;
    let title = romaji;
    if (alt && alt.toLowerCase() !== romaji.toLowerCase()) title += ` (${alt})`;
    if (progress) title += ` · ${progress}`;

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

    const stamp = document.createElement("span");
    stamp.className = "otaku-stamp";
    stamp.textContent = status.toUpperCase();

    link.appendChild(img);
    if (status) link.appendChild(stamp);
    frag.appendChild(link);
  }

  element.appendChild(frag);
}

loadOtaku(ANILIST_USER, ANILIST_LIMIT);
