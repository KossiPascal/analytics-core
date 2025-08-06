CREATE MATERIALIZED VIEW IF NOT EXISTS pcimne_data_view AS 
    SELECT
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'form')::TEXT AS form,

        EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(doc->>'reported_date' AS BIGINT) / 1000))::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')::TEXT AS month,

        CASE WHEN LOWER(doc->'fields'->>'patient_sex') IN ('male', 'homme', 'm') THEN 'M'
            WHEN LOWER(doc->'fields'->>'patient_sex') IN ('female', 'femme', 'f') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,

        NULLIF(doc->'fields'->>'patient_date_of_birth', '')::DATE AS birth_date,
        NULLIF(doc->'fields'->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
        NULLIF(doc->'fields'->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
        NULLIF(doc->'fields'->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,

        CASE WHEN doc->>'form' = 'pcimne_register' THEN 'consultation'
            WHEN doc->>'form' = 'pcimne_followup' THEN 'followup'
            ELSE NULL
        END AS consultation_followup,                    
        -- Sex and birth info

        parse_json_boolean(doc->'fields'->>'has_initial_danger_signs') IS TRUE AS has_initial_danger_signs,
        parse_json_boolean(doc->'fields'->>'has_fever') IS TRUE AS has_fever,
        parse_json_boolean(doc->'fields'->>'has_malaria') IS TRUE AS has_malaria,
        parse_json_boolean(doc->'fields'->>'has_cough_cold') IS TRUE AS has_cough_cold,
        parse_json_boolean(doc->'fields'->>'has_pneumonia') IS TRUE AS has_pneumonia,
        parse_json_boolean(doc->'fields'->>'has_normal_respiratory_rate') IS TRUE AS has_normal_respiratory_rate,
        parse_json_boolean(doc->'fields'->>'has_diarrhea') IS TRUE AS has_diarrhea,
        parse_json_boolean(doc->'fields'->>'has_malnutrition') IS TRUE AS has_malnutrition,
        parse_json_boolean(doc->'fields'->>'has_modere_malnutrition') IS TRUE AS has_modere_malnutrition,
        parse_json_boolean(doc->'fields'->>'has_severe_malnutrition') IS TRUE AS has_severe_malnutrition,
        parse_json_boolean(doc->'fields'->>'has_afp') IS TRUE AS has_afp,
        parse_json_boolean(doc->'fields'->>'is_danger_signs_referral') IS TRUE AS is_danger_signs_referral,
        parse_json_boolean(doc->'fields'->>'is_fever_referal') IS TRUE AS is_fever_referal,
        parse_json_boolean(doc->'fields'->>'is_cough_cold_referal') IS TRUE AS is_cough_cold_referal,
        parse_json_boolean(doc->'fields'->>'is_diarrhea_referal') IS TRUE AS is_diarrhea_referal,
        parse_json_boolean(doc->'fields'->>'is_malnutrition_referal') IS TRUE AS is_malnutrition_referal,
        parse_json_boolean(doc->'fields'->>'is_referred') IS TRUE AS is_referred,
        parse_json_boolean(doc->'fields'->>'rdt_given') IS TRUE AS rdt_given,
        parse_json_boolean(doc->'fields'->>'unable_drink_breastfeed') IS TRUE AS unable_drink_breastfeed,
        parse_json_boolean(doc->'fields'->>'vomits_everything') IS TRUE AS vomits_everything,
        parse_json_boolean(doc->'fields'->>'convulsions') IS TRUE AS convulsions,
        parse_json_boolean(doc->'fields'->>'sleepy_unconscious') IS TRUE AS sleepy_unconscious,
        parse_json_boolean(doc->'fields'->>'has_stiff_neck') IS TRUE AS has_stiff_neck,
        parse_json_boolean(doc->'fields'->>'has_bulging_fontanelle') IS TRUE AS has_bulging_fontanelle,
        parse_json_boolean(doc->'fields'->>'breathing_difficulty') IS TRUE AS breathing_difficulty,
        parse_json_boolean(doc->'fields'->>'cough_more_than_14days') IS TRUE AS cough_more_than_14days,
        parse_json_boolean(doc->'fields'->>'subcostal_indrawing') IS TRUE AS subcostal_indrawing,
        parse_json_boolean(doc->'fields'->>'wheezing') IS TRUE AS wheezing,
        parse_json_boolean(doc->'fields'->>'bloody_diarrhea') IS TRUE AS bloody_diarrhea,
        parse_json_boolean(doc->'fields'->>'diarrhea_more_than_14_days') IS TRUE AS diarrhea_more_than_14_days,
        parse_json_boolean(doc->'fields'->>'blood_in_stool') IS TRUE AS blood_in_stool,
        parse_json_boolean(doc->'fields'->>'restless') IS TRUE AS restless,
        parse_json_boolean(doc->'fields'->>'drinks_hungrily') IS TRUE AS drinks_hungrily,
        parse_json_boolean(doc->'fields'->>'sunken_eyes') IS TRUE AS sunken_eyes,
        parse_json_boolean(doc->'fields'->>'has_edema') IS TRUE AS has_edema,
        parse_json_boolean(doc->'fields'->>'is_principal_referal') IS TRUE AS is_principal_referal,
        parse_json_boolean(doc->'fields'->>'has_health_problem') IS TRUE AS has_health_problem,
        parse_json_boolean(doc->'fields'->>'has_serious_malaria') IS TRUE AS has_serious_malaria,
        parse_json_boolean(doc->'fields'->>'has_pre_reference_treatments') IS TRUE AS has_pre_reference_treatments,
        parse_json_boolean(doc->'fields'->>'is_present') IS TRUE AS is_present,
        parse_json_boolean(doc->'fields'->>'went_to_health_center') IS TRUE AS went_to_health_center,
        parse_json_boolean(doc->'fields'->>'coupon_available') IS TRUE AS coupon_available,
        parse_json_boolean(doc->'fields'->>'has_no_improvement') IS TRUE AS has_no_improvement,
        parse_json_boolean(doc->'fields'->>'has_getting_worse') IS TRUE AS has_getting_worse,

        NULLIF(doc->'fields'->>'promptitude', '') AS promptitude,


        -- FOR TASK / FOLLOWUP
        NULLIF(doc->'fields'->'inputs'->>'source', '') AS source,
        NULLIF(doc->'fields'->'inputs'->>'source_id', '') AS source_id,
        NULLIF(doc->'fields'->'inputs'->>'t_family_id', '') AS t_family_id,
        NULLIF(doc->'fields'->'inputs'->>'t_family_name', '') AS t_family_name,
        NULLIF(doc->'fields'->'inputs'->>'t_family_external_id', '') AS t_family_external_id,
        NULLIF(doc->'fields'->'inputs'->>'t_temperature', '') AS t_temperature,
        NULLIF(doc->'fields'->'inputs'->>'t_other_diseases', '') AS t_other_diseases,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_fever') IS TRUE AS t_has_fever,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_malaria') IS TRUE AS t_has_malaria,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_diarrhea') IS TRUE AS t_has_diarrhea,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_cough_cold') IS TRUE AS t_has_cough_cold,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_malnutrition') IS TRUE AS t_has_malnutrition,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_pneumonia') IS TRUE AS t_has_pneumonia,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_unable_drink_breastfeed') IS TRUE AS t_unable_drink_breastfeed,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_vomits_everything') IS TRUE AS t_vomits_everything,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_convulsions') IS TRUE AS t_convulsions,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_sleepy_unconscious') IS TRUE AS t_sleepy_unconscious,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_stiff_neck') IS TRUE AS t_has_stiff_neck,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_bulging_fontanelle') IS TRUE AS t_has_bulging_fontanelle,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_breathing_difficulty') IS TRUE AS t_breathing_difficulty,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_cough_more_than_14days') IS TRUE AS t_cough_more_than_14days,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_subcostal_indrawing') IS TRUE AS t_subcostal_indrawing,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_wheezing') IS TRUE AS t_wheezing,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_bloody_diarrhea') IS TRUE AS t_bloody_diarrhea,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_diarrhea_more_than_14_days') IS TRUE AS t_diarrhea_more_than_14_days,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_blood_in_stool') IS TRUE AS t_blood_in_stool,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_restless') IS TRUE AS t_restless,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_drinks_hungrily') IS TRUE AS t_drinks_hungrily,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_sunken_eyes') IS TRUE AS t_sunken_eyes,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_edema') IS TRUE AS t_has_edema,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_other_disease_problem') IS TRUE AS t_has_other_disease_problem,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_has_afp') IS TRUE AS t_has_afp,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_is_referred') IS TRUE AS t_is_referred,
        
        parse_json_decimal(doc->'fields'->>'cta_nn_quantity') AS cta_nn,
        parse_json_decimal(doc->'fields'->>'cta_pe_quantity') AS cta_pe,
        parse_json_decimal(doc->'fields'->>'cta_ge_quantity') AS cta_ge,
        parse_json_decimal(doc->'fields'->>'cta_ad_quantity')  cta_ad,
        parse_json_decimal(doc->'fields'->>'amoxicillin_250mg_quantity') AS amoxicillin_250mg,
        parse_json_decimal(doc->'fields'->>'amoxicillin_500mg_quantity') AS amoxicillin_500mg,
        parse_json_decimal(doc->'fields'->>'paracetamol_100mg_quantity') AS paracetamol_100mg,
        parse_json_decimal(doc->'fields'->>'paracetamol_250mg_quantity') AS paracetamol_250mg,
        parse_json_decimal(doc->'fields'->>'paracetamol_500mg_quantity') AS paracetamol_500mg,
        parse_json_decimal(doc->'fields'->>'mebendazole_250mg_quantity') AS mebendazol_250mg,
        parse_json_decimal(doc->'fields'->>'mebendazole_500mg_quantity') AS mebendazol_500mg,
        parse_json_decimal(doc->'fields'->>'ors_quantity') AS ors,
        parse_json_decimal(doc->'fields'->>'zinc_quantity') AS zinc,
        parse_json_decimal(doc->'fields'->>'vitamin_a_quantity') AS vitamin_a,
        parse_json_decimal(doc->'fields'->>'tetracycline_ointment_quantity') AS tetracycline_ointment,


        NULLIF(doc->'fields'->>'rdt_result', '') AS rdt_result,
        NULLIF(doc->'fields'->>'absence_reasons', '') AS absence_reasons,
        NULLIF(doc->'fields'->>'coupon_number', '') AS coupon_number,

        parse_json_decimal(doc->'fields'->>'temperature') AS temperature,


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
        AND doc->>'form' IN ('pcimne_register', 'pcimne_followup');   
        