CREATE TABLE studio_exports (
 event_id TEXT PRIMARY KEY,
 day TEXT NOT NULL,
 received_at TEXT NOT NULL,
 version TEXT NOT NULL,
 files INTEGER NOT NULL CHECK(files BETWEEN 1 AND 4),
 films INTEGER NOT NULL CHECK(films BETWEEN files AND files*3)
);
CREATE INDEX studio_exports_day ON studio_exports(day);
