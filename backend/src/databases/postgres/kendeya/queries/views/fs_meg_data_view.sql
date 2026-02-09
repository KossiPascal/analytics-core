CREATE MATERIALIZED VIEW IF NOT EXISTS fs_meg_data_view AS 
    SELECT
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'form')::TEXT AS form,
        EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(doc->>'reported_date' AS BIGINT) / 1000))::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')::TEXT AS month,
        
        NULLIF(doc->'fields'->>'action_date', '') AS action_date,
        NULLIF(doc->'fields'->>'month_date_selected', '') AS month_date_selected,

        -- is_flood: event contains 'flood'
        CASE 
            WHEN NULLIF(doc->'fields'->'event_desease'->>'events', '') IS NOT NULL
                AND string_to_array(doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['flood']
            THEN TRUE
            ELSE NULL
        END AS is_flood,

        -- Numeric conversions with validity checks
        CASE 
            WHEN NULLIF(doc->'fields'->>'month_day', '') IS NOT NULL AND CAST(doc->'fields'->>'month_day' AS BIGINT) > 0
            THEN CAST(doc->'fields'->>'month_day' AS BIGINT)
            ELSE NULL
        END AS month_day,

        CASE 
            WHEN NULLIF(doc->'fields'->>'all_med_shortage_days_number', '') IS NOT NULL AND CAST(doc->'fields'->>'all_med_shortage_days_number' AS BIGINT) > 0
            THEN CAST(doc->'fields'->>'all_med_shortage_days_number' AS BIGINT)
            ELSE NULL
        END AS all_med_shortage_days_number,

        CASE 
            WHEN NULLIF(doc->'fields'->>'all_med_number', '') IS NOT NULL AND CAST(doc->'fields'->>'all_med_number' AS BIGINT) > 0
            THEN CAST(doc->'fields'->>'all_med_number' AS BIGINT)
            ELSE NULL
        END AS all_med_number,

        CASE 
            WHEN NULLIF(doc->'fields'->>'meg_average_out_of', '') IS NOT NULL THEN CAST(doc->'fields'->>'meg_average_out_of' AS DOUBLE PRECISION)
            ELSE NULL
        END AS meg_average_out_of,

        CASE 
            WHEN NULLIF(doc->'fields'->>'meg_average_available', '') IS NOT NULL THEN CAST(doc->'fields'->>'meg_average_available' AS DOUBLE PRECISION)
            ELSE NULL
        END AS meg_average_available,


        -- Location and report info
        NULLIF(doc->'fields'->>'country_id', '') AS country_id,
        NULLIF(doc->'fields'->>'region_id', '') AS region_id,
        NULLIF(doc->'fields'->>'prefecture_id', '') AS prefecture_id,
        NULLIF(doc->'fields'->>'commune_id', '') AS commune_id,
        NULLIF(doc->'fields'->>'hospital_id', '') AS hospital_id,
        NULLIF(doc->'fields'->>'user_id', '') AS hospital_manager_id,

        CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

        -- Géolocalisation propre
        CASE 
            WHEN jsonb_typeof(doc->'geolocation') = 'object'
            AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
            AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
            THEN doc->'geolocation'
            ELSE NULL
        END::JSONB AS geolocation
        
    FROM 
        couchdb
    WHERE
        doc->>'form' IS NOT NULL
        AND doc->'fields' IS NOT NULL 
        AND doc->>'form' = 'fs_meg_situation';     
