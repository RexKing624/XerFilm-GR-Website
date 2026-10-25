const KEY = 'xerfilm-pending-downloads-v1';
const EXCLUDE = 'xerfilm-exclude-download-statistics';
export function createDownloadStatistics({ endpoint, location, storage, send, uuid, now = Date.now, schedule = setTimeout, queueKey = KEY, onRecorded = () => {} }) {
  let pending = [], running = false, timer, excluded = false;
  const allowed = location?.origin === 'https://filmgr.xergnik.com';
  const setting = new URLSearchParams(location?.search || '').get('download-statistics');
  excluded = setting === 'off';
  try {
    if (setting === 'off') storage?.setItem(EXCLUDE, '1');
    if (setting === 'on') storage?.removeItem(EXCLUDE);
    excluded = setting === 'off' || (setting !== 'on' && storage?.getItem(EXCLUDE) === '1');
    const saved = JSON.parse(storage?.getItem(queueKey) || '[]');
    if (Array.isArray(saved)) pending = saved.filter(e => e && typeof e.eventId === 'string' && e.asset && Number.isFinite(e.queuedAt) && e.queuedAt >= now()-7*86400000).slice(-20);
  } catch {}
  if (excluded) { pending = []; try { storage?.removeItem(queueKey); } catch {} }
  const persist = () => { try { storage?.setItem(queueKey, JSON.stringify(pending)); } catch {} };
  async function flush() {
    if (!allowed || !endpoint || excluded || running || !pending.length) return;
    pending = pending.filter(event => event.queuedAt >= now()-7*86400000); persist();
    running = true;
    try {
      while (pending.length) {
        const event = pending[0];
        const response = await send(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'omit', keepalive:true, signal:AbortSignal.timeout(5000), body:JSON.stringify({ eventId:event.eventId, asset:event.asset }) });
        if (!response.ok && (response.status >= 500 || response.status === 429)) break;
        // Invalid events cannot block later valid downloads. Same ID is kept on retries.
        pending = pending.filter(item => item.eventId !== event.eventId); persist();
        if (response.ok) { try { onRecorded(); } catch {} }
      }
    } catch {} finally {
      running = false;
      if (pending.length && !timer) timer = schedule(() => { timer = undefined; void flush(); }, 30000);
    }
  }
  function record(asset) {
    try {
      if (!allowed || !endpoint || excluded) return;
      pending.push({eventId:uuid(), asset, queuedAt:now()}); pending = pending.slice(-20); persist(); void flush();
    } catch {} // Statistics must never change the result of a download.
  }
  return { record, flush };
}
