CREATE MATERIALIZED VIEW IF NOT EXISTS family_planning_data_view AS
SELECT
    (doc->>'_id')::UUID AS id,
    (doc->>'_rev')::TEXT AS rev,
    (doc->>'form')::TEXT AS form,

    CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

    date_to_ih_month_year('month', (doc->>'reported_date')::BIGINT)::TEXT AS month,
    date_to_ih_month_year('year', (doc->>'reported_date')::BIGINT)::INTEGER AS year,

    'tonoudayo' AS source,

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

    NULLIF(doc->'fields'->>'follow_up_count', '') AS follow_up_count,
    NULLIF(doc->'fields'->>'referral', '') AS referral,

    (CASE
         WHEN doc->>'form' = 'pregnancy_family_planning'
             THEN NULLIF(doc->'fields'->>'chosen_fp_method', '')
         WHEN doc->>'form' IN ('fp_follow_up_renewal', 'fp_followup_danger_sign_check')
             THEN NULLIF(doc->'fields'->>'fp_method', '')
         ELSE NULL
    END) AS method,

    NULLIF(doc->'fields'->>'side_effect', '') AS side_effect,

    (CASE
         WHEN doc->>'form' = 'pregnancy_family_planning'
             THEN NULLIF(doc->'fields'->>'has_danger_signs', '')
        WHEN doc->>'form' = 'fp_followup_danger_sign_check'
             THEN NULLIF(doc->>'s_summary->>r_have_you_refer_child', '')
         ELSE NULL
    END) AS has_danger_signs,

    (CASE
         WHEN doc->>'form' IN ('pregnancy_family_planning', 'fp_followup_danger_sign_check')
             THEN NULLIF(doc->>'s_summary->>s_have_you_refer_child', '')
         WHEN doc->>'form' = 'fp_follow_up_renewal'
             THEN NULLIF(doc->>'s_summary->>s_have_you_refer_woman', '')
         ELSE NULL
    END) AS is_referred,

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
    doc->>'form' IS NOT NULL
  AND doc->'fields' IS NOT NULL
  AND doc->>'form' IN ('pregnancy_family_planning', 'fp_follow_up_renewal', 'fp_followup_danger_sign_check');
