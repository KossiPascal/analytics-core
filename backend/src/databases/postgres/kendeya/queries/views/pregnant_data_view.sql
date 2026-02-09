CREATE MATERIALIZED VIEW IF NOT EXISTS pregnant_data_view AS 
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

        CASE WHEN doc->>'form' IN ('pregnancy_family_planning', 'pregnancy_register') THEN 'consultation'
            WHEN doc->>'form' = 'prenatal_followup' THEN 'followup'
            ELSE NULL
        END AS consultation_followup,

        parse_json_boolean(doc->'fields'->>'is_pregnant') IS TRUE AS is_pregnant,
        parse_json_boolean(doc->'fields'->>'is_cpn_late') IS TRUE AS is_cpn_late,
        parse_json_boolean(doc->'fields'->>'is_pregnant_referred') IS TRUE AS is_pregnant_referred,
        parse_json_boolean(doc->'fields'->>'has_danger_sign') IS TRUE AS has_danger_sign,
        parse_json_boolean(doc->'fields'->>'is_referred') IS TRUE AS is_referred,
        parse_json_boolean(doc->'fields'->>'cpn_done') IS TRUE AS cpn_done,
        parse_json_boolean(doc->'fields'->>'td1_done') IS TRUE AS td1_done,
        parse_json_boolean(doc->'fields'->>'td2_done') IS TRUE AS td2_done,
        parse_json_boolean(doc->'fields'->>'has_milda') IS TRUE AS has_milda,
        parse_json_boolean(doc->'fields'->>'is_home_delivery_wanted') IS TRUE AS is_home_delivery_wanted,
        parse_json_boolean(doc->'fields'->>'is_closed') IS TRUE AS is_closed,
        parse_json_boolean(doc->'fields'->>'is_miscarriage_referred') IS TRUE AS is_miscarriage_referred,

        NULLIF(doc->'fields'->>'next_cpn_visit_date', '')::DATE AS next_cpn_visit_date,
        NULLIF(doc->'fields'->>'date_cpn1', '')::DATE AS date_cpn1,
        NULLIF(doc->'fields'->>'date_cpn2', '')::DATE AS date_cpn2,
        NULLIF(doc->'fields'->>'date_cpn3', '')::DATE AS date_cpn3,
        NULLIF(doc->'fields'->>'date_cpn4', '')::DATE AS date_cpn4,
        NULLIF(doc->'fields'->>'next_cpn_date', '')::DATE AS next_cpn_date,

        NULLIF(doc->'fields'->>'delivery_place_wanted', '') AS delivery_place_wanted,
        NULLIF(doc->'fields'->>'close_reason', '') AS close_reason,
        NULLIF(doc->'fields'->>'close_reason_name', '') AS close_reason_name,

        NULLIF(TRIM(doc->'fields'->>'cpn_number'), '')::BIGINT AS cpn_number,
        NULLIF(TRIM(doc->'fields'->>'cpn_next_number'), '')::BIGINT AS cpn_next_number,
        NULLIF(TRIM(doc->'fields'->>'cpn_already_count'), '')::BIGINT AS cpn_already_count,


        -- FOR TASK / FOLLOWUP
        NULLIF(doc->'fields'->'inputs'->>'source', '') AS source,
        NULLIF(doc->'fields'->'inputs'->>'source_id', '') AS source_id,
        NULLIF(doc->'fields'->'inputs'->>'t_cpn_next_number', '') AS t_cpn_next_number,
        NULLIF(doc->'fields'->'inputs'->>'t_date_cpn1', '') AS t_date_cpn1,
        NULLIF(doc->'fields'->'inputs'->>'t_date_cpn2', '') AS t_date_cpn2,
        NULLIF(doc->'fields'->'inputs'->>'t_date_cpn3', '') AS t_date_cpn3,
        NULLIF(doc->'fields'->'inputs'->>'t_date_cpn4', '') AS t_date_cpn4,
        NULLIF(doc->'fields'->'inputs'->>'t_td1', '') AS t_td1,
        NULLIF(doc->'fields'->'inputs'->>'t_td2', '') AS t_td2,
        NULLIF(doc->'fields'->'inputs'->>'t_milda', '') AS t_milda,
        NULLIF(doc->'fields'->'inputs'->>'t_next_cpn_date', '') AS t_next_cpn_date,
        NULLIF(doc->'fields'->'inputs'->>'t_cpn_done', '') AS t_cpn_done,
        NULLIF(doc->'fields'->'inputs'->>'t_was_cpn_referred', '') AS t_was_cpn_referred,
        NULLIF(doc->'fields'->'inputs'->>'t_family_id', '') AS t_family_id,
        NULLIF(doc->'fields'->'inputs'->>'t_family_name', '') AS t_family_name,
        NULLIF(doc->'fields'->'inputs'->>'t_family_external_id', '') AS t_family_external_id,


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
        doc->'fields' IS NOT NULL AND (
            doc->>'form' IN ('prenatal_followup') 
            OR (
                doc->>'form' IN ('pregnancy_family_planning', 'pregnancy_register') AND 
                parse_json_boolean(doc->'fields'->>'is_pregnant') IS TRUE
            )
        );     