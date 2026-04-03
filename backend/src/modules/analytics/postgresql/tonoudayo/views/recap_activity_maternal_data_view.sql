CREATE MATERIALIZED VIEW IF NOT EXISTS recap_activity_maternal_data_view AS
    WITH base_data AS (
        SELECT 
            doc, 
            string_to_array(NULLIF(doc->'fields'->'visit_reasons_gp'->>'visit_reasons', ''), ' ') AS reasons_list,
            string_to_array(NULLIF(doc->'fields'->'danger_signs_gp'->>'danger_signs', ''), ' ') AS danger_signs,
            (doc->'fields'->'visit_start'->>'visit_date')::DATE AS visit_date,
            CAST(doc->>'reported_date' AS BIGINT) AS reported_date,
        FROM tonoudayo_docs
        WHERE
            doc->'fields' IS NOT NULL
            AND doc->>'form' = 'recap_activity'
            AND doc->'fields'->'visit_start'->>'visit_type' = 'maternal';
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
        NULLIF(doc->'fields'->'visit_start'->>'visit_type', '') AS visit_type,

        'tonoudayo' AS source,

        NULLIF(doc->'fields'->>'patient_id', '') AS patient_id,
        NULLIF(doc->'fields'->>'visited_contact_uuid', '') AS family_id,
        NULLIF(doc->'fields'->>'patient_age_in_years', '')::INTEGER AS patient_age_years,
        NULLIF(doc->'fields'->>'patient_age_in_months', '')::INTEGER AS patient_age_months,
        NULLIF(doc->'fields'->>'patient_age_in_days', '')::INTEGER AS patient_age_days,

        CASE
            WHEN LOWER(NULLIF(doc->'fields'->>'patient_sex', '')) IN ('male', 'homme', 'm') THEN 'M'
            WHEN LOWER(NULLIF(doc->'fields'->>'patient_sex', '')) IN ('female', 'femme', 'f') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,

        CASE 
            WHEN doc->'fields'->'visit_start'->>'nc_oc' = 'nc'
            THEN TRUE
            ELSE NULL
        END::BOOLEAN AS is_new_case,

        CASE 
            WHEN doc->'fields'->'visit_start'->>'nc_oc' = 'oc'
            THEN TRUE
            ELSE NULL
        END::BOOLEAN AS is_old_case,

        COALESCE(NULLIF(doc->'b_drug_movements'->>'pregnancy_test', ''), '0')::DOUBLE PRECISION AS pregnancy_test,
        
        CASE 
            WHEN parse_json_boolean(doc->'fields'->'maternal_fp'->>'pregnant_test') IS TRUE
            THEN 1
            ELSE 0
        END:: pregnant_test,
        
        CASE 
            WHEN doc->'fields'->'maternal_fp'->>'pregnancy_postpartum' = 'pregnant'
            THEN TRUE
            ELSE FALSE
        END:: is_pregnant,
        
        CASE 
            WHEN doc->'fields'->'maternal_fp'->>'pregnancy_postpartum' = 'postpartum'
            THEN TRUE
            ELSE FALSE
        END:: is_postpartum,

        NULLIF(doc->'fields'->'maternal_fp'->>'pregnancy_followup', '') AS cpn; -- cpn0 cpn1 cpn2 cpn3 cpn4 cpn5 cpn6 cpn7 cpn8 
        NULLIF(doc->'fields'->'maternal_fp'->>'postpartum_followup', '') AS cpon; -- cpon1 cpon2 cpon3 cpon4
        NULLIF(doc->'fields'->'maternal_fp'->>'ptme', '') AS ptme,
        
        parse_json_boolean(doc->'fields'->'maternal_fp'->>'referral_followup') AS is_referral_followup,


        parse_json_boolean(doc->'reference'->>'referred') AS is_referred,

        CASE
            WHEN jsonb_typeof((doc->'geolocation')::JSONB) = 'object'
                AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
                AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
                THEN doc->'geolocation'
            ELSE NULL
            END::JSONB AS geolocation

    FROM base_data;
