import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class EventsDataView1742927290673 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  events_data_view AS 
                SELECT
                    (a.doc->>'_id')::UUID AS id,
                    (a.doc->>'_rev')::TEXT AS rev,
                    (a.doc->>'form')::TEXT AS form,
                    EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::BIGINT AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')::TEXT AS month,

                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        THEN string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ')
                        ELSE NULL 
                    END::TEXT[] AS event,

                    CASE WHEN a.doc->'fields'->'event_desease'->>'other_event' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'other_event' <> '' 
                        THEN a.doc->'fields'->'event_desease'->>'other_event' 
                        ELSE NULL 
                    END::TEXT AS other_event,
                    CASE WHEN a.doc->'fields'->'event_desease'->>'event_name' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'event_name' <> '' 
                        THEN a.doc->'fields'->'event_desease'->>'event_name' 
                        ELSE NULL 
                    END::TEXT AS event_name,
                    CASE WHEN a.doc->'fields'->'event_desease'->>'event_date' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'event_date' <> '' 
                        THEN a.doc->'fields'->'event_desease'->>'event_date' 
                        ELSE NULL 
                    END::TEXT AS event_date,
                    CASE WHEN a.doc->'fields'->'event_desease'->>'village_location_name' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'village_location_name' <> '' 
                        THEN a.doc->'fields'->'event_desease'->>'village_location_name' 
                        ELSE NULL 
                    END::TEXT AS village_location_name,
                    CASE WHEN a.doc->'fields'->'event_desease'->>'name_person_in_charge' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'name_person_in_charge' <> '' 
                        THEN a.doc->'fields'->'event_desease'->>'name_person_in_charge' 
                        ELSE NULL 
                    END::TEXT AS name_person_in_charge,
                    CASE WHEN a.doc->'fields'->'event_desease'->>'phone_person_in_charge' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'phone_person_in_charge' <> '' 
                        THEN a.doc->'fields'->'event_desease'->>'phone_person_in_charge' 
                        ELSE NULL 
                    END::TEXT AS phone_person_in_charge,
                    CASE WHEN a.doc->'fields'->'event_desease'->>'health_center_feedback_date' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'health_center_feedback_date' <> '' 
                        THEN a.doc->'fields'->'event_desease'->>'health_center_feedback_date' 
                        ELSE NULL 
                    END::TEXT AS health_center_feedback_date,
                    CASE WHEN a.doc->'fields'->'event_desease'->>'health_center_feedback_location' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'health_center_feedback_location' <> '' 
                        THEN a.doc->'fields'->'event_desease'->>'health_center_feedback_location' 
                        ELSE NULL 
                    END::TEXT AS feedback_manager,


                    -- Ajout des colonnes booléennes
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['flood']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['flood']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_flood,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['fire']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['fire']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_fire,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['shipwreck']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['shipwreck']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_shipwreck,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['landslide']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['landslide']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_landslide,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['grouped_animal_deaths']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['grouped_animal_deaths']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_grouped_animal_deaths,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['pfa']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['pfa']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_pfa,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['bloody_diarrhea']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['bloody_diarrhea']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_bloody_diarrhea,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['yellow_fever']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['yellow_fever']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_yellow_fever,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['cholera']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['cholera']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_cholera,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['maternal_and_neonatal_tetanus']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['maternal_and_neonatal_tetanus']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_maternal_and_neonatal_tetanus,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['viral_diseases']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['viral_diseases']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_viral_diseases,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['meningitis']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['meningitis']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_meningitis,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['maternal_deaths']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['maternal_deaths']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_maternal_deaths,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['community_deaths']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['community_deaths']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_community_deaths,
                    
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['influenza_fever']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['influenza_fever']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_influenza_fever,



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
                    CASE WHEN a.doc->'fields'->>'user_id' IS NOT NULL AND a.doc->'fields'->>'user_id' <> '' 
                        THEN a.doc->'fields'->>'user_id' 
                        ELSE NULL 
                    END::UUID AS reco_id,

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
                    AND a.doc->>'form' = 'event_register';     
            `);  
            
        await CreateViewIndex('events_data_view', queryRunner);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('events_data_view', queryRunner);
    }

}
