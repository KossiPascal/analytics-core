import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class RecoChwSupervisionView1742991192364 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS reco_chws_supervision_view AS 
                SELECT
                    (a.doc->>'_id')::UUID AS id,
                    (a.doc->>'_rev')::TEXT AS rev,
                    (a.doc->>'form')::TEXT AS form,

                    CASE WHEN a.doc->'fields'->'sup_grid'->>'has_activity_plan' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'has_activity_plan' IN ('yes', 'true', '1') 
                        THEN TRUE
                        ELSE NULL
                    END::BOOLEAN AS has_activity_plan,
                    CASE WHEN a.doc->'fields'->'sup_grid'->>'has_update_register' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'has_update_register' IN ('yes', 'true', '1') 
                        THEN TRUE
                        ELSE NULL
                    END::BOOLEAN AS has_update_register,
                    CASE WHEN a.doc->'fields'->'sup_grid'->>'continue_pregnant_census' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'continue_pregnant_census' IN ('yes', 'true', '1') 
                        THEN TRUE
                        ELSE NULL
                    END::BOOLEAN AS continue_pregnant_census,
                    CASE WHEN a.doc->'fields'->'sup_grid'->>'has_previous_month_meeting' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'has_previous_month_meeting' IN ('yes', 'true', '1') 
                        THEN TRUE
                        ELSE NULL
                    END::BOOLEAN AS has_previous_month_meeting,
                    CASE WHEN a.doc->'fields'->'sup_grid'->>'has_well_maintained_tools' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'has_well_maintained_tools' IN ('yes', 'true', '1') 
                        THEN TRUE
                        ELSE NULL
                    END::BOOLEAN AS has_well_maintained_tools,

                    CASE WHEN a.doc->'fields'->'sup_grid'->>'no_activity_plan_reason' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'no_activity_plan_reason' <> ''  
                        THEN a.doc->'fields'->'sup_grid'->>'no_activity_plan_reason'
                        ELSE NULL
                    END::TEXT AS no_activity_plan_reason,
                    CASE WHEN a.doc->'fields'->'sup_grid'->>'no_update_register_reason' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'no_update_register_reason' <> ''  
                        THEN a.doc->'fields'->'sup_grid'->>'no_update_register_reason'
                        ELSE NULL
                    END::TEXT AS no_update_register_reason,
                    CASE WHEN a.doc->'fields'->'sup_grid'->>'no_pregnant_census_reason' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'no_pregnant_census_reason' <> ''  
                        THEN a.doc->'fields'->'sup_grid'->>'no_pregnant_census_reason'
                        ELSE NULL
                    END::TEXT AS no_pregnant_census_reason,
                    CASE WHEN a.doc->'fields'->'sup_grid'->>'no_meeting_reason' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'no_meeting_reason' <> ''  
                        THEN a.doc->'fields'->'sup_grid'->>'no_meeting_reason'
                        ELSE NULL
                    END::TEXT AS no_meeting_reason,
                    CASE WHEN a.doc->'fields'->'sup_grid'->>'bad_maintained_tools_reason' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'bad_maintained_tools_reason' <> ''  
                        THEN a.doc->'fields'->'sup_grid'->>'bad_maintained_tools_reason'
                        ELSE NULL
                    END::TEXT AS bad_maintained_tools_reason,

                    CASE WHEN a.doc->'fields'->'promo_activity'->>'vad_planned' IS NOT NULL AND a.doc->'fields'->'promo_activity'->>'vad_planned' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'promo_activity'->>'vad_planned' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS vad_planned,
                    CASE WHEN a.doc->'fields'->'promo_activity'->>'vad_carried' IS NOT NULL AND a.doc->'fields'->'promo_activity'->>'vad_carried' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'promo_activity'->>'vad_carried' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS vad_carried,
                    CASE WHEN a.doc->'fields'->'promo_activity'->>'ec_planned' IS NOT NULL AND a.doc->'fields'->'promo_activity'->>'ec_planned' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'promo_activity'->>'ec_planned' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS ec_planned,
                    CASE WHEN a.doc->'fields'->'promo_activity'->>'ec_carried' IS NOT NULL AND a.doc->'fields'->'promo_activity'->>'ec_carried' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'promo_activity'->>'ec_carried' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS ec_carried,
                    CASE WHEN a.doc->'fields'->'promo_activity'->>'num_active_search_sheet_given' IS NOT NULL AND a.doc->'fields'->'promo_activity'->>'num_active_search_sheet_given' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'promo_activity'->>'num_active_search_sheet_given' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS num_active_search_sheet_given,
                    CASE WHEN a.doc->'fields'->'promo_activity'->>'num_vaccinal_late_found_reffered' IS NOT NULL AND a.doc->'fields'->'promo_activity'->>'num_vaccinal_late_found_reffered' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'promo_activity'->>'num_vaccinal_late_found_reffered' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS num_vaccinal_late_found_reffered,
                    CASE WHEN a.doc->'fields'->'promo_activity'->>'num_women_anc_late' IS NOT NULL AND a.doc->'fields'->'promo_activity'->>'num_women_anc_late' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'promo_activity'->>'num_women_anc_late' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS num_women_anc_late,
                    CASE WHEN a.doc->'fields'->'promo_activity'->>'num_women_anc_referred' IS NOT NULL AND a.doc->'fields'->'promo_activity'->>'num_women_anc_referred' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'promo_activity'->>'num_women_anc_referred' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS num_women_anc_referred,
                    
                    CASE WHEN a.doc->'fields'->'checking_equipment'->>'android' IS NOT NULL AND a.doc->'fields'->'checking_equipment'->>'android' IN ('good', 'bad', 'not_available')
                        THEN a.doc->'fields'->'checking_equipment'->>'android'
                        ELSE NULL
                    END::TEXT AS android,
                    CASE WHEN a.doc->'fields'->'checking_equipment'->>'power_bank' IS NOT NULL AND a.doc->'fields'->'checking_equipment'->>'power_bank' IN ('good', 'bad', 'not_available')
                        THEN a.doc->'fields'->'checking_equipment'->>'power_bank'
                        ELSE NULL
                    END::TEXT AS power_bank,
                    CASE WHEN a.doc->'fields'->'checking_equipment'->>'visibility_kit' IS NOT NULL AND a.doc->'fields'->'checking_equipment'->>'visibility_kit' IN ('good', 'bad', 'not_available')
                        THEN a.doc->'fields'->'checking_equipment'->>'visibility_kit'
                        ELSE NULL
                    END::TEXT AS visibility_kit,
                    CASE WHEN a.doc->'fields'->'checking_equipment'->>'protection_kit' IS NOT NULL AND a.doc->'fields'->'checking_equipment'->>'protection_kit' IN ('good', 'bad', 'not_available')
                        THEN a.doc->'fields'->'checking_equipment'->>'protection_kit'
                        ELSE NULL
                    END::TEXT AS protection_kit,

                    CASE WHEN a.doc->'fields'->'g_household_sup'->>'followup_cible' IS NOT NULL AND a.doc->'fields'->'g_household_sup'->>'followup_cible' IN ('women_cpn1', 'newborn', 'none')
                        THEN a.doc->'fields'->'g_household_sup'->>'followup_cible'
                        ELSE NULL
                    END::TEXT AS followup_cible,
                    CASE WHEN a.doc->'fields'->'g_household_sup'->>'women_cpn1_followup_count' IS NOT NULL AND a.doc->'fields'->'g_household_sup'->>'women_cpn1_followup_count' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'g_household_sup'->>'women_cpn1_followup_count' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS women_cpn1_followup_count,
                    CASE WHEN a.doc->'fields'->'g_household_sup'->>'women_cpn1_followup_no_milda_count' IS NOT NULL AND a.doc->'fields'->'g_household_sup'->>'women_cpn1_followup_no_milda_count' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'g_household_sup'->>'women_cpn1_followup_no_milda_count' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS women_cpn1_followup_no_milda_count,
                    CASE WHEN a.doc->'fields'->'g_household_sup'->>'newborn_followup_count' IS NOT NULL AND a.doc->'fields'->'g_household_sup'->>'newborn_followup_count' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'g_household_sup'->>'newborn_followup_count' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS newborn_followup_count,
                    CASE WHEN a.doc->'fields'->'g_household_sup'->>'newborn_followup_no_milda_count' IS NOT NULL AND a.doc->'fields'->'g_household_sup'->>'newborn_followup_no_milda_count' <> ''  
                        THEN COALESCE(CAST(a.doc->'fields'->'g_household_sup'->>'newborn_followup_no_milda_count' AS BIGINT), 0)
                        ELSE NULL
                    END::BIGINT AS newborn_followup_no_milda_count,
                    CASE WHEN a.doc->'fields'->'g_household_sup'->>'supervision_difficulty' IS NOT NULL AND a.doc->'fields'->'g_household_sup'->>'supervision_difficulty' <> '' 
                        THEN a.doc->'fields'->'g_household_sup'->>'supervision_difficulty'
                        ELSE NULL
                    END::TEXT AS supervision_difficulty,
                    CASE 
                        WHEN a.doc->'fields'->'g_household_sup'->>'recommendation' IS NOT NULL AND a.doc->'fields'->'g_household_sup'->>'recommendation' <> '' 
                            THEN a.doc->'fields'->'g_household_sup'->>'recommendation'
                        WHEN a.doc->'fields'->'tracking_notebook'->>'recommendation' IS NOT NULL AND a.doc->'fields'->'tracking_notebook'->>'recommendation' <> '' 
                            THEN a.doc->'fields'->'tracking_notebook'->>'recommendation'
                        ELSE NULL
                    END::TEXT AS recommendation,
            

                    CASE WHEN a.doc->'fields'->'tracking_notebook'->>'supervisor' IS NOT NULL AND a.doc->'fields'->'tracking_notebook'->>'supervisor' IN ('chws', 'others')
                        THEN a.doc->'fields'->'tracking_notebook'->>'supervisor'
                        ELSE NULL
                    END::TEXT AS supervisor,
                    CASE WHEN a.doc->'fields'->'tracking_notebook'->>'other_supervisor' IS NOT NULL AND a.doc->'fields'->'tracking_notebook'->>'other_supervisor' <> '' 
                        THEN a.doc->'fields'->'tracking_notebook'->>'other_supervisor'
                        ELSE NULL
                    END::TEXT AS other_supervisor,
                    CASE WHEN a.doc->'fields'->'tracking_notebook'->>'findings' IS NOT NULL AND a.doc->'fields'->'tracking_notebook'->>'findings' <> '' 
                        THEN a.doc->'fields'->'tracking_notebook'->>'findings'
                        ELSE NULL
                    END::TEXT AS findings,
                    CASE WHEN a.doc->'fields'->'tracking_notebook'->>'actions_taken' IS NOT NULL AND a.doc->'fields'->'tracking_notebook'->>'actions_taken' <> '' 
                        THEN a.doc->'fields'->'tracking_notebook'->>'actions_taken'
                        ELSE NULL
                    END::TEXT AS actions_taken,


                    -- Location and report info
                    CASE 
                        WHEN a.doc->'fields'->>'country_id' IS NOT NULL AND a.doc->'fields'->>'country_id' <> '' 
                            THEN (a.doc->'fields'->>'country_id')::UUID 
                        ELSE NULL 
                    END AS country_id,
                    CASE 
                        WHEN a.doc->'fields'->>'region_id' IS NOT NULL AND a.doc->'fields'->>'region_id' <> '' 
                            THEN (a.doc->'fields'->>'region_id')::UUID 
                        ELSE NULL 
                    END AS region_id,
                    CASE 
                        WHEN a.doc->'fields'->>'prefecture_id' IS NOT NULL AND a.doc->'fields'->>'prefecture_id' <> '' 
                            THEN (a.doc->'fields'->>'prefecture_id')::UUID 
                        ELSE NULL 
                    END AS prefecture_id,
                    CASE 
                        WHEN a.doc->'fields'->>'commune_id' IS NOT NULL AND a.doc->'fields'->>'commune_id' <> '' 
                            THEN (a.doc->'fields'->>'commune_id')::UUID 
                        ELSE NULL 
                    END AS commune_id,
                    CASE 
                        WHEN a.doc->'fields'->>'hospital_id' IS NOT NULL AND a.doc->'fields'->>'hospital_id' <> '' 
                            THEN (a.doc->'fields'->>'hospital_id')::UUID 
                        ELSE NULL 
                    END AS hospital_id,
                    CASE 
                        WHEN a.doc->'fields'->>'district_quartier_id' IS NOT NULL AND a.doc->'fields'->>'district_quartier_id' <> '' 
                            THEN (a.doc->'fields'->>'district_quartier_id')::UUID 
                        ELSE NULL 
                    END AS district_quartier_id,
                    CASE 
                        WHEN a.doc->'fields'->>'village_secteur_id' IS NOT NULL AND a.doc->'fields'->>'village_secteur_id' <> '' 
                            THEN (a.doc->'fields'->>'village_secteur_id')::UUID 
                        WHEN a.doc->>'form' = 'supervision_notebook_reco' AND a.doc->'fields'->>'patient_id' IS NOT NULL AND a.doc->'fields'->>'patient_id' <> '' 
                            THEN (a.doc->'fields'->>'patient_id')::UUID 
                        ELSE NULL 
                    END AS village_secteur_id,
                    CASE 
                        WHEN a.doc->>'form' = 'supervision_notebook_reco' AND a.doc->'fields'->>'user_id' IS NOT NULL AND a.doc->'fields'->>'user_id' <> '' 
                            THEN (a.doc->'fields'->>'user_id')::UUID 
                        WHEN a.doc->>'form' IN ('supervision_grid', 'supervision_notebook_chws') AND a.doc->'fields'->>'patient_id' IS NOT NULL AND a.doc->'fields'->>'patient_id' <> '' 
                            THEN (a.doc->'fields'->>'patient_id')::UUID 
                        ELSE NULL 
                    END AS reco_id,
                    CASE 
                        WHEN a.doc->>'form' IN ('supervision_grid', 'supervision_notebook_chws') AND a.doc->'fields'->>'user_id' IS NOT NULL AND a.doc->'fields'->>'user_id' <> '' 
                            THEN (a.doc->'fields'->>'user_id')::UUID 
                        ELSE NULL 
                    END AS chw_id,

                    
                    CASE 
                        WHEN a.doc->'fields'->'sup_grid'->>'activity_date' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'activity_date' <> '' 
                            THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'sup_grid'->>'activity_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
                        WHEN a.doc->'fields'->'tracking_notebook'->>'folowup_date' IS NOT NULL AND a.doc->'fields'->'tracking_notebook'->>'folowup_date' <> '' 
                            THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'tracking_notebook'->>'folowup_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
                        ELSE NULL 
                    END::DATE AS reported_date,
                    CASE 
                        WHEN a.doc->'fields'->'sup_grid'->>'activity_date' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'activity_date' <> '' 
                            THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'sup_grid'->>'activity_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
                        WHEN a.doc->'fields'->'tracking_notebook'->>'folowup_date' IS NOT NULL AND a.doc->'fields'->'tracking_notebook'->>'folowup_date' <> '' 
                            THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'tracking_notebook'->>'folowup_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
                        ELSE NULL 
                    END::TIMESTAMP AS reported_full_date,
                    CASE 
                        WHEN a.doc->'fields'->'sup_grid'->>'activity_date' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'activity_date' <> '' 
                            THEN EXTRACT(EPOCH FROM TO_DATE(a.doc->'fields'->'sup_grid'->>'activity_date', 'YYYY-MM-DD'))
                        WHEN a.doc->'fields'->'tracking_notebook'->>'folowup_date' IS NOT NULL AND a.doc->'fields'->'tracking_notebook'->>'folowup_date' <> '' 
                            THEN EXTRACT(EPOCH FROM TO_DATE(a.doc->'fields'->'tracking_notebook'->>'folowup_date', 'YYYY-MM-DD')) 
                        ELSE NULL 
                    END::BIGINT AS reported_date_timestamp,
                    CASE 
                        WHEN a.doc->'fields'->'sup_grid'->>'activity_date' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'activity_date' <> '' 
                            THEN EXTRACT(YEAR FROM TO_TIMESTAMP(a.doc->'fields'->'sup_grid'->>'activity_date', 'YYYY-MM-DD HH24:MI:SS')) 
                        WHEN a.doc->'fields'->'tracking_notebook'->>'folowup_date' IS NOT NULL AND a.doc->'fields'->'tracking_notebook'->>'folowup_date' <> '' 
                            THEN EXTRACT(YEAR FROM TO_TIMESTAMP(a.doc->'fields'->'tracking_notebook'->>'folowup_date', 'YYYY-MM-DD HH24:MI:SS')) 
                        ELSE NULL 
                    END::BIGINT AS year,
                    CASE 
                        WHEN a.doc->'fields'->'sup_grid'->>'activity_date' IS NOT NULL AND a.doc->'fields'->'sup_grid'->>'activity_date' <> '' 
                            THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(a.doc->'fields'->'sup_grid'->>'activity_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
                        WHEN a.doc->'fields'->'tracking_notebook'->>'folowup_date' IS NOT NULL AND a.doc->'fields'->'tracking_notebook'->>'folowup_date' <> '' 
                            THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(a.doc->'fields'->'tracking_notebook'->>'folowup_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
                        ELSE NULL 
                    END::TEXT AS month,

                    CASE WHEN a.doc->>'geolocation' IS NULL OR a.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(a.doc->'geolocation') IS NOT NULL THEN (a.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation 
                FROM 
                    couchdb a
                WHERE
                    a.doc->>'form' IS NOT NULL
                    AND a.doc->'fields' IS NOT NULL 
                    AND a.doc->>'form' IN ('supervision_grid', 'supervision_notebook_reco', 'supervision_notebook_chws');  
                           
            `);

        await CreateViewIndex('reco_chws_supervision_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('reco_chws_supervision_view', queryRunner);
    }

}
