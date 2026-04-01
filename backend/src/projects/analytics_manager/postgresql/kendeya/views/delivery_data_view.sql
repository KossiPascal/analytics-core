-- @name: delivery_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS delivery_data_view AS 
    WITH base AS (
        SELECT
            doc,
            (doc->>'_id')::TEXT AS id,
            (doc->>'_rev')::TEXT AS rev,
            (doc->>'form')::TEXT AS form,
            doc->'fields' AS fields,
            (doc->'geolocation')::JSONB AS geolocation,
            LOWER(doc->'fields'->>'patient_sex') AS patient_sex,
            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        FROM 
            kendeya_docs
        WHERE
            doc->>'form' IS NOT NULL
            AND doc->'fields' IS NOT NULL 
            AND doc->>'form' = 'delivery'
    )
    SELECT
        b.id,
        b.rev,
        b.form,
        EXTRACT(YEAR FROM b.reported_ts)::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0')::TEXT AS month,
        
        -- Sex and birth info
        CASE WHEN b.patient_sex IN ('male', 'homme', 'm') THEN 'M'
            WHEN b.patient_sex IN ('female', 'femme', 'f') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,

        NULLIF(b.fields->>'patient_date_of_birth', '')::DATE AS birth_date,
        NULLIF(b.fields->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
        NULLIF(b.fields->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
        NULLIF(b.fields->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,

        parse_json_boolean(b.fields->>'cpon_done') IS TRUE AS cpon_done,
        parse_json_boolean(b.fields->>'has_health_problem') IS TRUE AS has_health_problem,
        parse_json_boolean(b.fields->>'received_milda') IS TRUE AS received_milda,
        parse_json_boolean(b.fields->>'is_home_delivery') IS TRUE AS is_home_delivery,

        NULLIF(b.fields->>'cpon_done_date', '')::DATE AS cpon_done_date,
        NULLIF(b.fields->>'delivery_date', '')::DATE AS delivery_date,

        NULLIF(TRIM(b.fields->>'babies_alive_number'), '')::BIGINT AS babies_alive_number,
        NULLIF(TRIM(b.fields->>'babies_deceased_number'), '')::BIGINT AS babies_deceased_number,

        -- Location and report info
        NULLIF(b.fields->>'country_id', '') AS country_id,
        NULLIF(b.fields->>'region_id', '') AS region_id,
        NULLIF(b.fields->>'prefecture_id', '') AS prefecture_id,
        NULLIF(b.fields->>'commune_id', '') AS commune_id,
        NULLIF(b.fields->>'hospital_id', '') AS hospital_id,
        NULLIF(b.fields->>'district_quartier_id', '') AS district_quartier_id,
        NULLIF(b.fields->>'village_secteur_id', '') AS village_secteur_id,
        NULLIF(b.fields->>'household_id', '') AS family_id,
        NULLIF(b.fields->>'user_id', '') AS reco_id,
        NULLIF(b.fields->>'patient_id', '') AS patient_id,

        CAST(b.doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
        TO_CHAR(b.reported_ts, 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(b.reported_ts, 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        
        -- Géolocalisation propre
        CASE 
            WHEN jsonb_typeof(b.geolocation) = 'object'
            AND NULLIF(b.geolocation->>'latitude', '') IS NOT NULL
            AND NULLIF(b.geolocation->>'longitude', '') IS NOT NULL
            THEN b.geolocation
            ELSE NULL
        END::JSONB AS geolocation
        
    FROM base b;
        