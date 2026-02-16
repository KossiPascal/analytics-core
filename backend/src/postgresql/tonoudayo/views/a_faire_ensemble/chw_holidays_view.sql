CREATE MATERIALIZED VIEW IF NOT EXISTS chw_holidays_view AS
SELECT
    (doc->>'_id')::UUID AS id,
    (doc->>'_rev')::TEXT AS rev,
    (doc->>'form')::TEXT AS form,

    CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
    TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

    date_to_ih_month_year('month', (doc->>'reported_date')::BIGINT)::TEXT AS month,
    date_to_ih_month_year('year', (doc->>'reported_date')::BIGINT)::INTEGER AS year,

    NULLIF(doc->>'chw_id', '') AS chw_id,
    NULLIF(doc->>'this_month', '') AS this_month,
    NULLIF(doc->>'this_year', '') AS this_year,
    NULLIF(doc->>'last_year', '') AS last_year,
    NULLIF(doc->>'action_name', '') AS action_name,

    NULLIF(doc->>'period.start_date', '') AS period_start_date,
    NULLIF(doc->>'period.end_date', '') AS period_end_date,

    NULLIF(doc->>'chw_replacer_info.full_name', '') AS chw_replacer_full_name,
    NULLIF(doc->>'chw_replacer_info.code', '') AS chw_replacer_code,

    CASE
        WHEN jsonb_typeof((doc->'geolocation')::JSONB) = 'object'
            AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
            AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
            THEN doc->'geolocation'
        ELSE NULL
    END::JSONB AS geolocation

FROM tonoudayo_docs
WHERE
    doc->>'form' IS NOT NULL
  AND doc->'fields' IS NOT NULL
  AND doc->>'form' = 'chw_holidays';
