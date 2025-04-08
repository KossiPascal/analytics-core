import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class PregnantDataView1742893111946 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  pregnant_data_view AS 
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
                    CASE WHEN a.doc->>'form' IN ('pregnancy_family_planning', 'pregnancy_register') THEN 'consultation'
                        WHEN a.doc->>'form' = 'prenatal_followup' THEN 'followup'
                        ELSE NULL
                    END AS consultation_followup,



                    CASE WHEN a.doc->'fields'->>'is_pregnant' IS NOT NULL AND a.doc->'fields'->>'is_pregnant' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_pregnant,
                    CASE WHEN a.doc->'fields'->>'is_cpn_late' IS NOT NULL AND a.doc->'fields'->>'is_cpn_late' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_cpn_late,
                    CASE WHEN a.doc->'fields'->>'is_pregnant_referred' IS NOT NULL AND a.doc->'fields'->>'is_pregnant_referred' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_pregnant_referred,
                    CASE WHEN a.doc->'fields'->>'has_danger_sign' IS NOT NULL AND a.doc->'fields'->>'has_danger_sign' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_danger_sign,
                    CASE WHEN a.doc->'fields'->>'is_referred' IS NOT NULL AND a.doc->'fields'->>'is_referred' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_referred,
                    CASE WHEN a.doc->'fields'->>'cpn_done' IS NOT NULL AND a.doc->'fields'->>'cpn_done' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS cpn_done,
                    CASE WHEN a.doc->'fields'->>'td1_done' IS NOT NULL AND a.doc->'fields'->>'td1_done' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS td1_done,
                    CASE WHEN a.doc->'fields'->>'td2_done' IS NOT NULL AND a.doc->'fields'->>'td2_done' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS td2_done,
                    CASE WHEN a.doc->'fields'->>'has_milda' IS NOT NULL AND a.doc->'fields'->>'has_milda' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_milda,
                    CASE WHEN a.doc->'fields'->>'is_home_delivery_wanted' IS NOT NULL AND a.doc->'fields'->>'is_home_delivery_wanted' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_home_delivery_wanted,
                    CASE WHEN a.doc->'fields'->>'is_closed' IS NOT NULL AND a.doc->'fields'->>'is_closed' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_closed,
                    CASE WHEN a.doc->'fields'->>'is_miscarriage_referred' IS NOT NULL AND a.doc->'fields'->>'is_miscarriage_referred' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_miscarriage_referred,



                    CASE WHEN a.doc->'fields'->>'next_cpn_visit_date' IS NOT NULL AND a.doc->'fields'->>'next_cpn_visit_date' <> '' 
                        THEN a.doc->'fields'->>'next_cpn_visit_date' 
                        ELSE NULL 
                    END::DATE AS next_cpn_visit_date,
                    CASE WHEN a.doc->'fields'->>'date_cpn1' IS NOT NULL AND a.doc->'fields'->>'date_cpn1' <> '' 
                        THEN a.doc->'fields'->>'date_cpn1' 
                        ELSE NULL 
                    END::DATE AS date_cpn1,
                    CASE WHEN a.doc->'fields'->>'date_cpn2' IS NOT NULL AND a.doc->'fields'->>'date_cpn2' <> '' 
                        THEN a.doc->'fields'->>'date_cpn2' 
                        ELSE NULL 
                    END::DATE AS date_cpn2,
                    CASE WHEN a.doc->'fields'->>'date_cpn3' IS NOT NULL AND a.doc->'fields'->>'date_cpn3' <> '' 
                        THEN a.doc->'fields'->>'date_cpn3' 
                        ELSE NULL 
                    END::DATE AS date_cpn3,
                    CASE WHEN a.doc->'fields'->>'date_cpn4' IS NOT NULL AND a.doc->'fields'->>'date_cpn4' <> '' 
                        THEN a.doc->'fields'->>'date_cpn4' 
                        ELSE NULL 
                    END::DATE AS date_cpn4,
                    CASE WHEN a.doc->'fields'->>'next_cpn_date' IS NOT NULL AND a.doc->'fields'->>'next_cpn_date' <> '' 
                        THEN a.doc->'fields'->>'next_cpn_date' 
                        ELSE NULL 
                    END::DATE AS next_cpn_date,
                    CASE WHEN a.doc->'fields'->>'delivery_place_wanted' IS NOT NULL AND a.doc->'fields'->>'delivery_place_wanted' <> '' 
                        THEN a.doc->'fields'->>'delivery_place_wanted' 
                        ELSE NULL 
                    END::TEXT AS delivery_place_wanted,
                    CASE WHEN a.doc->'fields'->>'close_reason' IS NOT NULL AND a.doc->'fields'->>'close_reason' <> '' 
                        THEN a.doc->'fields'->>'close_reason' 
                        ELSE NULL 
                    END::TEXT AS close_reason,
                    CASE WHEN a.doc->'fields'->>'close_reason_name' IS NOT NULL AND a.doc->'fields'->>'close_reason_name' <> '' 
                        THEN a.doc->'fields'->>'close_reason_name' 
                        ELSE NULL 
                    END::TEXT AS close_reason_name,



                    CASE WHEN a.doc->'fields'->>'cpn_number' IS NOT NULL AND a.doc->'fields'->>'cpn_number' <> '' AND CAST(a.doc->'fields'->>'cpn_number' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'cpn_number' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS cpn_number,
                    CASE WHEN a.doc->'fields'->>'cpn_next_number' IS NOT NULL AND a.doc->'fields'->>'cpn_next_number' <> '' AND CAST(a.doc->'fields'->>'cpn_next_number' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'cpn_next_number' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS cpn_next_number,
                    CASE WHEN a.doc->'fields'->>'cpn_already_count' IS NOT NULL AND a.doc->'fields'->>'cpn_already_count' <> '' AND CAST(a.doc->'fields'->>'cpn_already_count' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'cpn_already_count' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS cpn_already_count,


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
                        a.doc->>'form' IN ('prenatal_followup') OR (
                            a.doc->>'form' IN ('pregnancy_family_planning', 'pregnancy_register') AND 
                            a.doc->'fields'->>'is_pregnant' IS NOT NULL AND a.doc->'fields'->>'is_pregnant' IN ('true','yes','1') 
                        )
                    );     
        `);
        
        await CreateViewIndex('pregnant_data_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('pregnant_data_view', queryRunner);
    }

}
