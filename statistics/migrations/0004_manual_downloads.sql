CREATE TABLE manual_downloads (
 day TEXT NOT NULL,
 model TEXT NOT NULL CHECK(model IN ('gr3','gr3x','gr4')),
 variant TEXT NOT NULL CHECK(variant IN ('standard','enhanced')),
 version TEXT NOT NULL,
 count INTEGER NOT NULL CHECK(count>=0),
 source TEXT NOT NULL DEFAULT 'owner_reconstruction',
 note TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(day,model,variant,version)
);
CREATE INDEX manual_downloads_day ON manual_downloads(day);
CREATE VIEW download_totals AS
 SELECT day,kind,model,variant,version,revision,sha256,1 AS count,'automatic' AS source FROM downloads
 UNION ALL
 SELECT day,'firmware' AS kind,model,variant,version,NULL AS revision,NULL AS sha256,count,'manual' AS source FROM manual_downloads;
