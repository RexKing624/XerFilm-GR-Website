-- Private publication records, separate from download statistics.
CREATE TABLE release_jobs (
 id TEXT PRIMARY KEY,
 model TEXT NOT NULL CHECK(model IN ('gr4','gr3','gr3x')),
 revision TEXT NOT NULL, version TEXT NOT NULL, head TEXT NOT NULL, snapshot TEXT NOT NULL, notes TEXT NOT NULL,
 status TEXT NOT NULL, run_id INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX release_jobs_one_active ON release_jobs((1)) WHERE status IN ('dispatching','queued','in_progress','attention');
