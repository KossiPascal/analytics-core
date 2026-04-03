CREATE MATERIALIZED VIEW IF NOT EXISTS pcime_data_view AS
SELECT
    (doc->>'_id')::TEXT AS id,
    (doc->>'_rev')::TEXT AS rev,
    (doc->>'form')::TEXT AS form,
    'tonoudayo' AS source,

    CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

    date_to_ih_month_year('month', (doc->>'reported_date')::BIGINT)::TEXT AS month,
    date_to_ih_month_year('year', (doc->>'reported_date')::BIGINT)::INTEGER AS year,

    -- START FIELDS

    (CASE 
        WHEN doc->>'form' <> 'pcime_c_asc' THEN 'followup'
        ELSE 'consultation'
    END) AS consultation_followup,

    (CASE WHEN doc->>'form' <> 'pcime_c_asc'
        THEN NULLIF(doc->'fields'->'inputs'->>'source_id', '')
        ELSE NULL
    END) AS consultation_id,

    NULLIF(doc->'fields'->>'patient_id', '') AS patient_id,

    CASE WHEN doc->'fields'->>'patient_age_in_years' <> 'NaN'
        THEN NULLIF(doc->'fields'->>'patient_age_in_years', '')
        ELSE NULL
    END::INTEGER AS age_in_years,
    CASE WHEN doc->'fields'->>'patient_age_in_months' <> 'NaN'
        THEN NULLIF(doc->'fields'->>'patient_age_in_months', '')
        ELSE NULL
    END:: INTEGER AS age_in_months,
    CASE WHEN doc->'fields'->>'patient_age_in_days' <> 'NaN'
        THEN NULLIF(doc->'fields'->>'patient_age_in_days', '')
        ELSE NULL
    END::INTEGER AS age_in_days,

    NULLIF(doc->'fields'->>'visited_contact_uuid', '') AS family_id,
    CASE
        WHEN LOWER(NULLIF(doc->'fields'->>'patient_sex', '')) IN ('male', 'homme', 'm') THEN 'M'
        WHEN LOWER(NULLIF(doc->'fields'->>'patient_sex', '')) IN ('female', 'femme', 'f') THEN 'F'
        ELSE NULL
    END::VARCHAR(1) AS sex,

    -- PCIME-C
    parse_json_boolean(doc->'fields'->>'referral_danger_signs') AS is_referral_danger_signs,
    parse_json_boolean(doc->'fields'->>'referral_MAS_complicated') AS is_referral_MAS_complicated,
    parse_json_boolean(doc->'fields'->>'MAS_uncomplicated') AS is_MAS_uncomplicated,
    parse_json_boolean(doc->'fields'->>'MAS_complicated') AS is_MAS_complicated,
    parse_json_boolean(doc->'fields'->>'MAM') AS is_MAM,
    parse_json_boolean(doc->'fields'->>'no_malnutrition') AS has_no_malnutrition,
    parse_json_boolean(doc->'fields'->>'has_simple_malaria') AS has_simple_malaria,

    parse_json_boolean(doc->'fields'->>'has_diarrhea') AS has_diarrhea,
    parse_json_boolean(doc->'fields'->>'has_malnutrition') AS has_malnutrition,
    parse_json_boolean(doc->'fields'->>'has_cough_cold') AS has_cough_cold,
    parse_json_boolean(doc->'fields'->>'has_pneumonia') AS has_pneumonia,
    parse_json_boolean(doc->'fields'->>'fever_with_diarrhea') AS has_fever_with_diarrhea,
    parse_json_boolean(doc->'fields'->>'fever_with_malaria') AS has_fever_with_malaria,
    parse_json_boolean(doc->'fields'->>'non_malaria_fever') AS has_no_malaria_fever,
    parse_json_boolean(doc->'fields'->>'diarrhea_with_malaria') AS has_diarrhea_with_malaria,
    parse_json_boolean(doc->'fields'->>'referral_fever') AS is_referral_fever,
    parse_json_boolean(doc->'fields'->>'referral_cough_cold') AS is_referral_cough_cold,
    parse_json_boolean(doc->'fields'->>'referral_mucus') AS is_referral_mucus,
    parse_json_boolean(doc->'fields'->>'referral_diarrhea') AS is_referral_diarrhea,
    parse_json_boolean(doc->'fields'->>'high_fever') AS has_high_fever,

    parse_json_boolean(doc->'fields'->>'within_24h') AS within_24h,
    parse_json_boolean(doc->'fields'->>'within_48h') AS within_48h,
    parse_json_boolean(doc->'fields'->>'within_72h') AS within_72h,
    parse_json_boolean(doc->'fields'->>'beyond_72h') AS beyond_72h,
     
    (CASE
        WHEN doc->>'form' = 'pcime_c_asc' AND (
            parse_json_boolean(doc->'fields'->'s_fever'->>'s_fever_previous_fever_episode') IS TRUE 
            OR parse_json_boolean(doc->'fields'->'s_fever'->>'s_fever_warm_body') IS TRUE
        ) THEN TRUE
        WHEN doc->>'form' = 'pcime_c_followup'
            THEN parse_json_boolean(doc->'fields'->'fever'->>'s_has_fever')
        ELSE NULL
    END) AS has_fever,

    (CASE
        WHEN doc->>'form' = 'pcime_c_asc'
            THEN parse_json_boolean(doc->'fields'->'s_danger_signs'->>'has_danger_signs')
        WHEN doc->>'form' = 'malnutrition_followup'
            THEN parse_json_boolean(doc->'fields'->>'danger_signs')
        ELSE NULL
    END) AS has_danger_signs,

    (CASE
        WHEN doc->>'form' IN ('pcime_c_asc', 'pcime_c_followup', 'usp_pcime_followup')
            THEN parse_json_boolean(doc->'fields'->'group_review'->>'s_have_you_refer_child')
        WHEN doc->>'form' IN ('pcime_c_referral', 'malnutrition_followup')
            THEN parse_json_boolean(doc->'fields'->'results_page'->>'s_have_you_refer_child')
        ELSE NULL
    END) AS is_referred,
    -- parse_json_boolean(COALESCE(doc->'fields'->>'referral', doc->'fields'->>'referal')) AS is_referral,

    parse_json_boolean(doc->'fields'->'inputs'->>'t_treat_for_diarrhea') AS t_treat_for_diarrhea,
    parse_json_boolean(doc->'fields'->'inputs'->>'t_treat_for_pneumonia') AS t_treat_for_pneumonia,
    parse_json_boolean(doc->'fields'->'inputs'->>'t_treat_for_fever') AS t_treat_for_fever,
    parse_json_boolean(doc->'fields'->'inputs'->>'t_treat_for_cough_cold') AS t_treat_for_cough_cold,
    parse_json_boolean(doc->'fields'->'inputs'->>'t_has_been_referred') AS t_has_been_referred,
    parse_json_boolean(doc->'fields'->'inputs'->>'t_non_malaria_fever') AS t_non_malaria_fever,
    parse_json_boolean(doc->'fields'->'inputs'->>'t_malaria_fever') AS t_malaria_fever,
    parse_json_boolean(doc->'fields'->'inputs'->>'t_has_malnutrition') AS t_has_malnutrition,
    parse_json_boolean(doc->'fields'->'inputs'->>'t_has_been_malnutrition_referred') AS t_has_been_malnutrition_referred,

    NULLIF(doc->'contact'->>'_id', '') AS chw_id,
    NULLIF(doc->'contact'->'parent'->>'_id', '') AS zone_id,
    NULLIF(doc->'contact'->'parent'->'parent'->>'_id', '') AS site_id,
    (s.district_id) AS district_id,
    
    CASE
        WHEN jsonb_typeof((doc->'geolocation')::JSONB) = 'object'
            AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
            AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
            THEN doc->'geolocation'
        ELSE NULL
    END::JSONB AS geolocation

FROM tonoudayo_docs 
    LEFT JOIN site_view s ON s.district_id = NULLIF(doc->'contact'->'parent'->'parent'->>'_id', '') AND NULLIF(doc->'contact'->'parent'->'parent'->>'_id', '') IS NOT NULL
WHERE
  doc->'fields' IS NOT NULL
  AND doc->>'form' IN ('pcime_c_asc', 'pcime_c_followup', 'malnutrition_followup', 'usp_pcime_followup', 'pcime_c_referral');
