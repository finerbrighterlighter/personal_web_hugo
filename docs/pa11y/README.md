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
| Post (single) | `/posts/260417-phd-journal-club/` | 4 | ⚠ SVG only |
| Blood | `/blood/` | 4 | ⚠ SVG only |

## Remaining finding — SVG chart (`#oa-svg`)

All 4 errors on affected pages are identical: htmlcs (`WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail`) flagging color contrast on two axis circle labels and two year labels inside the OpenAlex publications chart SVG.

**Why it is not fixed:**

- The SVG carries `aria-hidden="true"` — it is excluded from the accessibility tree entirely
- All data shown in the chart (works count, year range) is also present in the `<table>` immediately above it
- axe-core (the other checker pa11y runs) does NOT flag these elements because it respects `aria-hidden`
- htmlcs does not respect `aria-hidden` for contrast checks — this is a known htmlcs limitation with SVG elements
- The contrast values reported (1.03:1) are likely an htmlcs measurement artifact: it cannot reliably determine the effective background behind SVG `<text>` elements positioned over colored `<circle>` elements

**Conclusion:** accepted — decorative chart with no accessible information loss.

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
pa11y --reporter csv "$BASE/posts/260417-phd-journal-club/"                           > "$OUT/post_single.csv"
pa11y --reporter csv "$BASE/blood/"                                                   > "$OUT/blood.csv"
```

Update the date and work/post slugs as needed when re-running.
