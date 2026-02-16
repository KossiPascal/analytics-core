CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE MATERIALIZED VIEW IF NOT EXISTS district_view AS
    SELECT DISTINCT ON (d.id) d.*
        FROM (SELECT

            (CASE
                WHEN NULLIF(doc->>'district_external_id', '') IS NOT NULL
                    THEN doc->>'district_external_id'
                ELSE uuid_generate_v4()::TEXT
            END) AS id,
            NULLIF(doc->>'district_external_name', '') AS name,

            CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
            TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
            TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

            date_to_ih_month_year('month', (doc->>'reported_date')::BIGINT)::TEXT AS month,
            date_to_ih_month_year('year', (doc->>'reported_date')::BIGINT)::INTEGER AS year,

            CASE
                WHEN jsonb_typeof((doc->'geolocation')::JSONB) = 'object'
                    AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
                    AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
                THEN doc->'geolocation'
                ELSE NULL
            END::JSONB AS geolocation

        FROM tonoudayo_docs
        WHERE
          doc->>'type' = 'district_hospital'
    ) d;

