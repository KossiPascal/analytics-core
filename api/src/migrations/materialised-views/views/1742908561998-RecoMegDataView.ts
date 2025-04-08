import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class RecoMegDataView1742908561998 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  reco_meg_data_view AS 
                SELECT
                    (a.doc->>'_id')::UUID AS id,
                    (a.doc->>'_rev')::TEXT AS rev,
                    (a.doc->>'form')::TEXT AS form,
                    
                    CASE WHEN a.doc->>'form' = 'stock_entry' THEN 'stock' 
                        WHEN a.doc->>'form' = 'stock_movement' THEN a.doc->'fields'->'meg_movement'->>'meg_movement_reason' 
                        WHEN a.doc->>'form' = 'drugs_management' THEN a.doc->'fields'->'meg_management'->>'meg_management_reason' 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                            THEN 'consumption' 
                        ELSE NULL 
                    END::TEXT AS meg_type,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'pilule_coc' <> '' 
                            AND a.doc->'fields'->'meg_quantity'->>'pilule_coc' IS NOT NULL 
                                THEN CAST(a.doc->'fields'->'meg_quantity'->>'pilule_coc' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                            AND a.doc->'fields'->>'method_was_given' IN ('true', 'yes', '1') 
                            AND a.doc->'fields'->>'fp_method' = 'pill_coc' AND a.doc->'fields'->>'method_months_count_1' IS NOT NULL 
                            AND a.doc->'fields'->>'method_months_count_1' <> '' 
                            AND CAST(a.doc->'fields'->>'method_months_count_1' AS BIGINT) > 0 
                                THEN CAST(a.doc->'fields'->>'method_months_count_1' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS pill_coc,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'pilule_cop' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'pilule_cop' <> '' 
                                THEN CAST(a.doc->'fields'->'meg_quantity'->>'pilule_cop' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                            AND a.doc->'fields'->>'method_was_given' IN ('true', 'yes', '1') 
                            AND a.doc->'fields'->>'fp_method' = 'pill_cop' AND a.doc->'fields'->>'method_months_count_1' IS NOT NULL 
                            AND a.doc->'fields'->>'method_months_count_1' <> '' 
                            AND CAST(a.doc->'fields'->>'method_months_count_1' AS BIGINT) > 0 
                                THEN CAST(a.doc->'fields'->>'method_months_count_1' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS pill_cop,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'condoms' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'condoms' <> '' 
                                THEN CAST(a.doc->'fields'->'meg_quantity'->>'condoms' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                            AND a.doc->'fields'->>'method_was_given' IN ('true', 'yes', '1') 
                            AND a.doc->'fields'->>'fp_method' = 'condoms' AND a.doc->'fields'->>'condoms_quantity_given' IS NOT NULL 
                            AND a.doc->'fields'->>'condoms_quantity_given' <> '' 
                            AND CAST(a.doc->'fields'->>'condoms_quantity_given' AS BIGINT) > 0 
                                THEN CAST(a.doc->'fields'->>'condoms_quantity_given' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS condoms,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'dmpa_sc' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'dmpa_sc' <> '' 
                                THEN CAST(a.doc->'fields'->'meg_quantity'->>'dmpa_sc' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                            AND a.doc->'fields'->>'method_was_given' IN ('true', 'yes', '1') 
                            AND a.doc->'fields'->>'fp_method' = 'dmpa_sc' 
                                THEN 1 
                        ELSE NULL 
                    END::BIGINT AS dmpa_sc,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'depo_provera_im' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'depo_provera_im' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'depo_provera_im' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'depo_provera_im' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS depo_provera_im,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'cycle_necklace' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'cycle_necklace' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'cycle_necklace' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'cycle_necklace' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS cycle_necklace,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'implant' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'implant' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'implant' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'implant' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS implant,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'diu' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'diu' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'diu' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'diu' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS diu,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'tubal_ligation' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'tubal_ligation' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'tubal_ligation' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'tubal_ligation' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS tubal_ligation,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'cta_nn' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'cta_nn' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'cta_nn' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'cta_nn' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'cta_nn_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'cta_nn_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'cta_nn_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'cta_nn_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS cta_nn,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'cta_pe' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'cta_pe' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'cta_pe' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'cta_pe' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'cta_pe_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'cta_pe_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'cta_pe_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'cta_pe_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS cta_pe,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'cta_ge' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'cta_ge' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'cta_ge' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'cta_ge' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'cta_ge_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'cta_ge_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'cta_ge_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'cta_ge_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS cta_ge,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'cta_ad' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'cta_ad' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'cta_ad' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'cta_ad' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'cta_ad_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'cta_ad_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'cta_ad_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'cta_ad_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS cta_ad,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'tdr' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'tdr' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'tdr' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'tdr' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'rdt_given' IS NOT NULL 
                            AND a.doc->'fields'->>'rdt_given' IN ('true', 'yes', '1')
                            THEN 1 
                        ELSE NULL 
                    END::BIGINT AS tdr,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'amoxicillin250_mg' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'amoxicillin250_mg' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'amoxicillin250_mg' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'amoxicillin250_mg' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'amoxicillin_250mg_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'amoxicillin_250mg_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'amoxicillin_250mg_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'amoxicillin_250mg_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS amoxicillin_250mg,
                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'amoxicillin500_mg' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'amoxicillin500_mg' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'amoxicillin500_mg' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'amoxicillin500_mg' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'amoxicillin_500mg_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'amoxicillin_500mg_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'amoxicillin_500mg_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'amoxicillin_500mg_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS amoxicillin_500mg,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'paracetamol250_mg' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'paracetamol250_mg' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'paracetamol250_mg' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'paracetamol250_mg' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'paracetamol_100mg_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'paracetamol_100mg_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'paracetamol_100mg_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'paracetamol_100mg_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS paracetamol_100mg,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'paracetamol250_mg' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'paracetamol250_mg' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'paracetamol250_mg' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'paracetamol250_mg' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'paracetamol_250mg_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'paracetamol_250mg_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'paracetamol_250mg_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'paracetamol_250mg_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS paracetamol_250mg,
                    
                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'paracetamol500_mg' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'paracetamol500_mg' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'paracetamol500_mg' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'paracetamol500_mg' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'paracetamol_500mg_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'paracetamol_500mg_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'paracetamol_500mg_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'paracetamol_500mg_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS paracetamol_500mg,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'mebendazol_250mg' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'mebendazol_250mg' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'mebendazol_250mg' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'mebendazol_250mg' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'mebendazole_250mg_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'mebendazole_250mg_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'mebendazole_250mg_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'mebendazole_250mg_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS mebendazol_250mg,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'mebendazol_500mg' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'mebendazol_500mg' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'mebendazol_500mg' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'mebendazol_500mg' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'mebendazole_500mg_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'mebendazole_500mg_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'mebendazole_500mg_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'mebendazole_500mg_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS mebendazol_500mg,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'ors' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'ors' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'ors' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'ors' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'ors_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'ors_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'ors_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'ors_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS ors,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'zinc' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'zinc' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'zinc' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'zinc' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'zinc_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'zinc_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'zinc_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'zinc_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS zinc,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'vitamin_a' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'vitamin_a' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'vitamin_a' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'vitamin_a' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'vitamin_a_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'vitamin_a_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'vitamin_a_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'vitamin_a_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS vitamin_a,

                    CASE WHEN a.doc->>'form' IN ('stock_entry', 'stock_movement', 'drugs_management') 
                            AND a.doc->'fields'->'meg_quantity'->>'tetracycline_ointment' IS NOT NULL 
                            AND a.doc->'fields'->'meg_quantity'->>'tetracycline_ointment' <> '' 
                            AND CAST(a.doc->'fields'->'meg_quantity'->>'tetracycline_ointment' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->'meg_quantity'->>'tetracycline_ointment' AS BIGINT) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation') 
                            AND a.doc->'fields'->>'tetracycline_ointment_quantity' IS NOT NULL 
                            AND a.doc->'fields'->>'tetracycline_ointment_quantity' <> '' 
                            AND CAST(a.doc->'fields'->>'tetracycline_ointment_quantity' AS BIGINT) > 0 
                            THEN CAST(a.doc->'fields'->>'tetracycline_ointment_quantity' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS tetracycline_ointment,

                    CASE WHEN a.doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                            THEN a.doc->'fields'->>'fp_method' 
                        ELSE NULL 
                    END::TEXT AS fp_method,

                    CASE WHEN a.doc->>'form' IN ('pregnancy_family_planning', 'family_planning') 
                            AND a.doc->'fields'->>'is_fp_referred' IS NOT NULL 
                            AND a.doc->'fields'->>'is_fp_referred' IN ('true', 'yes', '1') 
                            THEN TRUE 
                        WHEN a.doc->>'form' = 'fp_danger_sign_check' 
                            AND a.doc->'fields'->>'is_referred' IS NOT NULL 
                            AND a.doc->'fields'->>'is_referred' IN ('true', 'yes', '1') 
                            THEN TRUE 
                        WHEN a.doc->>'form' = 'fp_renewal' 
                            AND a.doc->'fields'->>'is_fp_referal' IS NOT NULL 
                            AND a.doc->'fields'->>'is_fp_referal' IN ('true', 'yes', '1') 
                            THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS is_fp_referred,

                    CASE WHEN a.doc->>'form' IN ('pregnancy_family_planning', 'family_planning', 'fp_renewal') 
                            AND a.doc->'fields'->>'has_fp_side_effect' IS NOT NULL 
                            AND a.doc->'fields'->>'has_fp_side_effect' IN ('true', 'yes', '1') 
                            THEN TRUE 
                        WHEN a.doc->>'form' = 'fp_danger_sign_check' 
                            AND a.doc->'fields'->>'has_secondary_effect' IS NOT NULL 
                            AND a.doc->'fields'->>'has_secondary_effect' IN ('true', 'yes', '1') 
                            THEN TRUE 
                        ELSE NULL 
                    END::BOOLEAN AS has_fp_side_effect,



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



                    CASE WHEN a.doc->>'form' = 'stock_entry' 
                            AND a.doc->'fields'->'meg_stock'->>'meg_stock_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_stock'->>'meg_stock_date' <> '' 
                                THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'meg_stock'->>'meg_stock_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
                        WHEN a.doc->>'form' = 'stock_movement' 
                            AND a.doc->'fields'->'meg_movement'->>'meg_movement_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_movement'->>'meg_movement_date' <> '' 
                                THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'meg_movement'->>'meg_movement_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
                        WHEN a.doc->>'form' = 'drugs_management' 
                            AND a.doc->'fields'->'meg_management'->>'meg_management_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_management'->>'meg_management_date' <> '' 
                                THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'meg_management'->>'meg_management_date', 'YYYY-MM-DD'), 'YYYY-MM-DD') 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                            THEN TO_CHAR(TO_TIMESTAMP((a.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD') 
                        ELSE NULL 
                    END::DATE AS reported_date,

                    CASE WHEN a.doc->>'form' = 'stock_entry' 
                            AND a.doc->'fields'->'meg_stock'->>'meg_stock_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_stock'->>'meg_stock_date' <> '' 
                                THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'meg_stock'->>'meg_stock_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
                        WHEN a.doc->>'form' = 'stock_movement' 
                            AND a.doc->'fields'->'meg_movement'->>'meg_movement_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_movement'->>'meg_movement_date' <> '' 
                                THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'meg_movement'->>'meg_movement_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
                        WHEN a.doc->>'form' = 'drugs_management' 
                            AND a.doc->'fields'->'meg_management'->>'meg_management_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_management'->>'meg_management_date' <> '' 
                                THEN TO_CHAR(TO_TIMESTAMP(a.doc->'fields'->'meg_management'->>'meg_management_date', 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                            THEN TO_CHAR(TO_TIMESTAMP((a.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS') 
                        ELSE NULL 
                    END::TIMESTAMP AS reported_full_date,


                    CASE WHEN a.doc->>'form' = 'stock_entry' 
                            AND a.doc->'fields'->'meg_stock'->>'meg_stock_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_stock'->>'meg_stock_date' <> '' 
                                THEN EXTRACT(EPOCH FROM TO_DATE(a.doc->'fields'->'meg_stock'->>'meg_stock_date', 'YYYY-MM-DD'))
                        WHEN a.doc->>'form' = 'stock_movement' 
                            AND a.doc->'fields'->'meg_movement'->>'meg_movement_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_movement'->>'meg_movement_date' <> '' 
                                THEN EXTRACT(EPOCH FROM TO_DATE(a.doc->'fields'->'meg_movement'->>'meg_movement_date', 'YYYY-MM-DD'))
                        WHEN a.doc->>'form' = 'drugs_management' 
                            AND a.doc->'fields'->'meg_management'->>'meg_management_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_management'->>'meg_management_date' <> '' 
                                THEN EXTRACT(EPOCH FROM TO_DATE(a.doc->'fields'->'meg_management'->>'meg_management_date', 'YYYY-MM-DD'))
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                            THEN CAST(a.doc->>'reported_date' AS BIGINT) 
                        ELSE NULL 
                    END::BIGINT AS reported_date_timestamp,

                    CASE WHEN a.doc->>'form' = 'stock_entry' 
                            AND a.doc->'fields'->'meg_stock'->>'meg_stock_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_stock'->>'meg_stock_date' <> '' 
                                THEN EXTRACT(YEAR FROM TO_TIMESTAMP(a.doc->'fields'->'meg_stock'->>'meg_stock_date', 'YYYY-MM-DD HH24:MI:SS')) 
                        WHEN a.doc->>'form' = 'stock_movement' 
                            AND a.doc->'fields'->'meg_movement'->>'meg_movement_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_movement'->>'meg_movement_date' <> '' 
                                THEN EXTRACT(YEAR FROM TO_TIMESTAMP(a.doc->'fields'->'meg_movement'->>'meg_movement_date', 'YYYY-MM-DD HH24:MI:SS')) 
                        WHEN a.doc->>'form' = 'drugs_management' 
                            AND a.doc->'fields'->'meg_management'->>'meg_management_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_management'->>'meg_management_date' <> '' 
                                THEN EXTRACT(YEAR FROM TO_TIMESTAMP(a.doc->'fields'->'meg_management'->>'meg_management_date', 'YYYY-MM-DD HH24:MI:SS')) 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                            THEN EXTRACT(YEAR FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))
                        ELSE NULL 
                    END::BIGINT AS year,

                    CASE WHEN a.doc->>'form' = 'stock_entry' 
                            AND a.doc->'fields'->'meg_stock'->>'meg_stock_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_stock'->>'meg_stock_date' <> '' 
                                THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(a.doc->'fields'->'meg_stock'->>'meg_stock_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
                        WHEN a.doc->>'form' = 'stock_movement' 
                            AND a.doc->'fields'->'meg_movement'->>'meg_movement_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_movement'->>'meg_movement_date' <> '' 
                                THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(a.doc->'fields'->'meg_movement'->>'meg_movement_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
                        WHEN a.doc->>'form' = 'drugs_management' 
                            AND a.doc->'fields'->'meg_management'->>'meg_management_date' IS NOT NULL 
                            AND a.doc->'fields'->'meg_management'->>'meg_management_date' <> '' 
                                THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(a.doc->'fields'->'meg_management'->>'meg_management_date', 'YYYY-MM-DD HH24:MI:SS'))::TEXT, 2, '0') 
                        WHEN a.doc->>'form' IN ('pcimne_register', 'adult_consulation', 'pregnancy_family_planning', 'family_planning', 'fp_renewal', 'fp_danger_sign_check') 
                            THEN LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP(CAST(a.doc->>'reported_date' AS BIGINT) / 1000))::TEXT, 2, '0')
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
                    AND a.doc->'fields' IS NOT NULL AND (
                        a.doc->>'form' IN ('drugs_management', 'stock_entry', 'stock_movement', 'pcimne_register', 'adult_consulation') OR (
                            a.doc->>'form' IN ('pregnancy_family_planning', 'family_planning') AND 
                            (a.doc->'fields'->>'is_pregnant' IS NULL OR a.doc->'fields'->>'is_pregnant' NOT IN ('true', 'yes', '1')) 
                        ) OR (
                            a.doc->>'form' = 'fp_renewal' AND a.doc->'fields'->>'fp_method' IS NOT NULL AND a.doc->'fields'->>'fp_method' <> '' 
                        ) OR (
                            a.doc->>'form' = 'fp_danger_sign_check'
                        )
                    );     
            `);  
        
        await CreateViewIndex('reco_meg_data_view', queryRunner);
    }
   
    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('reco_meg_data_view', queryRunner);
    }

}
