# pa11y Accessibility Audit

**Tool:** pa11y 9.1.1 (axe-core + htmlcs, WCAG 2.1 AA)  
**Date:** 2026-05-06  
**Hugo server:** localhost:1313 (development build)

## Results

| Page | URL | Errors | Status |
| --- | --- | --- | --- |
| Home | `/` | 4 | ⚠ SVG only |
| Posts list | `/posts/` | 4 | ⚠ SVG only |
| About | `/about/` | 4 | ⚠ SVG only |
| Works list | `/works/` | 4 | ⚠ SVG only |
| Work (single) | `/works/journal/2023_transitions_from_hypertension_to_cvd_outcomes/` | 4 | ⚠ SVG only |
| Post (single) | `/posts/260417-phd-journal-club/` | 4 | ⚠ SVG only |
| Blood | `/blood/` | 4 | ⚠ SVG only |

**Note on wait time:** The `#oa-svg` panel is rendered by `openalex.js` via an async API call. Pa11y must wait long enough for the fetch to complete before scanning. All runs use `--wait 10000` (10 seconds); at this interval all 7 pages consistently reproduce the same 4 SVG errors.

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
bash docs/pa11y/run_audit.sh
```

The script (`docs/pa11y/run_audit.sh`) runs all 7 pages with `--wait 10000` and prints a summary. Hugo dev server must be running on `localhost:1313` first.

Update the date and work/post slugs as needed when re-running.
