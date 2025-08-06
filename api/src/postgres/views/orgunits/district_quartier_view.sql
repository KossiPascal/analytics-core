CREATE MATERIALIZED VIEW IF NOT EXISTS district_quartier_view AS 
    SELECT 
        (d.doc->>'_id')::TEXT AS id,
        (d.doc->>'_rev')::TEXT AS rev,
        (d.doc->>'name')::TEXT AS name,
        (d.doc->>'external_id')::TEXT AS external_id,
        (d.doc->>'code')::TEXT AS code,
        
        CASE WHEN d.doc->>'geolocation' IS NOT NULL AND d.doc->>'geolocation' NOT IN ('', ' ', ',,') AND jsonb_typeof(d.doc->'geolocation') IS NOT NULL AND 
                (
                    d.doc->'geolocation'->>'latitude' IS NOT NULL AND d.doc->'geolocation'->>'latitude' <> '' OR 
                    d.doc->'geolocation'->>'longitude' IS NOT NULL AND d.doc->'geolocation'->>'longitude' <> ''
                )
            THEN (d.doc->'geolocation')::JSONB 
            ELSE NULL
        END AS geolocation,

        (d.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((d.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((d.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM TO_TIMESTAMP((d.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((d.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
        (d.doc->'parent'->>'_id')::TEXT AS hospital_id,
        (d.doc->'parent'->'parent'->>'_id')::TEXT AS commune_id,
        (d.doc->'parent'->'parent'->'parent'->>'_id')::TEXT AS prefecture_id,
        (d.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS region_id,
        (d.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS country_id,
        json_build_object('id', c.id, 'name', c.name) AS country, 
        json_build_object('id', r.id, 'name', r.name) AS region, 
        json_build_object('id', p.id, 'name', p.name) AS prefecture, 
        json_build_object('id', cm.id, 'name', cm.name) AS commune, 
        json_build_object('id', h.id, 'name', h.name) AS hospital 
    FROM couchdb d 
        LEFT JOIN hospital_view h ON (d.doc->'parent'->>'_id')::TEXT = h.id 
        LEFT JOIN commune_view cm ON (d.doc->'parent'->'parent'->>'_id')::TEXT = cm.id 
        LEFT JOIN prefecture_view p ON (d.doc->'parent'->'parent'->'parent'->>'_id')::TEXT = p.id 
        LEFT JOIN region_view r ON (d.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = r.id 
        LEFT JOIN country_view c ON (d.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = c.id 
    WHERE d.doc->'parent' ? '_id' 
        AND d.doc->'parent'->'parent' ? '_id' 
        AND d.doc->'parent'->'parent'->'parent' ? '_id' 
        AND d.doc->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND d.doc->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND (d.doc->>'type' = 'district_hospital' OR d.doc->>'contact_type' = 'district_hospital');