import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [before = '/tmp/vento-verification/before', after = '/tmp/vento-verification/after'] = process.argv.slice(2);
const read = async (directory, filename) => JSON.parse(await readFile(`${directory}/${filename}`, 'utf8'));
const previous = await read(before, 'browser.json');
const current = await read(after, 'browser.json');
for (const report of current) {
  const baseline = previous.find(item => item.name === report.name);
  const reduction = 1 - report.imageBytes / baseline.imageBytes;
  console.log(`${report.name}: images ${baseline.imageBytes} -> ${report.imageBytes} B (${(reduction * 100).toFixed(1)}% reduction)`);
  assert.ok(reduction >= 0.5, `${report.name}: expected >=50% fewer image bytes`);
}
const performanceBefore = await read(before, 'performance.json');
const performanceAfter = await read(after, 'performance.json');
console.log('Median performance:', { before: performanceBefore.median, after: performanceAfter.median });
assert.ok(performanceAfter.median.lcp < performanceBefore.median.lcp, 'Median LCP must improve');
assert.ok(performanceAfter.runs.every(run => run.cls < 0.1), 'Every run must have CLS <0.1');
