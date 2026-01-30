CREATE MATERIALIZED VIEW IF NOT EXISTS family_view AS 
    SELECT 
        (f.doc->>'_id')::TEXT AS id,
        (f.doc->>'_rev')::TEXT AS rev,
        (f.doc->>'name')::TEXT AS name,
        (f.doc->>'given_name')::TEXT AS given_name,
        (f.doc->>'external_id')::TEXT AS external_id,
        (f.doc->>'code')::TEXT AS code,
        (f.doc->>'householder_phone')::TEXT AS householder_phone,

        (CASE WHEN f.doc->'contact' IS NOT NULL AND f.doc->>'contact' <> '' AND f.doc->'contact'->>'_id' IS NOT NULL AND f.doc->'contact'->>'_id' <> ''
            THEN f.doc->'contact'->>'_id'
            ELSE NULL
        END)::TEXT AS householder_id,

        CASE WHEN f.doc->>'geolocation' IS NOT NULL AND f.doc->>'geolocation' NOT IN ('', ' ', ',,') AND jsonb_typeof(f.doc->'geolocation') IS NOT NULL AND 
                (
                    f.doc->'geolocation'->>'latitude' IS NOT NULL AND f.doc->'geolocation'->>'latitude' <> '' OR 
                    f.doc->'geolocation'->>'longitude' IS NOT NULL AND f.doc->'geolocation'->>'longitude' <> ''
                )
            THEN (f.doc->'geolocation')::JSONB 
            ELSE NULL
        END AS geolocation,

        (f.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,

        CASE WHEN (f.doc->>'household_has_working_latrine' IS NOT NULL AND f.doc->>'household_has_working_latrine' <> '' AND
                (f.doc->>'household_has_working_latrine' = 'true' OR f.doc->>'household_has_working_latrine' = 'yes' OR f.doc->>'household_has_working_latrine' = '1')) 
            THEN true
            ELSE false
        END::BOOLEAN AS household_has_working_latrine,
        CASE WHEN (f.doc->>'household_has_good_water_access' IS NOT NULL AND f.doc->>'household_has_good_water_access' <> '' AND
                (f.doc->>'household_has_good_water_access' = 'true' OR f.doc->>'household_has_good_water_access' = 'yes' OR f.doc->>'household_has_good_water_access' = '1')) 
            THEN true
            ELSE false
        END::BOOLEAN AS household_has_good_water_access,
        
        (f.doc->'user_info'->>'created_user_id')::TEXT AS reco_id,
        (f.doc->'parent'->>'_id')::TEXT AS village_secteur_id,
        (f.doc->'parent'->'parent'->>'_id')::TEXT AS district_quartier_id,
        (f.doc->'parent'->'parent'->'parent'->>'_id')::TEXT AS hospital_id,
        (f.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS commune_id,
        (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS prefecture_id,
        (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS region_id,
        (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS country_id, 
        json_build_object('id', c.id, 'name', c.name) AS country, 
        json_build_object('id', r.id, 'name', r.name) AS region, 
        json_build_object('id', p.id, 'name', p.name) AS prefecture, 
        json_build_object('id', cm.id, 'name', cm.name) AS commune, 
        json_build_object('id', h.id, 'name', h.name) AS hospital,
        json_build_object('id', d.id, 'name', d.name) AS district_quartier,
        json_build_object('id', v.id, 'name', v.name) AS village_secteur 
    FROM couchdb f 
        LEFT JOIN village_secteur_view v ON (f.doc->'parent'->>'_id')::TEXT = v.id 
        LEFT JOIN district_quartier_view d ON (f.doc->'parent'->'parent'->>'_id')::TEXT = d.id 
        LEFT JOIN hospital_view h ON (f.doc->'parent'->'parent'->'parent'->>'_id')::TEXT = h.id 
        LEFT JOIN commune_view cm ON (f.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = cm.id 
        LEFT JOIN prefecture_view p ON (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = p.id 
        LEFT JOIN region_view r ON (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = r.id 
        LEFT JOIN country_view c ON (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = c.id 
    WHERE f.doc->'parent' ? '_id' 
        AND f.doc->'parent'->'parent' ? '_id' 
        AND f.doc->'parent'->'parent'->'parent' ? '_id' 
        AND f.doc->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND f.doc->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND (f.doc->>'type' = 'clinic' OR f.doc->>'contact_type' = 'clinic');