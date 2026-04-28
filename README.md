# htunteza.com

[![Netlify Status](https://api.netlify.com/api/v1/badges/ca043d57-11d9-487c-9e6f-dae968d5ccc7/deploy-status)](https://app.netlify.com/projects/hugoteza/deploys)

Personal website for [Htun Teza](https://htunteza.com) — a terminal-aesthetic static site built with Hugo, deployed via Netlify.

Previous version was built with Jekyll: [finerbrighterlighter.github.io](https://github.com/finerbrighterlighter/finerbrighterlighter.github.io).

---

## Stack

- **Generator:** [Hugo](https://gohugo.io) (Go-based static site generator)
- **Hosting:** [Netlify](https://www.netlify.com) (CI/CD on push to main)
- **Domain:** [Porkbun](https://porkbun.com) -> htunteza.com
- **Analytics:** [GoatCounter](https://www.goatcounter.com) (stats.htunteza.com)
- **Theme base:** [hugo-theme-console (terminal aesthetic)](https://github.com/mrmierzejewski/hugo-theme-console/)

---

## Layout

Three-column layout defined in `layouts/_default/baseof.html`:

- **Left** — `sidebar-content.html`: avatar, contact links, education. Data from `data/homepage.yml`.
- **Main** — page-specific templates, content routed by section.
- **Right** — `panel-*.html` partials: collapsible terminal windows pulling live data.

---

## Content Sections

| URL | Template | Notes |
|---|---|---|
| `/` | `layouts/index.html` | Career profile from `data/homepage.yml` |
| `/works/` | `layouts/_default/works.html` | Academic publications, client-side filter by condition/method/datasource/year |
| `/posts/` | `layouts/_default/list.html` | Blog posts grouped by year; supports `private: true` front matter |
| `/blood/` | `layouts/_default/blood.html` | Personal blood test records; data from `data/blood.yml` |
| `/about/` | `layouts/_default/single.html` | Standard page |

---

## Right Panels

| Window title | Template | Source |
|---|---|---|
| `publications.sh` | `panel-openalex.html` | OpenAlex API — citation count, h-index, i10-index |
| `topics.sh` | `panel-research.html` | Build-time tag cloud from works front matter; limit via `researchTagLimit` in `hugo.toml` |
| `music.sh` | `panel-lastfm.html` | Last.fm API + `data/playlists.yml` |
| `manga.sh` | `panel-anilist.html` | AniList API — recently read manga |
| `screen.sh` | `panel-trakt.html` | Trakt + TMDB APIs — recently watched |
| `photos.sh` | `panel-unsplash.html` | Unsplash API — latest uploads |
| `privacy.sh` | `panel-privacy.html` | GoatCounter disclosure + manual cache flush |

All API panels cache responses in `localStorage`. TTL is configurable via `cacheTTLMinutes` in `hugo.toml` (default: 60 minutes).

---

## API Keys

Injected at build time as Hugo env vars, templated into `assets/js/config.js` via esbuild:

```
HUGO_UNSPLASH_KEY
HUGO_TRAKT_KEY
HUGO_TMDB_KEY
HUGO_LASTFM_KEY
```

Set in Netlify environment for production. For local dev, export vars or use `.env.example` with dotenv:

```bash
dotenv run hugo server -w
```

---

## Local Dev

```bash
hugo server          # dev server (analytics disabled)
hugo --gc --minify   # production build
```

Output goes to `public/` (not committed).

---

## CV Generation

The downloadable CV is auto-generated from site data by `scripts/build_cv.py` using WeasyPrint. Adding a publication to `content/works/` includes it automatically on the next build.

**Data sources:**
- `data/cv.yml` — personal info, education, experience, awards
- `content/works/` — publications, picked up automatically

**Output:** `static/general/cv/`
- `cv_htunteza.pdf` — current version (linked from sidebar)
- `cv_htunteza_YYYYMMDD.pdf` — dated archive (3 most recent kept)

Run after any CV data change:

```bash
conda run -n hugo python scripts/build_cv.py
```

Requires conda env `hugo` (Python 3.11, weasyprint, pyyaml).

---

## LLMs.txt

`/llms.txt` is served at the site root to help AI agents navigate content. Generated automatically at build time via Hugo's custom output format — no manual maintenance required.

Includes links to all publication DOIs/mirrors, recent posts, and key pages (About, CV, Works). A pointer is included in `robots.txt` under `LLMs:`.

---

## Other Things

The hostname changes per section: `hteza@notebook` on posts, `hteza@academia` on works.

The shell prompt in the nav header types out commands continuously — a mix of CLIs from the daily rotation (`btop`, `lazydocker`, `yay`, `conda activate`, HPC `sbatch` jobs, Singularity containers) and blood donation slogans dressed up as terminal commands (`bloodctl say`, `donate-cli message`). 

It makes typos. It backtracks. It pauses like it is thinking. It will do this every time you visit, indefinitely, because these are things worth noticing and this is one way to make sure you do.

Clicking `[Me]` in the footer links to my personal webpage.

The palette selector includes a theme called `Colorblind` — built for Romen Samuel Rodis y Wabina, a friend with red-green color blindness. Colors are derived from the Okabe & Ito (2008) Color Universal Design palette, the standard recommended by Nature journals for deuteranopia/protanopia. Blues replace greens as the primary accent; the error color is Okabe Vermillion rather than red. Selecting it types a dedication in the prompt. It stays up for a minute.

The macOS-style window control dots also shift to Okabe & Ito colors when the theme is active — vermillion, gold, and sky blue replace the standard red, yellow, and green.

Next to the palette selector sits an Ishihara plate icon — colored when the theme is off, black and white when it is on. Clicking it toggles the Colorblind theme in the current light/dark mode without opening the dropdown.

The privacy panel has two cache flush options: now, and in 10 seconds. There is no practical reason to use it over the immediate flush. Some people will use it every time.

---

## Attributions

- [Eye test icons](https://www.flaticon.com/free-icons/eye-test) created by Freepik - Flaticon

---

## Repository Structure

```
assets/     config.js (esbuild entry, API keys templated in)
content/    pages, posts, works, blood records
data/       YAML data sources
layouts/    Hugo templates and partials
scripts/    build_cv.py
static/     JS modules, fonts, images, CV PDFs
```
