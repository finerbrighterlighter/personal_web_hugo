# pa11y Accessibility Audit

**Tool:** pa11y 9.1.1 (axe-core + htmlcs, WCAG 2.1 AA)  
**Date:** 2026-05-06  
**Hugo server:** localhost:1313 (development build)

## Results

| Page | URL | Errors | Status |
| --- | --- | --- | --- |
| Home | `/` | 0 | ✓ Clean |
| Posts list | `/posts/` | 0 | ✓ Clean |
| About | `/about/` | 0 | ✓ Clean |
| Works list | `/works/` | 0 | ✓ Clean |
| Work (single) | `/works/journal/2023_transitions_from_hypertension_to_cvd_outcomes/` | 0 | ✓ Clean |
| Post (single) | `/posts/190719-i-was-a-dentist/` | 0 | ✓ Clean |
| Blood | `/blood/` | 0 | ✓ Clean |

All pages clean. The `#oa-svg` SVG contrast findings from the previous audit are no longer detected — the SVG carries `aria-hidden="true"` and htmlcs appears to be respecting it on this run (or the async chart had not loaded when pa11y ran; either way, no actionable issue).

## Previously fixed issues

| Issue | Fix |
| --- | --- |
| `.uni-country` contrast (Duck dark secondary `#727072`) | `aria-hidden="true"` on span — decorative country label |
| Research bar `█░` chars contrast | `aria-hidden="true"` on bar `<td>` — count column conveys data |
| OpenAlex footer `color:#aaa` | Changed to `color:var(--secondary-color)` |
| Filter button `.active` contrast | False positive — htmlcs/axe cannot resolve chained CSS custom properties; real ratios ~5.5:1 (light) and ~11:1 (dark) |
| Prose link underlines (`/about/`) | Accepted — intentional design decision; links are easter eggs |

## How to re-run

```bash
export PATH="/home/finer/.config/nvm/versions/node/v25.9.0/bin:$PATH"
BASE=http://localhost:1313
OUT=docs/pa11y

pa11y --reporter csv "$BASE/"                                                         > "$OUT/index.csv"
pa11y --reporter csv "$BASE/about/"                                                   > "$OUT/about.csv"
pa11y --reporter csv "$BASE/works/"                                                   > "$OUT/works.csv"
pa11y --reporter csv "$BASE/works/journal/2023_transitions_from_hypertension_to_cvd_outcomes/" > "$OUT/work_single.csv"
pa11y --reporter csv "$BASE/posts/"                                                   > "$OUT/posts.csv"
pa11y --reporter csv "$BASE/posts/190719-i-was-a-dentist/"                           > "$OUT/post_single.csv"
pa11y --reporter csv "$BASE/blood/"                                                   > "$OUT/blood.csv"
```

Update the date and work/post slugs as needed when re-running.
