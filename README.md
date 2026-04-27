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

## 🧩 Sidebar Integrations

Several panels pull data from external services using small JavaScript modules.

Examples include:

* **Last.fm** – recent scrobbles and now playing
* **AniList** – anime watching activity
* **Trakt** – television viewing activity
* **OpenAlex** – publication and citation metrics
* **Unsplash** – photography feed

These integrations rely on public APIs and small client-side scripts.

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
