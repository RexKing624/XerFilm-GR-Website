# Official administration entry

`https://filmgr.xergnik.com/admin/` serves the existing management login page.
Private data still comes from the statistics Worker after its existing server-side
passphrase check. No credential is included in these public assets.

The assets are a snapshot of the currently deployed administration page. To update
them intentionally after changing `statistics/src/admin.html`, run
`node scripts/export-admin.mjs`, review the generated files, and publish them.
The main website build copies this directory through Vite's normal public assets.

The statistics Worker allows authenticated GET requests from exactly the official
website origin. It does not allow other origins or expose unauthenticated statistics.
