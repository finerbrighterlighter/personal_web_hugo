import { getCache, setCache } from "./cache.js";

const ANILIST_URL = "https://graphql.anilist.co";
const ANILIST_USER = "finer";    // AniList username
const ANILIST_LIMIT = 10;        // number of manga covers shown in the panel

async function getLastRead(username, media, limit, elementID) {

  const query = `
  query ($name: String, $type: MediaType) {
    MediaListCollection(
      userName: $name
      type: $type
      status: CURRENT
      sort: UPDATED_TIME_DESC
    ) {
      lists {
        entries {
          media {
            siteUrl
            countryOfOrigin
            synonyms
            coverImage { medium }
            title {
              romaji
              english
            }
          }
        }
      }
    }
  }`;

  const variables = {
    name: username,
    type: media
  };

  const element = document.getElementById(elementID);

  /*
  ------------------------------------------------------
  Build a unique cache key for this request
  Example:
  anilist-finer-MANGA-10
  ------------------------------------------------------
  */
  const cacheKey = `anilist-${username}-${media}-${limit}`;

  /*
  ------------------------------------------------------
  Try session cache first
  If data exists, render immediately and skip fetch
  ------------------------------------------------------
  */
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    renderAniList(cachedData, element, limit);
    return;
  }

  try {

    const response = await fetch(ANILIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const data = await response.json();

    // save to session cache
    setCache(cacheKey, data);

    renderAniList(data, element, limit);

  } catch (err) {
    console.error("AniList request failed:", err);
    if (element) element.innerHTML = '<span class="api-error">$ api is not aping 🐒</span>';
  }
}


/*
------------------------------------------------------
Rendering extracted to a separate function
So cached and fetched data use the same renderer
------------------------------------------------------
*/
function renderAniList(data, element, limit) {

  element.innerHTML = "";

  const lists = data.data?.MediaListCollection?.lists;
  if (!lists?.length) return;

  const entries = lists[0].entries;

  const frag = document.createDocumentFragment();

  for (let i = 0; i < Math.min(limit, entries.length); i++) {

    const work = entries[i].media;

    const romaji = work.title.romaji || "";
    const english = work.title.english;
    const synonym = work.synonyms?.[0];
    const lang = work.countryOfOrigin || "";

    let title = romaji;

    if (english) title += ` (${english}, ${lang})`;
    else if (synonym) title += ` (${synonym}, ${lang})`;
    else title += ` (${lang})`;

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

getLastRead(ANILIST_USER, "MANGA", ANILIST_LIMIT, "last-read-manga");
