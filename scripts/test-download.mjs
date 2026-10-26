import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadFirmware } from '../src/download.js';
import { copy } from '../src/i18n.js';

const root = new URL('../', import.meta.url);
const manifests = ['release.json', 'gr3-release.json', 'gr3x-release.json', 'enhanced-release.json'];
const releases = await Promise.all(manifests.map(async name => JSON.parse(await readFile(new URL(`src/${name}`, root)))));
const availability = JSON.parse(await readFile(new URL('src/download-availability.json', root)));
assert.deepEqual(availability, { gr4: true, gr3: true, gr3x: true }, 'All three V3.0 downloads remain available');
const originals = JSON.parse(await readFile(new URL('src/original-releases.json', root)));
releases.push(...originals);
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, { signal } = {}) => {
  signal?.throwIfAborted();
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
  const enhanced = await Promise.all(['gr3', 'gr3x'].map(async id => JSON.parse(await readFile(new URL(`src/${id}-enhanced-release.json`, root)))));
  for (const release of enhanced) {
    assert.equal(release.encryption, undefined, 'Approved enhanced releases must not require passwords');
    assert.equal(release.downloadSize, undefined, 'download should use original BIN chunks');
    const blob = await loadFirmware(release);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(bytes.length, release.size);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), release.sha256);
    assert.ok(release.camera.includes('IIIx') ? release.hardwareTested : release.releaseApproved);
    assert.equal(release.internalVersion, release.camera.includes('IIIx') ? 'R31-H' : 'R32-H');
    console.log(`${release.camera} enhanced: password-free download matches approved BIN`);
    const corrupted = structuredClone(release); corrupted.parts[0].sha256 = '0'.repeat(64);
    await assert.rejects(loadFirmware(corrupted), /Part checksum mismatch/);
    const cancelled = new AbortController(); cancelled.abort();
    await assert.rejects(loadFirmware(release, { signal: cancelled.signal }), { name: 'AbortError' });
  }
  for (const locale of ['zh', 'en', 'ja']) {
    for (const id of ['gr3', 'gr3x']) {
      const content = copy[locale].enhancedModels[id];
      assert.ok(content.enhancedIntro && content.enhancedTestNote && !content.enhancedPassword);
      assert.ok(content.enhancedIntro.includes(id === 'gr3' ? '2.10' : '1.60'));
      assert.ok(!/未经实机|Not yet tested|実機未検証/.test(content.enhancedTestNote));
      assert.ok(content.enhancedTestNote.includes(id === 'gr3' ? '2.20' : '1.70'));
    }
  }
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(loadFirmware(releases[1], { signal: cancelled.signal }), { name: 'AbortError' });
  const corrupted = structuredClone(releases[1]); corrupted.parts[0].sha256 = '0'.repeat(64);
  await assert.rejects(loadFirmware(corrupted), /Part checksum mismatch/);
  assert.equal(releases[0].version, 'V3.1');
  assert.equal(releases[3].version, 'V3.1');
  assert.equal(releases[0].internalVersion, 'v55');
  assert.equal(releases[3].internalVersion, 'v55-H');
  assert.equal(releases[1].version, 'V3.0');
  assert.equal(releases[2].version, 'V3.0');
  assert.equal(releases[1].releaseApproved, true);
  assert.equal(releases[1].hardwareTested, false, 'Promotion must not invent a hardware test result');
  assert.equal(releases[2].hardwareTested, true);
  assert.equal(releases[1].internalVersion, 'R32');
  assert.equal(releases[2].internalVersion, 'R31');
  assert.equal(releases[0].filename, 'fwdc248b.bin');
  assert.equal(releases[1].filename, 'fwdc239b.bin');
  assert.equal(releases[2].filename, 'fwdc243b.bin');
  assert.equal(releases[0].encryption, undefined);
  assert.equal(releases[1].encryption, undefined);
  assert.equal(releases[3].encryption, undefined);
  for (const locale of ['zh', 'en', 'ja']) {
    const text = copy[locale];
    assert.ok(text.historicalSource.includes('V1.1'));
    assert.ok(text.historicalSourceNote.includes('V3.0'));
    for (const model of ['gr4', 'gr3', 'gr3x']) {
      const info = text.modelReleases[model];
      assert.ok(info.compatible && info.note && info.changesTitle && info.changes.length);
    }
    for (const model of ['gr3']) {
      const info = text.modelReleases[model];
      assert.ok(info.rollback && info.note.includes('V3.0'));
      assert.equal(info.changes.length, 5);
      assert.ok(info.changes.some(item => item.includes('ADJ')));
    }
    assert.ok(text.originalTitle && text.originalIntro && text.officialUpdateTitle && text.officialUpdateNotice && text.originalDownload && text.originalBackupOnly);
    assert.equal(text.originalFirmwareURL, undefined, 'official download redirect removed');
    assert.ok(text.downloadPassword && text.downloadPasswordError && text.unlockDownload);
    assert.ok(text.downloadHint.includes('{filename}'));
    assert.equal(text.checks.length, 4);
    assert.equal(text.modelReleases.gr4.changesTitle.startsWith('V3.1'), true);
    assert.equal(text.modelReleases.gr4.changes.length, 5);
    assert.ok(text.modelReleases.gr4.changes.some(item => item.includes('XerFilm GR')));
    assert.ok(text.modelReleases.gr4.changes.some(item => item.includes('GR4-GF2Unlock')));
    assert.ok(text.modelReleases.gr4.frameDesc.includes('1:1'));
    assert.ok(!text.modelReleases.gr4.frameDesc.includes('4433'));
    assert.ok(text.highlightDesc && text.frameDesc && text.resetWarning);
    assert.ok(text.enhancedTestNote.includes('V3.1'));
    assert.ok(text.modelReleases.gr4.changes.some(item => /ID/.test(item)));
    assert.equal(text.modelReleases.gr4.sourceURL, 'https://github.com/lemonadesaltbagel/GR4-GF2Unlock');
    assert.equal(text.gr3Deadline, undefined, 'expired placeholder removed');
  }
  assert.deepEqual(originals.map(r => [r.id, r.version, r.filename]), [['gr3','2.10','fwdc239b.bin'], ['gr3x','1.60','fwdc243b.bin'], ['gr4','1.11','fwdc248b.bin']]);
  const app = await readFile(new URL('src/App.vue', root), 'utf8');
  assert.ok(app.includes("openDrawer('original')") && !app.includes('t.originalFirmwareURL'));
  assert.ok(!app.includes('TestFirmwareDownload') && !app.includes('testBusy'), 'Separate R32 test entry is retired');
  for (const locale of ['zh', 'en', 'ja']) {
    const { gr4, gr3, gr3x } = copy[locale].modelReleases;
    for (const key of ['changes', 'changesTitle', 'note', 'frameDesc']) assert.deepEqual(gr3[key], gr3x[key], 'III / IIIx retain their V3.0 changelog');
    assert.ok(gr3.changesTitle.startsWith('V3.0'));
    assert.notDeepEqual(gr3.changes, gr4.changes);
    assert.ok(copy[locale].enhancedModels.gr3x.enhancedTestNote.includes('V3.0'));
    assert.ok(!/测试|test|テスト/.test(copy[locale].enhancedModels.gr3x.enhancedTitle));
  }
  const { communityCopy } = await import('../src/community-copy.js');
  for (const locale of ['zh', 'en', 'ja']) {
    for (const model of ['GR III / HDF', 'GR IIIx / HDF', 'GR IV / HDF']) assert.ok(communityCopy[locale].compatibility.includes(model), 'Community supports all released V3.0 models');
    assert.ok(copy[locale].enhancedModels.gr3.enhancedTestNote.includes('V3.0'));
  }
  for (const [manifest, revision, variant, pin] of [
    ['gr3-release.json', 'R32', 'standard', '2f574c62caf932ef48f92eb8fc097fca50506d83481b83d15be21a4785e39949'],
    ['gr3-enhanced-release.json', 'R32-H', 'enhanced', '54a829455e1e5db8bdc8c40f2af95d42193aba9d807975fbda4dc151bcf5e409'],
  ]) {
    const r = JSON.parse(await readFile(new URL(`src/${manifest}`, root)));
    assert.equal(r.version, 'V3.0'); assert.equal(r.releaseApproved, true);
    assert.equal(r.testRelease, undefined); assert.equal(r.encryption, undefined);
    assert.equal(r.statisticsVersion, 'V3.0'); assert.equal(r.downloadVariant, variant);
    assert.equal(r.internalVersion, revision); assert.equal(r.sha256, pin);
  }
  console.log('Password-free downloads, exact BIN identity, cancellation, corruption and all three languages passed.');
} finally { globalThis.fetch = realFetch; }
