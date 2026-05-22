#!/usr/bin/env node
// pa11y audit runner — sets Duck (or colorblind) light/dark theme via localStorage
// before each page is tested so contrast checks use the actual site palette.
//
// Usage (called from run_audit.sh):
//   node run_audit.js [palette] [mode] [outDir]
//   palette: duck (default) | colorblind
//   mode:    light (default) | dark
//   outDir:  directory to write CSV files (default: same dir as this script)

const NVM_LIB  = '/home/finer/.config/nvm/versions/node/v25.9.0/lib/node_modules';
const pa11y     = require(`${NVM_LIB}/pa11y`);
const puppeteer = require(`${NVM_LIB}/pa11y/node_modules/puppeteer`);
const fs        = require('fs');
const path      = require('path');

const palette = process.argv[2] || 'duck';
const mode    = process.argv[3] || 'light';
const baseOut = process.argv[4] || __dirname;
const outDir  = path.join(baseOut, `${palette}-${mode}`);
fs.mkdirSync(outDir, { recursive: true });

if (!['duck', 'colorblind'].includes(palette)) {
  console.error(`Unsupported palette: ${palette}`);
  process.exit(1);
}

if (!['light', 'dark'].includes(mode)) {
  console.error(`Unsupported mode: ${mode}`);
  process.exit(1);
}

const BASE = 'http://localhost:1313';

const pages = [
  { name: 'index',       url: `${BASE}/` },
  { name: 'about',       url: `${BASE}/about/` },
  { name: 'works',       url: `${BASE}/works/` },
  { name: 'work_single', url: `${BASE}/works/journal/2023_transitions_from_hypertension_to_cvd_outcomes/` },
  { name: 'posts',       url: `${BASE}/posts/` },
  { name: 'post_single', url: `${BASE}/posts/260417-phd-journal-club/` },
  { name: 'blood',       url: `${BASE}/blood/` },
];

async function main() {
  // Launch a shared browser so we can pre-seed localStorage before pa11y runs.
  const browser = await puppeteer.launch({ headless: true });

  for (const page of pages) {
    process.stdout.write(`Auditing ${page.name} (${page.url}) [theme: ${palette} ${mode}]... `);
    try {
      // Open a page, set localStorage, then pa11y reuses this browser instance.
      const prep = await browser.newPage();
      await prep.goto(page.url, { waitUntil: 'domcontentloaded' });
      await prep.evaluate((p, m) => {
        localStorage.setItem('theme-mode', m);
        localStorage.setItem(`theme-palette-${m}`, p);
      }, palette, mode);
      await prep.close();

      // pa11y opens its own page in the shared browser with the primed storage.
      const result = await pa11y(page.url, {
        standard: 'WCAG2AA',
        wait:     5000,
        timeout:  60000,
        browser,
      });

      const header = 'type,code,message,context,selector\n';
      const rows   = result.issues.map(issue =>
        [issue.type, issue.code, issue.message, issue.context, issue.selector]
          .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ).join('\n');
      const csv = header + (rows ? rows + '\n' : '');
      fs.writeFileSync(path.join(outDir, `${page.name}.csv`), csv);

      console.log(`${result.issues.length} errors`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }

  await browser.close();
}

main();
