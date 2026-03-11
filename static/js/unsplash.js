const UNSPLASH_URL = "https://api.unsplash.com";

async function getUnsplash(username, accessKey, limit, elementID) {

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

    const element = document.getElementById(elementID);
    element.innerHTML = "";

    const frag = document.createDocumentFragment();

    data.slice(0, limit).forEach(photo => {

      const url = photo.links.html;
      const image = photo.urls.thumb;
      const date = photo.created_at.split("T")[0];

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer noopener";

      const img = document.createElement("img");
      img.src = image;
      img.title = date;
      img.alt = date;
      img.loading = "lazy";
      img.decoding = "async";

      link.appendChild(img);
      frag.appendChild(link);

    });

    element.appendChild(frag);

  } catch (err) {
    console.error("Unsplash widget failed:", err);
  }

}

getUnsplash(
  "finerbrighterlighter",
  CONFIG.unsplash,
  10,
  "latestimage"
);