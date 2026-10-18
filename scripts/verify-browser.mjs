import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const output = process.env.REPORT_DIR || '/tmp/vento-verification/after';
const baseline = process.env.BASELINE === '1';
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
  await reduced.close();
  await writeFile(`${output}/browser.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map(({ name, imageBytes, errors, violations }) => ({ name, imageBytes, errors, violations })), null, 2));
} finally {
  await browser.close();
}
