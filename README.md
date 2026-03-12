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

## 🚧 Status

This is a **work in progress** and still under active development.

Things will break.
Layouts will change.
Panels may appear and disappear.

But the site is live, which is always the most important milestone.

---
