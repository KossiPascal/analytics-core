CREATE MATERIALIZED VIEW IF NOT EXISTS home_visit_view AS
SELECT
    (doc->>'_id')::TEXT AS id,
    (doc->>'_rev')::TEXT AS rev,
    (doc->>'form')::TEXT AS form,

    CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

    date_to_ih_month_year('month', (doc->>'reported_date')::BIGINT)::TEXT AS month,
    date_to_ih_month_year('year', (doc->>'reported_date')::BIGINT)::INTEGER AS year,

    'tonoudayo' AS source,

    -- NULLIF(doc->'fields'->>'patient_id', '') AS family_id,
    -- NULLIF(doc->'fields'->>'visited_contact_uuid', '') AS family_id,
    NULLIF(doc->'fields'->'input'->'contact'->>'_id', '') AS family_id,

    string_to_array(NULLIF(doc->'fields'->'home_visit_purpose'->>'s_home_visit_purpose', ''), ' ') AS visit_purpose,


    (CASE WHEN doc->'fields'->'home_visit_purpose'->>'s_found_someone' = 'not_found' THEN TRUE ELSE NULL END)::BOOLEAN AS not_found,
    (CASE WHEN doc->'fields'->'home_visit_purpose'->>'s_found_someone' = 'yes_found_healthy' THEN TRUE ELSE NULL END)::BOOLEAN AS found_healthy,
    (CASE WHEN doc->'fields'->'home_visit_purpose'->>'s_found_someone' = 'yes_found_sick' THEN TRUE ELSE NULL END)::BOOLEAN AS found_someone_sick,

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
  AND doc->>'form' = 'home_visit';
