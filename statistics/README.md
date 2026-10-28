# XerFilm download statistics

Collection starts on 2026-10-25 in Asia/Tokyo. GitHub Pages remains the public website; this separate Worker receives anonymous completion reports and stores them in D1. No firmware changes, device codes, photographs or IP addresses are stored in D1. Download reporting does not create a visitor identifier. Worker request observability is disabled.

An event means every firmware part and the final BIN passed checksum verification and the page triggered browser save. Community ZIPs are also SHA-256 verified before save. The browser cannot confirm a disk write or camera installation. Public client reports are an approximate usage metric, not proof of purchases or installations. Origin validation and rate limiting reduce casual abuse but are not cryptographic download attestation.

Events carry a fresh random UUID per download attempt. D1's primary key makes retry idempotent. A bounded local browser queue retries network errors; it contains only pending download metadata and expires after seven days. Download reporting creates no persistent visitor identifier. Localhost is excluded. Admin links can disable/re-enable collection in the browser used for manual tests.

`/admin/` contains no private data or credential. `/api/stats` requires the secret `ADMIN_TOKEN`; the UI keeps it in memory only. The public summary endpoint exposes only per-look like/download totals; firmware totals stay behind admin authentication; event details and date/version breakdowns remain private. Keep the management token in a password manager/local private file, never in the public website, URL, source repository or build artifact.

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

## Historical download entries

Dated historical totals supplied by the owner are stored separately in `manual_downloads`. They retain their source internally and are labeled 历史补录 in the private dashboard and CSV. No synthetic checksum-verified download events or missing BIN hashes are created. Each day/model/variant/version has a unique key; repeat imports update its count rather than adding it again. Only explicitly supplied enhanced counts are imported as enhanced.

The private dashboard combines historical entries with automatic records for cumulative/monthly/daily totals, trends and version breakdowns. The former undated placeholder is retired (`HISTORICAL_ESTIMATE=0`); detailed history also suppresses a stale legacy placeholder to prevent double counting. Automatic ingestion still starts on `START_DATE`; display ranges extend back to the earliest historical entry. Historical counts never change community downloads, Studio exports or public engagement counters.

Actual imports and owner provenance are kept in ignored `statistics/.secrets/`, outside the public source and frontend build. Apply migration `0004_manual_downloads.sql` before importing history and deploying the updated Worker. Legacy estimate API fields remain for compatibility, while the dashboard uses `combinedTotal`, `manualTotal`, `combinedToday` and `combinedMonth`.


## Public engagement

`GET /api/public-stats` returns only known community look like/download totals and collection start date. No visitor hashes, individual event rows, administration credential or private dashboard breakdowns are exposed. Community downloads are grouped by catalog look ID across package revisions. Public counters are maintained by database triggers; duplicate event IDs never increment twice.

`POST /api/likes` sets the desired like state, rather than incrementing blindly. A random per-browser UUID is generated on first like and retained in localStorage. D1 stores only its SHA-256 hash and look ID, with a unique pair preventing repeat likes. `GET /api/likes/state` restores only that browser's own likes. Clicking again removes its like. This is anonymous browser-level deduplication, not identity verification: clearing storage or using another browser permits another like. Origin checks, request validation and rate limiting reduce casual abuse but cannot guarantee bot resistance.

The UI updates the clicked like immediately, reconciles with the server, and refreshes public counts every five seconds on visible community pages. Other pages and hidden pages do not poll. Same-browser tabs synchronize through storage notifications; completed download reports request an immediate refresh. Unavailable statistics never block downloads or show a made-up zero.

After applying migration `0002_public_engagement.sql` remotely, run `wrangler d1 execute xerfilm-download-statistics --remote --file backfill-public-counters.sql` once before deploying the new Worker. This idempotently initializes counters for existing download events without creating events or changing the 850 estimate. For future new community look IDs, redeploy the Worker alongside the website so both use the updated `src/community-data.json` catalog. No custom domain or DNS change is required.


## Private Studio export counts

Apply `0003_studio_exports.sql` before deploying the Worker, then publish the website. The embedded public Studio reports only after the checked user packages have been generated and browser save has been triggered. One ZIP is one export; one populated, exported user slot is one XFC package. The count of child films is reported separately. Failed validation, skipped slots, project saves, local author exports and localhost are excluded. Each successful repeat export counts again; these figures are not unique works, people, confirmed disk writes or camera installs.

`POST /api/exports` accepts only tool version and numeric file/film counts, using a fresh event UUID with idempotent retries. A separate seven-day bounded queue uses the same owner opt-out as downloads. No user names, uploaded images, XMP, content hashes, slot destinations or visitor identifiers are collected. The existing iframe source/origin checks gate completion messages.

`GET /api/stats` adds private `studio.summary`, `studio.period` and `studio.daily` aggregates. The dashboard shows all-time/today/month export counts and generated package/child-film totals, date filters and a separate Studio CSV. No exports are added to firmware totals, the 850 historical estimate, community downloads or public counters. Counts begin at rollout; no historical Studio totals are invented.


## Dated Studio history

`0005_manual_studio_exports.sql` keeps owner-supplied daily Studio aggregates separate from anonymous completion events. Export attempts, generated packages and child-film counts are independent historical totals; importing the same day again replaces its supplied figures without adding duplicates. The admin API and dashboard combine them with existing automatic Studio events. Preserve all originals in `studio_exports`. Private source notes and import files stay in ignored `.secrets/`. No counter source breakdown is shown beneath the cumulative firmware card; provenance remains available internally and in administrative data.

## Author add-on downloads

Apply `0006_author_downloads.sql` before deploying this Worker and publishing the add-on control. A successful checksum-verified ZIP save reports `kind:author` through the existing `/api/downloads` endpoint. Only published IDs, content versions and SHA-256 values in `src/author-packs.json` are accepted. Retries retain the event ID and count once.

Author events are stored in `author_downloads`, separate from firmware, originals, community effects and Studio exports. `/api/stats` returns private `author.summary`, `author.period` and per-package `author.downloads`. The card immediately after community downloads shows the selected-period total. No public counter, historical firmware baseline or existing record is changed. Verification does not add fake production downloads. Redeploy the catalog and Worker together when adding a pack or changing its ZIP.

## Owner-controlled stable publication

`/admin/` now has a private release panel. It lists each model's current stable pair and pending test pair. The owner supplies a public version, reviews Chinese/English/Japanese notes and confirms both variants were hardware-tested before publishing. This is an owner attestation, not an automated hardware-test result. Only the selected model is promoted; other models, backups, counters and author packs are untouched. Test download passwords are removed from stable distribution, while each final BIN must retain the test build's exact SHA-256.

The authenticated Worker dispatches only `promote-release.yml` on the fixed website repository's `main`. `RELEASE_GITHUB_TOKEN` is a server-side secret (GitHub Actions write access); `FIRMWARE_TEST_PASSWORD` is a repository Actions secret. Neither secret is sent to the browser. Existing `ADMIN_TOKEN` authentication and official-origin CORS apply. Management credentials remain memory-only. Migration `0007_release_jobs.sql` records request IDs and holds one publication at a time; statistics tables are separate.

The request pins the source commit and a digest of the test pair plus old stable pair. The workflow rechecks these, decrypts and hashes both BINs, creates public chunks, updates independent approval pins and localized notes, retires only this test entry, then runs download/service/build checks. Only allowlisted files are committed, with a normal fast-forward push; a concurrent website update stops the release. Existing Pages checks and permissions still apply. Admin success requires both successful deployment and an exact public request receipt. Failed GitHub runs can be retried from their existing record. A lost dispatch response retains the request lock and discovers the run by UUID instead of dispatching twice.

Direct workflow dispatch defaults to `dry_run: true` and performs preparation/checks/build without pushing or deploying. `npm run test:publisher` exercises API authentication, stale snapshots, duplicate clicks, origin rules, failure/retry and actual three-model BIN materialization using temporary hard links. Never click the production publication button merely to test it. Initial installation of this feature does not promote any firmware.

If a dispatch remains uncertain for more than ten minutes, check the fixed workflow run list before clearing its private job record; do not bypass the lock and start another release. If a Pages deployment fails after the release commit, retry that failed deployment; the previous public site stays live until deployment succeeds.
