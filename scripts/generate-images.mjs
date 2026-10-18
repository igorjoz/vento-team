import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile, access, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const publicDir = path.join(root, 'public');
const outputDir = path.join(publicDir, 'images/optimized');
const manifestPath = path.join(root, 'src/generated/images.json');
const options = { widths: [480, 800, 1200, 1600, 1920], avif: { quality: 50, effort: 2 }, webp: { quality: 78, effort: 4 }, sharp: sharp.versions };
const sources = [];
async function collect(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (['optimized', 'thumb'].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (/\.(jpe?g|webp)$/i.test(entry.name)) sources.push(file);
  }
}
await collect(path.join(publicDir, 'images'));
await mkdir(outputDir, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });
let previous = {};
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const manifest = {};
for (const file of sources) {
  const source = `/${path.relative(publicDir, file).split(path.sep).join('/')}`;
  const input = await readFile(file);
  const digest = createHash('sha256').update(input).update(JSON.stringify(options)).digest('hex').slice(0, 20);
  const cached = previous[source];
  if (cached?.digest === digest) {
    const exists = await Promise.all([...cached.avif, ...cached.webp].map(variant => access(path.join(publicDir, variant.src)).then(() => true, () => false)));
    if (exists.every(Boolean)) { manifest[source] = cached; continue; }
  }
  const metadata = await sharp(input).metadata();
  const rotated = [5, 6, 7, 8].includes(metadata.orientation);
  const width = rotated ? metadata.height : metadata.width;
  const height = rotated ? metadata.width : metadata.height;
  if (!width || !height) throw new Error(`Missing dimensions: ${source}`);
  const widths = [...new Set(options.widths.map(size => Math.min(size, width)))].sort((a, b) => a - b);
  const record = { digest, width, height, avif: [], webp: [] };
  for (const size of widths) {
    for (const format of ['avif', 'webp']) {
      // Sharp removes metadata by default. Auto-orient before resizing, never upscale.
      const buffer = await sharp(input).rotate().resize({ width: size, withoutEnlargement: true })[format](options[format]).toBuffer();
      const contentHash = createHash('sha256').update(buffer).digest('hex').slice(0, 20);
      const filename = `${contentHash}-${size}.${format}`;
      await writeFile(path.join(outputDir, filename), buffer);
      record[format].push({ src: `/images/optimized/${filename}`, width: size, height: Math.round(height * size / width), bytes: buffer.length });
    }
  }
  manifest[source] = record;
  // Persist completed work too, so an interrupted first build can resume.
  await writeFile(`${manifestPath}.tmp`, `${JSON.stringify({ ...previous, ...manifest }, null, 2)}\n`);
  await rename(`${manifestPath}.tmp`, manifestPath);
  console.log(`Optimized ${source}`);
}
await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`);
await rename(`${manifestPath}.tmp`, manifestPath);
const used = new Set(Object.values(manifest).flatMap(record => [...record.avif, ...record.webp].map(variant => path.basename(variant.src))));
for (const filename of await readdir(outputDir)) if (!used.has(filename)) await rm(path.join(outputDir, filename));
console.log(`Image manifest ready: ${sources.length} sources, ${used.size} variants.`);
