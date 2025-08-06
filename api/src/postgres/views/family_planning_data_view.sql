CREATE MATERIALIZED VIEW IF NOT EXISTS family_planning_data_view AS 
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
        
        CASE WHEN doc->>'form' IN ('pregnancy_family_planning', 'family_planning') THEN 'consultation'
            WHEN doc->>'form' = 'fp_danger_sign_check' THEN 'danger_sign_check'
            WHEN doc->>'form' = 'fp_renewal' THEN 'renewal'
            ELSE NULL
        END AS consultation_followup,

        parse_json_boolean(doc->'fields'->>'has_counseling') IS TRUE AS has_counseling,
        parse_json_boolean(doc->'fields'->>'already_use_method') IS TRUE AS already_use_method,
        parse_json_boolean(doc->'fields'->>'is_currently_using_method') IS TRUE AS is_currently_using_method,
        parse_json_boolean(doc->'fields'->>'has_changed_method') IS TRUE AS has_changed_method,
        parse_json_boolean(doc->'fields'->>'want_renew_method') IS TRUE AS want_renew_method,
        parse_json_boolean(doc->'fields'->>'method_was_given') IS TRUE AS method_was_given,
        parse_json_boolean(doc->'fields'->>'is_method_avaible_reco') IS TRUE AS is_method_avaible_reco,
        parse_json_boolean(doc->'fields'->>'is_fp_referred') IS TRUE AS is_fp_referred,
        parse_json_boolean(doc->'fields'->>'has_health_problem') IS TRUE AS has_health_problem,
        parse_json_boolean(doc->'fields'->>'has_fever') IS TRUE AS has_fever,
        parse_json_boolean(doc->'fields'->>'has_vomit') IS TRUE AS has_vomit,
        parse_json_boolean(doc->'fields'->>'has_headaches') IS TRUE AS has_headaches,
        parse_json_boolean(doc->'fields'->>'has_abdominal_pain') IS TRUE AS has_abdominal_pain,
        parse_json_boolean(doc->'fields'->>'has_bleeding') IS TRUE AS has_bleeding,
        parse_json_boolean(doc->'fields'->>'has_feel_pain_injection') IS TRUE AS has_feel_pain_injection,
        parse_json_boolean(doc->'fields'->>'has_secondary_effect') IS TRUE AS has_secondary_effect,
        parse_json_boolean(doc->'fields'->>'is_health_problem_referal') IS TRUE AS is_health_problem_referal,

        NULLIF(doc->'fields'->>'no_counseling_reasons', '') AS no_counseling_reasons,
        NULLIF(doc->'fields'->>'no_counseling_reasons_name', '') AS no_counseling_reasons_name,
        NULLIF(doc->'fields'->>'method_already_used', '') AS method_already_used,
        NULLIF(doc->'fields'->>'want_renew_method_date', '')::DATE AS want_renew_method_date,
        NULLIF(doc->'fields'->>'refuse_renew_method_reasons', '') AS refuse_renew_method_reasons,
        NULLIF(doc->'fields'->>'refuse_renew_method_reasons_name', '') AS refuse_renew_method_reasons_name,
        NULLIF(doc->'fields'->>'new_method_wanted', '') AS new_method_wanted,
        NULLIF(doc->'fields'->>'who_will_give_method', '') AS who_will_give_method,
        NULLIF(doc->'fields'->>'method_start_date', '')::DATE AS method_start_date,
        NULLIF(doc->'fields'->>'method_not_given_reason', '') AS method_not_given_reason,
        NULLIF(doc->'fields'->>'method_not_given_reason_name', '') AS method_not_given_reason_name,
        NULLIF(doc->'fields'->>'fp_method', '') AS fp_method,
        NULLIF(doc->'fields'->>'fp_method_name', '') AS fp_method_name,
        NULLIF(doc->'fields'->>'next_fp_renew_date', '')::DATE AS next_fp_renew_date,
        NULLIF(doc->'fields'->>'other_health_problem_written', '') AS other_health_problem_written,

        NULLIF(doc->'fields'->'inputs'->>'source', '') AS source,
        NULLIF(doc->'fields'->'inputs'->>'source_id', '') AS source_id,
        NULLIF(doc->'fields'->'inputs'->>'t_fp_method', '') AS t_fp_method,
        NULLIF(doc->'fields'->'inputs'->>'t_fp_method_name', '') AS t_fp_method_name,
        NULLIF(doc->'fields'->'inputs'->>'t_next_fp_renew_date', '') AS t_next_fp_renew_date,
        NULLIF(doc->'fields'->'inputs'->>'t_method_start_date', '') AS t_method_start_date,
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
        doc->>'form' IS NOT NULL
        AND doc->'fields' IS NOT NULL 
        AND (
            doc->>'form' IN ('family_planning', 'fp_danger_sign_check', 'fp_renewal') OR
            doc->>'form' IN ('pregnancy_family_planning') AND parse_json_boolean(doc->'fields'->>'is_pregnant') IS TRUE
        );  
        