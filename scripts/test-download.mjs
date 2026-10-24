import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadFirmware, unlockFirmware } from '../src/download.js';
import { copy } from '../src/i18n.js';

const root = new URL('../', import.meta.url);
const manifests = ['release.json', 'gr3-release.json', 'gr3x-release.json', 'enhanced-release.json'];
const releases = await Promise.all(manifests.map(async name => JSON.parse(await readFile(new URL(`src/${name}`, root)))));
const availability = JSON.parse(await readFile(new URL('src/download-availability.json', root)));
assert.deepEqual(availability, { gr4: true, gr3: true, gr3x: true }, 'GR IV V3.0 and III/IIIx V2.0 downloads remain available');
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
  const enhanced = await Promise.all(['gr3', 'gr3x'].map(async id => JSON.parse(await readFile(new URL(`src/${id}-enhanced-release.json`, root)))));
  for (const release of enhanced) {
    assert.equal(release.encryption, undefined, 'camera-tested enhanced releases must not require passwords');
    assert.equal(release.downloadSize, undefined, 'download should use original BIN chunks');
    const blob = await loadFirmware(release);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(bytes.length, release.size);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), release.sha256);
    assert.equal(release.hardwareTested, true);
    assert.equal(release.internalVersion, 'R20-H');
    console.log(`${release.camera} enhanced: password-free download matches camera-tested BIN`);
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
  assert.equal(releases[0].version, 'V3.0');
  assert.equal(releases[3].version, 'V3.0');
  assert.equal(releases[0].internalVersion, 'v49');
  assert.equal(releases[3].internalVersion, 'v49-H');
  assert.equal(releases[1].version, 'V2.0');
  assert.equal(releases[2].version, 'V2.0');
  assert.equal(releases[1].hardwareTested, true);
  assert.equal(releases[2].hardwareTested, true);
  assert.equal(releases[1].internalVersion, 'R20');
  assert.equal(releases[2].internalVersion, 'R20');
  assert.equal(releases[0].filename, 'fwdc248b.bin');
  assert.equal(releases[1].filename, 'fwdc239b.bin');
  assert.equal(releases[2].filename, 'fwdc243b.bin');
  assert.equal(releases[0].encryption, undefined);
  assert.equal(releases[1].encryption, undefined);
  assert.equal(releases[3].encryption, undefined);
  for (const locale of ['zh', 'en', 'ja']) {
    const text = copy[locale];
    assert.ok(text.historicalSource.includes('V1.1'));
    assert.ok(text.historicalSourceNote.includes('V2.0'));
    for (const model of ['gr4', 'gr3', 'gr3x']) {
      const info = text.modelReleases[model];
      assert.ok(info.compatible && info.note && info.changesTitle && info.changes.length);
    }
    for (const model of ['gr3', 'gr3x']) {
      const info = text.modelReleases[model];
      assert.ok(info.rollback && info.note.includes('V2.0'));
      assert.equal(info.changes.length, 3);
      assert.ok(info.changes.some(item => item.includes('ADJ')));
    }
    assert.ok(text.originalTitle && text.originalIntro && text.officialUpdateTitle && text.officialUpdateNotice && text.originalDownload && text.originalBackupOnly);
    assert.equal(text.originalFirmwareURL, undefined, 'official download redirect removed');
    assert.ok(text.downloadPassword && text.downloadPasswordError && text.unlockDownload);
    assert.ok(text.downloadHint.includes('{filename}'));
    assert.equal(text.checks.length, 4);
    assert.equal(text.modelReleases.gr4.changesTitle.startsWith('V3.0'), true);
    assert.equal(text.modelReleases.gr4.changes.length, 5);
    assert.ok(text.modelReleases.gr4.changes.some(item => item.includes('Fn')));
    assert.ok(text.modelReleases.gr4.changes.some(item => item.includes('INFO')));
    assert.ok(text.modelReleases.gr4.frameDesc.includes('1:1'));
    assert.ok(!text.modelReleases.gr4.frameDesc.includes('4433'));
    assert.ok(text.highlightDesc && text.frameDesc && text.resetWarning);
    assert.ok(text.enhancedTestNote.includes('V3.0'));
    assert.ok(text.modelReleases.gr4.changes.some(item => item.includes('XPan')));
    assert.equal(text.gr3Deadline, undefined, 'expired placeholder removed');
  }
  assert.deepEqual(originals.map(r => [r.id, r.version, r.filename]), [['gr3','2.10','fwdc239b.bin'], ['gr3x','1.60','fwdc243b.bin'], ['gr4','1.11','fwdc248b.bin']]);
  const app = await readFile(new URL('src/App.vue', root), 'utf8');
  assert.ok(app.includes("openDrawer('original')") && !app.includes('t.originalFirmwareURL'));
  for (const [kind, pin] of [
    ['ordinary', '20e10ea634b13d1c54489c54bb2331c2572df705278260f6f2cb74bde92d7c7a'],
    ['enhanced', 'f82c572d331651b080cab2cb856e733d43e66ea9486405fb4ab35cdf1fdee774'],
  ]) {
    const test = JSON.parse(await readFile(new URL(`src/gr3x-test-${kind}-release.json`, root)));
    const previous = requests;
    await assert.rejects(loadFirmware(test), /Password required/);
    assert.equal(requests, previous, 'Locked test release cannot fetch any firmware');
    await assert.rejects(unlockFirmware(test, '0000'));
    const key = await unlockFirmware(test, '2222');
    const blob = await loadFirmware(test, { decryptionKey: key });
    const output = new Uint8Array(await blob.arrayBuffer());
    assert.equal(output.length, test.size);
    assert.equal(createHash('sha256').update(output).digest('hex'), pin, 'Password unlock preserves exact R29 BIN');
    const damaged = structuredClone(test); damaged.parts[0].sha256 = '0'.repeat(64);
    await assert.rejects(loadFirmware(damaged, { decryptionKey: key }), /Part checksum mismatch/);
    const stopped = new AbortController(); stopped.abort();
    await assert.rejects(loadFirmware(test, { decryptionKey: key, signal: stopped.signal }), { name: 'AbortError' });
    console.log(`${test.internalVersion}: wrong password blocked; correct password restores pinned test BIN.`);
  }
  const { testFirmwareCopy } = await import('../src/test-firmware-copy.js');
  for (const locale of ['zh', 'en', 'ja']) {
    assert.ok(testFirmwareCopy[locale].enhancedTitle.includes('V3.0'));
    assert.ok(testFirmwareCopy[locale].enhancedPassword && testFirmwareCopy[locale].enhancedAck);
  }
  assert.ok(app.indexOf('<TestFirmwareDownload') > app.indexOf('<EnhancedDownload :key='), 'Test panel follows enhanced downloads');
  assert.ok(app.includes("v-if=\"selectedModel === 'gr3x'\""), 'Only IIIx/HDF gets test panel');
  console.log('Password-free downloads, exact BIN identity, cancellation, corruption and all three languages passed.');
} finally { globalThis.fetch = realFetch; }
