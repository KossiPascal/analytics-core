-- @name: fs_meg_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS fs_meg_data_view AS 
    WITH base AS (
        SELECT
            doc,
            (doc->>'_id')::TEXT AS id,
            (doc->>'_rev')::TEXT AS rev,
            (doc->>'form')::TEXT AS form,
            (doc->'geolocation')::JSONB AS geolocation,
            doc->'fields' AS fields,
            NULLIF(doc->'fields'->'event_desease'->>'events', '') AS events,
            NULLIF(doc->'fields'->>'month_day', '') AS month_day,
            NULLIF(doc->'fields'->>'all_med_shortage_days_number', '') AS shortage_days_number,
            NULLIF(doc->'fields'->>'all_med_number', '') AS all_med_number,
            NULLIF(doc->'fields'->>'meg_average_out_of', '') AS meg_average_out_of,
            NULLIF(doc->'fields'->>'meg_average_available', '') AS meg_average_available,
            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        FROM 
            kendeya_docs
        WHERE
            doc->>'form' IS NOT NULL 
            AND doc->'fields' IS NOT NULL 
            AND doc->>'form' = 'fs_meg_situation'
    )
    SELECT
        b.id,
        b.rev,
        b.form,
        EXTRACT(YEAR FROM b.reported_ts)::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0')::TEXT AS month,
        
        NULLIF(b.fields->>'action_date', '') AS action_date,
        NULLIF(b.fields->>'month_date_selected', '') AS month_date_selected,

        -- is_flood: event contains 'flood'
        CASE 
            WHEN b.events IS NOT NULL AND string_to_array(b.events, ' ') @> ARRAY['flood'] THEN TRUE ELSE NULL
        END AS is_flood,

        -- Numeric conversions with validity checks
        CASE 
            WHEN b.month_day IS NOT NULL AND CAST(b.month_day AS BIGINT) > 0
            THEN CAST(b.month_day AS BIGINT)
            ELSE NULL
        END AS month_day,

        CASE 
            WHEN b.shortage_days_number IS NOT NULL AND CAST(b.shortage_days_number AS BIGINT) > 0
            THEN CAST(b.shortage_days_number AS BIGINT)
            ELSE NULL
        END AS all_med_shortage_days_number,

        CASE 
            WHEN b.all_med_number IS NOT NULL AND CAST(b.all_med_number AS BIGINT) > 0
            THEN CAST(b.all_med_number AS BIGINT)
            ELSE NULL
        END AS all_med_number,

        CASE 
            WHEN b.meg_average_out_of IS NOT NULL THEN CAST(b.meg_average_out_of AS DOUBLE PRECISION)
            ELSE NULL
        END AS meg_average_out_of,

        CASE 
            WHEN b.meg_average_available IS NOT NULL THEN CAST(b.meg_average_available AS DOUBLE PRECISION)
            ELSE NULL
        END AS meg_average_available,

        -- Location and report info
        NULLIF(b.fields->>'country_id', '') AS country_id,
        NULLIF(b.fields->>'region_id', '') AS region_id,
        NULLIF(b.fields->>'prefecture_id', '') AS prefecture_id,
        NULLIF(b.fields->>'commune_id', '') AS commune_id,
        NULLIF(b.fields->>'hospital_id', '') AS hospital_id,
        NULLIF(b.fields->>'user_id', '') AS hospital_manager_id,

        CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
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
