CREATE MATERIALIZED VIEW IF NOT EXISTS commune_view AS 
    SELECT 
        (cm.doc->>'_id')::TEXT AS id,
        (cm.doc->>'_rev')::TEXT AS rev,
        (cm.doc->>'name')::TEXT AS name,
        (cm.doc->>'external_id')::TEXT AS external_id,
        (cm.doc->>'code')::TEXT AS code,
        
        CASE WHEN cm.doc->>'geolocation' IS NOT NULL AND cm.doc->>'geolocation' NOT IN ('', ' ', ',,') AND jsonb_typeof(cm.doc->'geolocation') IS NOT NULL AND 
                (
                    cm.doc->'geolocation'->>'latitude' IS NOT NULL AND cm.doc->'geolocation'->>'latitude' <> '' OR 
                    cm.doc->'geolocation'->>'longitude' IS NOT NULL AND cm.doc->'geolocation'->>'longitude' <> ''
                )
            THEN (cm.doc->'geolocation')::JSONB 
            ELSE NULL
        END AS geolocation,

        (cm.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((cm.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((cm.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM TO_TIMESTAMP((cm.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((cm.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
        (cm.doc->'parent'->>'_id')::TEXT AS prefecture_id,
        (cm.doc->'parent'->'parent'->>'_id')::TEXT AS region_id,
        (cm.doc->'parent'->'parent'->'parent'->>'_id')::TEXT AS country_id,
        json_build_object('id', c.id, 'name', c.name) AS country, 
        json_build_object('id', r.id, 'name', r.name) AS region, 
        json_build_object('id', p.id, 'name', p.name) AS prefecture 
    FROM couchdb cm 
        LEFT JOIN prefecture_view p ON (cm.doc->'parent'->>'_id')::TEXT = p.id 
        LEFT JOIN region_view r ON (cm.doc->'parent'->'parent'->>'_id')::TEXT = r.id 
        LEFT JOIN country_view c ON (cm.doc->'parent'->'parent'->'parent'->>'_id')::TEXT = c.id 
    WHERE cm.doc->'parent' ? '_id' 
        AND cm.doc->'parent'->'parent' ? '_id' 
        AND cm.doc->'parent'->'parent'->'parent' ? '_id' 
        AND (cm.doc->>'type' = 'commune' OR cm.doc->>'contact_type' = 'commune');