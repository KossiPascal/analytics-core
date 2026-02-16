CREATE MATERIALIZED VIEW IF NOT EXISTS newborn_data_view AS
SELECT
    (doc->>'_id')::UUID AS id,
    (doc->>'_rev')::TEXT AS rev,
    (doc->>'form')::TEXT AS form,

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

    parse_json_boolean(doc->'fields'->>'has_danger_signs') AS has_danger_signs,
    parse_json_boolean(doc->'fields'->'group_summary'->>'s_have_you_refer_child') AS is_referred,

    parse_json_boolean(doc->'fields'->'s_ds'->>'s_danger_signs_breastfeeding_refusal') AS is_breastfeeding_refusal,
    parse_json_boolean(doc->'fields'->'s_ds'->>'s_danger_signs_vomitting') AS is_vomitting,
    parse_json_boolean(doc->'fields'->'s_ds'->>'s_danger_signs_dificult_breathing') AS is_dificult_breathing,
    parse_json_boolean(doc->'fields'->'s_ds'->>'s_danger_signs_cord_suppurating') AS is_cord_suppurating,
    parse_json_boolean(doc->'fields'->'s_ds'->>'s_danger_signs_skin_pustules') AS is_skin_pustules,
    parse_json_boolean(doc->'fields'->'s_ds'->>'s_danger_signs_abdominal_distended') AS is_abdominal_distended,
    parse_json_boolean(doc->'fields'->'s_ds'->>'s_danger_signs_leak_crying') AS is_leak_crying,
    parse_json_boolean(doc->'fields'->'s_ds'->>'s_danger_signs_unconscious') AS is_unconscious,
    parse_json_boolean(doc->'fields'->'s_ds'->>'s_danger_signs_convulsions') AS is_convulsions,


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
  AND doc->>'form' = 'newborn_followup';
