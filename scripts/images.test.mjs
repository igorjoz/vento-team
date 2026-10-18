import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

test('generated variants preserve proportions, strip metadata and use content hashes', async () => {
  const manifest = JSON.parse(await readFile('src/generated/images.json', 'utf8'));
  assert.ok(Object.keys(manifest).length >= 34);
  for (const [source, image] of Object.entries(manifest)) {
    const original = await sharp(`public${source}`).metadata();
    const orientedWidth = [5, 6, 7, 8].includes(original.orientation) ? original.height : original.width;
    assert.equal(image.width, orientedWidth);
    for (const format of ['avif', 'webp']) {
      assert.deepEqual(image[format].map(v => v.width), [...new Set([480, 800, 1200, 1600, 1920].map(width => Math.min(width, image.width)))]);
      for (const variant of image[format]) {
        const buffer = await readFile(`public${variant.src}`);
        const metadata = await sharp(buffer).metadata();
        assert.equal(metadata.width, variant.width);
        assert.ok(Math.abs(metadata.height - variant.height) <= 1);
        assert.ok(metadata.width <= image.width);
        assert.equal(metadata.exif, undefined);
        assert.equal(metadata.xmp, undefined);
        assert.equal(buffer.length, variant.bytes);
        assert.ok(variant.src.includes(createHash('sha256').update(buffer).digest('hex').slice(0, 20)));
      }
    }
  }
});

test('image generation is repeatable and uses the existing variants', async () => {
  const first = await readFile('src/generated/images.json', 'utf8');
  const output = execFileSync(process.execPath, ['scripts/generate-images.mjs'], { encoding: 'utf8' });
  assert.doesNotMatch(output, /Optimized \/images/);
  assert.equal(await readFile('src/generated/images.json', 'utf8'), first);
});
