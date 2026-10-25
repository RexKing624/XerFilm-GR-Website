# XerFilm download statistics

Collection starts on 2026-10-25 in Asia/Tokyo. GitHub Pages remains the public website; this separate Worker receives anonymous completion reports and stores them in D1. No firmware changes, device codes, photographs or IP addresses are stored in D1. Download reporting does not create a visitor identifier. Worker request observability is disabled.

An event means every firmware part and the final BIN passed checksum verification and the page triggered browser save. Community ZIPs are also SHA-256 verified before save. The browser cannot confirm a disk write or camera installation. Public client reports are an approximate usage metric, not proof of purchases or installations. Origin validation and rate limiting reduce casual abuse but are not cryptographic download attestation.

Events carry a fresh random UUID per download attempt. D1's primary key makes retry idempotent. A bounded local browser queue retries network errors; it contains only pending download metadata and expires after seven days. Download reporting creates no persistent visitor identifier. Localhost is excluded. Admin links can disable/re-enable collection in the browser used for manual tests.

`/admin/` contains no private data or credential. `/api/stats` requires the secret `ADMIN_TOKEN`; the UI keeps it in memory only. The public summary endpoint exposes only firmware and per-look aggregate totals; event details and date/version breakdowns remain private. Keep the management token in a password manager/local private file, never in the public website, URL, source repository or build artifact.

## Local checks

- `npm ci --prefix statistics`
- `npm test --prefix statistics` (Node22; uses real SQLite)
- `npm run check:release && npm run test:downloads && npm run build`
- From `statistics`, apply D1 migrations with `wrangler d1 migrations apply xerfilm-download-statistics --local` and run `npm run dev`.
- Local `.dev.vars` supplies an unrelated preview-only token. Local D1 data is separate from production.

## Deployment

Use Wrangler with account read, user read, Workers scripts write and D1 write permissions. Set the correct account/database IDs in `wrangler.jsonc`. Create the D1 database once, apply all pending migrations remotely, and set `ADMIN_TOKEN` through Wrangler secret stdin. Deploy the Worker before enabling the client endpoint in `src/download-statistics-config.json`; the public website should never be deployed with a placeholder endpoint. Secrets and `.wrangler` runtime state are ignored by Git.

The client accepts metadata for future valid firmware releases, so later version upgrades need no schema migration or server catalog update. Counts are separated by category, model, variant, version, revision and SHA-256. Queries use server receipt dates in Japan time, with daily trends, summaries, version breakdowns and CSV export. Original manufacturer firmware is reported separately and excluded from custom firmware totals.

Keep all applied migrations immutable. No historical download totals are fabricated. Operational testing uses the local database; do not seed fake production downloads.

## Historical estimate baseline

At the owner's request, `HISTORICAL_ESTIMATE=850` represents estimated firmware downloads before collection was enabled. The dashboard shows estimated cumulative total = historical estimate + measured firmware total, with both values labeled separately. This baseline never inserts download rows, never inflates daily/monthly/model/version/community totals, and does not enter CSV event breakdowns. The API retains `summary.total` as the measured count; `summary.historicalEstimate` and `summary.estimatedTotal` expose the explicit estimate.


## Public engagement

`GET /api/public-stats` returns only firmware totals (measured, historical estimate, sum), known community look like/download totals and collection start date. No visitor hashes, individual event rows, administration credential or private dashboard breakdowns are exposed. Community downloads are grouped by catalog look ID across package revisions. Public counters are maintained by database triggers; duplicate event IDs never increment twice.

`POST /api/likes` sets the desired like state, rather than incrementing blindly. A random per-browser UUID is generated on first like and retained in localStorage. D1 stores only its SHA-256 hash and look ID, with a unique pair preventing repeat likes. `GET /api/likes/state` restores only that browser's own likes. Clicking again removes its like. This is anonymous browser-level deduplication, not identity verification: clearing storage or using another browser permits another like. Origin checks, request validation and rate limiting reduce casual abuse but cannot guarantee bot resistance.

The UI updates the clicked like immediately, reconciles with the server, and refreshes public counts every five seconds on community pages (30 seconds elsewhere). Hidden pages and Studio do not poll. Same-browser tabs synchronize through storage notifications; completed download reports request an immediate refresh. Unavailable statistics never block downloads or show a made-up zero.

After applying migration `0002_public_engagement.sql` remotely, run `wrangler d1 execute xerfilm-download-statistics --remote --file backfill-public-counters.sql` once before deploying the new Worker. This idempotently initializes counters for existing download events without creating events or changing the 850 estimate. For future new community look IDs, redeploy the Worker alongside the website so both use the updated `src/community-data.json` catalog. No custom domain or DNS change is required.
