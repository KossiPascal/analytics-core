-- @name: pcimne_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS pcimne_data_view AS 
    WITH base AS (
        SELECT
            doc,
            (doc->'geolocation')::JSONB AS geolocation,
            (doc->>'_id')::TEXT AS id,
            (doc->>'_rev')::TEXT AS rev,
            (doc->>'form')::TEXT AS form,
            doc->'fields' AS fields,
            LOWER(doc->'fields'->>'patient_sex') AS patient_sex,
            doc->'fields'->'inputs' AS inputs,
            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        FROM 
            kendeya_docs
        WHERE
            doc->>'form' IS NOT NULL
            AND doc->'fields' IS NOT NULL 
            AND doc->>'form' IN ('pcimne_register', 'pcimne_followup')
    )
    SELECT
        b.id,
        b.rev,
        b.form,

        EXTRACT(YEAR FROM b.reported_ts)::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0')::TEXT AS month,

        CASE WHEN b.patient_sex IN ('male', 'homme', 'm') THEN 'M'
            WHEN b.patient_sex IN ('female', 'femme', 'f') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,

        NULLIF(b.fields->>'patient_date_of_birth', '')::DATE AS birth_date,
        NULLIF(b.fields->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
        NULLIF(b.fields->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
        NULLIF(b.fields->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,

        CASE WHEN b.form = 'pcimne_register' THEN 'consultation'
            WHEN b.form = 'pcimne_followup' THEN 'followup'
            ELSE NULL
        END AS consultation_followup,                    
        -- Sex and birth info

        parse_json_boolean(b.fields->>'has_initial_danger_signs') IS TRUE AS has_initial_danger_signs,
        parse_json_boolean(b.fields->>'has_fever') IS TRUE AS has_fever,
        parse_json_boolean(b.fields->>'has_malaria') IS TRUE AS has_malaria,
        parse_json_boolean(b.fields->>'has_cough_cold') IS TRUE AS has_cough_cold,
        parse_json_boolean(b.fields->>'has_pneumonia') IS TRUE AS has_pneumonia,
        parse_json_boolean(b.fields->>'has_normal_respiratory_rate') IS TRUE AS has_normal_respiratory_rate,
        parse_json_boolean(b.fields->>'has_diarrhea') IS TRUE AS has_diarrhea,
        parse_json_boolean(b.fields->>'has_malnutrition') IS TRUE AS has_malnutrition,
        parse_json_boolean(b.fields->>'has_modere_malnutrition') IS TRUE AS has_modere_malnutrition,
        parse_json_boolean(b.fields->>'has_severe_malnutrition') IS TRUE AS has_severe_malnutrition,
        parse_json_boolean(b.fields->>'has_afp') IS TRUE AS has_afp,
        parse_json_boolean(b.fields->>'is_danger_signs_referral') IS TRUE AS is_danger_signs_referral,
        parse_json_boolean(b.fields->>'is_fever_referal') IS TRUE AS is_fever_referal,
        parse_json_boolean(b.fields->>'is_cough_cold_referal') IS TRUE AS is_cough_cold_referal,
        parse_json_boolean(b.fields->>'is_diarrhea_referal') IS TRUE AS is_diarrhea_referal,
        parse_json_boolean(b.fields->>'is_malnutrition_referal') IS TRUE AS is_malnutrition_referal,
        parse_json_boolean(b.fields->>'is_referred') IS TRUE AS is_referred,
        parse_json_boolean(b.fields->>'rdt_given') IS TRUE AS rdt_given,
        parse_json_boolean(b.fields->>'unable_drink_breastfeed') IS TRUE AS unable_drink_breastfeed,
        parse_json_boolean(b.fields->>'vomits_everything') IS TRUE AS vomits_everything,
        parse_json_boolean(b.fields->>'convulsions') IS TRUE AS convulsions,
        parse_json_boolean(b.fields->>'sleepy_unconscious') IS TRUE AS sleepy_unconscious,
        parse_json_boolean(b.fields->>'has_stiff_neck') IS TRUE AS has_stiff_neck,
        parse_json_boolean(b.fields->>'has_bulging_fontanelle') IS TRUE AS has_bulging_fontanelle,
        parse_json_boolean(b.fields->>'breathing_difficulty') IS TRUE AS breathing_difficulty,
        parse_json_boolean(b.fields->>'cough_more_than_14days') IS TRUE AS cough_more_than_14days,
        parse_json_boolean(b.fields->>'subcostal_indrawing') IS TRUE AS subcostal_indrawing,
        parse_json_boolean(b.fields->>'wheezing') IS TRUE AS wheezing,
        parse_json_boolean(b.fields->>'bloody_diarrhea') IS TRUE AS bloody_diarrhea,
        parse_json_boolean(b.fields->>'diarrhea_more_than_14_days') IS TRUE AS diarrhea_more_than_14_days,
        parse_json_boolean(b.fields->>'blood_in_stool') IS TRUE AS blood_in_stool,
        parse_json_boolean(b.fields->>'restless') IS TRUE AS restless,
        parse_json_boolean(b.fields->>'drinks_hungrily') IS TRUE AS drinks_hungrily,
        parse_json_boolean(b.fields->>'sunken_eyes') IS TRUE AS sunken_eyes,
        parse_json_boolean(b.fields->>'has_edema') IS TRUE AS has_edema,
        parse_json_boolean(b.fields->>'is_principal_referal') IS TRUE AS is_principal_referal,
        parse_json_boolean(b.fields->>'has_health_problem') IS TRUE AS has_health_problem,
        parse_json_boolean(b.fields->>'has_serious_malaria') IS TRUE AS has_serious_malaria,
        parse_json_boolean(b.fields->>'has_pre_reference_treatments') IS TRUE AS has_pre_reference_treatments,
        parse_json_boolean(b.fields->>'is_present') IS TRUE AS is_present,
        parse_json_boolean(b.fields->>'went_to_health_center') IS TRUE AS went_to_health_center,
        parse_json_boolean(b.fields->>'coupon_available') IS TRUE AS coupon_available,
        parse_json_boolean(b.fields->>'has_no_improvement') IS TRUE AS has_no_improvement,
        parse_json_boolean(b.fields->>'has_getting_worse') IS TRUE AS has_getting_worse,

        NULLIF(b.fields->>'promptitude', '') AS promptitude,

        -- FOR TASK / FOLLOWUP
        NULLIF(b.inputs->>'source', '') AS source,
        NULLIF(b.inputs->>'source_id', '') AS source_id,
        NULLIF(b.inputs->>'t_family_id', '') AS t_family_id,
        NULLIF(b.inputs->>'t_family_name', '') AS t_family_name,
        NULLIF(b.inputs->>'t_family_external_id', '') AS t_family_external_id,
        NULLIF(b.inputs->>'t_temperature', '') AS t_temperature,
        NULLIF(b.inputs->>'t_other_diseases', '') AS t_other_diseases,
        parse_json_boolean(b.inputs->>'t_has_fever') IS TRUE AS t_has_fever,
        parse_json_boolean(b.inputs->>'t_has_malaria') IS TRUE AS t_has_malaria,
        parse_json_boolean(b.inputs->>'t_has_diarrhea') IS TRUE AS t_has_diarrhea,
        parse_json_boolean(b.inputs->>'t_has_cough_cold') IS TRUE AS t_has_cough_cold,
        parse_json_boolean(b.inputs->>'t_has_malnutrition') IS TRUE AS t_has_malnutrition,
        parse_json_boolean(b.inputs->>'t_has_pneumonia') IS TRUE AS t_has_pneumonia,
        parse_json_boolean(b.inputs->>'t_unable_drink_breastfeed') IS TRUE AS t_unable_drink_breastfeed,
        parse_json_boolean(b.inputs->>'t_vomits_everything') IS TRUE AS t_vomits_everything,
        parse_json_boolean(b.inputs->>'t_convulsions') IS TRUE AS t_convulsions,
        parse_json_boolean(b.inputs->>'t_sleepy_unconscious') IS TRUE AS t_sleepy_unconscious,
        parse_json_boolean(b.inputs->>'t_has_stiff_neck') IS TRUE AS t_has_stiff_neck,
        parse_json_boolean(b.inputs->>'t_has_bulging_fontanelle') IS TRUE AS t_has_bulging_fontanelle,
        parse_json_boolean(b.inputs->>'t_breathing_difficulty') IS TRUE AS t_breathing_difficulty,
        parse_json_boolean(b.inputs->>'t_cough_more_than_14days') IS TRUE AS t_cough_more_than_14days,
        parse_json_boolean(b.inputs->>'t_subcostal_indrawing') IS TRUE AS t_subcostal_indrawing,
        parse_json_boolean(b.inputs->>'t_wheezing') IS TRUE AS t_wheezing,
        parse_json_boolean(b.inputs->>'t_bloody_diarrhea') IS TRUE AS t_bloody_diarrhea,
        parse_json_boolean(b.inputs->>'t_diarrhea_more_than_14_days') IS TRUE AS t_diarrhea_more_than_14_days,
        parse_json_boolean(b.inputs->>'t_blood_in_stool') IS TRUE AS t_blood_in_stool,
        parse_json_boolean(b.inputs->>'t_restless') IS TRUE AS t_restless,
        parse_json_boolean(b.inputs->>'t_drinks_hungrily') IS TRUE AS t_drinks_hungrily,
        parse_json_boolean(b.inputs->>'t_sunken_eyes') IS TRUE AS t_sunken_eyes,
        parse_json_boolean(b.inputs->>'t_has_edema') IS TRUE AS t_has_edema,
        parse_json_boolean(b.inputs->>'t_has_other_disease_problem') IS TRUE AS t_has_other_disease_problem,
        parse_json_boolean(b.inputs->>'t_has_afp') IS TRUE AS t_has_afp,
        parse_json_boolean(b.inputs->>'t_is_referred') IS TRUE AS t_is_referred,
        
        parse_json_decimal(b.fields->>'cta_nn_quantity') AS cta_nn,
        parse_json_decimal(b.fields->>'cta_pe_quantity') AS cta_pe,
        parse_json_decimal(b.fields->>'cta_ge_quantity') AS cta_ge,
        parse_json_decimal(b.fields->>'cta_ad_quantity')  cta_ad,
        parse_json_decimal(b.fields->>'amoxicillin_250mg_quantity') AS amoxicillin_250mg,
        parse_json_decimal(b.fields->>'amoxicillin_500mg_quantity') AS amoxicillin_500mg,
        parse_json_decimal(b.fields->>'paracetamol_100mg_quantity') AS paracetamol_100mg,
        parse_json_decimal(b.fields->>'paracetamol_250mg_quantity') AS paracetamol_250mg,
        parse_json_decimal(b.fields->>'paracetamol_500mg_quantity') AS paracetamol_500mg,
        parse_json_decimal(b.fields->>'mebendazole_250mg_quantity') AS mebendazol_250mg,
        parse_json_decimal(b.fields->>'mebendazole_500mg_quantity') AS mebendazol_500mg,
        parse_json_decimal(b.fields->>'ors_quantity') AS ors,
        parse_json_decimal(b.fields->>'zinc_quantity') AS zinc,
        parse_json_decimal(b.fields->>'vitamin_a_quantity') AS vitamin_a,
        parse_json_decimal(b.fields->>'tetracycline_ointment_quantity') AS tetracycline_ointment,

        NULLIF(b.fields->>'rdt_result', '') AS rdt_result,
        NULLIF(b.fields->>'absence_reasons', '') AS absence_reasons,
        NULLIF(b.fields->>'coupon_number', '') AS coupon_number,

        parse_json_decimal(b.fields->>'temperature') AS temperature,

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
        