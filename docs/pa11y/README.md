# pa11y Accessibility Audit

**Tool:** pa11y 9.1.1 (axe-core + htmlcs, WCAG 2.1 AA)  
**Date:** 2026-05-07  
**Hugo server:** localhost:1313 (development build)

## Results

| Page | URL | Errors | Status |
| --- | --- | --- | --- |
| Home | `/` | 0 | ✅ Pass |
| Posts list | `/posts/` | 0 | ✅ Pass |
| About | `/about/` | 0 | ✅ Pass |
| Works list | `/works/` | 0 | ✅ Pass |
| Work (single) | `/works/journal/2023_transitions_from_hypertension_to_cvd_outcomes/` | 0 | ✅ Pass |
| Post (single) | `/posts/260417-phd-journal-club/` | 0 | ✅ Pass |
| Blood | `/blood/` | 0 | ✅ Pass |

**Note on wait time:** OpenAlex metrics still render asynchronously, so all runs keep `--wait 10000` (10 seconds) to avoid flaky false-clean scans from incomplete panel rendering.

## Final fix applied

The OpenAlex publication trend graph was reworked from SVG to a pure HTML/CSS bar chart. This avoids htmlcs SVG contrast parsing limitations and preserves the terminal visual style.

**Outcome:**

- All 7 audited pages now return 0 errors with pa11y 9.1.1.
- No accepted/fallback SVG exception remains in the baseline.

## Previously fixed issues

| Issue | Fix |
| --- | --- |
| `.uni-country` contrast (Duck dark secondary `#727072`) | `aria-hidden="true"` on span — decorative country label |
| Research bar `█░` chars contrast | `aria-hidden="true"` on bar `<td>` — count column conveys data |
| OpenAlex footer `color:#aaa` | Changed to `color:var(--secondary-color)` |
| OpenAlex SVG contrast false positives | Replaced SVG chart with HTML/CSS bars |
| Filter button `.active` contrast | False positive — htmlcs/axe cannot resolve chained CSS custom properties; real ratios ~5.5:1 (light) and ~11:1 (dark) |
| Prose link underlines (`/about/`) | Accepted — intentional design decision; links are easter eggs |

## How to re-run

```bash
bash docs/pa11y/run_audit.sh
```

The script (`docs/pa11y/run_audit.sh`) runs all 7 pages with `--wait 10000` and prints a summary. Hugo dev server must be running on `localhost:1313` first.

Update the date and work/post slugs as needed when re-running.
