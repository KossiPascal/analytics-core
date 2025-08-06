CREATE MATERIALIZED VIEW IF NOT EXISTS country_view AS
    SELECT 
        (c.doc->>'_id')::TEXT AS id,
        (c.doc->>'_rev')::TEXT AS rev,
        (c.doc->>'name')::TEXT AS name,
        (c.doc->>'external_id')::TEXT AS external_id,
        (c.doc->>'code')::TEXT AS code,
        
        CASE WHEN c.doc->>'geolocation' IS NOT NULL AND c.doc->>'geolocation' NOT IN ('', ' ', ',,') AND jsonb_typeof(c.doc->'geolocation') IS NOT NULL AND 
                (
                    c.doc->'geolocation'->>'latitude' IS NOT NULL AND c.doc->'geolocation'->>'latitude' <> '' OR 
                    c.doc->'geolocation'->>'longitude' IS NOT NULL AND c.doc->'geolocation'->>'longitude' <> ''
                )
            THEN (c.doc->'geolocation')::JSONB 
            ELSE NULL
        END AS geolocation,

        (c.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((c.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((c.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM TO_TIMESTAMP((c.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((c.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0') AS month 
    FROM couchdb c
    WHERE c.doc->>'type' = 'country' OR c.doc->>'contact_type' = 'country';