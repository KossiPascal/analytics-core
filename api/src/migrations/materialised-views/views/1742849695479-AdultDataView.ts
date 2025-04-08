import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class AdultDataView1742849695479 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  adult_data_view AS 
                SELECT
                    (a.doc->>'_id')::UUID AS id,
                    (a.doc->>'_rev')::TEXT AS rev,
                    (a.doc->>'form')::TEXT AS form,
                    EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::BIGINT AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')::TEXT AS month,
                    
                    -- Sex and birth info
                    CASE WHEN a.doc->'fields'->>'patient_sex' IN ('male', 'Male', 'homme', 'Homme', 'M') THEN 'M'
                        WHEN a.doc->'fields'->>'patient_sex' IN ('female', 'Female', 'femme', 'Femme', 'F') THEN 'F'
                        ELSE NULL
                    END::VARCHAR(1) AS sex,
                    CASE WHEN a.doc->'fields'->>'patient_date_of_birth' IS NOT NULL AND a.doc->'fields'->>'patient_date_of_birth' <> '' 
                        THEN a.doc->'fields'->>'patient_date_of_birth'
                        ELSE NULL
                    END::DATE AS date_of_birth,
                    CASE WHEN a.doc->'fields'->>'patient_age_in_years' IS NOT NULL AND a.doc->'fields'->>'patient_age_in_years' <> '' 
                        THEN CAST(a.doc->'fields'->>'patient_age_in_years' AS DOUBLE PRECISION)
                        ELSE NULL
                    END::DOUBLE PRECISION AS age_in_years,
                    CASE WHEN a.doc->'fields'->>'patient_age_in_months' IS NOT NULL AND a.doc->'fields'->>'patient_age_in_months' <> '' 
                        THEN CAST(a.doc->'fields'->>'patient_age_in_months' AS DOUBLE PRECISION)
                        ELSE NULL
                    END::DOUBLE PRECISION AS age_in_months,
                    CASE WHEN a.doc->'fields'->>'patient_age_in_days' IS NOT NULL AND a.doc->'fields'->>'patient_age_in_days' <> '' 
                        THEN CAST(a.doc->'fields'->>'patient_age_in_days' AS DOUBLE PRECISION)
                        ELSE NULL
                    END::DOUBLE PRECISION AS age_in_days,

                    -- Fields for the adult consultation form
                    CASE WHEN a.doc->>'form' = 'adult_consulation' THEN 'consultation'
                        WHEN a.doc->>'form' = 'adult_followup' THEN 'followup'
                        ELSE NULL
                    END AS consultation_followup,
                    
                    -- Other fields (Boolean transformations)
                    CASE WHEN a.doc->'fields'->>'promptitude' IS NOT NULL AND a.doc->'fields'->>'promptitude' <> '' 
                        THEN a.doc->'fields'->>'promptitude' 
                        ELSE NULL 
                    END::TEXT AS promptitude,

                    CASE WHEN a.doc->'fields'->>'is_pregnant' IS NOT NULL AND a.doc->'fields'->>'is_pregnant' IN ('true','yes','1') 
                        THEN TRUE
                        ELSE NULL 
                    END::BOOLEAN AS is_pregnant,

                    CASE WHEN a.doc->'fields'->>'has_malaria' IS NOT NULL AND a.doc->'fields'->>'has_malaria' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_malaria,

                    CASE WHEN a.doc->'fields'->>'has_fever' IS NOT NULL AND a.doc->'fields'->>'has_fever' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_fever,

                    CASE WHEN a.doc->'fields'->>'has_diarrhea' IS NOT NULL AND a.doc->'fields'->>'has_diarrhea' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_diarrhea,

                    CASE WHEN a.doc->'fields'->>'has_cough_cold' IS NOT NULL AND a.doc->'fields'->>'has_cough_cold' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_cough_cold,

                    CASE WHEN a.doc->'fields'->>'rdt_given' IS NOT NULL AND a.doc->'fields'->>'rdt_given' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS rdt_given,

                    CASE WHEN a.doc->'fields'->>'rdt_result' IS NOT NULL AND a.doc->'fields'->>'rdt_result' <> '' 
                        THEN a.doc->'fields'->>'rdt_result' 
                        ELSE NULL 
                    END::TEXT AS rdt_result,

                    CASE WHEN a.doc->'fields'->>'is_referred' IS NOT NULL AND a.doc->'fields'->>'is_referred' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_referred,

                    -- Medication quantities (assuming they are numeric)
                    
                    CASE WHEN a.doc->'fields'->>'cta_nn_quantity' IS NOT NULL AND a.doc->'fields'->>'cta_nn_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'cta_nn_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'cta_nn_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS cta_nn,
                    
                    CASE WHEN a.doc->'fields'->>'cta_pe_quantity' IS NOT NULL AND a.doc->'fields'->>'cta_pe_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'cta_pe_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'cta_pe_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS cta_pe,
                    
                    CASE WHEN a.doc->'fields'->>'cta_ge_quantity' IS NOT NULL AND a.doc->'fields'->>'cta_ge_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'cta_ge_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'cta_ge_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS cta_ge,
                    
                    CASE WHEN a.doc->'fields'->>'cta_ad_quantity' IS NOT NULL AND a.doc->'fields'->>'cta_ad_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'cta_ad_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'cta_ad_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS cta_ad,
                    
                    CASE WHEN a.doc->'fields'->>'amoxicillin_250mg_quantity' IS NOT NULL AND a.doc->'fields'->>'amoxicillin_250mg_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'amoxicillin_250mg_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'amoxicillin_250mg_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS amoxicillin_250mg,
                    
                    CASE WHEN a.doc->'fields'->>'amoxicillin_500mg_quantity' IS NOT NULL AND a.doc->'fields'->>'amoxicillin_500mg_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'amoxicillin_500mg_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'amoxicillin_500mg_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS amoxicillin_500mg,
                    
                    CASE WHEN a.doc->'fields'->>'paracetamol_100mg_quantity' IS NOT NULL AND a.doc->'fields'->>'paracetamol_100mg_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'paracetamol_100mg_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'paracetamol_100mg_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS paracetamol_100mg,
                    
                    CASE WHEN a.doc->'fields'->>'paracetamol_250mg_quantity' IS NOT NULL AND a.doc->'fields'->>'paracetamol_250mg_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'paracetamol_250mg_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'paracetamol_250mg_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS paracetamol_250mg,
                    
                    CASE WHEN a.doc->'fields'->>'paracetamol_500mg_quantity' IS NOT NULL AND a.doc->'fields'->>'paracetamol_500mg_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'paracetamol_500mg_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'paracetamol_500mg_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS paracetamol_500mg,
                    
                    CASE WHEN a.doc->'fields'->>'mebendazole_250mg_quantity' IS NOT NULL AND a.doc->'fields'->>'mebendazole_250mg_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'mebendazole_250mg_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'mebendazole_250mg_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS mebendazole_250mg,
                    
                    CASE WHEN a.doc->'fields'->>'mebendazole_500mg_quantity' IS NOT NULL AND a.doc->'fields'->>'mebendazole_500mg_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'mebendazole_500mg_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'mebendazole_500mg_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS mebendazole_500mg,
                    
                    CASE WHEN a.doc->'fields'->>'ors_quantity' IS NOT NULL AND a.doc->'fields'->>'ors_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'ors_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'ors_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS ors,
                    
                    CASE WHEN a.doc->'fields'->>'zinc_quantity' IS NOT NULL AND a.doc->'fields'->>'zinc_quantity' <> '' 
                        AND CAST(a.doc->'fields'->>'zinc_quantity' AS DOUBLE PRECISION) > 0 
                        THEN CAST(a.doc->'fields'->>'zinc_quantity' AS DOUBLE PRECISION) 
                        ELSE NULL
                    END::DOUBLE PRECISION AS zinc,

                    -- Various visit motifs, transforming to boolean
                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                        THEN string_to_array(a.doc->'fields'->>'visit_motif', ' ')  
                        ELSE NULL 
                    END::TEXT[] AS visit_motifs,

                    -- Various visit motifs, transforming to boolean
                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'malaria' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS malaria,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'fever' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS fever,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'diarrhea' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS diarrhea,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'yellow_fever' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS yellow_fever,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'tetanus' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS tetanus,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'cough_or_cold' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS cough_or_cold,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'viral_diseases' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS viral_diseases,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'acute_flaccid_paralysis' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS acute_flaccid_paralysis,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'meningitis' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS meningitis,




                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'miscarriage' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS miscarriage,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'traffic_accident' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS traffic_accident,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'burns' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS burns,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'suspected_tb' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS suspected_tb,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'dermatosis' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS dermatosis,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'bloody_diarrhea' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS bloody_diarrhea,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'urethral_discharge' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS urethral_discharge,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'vaginal_discharge' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS vaginal_discharge,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'loss_of_urine' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS loss_of_urine,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'accidental_ingestion_caustic_products' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS accidental_ingestion_caustic_products,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'food_poisoning' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS food_poisoning,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'oral_and_dental_diseases' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS oral_and_dental_diseases,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'dog_bites' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS dog_bites,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'snake_bite' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS snake_bite,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'parasitosis' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS parasitosis,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'measles' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS measles,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'trauma' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS trauma,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'gender_based_violence' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS gender_based_violence,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'vomit' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS vomit,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'headaches' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS headaches,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'abdominal_pain' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS abdominal_pain,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'bleeding' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS bleeding,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'feel_pain_injection' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS feel_pain_injection,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'health_center_FP' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS health_center_FP,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'cpn_done' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS cpn_done,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'td1_done' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS td1_done,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'td2_done' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS td2_done,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'danger_sign' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS danger_sign,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'fp_side_effect' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS fp_side_effect,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'domestic_violence' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS domestic_violence,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'afp' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS afp,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'cholera' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN TRUE 
                        ELSE FALSE 
                    END AS cholera,

                    CASE WHEN a.doc->'fields'->>'visit_motif' IS NOT NULL 
                            AND a.doc->'fields'->>'visit_motif' <> ''
                            AND 'others' = ANY(string_to_array(a.doc->'fields'->>'visit_motif', ' ')) 
                        THEN a.doc->'fields'->>'other_motif' 
                        ELSE NULL 
                    END::TEXT AS other_problems,

                    
                    -- Location and report info
                    CASE WHEN a.doc->'fields'->>'country_id' IS NOT NULL AND a.doc->'fields'->>'country_id' <> '' 
                        THEN a.doc->'fields'->>'country_id' 
                        ELSE NULL 
                    END::UUID AS country_id,
                    CASE WHEN a.doc->'fields'->>'region_id' IS NOT NULL AND a.doc->'fields'->>'region_id' <> '' 
                        THEN a.doc->'fields'->>'region_id' 
                        ELSE NULL 
                    END::UUID AS region_id,
                    CASE WHEN a.doc->'fields'->>'prefecture_id' IS NOT NULL AND a.doc->'fields'->>'prefecture_id' <> '' 
                        THEN a.doc->'fields'->>'prefecture_id' 
                        ELSE NULL 
                    END::UUID AS prefecture_id,
                    CASE WHEN a.doc->'fields'->>'commune_id' IS NOT NULL AND a.doc->'fields'->>'commune_id' <> '' 
                        THEN a.doc->'fields'->>'commune_id' 
                        ELSE NULL 
                    END::UUID AS commune_id,
                    CASE WHEN a.doc->'fields'->>'hospital_id' IS NOT NULL AND a.doc->'fields'->>'hospital_id' <> '' 
                        THEN a.doc->'fields'->>'hospital_id' 
                        ELSE NULL 
                    END::UUID AS hospital_id,
                    CASE WHEN a.doc->'fields'->>'district_quartier_id' IS NOT NULL AND a.doc->'fields'->>'district_quartier_id' <> '' 
                        THEN a.doc->'fields'->>'district_quartier_id' 
                        ELSE NULL 
                    END::UUID AS district_quartier_id,
                    CASE WHEN a.doc->'fields'->>'village_secteur_id' IS NOT NULL AND a.doc->'fields'->>'village_secteur_id' <> '' 
                        THEN a.doc->'fields'->>'village_secteur_id' 
                        ELSE NULL 
                    END::UUID AS village_secteur_id,
                    CASE WHEN a.doc->'fields'->>'household_id' IS NOT NULL AND a.doc->'fields'->>'household_id' <> '' 
                        THEN a.doc->'fields'->>'household_id' 
                        ELSE NULL 
                    END::UUID AS family_id,
                    CASE WHEN a.doc->'fields'->>'user_id' IS NOT NULL AND a.doc->'fields'->>'user_id' <> '' 
                        THEN a.doc->'fields'->>'user_id' 
                        ELSE NULL 
                    END::UUID AS reco_id,
                    CASE WHEN a.doc->'fields'->>'patient_id' IS NOT NULL AND a.doc->'fields'->>'patient_id' <> '' 
                        THEN a.doc->'fields'->>'patient_id' 
                        ELSE NULL 
                    END::UUID AS patient_id,

                    CAST(a.doc->>'reported_date' AS BIGINT) AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((a.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((a.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    CASE WHEN a.doc->>'geolocation' IS NULL OR a.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(a.doc->'geolocation') IS NOT NULL THEN (a.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation 
                FROM 
                    couchdb a
                WHERE
                    a.doc->>'form' IS NOT NULL
                    AND a.doc->'fields' IS NOT NULL 
                    AND a.doc->>'form' IN ('adult_consulation', 'adult_followup');
        `);

        await CreateViewIndex('adult_data_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('adult_data_view', queryRunner);
    }

}
