import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class FsMegDataView1742932667706 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            
            CREATE MATERIALIZED VIEW IF NOT EXISTS fs_meg_data_view AS 
                SELECT
                    (a.doc->>'_id')::UUID AS id,
                    (a.doc->>'_rev')::TEXT AS rev,
                    (a.doc->>'form')::TEXT AS form,
                    EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::BIGINT AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')::TEXT AS month,
                    
                    CASE WHEN a.doc->'fields'->>'action_date' IS NOT NULL AND a.doc->'fields'->>'action_date' <> ''
                        THEN a.doc->'fields'->>'action_date' 
                        ELSE NULL 
                    END::TEXT AS action_date,
                    CASE WHEN a.doc->'fields'->>'month_date_selected' IS NOT NULL AND a.doc->'fields'->>'month_date_selected' <> ''
                        THEN a.doc->'fields'->>'month_date_selected' 
                        ELSE NULL 
                    END::TEXT AS month_date_selected,
                    CASE WHEN a.doc->'fields'->'event_desease'->>'events' IS NOT NULL AND a.doc->'fields'->'event_desease'->>'events' <> '' 
                        AND (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['flood']) 
                        THEN (string_to_array(a.doc->'fields'->'event_desease'->>'events', ' ') @> ARRAY['flood']) 
                        ELSE NULL 
                    END::BOOLEAN AS is_flood,
                    CASE WHEN a.doc->'fields'->>'month_day' IS NOT NULL AND a.doc->'fields'->>'month_day' <> '' AND CAST(a.doc->'fields'->>'month_day' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'month_day' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS month_day,
                    CASE WHEN a.doc->'fields'->>'all_med_shortage_days_number' IS NOT NULL AND a.doc->'fields'->>'all_med_shortage_days_number' <> '' AND CAST(a.doc->'fields'->>'all_med_shortage_days_number' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'all_med_shortage_days_number' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS all_med_shortage_days_number,
                    CASE WHEN a.doc->'fields'->>'all_med_number' IS NOT NULL AND a.doc->'fields'->>'all_med_number' <> '' AND CAST(a.doc->'fields'->>'all_med_number' AS BIGINT) > 0 
                        THEN CAST(a.doc->'fields'->>'all_med_number' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS all_med_number,


                    CASE 
                        WHEN a.doc->'fields'->>'meg_average_out_of' IS NOT NULL AND a.doc->'fields'->>'meg_average_out_of' <> '' 
                        THEN CAST(a.doc->'fields'->>'meg_average_out_of' AS DOUBLE PRECISION) 
                        ELSE NULL 
                    END::DOUBLE PRECISION AS meg_average_out_of,

                    CASE 
                        WHEN a.doc->'fields'->>'meg_average_available' IS NOT NULL AND a.doc->'fields'->>'meg_average_available' <> '' 
                        THEN CAST(a.doc->'fields'->>'meg_average_available' AS DOUBLE PRECISION) 
                        ELSE NULL 
                    END::DOUBLE PRECISION AS meg_average_available,


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
                    CASE WHEN a.doc->'fields'->>'user_id' IS NOT NULL AND a.doc->'fields'->>'user_id' <> '' 
                        THEN a.doc->'fields'->>'user_id' 
                        ELSE NULL 
                    END::UUID AS hospital_manager_id,
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
                    AND a.doc->>'form' = 'fs_meg_situation';     
            `);               
            
        await CreateViewIndex('fs_meg_data_view', queryRunner);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('fs_meg_data_view', queryRunner);
    }

}
