
CREATE MATERIALIZED VIEW IF NOT EXISTS delivery_data_view AS
SELECT
    (doc->>'_id')::UUID AS id,
    (doc->>'_rev')::TEXT AS rev,
    (doc->>'form')::TEXT AS form,
    ('tonoudayo') AS source,

    CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

    date_to_ih_month_year('month', (doc->>'reported_date')::BIGINT)::TEXT AS month,
    date_to_ih_month_year('year', (doc->>'reported_date')::BIGINT)::INTEGER AS year,

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

    NULLIF(doc->'fields'->'s_delivery'->>'s_delivery_date', '') AS delivery_date,
    NULLIF(doc->'fields'->'group_diagnosis'->'group_summary'->>'s_have_you_refer_child', '') AS is_referred,

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
  AND doc->>'form' = 'delivery';
