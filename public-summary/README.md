# Public firmware choice total

Read-only Worker for the homepage's “XerFilm GR，已被选择 XXX 次。” line. `GET /api/firmware-total` exposes only `{total, asOf}`. The existing D1 `download_totals` view combines dated owner history with automatic downloads, excluding original firmware, community packages and tool exports. Future dates are excluded. `asOf` is the query date in Asia/Tokyo. No user counts or install counts are inferred, and no extra estimate is added to the dated history.

The separate Worker leaves the private administration service and its credentials unchanged. It performs no database writes, needs no new schema, and records no event or visitor data. Successful responses may be cached for 60 seconds. The homepage refreshes once per visible minute; errors retain the last successful display or leave the line empty, never fabricate a zero.

Deploy using `node statistics/node_modules/wrangler/bin/wrangler.js deploy --config public-summary/wrangler.jsonc` from the site root after verifying the database view exists. Test using `node --test public-summary/test/*.test.mjs`. No domain or DNS change is required.
