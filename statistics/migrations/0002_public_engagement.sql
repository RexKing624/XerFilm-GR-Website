CREATE TABLE community_likes (
 look_id TEXT NOT NULL,
 browser_hash TEXT NOT NULL,
 created_at TEXT NOT NULL,
 PRIMARY KEY (look_id,browser_hash)
);
CREATE INDEX community_likes_browser ON community_likes(browser_hash);
CREATE TABLE public_counters (
 key TEXT PRIMARY KEY,
 count INTEGER NOT NULL DEFAULT 0 CHECK(count>=0)
);
CREATE TRIGGER downloads_public_count_insert AFTER INSERT ON downloads
WHEN NEW.kind IN ('firmware','community') BEGIN
 INSERT INTO public_counters(key,count)
 VALUES(CASE WHEN NEW.kind='firmware' THEN 'firmware' ELSE 'download:'||NEW.revision END,1)
 ON CONFLICT(key) DO UPDATE SET count=count+1;
END;
CREATE TRIGGER downloads_public_count_delete AFTER DELETE ON downloads
WHEN OLD.kind IN ('firmware','community') BEGIN
 UPDATE public_counters SET count=MAX(0,count-1)
 WHERE key=CASE WHEN OLD.kind='firmware' THEN 'firmware' ELSE 'download:'||OLD.revision END;
END;
CREATE TRIGGER community_likes_count_insert AFTER INSERT ON community_likes BEGIN
 INSERT INTO public_counters(key,count) VALUES('like:'||NEW.look_id,1)
 ON CONFLICT(key) DO UPDATE SET count=count+1;
END;
CREATE TRIGGER community_likes_count_delete AFTER DELETE ON community_likes BEGIN
 UPDATE public_counters SET count=MAX(0,count-1) WHERE key='like:'||OLD.look_id;
END;
