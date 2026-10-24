CREATE TABLE downloads (
 event_id TEXT PRIMARY KEY,
 day TEXT NOT NULL,
 received_at TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('firmware','original','community')),
 model TEXT NOT NULL,
 variant TEXT NOT NULL,
 version TEXT NOT NULL,
 revision TEXT NOT NULL,
 sha256 TEXT NOT NULL
);
CREATE INDEX downloads_day ON downloads(day);
CREATE INDEX downloads_kind_day ON downloads(kind,day);
