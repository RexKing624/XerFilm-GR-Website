-- One atomic, repeatable initialization of counters for pre-existing downloads.
-- Migrations install triggers first, so concurrent new events remain accounted for.
INSERT INTO public_counters(key,count)
SELECT CASE WHEN kind='firmware' THEN 'firmware' ELSE 'download:'||revision END,COUNT(*)
FROM downloads WHERE kind IN ('firmware','community')
GROUP BY CASE WHEN kind='firmware' THEN 'firmware' ELSE 'download:'||revision END
ON CONFLICT(key) DO UPDATE SET count=excluded.count;
