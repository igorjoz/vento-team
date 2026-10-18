import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const before = process.env.BEFORE_URL || 'http://127.0.0.1:8080';
const after = process.env.BASE_URL || 'http://127.0.0.1:8083';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const reports = [];
try {
  for (const viewport of [{ width: 412, height: 823 }, { width: 1440, height: 1000 }]) {
    const layouts = [];
    for (const url of [before, after]) {
      const page = await browser.newPage({ viewport });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(4500);
      layouts.push(await page.evaluate(() => Object.fromEntries([
        '.hero-title', '.hero-media', '.hero-intro', '.hero-partner-lockup', '.site-header',
        '.roster-grid', '.athlete-mosaic', '.gallery-grid', '.sponsors-grid', '.site-footer',
      ].map(selector => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return [selector, { x: rect.x, y: rect.y, width: rect.width, height: rect.height }];
      }))));
      await page.close();
    }
    for (const selector of Object.keys(layouts[0])) {
      for (const key of ['x', 'y', 'width', 'height']) {
        assert.ok(Math.abs(layouts[0][selector][key] - layouts[1][selector][key]) <= 1.5,
          `${viewport.width}px ${selector}.${key}: ${layouts[0][selector][key]} -> ${layouts[1][selector][key]}`);
      }
    }
    reports.push({ viewport, before: layouts[0], after: layouts[1] });
  }
  await writeFile(process.env.LAYOUT_REPORT || '/tmp/vento-verification/layout.json', JSON.stringify(reports, null, 2));
  console.log('Layout unchanged on mobile and desktop (tolerance 1.5px).');
} finally { await browser.close(); }
