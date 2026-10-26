CREATE TABLE author_downloads (
 event_id TEXT PRIMARY KEY,
 day TEXT NOT NULL,
 received_at TEXT NOT NULL,
 package_id TEXT NOT NULL,
 version TEXT NOT NULL,
 sha256 TEXT NOT NULL
);
CREATE INDEX author_downloads_day ON author_downloads(day);
CREATE INDEX author_downloads_package_day ON author_downloads(package_id,day);
