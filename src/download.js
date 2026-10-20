// The three acknowledgements are a reading reminder. The optional model password
// derives a key for encrypted assets; the downloaded result is the original BIN.
const decode64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
export async function unlockFirmware(release, password) {
  if (!release.encryption) throw new Error('This release has no password');
  const settings = release.encryption;
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: decode64(settings.salt), iterations: settings.iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const proof = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode64(settings.check.iv) }, key, decode64(settings.check.ciphertext));
  if (new TextDecoder().decode(proof) !== `XerFilm GR / ${release.camera} / ${release.version}`) throw new Error('Incorrect password');
  return key;
}

// Split static assets keep individual requests below common hosting file limits.
export async function loadFirmware(release, { signal, onProgress = () => {}, decryptionKey } = {}) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure context required');
  if (release.encryption && !decryptionKey) throw new Error('Password required');
  const transportSize = release.downloadSize ?? release.size;
  const output = new Uint8Array(transportSize);
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
        onProgress(offset / transportSize);
      }
    } finally { await reader.cancel().catch(() => {}); }
    if (offset - begin !== part.size) throw new Error('Incomplete part');
    const partHash = await hash(output.subarray(begin, offset));
    if (partHash !== part.sha256) throw new Error('Part checksum mismatch');
    signal?.throwIfAborted();
  }
  if (offset !== transportSize || await hash(output) !== (release.transportSha256 ?? release.sha256)) throw new Error('File checksum mismatch');
  signal?.throwIfAborted();
  const firmware = release.encryption
    ? new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode64(release.encryption.iv) }, decryptionKey, output))
    : output;
  if (firmware.length !== release.size || await hash(firmware) !== release.sha256) throw new Error('Original firmware checksum mismatch');
  signal?.throwIfAborted();
  return new Blob([firmware], { type: 'application/octet-stream' });
}
async function hash(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
}
