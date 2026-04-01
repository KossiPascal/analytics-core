-- @name: family_view
-- @type: matview
-- @depends:
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS family_view AS 
    WITH base AS (
        SELECT
            doc,

            doc->>'household_has_good_water_access' AS has_good_water_access,
            doc->>'household_has_working_latrine' AS has_working_latrine,
            (doc->'geolocation')::JSONB AS geolocation,
            (doc->'contact')::JSONB AS contact,
        
            (doc->'user_info'->>'created_user_id')::TEXT AS reco_id,
            (doc->'parent'->>'_id')::TEXT AS village_secteur_id,
            (doc->'parent'->'parent'->>'_id')::TEXT AS district_quartier_id,
            (doc->'parent'->'parent'->'parent'->>'_id')::TEXT AS hospital_id,
            (doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS commune_id,
            (doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS prefecture_id,
            (doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS region_id,
            (doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS country_id, 

            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        FROM kendeya_docs
    )
    SELECT 
        (b.doc->>'_id')::TEXT AS id,
        (b.doc->>'_rev')::TEXT AS rev,
        (b.doc->>'name')::TEXT AS name,
        (b.doc->>'given_name')::TEXT AS given_name,
        (b.doc->>'external_id')::TEXT AS external_id,
        (b.doc->>'code')::TEXT AS code,
        (b.doc->>'householder_phone')::TEXT AS householder_phone,

        (CASE WHEN b.contact IS NOT NULL AND b.contact ? '_id'
            THEN b.contact->>'_id'
            ELSE NULL
        END)::TEXT AS householder_id,
        
        CASE 
            WHEN jsonb_typeof(b.geolocation) = 'object'
            AND NULLIF(b.geolocation->>'latitude', '') IS NOT NULL
            AND NULLIF(b.geolocation->>'longitude', '') IS NOT NULL
            THEN b.geolocation
            ELSE NULL
        END::JSONB AS geolocation,

        (b.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(b.reported_ts, 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(b.reported_ts, 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM b.reported_ts)::INTEGER  AS year,
        LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0')::TEXT AS month,

        CASE WHEN (b.has_working_latrine IS NOT NULL AND b.has_working_latrine <> '' AND
                (b.has_working_latrine = 'true' OR b.has_working_latrine = 'yes' OR b.has_working_latrine = '1')) 
            THEN true
            ELSE false
        END::BOOLEAN AS household_has_working_latrine,

        CASE WHEN (b.has_good_water_access IS NOT NULL AND b.has_good_water_access <> '' AND
                (b.has_good_water_access = 'true' OR b.has_good_water_access = 'yes' OR b.has_good_water_access = '1')) 
            THEN true
            ELSE false
        END::BOOLEAN AS household_has_good_water_access,
        
        b.reco_id,
        b.village_secteur_id,
        b.district_quartier_id,
        b.hospital_id,
        b.commune_id,
        b.prefecture_id,
        b.region_id,
        b.country_id, 

        json_build_object('id', c.id, 'name', c.name) AS country, 
        json_build_object('id', r.id, 'name', r.name) AS region, 
        json_build_object('id', p.id, 'name', p.name) AS prefecture, 
        json_build_object('id', cm.id, 'name', cm.name) AS commune, 
        json_build_object('id', h.id, 'name', h.name) AS hospital,
        json_build_object('id', d.id, 'name', d.name) AS district_quartier,
        json_build_object('id', v.id, 'name', v.name) AS village_secteur 

    FROM base b

        LEFT JOIN village_secteur_view v ON b.village_secteur_id = v.id 
        LEFT JOIN district_quartier_view d ON b.district_quartier_id = d.id 
        LEFT JOIN hospital_view h ON b.hospital_id = h.id 
        LEFT JOIN commune_view cm ON b.commune_id = cm.id 
        LEFT JOIN prefecture_view p ON b.prefecture_id = p.id 
        LEFT JOIN region_view r ON b.region_id = r.id 
        LEFT JOIN country_view c ON b.country_id = c.id 

    WHERE 
        -- (b.doc->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND 
        (b.doc->>'type' = 'clinic' OR b.doc->>'contact_type' = 'clinic');