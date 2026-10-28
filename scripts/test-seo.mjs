import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pageSeo } from '../src/seo.js';

const expectedPaths = ['/', '/community/', '/community/studio/'];
const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), expectedPaths.map(path => 'https://filmgr.xergnik.com' + path));
const titles = new Set();
for (const path of expectedPaths) {
  const html = readFileSync(resolve('dist', '.' + path, 'index.html'), 'utf8');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
  assert.equal(canonical, 'https://filmgr.xergnik.com' + path, 'Each public page must retain its own canonical URL');
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  assert.ok(!titles.has(title), 'Public routes must have distinct titles');
  titles.add(title);
  assert.ok(html.includes('<h1>'), 'Initial response must contain a real heading without executing JavaScript');
  assert.ok(html.includes('XerFilm GR'));
  assert.ok(!html.includes('undefined'));
  assert.ok(!/<meta name="robots" content="noindex/.test(html));
  const schema = JSON.parse(html.match(/<script id="xerfilm-page-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema['@graph'][1].url, canonical);
  assert.ok(!/href="[^"#]*(?:\.bin|\.part\d|\.zip)"/.test(html), 'Static HTML must not bypass any download confirmations');
  assert.ok(html.includes('name="google-site-verification"'), 'Google verification must survive deployment');
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)) assert.ok(existsSync(resolve('dist', '.' + match[1])), 'Public script/style asset must exist');
}
const home = readFileSync('dist/index.html', 'utf8');
for (const required of ['PORTRA', 'ULTRAMAX', '刷', '风险', '重设', 'GR IIIx']) assert.ok(home.includes(required), 'Homepage must preserve product content and safety instructions: ' + required);
const robots = readFileSync('dist/robots.txt', 'utf8');
assert.ok(robots.includes('Sitemap: https://filmgr.xergnik.com/sitemap.xml'));
assert.ok(!/^Disallow:\s*\/$/m.test(robots), 'Public pages must remain crawlable');
assert.ok(!robots.includes('Disallow: /admin'), 'Crawlers must be able to read the admin noindex directive');
assert.ok(readFileSync('dist/admin/index.html', 'utf8').includes('noindex,nofollow'));
assert.ok(readFileSync('dist/community/studio/editor.html', 'utf8').includes('noindex,follow'));
for (const language of ['zh', 'en', 'ja']) for (const path of expectedPaths) {
  const meta = pageSeo(path, language);
  assert.equal(meta.url, 'https://filmgr.xergnik.com' + path);
  assert.ok(meta.title && meta.description);
}
assert.equal(pageSeo('/community').path, '/community/');
assert.equal(pageSeo('/studio/').path, '/community/studio/');
console.log('SEO: three crawlable static pages, distinct canonicals, valid structured data, sitemap, Google verification and unchanged download gates passed.');
