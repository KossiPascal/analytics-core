-- @name: country_view
-- @type: matview
-- @depends:
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS country_view AS
    WITH base AS (
        SELECT
            doc,
            (doc->'geolocation')::JSONB AS geolocation,

            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        FROM kendeya_docs
    )
    SELECT 
        (b.doc->>'_id')::TEXT AS id,
        (b.doc->>'_rev')::TEXT AS rev,
        (b.doc->>'name')::TEXT AS name,
        (b.doc->>'external_id')::TEXT AS external_id,
        (b.doc->>'code')::TEXT AS code,
        
        CASE 
            WHEN jsonb_typeof(b.geolocation) = 'object'
            AND NULLIF(b.geolocation->>'latitude', '') IS NOT NULL
            AND NULLIF(b.geolocation->>'longitude', '') IS NOT NULL
            THEN b.geolocation
            ELSE NULL
        END::JSONB AS geolocation,

        (b.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(b.reported_ts, 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(b.reported_ts, 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM b.reported_ts)::INTEGER  AS year,
        LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0') AS month 

    FROM base b

    WHERE
        b.doc->>'type' = 'country' OR b.doc->>'contact_type' = 'country';