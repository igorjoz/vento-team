import test from 'node:test';
import assert from 'node:assert/strict';

const baseURL = process.env.BASE_URL;
test('HTTP routes, cache, compression and security headers', { skip: !baseURL }, async () => {
  for (const route of ['/', '/regulamin', '/regulamin/']) {
    const response = await fetch(`${baseURL}${route}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()');
    const policy = response.headers.get('content-security-policy') || response.headers.get('content-security-policy-report-only');
    assert.match(policy, /script-src 'self'/);
    assert.match(policy, /frame-ancestors 'none'/);
    assert.ok(!policy.includes('unsafe-eval'));
    if (baseURL.startsWith('http:')) assert.equal(response.headers.get('strict-transport-security'), null);
    else assert.equal(response.headers.get('strict-transport-security'), 'max-age=86400');
    const html = await response.text();
    const script = html.match(/src="([^"]+\.js)"/)[1];
    const asset = await fetch(`${baseURL}${script}`, { headers: { 'Accept-Encoding': 'gzip' } });
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /javascript/);
    assert.match(asset.headers.get('cache-control'), /max-age=31536000, immutable/);
    assert.equal(asset.headers.get('content-encoding'), 'gzip');
  }
  for (const route of ['/assets/absent.js', '/assets/absent.css', '/images/absent.webp', '/images/absent.avif']) {
    assert.equal((await fetch(`${baseURL}${route}`)).status, 404, route);
  }
  assert.ok([403, 404].includes((await fetch(`${baseURL}/.htaccess`)).status));
});
