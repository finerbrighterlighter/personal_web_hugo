#!/usr/bin/env node
// pa11y audit runner — sets Duck (or colorblind) light theme via localStorage
// before each page is tested so contrast checks use the actual site palette.
//
// Usage (called from run_audit.sh):
//   node run_audit.js [palette] [outDir]
//   palette: duck (default) | colorblind
//   outDir:  directory to write CSV files (default: same dir as this script)

const NVM_LIB  = '/home/finer/.config/nvm/versions/node/v25.9.0/lib/node_modules';
const pa11y     = require(`${NVM_LIB}/pa11y`);
const puppeteer = require(`${NVM_LIB}/pa11y/node_modules/puppeteer`);
const fs        = require('fs');
const path      = require('path');

const palette = process.argv[2] || 'duck';
const baseOut = process.argv[3] || __dirname;
const outDir  = path.join(baseOut, palette);
fs.mkdirSync(outDir, { recursive: true });

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
    process.stdout.write(`Auditing ${page.name} (${page.url}) [theme: ${palette} light]... `);
    try {
      // Open a page, set localStorage, then pa11y reuses this browser instance.
      const prep = await browser.newPage();
      await prep.goto(page.url, { waitUntil: 'domcontentloaded' });
      await prep.evaluate((p) => {
        localStorage.setItem('theme-mode', 'light');
        localStorage.setItem('theme-palette-light', p);
      }, palette);
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
