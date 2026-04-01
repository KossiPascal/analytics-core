-- @name: pregnant_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS pregnant_data_view AS 
    WITH base AS (
        SELECT
            doc,
            (doc->>'_id')::TEXT AS id,
            (doc->>'_rev')::TEXT AS rev,
            (doc->>'form')::TEXT AS form,
            doc->'fields' AS fields,
            doc->'fields'->'inputs' AS inputs,
            (doc->'geolocation')::JSONB AS geolocation,
            LOWER(doc->'fields'->>'patient_sex') AS patient_sex,
            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts

        FROM kendeya_docs
        
        WHERE
            doc->'fields' IS NOT NULL AND (
                doc->>'form' IN ('prenatal_followup') 
                OR (
                    doc->>'form' IN ('pregnancy_family_planning', 'pregnancy_register') AND 
                    parse_json_boolean(doc->'fields'->>'is_pregnant') IS TRUE
                )
            ) 
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

        CASE WHEN b.form IN ('pregnancy_family_planning', 'pregnancy_register') THEN 'consultation'
            WHEN b.form = 'prenatal_followup' THEN 'followup'
            ELSE NULL
        END AS consultation_followup,

        parse_json_boolean(b.fields->>'is_pregnant') IS TRUE AS is_pregnant,
        parse_json_boolean(b.fields->>'is_cpn_late') IS TRUE AS is_cpn_late,
        parse_json_boolean(b.fields->>'is_pregnant_referred') IS TRUE AS is_pregnant_referred,
        parse_json_boolean(b.fields->>'has_danger_sign') IS TRUE AS has_danger_sign,
        parse_json_boolean(b.fields->>'is_referred') IS TRUE AS is_referred,
        parse_json_boolean(b.fields->>'cpn_done') IS TRUE AS cpn_done,
        parse_json_boolean(b.fields->>'td1_done') IS TRUE AS td1_done,
        parse_json_boolean(b.fields->>'td2_done') IS TRUE AS td2_done,
        parse_json_boolean(b.fields->>'has_milda') IS TRUE AS has_milda,
        parse_json_boolean(b.fields->>'is_home_delivery_wanted') IS TRUE AS is_home_delivery_wanted,
        parse_json_boolean(b.fields->>'is_closed') IS TRUE AS is_closed,
        parse_json_boolean(b.fields->>'is_miscarriage_referred') IS TRUE AS is_miscarriage_referred,

        NULLIF(b.fields->>'next_cpn_visit_date', '')::DATE AS next_cpn_visit_date,
        NULLIF(b.fields->>'date_cpn1', '')::DATE AS date_cpn1,
        NULLIF(b.fields->>'date_cpn2', '')::DATE AS date_cpn2,
        NULLIF(b.fields->>'date_cpn3', '')::DATE AS date_cpn3,
        NULLIF(b.fields->>'date_cpn4', '')::DATE AS date_cpn4,
        NULLIF(b.fields->>'next_cpn_date', '')::DATE AS next_cpn_date,

        NULLIF(b.fields->>'delivery_place_wanted', '') AS delivery_place_wanted,
        NULLIF(b.fields->>'close_reason', '') AS close_reason,
        NULLIF(b.fields->>'close_reason_name', '') AS close_reason_name,

        NULLIF(TRIM(b.fields->>'cpn_number'), '')::BIGINT AS cpn_number,
        NULLIF(TRIM(b.fields->>'cpn_next_number'), '')::BIGINT AS cpn_next_number,
        NULLIF(TRIM(b.fields->>'cpn_already_count'), '')::BIGINT AS cpn_already_count,

        -- FOR TASK / FOLLOWUP
        NULLIF(b.inputs->>'source', '') AS source,
        NULLIF(b.inputs->>'source_id', '') AS source_id,
        NULLIF(b.inputs->>'t_cpn_next_number', '') AS t_cpn_next_number,
        NULLIF(b.inputs->>'t_date_cpn1', '') AS t_date_cpn1,
        NULLIF(b.inputs->>'t_date_cpn2', '') AS t_date_cpn2,
        NULLIF(b.inputs->>'t_date_cpn3', '') AS t_date_cpn3,
        NULLIF(b.inputs->>'t_date_cpn4', '') AS t_date_cpn4,
        NULLIF(b.inputs->>'t_td1', '') AS t_td1,
        NULLIF(b.inputs->>'t_td2', '') AS t_td2,
        NULLIF(b.inputs->>'t_milda', '') AS t_milda,
        NULLIF(b.inputs->>'t_next_cpn_date', '') AS t_next_cpn_date,
        NULLIF(b.inputs->>'t_cpn_done', '') AS t_cpn_done,
        NULLIF(b.inputs->>'t_was_cpn_referred', '') AS t_was_cpn_referred,
        NULLIF(b.inputs->>'t_family_id', '') AS t_family_id,
        NULLIF(b.inputs->>'t_family_name', '') AS t_family_name,
        NULLIF(b.inputs->>'t_family_external_id', '') AS t_family_external_id,

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