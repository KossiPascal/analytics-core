CREATE MATERIALIZED VIEW IF NOT EXISTS events_data_view AS
WITH base AS (
  SELECT 
    doc,
    doc->'fields'->'event_desease' AS evd_raw,
    TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS ts,
    string_to_array(
      NULLIF(doc->'fields'->'event_desease'->>'events', ''),
      ' '
    ) AS event_list
  FROM couchdb
  WHERE 
    doc->>'form' = 'event_register'
    AND doc->'fields' IS NOT NULL
    AND doc->'fields'->'event_desease' IS NOT NULL
)
SELECT
    doc->>'_id' AS id,
    doc->>'_rev' AS rev,
    doc->>'form' AS form,
    
    EXTRACT(YEAR FROM ts)::BIGINT AS year,
    LPAD(EXTRACT(MONTH FROM ts)::TEXT, 2, '0') AS month,

    event_list AS event,

    NULLIF(evd_raw->>'other_event', '') AS other_event,
    NULLIF(evd_raw->>'event_name', '') AS event_name,
    NULLIF(evd_raw->>'event_date', '') AS event_date,
    NULLIF(evd_raw->>'village_location_name', '') AS village_location_name,
    NULLIF(evd_raw->>'name_person_in_charge', '') AS name_person_in_charge,
    NULLIF(evd_raw->>'phone_person_in_charge', '') AS phone_person_in_charge,
    NULLIF(evd_raw->>'health_center_feedback_date', '') AS health_center_feedback_date,
    NULLIF(evd_raw->>'health_center_feedback_location', '') AS feedback_manager,

    -- Boolean flags
    event_list @> ARRAY['flood'] AS is_flood,
    event_list @> ARRAY['fire'] AS is_fire,
    event_list @> ARRAY['shipwreck'] AS is_shipwreck,
    event_list @> ARRAY['landslide'] AS is_landslide,
    event_list @> ARRAY['grouped_animal_deaths'] AS is_grouped_animal_deaths,
    event_list @> ARRAY['pfa'] AS is_pfa,
    event_list @> ARRAY['bloody_diarrhea'] AS is_bloody_diarrhea,
    event_list @> ARRAY['yellow_fever'] AS is_yellow_fever,
    event_list @> ARRAY['cholera'] AS is_cholera,
    event_list @> ARRAY['maternal_and_neonatal_tetanus'] AS is_maternal_and_neonatal_tetanus,
    event_list @> ARRAY['viral_diseases'] AS is_viral_diseases,
    event_list @> ARRAY['meningitis'] AS is_meningitis,
    event_list @> ARRAY['maternal_deaths'] AS is_maternal_deaths,
    event_list @> ARRAY['community_deaths'] AS is_community_deaths,
    event_list @> ARRAY['influenza_fever'] AS is_influenza_fever,

    -- Location
    NULLIF(doc->'fields'->>'country_id', '') AS country_id,
    NULLIF(doc->'fields'->>'region_id', '') AS region_id,
    NULLIF(doc->'fields'->>'prefecture_id', '') AS prefecture_id,
    NULLIF(doc->'fields'->>'commune_id', '') AS commune_id,
    NULLIF(doc->'fields'->>'hospital_id', '') AS hospital_id,
    NULLIF(doc->'fields'->>'district_quartier_id', '') AS district_quartier_id,
    NULLIF(doc->'fields'->>'village_secteur_id', '') AS village_secteur_id,
    NULLIF(doc->'fields'->>'user_id', '') AS reco_id,
    
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

FROM base;
