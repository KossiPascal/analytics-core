CREATE MATERIALIZED VIEW IF NOT EXISTS patient_view AS 
    SELECT 
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'name')::TEXT AS name,
        (doc->>'external_id')::TEXT AS external_id,
        (doc->>'code')::TEXT AS code,

        CASE 
            WHEN jsonb_typeof(doc->'geolocation') = 'object'
            AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
            AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
            THEN doc->'geolocation'
            ELSE NULL
        END::JSONB AS geolocation,

        (doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

        EXTRACT(YEAR FROM TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000))::INTEGER AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
        
        DATE_TRUNC('month', TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000)) AS month_key,

        AGE(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), (COALESCE(doc->>'date_of_birth', '1850-01-01'))::DATE) AS age_on_creation,

        AGE(CURRENT_DATE, COALESCE(doc->>'date_of_birth', '1850-01-01')::DATE) AS current_age,

        DATE_PART('year', AGE(CURRENT_DATE, COALESCE(doc->>'date_of_birth', '1850-01-01')::DATE))::INT AS current_age_in_year,

        (doc->>'role')::TEXT AS role,
        (COALESCE(doc->>'date_of_birth', '1850-01-01'))::DATE AS birth_date,
        (doc->>'phone')::TEXT AS phone,
        (doc->>'phone_other')::TEXT AS phone_other,
        (doc->>'email')::TEXT AS email,
        (doc->>'profession')::TEXT AS profession,
        
        CASE WHEN doc->>'date_of_death' IS NOT NULL AND doc->>'date_of_death' <> '' 
            THEN TO_DATE(doc->>'date_of_death', 'YYYY-MM-DD')
            ELSE NULL
        END::DATE AS death_date,

        CASE WHEN doc->>'date_of_death' IS NOT NULL AND doc->>'date_of_death' <> '' 
            THEN EXTRACT(YEAR FROM TO_DATE(doc->>'date_of_death', 'YYYY-MM-DD'))
            ELSE NULL
        END::BIGINT AS year_of_death,
        CASE WHEN doc->>'date_of_death' IS NOT NULL AND doc->>'date_of_death' <> '' 
            THEN LPAD(EXTRACT(MONTH FROM TO_DATE(doc->>'date_of_death', 'YYYY-MM-DD'))::TEXT, 2, '0')                            
            ELSE NULL
        END::TEXT AS month_of_death,
        CASE WHEN doc->>'sex' IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
            WHEN doc->>'sex' IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,
        CASE WHEN (doc->>'has_birth_certificate' IS NOT NULL AND doc->>'has_birth_certificate' <> '' AND
                (doc->>'has_birth_certificate' = 'true' OR doc->>'has_birth_certificate' = 'yes' OR doc->>'has_birth_certificate' = '1')) 
            THEN true
            ELSE false
        END::BOOLEAN AS has_birth_certificate,
        CASE WHEN (doc->>'is_home_death' IS NOT NULL AND doc->>'is_home_death' <> '' AND
                (doc->>'is_home_death' = 'true' OR doc->>'is_home_death' = 'yes' OR doc->>'is_home_death' = '1')) 
            THEN true
            ELSE false
        END::BOOLEAN AS is_home_death,
        CASE WHEN (doc->>'is_stillbirth' IS NOT NULL AND doc->>'is_stillbirth' <> '' AND
                (doc->>'is_stillbirth' = 'true' OR doc->>'is_stillbirth' = 'yes' OR doc->>'is_stillbirth' = '1')) 
            THEN true
            ELSE false
        END::BOOLEAN AS is_stillbirth,
        CASE WHEN doc->>'date_of_birth' IS NOT NULL AND doc->>'date_of_birth' <> '' THEN
                EXTRACT(YEAR FROM TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000)) - EXTRACT(YEAR FROM TO_DATE(doc->>'date_of_birth', 'YYYY-MM-DD'))
            ELSE NULL
        END::BIGINT AS age_in_year_on_creation,
        CASE WHEN doc->>'date_of_birth' IS NOT NULL AND doc->>'date_of_birth' <> '' THEN
                (EXTRACT(YEAR FROM TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000)) - EXTRACT(YEAR FROM TO_DATE(doc->>'date_of_birth', 'YYYY-MM-DD'))) * 12 
                + (EXTRACT(MONTH FROM TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000)) - EXTRACT(MONTH FROM TO_DATE(doc->>'date_of_birth', 'YYYY-MM-DD')))
            ELSE NULL
        END::BIGINT AS age_in_month_on_creation,
        CASE WHEN doc->>'date_of_birth' IS NOT NULL AND doc->>'date_of_birth' <> '' THEN
                (EXTRACT(EPOCH FROM (TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) - TO_DATE(doc->>'date_of_birth', 'YYYY-MM-DD'))) / 86400)
            ELSE NULL
        END::BIGINT AS age_in_day_on_creation,

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
        json_build_object('id', c.id, 'name', c.name) AS country, 
        json_build_object('id', r.id, 'name', r.name) AS region, 
        json_build_object('id', p.id, 'name', p.name) AS prefecture, 
        json_build_object('id', cm.id, 'name', cm.name) AS commune, 
        json_build_object('id', h.id, 'name', h.name) AS hospital,
        json_build_object('id', d.id, 'name', d.name) AS district_quartier,
        json_build_object('id', v.id, 'name', v.name) AS village_secteur,
        json_build_object('id', fm.id, 'name', fm.name) AS family,
        json_build_object('id', rc.id, 'name', rc.name) AS reco 

    FROM couchdb 
        LEFT JOIN family_view fm ON (doc->'parent'->>'_id')::TEXT = fm.id 
        LEFT JOIN village_secteur_view v ON (doc->'parent'->'parent'->>'_id')::TEXT = v.id 
        LEFT JOIN district_quartier_view d ON (doc->'parent'->'parent'->'parent'->>'_id')::TEXT = d.id 
        LEFT JOIN hospital_view h ON (doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = h.id 
        LEFT JOIN commune_view cm ON (doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = cm.id 
        LEFT JOIN prefecture_view p ON (doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = p.id 
        LEFT JOIN region_view r ON (doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = r.id 
        LEFT JOIN country_view c ON (doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT = c.id 
        LEFT JOIN reco_view rc ON (doc->'user_info'->>'created_user_id')::TEXT = rc.id 
        
    WHERE doc->'parent' ? '_id' 
        AND doc->'parent'->'parent' ? '_id' 
        AND doc->'parent'->'parent'->'parent' ? '_id' 
        AND doc->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND doc->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
        AND doc->>'type' = 'person' 
        AND doc->>'role' = 'patient';