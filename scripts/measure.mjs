import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [url = 'http://127.0.0.1:8080/', output = '/tmp/vento-verification/after'] = process.argv.slice(2);
await mkdir(output, { recursive: true });
const reports = [];
for (let run = 1; run <= 3; run++) {
  const path = `${output}/lighthouse-${run}.json`;
  const result = spawnSync(process.execPath, [fileURLToPath(import.meta.resolve('lighthouse/cli/index.js')), url,
    '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage', '--only-categories=performance', '--output=json', `--output-path=${path}`, '--quiet'], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Lighthouse run ${run} failed (${result.status}); do not score a blocked page.`);
  const report = JSON.parse(await readFile(path, 'utf8'));
  if (report.runtimeError) throw new Error(JSON.stringify(report.runtimeError));
  reports.push({ score: report.categories.performance.score * 100,
    lcp: report.audits['largest-contentful-paint'].numericValue,
    cls: report.audits['cumulative-layout-shift'].numericValue,
    tbt: report.audits['total-blocking-time'].numericValue,
    fcp: report.audits['first-contentful-paint'].numericValue });
}
const median = values => [...values].sort((a, b) => a - b)[1];
const summary = { url, lighthouseVersion: JSON.parse(await readFile(`${output}/lighthouse-1.json`, 'utf8')).lighthouseVersion,
  runs: reports, median: Object.fromEntries(Object.keys(reports[0]).map(key => [key, median(reports.map(report => report[key]))])) };
await writeFile(`${output}/performance.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
