export const ORIGINAL_RESTORE_WAIT_MS = 10000;

export function originalRestoreRequestId(target) {
  if (!target || !['gr4', 'gr3', 'gr3x'].includes(target.id) || !/^\d+\.\d+$/.test(target.version)) throw new TypeError('Invalid original firmware target');
  return `${target.officialFirmware ? 'official' : 'backup'}:${target.id}:${target.version}`;
}

// Each source/model/version request needs a fresh wait and acknowledgement.
// Use elapsed time so changing the system clock cannot shorten the reminder.
export function createOriginalRestoreGate(now = () => performance.now()) {
  let model = null, readyAt = null;
  return {
    start(id) { model = id; readyAt = now() + ORIGINAL_RESTORE_WAIT_MS; },
    reset() { model = null; readyAt = null; },
    remaining() { return readyAt === null ? 10 : Math.max(0, Math.ceil((readyAt - now()) / 1000)); },
    allows(id, acknowledged) { return readyAt !== null && model === id && acknowledged === true && now() >= readyAt; },
  };
}
