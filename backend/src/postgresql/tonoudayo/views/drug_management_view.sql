CREATE MATERIALIZED VIEW IF NOT EXISTS drug_management_data_view AS
    SELECT
        (doc->>'_id')::UUID AS id,
        (doc->>'_rev')::TEXT AS rev,
        (doc->>'form')::TEXT AS form,

        CAST(doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
        TO_CHAR(TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,

        date_to_ih_month_year('month', (doc->>'reported_date')::BIGINT)::TEXT AS month,
        date_to_ih_month_year('year', (doc->>'reported_date')::BIGINT)::INTEGER AS year,

        NULLIF(doc->'fields'->>'chw_id', '') AS chw_id,
        NULLIF(doc->'fields'->>'chw_name', '') AS chw_name,
        NULLIF(doc->'fields'->>'this_month', '') AS this_month,
        NULLIF(doc->'fields'->>'this_year', '') AS this_year,
        NULLIF(doc->'fields'->>'last_year', '') AS last_year,
        NULLIF(doc->'fields'->>'action_name', '') AS action_name,

        CASE
            WHEN doc->'fields'->>'chw_sex' IN ('male', 'homme', 'm')
                THEN 'M'
            WHEN doc->'fields'->>'chw_sex' IN ('female', 'femme', 'f')
                THEN 'F'
            ELSE NULL
        END::VARCHAR(1) AS chw_sex,

        CASE WHEN doc->'fields'->'b_drug_quantities'->>'alben_400' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'alben_400' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'alben_400' AS INTEGER)
            ELSE NULL 
        END AS albendazole_400mg,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'para_250' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'para_250' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'para_250' AS INTEGER)
            ELSE NULL 
        END AS paracetamol_250mg,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'para_500' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'para_500' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'para_500' AS INTEGER)
            ELSE NULL 
        END AS paracetamol_500mg,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'amox_250' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'amox_250' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'amox_250' AS INTEGER)
            ELSE NULL 
        END AS amoxicillin_250mg,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'amox_500' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'amox_500' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'amox_500' AS INTEGER)
            ELSE NULL 
        END AS amoxicillin_500mg,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'tdr' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'tdr' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'tdr' AS INTEGER)
            ELSE NULL 
        END AS tdr_tests,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'lumartem' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'lumartem' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'lumartem' AS INTEGER)
            ELSE NULL 
        END AS lumartem,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'sro' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'sro' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'sro' AS INTEGER)
            ELSE NULL 
        END AS oral_rehydration_salts,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'zinc' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'zinc' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'zinc' AS INTEGER)
            ELSE NULL 
        END AS zinc_supplements,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'sayana' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'sayana' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'sayana' AS INTEGER)
            ELSE NULL 
        END AS sayana_press,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'pills' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'pills' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'pills' AS INTEGER)
            ELSE NULL 
        END AS oral_contraceptives,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'pregnancy_test' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'pregnancy_test' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'pregnancy_test' AS INTEGER)
            ELSE NULL 
        END AS pregnancy_tests,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'vit_a1' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'vit_a1' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'vit_a1' AS INTEGER)
            ELSE NULL 
        END AS vitamin_a_100k,
        
        CASE WHEN doc->'fields'->'b_drug_quantities'->>'vit_a2' IS NOT NULL AND doc->'fields'->'b_drug_quantities'->>'vit_a2' <> '' 
            THEN CAST(doc->'fields'->'b_drug_quantities'->>'vit_a2' AS INTEGER)
            ELSE NULL 
        END AS vitamin_a_200k,

        CASE
            WHEN jsonb_typeof((doc->'geolocation')::JSONB) = 'object'
                AND NULLIF(doc->'geolocation'->>'latitude', '') IS NOT NULL
                AND NULLIF(doc->'geolocation'->>'longitude', '') IS NOT NULL
                THEN doc->'geolocation'
            ELSE NULL
        END::JSONB AS geolocation

    FROM tonoudayo_docs
    WHERE
        doc->>'form' IS NOT NULL
        AND doc->'fields' IS NOT NULL
        AND doc->>'form' = 'drugs_management';
