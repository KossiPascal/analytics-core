-- @name: promotional_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS promotional_data_view AS 

WITH base_promo AS (
    SELECT 
        doc,
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'form')::TEXT AS form,
        (doc->'geolocation')::JSONB AS geolocation,
        doc->'fields' AS fields,
        doc->'fields'->'promotional_activity' AS promo,
        string_to_array(NULLIF(doc->'fields'->'promotional_activity'->>'activity_domain', ''), ' ')::TEXT[] AS activity_domains,
        string_to_array(NULLIF(doc->'fields'->'promotional_activity'->>'theme', ''), ' ')::TEXT[] AS activity_themes,

        NULLIF(doc->'fields'->'promotional_activity'->>'activity_method', '') AS activity_method,
        NULLIF(doc->'fields'->'promotional_activity'->>'activity_date', '') AS activity_date,

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

        LOWER(doc->'fields'->>'patient_sex') AS patient_sex

    FROM kendeya_docs
    WHERE
        doc->>'form' IS NOT NULL
        AND doc->'fields' IS NOT NULL
        AND doc->>'form' IN ('promotional_activity','pa_educational_talk','pa_home_visit','pa_individual_talk')
        AND doc->'fields'->'promotional_activity' IS NOT NULL
)

SELECT
    b.id,
    b.rev,
    b.form,

    CASE WHEN b.patient_sex IN ('male', 'homme', 'm') THEN 'M'
        WHEN b.patient_sex IN ('female', 'femme', 'f') THEN 'F'
        ELSE NULL
    END::VARCHAR(1) AS sex,

    NULLIF(b.fields->>'patient_date_of_birth', '')::DATE AS birth_date,
    NULLIF(b.fields->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
    NULLIF(b.fields->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
    NULLIF(b.fields->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,

    parse_json_boolean(b.fields->>'is_vad_method') IS TRUE AS is_vad_method,
    parse_json_boolean(b.fields->>'is_talk_method') IS TRUE AS is_talk_method,
    parse_json_boolean(b.fields->>'is_interpersonal_com_method') IS TRUE AS is_interpersonal_talk_method,

    b.activity_method,
    b.activity_domains,
    b.activity_themes,

    NULLIF(b.promo->>'activity_location', '') AS activity_location,
    NULLIF(b.promo->>'family_number', '') AS family_number,

    parse_json_bigint(b.promo->>'women_number') AS women_number,
    parse_json_bigint(b.promo->>'men_number') AS men_number,
    parse_json_bigint(b.promo->>'total_person') AS total_person,

    -- Domain flags
    'maternel_childhealth' = ANY(b.activity_domains) AS is_maternel_childhealth_domain,
    'education' = ANY(b.activity_domains) AS is_education_domain,
    'gbv' = ANY(b.activity_domains) AS is_gbv_domain,
    'nutrition' = ANY(b.activity_domains) AS is_nutrition_domain,
    'water_hygiene' = ANY(b.activity_domains) AS is_water_hygiene_domain,
    'ist_vih' = ANY(b.activity_domains) AS is_ist_vih_domain,
    'disease_control' = ANY(b.activity_domains) AS is_disease_control_domain,
    'others' = ANY(b.activity_domains) AS is_others_domain,
    
    NULLIF(b.promo->>'other_activity_domain', '') AS other_domain,

    -- Theme flags
    'prenatal_consultation' = ANY(b.activity_themes) AS is_prenatal_consultation_theme,
    'birth_attended' = ANY(b.activity_themes) AS is_birth_attended_theme,
    'delivery' = ANY(b.activity_themes) AS is_delivery_theme,
    'birth_registration' = ANY(b.activity_themes) AS is_birth_registration_theme,
    'post_natal' = ANY(b.activity_themes) AS is_post_natal_theme,
    'post_abortion' = ANY(b.activity_themes) AS is_post_abortion_theme,
    'obstetric_fistula' = ANY(b.activity_themes) AS is_obstetric_fistula_theme,
    'family_planning' = ANY(b.activity_themes) AS is_family_planning_theme,
    'oral_contraceptive' = ANY(b.activity_themes) AS is_oral_contraceptive_theme,
    'vaccination' = ANY(b.activity_themes) AS is_vaccination_theme,
    'newborn_care_home' = ANY(b.activity_themes) AS is_newborn_care_home_theme,
    'care_home_illness_case' = ANY(b.activity_themes) AS is_care_home_illness_case_theme,
    'child_development_care' = ANY(b.activity_themes) AS is_child_development_care_theme,
    'advice_for_child_development' = ANY(b.activity_themes) AS is_advice_for_child_development_theme,
    'child_abuse' = ANY(b.activity_themes) AS is_child_abuse_theme,
    'female_genital_mutilation' = ANY(b.activity_themes) AS is_female_genital_mutilation_theme,
    'exclusive_breastfeeding' = ANY(b.activity_themes) AS is_exclusive_breastfeeding_theme,
    'vitamin_a_supp' = ANY(b.activity_themes) AS is_vitamin_a_supp_theme,
    'suppl_feeding' = ANY(b.activity_themes) AS is_suppl_feeding_theme,
    'malnutrition' = ANY(b.activity_themes) AS is_malnutrition_theme,
    'combating_iodine' = ANY(b.activity_themes) AS is_combating_iodine_theme,
    'hand_washing' = ANY(b.activity_themes) AS is_hand_washing_theme,
    'community_led' = ANY(b.activity_themes) AS is_community_led_theme,
    'tuberculosis' = ANY(b.activity_themes) AS is_tuberculosis_theme,
    'leprosy' = ANY(b.activity_themes) AS is_leprosy_theme,
    'buruli_ulcer' = ANY(b.activity_themes) AS is_buruli_ulcer_theme,
    'onchocerciasis' = ANY(b.activity_themes) AS is_onchocerciasis_theme,
    'bilharzia' = ANY(b.activity_themes) AS is_bilharzia_theme,
    'mass_deworming' = ANY(b.activity_themes) AS is_mass_deworming_theme,
    'human_african_trypanosomiasis' = ANY(b.activity_themes) AS is_human_african_trypanosomiasis_theme,
    'lymphatic' = ANY(b.activity_themes) AS is_lymphatic_theme,
    'trachoma' = ANY(b.activity_themes) AS is_trachoma_theme,
    'sti_and_hepatitis' = ANY(b.activity_themes) AS is_sti_and_hepatitis_theme,
    'hypertension' = ANY(b.activity_themes) AS is_hypertension_theme,
    'diabetes' = ANY(b.activity_themes) AS is_diabetes_theme,
    'cancers' = ANY(b.activity_themes) AS is_cancers_theme,
    'sickle_cell_disease' = ANY(b.activity_themes) AS is_sickle_cell_disease_theme,
    'malaria' = ANY(b.activity_themes) AS is_malaria_theme,
    'diarrhea' = ANY(b.activity_themes) AS is_diarrhea_theme,
    'bloody_diarrhea' = ANY(b.activity_themes) AS is_bloody_diarrhea_theme,
    'pneumonia' = ANY(b.activity_themes) AS is_pneumonia_theme,
    'yellow_fever' = ANY(b.activity_themes) AS is_yellow_fever_theme,
    'cholera' = ANY(b.activity_themes) AS is_cholera_theme,
    'tetanus' = ANY(b.activity_themes) AS is_tetanus_theme,
    'viral_diseases' = ANY(b.activity_themes) AS is_viral_diseases_theme,
    'meningitis' = ANY(b.activity_themes) AS is_meningitis_theme,
    'pfa' = ANY(b.activity_themes) AS is_pfa_theme,
    'urine_loss' = ANY(b.activity_themes) AS is_urine_loss_theme,
    'blood_pressure' = ANY(b.activity_themes) AS is_blood_pressure_theme,
    'hiv' = ANY(b.activity_themes) AS is_hiv_theme,
    'ist' = ANY(b.activity_themes) AS is_ist_theme,

    COALESCE(b.promo->>'other_theme', '') <> '' AS is_other_theme,
    NULLIF(b.promo->>'other_theme', '') AS other_theme,

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

    CASE WHEN b.activity_date <> '' THEN TO_DATE(b.activity_date, 'YYYY-MM-DD') ELSE NULL END AS reported_date,
    CASE WHEN b.activity_date <> '' THEN TO_TIMESTAMP(b.activity_date, 'YYYY-MM-DD HH24:MI:SS') ELSE NULL END AS reported_full_date,
    CASE WHEN b.activity_date <> '' THEN EXTRACT(EPOCH FROM TO_DATE(b.activity_date, 'YYYY-MM-DD')) ELSE NULL END::BIGINT AS reported_date_timestamp,
    CASE WHEN b.activity_date <> '' THEN EXTRACT(YEAR FROM TO_DATE(b.activity_date, 'YYYY-MM-DD')) ELSE NULL END::BIGINT AS year,
    CASE WHEN b.activity_date <> '' THEN LPAD(EXTRACT(MONTH FROM TO_DATE(b.activity_date, 'YYYY-MM-DD'))::TEXT, 2, '0') ELSE NULL END::TEXT AS month,

    CASE 
        WHEN jsonb_typeof(b.geolocation) = 'object'
        AND NULLIF(b.geolocation->>'latitude', '') IS NOT NULL
        AND NULLIF(b.geolocation->>'longitude', '') IS NOT NULL
        THEN b.geolocation
        ELSE NULL
    END::JSONB AS geolocation

FROM base_promo b;
