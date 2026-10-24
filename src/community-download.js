export async function loadVerifiedCommunityPack(item, base = '/') {
  const response = await fetch(`${base}${item.download}`, {signal:AbortSignal.timeout(60000)});
  if (!response.ok) throw Error('Package unavailable');
  const bytes = await response.arrayBuffer();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)), n=>n.toString(16).padStart(2,'0')).join('');
  if (digest !== item.sha256) throw Error('Package checksum mismatch');
  return new Blob([bytes],{type:'application/zip'});
}
export function saveCommunityPack(blob, filename) {
  const url=URL.createObjectURL(blob), anchor=document.createElement('a');
  anchor.href=url;anchor.download=filename;(document.querySelector('dialog[open]')||document.body).append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
