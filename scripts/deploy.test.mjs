import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('deploy backs up policy and entrypoint; publishes HTML only after successful assets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vento-deploy-'));
  try {
    for (const command of ['ssh', 'rsync']) {
      await writeFile(join(dir, command), `#!/bin/sh\nprintf '%s\\n' '${command}' \"$@\" >> \"$DEPLOY_LOG\"\nif test '${command}' = rsync && test \"$FAIL_RSYNC\" = 1; then exit 23; fi\n`, { mode: 0o755 });
    }
    const log = join(dir, 'log');
    const env = { ...process.env, PATH: `${dir}:${process.env.PATH}`, SSH_HOST: 'host.example', SSH_PORT: '22', SSH_USER: 'user', SSH_KEY_PATH: "/tmp/key with ' quote", DEPLOY_LOG: log, GITHUB_SHA: 'abc123' };
    const success = spawnSync('sh', ['scripts/deploy.sh'], { env, encoding: 'utf8' });
    assert.equal(success.status, 0, success.stderr);
    const commands = await readFile(log, 'utf8');
    assert.ok(commands.indexOf('deploy-backups/') < commands.indexOf('dist/'));
    assert.ok(commands.indexOf('dist/') < commands.indexOf('dist/index.html'));
    assert.ok(commands.indexOf('dist/index.html') < commands.indexOf('mv domains/'));
    assert.ok(!commands.includes('--delete'));
    await writeFile(log, '');
    const failure = spawnSync('sh', ['scripts/deploy.sh'], { env: { ...env, FAIL_RSYNC: '1' }, encoding: 'utf8' });
    assert.equal(failure.status, 23);
    assert.ok(!(await readFile(log, 'utf8')).includes('mv domains/'));
  } finally { await rm(dir, { recursive: true }); }
});
