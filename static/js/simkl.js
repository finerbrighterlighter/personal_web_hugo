/**
 * simkl.js — screen.sh panel: recently watched movies, shows and anime (Simkl).
 *
 * The data is fetched at build time by panel-simkl.html (the Simkl token never
 * reaches the browser) and shipped as a JSON blob of ready-to-render items:
 * { fetchedAt, items: [{ href, img, label, stamp }] } — or { error: true }
 * when the build-side fetch failed. This module only renders, but it keeps
 * the strip in the same localStorage lifecycle as the other panels:
 *
 *   1. cached copy from an earlier visit (cache.js, site-wide TTL, cleared by
 *      the privacy.sh flush) — used unless the page carries a newer build
 *   2. baked blob → rendered and written to the cache
 *
 * Markup mirrors anilist.js: <a><img><span class="screen-stamp">S05E06</span></a>.
 */
import { getCache, setCache } from "./cache.js";

const STRIP_ID = "last-watched";
const DATA_ID  = "simkl-data";

function readBlob() {
  const el = document.getElementById(DATA_ID);
  if (!el) return null;
  try { return JSON.parse(el.textContent); } catch { return null; }
}

function renderStrip(payload, element) {
  element.innerHTML = "";
  if (!payload || payload.error) {
    element.innerHTML = '<span class="api-error">$ api is not aping 🐒</span>';
    return;
  }
  if (!payload.items?.length) {
    element.innerHTML = '<span class="api-error">$ no recent activity</span>';
    return;
  }

  const frag = document.createDocumentFragment();
  for (const item of payload.items) {
    const link = document.createElement("a");
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noreferrer noopener";

    const img = document.createElement("img");
    img.src = item.img;
    img.width = 64;
    img.height = 64;
    img.title = item.label;
    img.alt = item.label;
    img.loading = "lazy";
    img.decoding = "async";
    link.appendChild(img);

    if (item.stamp) {
      const stamp = document.createElement("span");
      stamp.className = "screen-stamp";
      stamp.textContent = item.stamp;
      link.appendChild(stamp);
    }
    frag.appendChild(link);
  }
  element.appendChild(frag);
}

function loadScreen() {
  const element = document.getElementById(STRIP_ID);
  if (!element) return;

  const baked = readBlob();
  const limit = baked?.items?.length ?? 0;
  const cacheKey = `simkl-recent-${limit}`;

  const cached = getCache(cacheKey);
  const bakedIsNewer = baked?.fetchedAt && (!cached?.fetchedAt || baked.fetchedAt > cached.fetchedAt);

  if (cached && !bakedIsNewer) {
    renderStrip(cached, element);
    return;
  }

  renderStrip(baked, element);
  if (baked && !baked.error) setCache(cacheKey, baked);
}

loadScreen();
