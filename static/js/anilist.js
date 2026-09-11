/**
 * anilist.js — manga.sh panel: recently updated manga (AniList).
 *
 * "Recent" means the user's list entries sorted by UPDATED_TIME_DESC across
 * every status except PLANNING (reading, completed, dropped, paused,
 * rereading), capped at ANILIST_LIMIT — so a title that was just finished or
 * dropped still appears. Covers render as links with a progress stamp
 * (`.otaku-stamp`: `CH 123`); the hover title is
 * "Romaji (English) · reading · ch 123/200" — status and totals live there
 * since the stamp now carries progress. Country of origin is omitted
 * (almost always JP).
 *
 * The anime strip (#last-watched-anime, `E7` stamps) was retired 2026-09 when
 * screen.sh (Simkl, build-time) took over anime alongside movies and shows.
 * Its query alias and strip mapping are kept commented out below so the
 * panel can grow back to otaku.sh without re-deriving them.
 */
import { getCache, setCache } from "./cache.js";

const ANILIST_URL  = "https://graphql.anilist.co";
const ANILIST_USER = "finer";    // AniList username
const ANILIST_LIMIT = 10;        // covers shown per strip

/* Strip id → media type. Order here does not matter; the partial fixes the layout. */
const STRIPS = {
  "last-read-manga":    "manga",
  // "last-watched-anime": "anime",   // retired 2026-09 — anime now in screen.sh (Simkl)
};

/* Hover status label per AniList MediaListStatus, per media type. */
const STATUS_LABEL = {
  manga: { CURRENT: "reading",  REPEATING: "reread",  COMPLETED: "done", DROPPED: "dropped", PAUSED: "paused" },
  anime: { CURRENT: "watching", REPEATING: "rewatch", COMPLETED: "done", DROPPED: "dropped", PAUSED: "paused" },
};
const PROGRESS_UNIT = { manga: "ch", anime: "ep" };

/* Stamp text per media type — max 8 chars so it fits the 52px stamp.
   AniList has no season numbers, so anime would read `E7`, matching Simkl's anime format in screen.sh. */
function stampText(key, progress) {
  if (!progress) return "";
  return key === "manga" ? `CH ${progress}` : `E${progress}`;
}

/* Fold case, the × sign, accents, spaces and punctuation so near-identical titles compare equal. */
function normalizeTitle(s) {
  return s
    .toLowerCase()
    .replace(/×/g, "x")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/* One request; the anime alias is retired (see header) — restore it together with the STRIPS entry:
     anime: Page(perPage: $perPage) {
       mediaList(userName: $name, type: ANIME, status_not: PLANNING, sort: UPDATED_TIME_DESC) {
         status
         progress
         media { ...cover episodes }
       }
     }
*/
const QUERY = `
query ($name: String, $perPage: Int) {
  manga: Page(perPage: $perPage) {
    mediaList(userName: $name, type: MANGA, status_not: PLANNING, sort: UPDATED_TIME_DESC) {
      status
      progress
      media { ...cover chapters }
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

  /* Cache key carries the strip set so a stale otaku.sh payload is not reused for manga.sh. */
  const cacheKey = `anilist-${username}-recent-${limit}-${Object.values(STRIPS).join("+")}`;
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

    /* Hover/alt text: "Romaji (English) · reading · ch 7/24". Progress is on the stamp; origin is omitted.
       The English title is shown only when it differs beyond case, spacing and
       punctuation (so "SPY×FAMILY" vs "SPY x FAMILY" counts as the same title). */
    const alt = english || synonym;
    let title = romaji;
    if (alt && normalizeTitle(alt) !== normalizeTitle(romaji)) title += ` (${alt})`;
    if (status)   title += ` · ${status}`;
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

    const stampLabel = stampText(key, entry.progress);
    const stamp = document.createElement("span");
    stamp.className = "otaku-stamp";
    stamp.textContent = stampLabel;

    link.appendChild(img);
    if (stampLabel) link.appendChild(stamp);
    frag.appendChild(link);
  }

  element.appendChild(frag);
}

loadOtaku(ANILIST_USER, ANILIST_LIMIT);
