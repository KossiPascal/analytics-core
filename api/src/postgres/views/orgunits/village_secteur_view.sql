CREATE MATERIALIZED VIEW IF NOT EXISTS village_secteur_view AS 
    SELECT 
        (z.doc->>'_id')::TEXT AS id,
        (z.doc->>'_rev')::TEXT AS rev,
        (z.doc->>'name')::TEXT AS name,
        (z.doc->>'external_id')::TEXT AS external_id,
        (z.doc->>'code')::TEXT AS code,
        
        CASE WHEN z.doc->>'geolocation' IS NOT NULL AND z.doc->>'geolocation' NOT IN ('', ' ', ',,') AND jsonb_typeof(z.doc->'geolocation') IS NOT NULL AND 
                (
                    z.doc->'geolocation'->>'latitude' IS NOT NULL AND z.doc->'geolocation'->>'latitude' <> '' OR 
                    z.doc->'geolocation'->>'longitude' IS NOT NULL AND z.doc->'geolocation'->>'longitude' <> ''
                )
            THEN (z.doc->'geolocation')::JSONB 
            ELSE NULL
        END AS geolocation,

        (z.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((z.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((z.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM TO_TIMESTAMP((z.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((z.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
        (z.doc->'contact'->>'_id')::TEXT AS reco_id,
        (z.doc->'parent'->>'_id')::TEXT AS district_quartier_id,
        (z.doc->'parent'->'parent'->>'_id')::TEXT AS hospital_id,
        (z.doc->'parent'->'parent'->'parent'->>'_id')::TEXT AS commune_id,
        (z.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS prefecture_id,
        (z.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS region_id,
        (z.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS country_id,
        json_build_object('id', c.id, 'name', c.name) AS country, 
        json_build_object('id', r.id, 'name', r.name) AS region, 
        json_build_object('id', p.id, 'name', p.name) AS prefecture, 
        json_build_object('id', cm.id, 'name', cm.name) AS commune, 
        json_build_object('id', h.id, 'name', h.name) AS hospital,
        json_build_object('id', d.id, 'name', d.name) AS district_quartier  
    FROM couchdb z 
        LEFT JOIN district_quartier_view d ON (z.doc->'parent'->>'_id')::TEXT = d.id 
        LEFT JOIN hospital_view h ON (z.doc->'parent'->'parent'->>'_id')::TEXT = h.id 
        LEFT JOIN commune_view cm ON (z.doc->'parent'->'parent'->'parent'->>'_id')::TEXT = cm.id 
        LEFT JOIN prefecture_view p ON (z.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = p.id 
        LEFT JOIN region_view r ON (z.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = r.id 
        LEFT JOIN country_view c ON (z.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = c.id 
    WHERE z.doc->'parent' ? '_id' 
        AND z.doc->'parent'->'parent' ? '_id' 
        AND z.doc->'parent'->'parent'->'parent' ? '_id' 
        AND z.doc->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND z.doc->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND z.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND (z.doc->>'type' = 'health_center' OR z.doc->>'contact_type' = 'health_center');