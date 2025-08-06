CREATE MATERIALIZED VIEW IF NOT EXISTS tasks_state_view AS
    SELECT
        (doc->>'_id')::TEXT AS id,
        (substring(doc #>> '{user}', 18))::TEXT AS user,
        (doc->>'authoredOn')::BIGINT AS authored_timestamp,
        to_timestamp((((doc->>'authoredOn')::BIGINT) / 1000)::DOUBLE PRECISION) AS authored_date,

        (doc->'emission'->>'forId')::TEXT AS patient_id,
        (pt.name)::TEXT AS patient_name,
        (pt.external_id)::TEXT AS patient_external_id,
        (pt.code)::TEXT AS patient_code,

        -- NULLIF(pt.family_id, '')::TEXT AS family_id,
        NULLIF(f.id, '')::TEXT AS family_id,
        NULLIF(f.name, '')::TEXT AS family_name,
        NULLIF(f.given_name, '')::TEXT AS family_given_name,
        NULLIF(f.external_id, '')::TEXT AS family_external_id,
        NULLIF(f.code, '')::TEXT AS family_code,

        -- doc->>'requester' AS contact_id,
        (doc->'emission'->>'title')::TEXT AS title,
        (doc->'emission'->>'dueDate')::DATE AS due_date,
        (doc->'emission'->>'startDate')::DATE AS start_date,
        (doc->'emission'->>'endDate')::DATE AS end_date,
        (doc->'emission'->'actions'->0->>'form')::TEXT AS form,
        (doc->'emission'->'actions'->0->>'label')::TEXT AS label,
        (doc->'emission'->'actions'->0->'content'->>'source')::TEXT AS source,
        (doc->'emission'->'actions'->0->'content'->>'source_id')::TEXT AS source_id,

        (doc->>'state')::TEXT AS state,
        (doc->'emission'->>'resolved')::BOOLEAN AS resolved,
        (doc->'stateHistory'->-1->>'state')::TEXT AS last_state,
        (doc->'stateHistory'->-1->>'timestamp')::BIGINT AS last_state_timestamp,

        NULLIF(pt.reco_id, '')::TEXT AS reco_id,
        NULLIF(pt.village_secteur_id, '')::TEXT AS village_secteur_id,
        NULLIF(pt.district_quartier_id, '')::TEXT AS district_quartier_id,
        NULLIF(pt.hospital_id, '')::TEXT AS hospital_id,
        NULLIF(pt.commune_id, '')::TEXT AS commune_id,
        NULLIF(pt.prefecture_id, '')::TEXT AS prefecture_id,
        NULLIF(pt.region_id, '')::TEXT AS region_id,
        NULLIF(pt.country_id, '')::TEXT AS country_id

    FROM couchdb
        LEFT JOIN patient_view pt ON pt.id = (doc->'emission'->>'forId')::TEXT
        LEFT JOIN family_view f ON f.id = pt.family_id

    WHERE 
        (doc->>'type'::TEXT) = 'task'::TEXT AND pt.id IS NOT NULL AND f.id IS NOT NULL