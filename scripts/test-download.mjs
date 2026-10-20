import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadFirmware, unlockFirmware } from '../src/download.js';
import { copy } from '../src/i18n.js';

const root = new URL('../', import.meta.url);
const manifests = ['release.json', 'gr3-release.json', 'gr3x-release.json', 'enhanced-release.json'];
const releases = await Promise.all(manifests.map(async name => JSON.parse(await readFile(new URL(`src/${name}`, root)))));
const realFetch = globalThis.fetch;
let requests = 0;
globalThis.fetch = async (url, { signal } = {}) => {
  signal?.throwIfAborted(); requests++;
  const file = new URL(String(url).replace(/^\.\//, 'public/'), root);
  return new Response(await readFile(file));
};
try {
  const encrypted = releases[2];
  await assert.rejects(unlockFirmware(encrypted, 'wrong-password'));
  await assert.rejects(loadFirmware(encrypted), /Password required/);
  assert.equal(requests, 0, 'locked IIIx must not start downloading');
  const key = await unlockFirmware(encrypted, '2222');
  for (const release of releases) {
    const blob = await loadFirmware(release, { decryptionKey: release.encryption ? key : undefined });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(bytes.length, release.size);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), release.sha256);
    console.log(`${release.camera} ${release.version}: saved BIN matches original SHA-256`);
  }
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(loadFirmware(releases[1], { signal: cancelled.signal }), { name: 'AbortError' });
  const corrupted = structuredClone(releases[1]); corrupted.parts[0].sha256 = '0'.repeat(64);
  await assert.rejects(loadFirmware(corrupted), /Part checksum mismatch/);
  assert.equal(releases[0].filename, 'fwdc248b.bin');
  assert.equal(releases[1].filename, 'fwdc239b.bin');
  assert.equal(releases[2].filename, 'fwdc243b.bin');
  assert.equal(releases[0].encryption, undefined);
  assert.equal(releases[1].encryption, undefined);
  assert.equal(releases[3].encryption, undefined);
  for (const locale of ['zh', 'en', 'ja']) {
    const text = copy[locale];
    for (const model of ['gr4', 'gr3', 'gr3x']) {
      const info = text.modelReleases[model];
      assert.ok(info.compatible && info.note && info.changesTitle && info.changes.length);
    }
    assert.ok(text.downloadPassword && text.downloadPasswordError && text.unlockDownload);
    assert.ok(text.downloadHint.includes('{filename}'));
    assert.equal(text.checks.length, 3);
    assert.equal(text.gr3Deadline, undefined, 'expired placeholder removed');
  }
  console.log('Password rejection, exact BIN identity, cancellation, corruption and all three languages passed.');
} finally { globalThis.fetch = realFetch; }
