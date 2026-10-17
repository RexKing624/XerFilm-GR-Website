// The confirmation is a browser-local reading reminder, not access control.
// Split static assets keep individual requests below common hosting file limits.
export async function loadFirmware(release, { signal, onProgress = () => {} } = {}) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure context required');
  const output = new Uint8Array(release.size);
  let offset = 0;
  for (const part of release.parts) {
    const response = await fetch(`${(import.meta.env?.BASE_URL ?? './')}downloads/${part.file}`, { signal });
    if (!response.ok || !response.body) throw new Error('File unavailable');
    const reader = response.body.getReader();
    const begin = offset;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (offset + value.length > begin + part.size) throw new Error('Unexpected size');
        output.set(value, offset); offset += value.length;
        onProgress(offset / release.size);
      }
    } finally { await reader.cancel().catch(() => {}); }
    if (offset - begin !== part.size) throw new Error('Incomplete part');
    const partHash = await hash(output.subarray(begin, offset));
    if (partHash !== part.sha256) throw new Error('Part checksum mismatch');
    signal?.throwIfAborted();
  }
  if (offset !== release.size || await hash(output) !== release.sha256) throw new Error('File checksum mismatch');
  signal?.throwIfAborted();
  return new Blob([output], { type: 'application/octet-stream' });
}
async function hash(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
}
