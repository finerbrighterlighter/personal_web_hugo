# pa11y Accessibility Audit

**Tool:** pa11y 9.1.1 (htmlcs, WCAG 2.1 AA)
**Date:** 2026-05-30
**Hugo server:** localhost:1313 (development build)

## Scope

Contrast is **only assured for Duck light, Duck dark, Colorblind light, and Colorblind dark** — the four theme variants with accessibility commitments. Other themes (nord, catppuccin, dracula, etc.) are not tested and may not meet WCAG AA contrast ratios.

---

## Duck light — 2026-05-22

| Page | Errors | Status |
| --- | --- | --- |
| Home `/` | 0 | ✅ Pass |
| About `/about/` | 0 | ✅ Pass |
| Works `/works/` | 0 | ✅ Pass |
| Work (single) | 0 | ✅ Pass |
| Posts `/posts/` | 0 | ✅ Pass |
| Post (single) | 0 | ✅ Pass |
| Blood `/blood/` | 0 | ✅ Pass |

**All 7 pages pass with 0 errors.**

---

## Colorblind light — 2026-05-22

| Page | Errors | Status |
| --- | --- | --- |
| Home `/` | 0 | ✅ Pass |
| About `/about/` | 0 | ✅ Pass |
| Works `/works/` | 0 | ✅ Pass |
| Work (single) | 0 | ✅ Pass |
| Posts `/posts/` | 0 | ✅ Pass |
| Post (single) | 0 | ✅ Pass |
| Blood `/blood/` | 0 | ✅ Pass |

**All 7 pages pass with 0 errors.**

`--error-color` changed from Okabe Vermillion `#d55e00` (3.71:1) to `#4d0000` (15.29:1 on `#fafafa`) to meet WCAG AA.

---

## Duck dark — 2026-05-22

| Page | Errors | Status |
| --- | --- | --- |
| Home `/` | 0 | ✅ Pass |
| About `/about/` | 0 | ✅ Pass |
| Works `/works/` | 0 | ✅ Pass |
| Work (single) | 0 | ✅ Pass |
| Posts `/posts/` | 0 | ✅ Pass |
| Post (single) | 0 | ✅ Pass |
| Blood `/blood/` | 0 | ✅ Pass |

**All 7 pages pass with 0 errors.**

`--secondary-color` changed from `#727072` to `#aaa7aa` and `--error-color` changed from `#ff6188` to `#ff7a9d` so secondary/error text meets WCAG AA on dark panels.

---

## Colorblind dark — 2026-05-22

| Page | Errors | Status |
| --- | --- | --- |
| Home `/` | 0 | ✅ Pass |
| About `/about/` | 0 | ✅ Pass |
| Works `/works/` | 0 | ✅ Pass |
| Work (single) | 0 | ✅ Pass |
| Posts `/posts/` | 0 | ✅ Pass |
| Post (single) | 0 | ✅ Pass |
| Blood `/blood/` | 0 | ✅ Pass |

**All 7 pages pass with 0 errors.**

`--error-color` changed from Okabe Vermillion `#d55e00` to `#f07000` so error text meets WCAG AA on dark panels.

---

## How to re-run

```bash
# Duck light (default) — results in docs/pa11y/duck-light/
bash docs/pa11y/run_audit.sh

# Colorblind light — results in docs/pa11y/colorblind-light/
bash docs/pa11y/run_audit.sh colorblind light

# Duck dark — results in docs/pa11y/duck-dark/
bash docs/pa11y/run_audit.sh duck dark

# Colorblind dark — results in docs/pa11y/colorblind-dark/
bash docs/pa11y/run_audit.sh colorblind dark
```

The script launches a shared Puppeteer browser, pre-seeds `localStorage` (`theme-mode=<mode>`, `theme-palette-<mode>=<palette>`) before each page, then runs pa11y so the inline theme script applies the correct palette on load. Hugo dev server must be running on `localhost:1313` first.

Update the work and post slugs in `run_audit.js` when auditing different pages.

---

## Previously fixed issues

| Issue | Fix |
| --- | --- |
| `.uni-country` contrast (old Duck dark secondary `#727072`) | `aria-hidden="true"` on span — decorative country label |
| Research bar `█░` chars contrast | `aria-hidden="true"` on bar `<td>` — count column conveys data |
| OpenAlex footer `color:#aaa` | Changed to `color:var(--secondary-color)` |
| OpenAlex SVG contrast false positives | Replaced SVG chart with HTML/CSS bars |
| Filter button `.active` contrast | False positive — htmlcs/axe cannot resolve chained CSS custom properties; real ratios ~5.5:1 (light) and ~11:1 (dark) |
| Prose link underlines (`/about/`) | Accepted — intentional design decision; links are easter eggs |
| All errors were false positives (previous runs) | Previous pa11y runs had no theme applied — CSS variables computed as empty strings, generating spurious contrast failures. Fixed by pre-seeding localStorage before each audit. |
| Colorblind light `.api-error` / `.nf-line-err` contrast | Changed `--error-color` from `#d55e00` (3.71:1) to `#4d0000` (15.29:1) |
| GitHub language bar glyph contrast | Replaced text glyph bar segments with CSS background blocks; the repository link and tooltip still convey the useful information. |
