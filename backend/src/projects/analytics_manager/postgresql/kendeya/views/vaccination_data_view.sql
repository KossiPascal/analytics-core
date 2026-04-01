-- @name: vaccination_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS vaccination_data_view AS 
    WITH pre_base AS (
        SELECT
            doc,
            doc->'fields' AS fields,
            (doc->'geolocation')::JSONB AS geolocation,

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

            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
            
        FROM kendeya_docs
        
        WHERE doc->>'form' = 'vaccination_followup' AND doc->'fields' IS NOT NULL
    ),
    base AS (
        SELECT
            COALESCE((a.fields)::JSONB, '{}'::JSONB) AS fields,
            (a.doc->>'_id')::TEXT AS id,
            (a.doc->>'_rev')::TEXT AS rev,
            (a.doc->>'form')::TEXT AS form,

            -- Sex and birth info
            CASE 
                WHEN a.fields->>'patient_sex' ILIKE ANY (ARRAY['male', 'homme', 'm']) THEN 'M'
                WHEN a.fields->>'patient_sex' ILIKE ANY (ARRAY['female', 'femme', 'f']) THEN 'F'
                ELSE NULL
            END AS sex,

            -- Âge calculé (priorité à date de naissance)
            CASE 
                WHEN get_value_or_default(a.fields->>'patient_date_of_birth') IS NOT NULL 
                THEN AGE(CURRENT_DATE, (a.fields->>'patient_date_of_birth')::DATE)
                ELSE NULL
            END AS currect_age,

            parse_json_decimal(a.fields->>'patient_age_in_years') AS age_in_years,
            parse_json_decimal(a.fields->>'patient_age_in_months') AS age_in_months,
            parse_json_decimal(a.fields->>'patient_age_in_days') AS age_in_days,


            -- Vaccins (individuels)
            parse_json_boolean(a.fields->>'vaccine_BCG') IS TRUE AS vaccine_BCG,
            parse_json_boolean(a.fields->>'vaccine_VPO_0') IS TRUE AS vaccine_VPO_0,
            parse_json_boolean(a.fields->>'vaccine_PENTA_1') IS TRUE AS vaccine_PENTA_1,
            parse_json_boolean(a.fields->>'vaccine_VPO_1') IS TRUE AS vaccine_VPO_1,
            parse_json_boolean(a.fields->>'vaccine_PENTA_2') IS TRUE AS vaccine_PENTA_2,
            parse_json_boolean(a.fields->>'vaccine_VPO_2') IS TRUE AS vaccine_VPO_2,
            parse_json_boolean(a.fields->>'vaccine_PENTA_3') IS TRUE AS vaccine_PENTA_3,
            parse_json_boolean(a.fields->>'vaccine_VPO_3') IS TRUE AS vaccine_VPO_3,
            parse_json_boolean(a.fields->>'vaccine_VPI_1') IS TRUE AS vaccine_VPI_1,
            parse_json_boolean(a.fields->>'vaccine_VAR_1') IS TRUE AS vaccine_VAR_1,
            parse_json_boolean(a.fields->>'vaccine_VAA') IS TRUE AS vaccine_VAA,
            parse_json_boolean(a.fields->>'vaccine_VPI_2') IS TRUE AS vaccine_VPI_2,
            parse_json_boolean(a.fields->>'vaccine_MEN_A') IS TRUE AS vaccine_MEN_A,
            parse_json_boolean(a.fields->>'vaccine_VAR_2') IS TRUE AS vaccine_VAR_2,

            -- Vaccins regroupés
            
            (
                -- parse_json_boolean(a.fields->>'is_birth_vaccine_ok') IS TRUE OR 
                parse_json_decimal(a.fields->>'patient_age_in_days') >= 0
                AND parse_json_boolean(a.fields->>'vaccine_BCG') IS TRUE 
                AND parse_json_boolean(a.fields->>'vaccine_VPO_0') IS TRUE 
            ) AS is_birth_vaccine_ok,
            
            (
                -- parse_json_boolean(a.fields->>'is_six_weeks_vaccine_ok') IS TRUE OR 
                parse_json_decimal(a.fields->>'patient_age_in_days') < 42
                OR (
                    parse_json_decimal(a.fields->>'patient_age_in_days') >= 42
                    AND parse_json_boolean(a.fields->>'vaccine_PENTA_1') IS TRUE
                    AND parse_json_boolean(a.fields->>'vaccine_VPO_1') IS TRUE
                )
            ) AS is_six_weeks_vaccine_ok,
            
            (
                -- parse_json_boolean(a.fields->>'is_ten_weeks_vaccine_ok') IS TRUE OR 
                parse_json_decimal(a.fields->>'patient_age_in_days') < 70
                OR (
                    parse_json_decimal(a.fields->>'patient_age_in_days') >= 70
                    AND parse_json_boolean(a.fields->>'vaccine_PENTA_2') IS TRUE
                    AND parse_json_boolean(a.fields->>'vaccine_VPO_2') IS TRUE
                )
            ) AS is_ten_weeks_vaccine_ok,
            
            (
                -- parse_json_boolean(a.fields->>'is_forteen_weeks_vaccine_ok') IS TRUE OR 
                parse_json_decimal(a.fields->>'patient_age_in_days') < 98
                OR (
                    parse_json_decimal(a.fields->>'patient_age_in_days') >= 98
                    AND parse_json_boolean(a.fields->>'vaccine_PENTA_3') IS TRUE
                    AND parse_json_boolean(a.fields->>'vaccine_VPO_3') IS TRUE
                    AND parse_json_boolean(a.fields->>'vaccine_VPI_1') IS TRUE
                )
            ) AS is_forteen_weeks_vaccine_ok,
            
            (
                -- parse_json_boolean(a.fields->>'is_nine_months_vaccine_ok') IS TRUE OR 
                parse_json_decimal(a.fields->>'patient_age_in_months') < 9
                OR (
                    parse_json_decimal(a.fields->>'patient_age_in_months') >= 9
                    AND parse_json_boolean(a.fields->>'vaccine_VAR_1') IS TRUE
                    AND parse_json_boolean(a.fields->>'vaccine_VAA') IS TRUE
                    AND parse_json_boolean(a.fields->>'vaccine_VPI_2') IS TRUE
                )
            ) AS is_nine_months_vaccine_ok,
            
            (
                -- parse_json_boolean(a.fields->>'is_fifty_months_vaccine_ok') IS TRUE OR 
                parse_json_decimal(a.fields->>'patient_age_in_months') < 15
                OR (
                    parse_json_decimal(a.fields->>'patient_age_in_months') >= 15
                    AND parse_json_boolean(a.fields->>'vaccine_MEN_A') IS TRUE
                    AND parse_json_boolean(a.fields->>'vaccine_VAR_2') IS TRUE
                )
            ) AS is_fifty_months_vaccine_ok,

            
            parse_json_boolean(a.fields->>'is_vaccine_referal') IS TRUE AS is_vaccine_referal,


            -- Statut global
            (
                parse_json_boolean(a.fields->>'vaccine_BCG') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_VPO_0') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_PENTA_1') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_VPO_1') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_PENTA_2') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_VPO_2') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_PENTA_3') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_VPO_3') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_VPI_1') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_VAR_1') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_VAA') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_VPI_2') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_MEN_A') IS TRUE AND
                parse_json_boolean(a.fields->>'vaccine_VAR_2') IS TRUE
            ) AS has_all_vaccine_done,

            -- Raisons de non-vaccination
            no_vaccine_reason(a.fields->>'no_BCG_reason', a.fields->>'no_BCG_other_reason') AS no_BCG_reason,
            no_vaccine_reason(a.fields->>'no_VPO_0_reason', a.fields->>'no_VPO_0_other_reason') AS no_VPO_0_reason,
            no_vaccine_reason(a.fields->>'no_PENTA_1_reason', a.fields->>'no_PENTA_1_other_reason') AS no_PENTA_1_reason,
            no_vaccine_reason(a.fields->>'no_VPO_1_reason', a.fields->>'no_VPO_1_other_reason') AS no_VPO_1_reason,
            no_vaccine_reason(a.fields->>'no_PENTA_2_reason', a.fields->>'no_PENTA_2_other_reason') AS no_PENTA_2_reason,
            no_vaccine_reason(a.fields->>'no_VPO_2_reason', a.fields->>'no_VPO_2_other_reason') AS no_VPO_2_reason,
            no_vaccine_reason(a.fields->>'no_PENTA_3_reason', a.fields->>'no_PENTA_3_other_reason') AS no_PENTA_3_reason,
            no_vaccine_reason(a.fields->>'no_VPO_3_reason', a.fields->>'no_VPO_3_other_reason') AS no_VPO_3_reason,
            no_vaccine_reason(a.fields->>'no_VPI_1_reason', a.fields->>'no_VPI_1_other_reason') AS no_VPI_1_reason,
            no_vaccine_reason(a.fields->>'no_VAR_1_reason', a.fields->>'no_VAR_1_other_reason') AS no_VAR_1_reason,
            no_vaccine_reason(a.fields->>'no_VAA_reason', a.fields->>'no_VAA_other_reason') AS no_VAA_reason,
            no_vaccine_reason(a.fields->>'no_VPI_2_reason', a.fields->>'no_VPI_2_other_reason') AS no_VPI_2_reason,
            no_vaccine_reason(a.fields->>'no_MEN_A_reason', a.fields->>'no_MEN_A_other_reason') AS no_MEN_A_reason,
            no_vaccine_reason(a.fields->>'no_VAR_2_reason', a.fields->>'no_VAR_2_other_reason') AS no_VAR_2_reason,

            -- Géographie
            a.country_id,
            a.region_id,
            a.prefecture_id,
            a.commune_id,
            a.hospital_id,
            a.district_quartier_id,
            a.village_secteur_id,
            a.family_id,
            a.reco_id,
            a.patient_id,

            -- Géolocalisation propre
            CASE 
                WHEN jsonb_typeof(a.geolocation) = 'object'
                    AND NULLIF(a.geolocation->>'latitude', '') IS NOT NULL
                    AND NULLIF(a.geolocation->>'longitude', '') IS NOT NULL
                THEN a.geolocation
                ELSE NULL
            END::JSONB  AS geolocation,

            f.name AS family_fullname,
            f.given_name AS family_name,
            f.external_id AS family_code,
            p.name AS child_name,
            p.external_id AS child_code,
            p.sex AS child_sex,
            p.phone AS child_phone,
            -- NULLIF(a.fields->>'patient_date_of_birth', '') AS birth_date,
            p.birth_date,
            p.death_date,

            NULLIF(a.doc->>'reported_date','') AS reported_timestamp,
            TO_CHAR(a.reported_ts, 'YYYY-MM-DD') AS reported_date,
            TO_CHAR(a.reported_ts, 'YYYY-MM-DD HH24:MI:SS') AS reported_date_time

        FROM pre_base a
        LEFT JOIN family_view f ON a.family_id = f.id::TEXT
        LEFT JOIN patient_view p ON a.patient_id = p.id::TEXT
    )

    SELECT
        -- Identifiants de base
        id,
        rev,
        form,

        family_fullname, 
        family_name,
        family_code, 
        
        child_name, 
        child_code, 
        child_sex, 
        child_phone, 
        -- Date de naissance
        birth_date,
        death_date,
        sex,
        currect_age,

        -- Date
        EXTRACT(YEAR FROM reported_date::DATE)::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM reported_date::DATE)::TEXT, 2, '0')::TEXT AS month,

        age_in_years,
        age_in_months,
        age_in_days,
        vaccine_BCG,
        vaccine_VPO_0,
        vaccine_PENTA_1,
        vaccine_VPO_1,
        vaccine_PENTA_2,
        vaccine_VPO_2,
        vaccine_PENTA_3,
        vaccine_VPO_3,
        vaccine_VPI_1,
        vaccine_VAR_1,
        vaccine_VAA,
        vaccine_VPI_2,
        vaccine_MEN_A,
        vaccine_VAR_2,

        get_value_or_default(fields->>'vaccine_BCG_date', reported_date::TEXT) AS vaccine_BCG_date,
        get_value_or_default(fields->>'vaccine_VPO_0_date', reported_date::TEXT) AS vaccine_VPO_0_date,
        get_value_or_default(fields->>'vaccine_PENTA_1_date', reported_date::TEXT) AS vaccine_PENTA_1_date,
        get_value_or_default(fields->>'vaccine_VPO_1_date', reported_date::TEXT) AS vaccine_VPO_1_date,
        get_value_or_default(fields->>'vaccine_PENTA_2_date', reported_date::TEXT) AS vaccine_PENTA_2_date,
        get_value_or_default(fields->>'vaccine_VPO_2_date', reported_date::TEXT) AS vaccine_VPO_2_date,
        get_value_or_default(fields->>'vaccine_PENTA_3_date', reported_date::TEXT) AS vaccine_PENTA_3_date,
        get_value_or_default(fields->>'vaccine_VPO_3_date', reported_date::TEXT) AS vaccine_VPO_3_date,
        get_value_or_default(fields->>'vaccine_VPI_1_date', reported_date::TEXT) AS vaccine_VPI_1_date,
        get_value_or_default(fields->>'vaccine_VAR_1_date', reported_date::TEXT) AS vaccine_VAR_1_date,
        get_value_or_default(fields->>'vaccine_VAA_date', reported_date::TEXT) AS vaccine_VAA_date,
        get_value_or_default(fields->>'vaccine_VPI_2_date', reported_date::TEXT) AS vaccine_VPI_2_date,
        get_value_or_default(fields->>'vaccine_MEN_A_date', reported_date::TEXT) AS vaccine_MEN_A_date,
        get_value_or_default(fields->>'vaccine_VAR_2_date', reported_date::TEXT) AS vaccine_VAR_2_date,

        is_birth_vaccine_ok,
        is_six_weeks_vaccine_ok,
        is_ten_weeks_vaccine_ok,
        is_forteen_weeks_vaccine_ok,
        is_nine_months_vaccine_ok,
        is_fifty_months_vaccine_ok,
        
        is_vaccine_referal,
        has_all_vaccine_done,

        no_BCG_reason,
        no_VPO_0_reason,
        no_PENTA_1_reason,
        no_VPO_1_reason,
        no_PENTA_2_reason,
        no_VPO_2_reason,
        no_PENTA_3_reason,
        no_VPO_3_reason,
        no_VPI_1_reason,
        no_VAR_1_reason,
        no_VAA_reason,
        no_VPI_2_reason,
        no_MEN_A_reason,
        no_VAR_2_reason,
        
        country_id,
        region_id,
        prefecture_id,
        commune_id,
        hospital_id,
        district_quartier_id,
        village_secteur_id,
        family_id,
        reco_id,
        patient_id,

        reported_timestamp::BIGINT AS reported_date_timestamp,
        reported_date::DATE AS reported_date,
        reported_date_time::TIMESTAMP ASreported_full_date,
        
        geolocation

    FROM base;  
