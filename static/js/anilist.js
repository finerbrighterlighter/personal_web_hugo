const ANILIST_URL = "https://graphql.anilist.co";

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

    const element = document.getElementById(elementID);
    element.innerHTML = "";

    const entries =
      data.data.MediaListCollection.lists[0].entries;

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
      img.title = title.replace(/'/g, "");
      img.alt = title.replace(/'/g, "");
      img.loading = "lazy";
      img.decoding = "async";

      link.appendChild(img);
      frag.appendChild(link);
    }

    element.appendChild(frag);

  } catch (err) {
    console.error("AniList request failed:", err);
  }
}

getLastRead("finer", "MANGA", 10, "last-read-manga");