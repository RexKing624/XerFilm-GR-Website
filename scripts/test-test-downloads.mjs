import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadFirmware, unlockFirmware } from '../src/download.js';
import { testFirmwareCopy } from '../src/test-firmware-copy.js';

const root = new URL('../', import.meta.url);
const sets = JSON.parse(await readFile(new URL('src/test-releases.json', root)));
const pins = {
  "gr3": [
    "R41",
    "fwdc239b.bin",
    "4a6005e8aad5253badd8c5ecbca3aa0bfbb63aa73c0da10e80fddc499ba4c371",
    "7f1a5e6b744a4e5d4039a1c6687795cbf4d8f2366541c581ba0e2ce38b0d5b7e"
  ],
  "gr3x": [
    "R40",
    "fwdc243b.bin",
    "66bd85b1fe3935da9f3d5f368a5706f255a019d23e8146090f58d7b17f4c6c5f",
    "a0019889a7e03b5338ba8dc394950545b5422d0f1f97af90e821eaa6ebc9b752"
  ],
  "gr4": [
    "v62",
    "fwdc248b.bin",
    "501d8f199b926ac2970fb30f62168a5ac537a128366fba615eda6e6c0130a7cf",
    "4012ef44ffd0b6eb278a3bac45c3c25871f51c0c67ac847cfffec55b22eee9a5"
  ]
};
assert.deepEqual(Object.keys(sets), ['gr3', 'gr3x', 'gr4']);
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
    await assert.rejects(unlockFirmware(first, '3333'));
    await assert.rejects(unlockFirmware(first, '2222'));
    if (password) key = await unlockFirmware(first, password);
    for (const [index, release] of set.firmware.entries()) {
      assert.equal(release.internalVersion, pins[model][0] + (index ? '-H' : ''));
      assert.equal(release.filename, pins[model][1]);
      assert.equal(release.sha256, pins[model][2 + index]);
      assert.equal(release.testRelease, true);
      assert.equal(release.version, '高光提速与 INFO 修复测试版');
      assert.equal(release.hardwareTested, false);
      assert.equal(release.statisticsVersion, 'V3.11-test');
      assert.equal(release.downloadVariant, index ? 'enhanced' : 'standard');
    }
    for (const asset of set.firmware) {
      assert.equal(asset.encryption.algorithm, 'AES-GCM');
      assert.equal(asset.encryption.kdf, 'PBKDF2');
      assert.ok(asset.encryption.iterations >= 210000);
      assert.equal(asset.encryption.salt, first.encryption.salt, 'One successful verification unlocks both firmware variants');
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
    assert.equal(set.supplement, undefined, 'No sample kit remains in the test section');
  }
  for (const language of ['zh', 'en', 'ja']) {
    const text = testFirmwareCopy[language];
    for (const field of ['title', 'warning', 'note', 'variant', 'ack', 'password', 'passed', 'standardDownload', 'enhancedDownload']) assert.ok(text[field]);
    assert.equal(text.supplementHint, undefined);
    assert.ok(text.standardDownload.includes('{revision}') && text.enhancedDownload.includes('{revision}'));
  }
  const app = await readFile(new URL('src/App.vue', root), 'utf8');
  assert.ok(app.indexOf('<TestFirmwareDownload') > app.indexOf('<EnhancedDownload'));
  assert.ok(app.includes('v-if="testReleases[selectedModel]"'));
  const ui = await readFile(new URL('src/TestFirmwareDownload.vue', root), 'utf8');
  assert.ok(ui.includes('accepted && !key') && ui.includes('accepted && key'));
  assert.ok(ui.includes('if (!props.verified || !accepted.value || !key.value'));
  assert.ok(!ui.includes('class="test-supplement"'));
  assert.ok(!ui.includes('download(releaseSet.supplement)'));
  assert.ok(ui.includes('watch(() => props.releaseSet, reset)') && ui.includes('onBeforeUnmount(reset)'));
  assert.ok(ui.includes('if (!asset.supplement) trackFirmwareDownload'));
  assert.ok(ui.includes('type="radio"') && ui.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
  assert.ok(ui.includes('const selectedAsset = computed') && !ui.includes('v-for="asset in releaseSet.firmware"'));
  assert.ok(ui.includes('watch(selectedVariant, cancel)') && ui.includes('const asset = selectedAsset.value;'));
  const remaining = await (await import('node:fs/promises')).readdir(new URL('public/downloads/', root));
  assert.ok(!remaining.some(name => /^test-gr3x-v311-r38-|supplement/.test(name)), 'Retired test firmware and sample kits are not deployed');
  console.log(`GR III R41 / IIIx R40 / IV v62 highlight and INFO test downloads: ciphertext integrity and locked behavior verified${password ? '; correct-password roundtrip, cancellation and corruption verified' : ''}.`);
} finally { globalThis.fetch = realFetch; }
