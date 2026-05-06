# htunteza.com

[![Netlify Status](https://api.netlify.com/api/v1/badges/ca043d57-11d9-487c-9e6f-dae968d5ccc7/deploy-status)](https://app.netlify.com/projects/hugoteza/deploys)

Personal website for [Htun Teza](https://htunteza.com) — a terminal-aesthetic static site built with Hugo, deployed via Netlify.

Previous version was built with Jekyll: [finerbrighterlighter.github.io](https://github.com/finerbrighterlighter/finerbrighterlighter.github.io).

---

## Stack

- **Generator:** [Hugo](https://gohugo.io) (Go-based static site generator)
- **Hosting:** [Netlify](https://www.netlify.com) (CI/CD on push to main)
- **Domain:** [Porkbun](https://porkbun.com) → htunteza.com
- **Analytics:** [GoatCounter](https://www.goatcounter.com) (stats.htunteza.com)
- **Theme base:** [hugo-theme-console](https://github.com/mrmierzejewski/hugo-theme-console/) (terminal aesthetic)

---

## Layout

Three-column layout defined in `layouts/_default/baseof.html`:

- **Left** — `sidebar-content.html`: avatar, contact links, education. Data from `data/homepage.yml`.
- **Main** — page-specific templates, content routed by section.
- **Right** — `panel-*.html` partials: collapsible terminal windows pulling live data.

---

## Content Sections

| URL                       | Template                        | Notes                                                                                      |
| ------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------ |
| `/`                     | `layouts/index.html`          | Career profile from `data/homepage.yml`                                                  |
| `/works/`               | `layouts/_default/works.html` | Academic publications, client-side filter by condition/method/datasource/year              |
| `/works/<type>/<slug>/` | `layouts/_default/work.html`  | Individual publication page (see below)                                                    |
| `/posts/`               | `layouts/_default/list.html`  | Blog posts grouped by year; supports `private: true` front matter                        |
| `/blood/`               | `layouts/_default/blood.html` | Personal blood test records; data from `data/blood.yml`                                  |
| `/about/`               | `layouts/about/single.html`   | Content from `content/about/index.md`; hidden from nav; reached via `[Me]` footer link |

### Individual Work Pages (`/works/<type>/<slug>/`)

Only journal, preprint, dissertation, and report pages are rendered — conference entries use `render: never` in the cascade (no HTML generated) but are still listed in the works index and `llms.txt` when an external URL exists.

Each rendered work page includes:

- **Title** — plain text; bold, larger than body text
- **Author list** with ORCID hyperlinks and superscript affiliation numbers when multiple affiliations exist
- **Affiliation block** ordered by first author appearance
- **Venue · citation count · date** — venue left-aligned, citation count (live from OpenAlex API, cached) and date right-aligned; citation count links to the citing-papers list on OpenAlex
- **Abstract** from page body content
- **Find this paper** — source buttons (PubMed, fulltext, mirror, etc.), Google Scholar, and a `CITE` button that opens a terminal panel fetching BibTeX from doi.org; panel supports bibtex / NLM / APA / AMA formats with copy, BIB download, and RIS download
- **Tags** — Condition, Data, Method tags linking back to the filtered works index

The Works nav link is suppressed on individual work pages (Home, Posts, Blood remain). Navigation back to the works index is via the breadcrumb: `~/works/journal$`.

The typed command in the nav header switches to `less paper.pdf` (typed once, held) on work single pages instead of rotating through the usual command pool.

---

## Burmese Version (`/my/`)

A Burmese-language homepage lives at `htunteza.com/my/`. Hugo's multilingual mode serves it as a second language (`languageCode = "my"`, weight 2); English remains the default at `/`.

**What is translated:**

- Sidebar name and job title — `data/homepage_my.yml`
- Career profile, education, experiences, projects — `data/homepage_my.yml`
- UI strings (section headings, "show more", collaboration sentence) — `i18n/my.yaml`
- Country names in the collaboration summary are mapped to Burmese equivalents
- Arabic numerals in the collaboration summary are converted to Myanmar numerals (၀–၉)

**What stays English:**

- Works and Posts sections always pull from the English site (`$enSite`) — no Burmese content files exist for those sections

**Key files:**

| File | Purpose |
| --- | --- |
| `content/_index.my.md` | Burmese homepage stub |
| `data/homepage_my.yml` | Full translation of `data/homepage.yml` |
| `i18n/my.yaml` + `i18n/en.yaml` | UI string translations |
| `layouts/partials/collab-summary.html` | Language-aware numeral + country name conversion |

**Font:** Myanmar codepoints (U+1000–109F, Extended-A/B) are served via a `unicode-range` override within the `"Roboto Mono"` font stack — no class or `lang` attribute required in markup. The active face is Thit Sar Shwe Si, an intentionally messy handwriting typeface.

---

## Right Panels

| Window title        | Template                | Source                                                                                        |
| ------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `publications.sh` | `panel-openalex.html` | OpenAlex API — citation count, h-index, i10-index                                            |
| `topics.sh`       | `panel-research.html` | Build-time tag cloud from works front matter; limit via `researchTagLimit` in `hugo.toml` |
| `music.sh`        | `panel-lastfm.html`   | Last.fm API +`data/playlists.yml`                                                           |
| `manga.sh`        | `panel-anilist.html`  | AniList API — recently read manga                                                            |
| `screen.sh`       | `panel-trakt.html`    | Trakt + TMDB APIs — recently watched                                                         |
| `photos.sh`       | `panel-unsplash.html` | Unsplash API — latest uploads                                                                |
| `privacy.sh`      | `panel-privacy.html`  | GoatCounter disclosure + manual cache flush                                                   |

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

Set in Netlify environment for production. For local dev, export vars before running `hugo server`.

---

## SEO

Several layers of structured data are generated at build time.

**On every page:**

- Standard `<meta name="description">` — uses abstract (truncated to 160 chars) on work pages, site description elsewhere
- Open Graph tags: `og:title`, `og:description`, `og:type` (`website` on home, `article` elsewhere), `og:image`, `og:logo` (apple-touch-icon), `og:site_name`
- Twitter Card tags
- JSON-LD `BreadcrumbList` — built from the page URL path; non-section segments (e.g. `journal`) fall back to `/works/?search=journal`

**On the home page** (`layouts/partials/home-seo.html`):

- JSON-LD `Person` schema — name, job title, image, description, `sameAs` links to ORCID and Google Scholar

**On individual work pages** (`layouts/partials/work-seo.html`):

- `citation_*` meta tags for academic indexers (Google Scholar, Semantic Scholar): title, authors (Family, Given format), date, journal, DOI, abstract URL, fulltext URL
- JSON-LD `ScholarlyArticle` — title, date, URL, DOI as `sameAs`, venue as `isPartOf`, authors with ORCID `identifier`, abstract as `description`

---

## Researchers

Collaborator data lives in `data/researchers.yml` as a flat list, sorted A→Z by `id` with letter-header comments for quick navigation. Each entry has `id`, `given`, `family`, `orcid`, and `affiliations`.

Works files reference collaborators by `id` in their `authors` front matter. The partial `layouts/partials/researcher-map.html` builds a lookup dict used across templates and the CV script.

ID convention: `<firstname>-<institution>`. When someone moves institutions, a new entry is added with a new suffix; they share the same ORCID. ORCID is the primary deduplication key for collaborator counting — both institutional affiliations are counted if a collaborator has moved. `me-ceb` is always the site owner's current primary id.

---

## Shortcodes

| Shortcode                     | Purpose                                                  |
| ----------------------------- | -------------------------------------------------------- |
| `{{< collab-count >}}`      | Unique collaborator count (deduped by ORCID)             |
| `{{< institution-count >}}` | Unique institutions across all collaborator affiliations |
| `{{< country-list >}}`      | Countries sorted by institution count                    |

Used in `content/about/index.md`. Update automatically as works and researchers grow.

---

## CV Generation

The downloadable CV is auto-generated from site data by `scripts/build_cv.py` using WeasyPrint. Adding a publication to `content/works/` includes it automatically on the next build.

**Data sources:**

- `data/cv.yml` — personal info, education, experience, awards
- `data/researchers.yml` — author names resolved by id
- `content/works/` — publications, picked up automatically

**Output:** `static/general/cv/`

- `cv_htunteza.pdf` — current version (linked from sidebar)
- `cv_htunteza_YYYYMMDD.pdf` — dated archive (3 most recent kept)

Run after any CV data change, and always before pushing:

```bash
conda run -n hugo python scripts/build_cv.py
```

Requires conda env `hugo` (Python 3.11, weasyprint, pyyaml).

---

## LLMs.txt

`/llms.txt` is served at the site root to help AI agents navigate content. Generated automatically at build time via Hugo's custom output format (`notAlternative = true` prevents a `<link rel="alternate">` from leaking into the HTML head) — no manual maintenance required.

Includes links to all rendered publications (journal, preprint, dissertation, report always; conferences only when an external URL exists to avoid dead links from suppressed pages), recent posts, and key pages (About, CV, Works).

---

## Local Dev

```bash
hugo server          # dev server (analytics disabled, buildFuture = true)
hugo --gc --minify   # production build
```

Output goes to `public/` (not committed).

---

## Other Things

The hostname changes per section: `hteza@notebook` on posts, `hteza@academia` on works, `hteza@biography` on about.

The shell prompt in the nav header types out commands continuously — a mix of CLIs from the daily rotation (`btop`, `lazydocker`, `yay`, `conda activate`, HPC `sbatch` jobs, Singularity containers) and blood donation slogans dressed up as terminal commands (`bloodctl say`, `donate-cli message`). On individual work pages it switches to `less paper.pdf`, typed once and held.

It makes typos. It backtracks. It pauses like it is thinking. It will do this every time you visit, indefinitely, because these are things worth noticing and this is one way to make sure you do.

Clicking `[Me]` in the footer links to my personal webpage.

The palette selector includes a theme called `Colorblind` — built for Romen Samuel Rodis y Wabina, a friend with red-green color blindness. Colors are derived from the Okabe & Ito (2008) Color Universal Design palette, the standard recommended by Nature journals for deuteranopia/protanopia. Blues replace greens as the primary accent; the error color is Okabe Vermillion rather than red. Selecting it types a dedication in the prompt. It stays up for a minute.

The macOS-style window control dots also shift to Okabe & Ito colors when the theme is active — vermillion, gold, and sky blue replace the standard red, yellow, and green.

Next to the palette selector sits an Ishihara plate icon — colored when the theme is off, black and white when it is on. Clicking it toggles the Colorblind theme in the current light/dark mode without opening the dropdown.

The privacy panel has two cache flush options: now, and in 10 seconds. There is no practical reason to use it over the immediate flush. Some people will use it every time.

---

## Attributions

- [Thit Sar Shwe Si font](https://www.facebook.com/share/p/1LQYFSUkXy/) created by [Phoenix Digital Art](https://www.facebook.com/PhoenixDigitalArt)
  - [Link](https://drive.google.com/file/d/13pxe53JQQ3p72gkoRjzJ4Fl0gc7UqfSF/view?usp=sharing), find mirror in `static/hugo-theme-console/font/Thit_Sar_Shwe_Si.ttf`
- [Eye test icons](https://www.flaticon.com/free-icons/eye-test) created by Freepik - Flaticon
- [Duck Favicon](https://www.magnific.com/icon/duck_530260) created by Magnific - Roundicons

---

## Repository Structure

```
assets/     config.js (esbuild entry, API keys templated in)
content/    pages, posts, works, blood records
data/       YAML data sources (homepage, researchers, cv, themes, blood, playlists)
layouts/    Hugo templates, partials, shortcodes
scripts/    build_cv.py
static/     JS modules, fonts, images, CV PDFs
```
