import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadFirmware, unlockFirmware } from '../src/download.js';
import { testFirmwareCopy } from '../src/test-firmware-copy.js';

const root = new URL('../', import.meta.url);
const sets = JSON.parse(await readFile(new URL('src/test-releases.json', root)));
const pins = {
  gr3: ['R36', 'fwdc239b.bin', 'e2d68186521c12330b3d4cfde068000d2abae2bd9879190d004c9a2bcfaa438e', 'd81ad2b009f9e75afff10b15cf6890c01872eb5c950138eb502f87823a2c2971'],
  gr3x: ['R35', 'fwdc243b.bin', '87557bb6c52305e5c48804dc4dfa917f976cdc185d311bcce5f3b64e9fbcdf75', '3069eeccde6f0cdc2456ab50f2eedab985036eec7e73bef1ed03b807fde02d07'],
};
assert.deepEqual(Object.keys(sets), ['gr3', 'gr3x']);
const sha = data => createHash('sha256').update(data).digest('hex');
const password = process.env.TEST_DOWNLOAD_PASSWORD;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, { signal } = {}) => {
  signal?.throwIfAborted();
  return new Response(await readFile(new URL(String(url).replace(/^\.\//, 'public/'), root)));
};
try {
  for (const [model, set] of Object.entries(sets)) {
    assert.equal(set.revision, pins[model][0]);
    assert.equal(set.firmware.length, 2);
    const first = set.firmware[0];
    let key;
    await assert.rejects(unlockFirmware(first, 'incorrect-test-password'));
    if (password) key = await unlockFirmware(first, password);
    for (const [index, release] of set.firmware.entries()) {
      assert.equal(release.internalVersion, pins[model][0] + (index ? '-H' : ''));
      assert.equal(release.filename, pins[model][1]);
      assert.equal(release.sha256, pins[model][2 + index]);
      assert.equal(release.testRelease, true);
      assert.equal(release.hardwareTested, false);
      assert.equal(release.statisticsVersion, 'V3.1-test');
      assert.equal(release.downloadVariant, index ? 'enhanced' : 'standard');
    }
    for (const asset of [...set.firmware, set.supplement]) {
      assert.equal(asset.encryption.algorithm, 'AES-GCM');
      assert.equal(asset.encryption.kdf, 'PBKDF2');
      assert.ok(asset.encryption.iterations >= 210000);
      assert.equal(asset.encryption.salt, first.encryption.salt, 'One successful verification unlocks the model files and supplement');
      assert.equal(asset.downloadSize, asset.size + 16);
      await assert.rejects(loadFirmware(asset), /Password required/);
      const parts = await Promise.all(asset.parts.map(async part => {
        const data = await readFile(new URL(`public/downloads/${part.file}`, root));
        assert.equal(data.length, part.size); assert.equal(sha(data), part.sha256);
        return data;
      }));
      const encrypted = Buffer.concat(parts);
      assert.equal(sha(encrypted), asset.transportSha256);
      assert.notEqual(sha(encrypted), asset.sha256, 'Public assets must contain ciphertext');
      if (key) {
        const blob = await loadFirmware(asset, { decryptionKey: key });
        assert.equal(blob.size, asset.size);
        assert.equal(sha(new Uint8Array(await blob.arrayBuffer())), asset.sha256);
      }
    }
    if (key) {
      const corrupted = structuredClone(first); corrupted.parts[0].sha256 = '0'.repeat(64);
      await assert.rejects(loadFirmware(corrupted, { decryptionKey: key }), /Part checksum mismatch/);
      const cancelled = new AbortController(); cancelled.abort();
      await assert.rejects(loadFirmware(first, { decryptionKey: key, signal: cancelled.signal }), { name: 'AbortError' });
    }
    assert.equal(set.supplement.supplement, true);
    assert.equal(set.supplement.sha256, '6da2ccd98de4b04bd269924d58b1dda2cd80c0d3cf08a7fc5990b718646dc1df');
    assert.ok(set.supplement.filename.endsWith('.zip'));
  }
  for (const language of ['zh', 'en', 'ja']) {
    const text = testFirmwareCopy[language];
    for (const field of ['title', 'warning', 'note', 'ack', 'password', 'passed', 'standardDownload', 'enhancedDownload', 'supplement']) assert.ok(text[field]);
    assert.ok(text.supplementHint.includes('1234'));
  }
  const app = await readFile(new URL('src/App.vue', root), 'utf8');
  assert.ok(app.indexOf('<TestFirmwareDownload') > app.indexOf('<EnhancedDownload'));
  assert.ok(app.includes('v-if="testReleases[selectedModel]"'));
  const ui = await readFile(new URL('src/TestFirmwareDownload.vue', root), 'utf8');
  assert.ok(ui.includes('accepted && !key') && ui.includes('accepted && key'));
  assert.ok(ui.includes('if (!props.verified || !accepted.value || !key.value'));
  assert.ok(ui.indexOf('class="test-supplement"') > ui.indexOf('class="primary test-bin-download"'));
  assert.ok(ui.includes('watch(() => props.releaseSet, reset)') && ui.includes('onBeforeUnmount(reset)'));
  assert.ok(ui.includes('if (!asset.supplement) trackFirmwareDownload'));
  console.log(`Model-specific V3.1 test downloads: ciphertext integrity and locked behavior verified${password ? '; correct-password roundtrip, cancellation and corruption verified' : ''}.`);
} finally { globalThis.fetch = realFetch; }
