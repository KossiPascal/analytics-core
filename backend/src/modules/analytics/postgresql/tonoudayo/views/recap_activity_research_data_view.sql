CREATE MATERIALIZED VIEW IF NOT EXISTS recap_activity_research_data_view AS
    WITH base_data AS (
        SELECT 
            doc, 
            string_to_array(NULLIF(doc->'fields'->'research_visit'->>'research_purpose', ''), ' ') AS purpose_list,
            (doc->'fields'->'visit_start'->>'visit_date')::DATE AS visit_date,
            CAST(doc->>'reported_date' AS BIGINT) AS reported_date,
            NULLIF(doc->'fields'->'research_visit'->>'found_someone', '') AS found_someone
        FROM tonoudayo_docs
        WHERE
            doc->'fields' IS NOT NULL
            AND doc->>'form' = 'recap_activity'
            AND doc->'fields'->'visit_start'->>'visit_type' = 'research';
    )

    SELECT
        (doc->>'_id')::UUID AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'form')::TEXT AS form,

        reported_date AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP(reported_date / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP(reported_date / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

        visit_date,
        date_to_ih_month_year('month', visit_date)::TEXT AS month,
        date_to_ih_month_year('year', visit_date)::INTEGER AS year,

        'tonoudayo' AS source,

        NULLIF(doc->'fields'->>'patient_id', '') AS family_id,
        -- NULLIF(doc->'fields'->>'visited_contact_uuid', '') AS family_id,

        NULLIF(doc->'fields'->'visit_start'->>'visit_type', '') AS visit_type,

        purpose_list @> ARRAY['home_visit'] AS is_home_visit,
        purpose_list @> ARRAY['lost_sight_visit'] AS is_lost_sight_visit,
        purpose_list @> ARRAY['lost_sight_visit_anc'] AS is_lost_sight_visit_anc,
        purpose_list @> ARRAY['lost_sight_visit_pnc'] AS is_lost_sight_visit_pnc,
        purpose_list @> ARRAY['lost_sight_visit_fp'] AS is_lost_sight_visit_fp,

        (CASE WHEN found_someone = 'not_found' THEN TRUE ELSE NULL END)::BOOLEAN AS not_found,

        (CASE WHEN found_someone = 'found_healthy' THEN TRUE ELSE NULL END)::BOOLEAN AS found_healthy,

        CASE
            WHEN jsonb_typeof((doc->'geolocation')::JSONB) = 'object'
                AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
                AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
                THEN doc->'geolocation'
            ELSE NULL
            END::JSONB AS geolocation

    FROM base_data;
