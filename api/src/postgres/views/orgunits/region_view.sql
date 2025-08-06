CREATE MATERIALIZED VIEW IF NOT EXISTS region_view AS 
    SELECT 
        (r.doc->>'_id')::TEXT AS id,
        (r.doc->>'_rev')::TEXT AS rev,
        (r.doc->>'name')::TEXT AS name,
        (r.doc->>'external_id')::TEXT AS external_id,
        (r.doc->>'code')::TEXT AS code,
        
        CASE WHEN r.doc->>'geolocation' IS NOT NULL AND r.doc->>'geolocation' NOT IN ('', ' ', ',,') AND jsonb_typeof(r.doc->'geolocation') IS NOT NULL AND 
                (
                    r.doc->'geolocation'->>'latitude' IS NOT NULL AND r.doc->'geolocation'->>'latitude' <> '' OR 
                    r.doc->'geolocation'->>'longitude' IS NOT NULL AND r.doc->'geolocation'->>'longitude' <> ''
                )
            THEN (r.doc->'geolocation')::JSONB 
            ELSE NULL
        END AS geolocation,

        (r.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((r.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((r.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM TO_TIMESTAMP((r.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((r.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
        (r.doc->'parent'->>'_id')::TEXT AS country_id,
        json_build_object('id', c.id, 'name', c.name) AS country 
    FROM couchdb r 
        LEFT JOIN country_view c ON (r.doc->'parent'->>'_id')::TEXT = c.id 
    WHERE r.doc->'parent' ? '_id' AND (r.doc->>'type' = 'region' OR r.doc->>'contact_type' = 'region');