import { readFile, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const release = JSON.parse(await readFile(new URL('../src/release.json', import.meta.url)));
const base = new URL('../public/downloads/', import.meta.url);
const hash = b => createHash('sha256').update(b).digest('hex');
const parts = [];
for (const part of release.parts) {
  const bytes = await readFile(new URL(part.file, base));
  if (bytes.length !== part.size || hash(bytes) !== part.sha256) throw new Error(`Release part failed validation: ${part.file}`);
  parts.push(bytes);
}
const full = Buffer.concat(parts);
if (full.length !== release.size || hash(full) !== release.sha256) throw new Error('Complete firmware failed SHA-256 validation');
for (const name of ['LICENSE.txt']) if (!(await stat(new URL(name, base))).size) throw new Error(`Missing release asset: ${name}`);
console.log(`${release.version}: all release assets verified; original firmware bytes preserved.`);

const exposed = (await readdir(base)).filter(name => /source|源码|verification/i.test(name));
if (exposed.length) throw new Error(`Source archives must not be deployed: ${exposed.join(', ')}`);
