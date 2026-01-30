CREATE MATERIALIZED VIEW IF NOT EXISTS prefecture_view AS 
    SELECT 
        (p.doc->>'_id')::TEXT AS id,
        (p.doc->>'_rev')::TEXT AS rev,
        (p.doc->>'name')::TEXT AS name,
        (p.doc->>'external_id')::TEXT AS external_id,
        (p.doc->>'code')::TEXT AS code,
        
        CASE WHEN p.doc->>'geolocation' IS NOT NULL AND p.doc->>'geolocation' NOT IN ('', ' ', ',,') AND jsonb_typeof(p.doc->'geolocation') IS NOT NULL AND 
                (
                    p.doc->'geolocation'->>'latitude' IS NOT NULL AND p.doc->'geolocation'->>'latitude' <> '' OR 
                    p.doc->'geolocation'->>'longitude' IS NOT NULL AND p.doc->'geolocation'->>'longitude' <> ''
                )
            THEN (p.doc->'geolocation')::JSONB 
            ELSE NULL
        END AS geolocation, 

        (p.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
        (p.doc->'parent'->>'_id')::TEXT AS region_id,
        (p.doc->'parent'->'parent'->>'_id')::TEXT AS country_id,
        json_build_object('id', c.id, 'name', c.name) AS country,
        json_build_object('id', r.id, 'name', r.name) AS region 
    FROM couchdb p 
        LEFT JOIN region_view r ON (p.doc->'parent'->>'_id')::TEXT = r.id 
        LEFT JOIN country_view c ON (p.doc->'parent'->'parent'->>'_id')::TEXT = c.id 
    WHERE p.doc->'parent' ? '_id' 
        AND p.doc->'parent'->'parent' ? '_id' 
        AND (p.doc->>'type' = 'prefecture' OR p.doc->>'contact_type' = 'prefecture');