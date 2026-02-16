CREATE MATERIALIZED VIEW IF NOT EXISTS zone_view AS
SELECT    
    (doc->>'_id')::TEXT AS id,
    (doc->>'_rev')::TEXT AS rev,
    NULLIF(doc->>'name', '') AS name,

    CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

    date_to_ih_month_year('month', (doc->>'reported_date')::BIGINT)::TEXT AS month,
    date_to_ih_month_year('year', (doc->>'reported_date')::BIGINT)::INTEGER AS year,

    'tonoudayo' AS source,
    NULLIF(doc->>'external_id', '') AS external_id,
    NULLIF(doc->'contact'->>'_id', '') AS chw_id,
    NULLIF(doc->'parent'->>'_id', '') AS site_id,

    (d.id) AS district_id,

    CASE
        WHEN jsonb_typeof((doc->'geolocation')::JSONB) = 'object'
            AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
            AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
            THEN doc->'geolocation'
        ELSE NULL
    END::JSONB AS geolocation

FROM tonoudayo_docs
   LEFT JOIN site_view s ON s.id = doc->'parent'->>'_id' AND doc->'parent'->>'_id' IS NOT NULL
   LEFT JOIN district_view d ON d.id = s.district_id
WHERE
  doc->>'type' = 'health_center';
