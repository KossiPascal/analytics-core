-- @name: family_planning_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS family_planning_data_view AS 
    WITH base AS (
        SELECT
            doc,
            (doc->>'_id')::TEXT AS id,
            (doc->>'_rev')::TEXT AS rev,
            (doc->>'form')::TEXT AS form,
            doc->'fields' AS fields,
            doc->'fields'->'inputs' AS inputs,
            (doc->'geolocation')::JSONB AS geolocation,
            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        FROM 
            kendeya_docs
        WHERE
            doc->>'form' IS NOT NULL
            AND doc->'fields' IS NOT NULL 
            AND (
                doc->>'form' IN ('family_planning', 'fp_danger_sign_check', 'fp_renewal', 'men_family_planning') OR
                doc->>'form' IN ('pregnancy_family_planning') AND parse_json_boolean(doc->'fields'->>'is_pregnant') IS TRUE
            )
    )
    SELECT
        b.id,
        b.rev,
        b.form,

        EXTRACT(YEAR FROM b.reported_ts)::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0')::TEXT AS month,
        
        -- Sex and birth info
        CASE WHEN LOWER(b.fields->>'patient_sex') IN ('male', 'homme', 'm') THEN 'M'
            WHEN LOWER(b.fields->>'patient_sex') IN ('female', 'femme', 'f') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,

        NULLIF(b.fields->>'patient_date_of_birth', '')::DATE AS birth_date,
        NULLIF(b.fields->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
        NULLIF(b.fields->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
        NULLIF(b.fields->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,
        
        CASE WHEN b.form IN ('pregnancy_family_planning', 'family_planning', 'men_family_planning') THEN 'consultation'
            WHEN b.form = 'fp_danger_sign_check' THEN 'danger_sign_check'
            WHEN b.form = 'fp_renewal' THEN 'renewal'
            ELSE NULL
        END AS consultation_followup,

        parse_json_boolean(b.fields->>'has_counseling') IS TRUE AS has_counseling,
        parse_json_boolean(b.fields->>'already_use_method') IS TRUE AS already_use_method,
        parse_json_boolean(b.fields->>'is_currently_using_method') IS TRUE AS is_currently_using_method,
        parse_json_boolean(b.fields->>'has_changed_method') IS TRUE AS has_changed_method,
        parse_json_boolean(b.fields->>'want_renew_method') IS TRUE AS want_renew_method,
        parse_json_boolean(b.fields->>'method_was_given') IS TRUE AS method_was_given,
        parse_json_boolean(b.fields->>'is_method_avaible_reco') IS TRUE AS is_method_avaible_reco,
        parse_json_boolean(b.fields->>'is_fp_referred') IS TRUE AS is_fp_referred,
        parse_json_boolean(b.fields->>'has_health_problem') IS TRUE AS has_health_problem,
        parse_json_boolean(b.fields->>'has_fever') IS TRUE AS has_fever,
        parse_json_boolean(b.fields->>'has_vomit') IS TRUE AS has_vomit,
        parse_json_boolean(b.fields->>'has_headaches') IS TRUE AS has_headaches,
        parse_json_boolean(b.fields->>'has_abdominal_pain') IS TRUE AS has_abdominal_pain,
        parse_json_boolean(b.fields->>'has_bleeding') IS TRUE AS has_bleeding,
        parse_json_boolean(b.fields->>'has_feel_pain_injection') IS TRUE AS has_feel_pain_injection,
        parse_json_boolean(b.fields->>'has_secondary_effect') IS TRUE AS has_secondary_effect,
        parse_json_boolean(b.fields->>'is_health_problem_referal') IS TRUE AS is_health_problem_referal,

        NULLIF(b.fields->>'no_counseling_reasons', '') AS no_counseling_reasons,
        NULLIF(b.fields->>'no_counseling_reasons_name', '') AS no_counseling_reasons_name,
        NULLIF(b.fields->>'method_already_used', '') AS method_already_used,
        NULLIF(b.fields->>'want_renew_method_date', '')::DATE AS want_renew_method_date,
        NULLIF(b.fields->>'refuse_renew_method_reasons', '') AS refuse_renew_method_reasons,
        NULLIF(b.fields->>'refuse_renew_method_reasons_name', '') AS refuse_renew_method_reasons_name,
        NULLIF(b.fields->>'new_method_wanted', '') AS new_method_wanted,
        NULLIF(b.fields->>'who_will_give_method', '') AS who_will_give_method,
        NULLIF(b.fields->>'method_start_date', '')::DATE AS method_start_date,
        NULLIF(b.fields->>'method_not_given_reason', '') AS method_not_given_reason,
        NULLIF(b.fields->>'method_not_given_reason_name', '') AS method_not_given_reason_name,
        NULLIF(b.fields->>'fp_method', '') AS fp_method,
        NULLIF(b.fields->>'fp_method_name', '') AS fp_method_name,
        NULLIF(b.fields->>'next_fp_renew_date', '')::DATE AS next_fp_renew_date,
        NULLIF(b.fields->>'other_health_problem_written', '') AS other_health_problem_written,

        NULLIF(b.inputs->>'source', '') AS source,
        NULLIF(b.inputs->>'source_id', '') AS source_id,
        NULLIF(b.inputs->>'t_fp_method', '') AS t_fp_method,
        NULLIF(b.inputs->>'t_fp_method_name', '') AS t_fp_method_name,
        NULLIF(b.inputs->>'t_next_fp_renew_date', '') AS t_next_fp_renew_date,
        NULLIF(b.inputs->>'t_method_start_date', '') AS t_method_start_date,
        NULLIF(b.inputs->>'t_family_id', '') AS t_family_id,
        NULLIF(b.inputs->>'t_family_name', '') AS t_family_name,
        NULLIF(b.inputs->>'t_family_external_id', '') AS t_family_external_id,

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
        