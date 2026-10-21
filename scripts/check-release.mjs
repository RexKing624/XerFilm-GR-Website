import { readFile, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = new URL('../public/downloads/', import.meta.url);
const hash = b => createHash('sha256').update(b).digest('hex');
for (const manifest of ['release.json', 'gr3-release.json', 'gr3x-release.json', 'enhanced-release.json', 'gr3-enhanced-release.json', 'gr3x-enhanced-release.json']) {
  const release = JSON.parse(await readFile(new URL(`../src/${manifest}`, import.meta.url)));
  const parts = [];
  for (const part of release.parts) {
    const bytes = await readFile(new URL(part.file, base));
    if (bytes.length !== part.size || hash(bytes) !== part.sha256) throw new Error(`Release part failed validation: ${part.file}`);
    parts.push(bytes);
  }
  const full = Buffer.concat(parts);
  if (full.length !== (release.downloadSize ?? release.size) || hash(full) !== (release.transportSha256 ?? release.sha256)) throw new Error('Complete firmware failed SHA-256 validation');
  if (manifest === 'gr3x-release.json' && (release.encryption || release.hardwareTested !== false || release.version !== 'V1.1' || release.internalVersion !== 'R13' || release.filename !== 'fwdc243b.bin')) throw new Error('IIIx R13 must accurately retain pending camera status, V1.1 identity and password-free model-specific download');
  if (manifest === 'gr3-release.json' && (release.encryption || release.filename !== 'fwdc239b.bin')) throw new Error('III must remain password-free with its own filename');
  if (manifest === 'enhanced-release.json' && (release.hardwareTested !== true || release.installationVersion !== '1.12.10.7')) throw new Error('Enhanced release must retain its camera-tested status and installation version');
  if (manifest === 'gr3-enhanced-release.json' || manifest === 'gr3x-enhanced-release.json') {
    const gr3 = manifest === 'gr3-enhanced-release.json';
    const expected = gr3
      ? ['2.11.21.27', '2.10', 'fwdc239b.bin', '5044d8f1a9bab32ac93c6a5e0e7a1c90d25b9760aa9cee27d33d66a1cc7f868b']
      : ['1.61.11.17', '1.60', 'fwdc243b.bin', '2cfd3e0214e17e785ca0a5d5158869be4b409a1a32756fc2193f433f81a14dda'];
    if (release.encryption || release.hardwareTested !== true || release.internalVersion !== 'R13-H' || JSON.stringify([release.installationVersion, release.baseVersion, release.filename, release.sha256]) !== JSON.stringify(expected)) throw new Error('Enhanced package must be camera-tested and password-free with unchanged firmware identity');
  }
  console.log(`${release.version}: release assets verified; original firmware bytes preserved.`);
}
for (const name of ['LICENSE.txt']) if (!(await stat(new URL(name, base))).size) throw new Error(`Missing release asset: ${name}`);

const exposed = (await readdir(base)).filter(name => /source|源码|verification/i.test(name));
if (exposed.length) throw new Error(`Source archives must not be deployed: ${exposed.join(', ')}`);

const originalPins = {
  gr3: ['2.10', 'fwdc239b.bin', 'd6a3c9c288d784080e7b283222ecdd8752adfeed6faa36dab44f73115354bfd4'],
  gr3x: ['1.60', 'fwdc243b.bin', '708e79f3b7b96a7e1581b4acf4c412233050a1832718ef7f06c8397db1b431c7'],
  gr4: ['1.11', 'fwdc248b.bin', 'a2f664dfca034059eb0fd6e18ab08684c326b4a034d85c164dad7e1ec9b5655f'],
};
const originals = JSON.parse(await readFile(new URL('../src/original-releases.json', import.meta.url)));
if (originals.length !== 3 || new Set(originals.map(r => r.id)).size !== 3) throw new Error('Exactly three original model backups required');
for (const release of originals) {
  const pin = originalPins[release.id];
  if (!pin || release.version !== pin[0] || release.filename !== pin[1] || release.sha256 !== pin[2] || !release.originalFirmware || release.encryption) throw new Error('Original backup identity mismatch');
  const chunks = [];
  for (const part of release.parts) {
    const b = await readFile(new URL(part.file, base));
    if (b.length !== part.size || hash(b) !== part.sha256) throw new Error('Original backup part corrupted: '+part.file);
    chunks.push(b);
  }
  const b = Buffer.concat(chunks);
  if (b.length !== release.size || hash(b) !== pin[2]) throw new Error('Original backup differs from archived manufacturer BIN');
  console.log(`${release.camera} ${release.version}: pinned original backup verified.`);
}
