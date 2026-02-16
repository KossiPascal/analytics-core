-- @name: tasks_state_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true

CREATE MATERIALIZED VIEW IF NOT EXISTS tasks_state_view AS
    WITH base AS (
        SELECT
            doc,
            (doc->>'_id')::TEXT AS id,
            (substring(doc #>> '{user}', 18))::TEXT AS user,
            (doc->'emission') AS emission,
            (doc->'emission'->>'forId')::TEXT AS patient_id,
            (doc->'emission'->'actions'->0) AS actions,
            (doc->'stateHistory'->-1) AS stateHistory,
            (doc->>'authoredOn')::BIGINT AS authored_timestamp
        FROM kendeya_docs
        WHERE 
            (doc->>'type'::TEXT) = 'task'::TEXT
    )
    SELECT
        b.id,
        b.user,
        b.authored_timestamp,
        TO_TIMESTAMP((b.authored_timestamp / 1000)::DOUBLE PRECISION) AS authored_date,

        b.patient_id,
        (pt.name)::TEXT AS patient_name,
        (pt.external_id)::TEXT AS patient_external_id,
        (pt.code)::TEXT AS patient_code,

        -- NULLIF(pt.family_id, '')::TEXT AS family_id,
        NULLIF(f.id, '')::TEXT AS family_id,
        NULLIF(f.name, '')::TEXT AS family_name,
        NULLIF(f.given_name, '')::TEXT AS family_given_name,
        NULLIF(f.external_id, '')::TEXT AS family_external_id,
        NULLIF(f.code, '')::TEXT AS family_code,

        -- b.doc->>'requester' AS contact_id,
        (b.emission->>'title')::TEXT AS title,
        (b.emission->>'dueDate')::DATE AS due_date,
        (b.emission->>'startDate')::DATE AS start_date,
        (b.emission->>'endDate')::DATE AS end_date,
        (b.emission->>'resolved')::BOOLEAN AS resolved,

        (b.actions->>'form')::TEXT AS form,
        (b.actions->>'label')::TEXT AS label,
        (b.actions->'content'->>'source')::TEXT AS source,
        (b.actions->'content'->>'source_id')::TEXT AS source_id,

        (b.doc->>'state')::TEXT AS state,
        (b.stateHistory->>'state')::TEXT AS last_state,
        (b.stateHistory->>'timestamp')::BIGINT AS last_state_timestamp,

        NULLIF(pt.reco_id, '')::TEXT AS reco_id,
        NULLIF(pt.village_secteur_id, '')::TEXT AS village_secteur_id,
        NULLIF(pt.district_quartier_id, '')::TEXT AS district_quartier_id,
        NULLIF(pt.hospital_id, '')::TEXT AS hospital_id,
        NULLIF(pt.commune_id, '')::TEXT AS commune_id,
        NULLIF(pt.prefecture_id, '')::TEXT AS prefecture_id,
        NULLIF(pt.region_id, '')::TEXT AS region_id,
        NULLIF(pt.country_id, '')::TEXT AS country_id

    FROM base b
        LEFT JOIN patient_view pt ON b.patient_id = pt.id
        LEFT JOIN family_view f ON f.id = pt.family_id

    WHERE 
        pt.id IS NOT NULL AND f.id IS NOT NULL;