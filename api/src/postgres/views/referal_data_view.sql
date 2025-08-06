CREATE MATERIALIZED VIEW IF NOT EXISTS referal_data_view AS 
    SELECT
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'form')::TEXT AS form,
        
        EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(doc->>'reported_date' AS BIGINT) / 1000))::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')::TEXT AS month,
        
        -- Sex and birth info
        CASE WHEN LOWER(doc->'fields'->>'patient_sex') IN ('male', 'homme', 'm') THEN 'M'
            WHEN LOWER(doc->'fields'->>'patient_sex') IN ('female', 'femme', 'f') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,
        NULLIF(doc->'fields'->>'patient_date_of_birth', '')::DATE AS birth_date,
        NULLIF(doc->'fields'->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
        NULLIF(doc->'fields'->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
        NULLIF(doc->'fields'->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,

        parse_json_boolean(doc->'fields'->>'is_present') IS TRUE AS is_present,
        parse_json_boolean(doc->'fields'->>'went_to_health_center') IS TRUE AS went_to_health_center,
        parse_json_boolean(doc->'fields'->>'coupon_available') IS TRUE AS coupon_available,
        parse_json_boolean(doc->'fields'->>'has_no_improvement') IS TRUE AS has_no_improvement,
        parse_json_boolean(doc->'fields'->>'has_getting_worse') IS TRUE AS has_getting_worse,
        parse_json_boolean(doc->'fields'->>'is_referred') IS TRUE AS is_referred,

        NULLIF(doc->'fields'->>'absence_reasons', '') AS absence_reasons,
        NULLIF(doc->'fields'->>'coupon_number', '') AS coupon_number,

        -- FOR TASK / FOLLOWUP
        NULLIF(doc->'fields'->'inputs'->>'source', '') AS source,
        NULLIF(doc->'fields'->'inputs'->>'source_id', '') AS source_id,
        NULLIF(doc->'fields'->'inputs'->>'t_family_id', '') AS t_family_id,
        NULLIF(doc->'fields'->'inputs'->>'t_family_name', '') AS t_family_name,
        NULLIF(doc->'fields'->'inputs'->>'t_family_external_id', '') AS t_family_external_id,
        NULLIF(doc->'fields'->'inputs'->>'t_other_diseases', '') AS t_other_diseases,
        NULLIF(doc->'fields'->'inputs'->>'t_is_referred', '') AS t_is_referred,

        -- FOR referral_town_hall_followup
        parse_json_boolean(doc->'fields'->'patient_infos'->>'c_went_town_hall') IS TRUE AS went_town_hall,
        NULLIF(doc->'fields'->'patient_infos'->>'c_no_went_town_hall', '') AS no_went_town_hall_reason,
        NULLIF(doc->'fields'->'patient_infos'->>'c_no_went_town_hall_other', '') AS no_went_town_hall_other_reason,
        NULLIF(doc->'fields'->'patient_infos'->>'c_birth_certificate_status', '') AS certificate_status,
        NULLIF(doc->'fields'->'patient_infos'->>'c_birth_certificate_status_other', '') AS certificate_status_other,

        -- Location and report info
        NULLIF(doc->'fields'->>'country_id', '') AS country_id,
        NULLIF(doc->'fields'->>'region_id', '') AS region_id,
        NULLIF(doc->'fields'->>'prefecture_id', '') AS prefecture_id,
        NULLIF(doc->'fields'->>'commune_id', '') AS commune_id,
        NULLIF(doc->'fields'->>'hospital_id', '') AS hospital_id,
        NULLIF(doc->'fields'->>'district_quartier_id', '') AS district_quartier_id,
        NULLIF(doc->'fields'->>'village_secteur_id', '') AS village_secteur_id,
        NULLIF(doc->'fields'->>'household_id', '') AS family_id,
        NULLIF(doc->'fields'->>'user_id', '') AS reco_id,
        NULLIF(doc->'fields'->>'patient_id', '') AS patient_id,

        CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        
        -- Géolocalisation propre
        CASE 
            WHEN jsonb_typeof(doc->'geolocation') = 'object'
            AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
            AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
            THEN doc->'geolocation'
            ELSE NULL
        END::JSONB AS geolocation
        
    FROM 
        couchdb
    WHERE
        doc->>'form' IS NOT NULL
        AND doc->'fields' IS NOT NULL 
        AND doc->>'form' IN ('referral_followup', 'referral_town_hall_followup');  
