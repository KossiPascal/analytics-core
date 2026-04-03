-- @name: death_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS death_data_view AS 
WITH base AS (
    SELECT
        doc,
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'form')::TEXT AS form, 
        doc->'fields' AS fields,
        LOWER(doc->'fields'->>'patient_sex') AS patient_sex,
        string_to_array(NULLIF(doc->'fields'->>'death_reason', ''), ' ') AS death_reason_array,
        (doc->'geolocation')::JSONB AS geolocation,
        TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        
    FROM kendeya_docs
    WHERE doc->>'form' = 'death_report' AND doc->'fields' IS NOT NULL
)
SELECT
    b.id,
    b.rev,
    b.form,

    EXTRACT(YEAR FROM b.reported_ts)::BIGINT AS year,
    LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0') AS month,

    -- Simplified sex normalization
    CASE 
        WHEN b.patient_sex IN ('male', 'homme', 'm') THEN 'M'
        WHEN b.patient_sex IN ('female', 'femme', 'f') THEN 'F'
        ELSE NULL
    END AS sex,

    -- Age and birth data
    NULLIF(b.fields->>'patient_date_of_birth', '')::DATE AS birth_date,
    NULLIF(b.fields->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
    NULLIF(b.fields->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
    NULLIF(b.fields->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,

    NULLIF(b.fields->>'date_of_death', '') AS death_date,
    NULLIF(b.fields->>'death_place', '') AS death_place,
    NULLIF(b.fields->>'death_place_label', '') AS death_place_label,
    NULLIF(b.fields->>'death_reason_label', '') AS death_reason_label,

    parse_json_boolean(b.fields->>'is_maternal_death') IS TRUE AS is_maternal_death,
    parse_json_boolean(b.fields->>'is_home_death') IS TRUE AS is_home_death,

    b.death_reason_array AS death_reason,

    -- Boolean flags from death_reason
    b.death_reason_array @> ARRAY['malaria'] AS has_malaria,
    b.death_reason_array @> ARRAY['diarrhea'] AS has_diarrhea,
    b.death_reason_array @> ARRAY['malnutrition'] AS has_malnutrition,
    b.death_reason_array @> ARRAY['cough_cold'] AS has_cough_cold,
    b.death_reason_array @> ARRAY['pneumonia'] AS has_pneumonia,
    b.death_reason_array @> ARRAY['maternal_death'] AS has_maternal_death,
    b.death_reason_array @> ARRAY['fever'] AS has_fever,
    b.death_reason_array @> ARRAY['yellow_fever'] AS has_yellow_fever,
    b.death_reason_array @> ARRAY['tetanus'] AS has_tetanus,
    b.death_reason_array @> ARRAY['viral_diseases'] AS has_viral_diseases,
    b.death_reason_array @> ARRAY['meningitis'] AS has_meningitis,
    b.death_reason_array @> ARRAY['miscarriage'] AS has_miscarriage,
    b.death_reason_array @> ARRAY['traffic_accident'] AS has_traffic_accident,
    b.death_reason_array @> ARRAY['burns'] AS has_burns,
    b.death_reason_array @> ARRAY['tuberculosis'] AS has_tuberculosis,
    b.death_reason_array @> ARRAY['bloody_diarrhea'] AS has_bloody_diarrhea,
    b.death_reason_array @> ARRAY['accidental_ingestion_caustic_products'] AS has_accidental_ingestion_caustic_products,
    b.death_reason_array @> ARRAY['food_poisoning'] AS has_food_poisoning,
    b.death_reason_array @> ARRAY['dog_bites'] AS has_dog_bites,
    b.death_reason_array @> ARRAY['snake_bite'] AS has_snake_bite,
    b.death_reason_array @> ARRAY['trauma'] AS has_trauma,
    b.death_reason_array @> ARRAY['domestic_violence'] AS has_domestic_violence,
    b.death_reason_array @> ARRAY['cholera'] AS has_cholera,

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

    CASE 
        WHEN jsonb_typeof(b.geolocation) = 'object'
        AND NULLIF(b.geolocation->>'latitude', '') IS NOT NULL
        AND NULLIF(b.geolocation->>'longitude', '') IS NOT NULL
        THEN b.geolocation
        ELSE NULL
    END::JSONB AS geolocation

FROM base b;
