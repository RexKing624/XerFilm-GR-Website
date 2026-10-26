export const ORIGINAL_RESTORE_WAIT_MS = 10000;

// Each download request needs a fresh wait and acknowledgement for that model.
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
