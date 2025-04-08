import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class DeathDataView1742932725314 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  death_data_view AS 
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


                    CASE WHEN a.doc->'fields'->>'date_of_death' IS NOT NULL AND a.doc->'fields'->>'date_of_death' <> '' 
                        THEN a.doc->'fields'->>'date_of_death' 
                        ELSE NULL 
                    END::TEXT AS date_of_death,
                    CASE WHEN a.doc->'fields'->>'death_place' IS NOT NULL AND a.doc->'fields'->>'death_place' <> '' 
                        THEN a.doc->'fields'->>'death_place' 
                        ELSE NULL 
                    END::TEXT AS death_place,
                    CASE WHEN a.doc->'fields'->>'death_place_label' IS NOT NULL AND a.doc->'fields'->>'death_place_label' <> '' 
                        THEN a.doc->'fields'->>'death_place_label' 
                        ELSE NULL 
                    END::TEXT AS death_place_label,
                    CASE WHEN a.doc->'fields'->>'death_reason_label' IS NOT NULL AND a.doc->'fields'->>'death_reason_label' <> '' 
                        THEN a.doc->'fields'->>'death_reason_label' 
                        ELSE NULL 
                    END::TEXT AS death_reason_label,
                    
                    CASE WHEN a.doc->'fields'->>'is_maternal_death' IS NOT NULL AND a.doc->'fields'->>'is_maternal_death' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_maternal_death,
                    CASE WHEN a.doc->'fields'->>'is_home_death' IS NOT NULL AND a.doc->'fields'->>'is_home_death' IN ('true','yes','1') 
                        THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_home_death,


                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        THEN string_to_array(a.doc->'fields'->>'death_reason', ' ')
                        ELSE NULL 
                    END::TEXT[] AS death_reason,

                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['malaria']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['malaria']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_malaria,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['diarrhea']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['diarrhea']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_diarrhea,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['malnutrition']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['malnutrition']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_malnutrition,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['cough_cold']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['cough_cold']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_cough_cold,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['pneumonia']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['pneumonia']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_pneumonia,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['maternal_death']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['maternal_death']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_maternal_death,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['fever']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['fever']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_fever,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['yellow_fever']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['yellow_fever']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_yellow_fever,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['tetanus']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['tetanus']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_tetanus,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['viral_diseases']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['viral_diseases']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_viral_diseases,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['meningitis']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['meningitis']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_meningitis,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['miscarriage']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['miscarriage']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_miscarriage,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['traffic_accident']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['traffic_accident']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_traffic_accident,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['burns']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['burns']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_burns,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['tuberculosis']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['tuberculosis']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_tuberculosis,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['bloody_diarrhea']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['bloody_diarrhea']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_bloody_diarrhea,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['accidental_ingestion_caustic_products']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['accidental_ingestion_caustic_products']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_accidental_ingestion_caustic_products,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['food_poisoning']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['food_poisoning']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_food_poisoning,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['dog_bites']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['dog_bites']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_dog_bites,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['snake_bite']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['snake_bite']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_snake_bite,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['trauma']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['trauma']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_trauma,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['domestic_violence']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['domestic_violence']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_domestic_violence,
                    CASE WHEN a.doc->'fields'->>'death_reason' IS NOT NULL AND a.doc->'fields'->>'death_reason' <> '' 
                        AND (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['cholera']) 
                        THEN (string_to_array(a.doc->'fields'->>'death_reason', ' ') @> ARRAY['cholera']) 
                        ELSE NULL 
                    END::BOOLEAN AS has_cholera,


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
                    AND a.doc->>'form' = 'death_report';     
            `);     

        await CreateViewIndex('death_data_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('death_data_view', queryRunner);
    }

}
