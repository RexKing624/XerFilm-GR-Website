// No visitor IDs, IP storage or firmware changes.
import configuration from './download-statistics-config.json';
import { createDownloadStatistics } from './download-statistics-client';
let client;
export function initializeDownloadStatistics() {
  try {
    let storage; try { storage = globalThis.localStorage; } catch {}
    client ??= createDownloadStatistics({ endpoint:configuration.endpoint, location:globalThis.location, storage, send:(...args)=>fetch(...args), uuid:()=>crypto.randomUUID(), onRecorded:()=>globalThis.dispatchEvent?.(new Event('xerfilm-download-recorded')) });
    void client.flush();
    globalThis.addEventListener?.('online', () => { void client.flush(); });
  } catch {}
}
export function trackFirmwareDownload(release, variant = 'standard') {
  try {
    const model = release.filename === 'fwdc239b.bin' ? 'gr3' : release.filename === 'fwdc243b.bin' ? 'gr3x' : 'gr4';
    client?.record({kind:release.originalFirmware?'original':'firmware', model, variant:release.originalFirmware?'original':variant, version:release.statisticsVersion || release.version, revision:release.internalVersion || release.version, sha256:release.sha256});
  } catch {}
}
export function trackCommunityDownload(item) {
  try { client?.record({kind:'community', model:'community', variant:'community', version:String(item.revision), revision:item.id, sha256:item.sha256}); } catch {}
}
