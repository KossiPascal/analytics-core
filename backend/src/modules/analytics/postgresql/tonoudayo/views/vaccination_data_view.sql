CREATE MATERIALIZED VIEW IF NOT EXISTS vaccination_data_view AS
SELECT
    (doc->>'_id')::UUID AS id,
    (doc->>'_rev')::TEXT AS rev,
    (doc->>'form')::TEXT AS form,
    'tonoudayo' AS source,

    CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

    date_to_ih_month_year('month', (doc->>'reported_date')::BIGINT)::TEXT AS month,
    date_to_ih_month_year('year', (doc->>'reported_date')::BIGINT)::INTEGER AS year,

    NULLIF(doc->'fields'->>'patient_id', '') AS patient_id,
    NULLIF(doc->'fields'->>'patient_age_in_years', '')::INTEGER AS age_in_years,
    NULLIF(doc->'fields'->>'patient_age_in_months', ''):: INTEGER AS age_in_months,
    NULLIF(doc->'fields'->>'patient_age_in_days', '')::INTEGER AS age_in_days,
    NULLIF(doc->'fields'->>'visited_contact_uuid', '') AS family_id,

    CASE
        WHEN LOWER(NULLIF(doc->'fields'->>'patient_sex', '')) IN ('male', 'homme', 'm') THEN 'M'
        WHEN LOWER(NULLIF(doc->'fields'->>'patient_sex', '')) IN ('female', 'femme', 'f') THEN 'F'
        ELSE NULL
    END::VARCHAR(1) AS sex,

    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_one_day') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_one_day'->>'s_vaccinal_status_BCG')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_BCG,

    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_one_day') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_one_day'->>'s_vaccinal_status_VPO_0')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_VPO_0,
    
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_six_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_six_weeks'->>'s_vaccinal_status_DTC_B1')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_DTC_B1,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_six_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_six_weeks'->>'s_vaccinal_status_VPO_1')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_VPO_1,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_six_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_six_weeks'->>'s_vaccinal_status_pneumo_1')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_pneumo_1,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_six_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_six_weeks'->>'s_vaccinal_status_rota_1')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_rota_1,
    
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_ten_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_ten_weeks'->>'s_vaccinal_status_DTC_B2')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_DTC_B2,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_ten_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_ten_weeks'->>'s_vaccinal_status_VPO_2')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_VPO_2,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_ten_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_ten_weeks'->>'s_vaccinal_status_pneumo_2')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_pneumo_2,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_ten_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_ten_weeks'->>'s_vaccinal_status_rota_2')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_rota_2,
    
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_forteen_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_forteen_weeks'->>'s_vaccinal_status_DTC_B3')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_DTC_B3,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_forteen_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_forteen_weeks'->>'s_vaccinal_status_VPO_3')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_VPO_3,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_forteen_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_forteen_weeks'->>'s_vaccinal_status_pneumo_3')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_pneumo_3,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_forteen_weeks') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_forteen_weeks'->>'s_vaccinal_status_vpi')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_vpi,

    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_nine_months') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_nine_months'->>'s_vaccinal_status_RR1')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_RR1,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_nine_months') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_nine_months'->>'s_vaccinal_status_VAA')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_VAA,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_nine_months') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_nine_months'->>'s_vaccinal_status_vit_A')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_vit_A,
    
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_nine_months') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_fifty_months'->>'s_vaccinal_status_RR2')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_RR2,
    CASE
        WHEN jsonb_typeof(doc->'fields'->'s_vaccinal_status'->'s_nine_months') = 'object'
            THEN parse_json_boolean(doc->'fields'->'s_vaccinal_status'->'s_fifty_months'->>'s_vaccinal_status_MEG')
            ELSE NULL
    END:: BOOLEAN AS is_vaccine_MEG,


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
  AND doc->>'form' = 'vaccination_followup';
