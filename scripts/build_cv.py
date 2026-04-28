#!/usr/bin/env python3
"""
Build CV PDF from YAML data and Hugo works pages.

USAGE
-----
  conda run -n hugo python scripts/build_cv.py

Run this after any change to:
  - data/cv.yml              (personal info, education, experience, awards)
  - content/works/journal/   (new or edited journal publications)
  - content/works/preprint/  (new or edited preprints)
  - content/works/conference/ (new or edited conference entries)

OUTPUT
------
  static/general/cv/cv_htunteza_YYYYMMDD.pdf   dated archive
  static/general/cv/cv_htunteza.pdf            always-current; sidebar links here

The 3 most recent dated files are kept; older ones are deleted automatically.
Commit both files after running so the website picks up the new PDF.

IF THE CONDA ENVIRONMENT DOES NOT EXIST
----------------------------------------
  conda create -n hugo python=3.11
  conda run -n hugo pip install weasyprint pyyaml

WeasyPrint also needs system libraries for font/layout rendering.
On Ubuntu/Debian:
  sudo apt-get install libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
                       libgdk-pixbuf2.0-0 libffi-dev shared-mime-info
On Arch:
  sudo pacman -S cairo pango gdk-pixbuf2 libffi

DATA SOURCES
------------
  data/cv.yml          — all stable personal data (read by this script)
  content/works/       — Hugo front matter parsed for publications/conferences
  data/homepage.yml    — drives the website only; NOT read by this script
"""

import shutil
import yaml
from datetime import datetime
from pathlib import Path
from weasyprint import HTML

# Resolve paths relative to the repo root (one level above scripts/)
ROOT   = Path(__file__).parent.parent
DATA   = ROOT / "data"
WORKS  = ROOT / "content" / "works"
CV_DIR = ROOT / "static" / "general" / "cv"


def load_yaml(path):
    with open(path) as f:
        return yaml.safe_load(f)


def load_works(section):
    """Read all .md files in content/works/<section>/ and return their front matter.

    Files that don't start with '---' (no front matter) are skipped.
    Results are sorted newest-first by the 'date' field.
    """
    pages = []
    for md in (WORKS / section).glob("*.md"):
        text = md.read_text()
        if text.startswith("---"):
            # Split on the closing '---' to extract just the front matter block
            raw = text.split("---", 2)[1]
            fm = yaml.safe_load(raw)
            if fm:
                pages.append(fm)
    pages.sort(key=lambda x: str(x.get("date", "")), reverse=True)
    return pages


def load_researcher_map():
    """Build a flat {id: {given, family, ...}} dict from data/researchers.yml."""
    rm = {}
    for p in load_yaml(DATA / "researchers.yml"):
        if p.get("id"):
            rm[p["id"]] = p
    return rm


_RESEARCHER_MAP = None


def get_researcher_map():
    global _RESEARCHER_MAP
    if _RESEARCHER_MAP is None:
        _RESEARCHER_MAP = load_researcher_map()
    return _RESEARCHER_MAP


def fmt_authors(authors):
    """Format an authors list into 'Family I, Family I, ...' with bolded highlights.

    Each author entry may have either an 'id' (looked up from researchers.yml)
    or inline 'family'/'given' fields. highlight: true bolds the name.
    """
    rm = get_researcher_map()
    parts = []
    for a in authors:
        if a.get("id"):
            person = rm.get(a["id"], {})
            given  = person.get("given", a.get("given", ""))
            family = person.get("family", a.get("family", ""))
        else:
            given  = a.get("given", "")
            family = a.get("family", "")
        name = f"{family} {given[0]}" if given else family
        parts.append(f"<b>{name}</b>" if a.get("highlight") else name)
    return ", ".join(parts)


def doi_link(sources):
    """Return an HTML <a> tag for the first DOI found in a sources list, or ''."""
    for s in sources or []:
        url = s.get("url", "")
        if "doi.org" in url:
            # Show only the DOI identifier, not the full resolver URL
            short = url.replace("https://doi.org/", "").replace("http://doi.org/", "")
            return f'<a href="{url}">{short}</a>'
    return ""


def _render_bullet(b):
    """Render a single bullet, which may be a plain string or a dict with links.

    Plain string:
        "Some bullet text"

    Dict with optional sub-links (shown as small muted text below the bullet):
        text: "Some bullet text"
        links:
          - {label: "Display name", url: "https://..."}
    """
    if isinstance(b, str):
        return f"<li>{b}</li>"
    text  = b["text"]
    links = b.get("links", [])
    link_html = " &nbsp;·&nbsp; ".join(
        f'<a href="{l["url"]}">{l["label"]}</a>' for l in links
    )
    suffix = f'<span class="bullet-links">{link_html}</span>' if link_html else ""
    return f"<li>{text}{suffix}</li>"


def row(left, right, cls=""):
    """Wrap left/right content in the two-column flex row used throughout the CV."""
    c = f' {cls}' if cls else ''
    return f'<div class="row{c}"><div class="col-l">{left}</div><div class="col-r">{right}</div></div>'


def section(title, content):
    """Wrap content in a <section> with an uppercase tracked heading."""
    return f'<section><h2>{title}</h2>{content}</section>'


def build_html(cv):
    """Assemble the full HTML document from the cv dict and works pages."""
    contact = cv["contact"]

    # ── Header ──────────────────────────────────────────────────────────────
    header = f"""<header>
      <h1>{cv['header']['name'].upper()}</h1>
      <p class="address">{cv['header']['address']}</p>
      <p class="contact">
        {contact['phone']} &nbsp;&middot;&nbsp;
        <a href="mailto:{contact['email']}">{contact['email']}</a> &nbsp;&middot;&nbsp;
        <a href="{contact['website']}">{contact['website']}</a>
      </p>
    </header>"""

    # ── Research Interests ───────────────────────────────────────────────────
    # Single row: left column empty, right column is a semicolon-separated list
    interests = section("Research Interests",
        row("", "; ".join(cv["research_interests"])))

    # ── Education ────────────────────────────────────────────────────────────
    edu_rows = ""
    for e in cv["education"]:
        left  = f'<span class="date">{e["time"]}</span>'
        left += f'<br><span class="inst">{e["university"]}</span>'
        if e.get("ranking"):
            left += f'<br><span class="meta">{e["ranking"]}</span>'

        right  = f'<span class="role">{e["degree"]}</span>'
        right += f'<br><span class="field">{e["field"]}</span>'
        if e.get("thesis"):
            right += f'<br><span class="detail">Thesis: {e["thesis"]}</span>'
        if e.get("note"):
            right += f'<br><span class="detail">{e["note"]}</span>'

        edu_rows += row(left, right)
    education = section("Education", edu_rows)

    # ── Work Experience ───────────────────────────────────────────────────────
    exp_rows = ""
    for e in cv["work_experience"]:
        left  = f'<span class="date">{e["time"]}</span>'
        left += f'<br><span class="inst">{e["institution"]}</span>'

        # Bullets can be plain strings or dicts with sub-links; _render_bullet handles both
        bullets = "".join(_render_bullet(b) for b in e.get("bullets", []))
        right   = f'<span class="role">{e["role"]}</span>'
        right  += f'<ul class="bullets">{bullets}</ul>'

        exp_rows += row(left, right)
    experience = section("Work Experience", exp_rows)

    # ── Awards ────────────────────────────────────────────────────────────────
    award_rows = ""
    for a in cv["awards"]:
        left  = f'<span class="date">{a["year"]}</span>'
        right = f'<span class="role">{a["title"]}</span><br><span class="inst">{a["institution"]}</span>'
        award_rows += row(left, right)
    awards = section("Awards", award_rows)

    # ── Additional Relevant Experiences ───────────────────────────────────────
    extra_rows = ""
    for e in cv["additional_experiences"]:
        # No date column here; institution name goes in the left column
        left    = f'<span class="inst">{e["institution"]}</span>'
        bullets = "".join(f"<li>{b}</li>" for b in e.get("bullets", []))
        right   = f'<span class="role">{e["title"]}</span><ul class="bullets">{bullets}</ul>'
        extra_rows += row(left, right)
    additional = section("Additional Relevant Experiences", extra_rows)

    # ── Publications ──────────────────────────────────────────────────────────
    # Pulled from content/works/journal/ and content/works/preprint/
    # To add a publication: create a works page — it appears here automatically on next run.
    journals  = load_works("journal")
    preprints = load_works("preprint")

    pub_rows = ""
    for p in journals:
        year    = str(p.get("date", ""))[:4]  # date field is YYYY-MM-DD; take year only
        authors = fmt_authors(p.get("authors", []))
        doi     = doi_link(p.get("sources"))
        cite    = (f'{authors} {p["title"]}. '
                   f'<i>{p.get("venue", "")}</i>.')
        if doi:
            cite += f' doi: {doi}'
        pub_rows += row(f'<span class="date">{year}</span>', cite)

    if preprints:
        pub_rows += f'<div class="sub-header">Preprints and Under Review</div>'
        for p in preprints:
            year    = str(p.get("date", ""))[:4]
            authors = fmt_authors(p.get("authors", []))
            doi     = doi_link(p.get("sources"))
            cite    = f'{authors} {p["title"]}. <i>{p.get("venue", "")}</i>.'
            if doi:
                cite += f' doi: {doi}'
            pub_rows += row(f'<span class="date">{year}</span>', cite)

    publications = section("Publications", pub_rows)

    # ── Conferences ───────────────────────────────────────────────────────────
    # Pulled from content/works/conference/
    # The 'type' front matter field maps to a short label shown in the left column.
    conferences = load_works("conference")
    conf_rows   = ""
    type_label  = {
        "conference-speaking":   "Speaker",
        "conference-poster":     "Poster",
        "conference-proceeding": "Proceeding",
    }
    for c in conferences:
        year  = str(c.get("date", ""))[:4]
        label = type_label.get(c.get("type", ""), "")
        left  = f'<span class="date">{year}</span>'
        if label:
            left += f'<br><span class="tag">{label}</span>'
        right  = f'<span class="role">{c["title"]}</span>'
        right += f'<br><span class="inst">{c.get("venue", "")}</span>'
        conf_rows += row(left, right)
    conferences_sec = section("Conferences", conf_rows)

    body = (header + interests + education + experience + awards
            + additional + publications + conferences_sec)

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>{CSS}</style>
</head>
<body>{body}</body>
</html>"""


# ── Stylesheet ────────────────────────────────────────────────────────────────
# Lato fetched from Google Fonts at build time (requires internet access).
# Layout: A4, two-column rows (30% left / 70% right) throughout.
# To adjust column widths, change the width/min-width on .col-l.
CSS = """
@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,700;1,400&display=swap');

@page { margin: 2cm 2.2cm; size: A4; }

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: Lato, "Helvetica Neue", Arial, sans-serif;
  font-size: 10pt;
  color: #1a1a1a;
  line-height: 1.55;
}

/* ── Header ─────────────────────────────────────────────────── */
header {
  margin-bottom: 18pt;
  padding-bottom: 10pt;
  border-bottom: 1pt solid #1a1a1a;
}
h1 {
  font-size: 21pt;
  font-weight: bold;
  letter-spacing: 4pt;
  margin-bottom: 5pt;
}
.address {
  font-size: 8.5pt;
  color: #555;
  margin-bottom: 1pt;
}
.contact {
  font-size: 8.5pt;
  color: #555;
}

/* ── Section headers ─────────────────────────────────────────── */
section { margin-bottom: 12pt; }

h2 {
  font-size: 7.5pt;
  letter-spacing: 2.5pt;
  text-transform: uppercase;
  color: #666;
  font-weight: bold;
  border-top: 0.5pt solid #bbb;
  padding-top: 5pt;
  margin-bottom: 7pt;
}

/* Italic sub-label inside publications, e.g. "Preprints and Under Review" */
.sub-header {
  font-size: 8.5pt;
  font-style: italic;
  color: #666;
  margin: 8pt 0 4pt;
  padding-left: 30%;
}

/* ── Two-column rows ─────────────────────────────────────────── */
.row {
  display: flex;
  margin-bottom: 7pt;
  page-break-inside: avoid;
}
.col-l {
  width: 30%;
  min-width: 30%;
  padding-right: 14pt;
  font-size: 8.5pt;
  color: #555;
  line-height: 1.5;
}
.col-r {
  flex: 1;
  font-size: 9.5pt;
  line-height: 1.55;
}

/* ── Type tokens ─────────────────────────────────────────────── */
.date   { font-size: 8.5pt; color: #333; }
.inst   { font-style: italic; color: #555; font-size: 8.5pt; }
.meta   { font-size: 7.5pt; color: #888; }
.role   { font-weight: bold; font-size: 9.5pt; }
.field  { font-style: italic; font-size: 9pt; color: #333; }
.detail { font-size: 8.5pt; color: #444; }
.tag {
  font-size: 7pt;
  letter-spacing: 1pt;
  text-transform: uppercase;
  color: #888;
}

/* ── Bullet lists ────────────────────────────────────────────── */
.bullets {
  margin: 3pt 0 0;
  padding: 0;
  list-style: none;
  font-size: 9pt;
}
.bullets li {
  padding-left: 11pt;
  text-indent: -11pt;
  margin-bottom: 1.5pt;
}
.bullets li::before { content: "· "; color: #888; }

/* Sub-links rendered below a bullet (e.g. project URLs) */
.bullet-links {
  display: block;
  text-indent: 0;
  padding-left: 11pt;
  font-size: 7.5pt;
  color: #888;
  margin-top: 1pt;
}

/* ── Links ───────────────────────────────────────────────────── */
a { color: #1a1a1a; text-decoration: none; }
"""


if __name__ == "__main__":
    CV_DIR.mkdir(parents=True, exist_ok=True)

    cv   = load_yaml(DATA / "cv.yml")
    html = build_html(cv)

    today   = datetime.now().strftime("%Y%m%d")
    dated   = CV_DIR / f"cv_htunteza_{today}.pdf"
    current = CV_DIR / "cv_htunteza.pdf"

    # Write the dated archive first, then copy to the stable filename
    HTML(string=html, base_url=str(ROOT)).write_pdf(dated)
    shutil.copy2(dated, current)

    # Prune: keep only the 3 most recent dated files
    dated_files = sorted(CV_DIR.glob("cv_htunteza_2*.pdf"), reverse=True)
    for old in dated_files[3:]:
        old.unlink()
        print(f"Removed old version: {old.name}")

    versions = [f.name for f in sorted(CV_DIR.glob("cv_htunteza_2*.pdf"), reverse=True)]
    print(f"Written:  {dated.name}")
    print(f"Current:  {current.name}")
    print(f"Versions: {versions}")
