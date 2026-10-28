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
  const approvedPin = JSON.parse(await readFile(new URL('../src/approved-releases.json', import.meta.url)))[manifest];
  if (!approvedPin) throw new Error('Missing independent release approval: ' + manifest);

  // Publication approval and recorded physical test status are distinct.
  const version = approvedPin.version;
  const approved = release.hardwareTested === approvedPin.hardwareTested &&
    (release.releaseApproved === true || release.hardwareTested === true) && !release.testRelease;
  if (release.version !== version || !approved || release.encryption ||
      (release.statisticsVersion && release.statisticsVersion !== version) ||
      JSON.stringify([release.internalVersion, release.installationVersion, release.filename, release.sha256]) !== JSON.stringify(approvedPin.identity)) {
    throw new Error('Must ship the exact approved, password-free model-specific BIN: ' + manifest);
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

// The historical archive must stay distinct from the current firmware release.
const historical = JSON.parse(await readFile(new URL('../src/historical-source.json', import.meta.url)));
if (historical.version !== 'V1.1' || !historical.historical || historical.correspondsToCurrentRelease !== false ||
    historical.file !== 'historical-source/v1.1/XerFilm-GR-V1.1-source.zip') throw new Error('Historical source identity/version mismatch');
const source = await readFile(new URL('../public/' + historical.file, import.meta.url));
if (source.length !== historical.bytes || hash(source) !== historical.sha256) throw new Error('Historical source archive checksum mismatch');
console.log('Existing V1.1 historical source archive unchanged; GR IV / III V3.11 and IIIx V3.0 checked separately.');

// Withdraw old stable and password-gated test assets from the deployment.
const withdrawn = (await readdir(base)).filter(name => /^firmware-gr3x?-v(?:2(?:-enhanced)?\.part|3-test-)/.test(name));
if (withdrawn.length) throw new Error('Withdrawn III / IIIx downloads still exposed: '+withdrawn.join(', '));
console.log('GR III / IIIx V2.0 and test download assets withdrawn.');
