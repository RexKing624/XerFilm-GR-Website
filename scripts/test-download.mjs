import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadFirmware } from '../src/download.js';
import { copy } from '../src/i18n.js';

const root = new URL('../', import.meta.url);
const manifests = ['release.json', 'gr3-release.json', 'gr3x-release.json', 'enhanced-release.json'];
const releases = await Promise.all(manifests.map(async name => JSON.parse(await readFile(new URL(`src/${name}`, root)))));
const originals = JSON.parse(await readFile(new URL('src/original-releases.json', root)));
releases.push(...originals);
const realFetch = globalThis.fetch;
let requests = 0;
globalThis.fetch = async (url, { signal } = {}) => {
  signal?.throwIfAborted(); requests++;
  const file = new URL(String(url).replace(/^\.\//, 'public/'), root);
  return new Response(await readFile(file));
};
try {
  for (const release of releases) {
    assert.equal(release.encryption, undefined, `${release.camera} must download without a password`);
    const blob = await loadFirmware(release);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(bytes.length, release.size);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), release.sha256);
    console.log(`${release.camera} ${release.version}: saved BIN matches original SHA-256`);
  }
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(loadFirmware(releases[1], { signal: cancelled.signal }), { name: 'AbortError' });
  const corrupted = structuredClone(releases[1]); corrupted.parts[0].sha256 = '0'.repeat(64);
  await assert.rejects(loadFirmware(corrupted), /Part checksum mismatch/);
  assert.equal(releases[1].version, 'V1.1');
  assert.equal(releases[2].version, 'V1.1');
  assert.equal(releases[1].hardwareTested, true);
  assert.equal(releases[2].hardwareTested, false);
  assert.equal(releases[1].internalVersion, 'R13');
  assert.equal(releases[2].internalVersion, 'R13');
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
    for (const model of ['gr3', 'gr3x']) {
      const info = text.modelReleases[model];
      assert.ok(info.rollback && info.note.includes('V1.1'));
      assert.ok(info.changes.some(item => item.includes('Cinema')));
    }
    assert.ok(text.originalTitle && text.originalIntro && text.officialUpdateTitle && text.officialUpdateNotice && text.originalDownload && text.originalBackupOnly);
    assert.equal(text.originalFirmwareURL, undefined, 'official download redirect removed');
    assert.ok(text.downloadPassword && text.downloadPasswordError && text.unlockDownload);
    assert.ok(text.downloadHint.includes('{filename}'));
    assert.equal(text.checks.length, 3);
    assert.equal(text.gr3Deadline, undefined, 'expired placeholder removed');
  }
  assert.deepEqual(originals.map(r => [r.id, r.version, r.filename]), [['gr3','2.10','fwdc239b.bin'], ['gr3x','1.60','fwdc243b.bin'], ['gr4','1.11','fwdc248b.bin']]);
  const app = await readFile(new URL('src/App.vue', root), 'utf8');
  assert.ok(app.includes("openDrawer('original')") && !app.includes('t.originalFirmwareURL'));
  console.log('Password-free downloads, exact BIN identity, cancellation, corruption and all three languages passed.');
} finally { globalThis.fetch = realFetch; }
