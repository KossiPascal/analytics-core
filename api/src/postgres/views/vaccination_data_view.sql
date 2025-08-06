CREATE MATERIALIZED VIEW IF NOT EXISTS vaccination_data_view AS 
    SELECT
        -- Identifiants de base
        (a.doc->>'_id')::TEXT AS id,
        (a.doc->>'_rev')::TEXT AS rev,
        (a.doc->>'form')::TEXT AS form,

        -- Date
        EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::BIGINT AS year,
        LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')::TEXT AS month,
        
        -- Sex and birth info
         CASE 
            WHEN a.doc->'fields'->>'patient_sex' ILIKE ANY (ARRAY['male', 'homme', 'm']) THEN 'M'
            WHEN a.doc->'fields'->>'patient_sex' ILIKE ANY (ARRAY['female', 'femme', 'f']) THEN 'F'
            ELSE NULL
        END AS sex,

        -- Âge calculé (priorité à date de naissance)
        CASE 
            WHEN NULLIF(a.doc->'fields'->>'patient_date_of_birth', '') IS NOT NULL 
            THEN AGE(CURRENT_DATE, (a.doc->'fields'->>'patient_date_of_birth')::DATE)
            ELSE NULL
        END AS currect_age,

        parse_json_decimal(a.doc->'fields'->>'patient_age_in_years') AS age_in_years,
        parse_json_decimal(a.doc->'fields'->>'patient_age_in_months') AS age_in_months,
        parse_json_decimal(a.doc->'fields'->>'patient_age_in_days') AS age_in_days,


        -- Vaccins (individuels)
        parse_json_boolean(a.doc->'fields'->>'vaccine_BCG') IS TRUE AS vaccine_BCG,
        parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_0') IS TRUE AS vaccine_VPO_0,
        parse_json_boolean(a.doc->'fields'->>'vaccine_PENTA_1') IS TRUE AS vaccine_PENTA_1,
        parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_1') IS TRUE AS vaccine_VPO_1,
        parse_json_boolean(a.doc->'fields'->>'vaccine_PENTA_2') IS TRUE AS vaccine_PENTA_2,
        parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_2') IS TRUE AS vaccine_VPO_2,
        parse_json_boolean(a.doc->'fields'->>'vaccine_PENTA_3') IS TRUE AS vaccine_PENTA_3,
        parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_3') IS TRUE AS vaccine_VPO_3,
        parse_json_boolean(a.doc->'fields'->>'vaccine_VPI_1') IS TRUE AS vaccine_VPI_1,
        parse_json_boolean(a.doc->'fields'->>'vaccine_VAR_1') IS TRUE AS vaccine_VAR_1,
        parse_json_boolean(a.doc->'fields'->>'vaccine_VAA') IS TRUE AS vaccine_VAA,
        parse_json_boolean(a.doc->'fields'->>'vaccine_VPI_2') IS TRUE AS vaccine_VPI_2,
        parse_json_boolean(a.doc->'fields'->>'vaccine_MEN_A') IS TRUE AS vaccine_MEN_A,
        parse_json_boolean(a.doc->'fields'->>'vaccine_VAR_2') IS TRUE AS vaccine_VAR_2,

        -- Vaccins regroupés
        
        (
            -- parse_json_boolean(a.doc->'fields'->>'is_birth_vaccine_ok') IS TRUE OR 
            parse_json_decimal(a.doc->'fields'->>'patient_age_in_days') >= 0
            AND parse_json_boolean(a.doc->'fields'->>'vaccine_BCG') IS TRUE 
            AND parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_0') IS TRUE 
        ) AS is_birth_vaccine_ok,
        
        (
            -- parse_json_boolean(a.doc->'fields'->>'is_six_weeks_vaccine_ok') IS TRUE OR 
            parse_json_decimal(a.doc->'fields'->>'patient_age_in_days') < 42
            OR (
                parse_json_decimal(a.doc->'fields'->>'patient_age_in_days') >= 42
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_PENTA_1') IS TRUE
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_1') IS TRUE
            )
        ) AS is_six_weeks_vaccine_ok,
        
        (
            -- parse_json_boolean(a.doc->'fields'->>'is_ten_weeks_vaccine_ok') IS TRUE OR 
            parse_json_decimal(a.doc->'fields'->>'patient_age_in_days') < 70
            OR (
                parse_json_decimal(a.doc->'fields'->>'patient_age_in_days') >= 70
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_PENTA_2') IS TRUE
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_2') IS TRUE
            )
        ) AS is_ten_weeks_vaccine_ok,
        
        (
            -- parse_json_boolean(a.doc->'fields'->>'is_forteen_weeks_vaccine_ok') IS TRUE OR 
            parse_json_decimal(a.doc->'fields'->>'patient_age_in_days') < 98
            OR (
                parse_json_decimal(a.doc->'fields'->>'patient_age_in_days') >= 98
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_PENTA_3') IS TRUE
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_3') IS TRUE
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_VPI_1') IS TRUE
            )
        ) AS is_forteen_weeks_vaccine_ok,
        
        (
            -- parse_json_boolean(a.doc->'fields'->>'is_nine_months_vaccine_ok') IS TRUE OR 
            parse_json_decimal(a.doc->'fields'->>'patient_age_in_months') < 9
            OR (
                parse_json_decimal(a.doc->'fields'->>'patient_age_in_months') >= 9
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_VAR_1') IS TRUE
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_VAA') IS TRUE
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_VPI_2') IS TRUE
            )
        ) AS is_nine_months_vaccine_ok,
        
        (
            -- parse_json_boolean(a.doc->'fields'->>'is_fifty_months_vaccine_ok') IS TRUE OR 
            parse_json_decimal(a.doc->'fields'->>'patient_age_in_months') < 15
            OR (
                parse_json_decimal(a.doc->'fields'->>'patient_age_in_months') >= 15
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_MEN_A') IS TRUE
                AND parse_json_boolean(a.doc->'fields'->>'vaccine_VAR_2') IS TRUE
            )
        ) AS is_fifty_months_vaccine_ok,
        
        
        parse_json_boolean(a.doc->'fields'->>'is_vaccine_referal') IS TRUE AS is_vaccine_referal,


        -- Statut global
        (
            -- parse_json_boolean(a.doc->'fields'->>'has_all_vaccine_done') IS TRUE OR (
                parse_json_boolean(a.doc->'fields'->>'vaccine_BCG') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_0') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_PENTA_1') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_1') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_PENTA_2') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_2') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_PENTA_3') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_VPO_3') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_VPI_1') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_VAR_1') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_VAA') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_VPI_2') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_MEN_A') IS TRUE AND
                parse_json_boolean(a.doc->'fields'->>'vaccine_VAR_2') IS TRUE
            -- ) OR (
            --     parse_json_boolean(a.doc->'fields'->>'is_birth_vaccine_ok') IS TRUE AND
            --     parse_json_boolean(a.doc->'fields'->>'is_six_weeks_vaccine_ok') IS TRUE AND
            --     parse_json_boolean(a.doc->'fields'->>'is_ten_weeks_vaccine_ok') IS TRUE AND
            --     parse_json_boolean(a.doc->'fields'->>'is_forteen_weeks_vaccine_ok') IS TRUE AND
            --     parse_json_boolean(a.doc->'fields'->>'is_nine_months_vaccine_ok') IS TRUE AND
            --     parse_json_boolean(a.doc->'fields'->>'is_fifty_months_vaccine_ok') IS TRUE
            -- )
        ) AS has_all_vaccine_done,

        -- Raisons de non-vaccination
        no_vaccine_reason(a.doc->'fields'->>'no_BCG_reason') AS no_BCG_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_VPO_0_reason') AS no_VPO_0_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_PENTA_1_reason') AS no_PENTA_1_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_VPO_1_reason') AS no_VPO_1_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_PENTA_2_reason') AS no_PENTA_2_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_VPO_2_reason') AS no_VPO_2_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_PENTA_3_reason') AS no_PENTA_3_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_VPO_3_reason') AS no_VPO_3_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_VPI_1_reason') AS no_VPI_1_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_VAR_1_reason') AS no_VAR_1_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_VAA_reason') AS no_VAA_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_VPI_2_reason') AS no_VPI_2_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_MEN_A_reason') AS no_MEN_A_reason,
        no_vaccine_reason(a.doc->'fields'->>'no_VAR_2_reason') AS no_VAR_2_reason,

        -- Géographie
        NULLIF(a.doc->'fields'->>'country_id', '') AS country_id,
        NULLIF(a.doc->'fields'->>'region_id', '') AS region_id,
        NULLIF(a.doc->'fields'->>'prefecture_id', '') AS prefecture_id,
        NULLIF(a.doc->'fields'->>'commune_id', '') AS commune_id,
        NULLIF(a.doc->'fields'->>'hospital_id', '') AS hospital_id,
        NULLIF(a.doc->'fields'->>'district_quartier_id', '') AS district_quartier_id,
        NULLIF(a.doc->'fields'->>'village_secteur_id', '') AS village_secteur_id,
        NULLIF(a.doc->'fields'->>'household_id', '') AS family_id,
        NULLIF(a.doc->'fields'->>'user_id', '') AS reco_id,
        NULLIF(a.doc->'fields'->>'patient_id', '') AS patient_id,

        -- Date formatée
        (a.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((a.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((a.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
        
        -- Géolocalisation propre
        CASE 
            WHEN jsonb_typeof(a.doc->'geolocation') = 'object'
                AND COALESCE(NULLIF(a.doc->'geolocation'->>'latitude', ''), NULL) IS NOT NULL
                AND COALESCE(NULLIF(a.doc->'geolocation'->>'longitude', ''), NULL) IS NOT NULL
            THEN a.doc->'geolocation'
            ELSE NULL
        END::JSONB  AS geolocation,

        f.name AS family_fullname, 
        f.given_name AS family_name,
        f.external_id AS family_code, 
        
        p.name AS child_name, 
        p.external_id AS child_code, 
        p.sex AS child_sex, 
        p.phone AS child_phone, 
        -- Date de naissance
        -- NULLIF(a.doc->'fields'->>'patient_date_of_birth', '') AS birth_date,
        p.birth_date,
        p.death_date

    FROM couchdb a
        LEFT JOIN family_view f ON a.doc->'fields'->>'household_id' = f.id::TEXT
        LEFT JOIN patient_view p ON a.doc->'fields'->>'patient_id' = p.id::TEXT
        
    WHERE
        a.doc->>'form' = 'vaccination_followup'
        AND a.doc->'fields' IS NOT NULL;     
