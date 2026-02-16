-- @name: adult_data_view
-- @type: matview
-- @depends: 
-- @auto_depends: true
-- @indexes:
--   - columns: ["id"]
--     unique: true
--   - columns: ["month","year"]
--     method: btree

CREATE MATERIALIZED VIEW IF NOT EXISTS adult_data_view AS 
    WITH base AS (
        SELECT
            doc,
            doc->'fields' AS fields,
            doc->'fields'->'inputs' AS inputs,
            string_to_array(NULLIF(doc->'fields'->>'visit_motif', ''), ' ')::TEXT[] AS visit_motifs,
            doc->'fields'->>'other_motif' AS other_motif,
            (doc->>'form')::TEXT AS form,
            LOWER(doc->'fields'->>'patient_sex') AS patient_sex,
            (doc->'geolocation')::JSONB AS geolocation,

            TO_TIMESTAMP((doc->>'reported_date')::BIGINT / 1000) AS reported_ts
        FROM kendeya_docs
        WHERE 
            doc->>'form' IN ('adult_consulation', 'adult_followup')
            AND doc->'fields' IS NOT NULL
    )
    SELECT
        (b.doc->>'_id')::TEXT AS id,
        (b.doc->>'_rev')::TEXT AS rev,
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

        -- Fields for the adult consultation form
        CASE WHEN b.form = 'adult_consulation' THEN 'consultation'
            WHEN b.form = 'adult_followup' THEN 'followup'
            ELSE NULL
        END AS consultation_followup,

        NULLIF(b.fields->>'promptitude', '')::TEXT AS promptitude,
        
        -- Other fields (Boolean transformations)
        parse_json_boolean(b.fields->>'is_pregnant') IS TRUE AS is_pregnant,
        parse_json_boolean(b.fields->>'has_malaria') IS TRUE AS has_malaria,
        parse_json_boolean(b.fields->>'has_fever') IS TRUE AS has_fever,
        parse_json_boolean(b.fields->>'has_diarrhea') IS TRUE AS has_diarrhea,
        parse_json_boolean(b.fields->>'has_cough_cold') IS TRUE AS has_cough_cold,
        parse_json_boolean(b.fields->>'rdt_given') IS TRUE AS rdt_given,
        parse_json_boolean(b.fields->>'is_referred') IS TRUE AS is_referred,

        NULLIF(b.fields->>'rdt_result', '')::TEXT AS rdt_result,

        -- Medication quantities (assuming they are numeric)
        NULLIF(TRIM(b.fields->>'cta_nn_quantity'), '')::DOUBLE PRECISION AS cta_nn,
        NULLIF(TRIM(b.fields->>'cta_pe_quantity'), '')::DOUBLE PRECISION AS cta_pe,
        NULLIF(TRIM(b.fields->>'cta_ge_quantity'), '')::DOUBLE PRECISION AS cta_ge,
        NULLIF(TRIM(b.fields->>'cta_ad_quantity'), '')::DOUBLE PRECISION AS cta_ad,
        NULLIF(TRIM(b.fields->>'amoxicillin_250mg_quantity'), '')::DOUBLE PRECISION AS amoxicillin_250mg,
        NULLIF(TRIM(b.fields->>'amoxicillin_500mg_quantity'), '')::DOUBLE PRECISION AS amoxicillin_500mg,
        NULLIF(TRIM(b.fields->>'paracetamol_100mg_quantity'), '')::DOUBLE PRECISION AS paracetamol_100mg,
        NULLIF(TRIM(b.fields->>'paracetamol_250mg_quantity'), '')::DOUBLE PRECISION AS paracetamol_250mg,
        NULLIF(TRIM(b.fields->>'paracetamol_500mg_quantity'), '')::DOUBLE PRECISION AS paracetamol_500mg,
        NULLIF(TRIM(b.fields->>'mebendazole_250mg_quantity'), '')::DOUBLE PRECISION AS mebendazole_250mg,
        NULLIF(TRIM(b.fields->>'mebendazole_500mg_quantity'), '')::DOUBLE PRECISION AS mebendazole_500mg,
        NULLIF(TRIM(b.fields->>'ors_quantity'), '')::DOUBLE PRECISION AS ors,
        NULLIF(TRIM(b.fields->>'zinc_quantity'), '')::DOUBLE PRECISION AS zinc,


        -- Various visit motifs, transforming to boolean
        b.visit_motifs,

        -- Various visit motifs, transforming to boolean
        'malaria' = ANY(b.visit_motifs) AS malaria,
        'fever' = ANY(b.visit_motifs) AS fever,
        'diarrhea' = ANY(b.visit_motifs) AS diarrhea,
        'yellow_fever' = ANY(b.visit_motifs) AS yellow_fever,
        'tetanus' = ANY(b.visit_motifs) AS tetanus,
        'cough_or_cold' = ANY(b.visit_motifs) AS cough_or_cold,
        'viral_diseases' = ANY(b.visit_motifs) AS viral_diseases,
        'acute_flaccid_paralysis' = ANY(b.visit_motifs) AS acute_flaccid_paralysis,
        'meningitis' = ANY(b.visit_motifs) AS meningitis,
        'miscarriage' = ANY(b.visit_motifs) AS miscarriage,
        'traffic_accident' = ANY(b.visit_motifs) AS traffic_accident,
        'burns' = ANY(b.visit_motifs) AS burns,
        'suspected_tb' = ANY(b.visit_motifs) AS suspected_tb,
        'dermatosis' = ANY(b.visit_motifs) AS dermatosis,
        'bloody_diarrhea' = ANY(b.visit_motifs) AS bloody_diarrhea,
        'urethral_discharge' = ANY(b.visit_motifs) AS urethral_discharge,
        'vaginal_discharge' = ANY(b.visit_motifs) AS vaginal_discharge,
        'loss_of_urine' = ANY(b.visit_motifs) AS loss_of_urine,
        'accidental_ingestion_caustic_products' = ANY(b.visit_motifs) AS accidental_ingestion_caustic_products,
        'food_poisoning' = ANY(b.visit_motifs) AS food_poisoning,
        'oral_and_dental_diseases' = ANY(b.visit_motifs) AS oral_and_dental_diseases,
        'dog_bites' = ANY(b.visit_motifs) AS dog_bites,
        'snake_bite' = ANY(b.visit_motifs) AS snake_bite,
        'parasitosis' = ANY(b.visit_motifs) AS parasitosis,
        'measles' = ANY(b.visit_motifs) AS measles,
        'trauma' = ANY(b.visit_motifs) AS trauma,
        'gender_based_violence' = ANY(b.visit_motifs) AS gender_based_violence,
        'vomit' = ANY(b.visit_motifs) AS vomit,
        'headaches' = ANY(b.visit_motifs) AS headaches,
        'abdominal_pain' = ANY(b.visit_motifs) AS abdominal_pain,
        'bleeding' = ANY(b.visit_motifs) AS bleeding,
        'feel_pain_injection' = ANY(b.visit_motifs) AS feel_pain_injection,
        'health_center_FP' = ANY(b.visit_motifs) AS health_center_FP,
        'cpn_done' = ANY(b.visit_motifs) AS cpn_done,
        'td1_done' = ANY(b.visit_motifs) AS td1_done,
        'td2_done' = ANY(b.visit_motifs) AS td2_done,
        'danger_sign' = ANY(b.visit_motifs) AS danger_sign,
        'fp_side_effect' = ANY(b.visit_motifs) AS fp_side_effect,
        'domestic_violence' = ANY(b.visit_motifs) AS domestic_violence,
        'afp' = ANY(b.visit_motifs) AS afp,
        'cholera' = ANY(b.visit_motifs) AS cholera,

        -- Handle optional field
        CASE 
            WHEN 'others' = ANY(b.visit_motifs) THEN other_motif
            ELSE NULL 
        END AS other_problems,

        -- FOR TASK / FOLLOWUP
        NULLIF(b.inputs->>'source', '') AS source,
        NULLIF(b.inputs->>'source_id', '') AS source_id,
        NULLIF(b.inputs->>'t_family_id', '') AS t_family_id,
        NULLIF(b.inputs->>'t_family_name', '') AS t_family_name,
        NULLIF(b.inputs->>'t_family_external_id', '') AS t_family_external_id,
        
        parse_json_boolean(b.inputs->>'t_is_pregnant') IS TRUE AS t_is_pregnant,
        parse_json_boolean(b.inputs->>'t_malaria') IS TRUE AS t_malaria,
        parse_json_boolean(b.inputs->>'t_fever') IS TRUE AS t_fever,
        parse_json_boolean(b.inputs->>'t_diarrhea') IS TRUE AS t_diarrhea,
        parse_json_boolean(b.inputs->>'t_yellow_fever') IS TRUE AS t_yellow_fever,
        parse_json_boolean(b.inputs->>'t_tetanus') IS TRUE AS t_tetanus,
        parse_json_boolean(b.inputs->>'t_cough_or_cold') IS TRUE AS t_cough_or_cold,
        parse_json_boolean(b.inputs->>'t_viral_diseases') IS TRUE AS t_viral_diseases,
        parse_json_boolean(b.inputs->>'t_acute_flaccid_paralysis') IS TRUE AS t_acute_flaccid_paralysis,
        parse_json_boolean(b.inputs->>'t_meningitis') IS TRUE AS t_meningitis,
        parse_json_boolean(b.inputs->>'t_miscarriage') IS TRUE AS t_miscarriage,
        parse_json_boolean(b.inputs->>'t_traffic_accident') IS TRUE AS t_traffic_accident,
        parse_json_boolean(b.inputs->>'t_burns') IS TRUE AS t_burns,
        parse_json_boolean(b.inputs->>'t_suspected_tb') IS TRUE AS t_suspected_tb,
        parse_json_boolean(b.inputs->>'t_dermatosis') IS TRUE AS t_dermatosis,
        parse_json_boolean(b.inputs->>'t_bloody_diarrhea') IS TRUE AS t_bloody_diarrhea,
        parse_json_boolean(b.inputs->>'t_urethral_discharge') IS TRUE AS t_urethral_discharge,
        parse_json_boolean(b.inputs->>'t_vaginal_discharge') IS TRUE AS t_vaginal_discharge,
        parse_json_boolean(b.inputs->>'t_loss_of_urine') IS TRUE AS t_loss_of_urine,
        parse_json_boolean(b.inputs->>'t_accidental_ingestion_caustic_products') IS TRUE AS t_accidental_ingestion_caustic_products,
        parse_json_boolean(b.inputs->>'t_food_poisoning') IS TRUE AS t_food_poisoning,
        parse_json_boolean(b.inputs->>'t_oral_and_dental_diseases') IS TRUE AS t_oral_and_dental_diseases,
        parse_json_boolean(b.inputs->>'t_dog_bites') IS TRUE AS t_dog_bites,
        parse_json_boolean(b.inputs->>'t_snake_bite') IS TRUE AS t_snake_bite,
        parse_json_boolean(b.inputs->>'t_parasitosis') IS TRUE AS t_parasitosis,
        parse_json_boolean(b.inputs->>'t_measles') IS TRUE AS t_measles,
        parse_json_boolean(b.inputs->>'t_trauma') IS TRUE AS t_trauma,
        parse_json_boolean(b.inputs->>'t_gender_based_violence') IS TRUE AS t_gender_based_violence,
        parse_json_boolean(b.inputs->>'t_vomit') IS TRUE AS t_vomit,
        parse_json_boolean(b.inputs->>'t_headaches') IS TRUE AS t_headaches,
        parse_json_boolean(b.inputs->>'t_abdominal_pain') IS TRUE AS t_abdominal_pain,
        parse_json_boolean(b.inputs->>'t_bleeding') IS TRUE AS t_bleeding,
        parse_json_boolean(b.inputs->>'t_feel_pain_injection') IS TRUE AS t_feel_pain_injection,
        parse_json_boolean(b.inputs->>'t_health_center_FP') IS TRUE AS t_health_center_FP,
        parse_json_boolean(b.inputs->>'t_cpn_not_done') IS TRUE AS t_cpn_not_done,
        parse_json_boolean(b.inputs->>'t_td1_not_done') IS TRUE AS t_td1_not_done,
        parse_json_boolean(b.inputs->>'t_td2_not_done') IS TRUE AS t_td2_not_done,
        parse_json_boolean(b.inputs->>'t_danger_sign') IS TRUE AS t_danger_sign,
        parse_json_boolean(b.inputs->>'t_fp_side_effect') IS TRUE AS t_fp_side_effect,
        parse_json_boolean(b.inputs->>'t_domestic_violence') IS TRUE AS t_domestic_violence,
        parse_json_boolean(b.inputs->>'t_afp') IS TRUE AS t_afp,
        parse_json_boolean(b.inputs->>'t_cholera') IS TRUE AS t_cholera,
        parse_json_boolean(b.inputs->>'t_other_problems') IS TRUE AS t_other_problems,
        
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

        CASE 
            WHEN jsonb_typeof(b.geolocation) = 'object'
            AND NULLIF(b.geolocation->>'latitude', '') IS NOT NULL
            AND NULLIF(b.geolocation->>'longitude', '') IS NOT NULL
            THEN b.geolocation
            ELSE NULL
        END::JSONB AS geolocation
        
    FROM 
        base b;
