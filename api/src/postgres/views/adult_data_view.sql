CREATE MATERIALIZED VIEW IF NOT EXISTS adult_data_view AS 
    WITH parsed AS (
        SELECT
            c.*,
            string_to_array(NULLIF(c.doc->'fields'->>'visit_motif', ''), ' ') AS visit_motifs,
            c.doc->'fields'->>'other_motif' AS other_motif
        FROM couchdb c
        WHERE 
            c.doc->>'form' IN ('adult_consulation', 'adult_followup')
            AND c.doc->'fields' IS NOT NULL
    )
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

        -- Fields for the adult consultation form
        CASE WHEN doc->>'form' = 'adult_consulation' THEN 'consultation'
            WHEN doc->>'form' = 'adult_followup' THEN 'followup'
            ELSE NULL
        END AS consultation_followup,

        NULLIF(doc->'fields'->>'promptitude', '')::TEXT AS promptitude,
        
        -- Other fields (Boolean transformations)
        parse_json_boolean(doc->'fields'->>'is_pregnant') IS TRUE AS is_pregnant,
        parse_json_boolean(doc->'fields'->>'has_malaria') IS TRUE AS has_malaria,
        parse_json_boolean(doc->'fields'->>'has_fever') IS TRUE AS has_fever,
        parse_json_boolean(doc->'fields'->>'has_diarrhea') IS TRUE AS has_diarrhea,
        parse_json_boolean(doc->'fields'->>'has_cough_cold') IS TRUE AS has_cough_cold,
        parse_json_boolean(doc->'fields'->>'rdt_given') IS TRUE AS rdt_given,
        parse_json_boolean(doc->'fields'->>'is_referred') IS TRUE AS is_referred,

        NULLIF(doc->'fields'->>'rdt_result', '')::TEXT AS rdt_result,

        -- Medication quantities (assuming they are numeric)
        NULLIF(TRIM(doc->'fields'->>'cta_nn_quantity'), '')::DOUBLE PRECISION AS cta_nn,
        NULLIF(TRIM(doc->'fields'->>'cta_pe_quantity'), '')::DOUBLE PRECISION AS cta_pe,
        NULLIF(TRIM(doc->'fields'->>'cta_ge_quantity'), '')::DOUBLE PRECISION AS cta_ge,
        NULLIF(TRIM(doc->'fields'->>'cta_ad_quantity'), '')::DOUBLE PRECISION AS cta_ad,
        NULLIF(TRIM(doc->'fields'->>'amoxicillin_250mg_quantity'), '')::DOUBLE PRECISION AS amoxicillin_250mg,
        NULLIF(TRIM(doc->'fields'->>'amoxicillin_500mg_quantity'), '')::DOUBLE PRECISION AS amoxicillin_500mg,
        NULLIF(TRIM(doc->'fields'->>'paracetamol_100mg_quantity'), '')::DOUBLE PRECISION AS paracetamol_100mg,
        NULLIF(TRIM(doc->'fields'->>'paracetamol_250mg_quantity'), '')::DOUBLE PRECISION AS paracetamol_250mg,
        NULLIF(TRIM(doc->'fields'->>'paracetamol_500mg_quantity'), '')::DOUBLE PRECISION AS paracetamol_500mg,
        NULLIF(TRIM(doc->'fields'->>'mebendazole_250mg_quantity'), '')::DOUBLE PRECISION AS mebendazole_250mg,
        NULLIF(TRIM(doc->'fields'->>'mebendazole_500mg_quantity'), '')::DOUBLE PRECISION AS mebendazole_500mg,
        NULLIF(TRIM(doc->'fields'->>'ors_quantity'), '')::DOUBLE PRECISION AS ors,
        NULLIF(TRIM(doc->'fields'->>'zinc_quantity'), '')::DOUBLE PRECISION AS zinc,


        -- Various visit motifs, transforming to boolean
        visit_motifs::TEXT[] AS visit_motifs,

        -- Various visit motifs, transforming to boolean
        'malaria' = ANY(visit_motifs) AS malaria,
        'fever' = ANY(visit_motifs) AS fever,
        'diarrhea' = ANY(visit_motifs) AS diarrhea,
        'yellow_fever' = ANY(visit_motifs) AS yellow_fever,
        'tetanus' = ANY(visit_motifs) AS tetanus,
        'cough_or_cold' = ANY(visit_motifs) AS cough_or_cold,
        'viral_diseases' = ANY(visit_motifs) AS viral_diseases,
        'acute_flaccid_paralysis' = ANY(visit_motifs) AS acute_flaccid_paralysis,
        'meningitis' = ANY(visit_motifs) AS meningitis,
        'miscarriage' = ANY(visit_motifs) AS miscarriage,
        'traffic_accident' = ANY(visit_motifs) AS traffic_accident,
        'burns' = ANY(visit_motifs) AS burns,
        'suspected_tb' = ANY(visit_motifs) AS suspected_tb,
        'dermatosis' = ANY(visit_motifs) AS dermatosis,
        'bloody_diarrhea' = ANY(visit_motifs) AS bloody_diarrhea,
        'urethral_discharge' = ANY(visit_motifs) AS urethral_discharge,
        'vaginal_discharge' = ANY(visit_motifs) AS vaginal_discharge,
        'loss_of_urine' = ANY(visit_motifs) AS loss_of_urine,
        'accidental_ingestion_caustic_products' = ANY(visit_motifs) AS accidental_ingestion_caustic_products,
        'food_poisoning' = ANY(visit_motifs) AS food_poisoning,
        'oral_and_dental_diseases' = ANY(visit_motifs) AS oral_and_dental_diseases,
        'dog_bites' = ANY(visit_motifs) AS dog_bites,
        'snake_bite' = ANY(visit_motifs) AS snake_bite,
        'parasitosis' = ANY(visit_motifs) AS parasitosis,
        'measles' = ANY(visit_motifs) AS measles,
        'trauma' = ANY(visit_motifs) AS trauma,
        'gender_based_violence' = ANY(visit_motifs) AS gender_based_violence,
        'vomit' = ANY(visit_motifs) AS vomit,
        'headaches' = ANY(visit_motifs) AS headaches,
        'abdominal_pain' = ANY(visit_motifs) AS abdominal_pain,
        'bleeding' = ANY(visit_motifs) AS bleeding,
        'feel_pain_injection' = ANY(visit_motifs) AS feel_pain_injection,
        'health_center_FP' = ANY(visit_motifs) AS health_center_FP,
        'cpn_done' = ANY(visit_motifs) AS cpn_done,
        'td1_done' = ANY(visit_motifs) AS td1_done,
        'td2_done' = ANY(visit_motifs) AS td2_done,
        'danger_sign' = ANY(visit_motifs) AS danger_sign,
        'fp_side_effect' = ANY(visit_motifs) AS fp_side_effect,
        'domestic_violence' = ANY(visit_motifs) AS domestic_violence,
        'afp' = ANY(visit_motifs) AS afp,
        'cholera' = ANY(visit_motifs) AS cholera,

        -- Handle optional field
        CASE 
            WHEN 'others' = ANY(visit_motifs) THEN other_motif
            ELSE NULL 
        END AS other_problems,

        -- FOR TASK / FOLLOWUP
        NULLIF(doc->'fields'->'inputs'->>'source', '') AS source,
        NULLIF(doc->'fields'->'inputs'->>'source_id', '') AS source_id,
        NULLIF(doc->'fields'->'inputs'->>'t_family_id', '') AS t_family_id,
        NULLIF(doc->'fields'->'inputs'->>'t_family_name', '') AS t_family_name,
        NULLIF(doc->'fields'->'inputs'->>'t_family_external_id', '') AS t_family_external_id,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_is_pregnant') IS TRUE AS t_is_pregnant,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_malaria') IS TRUE AS t_malaria,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_fever') IS TRUE AS t_fever,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_diarrhea') IS TRUE AS t_diarrhea,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_yellow_fever') IS TRUE AS t_yellow_fever,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_tetanus') IS TRUE AS t_tetanus,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_cough_or_cold') IS TRUE AS t_cough_or_cold,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_viral_diseases') IS TRUE AS t_viral_diseases,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_acute_flaccid_paralysis') IS TRUE AS t_acute_flaccid_paralysis,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_meningitis') IS TRUE AS t_meningitis,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_miscarriage') IS TRUE AS t_miscarriage,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_traffic_accident') IS TRUE AS t_traffic_accident,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_burns') IS TRUE AS t_burns,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_suspected_tb') IS TRUE AS t_suspected_tb,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_dermatosis') IS TRUE AS t_dermatosis,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_bloody_diarrhea') IS TRUE AS t_bloody_diarrhea,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_urethral_discharge') IS TRUE AS t_urethral_discharge,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_vaginal_discharge') IS TRUE AS t_vaginal_discharge,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_loss_of_urine') IS TRUE AS t_loss_of_urine,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_accidental_ingestion_caustic_products') IS TRUE AS t_accidental_ingestion_caustic_products,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_food_poisoning') IS TRUE AS t_food_poisoning,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_oral_and_dental_diseases') IS TRUE AS t_oral_and_dental_diseases,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_dog_bites') IS TRUE AS t_dog_bites,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_snake_bite') IS TRUE AS t_snake_bite,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_parasitosis') IS TRUE AS t_parasitosis,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_measles') IS TRUE AS t_measles,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_trauma') IS TRUE AS t_trauma,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_gender_based_violence') IS TRUE AS t_gender_based_violence,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_vomit') IS TRUE AS t_vomit,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_headaches') IS TRUE AS t_headaches,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_abdominal_pain') IS TRUE AS t_abdominal_pain,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_bleeding') IS TRUE AS t_bleeding,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_feel_pain_injection') IS TRUE AS t_feel_pain_injection,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_health_center_FP') IS TRUE AS t_health_center_FP,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_cpn_not_done') IS TRUE AS t_cpn_not_done,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_td1_not_done') IS TRUE AS t_td1_not_done,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_td2_not_done') IS TRUE AS t_td2_not_done,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_danger_sign') IS TRUE AS t_danger_sign,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_fp_side_effect') IS TRUE AS t_fp_side_effect,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_domestic_violence') IS TRUE AS t_domestic_violence,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_afp') IS TRUE AS t_afp,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_cholera') IS TRUE AS t_cholera,
        parse_json_boolean(doc->'fields'->'inputs'->>'t_other_problems') IS TRUE AS t_other_problems,
        
        
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
                AND COALESCE(NULLIF(doc->'geolocation'->>'latitude', ''), NULL) IS NOT NULL
                AND COALESCE(NULLIF(doc->'geolocation'->>'longitude', ''), NULL) IS NOT NULL
            THEN doc->'geolocation'
            ELSE NULL
        END::JSONB  AS geolocation 
        
    FROM 
        parsed;
