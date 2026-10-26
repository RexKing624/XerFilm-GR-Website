CREATE TABLE manual_studio_exports (
 day TEXT PRIMARY KEY,
 exports INTEGER NOT NULL CHECK(exports>=0),
 files INTEGER NOT NULL CHECK(files>=0),
 films INTEGER NOT NULL CHECK(films>=0),
 source TEXT NOT NULL DEFAULT 'owner_reconstruction',
 note TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE VIEW studio_export_totals AS
 SELECT day,1 AS exports,files,films FROM studio_exports
 UNION ALL
 SELECT day,exports,files,films FROM manual_studio_exports;
