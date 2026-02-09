CREATE MATERIALIZED VIEW IF NOT EXISTS prefecture_manager_view AS 
    SELECT 
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'name')::TEXT AS name,
        (doc->>'external_id')::TEXT AS external_id,
        (doc->>'code')::TEXT AS code,

        CASE 
            WHEN jsonb_typeof(doc->'geolocation') = 'object'
            AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
            AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
            THEN doc->'geolocation'
            ELSE NULL
        END::JSONB AS geolocation,

        (doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        EXTRACT(YEAR FROM TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000))::INTEGER AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
        (doc->>'role')::TEXT AS role,
        
        CASE WHEN doc->>'date_of_birth' IS NOT NULL AND doc->>'date_of_birth' <> '' THEN
                doc->>'date_of_birth'
            ELSE NULL
        END::DATE AS birth_date,

        (doc->>'phone')::TEXT AS phone,
        (doc->>'phone_other')::TEXT AS phone_other,
        (doc->>'email')::TEXT AS email,
        (doc->>'profession')::TEXT AS profession,

        CASE WHEN doc->>'sex' IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
            WHEN doc->>'sex' IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,

        (doc->'parent'->>'_id')::TEXT AS prefecture_id,
        (doc->'parent'->'parent'->>'_id')::TEXT AS region_id,
        (doc->'parent'->'parent'->'parent'->>'_id')::TEXT AS country_id,

        json_build_object('id', c.id, 'name', c.name) AS country, 
        json_build_object('id', r.id, 'name', r.name) AS region, 
        json_build_object('id', p.id, 'name', p.name) AS prefecture  

    FROM couchdb 
        LEFT JOIN prefecture_view p ON (doc->'parent'->>'_id')::TEXT = p.id 
        LEFT JOIN region_view r ON (doc->'parent'->'parent'->>'_id')::TEXT = r.id 
        LEFT JOIN country_view c ON (doc->'parent'->'parent'->'parent'->>'_id')::TEXT = c.id 

    WHERE doc->'parent' ? '_id' 
        AND doc->'parent'->'parent' ? '_id' 
        AND doc->'parent'->'parent'->'parent' ? '_id' 
        AND doc->>'type' = 'person' 
        AND doc->>'role' = 'prefecture_manager';