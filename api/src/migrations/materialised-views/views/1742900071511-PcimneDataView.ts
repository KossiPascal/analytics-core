import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class PcimneDataView1742900071511 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  pcimne_data_view AS 
                SELECT
                    (a.doc->>'_id')::UUID AS id,
                    (a.doc->>'_rev')::TEXT AS rev,
                    (a.doc->>'form')::TEXT AS form,
                    EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::BIGINT AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')::TEXT AS month,
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
                    CASE WHEN a.doc->>'form' = 'pcimne_register' THEN 'consultation'
                        WHEN a.doc->>'form' = 'pcimne_followup' THEN 'followup'
                        ELSE NULL
                    END AS consultation_followup,                    
                    -- Sex and birth info

                    CASE WHEN a.doc->'fields'->>'has_initial_danger_signs' IS NOT NULL AND a.doc->'fields'->>'has_initial_danger_signs' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_initial_danger_signs,
                    CASE WHEN a.doc->'fields'->>'has_fever' IS NOT NULL AND a.doc->'fields'->>'has_fever' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_fever,
                    CASE WHEN a.doc->'fields'->>'has_malaria' IS NOT NULL AND a.doc->'fields'->>'has_malaria' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_malaria,
                    CASE WHEN a.doc->'fields'->>'has_cough_cold' IS NOT NULL AND a.doc->'fields'->>'has_cough_cold' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_cough_cold,
                    CASE WHEN a.doc->'fields'->>'has_pneumonia' IS NOT NULL AND a.doc->'fields'->>'has_pneumonia' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_pneumonia,
                    CASE WHEN a.doc->'fields'->>'has_normal_respiratory_rate' IS NOT NULL AND a.doc->'fields'->>'has_normal_respiratory_rate' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_normal_respiratory_rate,
                    CASE WHEN a.doc->'fields'->>'has_diarrhea' IS NOT NULL AND a.doc->'fields'->>'has_diarrhea' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_diarrhea,
                    CASE WHEN a.doc->'fields'->>'has_malnutrition' IS NOT NULL AND a.doc->'fields'->>'has_malnutrition' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_malnutrition,

                    CASE WHEN a.doc->'fields'->>'has_modere_malnutrition' IS NOT NULL AND a.doc->'fields'->>'has_modere_malnutrition' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_modere_malnutrition,

                    CASE WHEN a.doc->'fields'->>'has_severe_malnutrition' IS NOT NULL AND a.doc->'fields'->>'has_severe_malnutrition' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_severe_malnutrition,

                    CASE WHEN a.doc->'fields'->>'has_afp' IS NOT NULL AND a.doc->'fields'->>'has_afp' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_afp,
                    CASE WHEN a.doc->'fields'->>'is_danger_signs_referral' IS NOT NULL AND a.doc->'fields'->>'is_danger_signs_referral' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_danger_signs_referral,
                    CASE WHEN a.doc->'fields'->>'is_fever_referal' IS NOT NULL AND a.doc->'fields'->>'is_fever_referal' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_fever_referal,
                    CASE WHEN a.doc->'fields'->>'is_cough_cold_referal' IS NOT NULL AND a.doc->'fields'->>'is_cough_cold_referal' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_cough_cold_referal,
                    CASE WHEN a.doc->'fields'->>'is_diarrhea_referal' IS NOT NULL AND a.doc->'fields'->>'is_diarrhea_referal' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_diarrhea_referal,
                    CASE WHEN a.doc->'fields'->>'is_malnutrition_referal' IS NOT NULL AND a.doc->'fields'->>'is_malnutrition_referal' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_malnutrition_referal,
                    CASE WHEN a.doc->'fields'->>'is_referred' IS NOT NULL AND a.doc->'fields'->>'is_referred' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_referred,
                    CASE WHEN a.doc->'fields'->>'rdt_given' IS NOT NULL AND a.doc->'fields'->>'rdt_given' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS rdt_given,
                    CASE WHEN a.doc->'fields'->>'unable_drink_breastfeed' IS NOT NULL AND a.doc->'fields'->>'unable_drink_breastfeed' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS unable_drink_breastfeed,
                    CASE WHEN a.doc->'fields'->>'vomits_everything' IS NOT NULL AND a.doc->'fields'->>'vomits_everything' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vomits_everything,
                    CASE WHEN a.doc->'fields'->>'convulsions' IS NOT NULL AND a.doc->'fields'->>'convulsions' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS convulsions,
                    CASE WHEN a.doc->'fields'->>'sleepy_unconscious' IS NOT NULL AND a.doc->'fields'->>'sleepy_unconscious' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS sleepy_unconscious,
                    CASE WHEN a.doc->'fields'->>'has_stiff_neck' IS NOT NULL AND a.doc->'fields'->>'has_stiff_neck' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_stiff_neck,
                    CASE WHEN a.doc->'fields'->>'has_bulging_fontanelle' IS NOT NULL AND a.doc->'fields'->>'has_bulging_fontanelle' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_bulging_fontanelle,
                    CASE WHEN a.doc->'fields'->>'breathing_difficulty' IS NOT NULL AND a.doc->'fields'->>'breathing_difficulty' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS breathing_difficulty,
                    CASE WHEN a.doc->'fields'->>'cough_more_than_14days' IS NOT NULL AND a.doc->'fields'->>'cough_more_than_14days' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS cough_more_than_14days,
                    CASE WHEN a.doc->'fields'->>'subcostal_indrawing' IS NOT NULL AND a.doc->'fields'->>'subcostal_indrawing' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS subcostal_indrawing,
                    CASE WHEN a.doc->'fields'->>'wheezing' IS NOT NULL AND a.doc->'fields'->>'wheezing' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS wheezing,
                    CASE WHEN a.doc->'fields'->>'bloody_diarrhea' IS NOT NULL AND a.doc->'fields'->>'bloody_diarrhea' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS bloody_diarrhea,
                    CASE WHEN a.doc->'fields'->>'diarrhea_more_than_14_days' IS NOT NULL AND a.doc->'fields'->>'diarrhea_more_than_14_days' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS diarrhea_more_than_14_days,
                    CASE WHEN a.doc->'fields'->>'blood_in_stool' IS NOT NULL AND a.doc->'fields'->>'blood_in_stool' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS blood_in_stool,
                    CASE WHEN a.doc->'fields'->>'restless' IS NOT NULL AND a.doc->'fields'->>'restless' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS restless,
                    CASE WHEN a.doc->'fields'->>'drinks_hungrily' IS NOT NULL AND a.doc->'fields'->>'drinks_hungrily' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS drinks_hungrily,
                    CASE WHEN a.doc->'fields'->>'sunken_eyes' IS NOT NULL AND a.doc->'fields'->>'sunken_eyes' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS sunken_eyes,
                    CASE WHEN a.doc->'fields'->>'has_edema' IS NOT NULL AND a.doc->'fields'->>'has_edema' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_edema,
                    CASE WHEN a.doc->'fields'->>'is_principal_referal' IS NOT NULL AND a.doc->'fields'->>'is_principal_referal' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_principal_referal,
                    CASE WHEN a.doc->'fields'->>'has_health_problem' IS NOT NULL AND a.doc->'fields'->>'has_health_problem' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_health_problem,
                    CASE WHEN a.doc->'fields'->>'has_serious_malaria' IS NOT NULL AND a.doc->'fields'->>'has_serious_malaria' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_serious_malaria,
                    CASE WHEN a.doc->'fields'->>'has_pre_reference_treatments' IS NOT NULL AND a.doc->'fields'->>'has_pre_reference_treatments' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_pre_reference_treatments,
                    CASE WHEN a.doc->'fields'->>'is_present' IS NOT NULL AND a.doc->'fields'->>'is_present' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_present,
                    CASE WHEN a.doc->'fields'->>'went_to_health_center' IS NOT NULL AND a.doc->'fields'->>'went_to_health_center' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS went_to_health_center,
                    CASE WHEN a.doc->'fields'->>'coupon_available' IS NOT NULL AND a.doc->'fields'->>'coupon_available' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS coupon_available,
                    CASE WHEN a.doc->'fields'->>'has_no_improvement' IS NOT NULL AND a.doc->'fields'->>'has_no_improvement' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_no_improvement,
                    CASE WHEN a.doc->'fields'->>'has_getting_worse' IS NOT NULL AND a.doc->'fields'->>'has_getting_worse' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_getting_worse,


                    CASE WHEN a.doc->'fields'->>'promptitude' IS NOT NULL AND a.doc->'fields'->>'promptitude' <> ''  
                        THEN a.doc->'fields'->>'promptitude'  
                        ELSE NULL 
                    END::TEXT AS promptitude,
                    
                    CASE WHEN a.doc->'fields'->>'cta_nn_quantity' IS NOT NULL AND a.doc->'fields'->>'cta_nn_quantity' <> '' AND CAST(a.doc->'fields'->>'cta_nn_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'cta_nn_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS cta_nn,
                    CASE WHEN a.doc->'fields'->>'cta_pe_quantity' IS NOT NULL AND a.doc->'fields'->>'cta_pe_quantity' <> '' AND CAST(a.doc->'fields'->>'cta_pe_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'cta_pe_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS cta_pe,
                    CASE WHEN a.doc->'fields'->>'cta_ge_quantity' IS NOT NULL AND a.doc->'fields'->>'cta_ge_quantity' <> '' AND CAST(a.doc->'fields'->>'cta_ge_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'cta_ge_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS cta_ge,
                    CASE WHEN a.doc->'fields'->>'cta_ad_quantity' IS NOT NULL AND a.doc->'fields'->>'cta_ad_quantity' <> '' AND CAST(a.doc->'fields'->>'cta_ad_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'cta_ad_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS cta_ad,
                    CASE WHEN a.doc->'fields'->>'amoxicillin_250mg_quantity' IS NOT NULL AND a.doc->'fields'->>'amoxicillin_250mg_quantity' <> '' AND CAST(a.doc->'fields'->>'amoxicillin_250mg_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'amoxicillin_250mg_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS amoxicillin_250mg,
                    CASE WHEN a.doc->'fields'->>'amoxicillin_500mg_quantity' IS NOT NULL AND a.doc->'fields'->>'amoxicillin_500mg_quantity' <> '' AND CAST(a.doc->'fields'->>'amoxicillin_500mg_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'amoxicillin_500mg_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS amoxicillin_500mg,
                    CASE WHEN a.doc->'fields'->>'paracetamol_100mg_quantity' IS NOT NULL AND a.doc->'fields'->>'paracetamol_100mg_quantity' <> '' AND CAST(a.doc->'fields'->>'paracetamol_100mg_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'paracetamol_100mg_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS paracetamol_100mg,
                    CASE WHEN a.doc->'fields'->>'paracetamol_250mg_quantity' IS NOT NULL AND a.doc->'fields'->>'paracetamol_250mg_quantity' <> '' AND CAST(a.doc->'fields'->>'paracetamol_250mg_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'paracetamol_250mg_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS paracetamol_250mg,
                    CASE WHEN a.doc->'fields'->>'paracetamol_500mg_quantity' IS NOT NULL AND a.doc->'fields'->>'paracetamol_500mg_quantity' <> '' AND CAST(a.doc->'fields'->>'paracetamol_500mg_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'paracetamol_500mg_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS paracetamol_500mg,
                    CASE WHEN a.doc->'fields'->>'mebendazole_250mg_quantity' IS NOT NULL AND a.doc->'fields'->>'mebendazole_250mg_quantity' <> '' AND CAST(a.doc->'fields'->>'mebendazole_250mg_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'mebendazole_250mg_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS mebendazol_250mg,
                    CASE WHEN a.doc->'fields'->>'mebendazole_500mg_quantity' IS NOT NULL AND a.doc->'fields'->>'mebendazole_500mg_quantity' <> '' AND CAST(a.doc->'fields'->>'mebendazole_500mg_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'mebendazole_500mg_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS mebendazol_500mg,
                    CASE WHEN a.doc->'fields'->>'ors_quantity' IS NOT NULL AND a.doc->'fields'->>'ors_quantity' <> '' AND CAST(a.doc->'fields'->>'ors_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'ors_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS ors,
                    CASE WHEN a.doc->'fields'->>'zinc_quantity' IS NOT NULL AND a.doc->'fields'->>'zinc_quantity' <> '' AND CAST(a.doc->'fields'->>'zinc_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'zinc_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS zinc,
                    CASE WHEN a.doc->'fields'->>'vitamin_a_quantity' IS NOT NULL AND a.doc->'fields'->>'vitamin_a_quantity' <> '' AND CAST(a.doc->'fields'->>'vitamin_a_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'vitamin_a_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS vitamin_a,
                    CASE WHEN a.doc->'fields'->>'tetracycline_ointment_quantity' IS NOT NULL AND a.doc->'fields'->>'tetracycline_ointment_quantity' <> '' AND CAST(a.doc->'fields'->>'tetracycline_ointment_quantity' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'tetracycline_ointment_quantity' AS BIGINT)  
                        ELSE NULL 
                    END::BIGINT AS tetracycline_ointment,



                    CASE WHEN a.doc->'fields'->>'rdt_result' IS NOT NULL AND a.doc->'fields'->>'rdt_result' <> '' 
                        THEN a.doc->'fields'->>'rdt_result' 
                        ELSE NULL 
                    END::TEXT AS rdt_result,
                    CASE WHEN a.doc->'fields'->>'absence_reasons' IS NOT NULL AND a.doc->'fields'->>'absence_reasons' <> '' 
                        THEN a.doc->'fields'->>'absence_reasons' 
                        ELSE NULL 
                    END::TEXT AS absence_reasons,
                    CASE WHEN a.doc->'fields'->>'coupon_number' IS NOT NULL AND a.doc->'fields'->>'coupon_number' <> '' 
                        THEN a.doc->'fields'->>'coupon_number' 
                        ELSE NULL 
                    END::TEXT AS coupon_number,

                    CASE WHEN a.doc->'fields'->>'temperature' IS NOT NULL AND a.doc->'fields'->>'temperature' <> '' 
                        THEN CAST(a.doc->'fields'->>'temperature' AS DOUBLE PRECISION) 
                        ELSE NULL 
                    END::DOUBLE PRECISION AS temperature,


            


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
                    AND a.doc->>'form' IN ('pcimne_register', 'pcimne_followup');     
            `);  

        await CreateViewIndex('pcimne_data_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('pcimne_data_view', queryRunner);
    }

}
