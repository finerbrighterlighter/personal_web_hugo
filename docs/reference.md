# htunteza.com — Technical Reference

Comprehensive reference for the Hugo site at `htunteza.com`. Covers structure, configuration parameters, data schemas, templates, JavaScript modules, and the Python CV builder. Use Ctrl+F to navigate.

> **Other docs:**  
> `README.md` — public-facing overview  
> `CLAUDE.md` — Claude Code instructions (gitignored)

---

## Table of Contents

- [htunteza.com — Technical Reference](#htuntezacom--technical-reference)
  - [Table of Contents](#table-of-contents)
  - [1. Project Layout](#1-project-layout)
  - [2. Configuration](#2-configuration)
    - [2.1 `hugo.toml`](#21-hugotoml)
      - [Site-level](#site-level)
      - [`[params]`](#params)
      - [`[[params.navlinks]]`](#paramsnavlinks)
      - [`[outputFormats]`](#outputformats)
      - [`[outputs]`](#outputs)
    - [2.2 `netlify.toml`](#22-netlifytoml)
    - [2.3 `window.CONFIG`](#23-windowconfig)
  - [3. Content](#3-content)
    - [3.1 Sections overview](#31-sections-overview)
    - [3.2 Works front matter](#32-works-front-matter)
    - [3.3 Posts front matter](#33-posts-front-matter)
    - [3.4 Conference and report cascade](#34-conference-and-report-cascade)
  - [4. Data Files](#4-data-files)
    - [`data/homepage.yml`](#datahomepageyml)
    - [`data/researchers.yml`](#dataresearchersyml)
    - [`data/cv.yml`](#datacvyml)
    - [`data/themes.yml`](#datathemesyml)
    - [`data/work_filters.yml`](#datawork_filtersyml)
    - [`data/playlists.yml`](#dataplaylistsyml)
    - [`data/blood.yml`](#databloodyml)
  - [5. Templates](#5-templates)
    - [5.1 Layout hierarchy](#51-layout-hierarchy)
    - [5.2 Key templates](#52-key-templates)
    - [5.3 Partials](#53-partials)
    - [5.4 Shortcodes](#54-shortcodes)
    - [5.5 Render hooks](#55-render-hooks)
  - [6. JavaScript Modules](#6-javascript-modules)
    - [6.1 Module overview](#61-module-overview)
    - [6.1a Tunable constants by module](#61a-tunable-constants-by-module)
    - [6.2 `console_type.js`](#62-console_typejs)
    - [6.3 `works_filter.js`](#63-works_filterjs)
    - [6.4 `theme.js`](#64-themejs)
    - [6.5 `footer_roll.js`](#65-footer_rolljs)
    - [6.6 `openalex.js`](#66-openalexjs)
  - [7. Python Script — `build_cv.py`](#7-python-script--build_cvpy)
    - [Function reference](#function-reference)
    - [Data flow](#data-flow)
    - [Output](#output)
    - [Environment setup (first time)](#environment-setup-first-time)
  - [8. SEO and Structured Data](#8-seo-and-structured-data)
    - [Partials](#partials)
    - [JSON-LD encoding](#json-ld-encoding)
    - [BreadcrumbList URL fallback](#breadcrumblist-url-fallback)
    - [Work page microdata](#work-page-microdata)
  - [9. LLMs.txt Outputs](#9-llmstxt-outputs)

 ---

## 1. Project Layout

```text
hugo_console/
├── assets/
│   └── js/
│       └── config.js          Hugo template → esbuild bundle; injects API keys
├── content/
│   ├── about/                 Author bio (index.md with shortcodes)
│   ├── posts/                 Blog posts (page bundles)
│   ├── works/
│   │   ├── _index.md          Cascade rules (conference + report suppression)
│   │   ├── journal/
│   │   ├── conference/        render:never — no HTML output
│   │   ├── preprint/
│   │   ├── dissertation/
│   │   └── report/
│   └── blood-records/         Photo gallery for blood donation posts
├── data/
│   ├── homepage.yml           Sidebar, career profile, education, experiences, projects
│   ├── researchers.yml        Collaborator registry (sorted A→Z by id)
│   ├── cv.yml                 CV data consumed by build_cv.py
│   ├── themes.yml             9 color palettes (dark + light variants each)
│   ├── work_filters.yml       Filter tag priority ordering
│   ├── playlists.yml          Last.fm annual top tracks
│   └── blood.yml              Blood donation centers
├── layouts/
│   ├── _default/              Base layout, list, single, work, works, blood
│   │   └── _markup/           Render hooks (link, image, heading)
│   ├── posts/                 Post single template
│   ├── gallery/               Gallery list + single
│   ├── about/                 About single
│   ├── partials/              ~20 reusable components
│   ├── shortcodes/            4 shortcodes
│   ├── index.html             Homepage
│   ├── index.llmstxt          LLMs.txt output
│   ├── index.llmsfull         LLMs-full.txt output
│   ├── sitemap.xml            Custom sitemap (excludes private pages)
│   └── 404.html
├── scripts/
│   └── build_cv.py            CV PDF generator (WeasyPrint)
├── static/
│   ├── js/                    17 ES6 modules (loaded as type="module")
│   ├── general/               PDFs, images, VCF, CV outputs
│   └── hugo-theme-console/    Base theme CSS + vendor assets
├── docs/
│   └── reference.md           This file
├── hugo.toml                  Main site config
├── netlify.toml               Deployment config
├── README.md                  Public-facing overview
└── CLAUDE.md                  Claude Code instructions (gitignored)
```

**Generated at build time (not committed):**

- `public/` — full site output
- `resources/` — Hugo image/asset cache

 ---

## 2. Configuration

### 2.1 `hugo.toml`

#### Site-level

| Key | Value | Effect |
| --- | --- | --- |
| `baseURL` | `"https://htunteza.com"` | Canonical base for all `absURL` calls |
| `languageCode` | `"en-us"` | HTML `lang` attribute |
| `title` | `"Htun Teza"` | `{{ .Site.Title }}` — used in `<title>`, og:site_name |

#### `[params]`

| Param | Type | Value | Effect |
| --- | --- | --- | --- |
| `author` | string | `"Htun Teza"` | `<meta name="author">` |
| `description` | string | Site tagline | Default `<meta description>`, og:description, home JSON-LD |
| `animateStyle` | string | `"animate-fade-up"` | CSS class on `.terminal-layout` container |
| `ogImage` | string | `"assets/general/og_image.webp"` | Referenced for og:image |
| `promptName` | string | `"hteza"` | Left side of shell prompt (`hteza@hostname`) |
| `promptHost` | string | `"homepage"` | Default hostname in nav header |
| `buildFuture` | bool | `true` | Future-dated works visible in `hugo server` |
| `cacheTTLMinutes` | int | `60` | localStorage cache TTL for all API panels; injected into `window.CONFIG` |
| `researchTagLimit` | int | `10` | Max tags in the topics panel; injected into `window.CONFIG` |

#### `[[params.navlinks]]`

Each entry defines one item in the nav bar. Order in the array = display order.

| Field | Type | Effect |
| --- | --- | --- |
| `name` | string | Link label |
| `url` | string | Path (e.g. `"/works/"`) |
| `host` | string | Shell hostname shown in header when current URL starts with this |
| `hidden` | bool | Exclude from menu (still used for hostname matching) |

Current links: **Home** (`/`, `homepage`), **Works** (`/works/`, `academia`), **Posts** (`/posts/`, `notebook`), **Blood** (`/blood/`, `rhesus`), **About** (`/about/`, `biography`, hidden).

On work single pages the Works link is additionally suppressed — only Home, Posts, Blood remain. On the about page, Blood is also suppressed — only Home, Works, Posts remain.

#### `[outputFormats]`

| Format | baseName | mediaType | notAlternative | Used for |
| --- | --- | --- | --- | --- |
| `llmstxt` | `llms` | `text/plain` | `true` | `/llms.txt` |
| `llmsfull` | `llms-full` | `text/plain` | `true` | `/llms-full.txt` |

`notAlternative = true` prevents `<link rel="alternate">` from leaking into the HTML `<head>`.

#### `[outputs]`

```toml
home = ["HTML", "llmstxt", "llmsfull"]
```

Only the home page has extra output formats. All other pages default to `["HTML"]`.

 ---

### 2.2 `netlify.toml`

```toml
[build]
command = "hugo"
publish = "public"

[build.environment]
HUGO_VERSION = "0.157.0"
```

Hugo version is pinned here. To upgrade: change `HUGO_VERSION` and test locally with that version first.

**Environment variables** (set in Netlify dashboard, not in this file):

| Variable | Used by | Purpose |
| --- | --- | --- |
| `HUGO_UNSPLASH_KEY` | `unsplash.js` | Unsplash API access key |
| `HUGO_TRAKT_KEY` | `trakt.js` | Trakt API client ID |
| `HUGO_TMDB_KEY` | `trakt.js` | TMDB API key (for poster images) |
| `HUGO_LASTFM_KEY` | `lastFM.js` | Last.fm API key |

For local dev, export these before running `hugo server`.

 ---

### 2.3 `window.CONFIG`

**File:** `assets/js/config.js` (Hugo template processed by esbuild)

```javascript
window.CONFIG = {
  unsplash:        "{{ getenv "HUGO_UNSPLASH_KEY" }}",
  trakt:           "{{ getenv "HUGO_TRAKT_KEY" }}",
  tmdb:            "{{ getenv "HUGO_TMDB_KEY" }}",
  lastfm:          "{{ getenv "HUGO_LASTFM_KEY" }}",
  cacheTTLMinutes: {{ site.Params.cacheTTLMinutes | default 60 }},
  researchTagLimit:{{ site.Params.researchTagLimit | default 30 }}
};
```

Loaded first in `scripts.html` via `js.Build`. All other modules read `window.CONFIG` at runtime.

| Key | Consumed by |
| --- | --- |
| `unsplash` | `unsplash.js` |
| `trakt` | `trakt.js` |
| `tmdb` | `trakt.js` |
| `lastfm` | `lastFM.js` |
| `cacheTTLMinutes` | `cache.js`, `openalex.js`, `trakt.js`, `unsplash.js` |
| `researchTagLimit` | `research.js` |

 ---

## 3. Content

### 3.1 Sections overview

| URL pattern | Layout template | Notes |
| --- | --- | --- |
| `/` | `layouts/index.html` | Career profile; latest 2 posts; recent works (last 1 year) |
| `/works/` | `_default/works.html` | Filter panel + publications grouped by category then year |
| `/works/<type>/<slug>/` | `_default/work.html` | journal/preprint/dissertation rendered; conference and report suppressed |
| `/posts/` | `_default/list.html` | Posts grouped by year |
| `/posts/<slug>/` | `layouts/posts/single.html` | Blog post; supports `company` field |
| `/blood/` | `_default/blood.html` | Blood donation centers + photo gallery |
| `/about/` | `layouts/about/single.html` | Hidden from nav; reached via `[Me]` footer animation |
| `/gallery/` | `layouts/gallery/` | Image gallery section |
| `/404.html` | `layouts/404.html` | Custom 404 |

### 3.2 Works front matter

```yaml
# Required
type: journal          # journal | conference-speaking | conference-poster
                       # preprint | dissertation | report
title: "Full paper title"
date: 2024-01-15       # ISO date; controls display order and year grouping

# Publication metadata
venue: "Journal or Conference Name"    # Shown in meta row and SEO tags
scholar: "AbCdEfGhIjK"                # Google Scholar citation_for_view suffix

# Authors — at least one required
authors:
  - id: me-ceb          # Resolves via researcher-map; falls back to inline given/family
    highlight: true     # Bolds name in author list
  - id: amarit-ceb
  - given: Jane         # Inline — used when no id entry exists
    family: Doe

# Sources — drives "Find this paper" buttons and DOI extraction
sources:
  - text: fulltext      # any key; button label = text | upper (FULLTEXT, PUBMED, …)
    url: https://doi.org/10.xxxx/xxxxx
  - text: pubmed
    url: https://pubmed.ncbi.nlm.nih.gov/XXXXXXXX/
  - text: mirror        # internal paths get relURL + no target="_blank"
    url: /general/papers/filename.pdf
  - text: poster        # used in llms.txt for conference/report external URL
    url: https://...
  - text: any-new-key   # appears automatically as ANY-NEW-KEY button
    url: https://...

# Tags — drive filter buttons and tag section on work pages
conditions: [hypertension, periodontitis, CKD]
datasource: [EHR, registry]
methods: [machine learning, survival analysis, multi-state model]
```

**`sources.text` behaviour:**

All entries are rendered as buttons in front matter order with the label `text | upper`. No fixed label mapping — any key works. Special roles some keys carry:

| text | Special role |
| --- | --- |
| `fulltext` | First choice for title hyperlink; `citation_fulltext_html_url` SEO tag |
| `pubmed` | Title link fallback #1 |
| `mirror` | Title link fallback #2; internal paths get `relURL`, no `target="_blank"` |
| `poster` | External URL for conference/report entries in llms.txt |

Google Scholar (from `scholar` front matter key) and BibTeX (from DOI) are appended after all source buttons.

DOI is extracted from any source URL containing `doi.org/` — the prefix is stripped to a bare `10.xxx/...` for use in `data-doi` (consumed by `work-bibtex.js`) and SEO tags.

### 3.3 Posts front matter

```yaml
title: "Post title"
date: 2024-03-28T12:00:00+07:00
description: "Short excerpt shown in post lists"
company: "Optional — shown as a tag on the post"  # optional
private: false   # true → hidden from list, sitemap, and search engines
```

### 3.4 Conference and report cascade

`content/works/_index.md`:

```yaml
cascade:
  - _target:
      kind: page
      path: /works/conference/**
    build:
      render: never    # No HTML file written to public/
      list: always     # Still included in page collections (works filter, llms.txt)
  - _target:
      kind: page
      path: /works/report/**
    build:
      render: never
      list: always
  - _target:
      kind: page
    layout: work       # journal/preprint/dissertation use _default/work.html
```

Conference and report entries appear in the `/works/` filter page and in `llms.txt` (only when an external URL exists). They have no permalink — linking to `/works/?search=conference` or `/works/?search=report` is the fallback.

 ---

## 4. Data Files

### `data/homepage.yml`

Drives the homepage and sidebar. Not read by `build_cv.py`.

| Top-level key | Contents | Consumed by |
| --- | --- | --- |
| `universities` | Named anchors for university data (YAML anchors reused in education) | `education` entries |
| `sidebar` | `name`, `job_title`, `avatar`, `email`, `phone`, `area`, `location`, `website`, `orcid`, `scholar_profile`, `cv`, `vcard` | `sidebar-content.html`, `home-seo.html` |
| `career_profile` | `title` + three markdown paragraphs: `para1`, `para2`, `para3`; `para2` gets the dynamic collab sentence appended inline | `index.html` |
| `education` | Array of degrees: `year`, `university`, `degree`, `field`, `notes` | `sidebar-content.html` |
| `experiences` | Array: `role`, `company`, `period`, `bullets` | `index.html` (first 2 shown, rest collapse) |
| `projects` | Array: `name`, `description`, `link` | `index.html` (first 2 shown, rest collapse) |

Key sidebar fields used in SEO:

- `sidebar.orcid` → `sameAs` in home JSON-LD Person schema
- `sidebar.scholar_profile` → Google Scholar `sameAs` + works page Scholar button URL

### `data/researchers.yml`

Flat array, sorted **A→Z by `id`**, with letter-header comments (`# ── ID=A ─────────`) for navigation. `me-ceb` sits at the very top under `# ── Me ──`.

```yaml
- id: me-ceb                  # <firstname>-<institution-abbreviation>
  given: Htun
  family: Teza
  orcid: "0000-0002-1076-9513" # Primary deduplication key for collab-count
  affiliations:
    - Full institution name, Country
```

**ID convention:** `<firstname>-<institution>`. When a researcher moves, add a new entry with a new suffix — they share the same ORCID. Same-person entries sit adjacent in the file.

**Deduplication:**

- `collab-count` shortcode: dedupes by ORCID → one person at two institutions = 1 collaborator
- `institution-count` / `country-list`: iterates all ids directly → both institutions counted if a person moves

**Consumed by:** `researcher-map.html` partial (returns a `{id: person}` dict), `work.html`, `works.html`, `index.html`, `build_cv.py`.

### `data/cv.yml`

Read exclusively by `build_cv.py`. Not used by any Hugo template.

| Key | Contents |
| --- | --- |
| `header` | `name`, `address` |
| `contact` | `phone`, `email`, `website` |
| `research_interests` | Array of strings (semicolon-joined in PDF) |
| `education` | Array: `date`, `university`, `ranking`, `degree`, `field`, `thesis`, `notes` |
| `work_experience` | Array: `institution`, `role`, `period`, `bullets` (strings or dicts with `links`) |
| `additional_experiences` | Array of experience entries |
| `awards` | Array: `year`, `title`, `institution` |

### `data/themes.yml`

Array of 10 palette objects. Each has:

```yaml
- id: nord                  # localStorage key
  label: "Nord"             # Dropdown label
  default: [dark, light]    # Which mode(s) use this as default
  dark:
    background: "#2e3440"
    font: "#eceff4"
    invert_font: "#2e3440"  # Used for text on primary-color backgrounds
    primary: "#5e81ac"
    secondary: "#d8dee9"
    tertiary: "#4c566a"
    error: "#bf616a"
    progress_bar_background: "#3b4252"
    progress_bar_fill: "#5e81ac"
    code_bg: "#3b4252"
  light:
    ...                     # Same 10 keys
```

Embedded as JSON in `theme-data.html` and read by a blocking inline script before `<body>` renders — eliminates flash of unstyled content (FOUC).

**Current palettes:** Duck (default — Monokai Pro dark + warm amber-cream light), Nord, Gruvbox, Catppuccin, Everforest, Dracula, Tokyo Night, GitHub, Colorblind (Okabe & Ito), Rosé Pine.

### `data/work_filters.yml`

Controls display order of filter tags in the works filter panel. Tags not listed here still appear but are sorted after the priority list.

```yaml
conditions: [Hypertension, CKD, Periodontitis]
datasource:  [EHR, Thailand, Myanmar]
methods:     [Cox PH, Time-varying, ML]
```

Consumed by `works.html` when building filter buttons.

### `data/playlists.yml`

```yaml
- title: "2026 Top Tracks"
  link: "https://www.last.fm/user/finer/library/tracks?date_preset=LAST_365_DAYS"
  image: "playlist_2026.png"   # filename in static/general/
```

Consumed by `panel-lastfm.html` to render annual playlist links.

### `data/blood.yml`

```yaml
bld_cen:
  - title: "Section title"
    intro: "Section description"
    direction:
      - name: "Center name"
        link: "https://..."
        note: "Optional note"
        geo: "https://maps.google.com/..."
        address: "Address string"
        phone: "Phone number"
```

Consumed by `_default/blood.html`.

 ---

## 5. Templates

### 5.1 Layout hierarchy

```text
baseof.html                    Wraps every page
├── <head>
│   ├── favicon.html
│   ├── header.html            SEO meta tags, OG, Twitter Card
│   ├── theme-data.html        Inline blocking script — writes CSS vars, no FOUC
│   ├── home-seo.html          (home only) Person JSON-LD
│   ├── work-seo.html          (work pages only) citation_* tags + ScholarlyArticle JSON-LD
│   └── breadcrumb-ld.html     BreadcrumbList JSON-LD (all non-home pages)
├── .sidebar (left)
│   └── sidebar-content.html
├── {{ block "main" }}         Page-specific content (see templates below)
│   └── footer.html
└── .right-panels
    ├── panel-openalex.html
    ├── panel-research.html
    ├── panel-lastfm.html
    ├── panel-anilist.html
    ├── panel-trakt.html
    ├── panel-unsplash.html
    └── panel-privacy.html
```

Scripts loaded at bottom of `<body>` via `partials/scripts.html`.

### 5.2 Key templates

**`_default/work.html`** — Individual publication page. Implements `ScholarlyArticle` microdata. Structure:

1. **Title** — plain text `<h1>` (no link); styled bold 1.1rem, 1.5 line-height, `--display-h1-decoration: none` suppresses the base theme's `====` bar
2. **Author list** — ORCID hyperlinks; superscript affiliation numbers when >1 unique affiliation
3. **Affiliation block** — numbered, ordered by first appearance
4. **Meta row** — venue (left) · citation count + date (right)
5. **Abstract** — `{{ .Content }}` (page body)
6. **Find this paper** — all `sources` entries as `{{ .text | upper }}` buttons (front matter order, any `text` key works) + Google Scholar + `CITE` button (when DOI present); see `work-bibtex.js` below for full CITE panel behaviour
7. **Tags** — Condition / Data / Method groups (only rendered when at least one tag present)

**`_default/works.html`** — Publications filter page. Filter state stored in URL query params (`?condition=X&method=Y&search=Z`). Each publication rendered as `.post` with `data-conditions`, `data-datasource`, `data-methods`, `data-year`, `data-type`, `data-search` attributes. Client-side filtering via `works_filter.js`.

**`layouts/index.html`** — Homepage. Pulls data from `data/homepage.yml`. Shows: 2 latest posts, career profile, 2 + N experiences (collapse button), 2 + N projects (collapse button), works from the last 365 days.

**`_default/list.html`** — Posts list, grouped by year. Skips pages with `private: true`.

**`_default/blood.html`** — Blood donation centers from `data/blood.yml` + photo gallery from `content/blood-records/` page bundle resources.

### 5.3 Partials

| Partial | Called from | Purpose |
| --- | --- | --- |
| `header.html` | `baseof.html` | `<title>`, description, OG tags, Twitter Card, canonical, robots, RSS link |
| `favicon.html` | `baseof.html` | `<link>` tags for all favicon sizes + webmanifest |
| `theme-data.html` | `baseof.html` | Embeds `themes.yml` as JSON; blocking inline script writes CSS vars before render |
| `home-seo.html` | `baseof.html` (home only) | JSON-LD `Person` schema |
| `work-seo.html` | `baseof.html` (works pages) | `citation_*` meta tags + JSON-LD `ScholarlyArticle` |
| `breadcrumb-ld.html` | `baseof.html` | JSON-LD `BreadcrumbList` built from URL path segments |
| `sidebar-content.html` | `baseof.html` | Avatar, contact links, education list, live clock |
| `panel-openalex.html` | `baseof.html` | Shell window for OpenAlex metrics panel |
| `panel-research.html` | `baseof.html` | Shell window for research topics; injects `window.__researchTags` (all tag occurrences) and `window.__worksCount` (total works page count) |
| `panel-lastfm.html` | `baseof.html` | Shell window for Last.fm now-playing + playlists |
| `panel-anilist.html` | `baseof.html` | Shell window for AniList manga |
| `panel-trakt.html` | `baseof.html` | Shell window for Trakt watch history |
| `panel-unsplash.html` | `baseof.html` | Shell window for Unsplash photos |
| `panel-privacy.html` | `baseof.html` | GoatCounter disclosure + cache flush controls |
| `collab-summary.html` | `index.html` (inside `career_profile` para2) | Computes collab count, institution count, and country list in one pass; outputs bare inline sentence (no `<p>` wrapper) |
| `researcher-map.html` | `work.html`, `works.html`, `index.html`, shortcodes | Returns `dict` keyed by researcher id; call with `partial "researcher-map.html" .` |
| `footer.html` | `baseof.html` | Footer with `[Me]` link (`href="/about/"` for correct new-tab behaviour; JS intercepts normal clicks for the animation) |
| `scripts.html` | `baseof.html` | `<script type="module">` tags for all JS modules |
| `works-filter-group.html` | `works.html` | Renders one filter group (condition/datasource/method) |

### 5.4 Shortcodes

| Shortcode | Args | Returns | Data source | Notes |
| --- | --- | --- | --- | --- |
| `collab-count` | none | integer | `researchers.yml` + all works | Dedupes by ORCID; skips `me-ceb` and any entry sharing its ORCID |
| `institution-count` | none | integer | `researchers.yml` + all works | No person dedup — both institutions count if someone moves; keyword extraction: University, Hospital, Academy, Institute, College, Unit |
| `country-list` | none | prose string | `researchers.yml` + all works | Countries sorted by institution count desc; Oxford comma; expands UK, USA/US, UAE |
| `gallery` | `match="*.jpg"` | responsive image grid | Page bundle resources | No resize if image width ≤ 2000px |
| `opening` | inline text | `<span class="opening-words">` | — | Bold uppercase letter-spaced treatment for first few words of a section; used in `about/index.md` |
| `pullquote` | inline text | `<div class="pullquote">` | — | Decorative closing statement with oversized Georgia quotation mark watermark; used in `about/index.md` |

Usage in Markdown: `{{< collab-count >}}`, `{{< gallery match="*.webp" >}}`, `{{< opening >}}First words{{< /opening >}}`

### 5.5 Render hooks

Located in `layouts/_default/_markup/`:

| Hook | File | Behavior |
| --- | --- | --- |
| Link | `render-link.html` | External links (`http*`) automatically get `target="_blank" rel="noopener"` |
| Image | `render-image.html` | Adds `class="img-responsive"` to all `<img>` tags |
| Heading | `render-heading.html` | Standard heading with `id` anchor for deep linking |

 ---

## 6. JavaScript Modules

All files in `static/js/`, loaded as `type="module"` in `partials/scripts.html`. GoatCounter analytics script loads only in production (`{{ if not hugo.IsServer }}`).

### 6.1 Module overview

| File | Imports | DOM target | External API | Cache key | Notes |
| --- | --- | --- | --- | --- | --- |
| `cache.js` | — | — | localStorage | — | Exports `getCache(key)` / `setCache(key, data)`; TTL from `window.CONFIG.cacheTTLMinutes` |
| `cache-expires.js` | — | `#cache-expire-line`, `#cache-flush-btns` | localStorage | — | Shows soonest expiry; "clear now" and "slow" (5-step delay) flush buttons |
| `currenttime.js` | — | `#timezone` | Intl API | — | Live clock, updates every 1000ms |
| `theme.js` | — | `#theme-toggle`, `#theme-palette-select`, `#cvd-shortcut` | localStorage | `theme-mode`, `theme-palette-dark`, `theme-palette-light` | Emits `theme-changed` custom event on switch |
| `console_type.js` | — | `#typed-command` | `window.CONFIG` | — | Animated terminal typing; static mode on work pages |
| `collapse_windows.js` | — | `.terminal-window` | sessionStorage | `panel-<title>` | Persists collapse state; auto-collapses sidebar on mobile (except homepage) |
| `footer_roll.js` | — | `.author-link`, `#avatar`, `.avatar-wrapper`, `#author-name`, `#job-title`, `main.main-content` | — | — | Click `[Me]` → whoami animation + avatar scan → fetch `/about/` and inject content via `innerHTML` swap + `history.pushState`; back button via `popstate` reload |
| `works_filter.js` | — | `#works-filters`, `.post`, `#works-count`, `#works-search` | `window.location` | — | URL-synced filter state; hides empty year/category groups |
| `research.js` | — | `#research-cloud` | `window.__researchTags`, `window.__worksCount` | — | Sorted `cli-table`: tag name (linked), 10-segment block bar (% of all works), count; tooltip shows "X of Y works"; limit from `window.CONFIG.researchTagLimit` |
| `openalex.js` | `cache.js` | `#openalex-metrics` | OpenAlex API | `openalex-author-data` | SVG bar chart; re-renders on `theme-changed` event; hardcoded author ID |
| `work-citation.js` | `cache.js` | `article[data-doi]`, `#work-cite-count` | OpenAlex API | `openalex-work-<doi>` | Work pages only; citation count linked to citing-papers list |
| `work-bibtex.js` | `cache.js` | `article[data-doi]`, `#bibtex-btn` | doi.org (content negotiation) | `bibtex-<doi>` | Work pages only; CITE button opens `fetch.sh` terminal panel; prompt line shows `$ pub-get --ref --format=<fmt>` (updates on format change). On open: CLI-style status sequence in content area — `[INFO] Searching local cache...`; if miss adds `[INFO] Not found. Requesting metadata from doi.org...`; on success adds `[OK] Key identified: <key>`; after `FETCH_DONE_DELAY` (1200ms) replaced by formatted content; `[ERR]` on failure. Format selector (bibtex/nlm/apa/ama); Copy; BIB download; RIS download; collapse via `collapse_windows.js`, EXIT closes fully. BibTeX display: prettified (one field per line, aligned keys, preferred field order), syntax-highlighted (keys in primary, punctuation in secondary), Courier New at `--font-sm`; Copy and BIB download use raw doi.org response. NLM: all authors listed. AMA: ≤6 authors in full; >6 → first 3 + et al. |
| `duck.js` | — | `.avatar-wrapper` | — | — | Avatar easter egg: click shows `> quack` (flickers on spam) and reveals `duck_mascot.png` with `duckGlitch` CSS animation (0.6s hue-rotate + jitter), then crossfades back over 1.5s |
| `lastFM.js` | `cache.js` | `#lasttrack`, `#topalbums` | Last.fm API | `lastfm-topalbums` | Now-playing (no cache, 30s poll); top albums (cached) |
| `anilist.js` | `cache.js` | `#last-read-manga` | AniList GraphQL | `anilist-manga` | Recently read manga for user "finer" |
| `trakt.js` | `cache.js` | `#last-watched` | Trakt + TMDB APIs | `trakt-watched` | Recently watched; dedupes consecutive repeats; TMDB poster images |
| `unsplash.js` | `cache.js` | `#latestimage` | Unsplash API | `unsplash-photos` | Latest 10 photos from account "finerbrighterlighter" |

### 6.1a Tunable constants by module

| File | Constant | Default | Effect |
| --- | --- | --- | --- |
| `openalex.js` | `authorId` | `"A5065083669"` | OpenAlex author record ID |
| `openalex.js` | `graphDisplayYears` | `5` | Years shown in the bar chart |
| `lastFM.js` | `LASTFM_USER` | `"fibrili"` | Last.fm username |
| `lastFM.js` | `LASTFM_TOP_ALBUMS_LIMIT` | `10` | Albums shown in panel |
| `lastFM.js` | `LASTFM_POLL_INTERVAL` | `30000` | ms between recent-track polls |
| `anilist.js` | `ANILIST_USER` | `"finer"` | AniList username |
| `anilist.js` | `ANILIST_LIMIT` | `10` | Manga covers shown in panel |
| `trakt.js` | `TRAKT_USER` | `"hteza"` | Trakt username |
| `trakt.js` | `TRAKT_HISTORY_FETCH` | `100` | Items fetched from API (must be ≥ TRAKT_DISPLAY_LIMIT) |
| `trakt.js` | `TRAKT_DISPLAY_LIMIT` | `10` | Items shown in panel |
| `unsplash.js` | `UNSPLASH_USER` | `"finerbrighterlighter"` | Unsplash username |
| `unsplash.js` | `UNSPLASH_LIMIT` | `10` | Photos shown in panel |
| `cache-expires.js` | `FLUSH_RELOAD_DELAY` | `400` | ms before reload after cache clear |
| `console_type.js` | `typingSpeed` | `170` | ms per typed character (~65 WPM) |
| `console_type.js` | `backspaceSpeed` | `80` | ms per backspace |
| `console_type.js` | `idleMin` | `500` | ms minimum idle between lines |
| `console_type.js` | `idleMax` | `2000` | ms maximum idle between lines |
| `console_type.js` | `idlePerChar` | `5` | ms added per character of current line to idle |
| `console_type.js` | `errorChance` | `0.25` | Probability a line has a typo |
| `console_type.js` | `skipWordChance` | `0.5` | Split between skip-word vs. early-quote mistake |
| `console_type.js` | `eraseChance` | `0.35` | Probability line is backspaced before next |
| `console_type.js` | `linuxLineChance` | `0.75` | Probability of CLI command vs. slogan |
| `console_type.js` | `minTypoChar` | `6` | Minimum char index before typo can fire |
| `console_type.js` | `mistakePause` | `300` | ms pause after early-quote mistake |
| `console_type.js` | `skipPause` | `400` | ms pause after skip-word mistake |
| `console_type.js` | `clearPause` | `300` | ms pause after line clear before next line |
| `console_type.js` | `staticDelay` | `800` | ms initial delay on work single pages |
| `console_type.js` | `dedicationDelay` | `600` | ms initial delay before dedication types |
| `console_type.js` | `dedicationHold` | `60000` | ms dedication is held before resuming |
| `console_type.js` | `minTypingWidth` | `120` | px available width below which typing is hidden |
| `footer_roll.js` | `whoami` typing speed | `60` ms/char | Speed of `whoami` command typing |
| `footer_roll.js` | name typing speed | `45` ms/char | Speed of real name re-type |
| `footer_roll.js` | role typing speed | `30` ms/char | Speed of job title re-type |
| `footer_roll.js` | thinking pause | `450` ms | Pause after `whoami` before scan starts |
| `footer_roll.js` | scan duration | `3500` ms | Duration `.scan` class is held (matches CSS animation length) |
| `footer_roll.js` | scroll delay | `600` ms | Initial delay to let scroll begin before typing |
| `footer_roll.js` | pre-transition pause | `600` ms | Pause after role typed before fetching `/about/` |
| `footer_roll.js` | fade duration | `350` ms | Opacity fade-out of `<main>` before content swap |
| `research.js` | `MAX_BAR` | `10` | Bar width in segments; 1 segment = 10% of all works; fractional remainder sets opacity of last filled segment |
| `work-bibtex.js` | `FETCH_DONE_DELAY` | `1200` | ms the `[OK]` status line is held before being replaced by formatted citation content |

### 6.2 `work-bibtex.js` — CITE panel

Activated on any work single page that has a `data-doi` attribute on the `<article>` element. The bare DOI (e.g. `10.1016/j.jclinepi.2024.111234`) is extracted by the Hugo template from the first source URL containing `doi.org/`.

**Panel trigger:** The `CITE` button (id `#bibtex-btn`) in the "Find this paper" section. Clicking opens a `.terminal-window` panel titled `fetch.sh`. Clicking again (or EXIT) closes it. The window header collapse is handled by `collapse_windows.js`.

**Prompt line:** `$ pub-get --ref --format=<fmt>` — updates to the active format name as the user switches formats.

**Fetch sequence (on first open only — subsequent opens use cached data):**

```
[INFO] Searching local cache...
```
If found in `localStorage` (cache key `bibtex-<doi>`, TTL from `cache.js`), proceeds directly to `[OK]`.

If not found:
```
[INFO] Searching local cache...
[INFO] Not found. Requesting metadata from doi.org...
```
Fetches from `https://doi.org/<doi>` with `Accept: application/x-bibtex` header. On success, stores result in `localStorage`.

Either way, on success:
```
[OK]   Key identified: Teza_2023
```
After `FETCH_DONE_DELAY` ms, the status lines are replaced by the formatted citation.

On network/HTTP failure:
```
[ERR]  doi.org did not return BibTeX for this entry.
```

**Color coding of status lines:** `[INFO]` in secondary color, `[OK]` in primary color, `[ERR]` in error color.

**Format selector:** `• bibtex • nlm • apa • ama •` — clicking any switches the display and updates the prompt line. Active format shown in primary color.

**Citation display:**

All four formats use syntax highlighting:
- Authors and structural metadata (year, volume, pages, DOI/URL) → secondary color
- Title → default font color (most visually prominent)
- Journal name → primary color
- Field keys (BibTeX only) → primary color; punctuation (`{`, `}`, `=`, `,`) → secondary color

BibTeX is prettified for display: one field per line, keys padded to align values, preferred field order (title → author → journal/booktitle → year → month → volume → number → pages → doi → url → publisher → issn → abstract → keywords → editor → note → any remaining). The raw doi.org response is used for Copy and BIB download — LaTeX generators receive unmodified input.

Font: Courier New at `--font-sm` (0.75rem) — distinct from the site's Roboto Mono.

**Author rules by format:**
- **BibTeX** — raw as returned by doi.org
- **NLM** — all authors listed (`Last FM` style), no truncation
- **APA** — up to 20 authors (`Last, F. M.` style), then `… LastAuthor`; `&` before final author
- **AMA** — ≤6 authors listed in full; >6 → first 3 + `, et al.`

**Action buttons:**
- **Copy** — copies raw doi.org BibTeX when in bibtex format; `pre.textContent` (tag-stripped) for other formats
- **BIB** — downloads `<citekey>.bib` with raw BibTeX (cite key from doi.org response)
- **RIS** — downloads `<citekey>.ris`, converted from parsed BibTeX fields; type map: article→JOUR, inproceedings/conference→CONF, book→BOOK, incollection→CHAP, phdthesis/mastersthesis→THES, techreport→RPRT, misc→GEN, unpublished/preprint→UNPB

All three buttons are disabled until the fetch (or cache hit) completes.

### 6.3 `console_type.js`

Animated terminal typing in the nav header `<span id="typed-command">`.

**Content pools:**

- Shell commands: `whoami`, `date`, `uptime`, `pwd`, `ls`, `history`, `clear`
- HPC: `sbatch`, `squeue`, `scancel`, `sacct`, `sinfo` commands
- Container: `singularity exec` invocations
- Dev tools: `btop`, `brew`, `pacman`, `conda activate`, `lazydocker`, `docker`
- Blood donation slogans: 20 messages in English and Burmese (disguised as terminal commands: `bloodctl say`, `donate-cli message`)

**Timing:**

| Event | Delay |
| --- | --- |
| Typing a character | ~170ms (±random) |
| Backspace | ~80ms |
| Idle between lines | 500–2000ms + line-length padding |
| Typo recovery pause | Additional ~200ms |

**Typo system:** 25% chance per line. Two typo types chosen 50/50:

- *Quote mistake:* adds an early quote character mid-word, then erases and continues
- *Skip-word mistake:* skips a word, finishes the line, then erases back to insert it

**Erase previous line:** 35% chance — erases the previous line before typing the next.

**Cancellation token:** A shared token object passed to `setTimeout` callbacks. Replacing the token invalidates all pending callbacks — used when interrupting for dedications or static mode.

**Static mode:** Activated when `.work-single` exists on the page. Types `less paper.pdf` once and stops. No typos, no rotation.

**Dedication mode:** Triggered when the Colorblind theme is activated. Interrupts current typing, selects a random dedication message, types it (no typos), holds for ~60s, then resumes normal rotation.

### 6.3 `works_filter.js`

Client-side filter for the `/works/` page.

**Filter state:**

```javascript
filters = {
  condition: "all",
  datasource: "all",
  method: "all",
  year: "all"
}
```

**URL sync:**

- `readFromURL()` — called on load; restores filter state + search from `?condition=X&method=Y&search=Z`
- `writeToURL()` — called on any change; uses `history.replaceState` (no back-button entry)

**Visibility logic:** A `.post` element is hidden if any active filter value is not present in the element's corresponding `data-*` attribute (space-separated list). Text search checks `data-search` (title + venue + authors + tags + abstract).

**Section collapse:** After filtering, year `<h3>` groups and category `<h2>` sections with zero visible posts are hidden automatically.

**Entry point:** Tag cloud links and breadcrumb non-page segments link to `/works/?search=<tag>` — `readFromURL()` picks this up and pre-fills the search box.

### 6.4 `theme.js`

**localStorage keys:**

| Key | Values | Effect |
| --- | --- | --- |
| `theme-mode` | `"dark"` \| `"light"` | Current mode |
| `theme-palette-dark` | palette id (e.g. `"nord"`) | Dark mode palette |
| `theme-palette-light` | palette id (e.g. `"nord"`) | Light mode palette |

**Events:** Emits `CustomEvent("theme-changed")` on `document` whenever mode or palette changes. `openalex.js` listens to re-render the SVG chart with new CSS color values.

**Duck toggle:** When the active palette id is `"duck"`, `updateEmoji()` replaces the ○/● text with `<img src="/favicon-32x32.png">` sized to `1.1rem`. Grayscale filter applied in light mode (`filter: grayscale(100%)`); full colour in dark mode.

**CVD button (`#cvd-shortcut`):** One-click toggle for the Colorblind palette in current mode. Reads `aria-pressed` to determine current state. Side effect: triggers the dedication sequence in `console_type.js` when switching on.

**Initialization:** The blocking inline script in `theme-data.html` writes CSS variables to `:root` before `<body>` renders. `theme.js` then wires up the UI controls and syncs the dropdown selection to the current state.

### 6.5 `footer_roll.js`

Handles the `[Me]` footer link. Full sequence on click:

1. Clear `#author-name` and `#job-title` text (preserve layout space with `&nbsp;`)
2. Expand sidebar panel if collapsed; scroll avatar into view
3. Type `whoami` into the name slot (60ms/char)
4. Brief processing pause (450ms)
5. Trigger avatar scan animation: remove `.scan`, force reflow via `void wrapper.offsetWidth`, add `.scan`
6. After 3500ms, remove `.scan`; type real name (45ms/char), then real role (30ms/char)
7. If already on `/about/`, stop. Otherwise: wait 600ms, then call `transitionToAbout()`

**`transitionToAbout()` — smooth page transition:**

```
fetch('/about/')         →  download full HTML
DOMParser                →  parse into a queryable document
querySelector            →  extract <main class="main-content">
opacity fade (350ms)     →  fade out current <main>
innerHTML swap           →  replace current <main> content
history.pushState        →  update URL bar to /about/ (no reload)
document.title           →  sync tab title
scrollIntoView + fade in →  reveal new content
```

Falls back to `window.location.href = '/about/'` on any error.

**Back button:** `popstate` event fires when the user navigates back from `/about/`. Handler calls `window.location.reload()` to restore the original page content.

**Avatar scan animation (CSS, no JS keyframes):**

The `.scan` class on `.avatar-wrapper` activates three CSS layers simultaneously:

| Layer | Selector | Effect |
| --- | --- | --- |
| Scan beam | `::before` | 60px gradient strip using `var(--primary-color)`, `mix-blend-mode: screen`; sweeps top→bottom three times over 3.5s |
| CRT overlay | `::after` | Repeating 4px horizontal stripe pattern; flickers at irregular opacity intervals |
| Chromatic glitch | `.sidebar-avatar` | Three bursts of hue-rotate + sepia + brightness + lateral `translateX` jitter timed to each beam pass |

The `.avatar-wrapper` is sized explicitly to `10rem × 10rem` with `border-radius: 50%` and `overflow: hidden` so all layers clip to the circular boundary.

### 6.6 `openalex.js`

**Hardcoded constants:**

```javascript
const authorId         = "A5065083669";  // OpenAlex author ID — update if record changes
const graphDisplayYears = 5;             // Years shown in the bar chart
```

**API calls (parallel):**

1. `GET https://api.openalex.org/authors/A5065083669` — author summary (h-index, i10, cited_by_count, counts_by_year)
2. `GET https://api.openalex.org/works?filter=author.id:A5065083669&per_page=200` — full works list

**Cache:** Manual TTL pattern (not using `cache.js`). Key: `openalex-author-data`. TTL from `window.CONFIG.cacheTTLMinutes`.

**Metrics computed:**

| Metric | Career | Since `cutoffYear` |
| --- | --- | --- |
| Works | Articles + preprints | Filtered by year |
| Citations | `author.cited_by_count` | Sum of `counts_by_year` entries |
| h-index | `summary_stats.h_index` | Recalculated from filtered works |
| i10-index | `summary_stats.i10_index` | Works with ≥10 citations in window |

**Chart:** SVG bar chart, 450×150px viewBox. Bar heights proportional to max publications in the display window. Colors read from CSS custom properties at render time — re-renders on `theme-changed` to pick up new palette. Tooltip shows year + works count on hover, flips to left side when near right edge.

---

## 7. Python Script — `build_cv.py`

**Runtime:** Python 3.11, conda env `hugo`. Dependencies: `weasyprint`, `pyyaml`.

**Run:** `conda run -n hugo python scripts/build_cv.py`

**When to run:** After any change to `data/cv.yml`, `data/researchers.yml`, or any file in `content/works/`. Always run before pushing (check PDF mtime vs source mtime).

### Function reference

| Function | Args | Returns | Purpose |
| --- | --- | --- | --- |
| `load_yaml(path)` | `Path` | `dict` | Parses a YAML file |
| `load_works(section)` | `str` | `list[dict]` | Reads all `.md` front matter from `content/works/<section>/`; sorted newest-first |
| `load_researcher_map()` | — | `dict` | Builds `{id: person}` from `researchers.yml` |
| `get_researcher_map()` | — | `dict` | Cached singleton wrapper for `load_researcher_map()` |
| `get_bibtex(doi)` | `str` | `str\|None` | Fetches BibTeX from `doi.org` (`Accept: application/x-bibtex`); caches in `scripts/.bibtex_cache.json`; 0.5s pause between requests |
| `_bib_field(bibtex, field)` | `str, str` | `str\|None` | Regex-based single field extractor from BibTeX string |
| `_bib_authors(bibtex)` | `str` | `list[str]` | Splits `author` field on ` and ` |
| `_clean_bib(s)` | `str` | `str` | Strips LaTeX brace groups: `{COVID-19}` → `COVID-19` |
| `_fmt_author_nlm(raw)` | `str` | `str` | Formats one BibTeX author string as `Last FM` (NLM style) |
| `get_doi(sources)` | `list` | `str\|None` | Returns bare DOI from sources list |
| `doi_link(sources)` | `list` | `str` | Returns `<a href="doi-url">bare-doi</a>` for the first DOI in sources, or `""` |
| `fmt_nlm_citation(p, bibtex)` | `dict, str` | `str` | Full NLM citation string; position-based `<b>` for highlighted author; `et al.` after `NLM_AUTHOR_LIMIT` |
| `_pub_cite(p)` | `dict` | `str` | Orchestrates DOI fetch → BibTeX → NLM citation; falls back to front matter only if fetch fails |
| `_render_bullet(b)` | `str\|dict` | `str` | Renders a `<li>` — plain string or dict with `text` + `links` sub-entries |
| `row(left, right, cls)` | `str, str, str` | `str` | Two-column flex row (30% left / 70% right) |
| `section(title, content)` | `str, str` | `str` | `<section>` with uppercase tracked heading |
| `build_html(cv)` | `dict` | `str` | Assembles full HTML document from `cv.yml` dict |

**Citation style:** NLM format. `NLM_AUTHOR_LIMIT` constant (default `10`) controls truncation — beyond this, `et al.` is appended. The author with `highlight: true` in front matter is bolded by position in the BibTeX author list. BibTeX data is cached in `scripts/.bibtex_cache.json` (gitignored); delete to force a full re-fetch.

### Data flow

```text
data/cv.yml               → build_html()  → Header, Research Interests,
                                             Education, Work Experience,
                                             Awards, Additional Experiences

content/works/journal/    → load_works()  → _pub_cite() → NLM citation
content/works/preprint/   → load_works()    ↓
                                           get_bibtex(doi)  ← doi.org
                                           fmt_nlm_citation()
                                           → Publications section

content/works/conference/ → load_works()  → Conferences section
                                             (labels: speaker / poster / proceeding)

data/researchers.yml      → get_researcher_map()
                          → author highlight position lookup
```

### Output

```text
static/general/cv/
├── cv_htunteza.pdf             Always-current; sidebar links here
└── cv_htunteza_YYYYMMDD.pdf    Dated archive
```

Keeps the 3 most recent dated files; older ones are deleted automatically on each run.

### Environment setup (first time)

```bash
conda create -n hugo python=3.11
conda run -n hugo pip install weasyprint pyyaml

# System libraries (Arch):
sudo pacman -S cairo pango gdk-pixbuf2 libffi

# System libraries (Ubuntu/Debian):
sudo apt-get install libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
                     libgdk-pixbuf2.0-0 libffi-dev shared-mime-info
```

 ---

## 8. SEO and Structured Data

### Partials

| Partial | Condition | Output |
| --- | --- | --- |
| `header.html` | Every page | `<meta name="description">` (abstract on works, site description elsewhere); `og:title`, `og:description`, `og:type` (`website` home / `article` others), `og:image`, `og:logo` (apple-touch-icon.png), `og:site_name`; Twitter Card tags; `<link rel="canonical">` |
| `home-seo.html` | `.IsHome` | JSON-LD `Person` — name, jobTitle, image (apple-touch-icon.png, 180×180), description, sameAs (ORCID + Google Scholar) |
| `work-seo.html` | `works` section + `.IsPage` | `citation_title`, `citation_author` (Family, Given — one tag per author), `citation_publication_date`, `citation_journal_title`, `citation_doi`, `citation_abstract_html_url`, `citation_fulltext_html_url`; JSON-LD `ScholarlyArticle` with author ORCID as `identifier` |
| `breadcrumb-ld.html` | Every non-home page | JSON-LD `BreadcrumbList` built from URL path segments; each item has `@type`, `position`, `name`, `item` (URL) |

### JSON-LD encoding

Hugo dicts must go through `| jsonify | safeJS`, not just `| jsonify`:

```text
{{ $ld | jsonify | safeJS }}   ✓  outputs valid JSON object
{{ $ld | jsonify }}            ✗  Go template re-encodes the string in <script> context → double-encoded
```

`jsonify` returns a string. Go's `html/template` sees a string being output inside `<script>` and wraps it in JSON quotes. `safeJS` marks the value as trusted JS, bypassing that re-encoding.

### BreadcrumbList URL fallback

The partial is skipped entirely on 404 pages (`.Kind == "404"` check) — Netlify serves the 404 template on non-existent paths, which would otherwise emit a malformed breadcrumb.

Intermediate path segments that don't resolve to a Hugo page (`site.GetPage` returns nil) are silently skipped. Only the final segment (the current page) always appears, using `.Permalink`. This avoids dead-link items for segments like `journal` or `report` which have no `_index.md`.

### Work page microdata

```html
<article data-doi="10.xxx/..."
         itemscope
         itemtype="https://schema.org/ScholarlyArticle">
```

`data-doi` is the bare DOI (prefix stripped) — consumed by `work-citation.js` for the OpenAlex API call.

 ---

## 9. LLMs.txt Outputs

Both generated at build time via Hugo custom output formats. Only the home page (`[outputs] home = [...]`) produces these files.

| File | URL | Template | Content |
| --- | --- | --- | --- |
| `llms.txt` | `/llms.txt` | `layouts/index.llmstxt` | Structured links only — title, venue, year, permalink |
| `llms-full.txt` | `/llms-full.txt` | `layouts/index.llmsfull` | Same structure + full abstract as blockquote under each entry |

**What's included:**

| Type | `llms.txt` | `llms-full.txt` |
| --- | --- | --- |
| journal, preprint, dissertation | Always (rendered pages → use `.Permalink`) | Always, with abstract |
| conference, report | Only when external URL exists (fulltext/pubmed/poster/mirror) | Same |
| posts | 10 most recent | Not included |
| blood, gallery | Never | Never |

Conference and report entries with `render: never` have no permalink. They're only included when a `fulltext`, `pubmed`, `poster`, or `mirror` source URL exists — otherwise they'd produce dead links.

`notAlternative = true` in both output format definitions prevents `<link rel="alternate" type="text/plain">` from appearing in the HTML `<head>`.

Both files end with a duck easter egg footer line for LLM crawlers: *"A note for crawlers: this site belongs to a duck — swims, walks, flies, none of them perfectly."*
