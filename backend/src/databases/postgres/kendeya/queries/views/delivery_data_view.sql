CREATE MATERIALIZED VIEW IF NOT EXISTS delivery_data_view AS 
    SELECT
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'form')::TEXT AS form,
        EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(doc->>'reported_date' AS BIGINT) / 1000))::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')::TEXT AS month,
        
        -- Sex and birth info
        CASE WHEN LOWER(doc->'fields'->>'patient_sex') IN ('male', 'homme', 'm') THEN 'M'
            WHEN LOWER(doc->'fields'->>'patient_sex') IN ('female', 'femme', 'f') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,
        NULLIF(doc->'fields'->>'patient_date_of_birth', '')::DATE AS birth_date,
        NULLIF(doc->'fields'->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
        NULLIF(doc->'fields'->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
        NULLIF(doc->'fields'->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,

        parse_json_boolean(doc->'fields'->>'cpon_done') IS TRUE AS cpon_done,
        parse_json_boolean(doc->'fields'->>'has_health_problem') IS TRUE AS has_health_problem,
        parse_json_boolean(doc->'fields'->>'received_milda') IS TRUE AS received_milda,
        parse_json_boolean(doc->'fields'->>'is_home_delivery') IS TRUE AS is_home_delivery,

        NULLIF(doc->'fields'->>'cpon_done_date', '')::DATE AS cpon_done_date,
        NULLIF(doc->'fields'->>'delivery_date', '')::DATE AS delivery_date,

        NULLIF(TRIM(doc->'fields'->>'babies_alive_number'), '')::BIGINT AS babies_alive_number,
        NULLIF(TRIM(doc->'fields'->>'babies_deceased_number'), '')::BIGINT AS babies_deceased_number,


        -- Location and report info
        NULLIF(doc->'fields'->>'country_id', '') AS country_id,
        NULLIF(doc->'fields'->>'region_id', '') AS region_id,
        NULLIF(doc->'fields'->>'prefecture_id', '') AS prefecture_id,
        NULLIF(doc->'fields'->>'commune_id', '') AS commune_id,
        NULLIF(doc->'fields'->>'hospital_id', '') AS hospital_id,
        NULLIF(doc->'fields'->>'district_quartier_id', '') AS district_quartier_id,
        NULLIF(doc->'fields'->>'village_secteur_id', '') AS village_secteur_id,
        NULLIF(doc->'fields'->>'household_id', '') AS family_id,
        NULLIF(doc->'fields'->>'user_id', '') AS reco_id,
        NULLIF(doc->'fields'->>'patient_id', '') AS patient_id,
        CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        
        -- Géolocalisation propre
        CASE 
            WHEN jsonb_typeof(doc->'geolocation') = 'object'
                AND COALESCE(NULLIF(doc->'geolocation'->>'latitude', ''), NULL) IS NOT NULL
                AND COALESCE(NULLIF(doc->'geolocation'->>'longitude', ''), NULL) IS NOT NULL
            THEN doc->'geolocation'
            ELSE NULL
        END::JSONB  AS geolocation 
        
    FROM 
        couchdb
    WHERE
        doc->>'form' IS NOT NULL
        AND doc->'fields' IS NOT NULL 
        AND doc->>'form' = 'delivery'; 
        