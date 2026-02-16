-- @name: referal_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS referal_data_view AS 
    WITH base AS (
        SELECT
            doc,
            (doc->>'_id')::TEXT AS id,
            (doc->>'_rev')::TEXT AS rev,
            (doc->>'form')::TEXT AS form,
            doc->'fields' AS fields,
            doc->'fields'->'inputs' AS inputs,
            doc->'fields'->'patient_infos' AS patient_infos,
            LOWER(doc->'fields'->>'patient_sex') AS patient_sex,
            (doc->'geolocation')::JSONB AS geolocation,
            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts

        FROM kendeya_docs
        WHERE
            doc->>'form' IS NOT NULL
            AND doc->'fields' IS NOT NULL 
            AND doc->>'form' IN ('referral_followup', 'referral_town_hall_followup')
    )
    SELECT
        b.id,
        b.rev,
        b.form,
        
        EXTRACT(YEAR FROM b.reported_ts)::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0')::TEXT AS month,
        
        -- Sex and birth info
        CASE WHEN b.patient_sex IN ('male', 'homme', 'm') THEN 'M'
            WHEN b.patient_sex IN ('female', 'femme', 'f') THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS sex,

        NULLIF(b.fields->>'patient_date_of_birth', '')::DATE AS birth_date,
        NULLIF(b.fields->>'patient_age_in_years', '')::DOUBLE PRECISION AS age_in_years,
        NULLIF(b.fields->>'patient_age_in_months', '')::DOUBLE PRECISION AS age_in_months,
        NULLIF(b.fields->>'patient_age_in_days', '')::DOUBLE PRECISION AS age_in_days,

        parse_json_boolean(b.fields->>'is_present') IS TRUE AS is_present,
        parse_json_boolean(b.fields->>'went_to_health_center') IS TRUE AS went_to_health_center,
        parse_json_boolean(b.fields->>'coupon_available') IS TRUE AS coupon_available,
        parse_json_boolean(b.fields->>'has_no_improvement') IS TRUE AS has_no_improvement,
        parse_json_boolean(b.fields->>'has_getting_worse') IS TRUE AS has_getting_worse,
        parse_json_boolean(b.fields->>'is_referred') IS TRUE AS is_referred,

        NULLIF(b.fields->>'absence_reasons', '') AS absence_reasons,
        NULLIF(b.fields->>'coupon_number', '') AS coupon_number,

        -- FOR TASK / FOLLOWUP
        NULLIF(b.inputs->>'source', '') AS source,
        NULLIF(b.inputs->>'source_id', '') AS source_id,
        NULLIF(b.inputs->>'t_family_id', '') AS t_family_id,
        NULLIF(b.inputs->>'t_family_name', '') AS t_family_name,
        NULLIF(b.inputs->>'t_family_external_id', '') AS t_family_external_id,
        NULLIF(b.inputs->>'t_other_diseases', '') AS t_other_diseases,
        NULLIF(b.inputs->>'t_is_referred', '') AS t_is_referred,

        -- FOR referral_town_hall_followup
        parse_json_boolean(b.patient_infos->>'c_went_town_hall') IS TRUE AS went_town_hall,
        NULLIF(b.patient_infos->>'c_no_went_town_hall', '') AS no_went_town_hall_reason,
        NULLIF(b.patient_infos->>'c_no_went_town_hall_other', '') AS no_went_town_hall_other_reason,
        NULLIF(b.patient_infos->>'c_birth_certificate_status', '') AS certificate_status,
        NULLIF(b.patient_infos->>'c_birth_certificate_status_other', '') AS certificate_status_other,

        -- Location and report info
        NULLIF(b.fields->>'country_id', '') AS country_id,
        NULLIF(b.fields->>'region_id', '') AS region_id,
        NULLIF(b.fields->>'prefecture_id', '') AS prefecture_id,
        NULLIF(b.fields->>'commune_id', '') AS commune_id,
        NULLIF(b.fields->>'hospital_id', '') AS hospital_id,
        NULLIF(b.fields->>'district_quartier_id', '') AS district_quartier_id,
        NULLIF(b.fields->>'village_secteur_id', '') AS village_secteur_id,
        NULLIF(b.fields->>'household_id', '') AS family_id,
        NULLIF(b.fields->>'user_id', '') AS reco_id,
        NULLIF(b.fields->>'patient_id', '') AS patient_id,

        CAST(b.doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
        TO_CHAR(b.reported_ts, 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(b.reported_ts, 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        
        -- Géolocalisation propre
        CASE 
            WHEN jsonb_typeof(b.geolocation) = 'object'
            AND NULLIF(b.geolocation->>'latitude', '') IS NOT NULL
            AND NULLIF(b.geolocation->>'longitude', '') IS NOT NULL
            THEN b.geolocation
            ELSE NULL
        END::JSONB AS geolocation
        
    FROM base b;
