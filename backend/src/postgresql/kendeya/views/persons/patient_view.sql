-- @name: patient_view
-- @type: matview
-- @depends:
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS patient_view AS 
    WITH base AS (
        SELECT
            doc,

            doc->>'date_of_birth' AS date_of_birth,
            doc->>'date_of_death' AS date_of_death,
            doc->>'has_birth_certificate' AS has_birth_certificate,
            doc->>'is_home_death' AS is_home_death,
            doc->>'is_stillbirth' AS is_stillbirth,

            (doc->'geolocation')::JSONB AS geolocation,

            doc->>'sex' AS sex,

            (doc->'user_info'->>'created_user_id')::TEXT AS reco_id,
            (doc->>'relationship_with_household_head')::TEXT AS relationship_with_household_head,
            
            (doc->'parent'->>'_id')::TEXT AS family_id,
            (doc->'parent'->'parent'->>'_id')::TEXT AS village_secteur_id,
            (doc->'parent'->'parent'->'parent'->>'_id')::TEXT AS district_quartier_id,
            (doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS hospital_id,
            (doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS commune_id,
            (doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS prefecture_id,
            (doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS region_id,
            (doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS country_id, 

            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        FROM kendeya_docs
    )

    SELECT 
        (b.doc->>'_id')::TEXT AS id,
        (b.doc->>'_rev')::TEXT AS rev,
        (b.doc->>'name')::TEXT AS name,
        (doc->>'firstname')::TEXT AS firstname,
        (doc->>'lastname')::TEXT AS lastname,
        (b.doc->>'external_id')::TEXT AS external_id,
        (b.doc->>'code')::TEXT AS code,

        (b.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(b.reported_ts, 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(b.reported_ts, 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

        EXTRACT(YEAR FROM b.reported_ts)::INTEGER AS year,
        LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0')::TEXT AS month,
        
        DATE_TRUNC('month', b.reported_ts) AS month_key,

        AGE(b.reported_ts, (COALESCE(b.date_of_birth, '1850-01-01'))::DATE) AS age_on_creation,

        AGE(CURRENT_DATE, COALESCE(b.date_of_birth, '1850-01-01')::DATE) AS current_age,

        DATE_PART('year', AGE(CURRENT_DATE, COALESCE(b.date_of_birth, '1850-01-01')::DATE))::INT AS current_age_in_year,

        (b.doc->>'role')::TEXT AS role,
        (COALESCE(b.date_of_birth, '1850-01-01'))::DATE AS birth_date,
        (b.doc->>'phone')::TEXT AS phone,
        (b.doc->>'phone_other')::TEXT AS phone_other,
        (b.doc->>'email')::TEXT AS email,
        (b.doc->>'profession')::TEXT AS profession,
        
        CASE WHEN b.date_of_death IS NOT NULL AND b.date_of_death <> '' 
            THEN TO_DATE(b.date_of_death, 'YYYY-MM-DD')
            ELSE NULL
        END::DATE AS death_date,

        CASE WHEN b.date_of_death IS NOT NULL AND b.date_of_death <> '' 
            THEN EXTRACT(YEAR FROM TO_DATE(b.date_of_death, 'YYYY-MM-DD'))
            ELSE NULL
        END::BIGINT AS year_of_death,

        CASE WHEN b.date_of_death IS NOT NULL AND b.date_of_death <> '' 
            THEN LPAD(EXTRACT(MONTH FROM TO_DATE(b.date_of_death, 'YYYY-MM-DD'))::TEXT, 2, '0')                            
            ELSE NULL
        END::TEXT AS month_of_death,

        CASE WHEN b.sex IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
            WHEN b.sex IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,

        CASE WHEN (b.has_birth_certificate IS NOT NULL AND b.has_birth_certificate <> '' AND
                (b.has_birth_certificate = 'true' OR b.has_birth_certificate = 'yes' OR b.has_birth_certificate = '1')) 
            THEN true
            ELSE false
        END::BOOLEAN AS has_birth_certificate,

        CASE WHEN (b.is_home_death IS NOT NULL AND b.is_home_death <> '' AND
                (b.is_home_death = 'true' OR b.is_home_death = 'yes' OR b.is_home_death = '1')) 
            THEN true
            ELSE false
        END::BOOLEAN AS is_home_death,

        CASE WHEN (b.is_stillbirth IS NOT NULL AND b.is_stillbirth <> '' AND
                (b.is_stillbirth = 'true' OR b.is_stillbirth = 'yes' OR b.is_stillbirth = '1')) 
            THEN true
            ELSE false
        END::BOOLEAN AS is_stillbirth,

        CASE WHEN b.date_of_birth IS NOT NULL AND b.date_of_birth <> '' THEN
                EXTRACT(YEAR FROM b.reported_ts) - EXTRACT(YEAR FROM TO_DATE(b.date_of_birth, 'YYYY-MM-DD'))
            ELSE NULL
        END::BIGINT AS age_in_year_on_creation,
        CASE WHEN b.date_of_birth IS NOT NULL AND b.date_of_birth <> '' THEN
                (EXTRACT(YEAR FROM b.reported_ts) - EXTRACT(YEAR FROM TO_DATE(b.date_of_birth, 'YYYY-MM-DD'))) * 12 
                + (EXTRACT(MONTH FROM b.reported_ts) - EXTRACT(MONTH FROM TO_DATE(b.date_of_birth, 'YYYY-MM-DD')))
            ELSE NULL
        END::BIGINT AS age_in_month_on_creation,
        CASE WHEN b.date_of_birth IS NOT NULL AND b.date_of_birth <> '' THEN
                (EXTRACT(EPOCH FROM (b.reported_ts - TO_DATE(b.date_of_birth, 'YYYY-MM-DD'))) / 86400)
            ELSE NULL
        END::BIGINT AS age_in_day_on_creation,

        CASE 
            WHEN jsonb_typeof(b.geolocation) = 'object'
            AND NULLIF(b.geolocation->>'latitude', '') IS NOT NULL
            AND NULLIF(b.geolocation->>'longitude', '') IS NOT NULL
            THEN b.geolocation
            ELSE NULL
        END::JSONB AS geolocation,

        b.reco_id,
        b.relationship_with_household_head,
        
        b.family_id,
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
        json_build_object('id', v.id, 'name', v.name) AS village_secteur,
        json_build_object('id', fm.id, 'name', fm.name) AS family,
        json_build_object('id', rc.id, 'name', rc.name) AS reco 

    FROM base b
        LEFT JOIN family_view fm ON b.family_id = fm.id 
        LEFT JOIN village_secteur_view v ON b.village_secteur_id = v.id 
        LEFT JOIN district_quartier_view d ON b.district_quartier_id = d.id 
        LEFT JOIN hospital_view h ON b.hospital_id = h.id 
        LEFT JOIN commune_view cm ON b.commune_id = cm.id 
        LEFT JOIN prefecture_view p ON b.prefecture_id = p.id 
        LEFT JOIN region_view r ON b.region_id = r.id 
        LEFT JOIN country_view c ON b.country_id = c.id 
        LEFT JOIN reco_view rc ON b.reco_id = rc.id 
        
    WHERE 
        -- (b.doc->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND 
        b.doc->>'type' = 'person' AND b.doc->>'role' = 'patient';