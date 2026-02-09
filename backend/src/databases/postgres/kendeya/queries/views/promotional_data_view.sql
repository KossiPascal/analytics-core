CREATE MATERIALIZED VIEW IF NOT EXISTS promotional_data_view AS 

WITH base_promo AS (
    SELECT 
        doc,
        doc->'fields'->'promotional_activity' AS promo,
        NULLIF(doc->'fields'->'promotional_activity'->>'activity_method', '') AS activity_method,
        string_to_array(NULLIF(doc->'fields'->'promotional_activity'->>'activity_domain', ''), ' ')::TEXT[] AS activity_domains,
        string_to_array(NULLIF(doc->'fields'->'promotional_activity'->>'theme', ''), ' ')::TEXT[] AS activity_themes

    FROM couchdb
    WHERE
        doc->>'form' IS NOT NULL
        AND doc->'fields' IS NOT NULL
        AND doc->>'form' IN (
            'promotional_activity',
            'pa_educational_talk',
            'pa_home_visit',
            'pa_individual_talk'
        )
        AND doc->'fields'->'promotional_activity' IS NOT NULL
)

SELECT
    (doc->>'_id')::TEXT AS id,
    (doc->>'_rev')::TEXT AS rev,
    (doc->>'form')::TEXT AS form,

    CASE WHEN LOWER(doc->'fields'->>'patient_sex') IN ('male', 'homme', 'm') THEN 'M'
        WHEN LOWER(doc->'fields'->>'patient_sex') IN ('female', 'femme', 'f') THEN 'F'
        ELSE NULL
    END::VARCHAR(1) AS sex,

    NULLIF(doc->'fields'->>'patient_date_of_birth', '')::DATE AS birth_date,
    NULLIF(doc->'fields'->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
    NULLIF(doc->'fields'->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
    NULLIF(doc->'fields'->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,

    parse_json_boolean(doc->'fields'->>'is_vad_method') IS TRUE AS is_vad_method,
    parse_json_boolean(doc->'fields'->>'is_talk_method') IS TRUE AS is_talk_method,
    parse_json_boolean(doc->'fields'->>'is_interpersonal_com_method') IS TRUE AS is_interpersonal_talk_method,

    activity_method,
    activity_domains,
    activity_themes,

    NULLIF(promo->>'activity_location', '') AS activity_location,
    NULLIF(promo->>'family_number', '') AS family_number,

    parse_json_bigint(promo->>'women_number') AS women_number,
    parse_json_bigint(promo->>'men_number') AS men_number,
    parse_json_bigint(promo->>'total_person') AS total_person,

    -- Domain flags
    'maternel_childhealth' = ANY(activity_domains) AS is_maternel_childhealth_domain,
    'education' = ANY(activity_domains) AS is_education_domain,
    'gbv' = ANY(activity_domains) AS is_gbv_domain,
    'nutrition' = ANY(activity_domains) AS is_nutrition_domain,
    'water_hygiene' = ANY(activity_domains) AS is_water_hygiene_domain,
    'ist_vih' = ANY(activity_domains) AS is_ist_vih_domain,
    'disease_control' = ANY(activity_domains) AS is_disease_control_domain,
    'others' = ANY(activity_domains) AS is_others_domain,
    
    NULLIF(promo->>'other_activity_domain', '') AS other_domain,

    -- Theme flags
    'prenatal_consultation' = ANY(activity_themes) AS is_prenatal_consultation_theme,
    'birth_attended' = ANY(activity_themes) AS is_birth_attended_theme,
    'delivery' = ANY(activity_themes) AS is_delivery_theme,
    'birth_registration' = ANY(activity_themes) AS is_birth_registration_theme,
    'post_natal' = ANY(activity_themes) AS is_post_natal_theme,
    'post_abortion' = ANY(activity_themes) AS is_post_abortion_theme,
    'obstetric_fistula' = ANY(activity_themes) AS is_obstetric_fistula_theme,
    'family_planning' = ANY(activity_themes) AS is_family_planning_theme,
    'oral_contraceptive' = ANY(activity_themes) AS is_oral_contraceptive_theme,
    'vaccination' = ANY(activity_themes) AS is_vaccination_theme,
    'newborn_care_home' = ANY(activity_themes) AS is_newborn_care_home_theme,
    'care_home_illness_case' = ANY(activity_themes) AS is_care_home_illness_case_theme,
    'child_development_care' = ANY(activity_themes) AS is_child_development_care_theme,
    'advice_for_child_development' = ANY(activity_themes) AS is_advice_for_child_development_theme,
    'child_abuse' = ANY(activity_themes) AS is_child_abuse_theme,
    'female_genital_mutilation' = ANY(activity_themes) AS is_female_genital_mutilation_theme,
    'exclusive_breastfeeding' = ANY(activity_themes) AS is_exclusive_breastfeeding_theme,
    'vitamin_a_supp' = ANY(activity_themes) AS is_vitamin_a_supp_theme,
    'suppl_feeding' = ANY(activity_themes) AS is_suppl_feeding_theme,
    'malnutrition' = ANY(activity_themes) AS is_malnutrition_theme,
    'combating_iodine' = ANY(activity_themes) AS is_combating_iodine_theme,
    'hand_washing' = ANY(activity_themes) AS is_hand_washing_theme,
    'community_led' = ANY(activity_themes) AS is_community_led_theme,
    'tuberculosis' = ANY(activity_themes) AS is_tuberculosis_theme,
    'leprosy' = ANY(activity_themes) AS is_leprosy_theme,
    'buruli_ulcer' = ANY(activity_themes) AS is_buruli_ulcer_theme,
    'onchocerciasis' = ANY(activity_themes) AS is_onchocerciasis_theme,
    'bilharzia' = ANY(activity_themes) AS is_bilharzia_theme,
    'mass_deworming' = ANY(activity_themes) AS is_mass_deworming_theme,
    'human_african_trypanosomiasis' = ANY(activity_themes) AS is_human_african_trypanosomiasis_theme,
    'lymphatic' = ANY(activity_themes) AS is_lymphatic_theme,
    'trachoma' = ANY(activity_themes) AS is_trachoma_theme,
    'sti_and_hepatitis' = ANY(activity_themes) AS is_sti_and_hepatitis_theme,
    'hypertension' = ANY(activity_themes) AS is_hypertension_theme,
    'diabetes' = ANY(activity_themes) AS is_diabetes_theme,
    'cancers' = ANY(activity_themes) AS is_cancers_theme,
    'sickle_cell_disease' = ANY(activity_themes) AS is_sickle_cell_disease_theme,
    'malaria' = ANY(activity_themes) AS is_malaria_theme,
    'diarrhea' = ANY(activity_themes) AS is_diarrhea_theme,
    'bloody_diarrhea' = ANY(activity_themes) AS is_bloody_diarrhea_theme,
    'pneumonia' = ANY(activity_themes) AS is_pneumonia_theme,
    'yellow_fever' = ANY(activity_themes) AS is_yellow_fever_theme,
    'cholera' = ANY(activity_themes) AS is_cholera_theme,
    'tetanus' = ANY(activity_themes) AS is_tetanus_theme,
    'viral_diseases' = ANY(activity_themes) AS is_viral_diseases_theme,
    'meningitis' = ANY(activity_themes) AS is_meningitis_theme,
    'pfa' = ANY(activity_themes) AS is_pfa_theme,
    'urine_loss' = ANY(activity_themes) AS is_urine_loss_theme,
    'blood_pressure' = ANY(activity_themes) AS is_blood_pressure_theme,
    'hiv' = ANY(activity_themes) AS is_hiv_theme,
    'ist' = ANY(activity_themes) AS is_ist_theme,

    COALESCE(promo->>'other_theme', '') <> '' AS is_other_theme,
    NULLIF(promo->>'other_theme', '') AS other_theme,

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

    CASE 
        WHEN COALESCE(promo->>'activity_date', '') <> '' THEN TO_DATE(promo->>'activity_date', 'YYYY-MM-DD') 
        ELSE NULL 
    END AS reported_date,

    CASE 
        WHEN COALESCE(promo->>'activity_date', '') <> '' THEN TO_TIMESTAMP(promo->>'activity_date', 'YYYY-MM-DD HH24:MI:SS') 
        ELSE NULL 
    END AS reported_full_date,

    CASE 
        WHEN COALESCE(promo->>'activity_date', '') <> '' THEN EXTRACT(EPOCH FROM TO_DATE(promo->>'activity_date', 'YYYY-MM-DD'))
        ELSE NULL 
    END::BIGINT AS reported_date_timestamp,

    CASE 
        WHEN COALESCE(promo->>'activity_date', '') <> '' THEN EXTRACT(YEAR FROM TO_DATE(promo->>'activity_date', 'YYYY-MM-DD')) 
        ELSE NULL 
    END::BIGINT AS year,

    CASE 
        WHEN COALESCE(promo->>'activity_date', '') <> '' THEN LPAD(EXTRACT(MONTH FROM TO_DATE(promo->>'activity_date', 'YYYY-MM-DD'))::TEXT, 2, '0') 
        ELSE NULL 
    END::TEXT AS month,

    CASE 
        WHEN jsonb_typeof(doc->'geolocation') = 'object'
            AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
            AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
        THEN doc->'geolocation'
        ELSE NULL
    END::JSONB AS geolocation

FROM base_promo;
