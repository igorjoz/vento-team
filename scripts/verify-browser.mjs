import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const output = process.env.REPORT_DIR || '/tmp/vento-verification/after';
const baseline = process.env.BASELINE === '1';

async function verifyAthleteFilters(page) {
  const filters = page.getByRole('group', { name: 'Filtruj zdjęcia zawodników' });
  const photos = page.locator('.athlete-photo');
  const everyone = filters.getByRole('button', { name: 'Wszyscy', exact: true });
  assert.deepEqual(await filters.getByRole('button').allTextContents(), ['Wszyscy', 'Igor', 'Wiktor', 'Cezary', 'Zuzia']);
  assert.equal(await everyone.getAttribute('aria-pressed'), 'true');
  assert.equal(await photos.count(), 25);
  const manifest = JSON.parse(await readFile(new URL('../src/generated/images.json', import.meta.url), 'utf8'));
  const originals = new Map(Object.entries(manifest).map(([source, image]) => [image.webp.at(-1).src, source]));
  const originalOrder = await photos.locator('img').evaluateAll(images => images.map(image => image.getAttribute('src')));

  for (const [name, count] of [['Igor', 8], ['Wiktor', 4], ['Cezary', 3], ['Zuzia', 11]]) {
    const filter = filters.getByRole('button', { name, exact: true });
    await filter.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(count => document.querySelectorAll('.athlete-photo').length === count, count);
    assert.equal(await filter.getAttribute('aria-pressed'), 'true');
    assert.equal(await filters.locator('[aria-pressed="true"]').count(), 1);
    const labels = await photos.locator('.athlete-photo-label').allTextContents();
    assert.ok(labels.every(label => label.split(' · ').includes(name)));
    const sources = await photos.locator('img').evaluateAll(images => images.map(image => image.getAttribute('src')));
    assert.deepEqual(sources, originalOrder.filter(source => sources.includes(source)), 'Filtering preserves photo order');
    assert.equal(labels.includes('Wiktor · Cezary'), name === 'Wiktor' || name === 'Cezary');
    await assertMosaicLayout(page);

    const alts = await photos.locator('img').evaluateAll(images => images.map(image => image.alt));
    const thumbnail = photos.first();
    await thumbnail.click();
    await page.getByRole('dialog').waitFor();
    const assertImage = async index => {
      await page.waitForFunction(alt => document.querySelector('.lightbox-full')?.alt === alt, alts[index]);
      assert.equal(await page.locator('.lightbox-toolbar small').innerText(), `${String(index + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`);
      assert.equal(await page.locator('.lightbox-full').getAttribute('src'), originals.get(sources[index]), 'Lightbox photo matches the filtered thumbnail');
    };
    await assertImage(0);
    await page.keyboard.press('ArrowLeft');
    await assertImage(count - 1);
    await page.getByRole('button', { name: 'Następne zdjęcie', exact: true }).click();
    await assertImage(0);
    await page.keyboard.press('ArrowRight');
    await assertImage(1);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    await page.waitForFunction(() => document.activeElement?.classList.contains('athlete-photo'));
    assert.equal(await thumbnail.evaluate(element => document.activeElement === element), true);
  }
  await everyone.click();
  await page.waitForFunction(() => document.querySelectorAll('.athlete-photo').length === 25);
  assert.deepEqual(await photos.locator('img').evaluateAll(images => images.map(image => image.getAttribute('src'))), originalOrder);
  await assertMosaicLayout(page);
}

async function assertMosaicLayout(page) {
  await page.waitForFunction(() => {
    const mosaic = document.querySelector('.athlete-mosaic');
    const items = [...mosaic.querySelectorAll('.athlete-photo')];
    const boxes = items.map(item => ({ x: item.offsetLeft, y: item.offsetTop, width: item.offsetWidth, height: item.offsetHeight }));
    const contained = boxes.every(box => box.x >= 0 && box.y >= 0 && box.x + box.width <= mosaic.clientWidth + 1 && box.y + box.height <= mosaic.clientHeight + 1);
    const noOverlap = boxes.every((box, i) => boxes.slice(i + 1).every(other =>
      box.x + box.width <= other.x + 1 || other.x + other.width <= box.x + 1 ||
      box.y + box.height <= other.y + 1 || other.y + other.height <= box.y + 1));
    const bottom = Math.max(0, ...boxes.map(box => box.y + box.height));
    return contained && noOverlap && Math.abs(bottom - mosaic.clientHeight) <= 2;
  });
}

async function verifyRosterLayout(page, output) {
  for (const width of [375, 440, 441, 768, 1024, 1100, 1101, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await assertMosaicLayout(page);
    const cards = page.locator('.rider-card');
    assert.equal(await cards.count(), 8);
    assert.deepEqual(await cards.locator('.rider-topline').allTextContents(), ['01', '02', '03', '04', '05', '06', '07', '08']);
    assert.deepEqual(await page.locator('.rider-card:not(.rider-card-upcoming) h3').allTextContents(), ['Igor', 'Wiktor', 'Cezary', 'Zuzia']);
    assert.equal(await page.locator('.rider-card-upcoming').count(), 4);
    assert.equal(await page.locator('.rider-card-upcoming a, .rider-card-upcoming button, .rider-card-upcoming img').count(), 0);
    assert.equal(await page.locator('.roster-grid').evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length), width > 1100 ? 4 : width > 440 ? 2 : 1);
    const validCards = await cards.evaluateAll(cards => cards.every(card => {
      const { width, height } = card.getBoundingClientRect();
      const content = card.querySelector('.rider-content');
      const heading = content.querySelector('h3');
      return Math.abs(width / height - 3 / 4) < 0.01 && content.scrollWidth <= content.clientWidth &&
        heading.scrollWidth <= heading.clientWidth && content.offsetTop >= card.querySelector('.rider-topline').offsetHeight;
    }));
    assert.equal(validCards, true, `${width}px: cards keep their proportions and fit their content`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px: no horizontal overflow`);
    if ([375, 768, 1024, 1440].includes(width)) {
      await page.mouse.move(0, 0);
      await page.locator('.rider-photo img').evaluateAll(async images => {
        images.forEach(image => { image.loading = 'eager'; });
        await Promise.all(images.map(image => image.decode()));
      });
      await page.locator('.roster-grid').screenshot({ path: `${output}/roster-${width}.png`, style: '.site-header { visibility: hidden !important; }' });
    }
  }
}

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = [];
try {
  for (const [name, viewport] of [['mobile', { width: 412, height: 823 }], ['desktop', { width: 1440, height: 1000 }]]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: name === 'mobile', hasTouch: name === 'mobile' });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const errors = [], violations = [], failedResponses = [];
    const imageResponses = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
      if (response.request().resourceType() === 'image') imageResponses.push(response);
    });
    await page.exposeFunction('captureViolation', violation => violations.push(violation));
    await page.addInitScript(() => document.addEventListener('securitypolicyviolation', event => {
      window.captureViolation({ directive: event.violatedDirective, blockedURI: event.blockedURI, disposition: event.disposition });
    }));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.start');
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);
    await page.screenshot({ path: `${output}/${name}-hero.png` });
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < scrollHeight; y += 500) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${output}/${name}-full.png`, fullPage: true });
    await page.locator('.rider-card').first().screenshot({ path: `${output}/${name}-rider.png` });
    await page.locator('.gallery-item-featured').screenshot({ path: `${output}/${name}-race.png` });
    if (!baseline) {
      const undersized = await page.locator('.responsive-picture img').evaluateAll(images => images.flatMap(image => {
        const width = Number(image.currentSrc.match(/-(\d+)\.(?:avif|webp)$/)?.[1]);
        const required = Math.max(image.clientWidth, image.clientHeight * image.naturalWidth / image.naturalHeight);
        return width && width < Math.min(required, 1920) * 0.9 ? [{ src: image.currentSrc, width, required }] : [];
      }));
      assert.deepEqual(undersized, [], 'Cover images need enough pixels for their cropped size');
    }
    const images = await Promise.all(imageResponses.map(async response => ({ url: new URL(response.url()).pathname, bytes: (await response.body()).length })));
    const uniqueImages = [...new Map(images.map(image => [image.url, image])).values()];
    const imageBytes = uniqueImages.reduce((sum, image) => sum + image.bytes, 0);
    const { profile } = await cdp.send('Profiler.stop');
    await writeFile(`${output}/${name}.cpuprofile`, JSON.stringify(profile));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(500);
    if (name === 'mobile') {
      await page.getByRole('button', { name: 'Otwórz menu', exact: true }).click();
      await page.getByRole('navigation', { name: 'Sekcje strony' }).getByRole('link', { name: 'Galeria' }).waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('button', { name: 'Otwórz menu', exact: true }).getAttribute('aria-expanded'), 'false');
    } else {
      await page.mouse.move(250, 350);
      await page.waitForTimeout(100);
      assert.equal(await page.locator('.site-shell').evaluate(el => el.style.getPropertyValue('--pointer-x')), '250px');
    }
    if (!baseline) await verifyAthleteFilters(page);
    const thumbnail = page.locator('.athlete-photo').first();
    await cdp.send('Profiler.start');
    await thumbnail.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await page.locator('.lightbox-full.is-loaded').waitFor();
    if (!baseline) {
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true, 'Focus must stay in the lightbox');
      }
    }
    await page.getByRole('button', { name: 'Powiększ zdjęcie', exact: true }).click();
    await page.keyboard.press('+');
    if (!baseline) assert.equal(await page.locator('.lightbox-actions > span').innerText(), '150%');
    for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Powiększ zdjęcie', exact: true }).click();
    const stage = await page.locator('.lightbox-stage').boundingBox();
    await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
    await page.mouse.down();
    await page.mouse.move(stage.x + stage.width / 2 + 80, stage.y + stage.height / 2 + 60, { steps: 10 });
    await page.mouse.up();
    const transform = await page.locator('.lightbox-full').evaluate(el => el.style.transform);
    assert.match(transform, /scale\(3\)/);
    assert.ok(!transform.includes('translate3d(0px, 0px'), 'Panning should move the zoomed image');
    await page.screenshot({ path: `${output}/${name}-lightbox.png` });
    if (!baseline) {
      await page.setViewportSize({ width: viewport.width - 40, height: viewport.height - 120 });
      await page.waitForTimeout(200);
      assert.equal(await page.locator('.lightbox-full').evaluate(image => {
        const matrix = new DOMMatrix(getComputedStyle(image).transform);
        const fit = Math.min(image.clientWidth / image.naturalWidth, image.clientHeight / image.naturalHeight);
        const maxX = Math.max(0, (image.naturalWidth * fit * 3 - image.clientWidth) / 2);
        const maxY = Math.max(0, (image.naturalHeight * fit * 3 - image.clientHeight) / 2);
        return Math.abs(matrix.m41) <= maxX + 1 && Math.abs(matrix.m42) <= maxY + 1;
      }), true, 'Pan must stay constrained after resizing');
      await page.setViewportSize(viewport);
      await page.waitForTimeout(200);
    }
    await page.keyboard.press('0');
    if (!baseline) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
      assert.equal(await page.locator('.lightbox-actions > span').innerText(), '125%');
      await page.keyboard.press('0');
    }
    await page.keyboard.press('ArrowRight');
    assert.match(await page.locator('.lightbox-toolbar small').innerText(), /^02/);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await page.waitForTimeout(100);
    assert.equal(await thumbnail.evaluate(el => document.activeElement === el), true);
    await page.locator('.gallery-item').first().click();
    await dialog.waitFor();
    await page.locator('.lightbox-full.is-loaded').waitFor();
    await page.getByRole('button', { name: 'Następne zdjęcie' }).click();
    if (!baseline) {
      const stage = await page.locator('.lightbox-stage').boundingBox();
      await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
      await page.mouse.down();
      await page.mouse.move(stage.x + stage.width / 2 - 100, stage.y + stage.height / 2, { steps: 6 });
      await page.mouse.up();
      assert.match(await page.locator('.lightbox-toolbar small').innerText(), /^03/);
    }
    await page.keyboard.press('Escape');
    const lightboxProfile = await cdp.send('Profiler.stop');
    await writeFile(`${output}/${name}-lightbox.cpuprofile`, JSON.stringify(lightboxProfile.profile));
    const navigationRequests = [];
    page.on('request', request => navigationRequests.push(request.url()));
    const regulations = await page.goto(`${baseURL}/regulamin`, { waitUntil: 'networkidle' });
    if (!baseline || regulations.status() === 200) {
      assert.equal(regulations.status(), 200);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.screenshot({ path: `${output}/${name}-regulations.png`, fullPage: true });
      if (!baseline) assert.ok(!navigationRequests.some(url => /\/App-[^/]+\.js/.test(url)), 'Regulations must not load the main App bundle');
    }
    if (!baseline) {
      assert.deepEqual(errors, []);
      assert.deepEqual(violations, []);
      assert.deepEqual(failedResponses, []);
    }
    results.push({ name, viewport, scrollHeight, imageBytes, images: uniqueImages, errors, violations, failedResponses });
    await context.tracing.stop({ path: `${output}/${name}-recording.zip` });
    await context.close();
  }
  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 412, height: 823 } });
  const page = await reduced.newPage();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.pointer-glow').evaluate(el => getComputedStyle(el).display), 'none');
  assert.equal(await page.locator('.hero-media').evaluate(el => getComputedStyle(el).transform), 'none');
  await page.screenshot({ path: `${output}/mobile-reduced-motion.png` });
  if (!baseline) {
    await verifyAthleteFilters(page);
    assert.ok(await page.locator('.athlete-photo').first().evaluate(element => parseFloat(getComputedStyle(element).transitionDuration) < 0.001));
    await verifyRosterLayout(page, output);
  }
  await reduced.close();
  await writeFile(`${output}/browser.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map(({ name, imageBytes, errors, violations }) => ({ name, imageBytes, errors, violations })), null, 2));
} finally {
  await browser.close();
}
