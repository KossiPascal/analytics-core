import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class ReferalDataView1742925711345 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  referal_data_view AS 
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
                    CASE WHEN a.doc->'fields'->>'is_referred' IS NOT NULL AND a.doc->'fields'->>'is_referred' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_referred,


                    CASE WHEN a.doc->'fields'->>'absence_reasons' IS NOT NULL AND a.doc->'fields'->>'absence_reasons' <> '' 
                        THEN a.doc->'fields'->>'absence_reasons' 
                        ELSE NULL 
                    END::TEXT AS absence_reasons,
                    
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
                    AND a.doc->>'form' = 'referral_followup';     
            `);   

        await CreateViewIndex('referal_data_view', queryRunner);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('referal_data_view', queryRunner);
    }

}
