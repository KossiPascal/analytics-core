CREATE MATERIALIZED VIEW IF NOT EXISTS reco_meg_data_view AS 
    SELECT
        (doc->>'_id')::TEXT AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'form')::TEXT AS form,
        
        CASE WHEN doc->>'form' = 'stock_entry' THEN 'stock' 
            WHEN doc->>'form' = 'stock_movement' THEN doc->'fields'->'meg_movement'->>'meg_movement_reason' 
            WHEN doc->>'form' = 'drugs_management' THEN doc->'fields'->'meg_management'->>'meg_management_reason' 
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                THEN 'consumption' 
            ELSE NULL 
        END::TEXT AS meg_type,

        CASE 
            WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                THEN COALESCE(
                    parse_json_decimal(doc->'fields'->'meg_quantity'->>'pill_coc'),
                    parse_json_decimal(doc->'fields'->'meg_quantity'->>'pilule_coc')
                )
            WHEN doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                AND parse_json_boolean(doc->'fields'->>'method_was_given') IS TRUE 
                AND doc->'fields'->>'fp_method' = 'pill_coc'
                    THEN parse_json_decimal(doc->'fields'->>'method_months_count_1')
            ELSE NULL 
        END::DOUBLE PRECISION AS pill_coc,

        CASE 
            WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'pill_cop')
            WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'pilule_cop')
            WHEN doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                AND parse_json_boolean(doc->'fields'->>'method_was_given') IS TRUE 
                AND doc->'fields'->>'fp_method' = 'pill_cop' 
                    THEN parse_json_decimal(doc->'fields'->>'method_months_count_1')
            ELSE NULL 
        END::DOUBLE PRECISION AS pill_cop,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'condoms')
            WHEN doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                AND parse_json_boolean(doc->'fields'->>'method_was_given') IS TRUE 
                AND doc->'fields'->>'fp_method' = 'condoms' 
                    THEN parse_json_decimal(doc->'fields'->>'condoms_quantity_given')
            ELSE NULL 
        END::DOUBLE PRECISION AS condoms,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'dmpa_sc')
            WHEN doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                AND parse_json_boolean(doc->'fields'->>'method_was_given') IS TRUE AND doc->'fields'->>'fp_method' = 'dmpa_sc' 
                    THEN 1 
            ELSE NULL 
        END::DOUBLE PRECISION AS dmpa_sc,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'depo_provera_im')
            ELSE NULL 
        END::DOUBLE PRECISION AS depo_provera_im,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'cycle_necklace')
            ELSE NULL 
        END::DOUBLE PRECISION AS cycle_necklace,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'implant')
            ELSE NULL 
        END::DOUBLE PRECISION AS implant,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'diu')
            ELSE NULL 
        END::DOUBLE PRECISION AS diu,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'tubal_ligation')
            ELSE NULL 
        END::DOUBLE PRECISION AS tubal_ligation,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'cta_nn')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                THEN parse_json_decimal(doc->'fields'->>'cta_nn_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS cta_nn,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'cta_pe')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'cta_pe_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS cta_pe,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'cta_ge')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'cta_ge_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS cta_ge,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'cta_ad')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'cta_ad_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS cta_ad,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'tdr')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation') AND parse_json_boolean(doc->'fields'->>'rdt_given') IS TRUE
                THEN 1 
            ELSE NULL 
        END::DOUBLE PRECISION AS tdr,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'amoxicillin_250mg')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'amoxicillin_250mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS amoxicillin_250mg,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'amoxicillin_500mg')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'amoxicillin_500mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS amoxicillin_500mg,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'paracetamol_100mg')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'paracetamol_100mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS paracetamol_100mg,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'paracetamol_250mg')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'paracetamol_250mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS paracetamol_250mg,
        
        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'paracetamol_500mg')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'paracetamol_500mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS paracetamol_500mg,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'mebendazol_250mg')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'mebendazole_250mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS mebendazol_250mg,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'mebendazol_500mg')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'mebendazole_500mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS mebendazol_500mg,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'ors')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'ors_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS ors,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'zinc')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'zinc_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS zinc,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'vitamin_a')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'vitamin_a_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS vitamin_a,

        CASE WHEN doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management')
                THEN parse_json_decimal(doc->'fields'->'meg_quantity'->>'tetracycline_ointment')
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation')
                THEN parse_json_decimal(doc->'fields'->>'tetracycline_ointment_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS tetracycline_ointment,

        CASE WHEN doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check')
                THEN doc->'fields'->>'fp_method' 
            ELSE NULL 
        END::TEXT AS fp_method,

        CASE WHEN doc->>'form' IN ('pregnancy_family_planning', 'family_planning') 
                THEN parse_json_boolean(doc->'fields'->>'is_fp_referred')
            WHEN doc->>'form' = 'fp_danger_sign_check' 
                THEN parse_json_boolean(doc->'fields'->>'is_referred')
            WHEN doc->>'form' = 'fp_renewal' 
                THEN parse_json_boolean(doc->'fields'->>'is_fp_referal')
            ELSE NULL 
        END::BOOLEAN AS is_fp_referred,

        CASE WHEN doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                THEN parse_json_boolean(doc->'fields'->>'has_fp_side_effect')
            WHEN doc->>'form' = 'fp_danger_sign_check' 
                THEN parse_json_boolean(doc->'fields'->>'has_secondary_effect')
            ELSE NULL 
        END::BOOLEAN AS has_fp_side_effect,


        NULLIF(doc->'fields'->>'country_id', '') AS country_id,
        NULLIF(doc->'fields'->>'region_id', '') AS region_id,
        NULLIF(doc->'fields'->>'prefecture_id', '') AS prefecture_id,
        NULLIF(doc->'fields'->>'commune_id', '') AS commune_id,
        NULLIF(doc->'fields'->>'hospital_id', '') AS hospital_id,
        NULLIF(doc->'fields'->>'district_quartier_id', '') AS district_quartier_id,
        NULLIF(doc->'fields'->>'village_secteur_id', '') AS village_secteur_id,
        NULLIF(doc->'fields'->>'user_id', '') AS reco_id,

        CASE WHEN doc->>'form' = 'stock_entry' AND COALESCE(doc->'fields'->'meg_stock'->>'meg_stock_date', '') <> '' 
                THEN TO_CHAR(TO_TIMESTAMP(doc->'fields'->'meg_stock'->>'meg_stock_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
            WHEN doc->>'form' = 'stock_movement' AND COALESCE(doc->'fields'->'meg_movement'->>'meg_movement_date', '') <> '' 
                THEN TO_CHAR(TO_TIMESTAMP(doc->'fields'->'meg_movement'->>'meg_movement_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
            WHEN doc->>'form' = 'drugs_management' AND COALESCE(doc->'fields'->'meg_management'->>'meg_management_date', '') <> '' 
                THEN TO_CHAR(TO_TIMESTAMP(doc->'fields'->'meg_management'->>'meg_management_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                THEN TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD') 
            ELSE NULL 
        END::DATE AS reported_date,

        CASE WHEN doc->>'form' = 'stock_entry' AND COALESCE(doc->'fields'->'meg_stock'->>'meg_stock_date', '') <> '' 
                THEN TO_CHAR(TO_TIMESTAMP(doc->'fields'->'meg_stock'->>'meg_stock_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
            WHEN doc->>'form' = 'stock_movement' AND COALESCE(doc->'fields'->'meg_movement'->>'meg_movement_date', '') <> '' 
                THEN TO_CHAR(TO_TIMESTAMP(doc->'fields'->'meg_movement'->>'meg_movement_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
            WHEN doc->>'form' = 'drugs_management' AND COALESCE(doc->'fields'->'meg_management'->>'meg_management_date', '') <> '' 
                    THEN TO_CHAR(TO_TIMESTAMP(doc->'fields'->'meg_management'->>'meg_management_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                THEN TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS') 
            ELSE NULL 
        END::TIMESTAMP AS reported_full_date,

        CASE WHEN doc->>'form' = 'stock_entry' AND COALESCE(doc->'fields'->'meg_stock'->>'meg_stock_date', '') <> '' 
                THEN EXTRACT(EPOCH FROM TO_DATE(doc->'fields'->'meg_stock'->>'meg_stock_date', 'YYYY-MM-DD'))
            WHEN doc->>'form' = 'stock_movement' AND COALESCE(doc->'fields'->'meg_movement'->>'meg_movement_date', '') <> '' 
                THEN EXTRACT(EPOCH FROM TO_DATE(doc->'fields'->'meg_movement'->>'meg_movement_date', 'YYYY-MM-DD'))
            WHEN doc->>'form' = 'drugs_management' AND COALESCE(doc->'fields'->'meg_management'->>'meg_management_date', '') <> '' 
                THEN EXTRACT(EPOCH FROM TO_DATE(doc->'fields'->'meg_management'->>'meg_management_date', 'YYYY-MM-DD'))
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                THEN CAST(doc->>'reported_date' AS BIGINT) 
            ELSE NULL 
        END::BIGINT AS reported_date_timestamp,

        CASE WHEN doc->>'form' = 'stock_entry' AND COALESCE(doc->'fields'->'meg_stock'->>'meg_stock_date', '') <> '' 
                THEN EXTRACT(YEAR FROM TO_TIMESTAMP(doc->'fields'->'meg_stock'->>'meg_stock_date', 'YYYY-MM-DD HH24:MI:SS')) 
            WHEN doc->>'form' = 'stock_movement' AND COALESCE(doc->'fields'->'meg_movement'->>'meg_movement_date', '') <> '' 
                THEN EXTRACT(YEAR FROM TO_TIMESTAMP(doc->'fields'->'meg_movement'->>'meg_movement_date', 'YYYY-MM-DD HH24:MI:SS')) 
            WHEN doc->>'form' = 'drugs_management' AND COALESCE(doc->'fields'->'meg_management'->>'meg_management_date', '') <> '' 
                THEN EXTRACT(YEAR FROM TO_TIMESTAMP(doc->'fields'->'meg_management'->>'meg_management_date', 'YYYY-MM-DD HH24:MI:SS')) 
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                THEN EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(doc->>'reported_date' AS BIGINT) / 1000))
            ELSE NULL 
        END::BIGINT AS year,

        CASE WHEN doc->>'form' = 'stock_entry' AND COALESCE(doc->'fields'->'meg_stock'->>'meg_stock_date', '') <> '' 
                THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(doc->'fields'->'meg_stock'->>'meg_stock_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
            WHEN doc->>'form' = 'stock_movement' AND COALESCE(doc->'fields'->'meg_movement'->>'meg_movement_date', '') <> '' 
                THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(doc->'fields'->'meg_movement'->>'meg_movement_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
            WHEN doc->>'form' = 'drugs_management' AND COALESCE(doc->'fields'->'meg_management'->>'meg_management_date', '') <> '' 
                THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(doc->'fields'->'meg_management'->>'meg_management_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
            WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')
            ELSE NULL 
        END::TEXT AS month,


        -- CASE WHEN month = '01' THEN CAST(year AS INT) - 1 ELSE CAST(year AS INT) END::BIGINT AS prev_year,
        -- CASE WHEN month = '01' THEN '12' ELSE LPAD(CAST(CAST(month AS INT) - 1 AS TEXT), 2, '0') END::TEXT AS prev_month,

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
        AND doc->'fields' IS NOT NULL AND (
            doc->>'form' IN ('drugs_management', 'stock_entry', 'stock_movement', 'pcimne_register', 'adult_consulation') 
            OR (doc->>'form' IN ('pregnancy_family_planning', 'family_planning') AND parse_json_boolean(doc->'fields'->>'is_pregnant') IS NOT TRUE) 
            OR (doc->>'form' = 'fp_renewal' AND doc->'fields'->>'fp_method' IS NOT NULL AND doc->'fields'->>'fp_method' <> '') 
            OR (doc->>'form' = 'fp_danger_sign_check')
        );     
        