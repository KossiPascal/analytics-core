-- @name: hospital_view
-- @type: matview
-- @depends:
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS hospital_view AS 
    WITH base AS (
        SELECT
            doc,
            (doc->'geolocation')::JSONB AS geolocation,
        
            (doc->'parent'->>'_id')::TEXT AS commune_id,
            (doc->'parent'->'parent'->>'_id')::TEXT AS prefecture_id,
            (doc->'parent'->'parent'->'parent'->>'_id')::TEXT AS region_id,
            (doc->'parent'->'parent'->'parent'->'parent'->>'_id')::TEXT AS country_id,

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
        LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0')::TEXT AS month,
        
        b.commune_id,
        b.prefecture_id,
        b.region_id,
        b.country_id,

        json_build_object('id', c.id, 'name', c.name) AS country, 
        json_build_object('id', r.id, 'name', r.name) AS region, 
        json_build_object('id', p.id, 'name', p.name) AS prefecture, 
        json_build_object('id', cm.id, 'name', cm.name) AS commune  

    FROM base b

        LEFT JOIN commune_view cm ON b.commune_id = cm.id 
        LEFT JOIN prefecture_view p ON b.prefecture_id = p.id 
        LEFT JOIN region_view r ON b.region_id = r.id 
        LEFT JOIN country_view c ON b.country_id = c.id

    WHERE 
        -- (b.doc->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND (b.doc->'parent'->'parent'->'parent'->'parent')::JSONB ? '_id' 
        -- AND 
        (b.doc->>'type' = 'hospital' OR b.doc->>'contact_type' = 'hospital');