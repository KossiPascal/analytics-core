-- @name: newborn_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS newborn_data_view AS 
    WITH base AS (
        SELECT
            doc,
            (doc->>'_id')::TEXT AS id,
            (doc->>'_rev')::TEXT AS rev,
            (doc->>'form')::TEXT AS form,
            doc->'fields' AS fields,
            doc->'fields'->'inputs' AS inputs,
            LOWER(doc->'fields'->>'patient_sex') AS patient_sex,
            (doc->'geolocation')::JSONB AS geolocation,

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

            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        
        FROM kendeya_docs
        WHERE
            doc->>'form' IS NOT NULL
            AND doc->'fields' IS NOT NULL 
            AND doc->>'form' IN ('newborn_register', 'newborn_followup')  
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

        CASE WHEN b.form = 'newborn_register' THEN 'consultation'
            WHEN b.form = 'newborn_followup' THEN 'followup'
            ELSE NULL
        END AS consultation_followup,

        parse_json_boolean(b.fields->>'is_referred') IS TRUE AS is_referred,
        parse_json_boolean(b.fields->>'has_danger_sign') IS TRUE AS has_danger_sign,
        parse_json_boolean(b.fields->>'has_unable_to_suckle') IS TRUE AS has_unable_to_suckle,
        parse_json_boolean(b.fields->>'has_vomits_everything_consumes') IS TRUE AS has_vomits_everything_consumes,
        parse_json_boolean(b.fields->>'has_convulsion') IS TRUE AS has_convulsion,
        parse_json_boolean(b.fields->>'has_sleepy_unconscious') IS TRUE AS has_sleepy_unconscious,
        parse_json_boolean(b.fields->>'has_stiff_neck') IS TRUE AS has_stiff_neck,
        parse_json_boolean(b.fields->>'has_domed_fontanelle') IS TRUE AS has_domed_fontanelle,
        parse_json_boolean(b.fields->>'has_breathe_hard') IS TRUE AS has_breathe_hard,
        parse_json_boolean(b.fields->>'has_subcostal_indrawing') IS TRUE AS has_subcostal_indrawing,
        parse_json_boolean(b.fields->>'has_wheezing') IS TRUE AS has_wheezing,
        parse_json_boolean(b.fields->>'has_diarrhea') IS TRUE AS has_diarrhea,
        parse_json_boolean(b.fields->>'has_fever') IS TRUE AS has_fever,
        parse_json_boolean(b.fields->>'has_malnutrition') IS TRUE AS has_malnutrition,
        parse_json_boolean(b.fields->>'has_others_heath_problem') IS TRUE AS has_others_heath_problem,
        parse_json_boolean(b.fields->>'has_malaria') IS TRUE AS has_malaria,
        parse_json_boolean(b.fields->>'has_pneumonia') IS TRUE AS has_pneumonia,
        parse_json_boolean(b.fields->>'has_cough_cold') IS TRUE AS has_cough_cold,
        parse_json_boolean(b.fields->>'has_pre_reference_treatments') IS TRUE AS has_pre_reference_treatments,
        parse_json_boolean(b.fields->>'referal_health_center') IS TRUE AS referal_health_center,
        parse_json_boolean(b.fields->>'is_health_referred') IS TRUE AS is_health_referred,
        parse_json_boolean(b.fields->>'has_new_complaint') IS TRUE AS has_new_complaint,
        parse_json_boolean(b.fields->>'coupon_available') IS TRUE AS coupon_available,

        NULLIF(b.fields->>'promptitude', '') AS promptitude,
        NULLIF(b.fields->>'reference_pattern_other', '') AS reference_pattern_other,
        NULLIF(b.fields->>'other_diseases', '') AS other_diseases,
        NULLIF(b.fields->>'coupon_number', '') AS coupon_number,

        -- FOR TASK / FOLLOWUP
        NULLIF(b.inputs->>'source', '') AS source,
        NULLIF(b.inputs->>'source_id', '') AS source_id,

        NULLIF(b.inputs->>'t_family_id', '') AS t_family_id,
        NULLIF(b.inputs->>'t_family_name', '') AS t_family_name,
        NULLIF(b.inputs->>'t_family_external_id', '') AS t_family_external_id,
        NULLIF(b.inputs->>'t_reference_pattern_other', '') AS t_reference_pattern_other,

        parse_json_boolean(b.inputs->>'t_unable_to_suckle') IS TRUE AS t_unable_to_suckle,
        parse_json_boolean(b.inputs->>'t_vomits_everything_consumes') IS TRUE AS t_vomits_everything_consumes,
        parse_json_boolean(b.inputs->>'t_convulsion') IS TRUE AS t_convulsion,
        parse_json_boolean(b.inputs->>'t_sleepy_unconscious') IS TRUE AS t_sleepy_unconscious,
        parse_json_boolean(b.inputs->>'t_stiff_neck') IS TRUE AS t_stiff_neck,
        parse_json_boolean(b.inputs->>'t_domed_fontanelle') IS TRUE AS t_domed_fontanelle,
        parse_json_boolean(b.inputs->>'t_breathe_hard') IS TRUE AS t_breathe_hard,
        parse_json_boolean(b.inputs->>'t_subcostal_indrawing') IS TRUE AS t_subcostal_indrawing,
        parse_json_boolean(b.inputs->>'t_wheezing') IS TRUE AS t_wheezing,
        parse_json_boolean(b.inputs->>'t_diarrhea') IS TRUE AS t_diarrhea,
        parse_json_boolean(b.inputs->>'t_malnutrition') IS TRUE AS t_malnutrition,
        parse_json_boolean(b.inputs->>'t_malaria') IS TRUE AS t_malaria,
        parse_json_boolean(b.inputs->>'t_pneumonia') IS TRUE AS t_pneumonia,
        parse_json_boolean(b.inputs->>'t_cough_cold') IS TRUE AS t_cough_cold,
        parse_json_boolean(b.inputs->>'t_has_fever') IS TRUE AS t_has_fever,

        -- Location and report info
        b.country_id,
        b.region_id,
        b.prefecture_id,
        b.commune_id,
        b.hospital_id,
        b.district_quartier_id,
        b.village_secteur_id,
        b.family_id,
        b.reco_id,
        b.patient_id,

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
