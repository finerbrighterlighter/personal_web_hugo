/**
 * Unsplash Latest Photos Panel
 * Fetches recent photos and caches them in sessionStorage
 * so navigation between pages does not trigger another API call.
 */

const UNSPLASH_URL = "https://api.unsplash.com";


/* -------------------------------------------------- */
/* RENDER PANEL */
/* -------------------------------------------------- */

function renderUnsplash(photos, elementID) {

  const element = document.getElementById(elementID);
  if (!element) return;

  element.innerHTML = "";

  const frag = document.createDocumentFragment();

  photos.forEach(photo => {

    const link = document.createElement("a");
    link.href = photo.url;
    link.target = "_blank";
    link.rel = "noreferrer noopener";

    const img = document.createElement("img");
    img.src = photo.image;
    img.title = photo.date;
    img.alt = photo.date;
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

async function getUnsplash(username, accessKey, limit, elementID) {

  if (!document.getElementById(elementID)) return;

  const cacheKey = `unsplash-${username}-${limit}`;

  /* -----------------------------------------
     Check session cache first
  ----------------------------------------- */

  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {

    renderUnsplash(JSON.parse(cached), elementID);
    return;

  }

  try {

    const response = await fetch(
      `${UNSPLASH_URL}/users/${username}/photos?per_page=${limit}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash error: ${response.status}`);
    }

    const data = await response.json();

    /* -----------------------------------------
       Extract only the data we actually need
    ----------------------------------------- */

    const photos = data.slice(0, limit).map(photo => ({

      url: photo.links.html,
      image: photo.urls.thumb,
      date: photo.created_at.split("T")[0]

    }));


    /* -----------------------------------------
       Save to session cache
    ----------------------------------------- */

    sessionStorage.setItem(cacheKey, JSON.stringify(photos));


    /* -----------------------------------------
       Render panel
    ----------------------------------------- */

    renderUnsplash(photos, elementID);

  }

  catch (err) {

    console.error("Unsplash widget failed:", err);
    const el = document.getElementById(elementID);
    if (el) el.innerHTML = '<span class="api-error">$ api is not aping 🐒</span>';

  }

}


/* -------------------------------------------------- */
/* RUN */
/* -------------------------------------------------- */

getUnsplash(
  "finerbrighterlighter",
  CONFIG.unsplash,
  10,
  "latestimage"
);
