import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class VaccinationDataView1742926164290 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  vaccination_data_view AS 
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


                    CASE WHEN a.doc->'fields'->>'vaccine_BCG' IS NOT NULL AND a.doc->'fields'->>'vaccine_BCG' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_BCG,
                    CASE WHEN a.doc->'fields'->>'vaccine_VPO_0' IS NOT NULL AND a.doc->'fields'->>'vaccine_VPO_0' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_VPO_0,
                    CASE WHEN a.doc->'fields'->>'vaccine_PENTA_1' IS NOT NULL AND a.doc->'fields'->>'vaccine_PENTA_1' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_PENTA_1,
                    CASE WHEN a.doc->'fields'->>'vaccine_VPO_1' IS NOT NULL AND a.doc->'fields'->>'vaccine_VPO_1' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_VPO_1,
                    CASE WHEN a.doc->'fields'->>'vaccine_PENTA_2' IS NOT NULL AND a.doc->'fields'->>'vaccine_PENTA_2' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_PENTA_2,
                    CASE WHEN a.doc->'fields'->>'vaccine_VPO_2' IS NOT NULL AND a.doc->'fields'->>'vaccine_VPO_2' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_VPO_2,
                    CASE WHEN a.doc->'fields'->>'vaccine_PENTA_3' IS NOT NULL AND a.doc->'fields'->>'vaccine_PENTA_3' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_PENTA_3,
                    CASE WHEN a.doc->'fields'->>'vaccine_VPO_3' IS NOT NULL AND a.doc->'fields'->>'vaccine_VPO_3' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_VPO_3,
                    CASE WHEN a.doc->'fields'->>'vaccine_VPI_1' IS NOT NULL AND a.doc->'fields'->>'vaccine_VPI_1' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_VPI_1,
                    CASE WHEN a.doc->'fields'->>'vaccine_VAR_1' IS NOT NULL AND a.doc->'fields'->>'vaccine_VAR_1' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_VAR_1,
                    CASE WHEN a.doc->'fields'->>'vaccine_VAA' IS NOT NULL AND a.doc->'fields'->>'vaccine_VAA' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_VAA,
                    CASE WHEN a.doc->'fields'->>'vaccine_VPI_2' IS NOT NULL AND a.doc->'fields'->>'vaccine_VPI_2' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_VPI_2,
                    CASE WHEN a.doc->'fields'->>'vaccine_MEN_A' IS NOT NULL AND a.doc->'fields'->>'vaccine_MEN_A' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_MEN_A,
                    CASE WHEN a.doc->'fields'->>'vaccine_VAR_2' IS NOT NULL AND a.doc->'fields'->>'vaccine_VAR_2' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS vaccine_VAR_2,
                    CASE WHEN a.doc->'fields'->>'is_birth_vaccine_ok' IS NOT NULL AND a.doc->'fields'->>'is_birth_vaccine_ok' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_birth_vaccine_ok,
                    CASE WHEN a.doc->'fields'->>'is_six_weeks_vaccine_ok' IS NOT NULL AND a.doc->'fields'->>'is_six_weeks_vaccine_ok' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_six_weeks_vaccine_ok,
                    CASE WHEN a.doc->'fields'->>'is_ten_weeks_vaccine_ok' IS NOT NULL AND a.doc->'fields'->>'is_ten_weeks_vaccine_ok' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_ten_weeks_vaccine_ok,
                    CASE WHEN a.doc->'fields'->>'is_forteen_weeks_vaccine_ok' IS NOT NULL AND a.doc->'fields'->>'is_forteen_weeks_vaccine_ok' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_forteen_weeks_vaccine_ok,
                    CASE WHEN a.doc->'fields'->>'is_nine_months_vaccine_ok' IS NOT NULL AND a.doc->'fields'->>'is_nine_months_vaccine_ok' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_nine_months_vaccine_ok,
                    CASE WHEN a.doc->'fields'->>'is_fifty_months_vaccine_ok' IS NOT NULL AND a.doc->'fields'->>'is_fifty_months_vaccine_ok' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_fifty_months_vaccine_ok,
                    CASE WHEN a.doc->'fields'->>'is_vaccine_referal' IS NOT NULL AND a.doc->'fields'->>'is_vaccine_referal' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_vaccine_referal,
                    CASE WHEN a.doc->'fields'->>'has_all_vaccine_done' IS NOT NULL AND a.doc->'fields'->>'has_all_vaccine_done' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_all_vaccine_done,


                    CASE WHEN a.doc->'fields'->>'no_BCG_reason' IS NOT NULL AND a.doc->'fields'->>'no_BCG_reason' <> '' 
                        THEN a.doc->'fields'->>'no_BCG_reason' 
                        ELSE NULL 
                    END::TEXT AS no_BCG_reason,
                    CASE WHEN a.doc->'fields'->>'no_VPO_0_reason' IS NOT NULL AND a.doc->'fields'->>'no_VPO_0_reason' <> '' 
                        THEN a.doc->'fields'->>'no_VPO_0_reason' 
                        ELSE NULL 
                    END::TEXT AS no_VPO_0_reason,
                    CASE WHEN a.doc->'fields'->>'no_PENTA_1_reason' IS NOT NULL AND a.doc->'fields'->>'no_PENTA_1_reason' <> '' 
                        THEN a.doc->'fields'->>'no_PENTA_1_reason' 
                        ELSE NULL 
                    END::TEXT AS no_PENTA_1_reason,
                    CASE WHEN a.doc->'fields'->>'no_VPO_1_reason' IS NOT NULL AND a.doc->'fields'->>'no_VPO_1_reason' <> '' 
                        THEN a.doc->'fields'->>'no_VPO_1_reason' 
                        ELSE NULL 
                    END::TEXT AS no_VPO_1_reason,
                    CASE WHEN a.doc->'fields'->>'no_PENTA_2_reason' IS NOT NULL AND a.doc->'fields'->>'no_PENTA_2_reason' <> '' 
                        THEN a.doc->'fields'->>'no_PENTA_2_reason' 
                        ELSE NULL 
                    END::TEXT AS no_PENTA_2_reason,
                    CASE WHEN a.doc->'fields'->>'no_VPO_2_reason' IS NOT NULL AND a.doc->'fields'->>'no_VPO_2_reason' <> '' 
                        THEN a.doc->'fields'->>'no_VPO_2_reason' 
                        ELSE NULL 
                    END::TEXT AS no_VPO_2_reason,
                    CASE WHEN a.doc->'fields'->>'no_PENTA_3_reason' IS NOT NULL AND a.doc->'fields'->>'no_PENTA_3_reason' <> '' 
                        THEN a.doc->'fields'->>'no_PENTA_3_reason' 
                        ELSE NULL 
                    END::TEXT AS no_PENTA_3_reason,
                    CASE WHEN a.doc->'fields'->>'no_VPO_3_reason' IS NOT NULL AND a.doc->'fields'->>'no_VPO_3_reason' <> '' 
                        THEN a.doc->'fields'->>'no_VPO_3_reason' 
                        ELSE NULL 
                    END::TEXT AS no_VPO_3_reason,
                    CASE WHEN a.doc->'fields'->>'no_VPI_1_reason' IS NOT NULL AND a.doc->'fields'->>'no_VPI_1_reason' <> '' 
                        THEN a.doc->'fields'->>'no_VPI_1_reason' 
                        ELSE NULL 
                    END::TEXT AS no_VPI_1_reason,
                    CASE WHEN a.doc->'fields'->>'no_VAR_1_reason' IS NOT NULL AND a.doc->'fields'->>'no_VAR_1_reason' <> '' 
                        THEN a.doc->'fields'->>'no_VAR_1_reason' 
                        ELSE NULL 
                    END::TEXT AS no_VAR_1_reason,
                    CASE WHEN a.doc->'fields'->>'no_VAA_reason' IS NOT NULL AND a.doc->'fields'->>'no_VAA_reason' <> '' 
                        THEN a.doc->'fields'->>'no_VAA_reason' 
                        ELSE NULL 
                    END::TEXT AS no_VAA_reason,
                    CASE WHEN a.doc->'fields'->>'no_VPI_2_reason' IS NOT NULL AND a.doc->'fields'->>'no_VPI_2_reason' <> '' 
                        THEN a.doc->'fields'->>'no_VPI_2_reason' 
                        ELSE NULL 
                    END::TEXT AS no_VPI_2_reason,
                    CASE WHEN a.doc->'fields'->>'no_MEN_A_reason' IS NOT NULL AND a.doc->'fields'->>'no_MEN_A_reason' <> '' 
                        THEN a.doc->'fields'->>'no_MEN_A_reason' 
                        ELSE NULL 
                    END::TEXT AS no_MEN_A_reason,
                    CASE WHEN a.doc->'fields'->>'no_VAR_2_reason' IS NOT NULL AND a.doc->'fields'->>'no_VAR_2_reason' <> '' 
                        THEN a.doc->'fields'->>'no_VAR_2_reason' 
                        ELSE NULL 
                    END::TEXT AS no_VAR_2_reason,


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
                    END AS geolocation,

                    f.name AS family_fullname, 
                    f.given_name AS family_name,
                    f.external_id AS family_code, 
                    
                    p.name AS child_name, 
                    p.external_id AS child_code, 
                    p.sex AS child_sex, 
                    p.phone AS child_phone, 

                    p.date_of_birth AS birth_date,
                    p.date_of_death AS death_date 

                FROM 
                    couchdb a

                LEFT JOIN 
                    family_view f ON COALESCE(a.doc->'fields'->>'household_id', '') <> '' AND (a.doc->'fields'->>'household_id')::UUID = f.id  

                LEFT JOIN 
                    patient_view p ON COALESCE(a.doc->'fields'->>'patient_id', '') <> '' AND (a.doc->'fields'->>'patient_id')::UUID = p.id 
                    
                WHERE
                    a.doc->>'form' IS NOT NULL
                    AND a.doc->'fields' IS NOT NULL 
                    AND a.doc->>'form' = 'vaccination_followup';     
            `);   

        await CreateViewIndex('vaccination_data_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('vaccination_data_view', queryRunner);
    }

}
