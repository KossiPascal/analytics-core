import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class NewbornDataView1742896745518 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  newborn_data_view AS 
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
                    CASE WHEN a.doc->'fields'->>'patient_date_of_birth' IS NOT NULL AND a.doc->'fields'->>'patient_date_of_birth' <> '' THEN
                            a.doc->'fields'->>'patient_date_of_birth'
                        ELSE NULL
                    END::DATE AS date_of_birth,
                    CASE WHEN a.doc->'fields'->>'patient_age_in_years' IS NOT NULL AND a.doc->'fields'->>'patient_age_in_years' <> '' THEN
                            CAST(a.doc->'fields'->>'patient_age_in_years' AS DOUBLE PRECISION)
                        ELSE NULL
                    END::DOUBLE PRECISION AS age_in_years,
                    CASE WHEN a.doc->'fields'->>'patient_age_in_months' IS NOT NULL AND a.doc->'fields'->>'patient_age_in_months' <> '' THEN
                            CAST(a.doc->'fields'->>'patient_age_in_months' AS DOUBLE PRECISION)
                        ELSE NULL
                    END::DOUBLE PRECISION AS age_in_months,
                    CASE WHEN a.doc->'fields'->>'patient_age_in_days' IS NOT NULL AND a.doc->'fields'->>'patient_age_in_days' <> '' THEN
                            CAST(a.doc->'fields'->>'patient_age_in_days' AS DOUBLE PRECISION)
                        ELSE NULL
                    END::DOUBLE PRECISION AS age_in_days,
                    CASE WHEN a.doc->>'form' = 'newborn_register' THEN 'consultation'
                        WHEN a.doc->>'form' = 'newborn_followup' THEN 'followup'
                        ELSE NULL
                    END AS consultation_followup,


                    CASE WHEN a.doc->'fields'->>'is_referred' IS NOT NULL AND a.doc->'fields'->>'is_referred' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_referred,
                    CASE WHEN a.doc->'fields'->>'has_danger_sign' IS NOT NULL AND a.doc->'fields'->>'has_danger_sign' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_danger_sign,
                    CASE WHEN a.doc->'fields'->>'has_unable_to_suckle' IS NOT NULL AND a.doc->'fields'->>'has_unable_to_suckle' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_unable_to_suckle,
                    CASE WHEN a.doc->'fields'->>'has_vomits_everything_consumes' IS NOT NULL AND a.doc->'fields'->>'has_vomits_everything_consumes' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_vomits_everything_consumes,
                    CASE WHEN a.doc->'fields'->>'has_convulsion' IS NOT NULL AND a.doc->'fields'->>'has_convulsion' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_convulsion,
                    CASE WHEN a.doc->'fields'->>'has_sleepy_unconscious' IS NOT NULL AND a.doc->'fields'->>'has_sleepy_unconscious' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_sleepy_unconscious,
                    CASE WHEN a.doc->'fields'->>'has_stiff_neck' IS NOT NULL AND a.doc->'fields'->>'has_stiff_neck' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_stiff_neck,
                    CASE WHEN a.doc->'fields'->>'has_domed_fontanelle' IS NOT NULL AND a.doc->'fields'->>'has_domed_fontanelle' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_domed_fontanelle,
                    CASE WHEN a.doc->'fields'->>'has_breathe_hard' IS NOT NULL AND a.doc->'fields'->>'has_breathe_hard' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_breathe_hard,
                    CASE WHEN a.doc->'fields'->>'has_subcostal_indrawing' IS NOT NULL AND a.doc->'fields'->>'has_subcostal_indrawing' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_subcostal_indrawing,
                    CASE WHEN a.doc->'fields'->>'has_wheezing' IS NOT NULL AND a.doc->'fields'->>'has_wheezing' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_wheezing,
                    CASE WHEN a.doc->'fields'->>'has_diarrhea' IS NOT NULL AND a.doc->'fields'->>'has_diarrhea' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_diarrhea,
                    CASE WHEN a.doc->'fields'->>'has_malnutrition' IS NOT NULL AND a.doc->'fields'->>'has_malnutrition' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_malnutrition,
                    CASE WHEN a.doc->'fields'->>'has_others_heath_problem' IS NOT NULL AND a.doc->'fields'->>'has_others_heath_problem' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_others_heath_problem,
                    CASE WHEN a.doc->'fields'->>'has_malaria' IS NOT NULL AND a.doc->'fields'->>'has_malaria' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_malaria,
                    CASE WHEN a.doc->'fields'->>'has_pneumonia' IS NOT NULL AND a.doc->'fields'->>'has_pneumonia' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_pneumonia,
                    CASE WHEN a.doc->'fields'->>'has_cough_cold' IS NOT NULL AND a.doc->'fields'->>'has_cough_cold' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_cough_cold,
                    CASE WHEN a.doc->'fields'->>'has_pre_reference_treatments' IS NOT NULL AND a.doc->'fields'->>'has_pre_reference_treatments' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_pre_reference_treatments,
                    CASE WHEN a.doc->'fields'->>'referal_health_center' IS NOT NULL AND a.doc->'fields'->>'referal_health_center' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS referal_health_center,
                    CASE WHEN a.doc->'fields'->>'is_health_referred' IS NOT NULL AND a.doc->'fields'->>'is_health_referred' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_health_referred,
                    CASE WHEN a.doc->'fields'->>'has_new_complaint' IS NOT NULL AND a.doc->'fields'->>'has_new_complaint' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_new_complaint,
                    CASE WHEN a.doc->'fields'->>'coupon_available' IS NOT NULL AND a.doc->'fields'->>'coupon_available' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS coupon_available,
        
            
                    CASE WHEN a.doc->'fields'->>'promptitude' IS NOT NULL AND a.doc->'fields'->>'promptitude' <> '' 
                        THEN a.doc->'fields'->>'promptitude' 
                        ELSE NULL 
                    END::TEXT AS promptitude,
                    
                    CASE WHEN a.doc->'fields'->>'reference_pattern_other' IS NOT NULL AND a.doc->'fields'->>'reference_pattern_other' <> '' 
                        THEN a.doc->'fields'->>'reference_pattern_other' 
                        ELSE NULL 
                    END::TEXT AS reference_pattern_other,
                    CASE WHEN a.doc->'fields'->>'other_diseases' IS NOT NULL AND a.doc->'fields'->>'other_diseases' <> '' 
                        THEN a.doc->'fields'->>'other_diseases' 
                        ELSE NULL 
                    END::TEXT AS other_diseases,
                    CASE WHEN a.doc->'fields'->>'coupon_number' IS NOT NULL AND a.doc->'fields'->>'coupon_number' <> '' 
                        THEN a.doc->'fields'->>'coupon_number' 
                        ELSE NULL 
                    END::TEXT AS coupon_number,
            


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
                    AND a.doc->>'form' IN ('newborn_register', 'newborn_followup');     
            `);               
        await CreateViewIndex('newborn_data_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('newborn_data_view', queryRunner);
    }

}
