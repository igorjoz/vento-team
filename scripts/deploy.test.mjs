import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/deploy.sh');
// Run the real remote shell on an isolated filesystem, without network access.
const mock = `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const op = path.basename(process.argv[1]);
const args = process.argv.slice(2);
fs.appendFileSync(process.env.DEPLOY_LOG, JSON.stringify({op,args})+'\\n');
const marker = path.join(process.env.REMOTE_ROOT,'failure-used');
if (op === process.env.FAIL_OP && args.some(arg => arg.endsWith(process.env.FAIL_SUFFIX || '')) && !fs.existsSync(marker)) {
  fs.writeFileSync(marker,''); process.exit(23);
}
if (process.env.FAIL_RESTORE === '1' && op === 'cp' && args.at(-2).includes('/deploy-backups/')) process.exit(24);
if (op === 'ssh') {
  if (args[5] !== 'sh' || args[6] !== '-s') throw new Error('Expected remote shell on stdin');
  const result = spawnSync('/bin/sh', args.slice(6), {cwd:process.env.REMOTE_ROOT, env:process.env, stdio:'inherit'});
  process.exit(result.status ?? 1);
}
if (op === 'rsync') {
  const source = args.at(-2);
  const destination = path.join(process.env.REMOTE_ROOT, args.at(-1).split(':').slice(1).join(':'));
  if (source === 'dist/') {
    fs.mkdirSync(destination,{recursive:true});
    for (const file of fs.readdirSync('dist')) {
      if (['index.html','.htaccess'].includes(file)) continue;
      fs.cpSync(path.join('dist',file),path.join(destination,file),{recursive:true});
    }
  } else fs.copyFileSync(source,destination);
  process.exit(0);
}
const result = spawnSync('/bin/'+op,args,{stdio:'inherit'});
process.exit(result.status ?? 1);
`;

async function runScenario(options, check) {
  const dir = await mkdtemp(join(tmpdir(), 'vento-deploy-'));
  try {
    const bin = join(dir, 'bin');
    const remote = join(dir, 'remote');
    const target = join(remote, 'domains/ventoteam.com/public_html');
    const log = join(dir, 'log');
    await mkdir(bin);
    await mkdir(target, { recursive: true });
    await mkdir(join(target, 'assets'));
    await writeFile(join(target, 'assets/old.js'), 'old asset');
    await mkdir(join(dir, 'dist/assets'), { recursive: true });
    await writeFile(join(dir, 'dist/index.html'), 'new HTML');
    await writeFile(join(dir, 'dist/.htaccess'), 'new policy');
    await writeFile(join(dir, 'dist/assets/new.js'), 'new asset');
    if (!options.fresh) {
      await writeFile(join(target, 'index.html'), 'old HTML');
      if (!options.noPolicy) await writeFile(join(target, '.htaccess'), 'old policy');
    }
    for (const command of ['ssh', 'rsync', 'mkdir', 'chmod', 'cp', 'mv', 'rm']) {
      await writeFile(join(bin, command), mock, { mode: 0o755 });
    }
    const result = spawnSync('sh', [script], {
      cwd: dir, encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SSH_HOST: 'host.example', SSH_PORT: '22', SSH_USER: 'user',
        SSH_KEY_PATH: "/tmp/key with ' quote", DEPLOY_LOG: log, REMOTE_ROOT: remote, GITHUB_SHA: 'abc123',
        FAIL_OP: options.op || '', FAIL_SUFFIX: options.suffix || '', FAIL_RESTORE: options.failRestore ? '1' : '0' },
    });
    const commands = (await readFile(log, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    const contents = async file => readFile(join(target, file), 'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    const backups = join(remote, 'domains/ventoteam.com/deploy-backups');
    await check({ result, commands, contents, backups });
  } finally { await rm(dir, { recursive: true }); }
}

test('successful deploy backs up files, retains old assets and publishes HTML last', async () => {
  await runScenario({}, async ({ result, commands, contents, backups }) => {
    assert.equal(result.status, 0, result.stderr);
    assert.equal(await contents('index.html'), 'new HTML');
    assert.equal(await contents('.htaccess'), 'new policy');
    assert.equal(await contents('assets/old.js'), 'old asset');
    const backup = join(backups, (await readdir(backups))[0]);
    assert.equal(await readFile(join(backup, 'index.html'), 'utf8'), 'old HTML');
    assert.equal(await readFile(join(backup, '.htaccess'), 'utf8'), 'old policy');
    const operations = commands.map(command => command.op);
    assert.ok(operations.indexOf('cp') < operations.indexOf('rsync'));
    assert.equal(commands.filter(command => command.op === 'rsync').length, 3);
    assert.ok(operations.lastIndexOf('rsync') < operations.indexOf('mv'));
    assert.equal(commands.filter(command => command.op === 'mv').at(-1).args[0], 'domains/ventoteam.com/public_html/index.html.next');
    assert.ok(!commands.some(command => command.args.includes('--delete')));
  });
});

for (const [name, options] of [
  ['mkdir', { op: 'mkdir' }], ['chmod', { op: 'chmod' }],
  ['HTML backup', { op: 'cp', suffix: '/index.html' }],
  ['policy backup', { op: 'cp', suffix: '/.htaccess' }],
]) {
  test(`failed ${name} aborts before any upload`, async () => {
    await runScenario(options, async ({ result, commands, contents }) => {
      assert.notEqual(result.status, 0);
      assert.ok(!commands.some(command => command.op === 'rsync'));
      assert.equal(await contents('index.html'), 'old HTML');
      assert.equal(await contents('.htaccess'), 'old policy');
      assert.doesNotMatch(result.stdout, /Backup:/);
    });
  });
}

for (const [name, options] of [
  ['assets', { op: 'rsync', suffix: 'public_html/' }],
  ['policy upload', { op: 'rsync', suffix: '.htaccess.next' }],
  ['HTML upload', { op: 'rsync', suffix: 'index.html.next' }],
  ['policy activation', { op: 'mv', suffix: '/.htaccess' }],
  ['HTML activation', { op: 'mv', suffix: '/index.html' }],
]) {
  test(`failed ${name} leaves both previous files intact`, async () => {
    await runScenario(options, async ({ result, contents }) => {
      assert.notEqual(result.status, 0);
      assert.equal(await contents('index.html'), 'old HTML');
      assert.equal(await contents('.htaccess'), 'old policy');
      assert.doesNotMatch(result.stdout, /Backup:/);
      if (name === 'HTML activation') assert.match(result.stderr, /Previous HTML and configuration restored/);
    });
  });
}

for (const options of [{ fresh: true }, { noPolicy: true }]) {
  test(`rollback restores absent files (${options.fresh ? 'first deploy' : 'no previous policy'})`, async () => {
    await runScenario({ ...options, op: 'mv', suffix: '/index.html' }, async ({ result, contents }) => {
      assert.notEqual(result.status, 0);
      assert.equal(await contents('index.html'), options.fresh ? null : 'old HTML');
      assert.equal(await contents('.htaccess'), null);
      assert.match(result.stderr, /Previous HTML and configuration restored/);
    });
  });
}

test('rollback failure remains an error and identifies the backup for manual recovery', async () => {
  await runScenario({ op: 'mv', suffix: '/index.html', failRestore: true }, async ({ result }) => {
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ROLLBACK FAILED/);
    assert.match(result.stderr, /restore manually from domains\/ventoteam.com\/deploy-backups\//);
    assert.doesNotMatch(result.stderr, /Previous HTML and configuration restored/);
    assert.doesNotMatch(result.stdout, /Backup:/);
  });
});
