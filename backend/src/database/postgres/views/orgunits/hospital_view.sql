CREATE MATERIALIZED VIEW IF NOT EXISTS hospital_view AS 
    SELECT 
        (h.doc->>'_id')::TEXT AS id,
        (h.doc->>'_rev')::TEXT AS rev,
        (h.doc->>'name')::TEXT AS name,
        (h.doc->>'external_id')::TEXT AS external_id,
        (h.doc->>'code')::TEXT AS code,
        
        CASE WHEN h.doc->>'geolocation' IS NOT NULL AND h.doc->>'geolocation' NOT IN ('', ' ', ',,') AND jsonb_typeof(h.doc->'geolocation') IS NOT NULL AND 
                (
                    h.doc->'geolocation'->>'latitude' IS NOT NULL AND h.doc->'geolocation'->>'latitude' <> '' OR 
                    h.doc->'geolocation'->>'longitude' IS NOT NULL AND h.doc->'geolocation'->>'longitude' <> ''
                )
            THEN (h.doc->'geolocation')::JSONB 
            ELSE NULL
        END AS geolocation,

        (h.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((h.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((h.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM TO_TIMESTAMP((h.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((h.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
        (h.doc->'parent'->>'_id')::TEXT AS commune_id,
        (h.doc->'parent'->'parent'->>'_id')::TEXT AS prefecture_id,
        (h.doc->'parent'->'parent'->'parent'->>'_id')::TEXT AS region_id,
        (h.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS country_id,
        json_build_object('id', c.id, 'name', c.name) AS country, 
        json_build_object('id', r.id, 'name', r.name) AS region, 
        json_build_object('id', p.id, 'name', p.name) AS prefecture, 
        json_build_object('id', cm.id, 'name', cm.name) AS commune  
    FROM couchdb h 
        LEFT JOIN commune_view cm ON (h.doc->'parent'->>'_id')::TEXT = cm.id 
        LEFT JOIN prefecture_view p ON (h.doc->'parent'->'parent'->>'_id')::TEXT = p.id 
        LEFT JOIN region_view r ON (h.doc->'parent'->'parent'->'parent'->>'_id')::TEXT = r.id 
        LEFT JOIN country_view c ON (h.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = c.id
    WHERE h.doc->'parent' ? '_id' 
        AND h.doc->'parent'->'parent' ? '_id' 
        AND h.doc->'parent'->'parent'->'parent' ? '_id' 
        AND h.doc->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND (h.doc->>'type' = 'hospital' OR h.doc->>'contact_type' = 'hospital');