-- @name: events_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS events_data_view AS
  WITH base AS (
    SELECT 
      doc,
      doc->>'_id' AS id,
      doc->>'_rev' AS rev,
      doc->>'form' AS form,
      doc->'fields' AS fields,
      doc->'fields'->'event_desease' AS evd_raw,
      (doc->'geolocation')::JSONB AS geolocation,
      string_to_array(NULLIF(doc->'fields'->'event_desease'->>'events', ''), ' ') AS event_list,
      TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
    FROM kendeya_docs
    WHERE 
      doc->>'form' = 'event_register'
      AND doc->'fields' IS NOT NULL
      AND doc->'fields'->'event_desease' IS NOT NULL
  )
  SELECT
      b.id,
      b.rev,
      b.form,
      
      EXTRACT(YEAR FROM b.reported_ts)::BIGINT AS year,
      LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0') AS month,

      b.event_list AS event,

      NULLIF(b.evd_raw->>'other_event', '') AS other_event,
      NULLIF(b.evd_raw->>'event_name', '') AS event_name,
      NULLIF(b.evd_raw->>'event_date', '') AS event_date,
      NULLIF(b.evd_raw->>'village_location_name', '') AS village_location_name,
      NULLIF(b.evd_raw->>'name_person_in_charge', '') AS name_person_in_charge,
      NULLIF(b.evd_raw->>'phone_person_in_charge', '') AS phone_person_in_charge,
      NULLIF(b.evd_raw->>'health_center_feedback_date', '') AS health_center_feedback_date,
      NULLIF(b.evd_raw->>'health_center_feedback_location', '') AS feedback_manager,

      -- Boolean flags
      b.event_list @> ARRAY['flood'] AS is_flood,
      b.event_list @> ARRAY['fire'] AS is_fire,
      b.event_list @> ARRAY['shipwreck'] AS is_shipwreck,
      b.event_list @> ARRAY['landslide'] AS is_landslide,
      b.event_list @> ARRAY['grouped_animal_deaths'] AS is_grouped_animal_deaths,
      b.event_list @> ARRAY['pfa'] AS is_pfa,
      b.event_list @> ARRAY['bloody_diarrhea'] AS is_bloody_diarrhea,
      b.event_list @> ARRAY['yellow_fever'] AS is_yellow_fever,
      b.event_list @> ARRAY['cholera'] AS is_cholera,
      b.event_list @> ARRAY['maternal_and_neonatal_tetanus'] AS is_maternal_and_neonatal_tetanus,
      b.event_list @> ARRAY['viral_diseases'] AS is_viral_diseases,
      b.event_list @> ARRAY['meningitis'] AS is_meningitis,
      b.event_list @> ARRAY['maternal_deaths'] AS is_maternal_deaths,
      b.event_list @> ARRAY['community_deaths'] AS is_community_deaths,
      b.event_list @> ARRAY['influenza_fever'] AS is_influenza_fever,

      -- Location
      NULLIF(b.fields->>'country_id', '') AS country_id,
      NULLIF(b.fields->>'region_id', '') AS region_id,
      NULLIF(b.fields->>'prefecture_id', '') AS prefecture_id,
      NULLIF(b.fields->>'commune_id', '') AS commune_id,
      NULLIF(b.fields->>'hospital_id', '') AS hospital_id,
      NULLIF(b.fields->>'district_quartier_id', '') AS district_quartier_id,
      NULLIF(b.fields->>'village_secteur_id', '') AS village_secteur_id,
      NULLIF(b.fields->>'user_id', '') AS reco_id,
      
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
