CREATE MATERIALIZED VIEW IF NOT EXISTS recap_activity_pcime_data_view AS
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
            AND doc->'fields'->'visit_start'->>'visit_type' = 'pcime';
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


        reasons_list @> ARRAY['diarrhea'] AS has_diarrhea,
        reasons_list @> ARRAY['mild_fever'] AS has_mild_fever,
        reasons_list @> ARRAY['malnutrition'] AS has_malnutrition,
        reasons_list @> ARRAY['malaria'] AS has_malaria,
        reasons_list @> ARRAY['pneumonia'] AS has_pneumonia,
        reasons_list @> ARRAY['danger_sign'] AS has_danger_sign,
        reasons_list @> ARRAY['cough_or_cold'] AS has_cough_or_cold,
        reasons_list @> ARRAY['others'] AS has_other_reasons,

        NULLIF(doc->'fields'->'visit_reasons_gp'->>'other_visit_reasons', '') AS other_visit_reasons,

        NULLIF(doc->'fields'->'pcime'->>'consultation_followup', '') AS consultation_followup, --consultation or followup
        NULLIF(doc->'fields'->'pcime'->>'promptitude', '') AS promptitude, -- 24 or 48 or 72 or sup_72
        parse_json_boolean(doc->'fields'->'pcime'->>'drug_given') AS is_drug_given,

        COALESCE(NULLIF(doc->'b_drug_movements'->>'alben_400', ''), '0')::DOUBLE PRECISION AS alben_400,
        COALESCE(NULLIF(doc->'b_drug_movements'->>'para_250', ''), '0')::DOUBLE PRECISION AS para_250,
        COALESCE(NULLIF(doc->'b_drug_movements'->>'para_500', ''), '0')::DOUBLE PRECISION AS para_500,
        COALESCE(NULLIF(doc->'b_drug_movements'->>'amox_250', ''), '0')::DOUBLE PRECISION AS amox_250,
        COALESCE(NULLIF(doc->'b_drug_movements'->>'amox_500', ''), '0')::DOUBLE PRECISION AS amox_500,
        COALESCE(NULLIF(doc->'b_drug_movements'->>'tdr', ''), '0')::DOUBLE PRECISION AS tdr,
        COALESCE(NULLIF(doc->'b_drug_movements'->>'lumartem', ''), '0')::DOUBLE PRECISION AS lumartem,
        COALESCE(NULLIF(doc->'b_drug_movements'->>'sro', ''), '0')::DOUBLE PRECISION AS sro,
        COALESCE(NULLIF(doc->'b_drug_movements'->>'zinc', ''), '0')::DOUBLE PRECISION AS zinc,
        COALESCE(NULLIF(doc->'b_drug_movements'->>'vit_A1', ''), '0')::DOUBLE PRECISION AS vit_A1,
        COALESCE(NULLIF(doc->'b_drug_movements'->>'vit_A2', ''), '0')::DOUBLE PRECISION AS vit_A2,

        danger_signs @> ARRAY['child_cannot_drink'] AS cannot_drink,
        danger_signs @> ARRAY['child_throwup'] AS has_throwup,
        danger_signs @> ARRAY['child_convulsion'] AS has_convulsion,
        danger_signs @> ARRAY['blood_stools'] AS has_blood_stools,
        danger_signs @> ARRAY['child_often_sick'] AS has_often_sick,
        danger_signs @> ARRAY['diarrhea_more_14'] AS has_diarrhea_more_14,
        danger_signs @> ARRAY['urine_cocacola'] AS has_urine_cocacola,
        danger_signs @> ARRAY['child_unconscious'] AS has_unconscious,
        danger_signs @> ARRAY['child_convulsing'] AS has_convulsing,
        danger_signs @> ARRAY['child_anemia'] AS has_anemia,
        danger_signs @> ARRAY['child_difficulty_breathing'] AS has_difficulty_breathing,
        danger_signs @> ARRAY['child_slimming'] AS has_slimming,
        danger_signs @> ARRAY['dehydration'] AS has_dehydration,
        danger_signs @> ARRAY['neck_stiffness'] AS has_neck_stiffness,
        danger_signs @> ARRAY['fontanelle'] AS has_fontanelle,
        danger_signs @> ARRAY['rashes'] AS has_rashes,
        danger_signs @> ARRAY['edema'] AS has_edema,
        danger_signs @> ARRAY['others'] AS has_other_danger_signs,

        NULLIF(doc->'fields'->'danger_signs_gp'->>'other_danger_signs', '') AS other_danger_signs,

        parse_json_boolean(doc->'reference'->>'referred') AS is_referred,

        CASE
            WHEN jsonb_typeof((doc->'geolocation')::JSONB) = 'object'
                AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
                AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
                THEN doc->'geolocation'
            ELSE NULL
            END::JSONB AS geolocation

    FROM base_data;
