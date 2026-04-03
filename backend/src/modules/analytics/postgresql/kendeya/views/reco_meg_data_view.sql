-- @name: reco_meg_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS reco_meg_data_view AS 
    WITH base AS (
        SELECT
            doc,
            (doc->>'_id')::TEXT AS id,
            (doc->>'_rev')::TEXT AS rev,
            (doc->>'form')::TEXT AS form,
            (doc->'geolocation')::JSONB AS geolocation,
            (doc->'fields') AS fields,
            (doc->'fields'->'meg_movement') AS meg_movement,
            (doc->'fields'->'meg_quantity') AS meg_quantity,
            (doc->'fields'->'meg_management') AS meg_management,
            (doc->'fields'->'c_planning') AS c_planning,
            (doc->'fields'->'meg_stock') AS meg_stock,
        
            CASE WHEN doc->>'form' = 'stock_entry' THEN 'stock' 
                WHEN doc->>'form' = 'stock_movement' THEN doc->'fields'->'meg_movement'->>'meg_movement_reason' 
                WHEN doc->>'form' = 'drugs_management' THEN doc->'fields'->'meg_management'->>'meg_management_reason' 
                WHEN doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                    THEN 'consumption' 
                ELSE NULL 
            END::TEXT AS meg_type,


            NULLIF(doc->'fields'->>'country_id', '') AS country_id,
            NULLIF(doc->'fields'->>'region_id', '') AS region_id,
            NULLIF(doc->'fields'->>'prefecture_id', '') AS prefecture_id,
            NULLIF(doc->'fields'->>'commune_id', '') AS commune_id,
            NULLIF(doc->'fields'->>'hospital_id', '') AS hospital_id,
            NULLIF(doc->'fields'->>'district_quartier_id', '') AS district_quartier_id,
            NULLIF(doc->'fields'->>'village_secteur_id', '') AS village_secteur_id,
            NULLIF(doc->'fields'->>'user_id', '') AS reco_id,

            ARRAY['stock_entry', 'stock_movement', 'drugs_management'] AS drug_forms,
            ARRAY['pcimne_register', 'adult_consulation'] AS consulation_forms,
            ARRAY['pregnancy_family_planning', 'family_planning', 'fp_renewal'] AS full_new_fp_forms,
            ARRAY['pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check'] AS all_fp_forms,

            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        
        FROM kendeya_docs

        WHERE
            doc->>'form' IS NOT NULL
            AND doc->'fields' IS NOT NULL AND (
                doc->>'form' IN ('drugs_management', 'stock_entry', 'stock_movement', 'pcimne_register', 'adult_consulation') 
                OR (doc->>'form' IN ('pregnancy_family_planning', 'family_planning') AND parse_json_boolean(doc->'fields'->>'is_pregnant') IS NOT TRUE) 
                OR (doc->>'form' = 'fp_renewal' AND doc->'fields'->>'fp_method' IS NOT NULL AND doc->'fields'->>'fp_method' <> '') 
                OR (doc->>'form' = 'fp_danger_sign_check')
                OR (doc->>'form' = 'men_family_planning')
            )
    )
    SELECT
        b.id,
        b.rev,
        b.form,

        b.meg_type,

        CASE 
            WHEN b.form = ANY(b.drug_forms) 
                THEN COALESCE(
                    parse_json_decimal(b.meg_quantity->>'pill_coc'),
                    parse_json_decimal(b.meg_quantity->>'pilule_coc')
                )
            WHEN b.form = ANY(b.full_new_fp_forms) 
                AND parse_json_boolean(b.fields->>'method_was_given') IS TRUE 
                AND b.fields->>'fp_method' = 'pill_coc'
                    THEN parse_json_decimal(b.fields->>'method_months_count_1')
            ELSE NULL 
        END::DOUBLE PRECISION AS pill_coc,

        CASE 
            WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'pill_cop')
            WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'pilule_cop')
            WHEN b.form = ANY(b.full_new_fp_forms) 
                AND parse_json_boolean(b.fields->>'method_was_given') IS TRUE 
                AND b.fields->>'fp_method' = 'pill_cop' 
                    THEN parse_json_decimal(b.fields->>'method_months_count_1')
            ELSE NULL 
        END::DOUBLE PRECISION AS pill_cop,

        CASE WHEN b.form = ANY(b.drug_forms) 
                THEN parse_json_decimal(b.meg_quantity->>'condoms')
            WHEN b.form = ANY(b.full_new_fp_forms) 
                AND parse_json_boolean(b.fields->>'method_was_given') IS TRUE 
                AND b.fields->>'fp_method' = 'condoms' 
                    THEN parse_json_decimal(b.fields->>'condoms_quantity_given')
            ELSE NULL 
        END::DOUBLE PRECISION AS condoms,

        CASE WHEN b.form IN ('men_family_planning') 
             AND b.c_planning->>'c_method_wanted' = 'condoms_masculin'
                THEN parse_json_decimal(b.c_planning->>'c_condoms_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS condoms_masculin,

        CASE WHEN b.form = ANY(b.drug_forms) 
                THEN parse_json_decimal(b.meg_quantity->>'dmpa_sc')
            WHEN b.form = ANY(b.full_new_fp_forms) 
                AND parse_json_boolean(b.fields->>'method_was_given') IS TRUE AND b.fields->>'fp_method' = 'dmpa_sc' 
                    THEN 1 
            ELSE NULL 
        END::DOUBLE PRECISION AS dmpa_sc,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'depo_provera_im')
            ELSE NULL 
        END::DOUBLE PRECISION AS depo_provera_im,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'cycle_necklace')
            ELSE NULL 
        END::DOUBLE PRECISION AS cycle_necklace,

        CASE WHEN b.form = ANY(b.drug_forms) 
                THEN parse_json_decimal(b.meg_quantity->>'implant')
            ELSE NULL 
        END::DOUBLE PRECISION AS implant,

        CASE WHEN b.form = ANY(b.drug_forms) 
                THEN parse_json_decimal(b.meg_quantity->>'diu')
            ELSE NULL 
        END::DOUBLE PRECISION AS diu,

        CASE WHEN b.form = ANY(b.drug_forms) 
                THEN parse_json_decimal(b.meg_quantity->>'tubal_ligation')
            ELSE NULL 
        END::DOUBLE PRECISION AS tubal_ligation,

        CASE WHEN b.form = ANY(b.drug_forms) 
                THEN parse_json_decimal(b.meg_quantity->>'cta_nn')
            WHEN b.form = ANY(b.consulation_forms) 
                THEN parse_json_decimal(b.fields->>'cta_nn_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS cta_nn,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'cta_pe')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'cta_pe_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS cta_pe,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'cta_ge')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'cta_ge_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS cta_ge,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'cta_ad')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'cta_ad_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS cta_ad,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'tdr')
            WHEN b.form = ANY(b.consulation_forms) AND parse_json_boolean(b.fields->>'rdt_given') IS TRUE
                THEN 1 
            ELSE NULL 
        END::DOUBLE PRECISION AS tdr,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'amoxicillin_250mg')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'amoxicillin_250mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS amoxicillin_250mg,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'amoxicillin_500mg')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'amoxicillin_500mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS amoxicillin_500mg,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'paracetamol_100mg')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'paracetamol_100mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS paracetamol_100mg,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'paracetamol_250mg')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'paracetamol_250mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS paracetamol_250mg,
        
        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'paracetamol_500mg')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'paracetamol_500mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS paracetamol_500mg,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'mebendazol_250mg')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'mebendazole_250mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS mebendazol_250mg,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'mebendazol_500mg')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'mebendazole_500mg_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS mebendazol_500mg,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'ors')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'ors_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS ors,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'zinc')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'zinc_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS zinc,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'vitamin_a')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'vitamin_a_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS vitamin_a,

        CASE WHEN b.form = ANY(b.drug_forms)
                THEN parse_json_decimal(b.meg_quantity->>'tetracycline_ointment')
            WHEN b.form = ANY(b.consulation_forms)
                THEN parse_json_decimal(b.fields->>'tetracycline_ointment_quantity')
            ELSE NULL 
        END::DOUBLE PRECISION AS tetracycline_ointment,

        CASE WHEN b.form = ANY(b.all_fp_forms)
                THEN b.fields->>'fp_method' 
            ELSE NULL 
        END::TEXT AS fp_method,

        CASE WHEN b.form IN ('pregnancy_family_planning', 'family_planning')
                THEN parse_json_boolean(b.fields->>'is_fp_referred')
            WHEN b.form = 'fp_danger_sign_check' 
                THEN parse_json_boolean(b.fields->>'is_referred')
            WHEN b.form = 'fp_renewal' 
                THEN parse_json_boolean(b.fields->>'is_fp_referal')
            ELSE NULL 
        END::BOOLEAN AS is_fp_referred,

        CASE WHEN b.form = ANY(b.full_new_fp_forms) 
                THEN parse_json_boolean(b.fields->>'has_fp_side_effect')
            WHEN b.form = 'fp_danger_sign_check' 
                THEN parse_json_boolean(b.fields->>'has_secondary_effect')
            ELSE NULL 
        END::BOOLEAN AS has_fp_side_effect,


        b.country_id,
        b.region_id,
        b.prefecture_id,
        b.commune_id,
        b.hospital_id,
        b.district_quartier_id,
        b.village_secteur_id,
        b.reco_id,

        CASE WHEN b.form = 'stock_entry' AND COALESCE(b.meg_stock->>'meg_stock_date', '') <> '' 
                THEN TO_CHAR(TO_TIMESTAMP(b.meg_stock->>'meg_stock_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
            WHEN b.form = 'stock_movement' AND COALESCE(b.meg_movement->>'meg_movement_date', '') <> '' 
                THEN TO_CHAR(TO_TIMESTAMP(b.meg_movement->>'meg_movement_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
            WHEN b.form = 'drugs_management' AND COALESCE(b.meg_management->>'meg_management_date', '') <> '' 
                THEN TO_CHAR(TO_TIMESTAMP(b.meg_management->>'meg_management_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
            WHEN b.form IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                THEN TO_CHAR(b.reported_ts, 'YYYY-MM-DD') 
            ELSE NULL 
        END::DATE AS reported_date,

        CASE WHEN b.form = 'stock_entry' AND COALESCE(b.meg_stock->>'meg_stock_date', '') <> '' 
                THEN TO_CHAR(TO_TIMESTAMP(b.meg_stock->>'meg_stock_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
            WHEN b.form = 'stock_movement' AND COALESCE(b.meg_movement->>'meg_movement_date', '') <> '' 
                THEN TO_CHAR(TO_TIMESTAMP(b.meg_movement->>'meg_movement_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
            WHEN b.form = 'drugs_management' AND COALESCE(b.meg_management->>'meg_management_date', '') <> '' 
                    THEN TO_CHAR(TO_TIMESTAMP(b.meg_management->>'meg_management_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
            WHEN b.form IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                THEN TO_CHAR(b.reported_ts, 'YYYY-MM-DD HH24:MI:SS') 
            ELSE NULL 
        END::TIMESTAMP AS reported_full_date,

        CASE WHEN b.form = 'stock_entry' AND COALESCE(b.meg_stock->>'meg_stock_date', '') <> '' 
                THEN EXTRACT(EPOCH FROM TO_DATE(b.meg_stock->>'meg_stock_date', 'YYYY-MM-DD'))
            WHEN b.form = 'stock_movement' AND COALESCE(b.meg_movement->>'meg_movement_date', '') <> '' 
                THEN EXTRACT(EPOCH FROM TO_DATE(b.meg_movement->>'meg_movement_date', 'YYYY-MM-DD'))
            WHEN b.form = 'drugs_management' AND COALESCE(b.meg_management->>'meg_management_date', '') <> '' 
                THEN EXTRACT(EPOCH FROM TO_DATE(b.meg_management->>'meg_management_date', 'YYYY-MM-DD'))
            WHEN b.form IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                THEN CAST(b.doc->>'reported_date' AS BIGINT) 
            ELSE NULL 
        END::BIGINT AS reported_date_timestamp,

        CASE WHEN b.form = 'stock_entry' AND COALESCE(b.meg_stock->>'meg_stock_date', '') <> '' 
                THEN EXTRACT(YEAR FROM TO_TIMESTAMP(b.meg_stock->>'meg_stock_date', 'YYYY-MM-DD HH24:MI:SS')) 
            WHEN b.form = 'stock_movement' AND COALESCE(b.meg_movement->>'meg_movement_date', '') <> '' 
                THEN EXTRACT(YEAR FROM TO_TIMESTAMP(b.meg_movement->>'meg_movement_date', 'YYYY-MM-DD HH24:MI:SS')) 
            WHEN b.form = 'drugs_management' AND COALESCE(b.meg_management->>'meg_management_date', '') <> '' 
                THEN EXTRACT(YEAR FROM TO_TIMESTAMP(b.meg_management->>'meg_management_date', 'YYYY-MM-DD HH24:MI:SS')) 
            WHEN b.form IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                THEN EXTRACT(YEAR FROM b.reported_ts)
            ELSE NULL 
        END::BIGINT AS year,

        CASE WHEN b.form = 'stock_entry' AND COALESCE(b.meg_stock->>'meg_stock_date', '') <> '' 
                THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(b.meg_stock->>'meg_stock_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
            WHEN b.form = 'stock_movement' AND COALESCE(b.meg_movement->>'meg_movement_date', '') <> '' 
                THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(b.meg_movement->>'meg_movement_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
            WHEN b.form = 'drugs_management' AND COALESCE(b.meg_management->>'meg_management_date', '') <> '' 
                THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(b.meg_management->>'meg_management_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
            WHEN b.form IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                THEN LPAD(EXTRACT(MONTH FROM b.reported_ts)::TEXT, 2, '0')
            ELSE NULL 
        END::TEXT AS month,


        -- CASE WHEN month = '01' THEN CAST(year AS INT) - 1 ELSE CAST(year AS INT) END::BIGINT AS prev_year,
        -- CASE WHEN month = '01' THEN '12' ELSE LPAD(CAST(CAST(month AS INT) - 1 AS TEXT), 2, '0') END::TEXT AS prev_month,

        -- Géolocalisation propre
        CASE 
            WHEN jsonb_typeof(b.geolocation) = 'object'
            AND NULLIF(b.geolocation->>'latitude', '') IS NOT NULL
            AND NULLIF(b.geolocation->>'longitude', '') IS NOT NULL
            THEN b.geolocation
            ELSE NULL
        END::JSONB AS geolocation

    FROM base b;
        