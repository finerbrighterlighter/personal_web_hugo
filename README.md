# htunteza.com

[![Netlify Status](https://api.netlify.com/api/v1/badges/ca043d57-11d9-487c-9e6f-dae968d5ccc7/deploy-status)](https://app.netlify.com/projects/hugoteza/deploys)

Personal website for [Htun Teza](https://htunteza.com): a Hugo site built around terminal UI patterns, research outputs, and live panels.

Previous version (Jekyll): [finerbrighterlighter.github.io](https://github.com/finerbrighterlighter/finerbrighterlighter.github.io)

For full implementation details, data schemas, and template internals, use [docs/reference.md](docs/reference.md) as the canonical source.

---

## Start Here

Run locally:

```bash
hugo server
```

Production build:

```bash
hugo --gc --minify
```

Site roots:

- English: /
- Burmese: /mm/

Optional API env vars for live panels:

```bash
HUGO_UNSPLASH_KEY
HUGO_TRAKT_KEY
HUGO_TMDB_KEY
HUGO_LASTFM_KEY
```

---

## Stack

- Generator: [Hugo](https://gohugo.io)
- Hosting and CI: [Netlify](https://www.netlify.com)
- Theme base: [hugo-theme-console](https://github.com/mrmierzejewski/hugo-theme-console/)
- Analytics: [GoatCounter](https://www.goatcounter.com)

---

## What The Site Contains

| URL | Template | Notes |
| --- | --- | --- |
| / | [layouts/index.html](layouts/index.html) | Career profile, recent works, latest posts |
| /works/ | [layouts/_default/works.html](layouts/_default/works.html) | Publications with filters |
| /works/<type>/<slug>/ | [layouts/_default/work.html](layouts/_default/work.html) | Work detail page |
| /posts/ | [layouts/_default/list.html](layouts/_default/list.html) | Posts grouped by year |
| /blood/ | [layouts/_default/blood.html](layouts/_default/blood.html) | Donation centers + image gallery |
| /about/ | [layouts/about/single.html](layouts/about/single.html) | Hidden from top nav; reachable via footer link |

Work page rendering rules:

- Rendered: journal, preprint, dissertation, conference-proceeding, under-review
- Not rendered (list only): conference-speaking, conference-poster, report

Those non-rendered entries can still appear in listing and discovery outputs when they have external links.

---

## Multilingual Model

Hugo multilingual is enabled with English default and Burmese as secondary language.

- English stays at root /
- Burmese uses /mm/

Translated areas:

- Homepage content and sidebar data
- Blood page content and labels
- Shared UI strings in i18n

Intentionally English areas:

- Works and posts content collections

Important nav behavior:

- Links should be language-aware only when a page exists in current language.
- If a translated target does not exist, nav should fall back to the default URL.

---

## Layout and UX Highlights

Three-column shell layout is defined in [layouts/_default/baseof.html](layouts/_default/baseof.html).

- Left: profile sidebar and contact data
- Center: section content
- Right: collapsible live data panels

Notable interactive behavior:

- Typed command header with section-aware hostnames
- Color palette switcher including colorblind-safe mode
- Footer language switch control
- Work pages switch typed command to less paper.pdf

---

## Fonts

Current active fonts are intentionally minimal:

- Roboto Mono for baseline UI
- ArchitectsDaughter for Latin handwriting style on Burmese pages
- Thit_Sar_Shwe_Si for Myanmar script on Burmese pages

The Burmese switch is applied at page level via html:lang(my) in [static/hugo-theme-console/css/console.css](static/hugo-theme-console/css/console.css).

---

## Data and Authoring

Main data sources:

- [data/homepage.yml](data/homepage.yml)
- [data/homepage_mm.yml](data/homepage_mm.yml)
- [data/researchers.yml](data/researchers.yml)
- [data/blood.yml](data/blood.yml)
- [data/blood_mm.yml](data/blood_mm.yml)

Common workflows:

1. Add a post: create bundle under content/posts/
2. Add a work: create front matter entry under content/works/<type>/
3. Add collaborator: update data/researchers.yml and reference id in work authors
4. Update Burmese homepage text: edit data/homepage_mm.yml
5. Update Burmese blood page content: edit data/blood_mm.yml

---

## CV Generation

CV PDF is generated from YAML and works metadata via [scripts/build_cv.py](scripts/build_cv.py).

Run:

```bash
conda run -n hugo python scripts/build_cv.py
```

Outputs:

- static/general/cv/cv_htunteza.pdf
- dated archives in the same folder

---

## Discovery Outputs

The site also builds:

- /llms.txt
- /llms-full.txt

Generated via custom Hugo output formats from layout templates.

---

## Why It Feels This Way

The site intentionally behaves like a working terminal, not a static portfolio template.

- Windows collapse and refresh like tools, not cards.
- Commands type with mistakes and corrections.
- Theme choices are functional and personal, not purely decorative.

The goal is clarity with character.

---

## Attributions

- [Thit Sar Shwe Si font](https://www.facebook.com/share/p/1LQYFSUkXy/) by [Phoenix Digital Art](https://www.facebook.com/PhoenixDigitalArt)
- [Eye test icons](https://www.flaticon.com/free-icons/eye-test) by Freepik on Flaticon
- [Duck favicon](https://www.magnific.com/icon/duck_530260) by Magnific - Roundicons
