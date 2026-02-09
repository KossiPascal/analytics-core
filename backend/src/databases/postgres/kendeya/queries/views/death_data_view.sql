CREATE MATERIALIZED VIEW IF NOT EXISTS death_data_view AS 
WITH death_docs AS (
    SELECT
        *,
        string_to_array(NULLIF(doc->'fields'->>'death_reason', ''), ' ') AS death_reason_array
    FROM couchdb
    WHERE doc->>'form' = 'death_report'
      AND doc->'fields' IS NOT NULL
)
SELECT
    (doc->>'_id')::TEXT AS id,
    (doc->>'_rev')::TEXT AS rev,
    (doc->>'form')::TEXT AS form,

    EXTRACT(YEAR FROM TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000))::BIGINT AS year,
    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0') AS month,

    -- Simplified sex normalization
    CASE 
        WHEN LOWER(doc->'fields'->>'patient_sex') IN ('male', 'homme', 'm') THEN 'M'
        WHEN LOWER(doc->'fields'->>'patient_sex') IN ('female', 'femme', 'f') THEN 'F'
        ELSE NULL
    END AS sex,

    -- Age and birth data
    NULLIF(doc->'fields'->>'patient_date_of_birth', '')::DATE AS birth_date,
    NULLIF(doc->'fields'->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
    NULLIF(doc->'fields'->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
    NULLIF(doc->'fields'->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,

    NULLIF(doc->'fields'->>'date_of_death', '') AS death_date,
    NULLIF(doc->'fields'->>'death_place', '') AS death_place,
    NULLIF(doc->'fields'->>'death_place_label', '') AS death_place_label,
    NULLIF(doc->'fields'->>'death_reason_label', '') AS death_reason_label,

    parse_json_boolean(doc->'fields'->>'is_maternal_death') IS TRUE AS is_maternal_death,
    parse_json_boolean(doc->'fields'->>'is_home_death') IS TRUE AS is_home_death,

    death_reason_array AS death_reason,

    -- Boolean flags from death_reason
    death_reason_array @> ARRAY['malaria'] AS has_malaria,
    death_reason_array @> ARRAY['diarrhea'] AS has_diarrhea,
    death_reason_array @> ARRAY['malnutrition'] AS has_malnutrition,
    death_reason_array @> ARRAY['cough_cold'] AS has_cough_cold,
    death_reason_array @> ARRAY['pneumonia'] AS has_pneumonia,
    death_reason_array @> ARRAY['maternal_death'] AS has_maternal_death,
    death_reason_array @> ARRAY['fever'] AS has_fever,
    death_reason_array @> ARRAY['yellow_fever'] AS has_yellow_fever,
    death_reason_array @> ARRAY['tetanus'] AS has_tetanus,
    death_reason_array @> ARRAY['viral_diseases'] AS has_viral_diseases,
    death_reason_array @> ARRAY['meningitis'] AS has_meningitis,
    death_reason_array @> ARRAY['miscarriage'] AS has_miscarriage,
    death_reason_array @> ARRAY['traffic_accident'] AS has_traffic_accident,
    death_reason_array @> ARRAY['burns'] AS has_burns,
    death_reason_array @> ARRAY['tuberculosis'] AS has_tuberculosis,
    death_reason_array @> ARRAY['bloody_diarrhea'] AS has_bloody_diarrhea,
    death_reason_array @> ARRAY['accidental_ingestion_caustic_products'] AS has_accidental_ingestion_caustic_products,
    death_reason_array @> ARRAY['food_poisoning'] AS has_food_poisoning,
    death_reason_array @> ARRAY['dog_bites'] AS has_dog_bites,
    death_reason_array @> ARRAY['snake_bite'] AS has_snake_bite,
    death_reason_array @> ARRAY['trauma'] AS has_trauma,
    death_reason_array @> ARRAY['domestic_violence'] AS has_domestic_violence,
    death_reason_array @> ARRAY['cholera'] AS has_cholera,

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

    CASE 
        WHEN jsonb_typeof(doc->'geolocation') = 'object'
          AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
          AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
        THEN doc->'geolocation'
        ELSE NULL
    END AS geolocation

FROM death_docs;
