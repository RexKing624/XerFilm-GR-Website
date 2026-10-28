import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadFirmware, unlockFirmware } from '../src/download.js';
import { testFirmwareCopy } from '../src/test-firmware-copy.js';

const root = new URL('../', import.meta.url);
const sets = JSON.parse(await readFile(new URL('src/test-releases.json', root)));
const pins = {
  "gr3": [
    "R40",
    "fwdc239b.bin",
    "d35b36867bfc3bdc1594cd6afef27ddc50847342271b1201aa31c59025308476",
    "86b801b4e5baa66e2fbfa63dfde8c1aaa2abdc31ec69fd84e7c7e14f770403c7"
  ],
  "gr3x": [
    "R39",
    "fwdc243b.bin",
    "8a2d4e5be87839335ebcfa51b9c379852b71208c43b3f3adb46f74081c571fd9",
    "cddbf0404bb424a2d55d1dd02490d07fb6d646bec07d490e8145cbbe600fad74"
  ]
};
assert.deepEqual(Object.keys(sets), ['gr3', 'gr3x', 'gr4']);
pins.gr4=['v61','fwdc248b.bin','33ac26c188ea066237009f0aac8ded3ccbb9502e75c891fd7dab46aed65fd0f4','d1c20c6217bc5eec415eda8b0557c32523d9f3a2afe786cc29716e6ff1a9c3a8'];
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
      assert.equal(release.version, model === 'gr4' ? '启动与高光优化测试版' : '颜色修复测试版');
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
  console.log(`GR III R40 / IIIx R39 color repair test downloads: ciphertext integrity and locked behavior verified${password ? '; correct-password roundtrip, cancellation and corruption verified' : ''}.`);
} finally { globalThis.fetch = realFetch; }
