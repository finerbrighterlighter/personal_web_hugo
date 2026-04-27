# 🧪 Personal Website (Beta Build)

[![Netlify Status](https://api.netlify.com/api/v1/badges/ca043d57-11d9-487c-9e6f-dae968d5ccc7/deploy-status)](https://app.netlify.com/projects/hugoteza/deploys)

This is the beta build of my personal website — a simple site built with [Hugo](https://gohugo.io), deployed via [Netlify](https://www.netlify.com/). The custom domain is managed through [Porkbun](https://porkbun.com).

This project is an ongoing experiment in building a small, modular personal site. The goal is to keep things simple: static pages, lightweight JavaScript panels, and a terminal-style interface.

The codebase is still evolving. Some parts are experimental, some are inelegant, and some are probably unnecessary — but the site works, and that’s a good start.

Previous version was built using Jekyll and can be found [here](https://github.com/finerbrighterlighter/finerbrighterlighter.github.io).

---

## ⚙️ Stack

* **Static site generator:** [Hugo](https://gohugo.io)
* **Hosting / CI deployment:** [Netlify](https://www.netlify.com/)
* **Domain registrar:** [Porkbun](https://porkbun.com)

---

## 🎨 Theme & Credits

The visual style is based on the **Hugo Console Theme**, which provides the terminal-inspired interface.

Additional layout and UI components were customized for this site.

---

## 🧩 Right-Column Panels

The right column of the layout is made up of collapsible terminal-style windows, each representing a live data source or site utility. All panels share the same visual style: a title bar with macOS-style window controls, and content displayed as terminal output.

| Panel (window title) | Template | Source |
|---|---|---|
| `publications.sh` | `panel-openalex.html` | [OpenAlex](https://openalex.org/) API — citation count, h-index, i10-index |
| `topics.sh` | `panel-research.html` | Hugo build-time — tag cloud from works front matter |
| `music.sh` | `panel-lastfm.html` | [Last.fm](https://www.last.fm/) API — recent scrobbles and curated playlists (`data/playlists.yml`) |
| `manga.sh` | `panel-anilist.html` | [AniList](https://anilist.co/) API — recently read manga |
| `screen.sh` | `panel-trakt.html` | [Trakt](https://trakt.tv/) + [TMDB](https://www.themoviedb.org/) APIs — recently watched TV and film |
| `photos.sh` | `panel-unsplash.html` | [Unsplash](https://unsplash.com/) API — latest uploaded photos |
| `privacy.sh` | `panel-privacy.html` | Static — analytics disclosure ([GoatCounter](https://www.goatcounter.com/)) and cache flush button |

### Caching

All API panels cache their responses in `localStorage` with a configurable TTL (default 60 minutes, set via `cacheTTLMinutes` in `hugo.toml`). This avoids hitting rate limits on every page load and keeps the site fast. The privacy panel exposes a manual flush button to clear all cached responses.

### API Keys

Keys are injected at Netlify build time as environment variables and templated into `assets/js/config.js`:

```
HUGO_UNSPLASH_KEY
HUGO_TRAKT_KEY
HUGO_TMDB_KEY
HUGO_LASTFM_KEY
```

For local development, export these before running `hugo server`.

### Topics panel

The `topics.sh` panel is the exception — it has no API. At build time, Hugo collects all `conditions`, `methods`, and `datasource` tags from the works pages and injects them as a JSON array into the page. The client-side `research.js` script counts frequencies, scales font size and opacity, and renders a word cloud. Tag limit is configurable via `researchTagLimit` in `hugo.toml`. Clicking a tag opens the works page with that tag pre-filled in the search box.

---

## 📂 Repository Structure (Simplified)

```
content/     → pages, posts, publications
layouts/     → Hugo templates
partials/    → reusable UI components
static/      → static assets (docs, images, JS)
data/        → YAML data sources for the site
assets/      → site configuration and scripts
```

The site is compiled by Hugo into the `public/` directory during deployment.

---

## 📄 CV Generation

The downloadable CV is auto-generated from site data using a Python script (`scripts/build_cv.py`). It pulls personal data from `data/cv.yml` and publications/conferences directly from the Hugo works pages, so adding a new publication to the site automatically includes it in the next CV build.

Output is written to `static/general/cv/`. Run after any relevant data change:

```bash
conda run -n hugo python scripts/build_cv.py
```

Requires the `hugo` conda environment with `weasyprint` and `pyyaml`. See the script header for setup instructions.

---

## 🤖 LLM Discoverability

An [`/llms.txt`](https://llmstxt.org/) file is served at the site root to help AI agents navigate content. It is generated automatically at build time by Hugo's custom output format — no manual maintenance required. When a new publication is added, it appears in `llms.txt` on the next build.

The file includes:
- Links to all publications (DOI or mirror, not the internal Hugo page)
- Links to recent posts
- Links to key pages (About, CV, Works)

A pointer is included in `robots.txt` under `LLMs:`.

---

## 🚧 Status

This is a **work in progress** and still under active development.

Things will break.
Layouts will change.
Panels may appear and disappear.

But the site is live, which is always the most important milestone.

---
