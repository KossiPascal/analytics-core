import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class FamilyPlanningDataView1742886404330 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  family_planning_data_view AS 
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
                    CASE WHEN a.doc->>'form' IN ('pregnancy_family_planning', 'family_planning') THEN 'consultation'
                        WHEN a.doc->>'form' = 'fp_danger_sign_check' THEN 'danger_sign_check'
                        WHEN a.doc->>'form' = 'fp_renewal' THEN 'renewal'
                        ELSE NULL
                    END AS consultation_followup,



                    CASE WHEN a.doc->'fields'->>'has_counseling' IS NOT NULL AND a.doc->'fields'->>'has_counseling' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_counseling,
                    CASE WHEN a.doc->'fields'->>'already_use_method' IS NOT NULL AND a.doc->'fields'->>'already_use_method' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS already_use_method,
                    CASE WHEN a.doc->'fields'->>'is_currently_using_method' IS NOT NULL AND a.doc->'fields'->>'is_currently_using_method' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_currently_using_method,
                    CASE WHEN a.doc->'fields'->>'has_changed_method' IS NOT NULL AND a.doc->'fields'->>'has_changed_method' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_changed_method,
                    CASE WHEN a.doc->'fields'->>'want_renew_method' IS NOT NULL AND a.doc->'fields'->>'want_renew_method' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS want_renew_method,
                    CASE WHEN a.doc->'fields'->>'method_was_given' IS NOT NULL AND a.doc->'fields'->>'method_was_given' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS method_was_given,
                    CASE WHEN a.doc->'fields'->>'is_method_avaible_reco' IS NOT NULL AND a.doc->'fields'->>'is_method_avaible_reco' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_method_avaible_reco,
                    CASE WHEN a.doc->'fields'->>'is_fp_referred' IS NOT NULL AND a.doc->'fields'->>'is_fp_referred' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_fp_referal,
                    CASE WHEN a.doc->'fields'->>'has_health_problem' IS NOT NULL AND a.doc->'fields'->>'has_health_problem' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_health_problem,
                    CASE WHEN a.doc->'fields'->>'has_fever' IS NOT NULL AND a.doc->'fields'->>'has_fever' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_fever,
                    CASE WHEN a.doc->'fields'->>'has_vomit' IS NOT NULL AND a.doc->'fields'->>'has_vomit' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_vomit,
                    CASE WHEN a.doc->'fields'->>'has_headaches' IS NOT NULL AND a.doc->'fields'->>'has_headaches' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_headaches,
                    CASE WHEN a.doc->'fields'->>'has_abdominal_pain' IS NOT NULL AND a.doc->'fields'->>'has_abdominal_pain' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_abdominal_pain,
                    CASE WHEN a.doc->'fields'->>'has_bleeding' IS NOT NULL AND a.doc->'fields'->>'has_bleeding' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_bleeding,
                    CASE WHEN a.doc->'fields'->>'has_feel_pain_injection' IS NOT NULL AND a.doc->'fields'->>'has_feel_pain_injection' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_feel_pain_injection,
                    CASE WHEN a.doc->'fields'->>'has_secondary_effect' IS NOT NULL AND a.doc->'fields'->>'has_secondary_effect' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_secondary_effect,
                    CASE WHEN a.doc->'fields'->>'is_health_problem_referal' IS NOT NULL AND a.doc->'fields'->>'is_health_problem_referal' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_health_problem_referal,




                    CASE WHEN a.doc->'fields'->>'no_counseling_reasons' IS NOT NULL AND a.doc->'fields'->>'no_counseling_reasons' <> '' 
                        THEN a.doc->'fields'->>'no_counseling_reasons' 
                        ELSE NULL 
                    END::TEXT AS no_counseling_reasons,
                    CASE WHEN a.doc->'fields'->>'no_counseling_reasons_name' IS NOT NULL AND a.doc->'fields'->>'no_counseling_reasons_name' <> '' 
                        THEN a.doc->'fields'->>'no_counseling_reasons_name' 
                        ELSE NULL 
                    END::TEXT AS no_counseling_reasons_name,
                    CASE WHEN a.doc->'fields'->>'method_already_used' IS NOT NULL AND a.doc->'fields'->>'method_already_used' <> '' 
                        THEN a.doc->'fields'->>'method_already_used' 
                        ELSE NULL 
                    END::TEXT AS method_already_used,
                    CASE WHEN a.doc->'fields'->>'want_renew_method_date' IS NOT NULL AND a.doc->'fields'->>'want_renew_method_date' <> '' 
                        THEN a.doc->'fields'->>'want_renew_method_date' 
                        ELSE NULL 
                    END::DATE AS want_renew_method_date,
                    CASE WHEN a.doc->'fields'->>'refuse_renew_method_reasons' IS NOT NULL AND a.doc->'fields'->>'refuse_renew_method_reasons' <> '' 
                        THEN a.doc->'fields'->>'refuse_renew_method_reasons' 
                        ELSE NULL 
                    END::TEXT AS refuse_renew_method_reasons,
                    CASE WHEN a.doc->'fields'->>'refuse_renew_method_reasons_name' IS NOT NULL AND a.doc->'fields'->>'refuse_renew_method_reasons_name' <> '' 
                        THEN a.doc->'fields'->>'refuse_renew_method_reasons_name' 
                        ELSE NULL 
                    END::TEXT AS refuse_renew_method_reasons_name,
                    CASE WHEN a.doc->'fields'->>'new_method_wanted' IS NOT NULL AND a.doc->'fields'->>'new_method_wanted' <> '' 
                        THEN a.doc->'fields'->>'new_method_wanted' 
                        ELSE NULL 
                    END::TEXT AS new_method_wanted,
                    CASE WHEN a.doc->'fields'->>'who_will_give_method' IS NOT NULL AND a.doc->'fields'->>'who_will_give_method' <> '' 
                        THEN a.doc->'fields'->>'who_will_give_method' 
                        ELSE NULL 
                    END::TEXT AS who_will_give_method,
                    CASE WHEN a.doc->'fields'->>'method_start_date' IS NOT NULL AND a.doc->'fields'->>'method_start_date' <> '' 
                        THEN a.doc->'fields'->>'method_start_date' 
                        ELSE NULL 
                    END::DATE AS method_start_date,
                    CASE WHEN a.doc->'fields'->>'method_not_given_reason' IS NOT NULL AND a.doc->'fields'->>'method_not_given_reason' <> '' 
                        THEN a.doc->'fields'->>'method_not_given_reason' 
                        ELSE NULL 
                    END::TEXT AS method_not_given_reason,
                    CASE WHEN a.doc->'fields'->>'method_not_given_reason_name' IS NOT NULL AND a.doc->'fields'->>'method_not_given_reason_name' <> '' 
                        THEN a.doc->'fields'->>'method_not_given_reason_name' 
                        ELSE NULL 
                    END::TEXT AS method_not_given_reason_name,
                    CASE WHEN a.doc->'fields'->>'fp_method' IS NOT NULL AND a.doc->'fields'->>'fp_method' <> '' 
                        THEN a.doc->'fields'->>'fp_method' 
                        ELSE NULL 
                    END::TEXT AS fp_method,
                    CASE WHEN a.doc->'fields'->>'fp_method_name' IS NOT NULL AND a.doc->'fields'->>'fp_method_name' <> '' 
                        THEN a.doc->'fields'->>'fp_method_name' 
                        ELSE NULL 
                    END::TEXT AS fp_method_name,
                    CASE WHEN a.doc->'fields'->>'next_fp_renew_date' IS NOT NULL AND a.doc->'fields'->>'next_fp_renew_date' <> '' 
                        THEN a.doc->'fields'->>'next_fp_renew_date' 
                        ELSE NULL 
                    END::DATE AS next_fp_renew_date,
                    CASE WHEN a.doc->'fields'->>'other_health_problem_written' IS NOT NULL AND a.doc->'fields'->>'other_health_problem_written' <> '' 
                        THEN a.doc->'fields'->>'other_health_problem_written' 
                        ELSE NULL 
                    END::TEXT AS other_health_problem_written,
                    
                    

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
                    AND a.doc->'fields' IS NOT NULL AND (
                        a.doc->>'form' IN ('fp_danger_sign_check', 'fp_renewal') OR
                        a.doc->>'form' IN ('pregnancy_family_planning', 'family_planning') AND 
                        (a.doc->'fields'->>'is_pregnant' IS NULL OR a.doc->'fields'->>'is_pregnant' NOT IN ('true', 'yes', '1')) 
                    );     
        `);
        await CreateViewIndex('family_planning_data_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('family_planning_data_view', queryRunner);
    }
}


