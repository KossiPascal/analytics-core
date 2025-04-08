import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class FamilyPlanningReportsView1743358631549 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS reports_family_planning_view AS
                SELECT 
                    CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
                    a.month AS month,
                    a.year AS year,
                    a.reco_id AS reco_id,
                            
                    jsonb_build_object(
                        'label', 'Pilule - COC',
                        'nbr_new_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'pill_coc' AND a.form IN ('pregnancy_family_planning', 'family_planning') AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS NOT TRUE),0)::BIGINT, 
                        'nbr_regular_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'pill_coc' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS TRUE),0)::BIGINT, 
                        'nbr_total_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'pill_coc' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE),0)::BIGINT, 
                        'nbr_delivered', (SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND meg_type = 'consumption' AND pill_coc IS NOT NULL AND pill_coc > 0)::BIGINT,
                        'nbr_in_stock', (
                            SELECT COALESCE(SUM(stock.pill_coc), 0) - COALESCE(SUM(consumption.pill_coc), 0) - COALESCE(SUM(loss.pill_coc), 0) - COALESCE(SUM(damaged.pill_coc), 0) - COALESCE(SUM(broken.pill_coc), 0) - COALESCE(SUM(expired.pill_coc), 0)
                            FROM reco_meg_data_view stock 
                            LEFT JOIN reco_meg_data_view consumption 
                                ON a.reco_id = consumption.reco_id AND a.month = consumption.month AND a.year = consumption.year AND consumption.meg_type = 'consumption'
                            LEFT JOIN reco_meg_data_view loss 
                                ON a.reco_id = loss.reco_id AND a.month = loss.month AND a.year = loss.year AND loss.meg_type = 'loss'
                            LEFT JOIN reco_meg_data_view damaged 
                                ON a.reco_id = damaged.reco_id AND a.month = damaged.month AND a.year = damaged.year AND damaged.meg_type = 'damaged'
                            LEFT JOIN reco_meg_data_view broken 
                                ON a.reco_id = broken.reco_id AND a.month = broken.month AND a.year = broken.year AND broken.meg_type = 'broken'
                            LEFT JOIN reco_meg_data_view expired 
                                ON a.reco_id = expired.reco_id AND a.month = expired.month AND a.year = expired.year AND expired.meg_type = 'expired'
                            WHERE stock.reco_id = a.reco_id AND stock.month = a.month AND stock.year = a.year AND stock.meg_type = 'stock'
                        )::BIGINT,
                        'nbr_referred', (SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'pill_coc' AND is_fp_referred IS TRUE)::BIGINT,
                        'nbr_side_effect', (SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'pill_coc' AND has_fp_side_effect IS TRUE)::BIGINT
                    ) AS pill_coc,

                     jsonb_build_object(
                        'label', 'Pilule - COP',
                        'nbr_new_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'pill_cop' AND a.form IN ('pregnancy_family_planning', 'family_planning') AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS NOT TRUE),0)::BIGINT, 
                        'nbr_regular_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'pill_cop' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS TRUE),0)::BIGINT, 
                        'nbr_total_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'pill_cop' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE),0)::BIGINT, 
                        'nbr_delivered', (SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND meg_type = 'consumption' AND pill_cop IS NOT NULL AND pill_cop > 0)::BIGINT,
                        'nbr_in_stock', (
                            SELECT COALESCE(SUM(stock.pill_cop), 0) - COALESCE(SUM(consumption.pill_cop), 0) - COALESCE(SUM(loss.pill_cop), 0) - COALESCE(SUM(damaged.pill_cop), 0) - COALESCE(SUM(broken.pill_cop), 0) - COALESCE(SUM(expired.pill_cop), 0)
                            FROM reco_meg_data_view stock
                            LEFT JOIN reco_meg_data_view consumption 
                                ON a.reco_id = consumption.reco_id AND a.month = consumption.month AND a.year = consumption.year AND consumption.meg_type = 'consumption'
                            LEFT JOIN reco_meg_data_view loss 
                                ON a.reco_id = loss.reco_id AND a.month = loss.month AND a.year = loss.year AND loss.meg_type = 'loss'
                            LEFT JOIN reco_meg_data_view damaged 
                                ON a.reco_id = damaged.reco_id AND a.month = damaged.month AND a.year = damaged.year AND damaged.meg_type = 'damaged'
                            LEFT JOIN reco_meg_data_view broken 
                                ON a.reco_id = broken.reco_id AND a.month = broken.month AND a.year = broken.year AND broken.meg_type = 'broken'
                            LEFT JOIN reco_meg_data_view expired 
                                ON a.reco_id = expired.reco_id AND a.month = expired.month AND a.year = expired.year AND expired.meg_type = 'expired'
                            WHERE stock.reco_id = a.reco_id AND stock.month = a.month AND stock.year = a.year AND stock.meg_type = 'stock'
                        )::BIGINT,
                        'nbr_referred', (SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'pill_cop' AND is_fp_referred IS TRUE)::BIGINT,
                        'nbr_side_effect', (SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'pill_cop' AND has_fp_side_effect IS TRUE)::BIGINT
                    ) AS pill_cop,

                     jsonb_build_object(
                        'label', 'Condoms/Preservatif',
                        'nbr_new_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'condoms' AND a.form IN ('pregnancy_family_planning', 'family_planning') AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS NOT TRUE),0)::BIGINT, 
                        'nbr_regular_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'condoms' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS TRUE),0)::BIGINT, 
                        'nbr_total_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'condoms' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE),0)::BIGINT, 
                        'nbr_delivered', (SELECT SUM(condoms) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND meg_type = 'consumption' AND condoms IS NOT NULL AND condoms > 0)::BIGINT,
                        'nbr_in_stock', (
                            SELECT COALESCE(SUM(stock.condoms), 0) - COALESCE(SUM(consumption.condoms), 0) - COALESCE(SUM(loss.condoms), 0) - COALESCE(SUM(damaged.condoms), 0) - COALESCE(SUM(broken.condoms), 0) - COALESCE(SUM(expired.condoms), 0)
                            FROM reco_meg_data_view stock
                            LEFT JOIN reco_meg_data_view consumption 
                                ON a.reco_id = consumption.reco_id AND a.month = consumption.month AND a.year = consumption.year AND consumption.meg_type = 'consumption'
                            LEFT JOIN reco_meg_data_view loss 
                                ON a.reco_id = loss.reco_id AND a.month = loss.month AND a.year = loss.year AND loss.meg_type = 'loss'
                            LEFT JOIN reco_meg_data_view damaged 
                                ON a.reco_id = damaged.reco_id AND a.month = damaged.month AND a.year = damaged.year AND damaged.meg_type = 'damaged'
                            LEFT JOIN reco_meg_data_view broken 
                                ON a.reco_id = broken.reco_id AND a.month = broken.month AND a.year = broken.year AND broken.meg_type = 'broken'
                            LEFT JOIN reco_meg_data_view expired 
                                ON a.reco_id = expired.reco_id AND a.month = expired.month AND a.year = expired.year AND expired.meg_type = 'expired'
                            WHERE stock.reco_id = a.reco_id AND stock.month = a.month AND stock.year = a.year AND stock.meg_type = 'stock'
                        )::BIGINT,
                        'nbr_referred', (SELECT SUM(condoms) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'condoms' AND is_fp_referred IS TRUE)::BIGINT,
                        'nbr_side_effect', (SELECT SUM(condoms) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'condoms' AND has_fp_side_effect IS TRUE)::BIGINT
                    ) AS condoms,

                    jsonb_build_object(
                        'label', 'Dépo provera -IM',
                        'nbr_new_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'depo_provera_im' AND a.form IN ('pregnancy_family_planning', 'family_planning') AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS NOT TRUE),0)::BIGINT, 
                        'nbr_regular_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'depo_provera_im' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS TRUE),0)::BIGINT, 
                        'nbr_total_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'depo_provera_im' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE),0)::BIGINT, 
                        'nbr_delivered', (SELECT SUM(depo_provera_im) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND meg_type = 'consumption' AND depo_provera_im IS NOT NULL AND depo_provera_im > 0)::BIGINT,
                        'nbr_in_stock', (
                            SELECT COALESCE(SUM(stock.depo_provera_im), 0) - COALESCE(SUM(consumption.depo_provera_im), 0) - COALESCE(SUM(loss.depo_provera_im), 0) - COALESCE(SUM(damaged.depo_provera_im), 0) - COALESCE(SUM(broken.depo_provera_im), 0) - COALESCE(SUM(expired.depo_provera_im), 0)
                            FROM reco_meg_data_view stock
                            LEFT JOIN reco_meg_data_view consumption 
                                ON a.reco_id = consumption.reco_id AND a.month = consumption.month AND a.year = consumption.year AND consumption.meg_type = 'consumption'
                            LEFT JOIN reco_meg_data_view loss 
                                ON a.reco_id = loss.reco_id AND a.month = loss.month AND a.year = loss.year AND loss.meg_type = 'loss'
                            LEFT JOIN reco_meg_data_view damaged 
                                ON a.reco_id = damaged.reco_id AND a.month = damaged.month AND a.year = damaged.year AND damaged.meg_type = 'damaged'
                            LEFT JOIN reco_meg_data_view broken 
                                ON a.reco_id = broken.reco_id AND a.month = broken.month AND a.year = broken.year AND broken.meg_type = 'broken'
                            LEFT JOIN reco_meg_data_view expired 
                                ON a.reco_id = expired.reco_id AND a.month = expired.month AND a.year = expired.year AND expired.meg_type = 'expired'
                            WHERE stock.reco_id = a.reco_id AND stock.month = a.month AND stock.year = a.year AND stock.meg_type = 'stock'
                        )::BIGINT,
                        'nbr_referred', (SELECT SUM(depo_provera_im) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'depo_provera_im' AND is_fp_referred IS TRUE)::BIGINT,
                        'nbr_side_effect', (SELECT SUM(depo_provera_im) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'depo_provera_im' AND has_fp_side_effect IS TRUE)::BIGINT
                    ) AS depo_provera_im,

                     jsonb_build_object(
                        'label', 'DMPA-SC',
                        'nbr_new_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'dmpa_sc' AND a.form IN ('pregnancy_family_planning', 'family_planning') AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS NOT TRUE),0)::BIGINT, 
                        'nbr_regular_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'dmpa_sc' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS TRUE),0)::BIGINT, 
                        'nbr_total_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'dmpa_sc' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE),0)::BIGINT, 
                        'nbr_delivered', (SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND meg_type = 'consumption' AND dmpa_sc IS NOT NULL AND dmpa_sc > 0)::BIGINT,
                        'nbr_in_stock', (
                            SELECT COALESCE(SUM(stock.dmpa_sc), 0) - COALESCE(SUM(consumption.dmpa_sc), 0) - COALESCE(SUM(loss.dmpa_sc), 0) - COALESCE(SUM(damaged.dmpa_sc), 0) - COALESCE(SUM(broken.dmpa_sc), 0) - COALESCE(SUM(expired.dmpa_sc), 0)
                            FROM reco_meg_data_view stock
                            LEFT JOIN reco_meg_data_view consumption 
                                ON a.reco_id = consumption.reco_id AND a.month = consumption.month AND a.year = consumption.year AND consumption.meg_type = 'consumption'
                            LEFT JOIN reco_meg_data_view loss 
                                ON a.reco_id = loss.reco_id AND a.month = loss.month AND a.year = loss.year AND loss.meg_type = 'loss'
                            LEFT JOIN reco_meg_data_view damaged 
                                ON a.reco_id = damaged.reco_id AND a.month = damaged.month AND a.year = damaged.year AND damaged.meg_type = 'damaged'
                            LEFT JOIN reco_meg_data_view broken 
                                ON a.reco_id = broken.reco_id AND a.month = broken.month AND a.year = broken.year AND broken.meg_type = 'broken'
                            LEFT JOIN reco_meg_data_view expired 
                                ON a.reco_id = expired.reco_id AND a.month = expired.month AND a.year = expired.year AND expired.meg_type = 'expired'
                            WHERE stock.reco_id = a.reco_id AND stock.month = a.month AND stock.year = a.year AND stock.meg_type = 'stock'
                        )::BIGINT,
                        'nbr_referred', (SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'dmpa_sc' AND is_fp_referred IS TRUE)::BIGINT,
                        'nbr_side_effect', (SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'dmpa_sc' AND has_fp_side_effect IS TRUE)::BIGINT
                    ) AS dmpa_sc,

                     jsonb_build_object(
                        'label', 'Collier du cycle',
                        'nbr_new_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'cycle_necklace' AND a.form IN ('pregnancy_family_planning', 'family_planning') AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS NOT TRUE),0)::BIGINT, 
                        'nbr_regular_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'cycle_necklace' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS TRUE),0)::BIGINT, 
                        'nbr_total_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'cycle_necklace' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE),0)::BIGINT, 
                        'nbr_delivered', (SELECT SUM(cycle_necklace) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND meg_type = 'consumption' AND cycle_necklace IS NOT NULL AND cycle_necklace > 0)::BIGINT,
                        'nbr_in_stock', (
                            SELECT COALESCE(SUM(stock.cycle_necklace), 0) - COALESCE(SUM(consumption.cycle_necklace), 0) - COALESCE(SUM(loss.cycle_necklace), 0) - COALESCE(SUM(damaged.cycle_necklace), 0) - COALESCE(SUM(broken.cycle_necklace), 0) - COALESCE(SUM(expired.cycle_necklace), 0)
                            FROM reco_meg_data_view stock
                            LEFT JOIN reco_meg_data_view consumption 
                                ON a.reco_id = consumption.reco_id AND a.month = consumption.month AND a.year = consumption.year AND consumption.meg_type = 'consumption'
                            LEFT JOIN reco_meg_data_view loss 
                                ON a.reco_id = loss.reco_id AND a.month = loss.month AND a.year = loss.year AND loss.meg_type = 'loss'
                            LEFT JOIN reco_meg_data_view damaged 
                                ON a.reco_id = damaged.reco_id AND a.month = damaged.month AND a.year = damaged.year AND damaged.meg_type = 'damaged'
                            LEFT JOIN reco_meg_data_view broken 
                                ON a.reco_id = broken.reco_id AND a.month = broken.month AND a.year = broken.year AND broken.meg_type = 'broken'
                            LEFT JOIN reco_meg_data_view expired 
                                ON a.reco_id = expired.reco_id AND a.month = expired.month AND a.year = expired.year AND expired.meg_type = 'expired'
                            WHERE stock.reco_id = a.reco_id AND stock.month = a.month AND stock.year = a.year AND stock.meg_type = 'stock'
                        )::BIGINT,
                        'nbr_referred', (SELECT SUM(cycle_necklace) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'cycle_necklace' AND is_fp_referred IS TRUE)::BIGINT,
                        'nbr_side_effect', (SELECT SUM(cycle_necklace) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'cycle_necklace' AND has_fp_side_effect IS TRUE)::BIGINT
                    ) AS cycle_necklace,

                     jsonb_build_object(
                        'label', 'DIU',
                        'nbr_new_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'diu' AND a.form IN ('pregnancy_family_planning', 'family_planning') AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS NOT TRUE),0)::BIGINT, 
                        'nbr_regular_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'diu' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS TRUE),0)::BIGINT, 
                        'nbr_total_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'diu' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE),0)::BIGINT, 
                        'nbr_delivered', (SELECT SUM(diu) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND meg_type = 'consumption' AND diu IS NOT NULL AND diu > 0)::BIGINT,
                        'nbr_in_stock', (
                            SELECT COALESCE(SUM(stock.diu), 0) - COALESCE(SUM(consumption.diu), 0) - COALESCE(SUM(loss.diu), 0) - COALESCE(SUM(damaged.diu), 0) - COALESCE(SUM(broken.diu), 0) - COALESCE(SUM(expired.diu), 0)
                            FROM reco_meg_data_view stock
                            LEFT JOIN reco_meg_data_view consumption 
                                ON a.reco_id = consumption.reco_id AND a.month = consumption.month AND a.year = consumption.year AND consumption.meg_type = 'consumption'
                            LEFT JOIN reco_meg_data_view loss 
                                ON a.reco_id = loss.reco_id AND a.month = loss.month AND a.year = loss.year AND loss.meg_type = 'loss'
                            LEFT JOIN reco_meg_data_view damaged 
                                ON a.reco_id = damaged.reco_id AND a.month = damaged.month AND a.year = damaged.year AND damaged.meg_type = 'damaged'
                            LEFT JOIN reco_meg_data_view broken 
                                ON a.reco_id = broken.reco_id AND a.month = broken.month AND a.year = broken.year AND broken.meg_type = 'broken'
                            LEFT JOIN reco_meg_data_view expired 
                                ON a.reco_id = expired.reco_id AND a.month = expired.month AND a.year = expired.year AND expired.meg_type = 'expired'
                            WHERE stock.reco_id = a.reco_id AND stock.month = a.month AND stock.year = a.year AND stock.meg_type = 'stock'
                        )::BIGINT,
                        'nbr_referred', (SELECT SUM(diu) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'diu' AND is_fp_referred IS TRUE)::BIGINT,
                        'nbr_side_effect', (SELECT SUM(diu) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'diu' AND has_fp_side_effect IS TRUE)::BIGINT
                    ) AS diu,

                     jsonb_build_object(
                        'label', 'Implant',
                        'nbr_new_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'implant' AND a.form IN ('pregnancy_family_planning', 'family_planning') AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS NOT TRUE),0)::BIGINT, 
                        'nbr_regular_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'implant' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS TRUE),0)::BIGINT, 
                        'nbr_total_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'implant' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE),0)::BIGINT, 
                        'nbr_delivered', (SELECT SUM(implant) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND meg_type = 'consumption' AND implant IS NOT NULL AND implant > 0)::BIGINT,
                        'nbr_in_stock', (
                            SELECT COALESCE(SUM(stock.implant), 0) - COALESCE(SUM(consumption.implant), 0) - COALESCE(SUM(loss.implant), 0) - COALESCE(SUM(damaged.implant), 0) - COALESCE(SUM(broken.implant), 0) - COALESCE(SUM(expired.implant), 0)
                            FROM reco_meg_data_view stock
                            LEFT JOIN reco_meg_data_view consumption 
                                ON a.reco_id = consumption.reco_id AND a.month = consumption.month AND a.year = consumption.year AND consumption.meg_type = 'consumption'
                            LEFT JOIN reco_meg_data_view loss 
                                ON a.reco_id = loss.reco_id AND a.month = loss.month AND a.year = loss.year AND loss.meg_type = 'loss'
                            LEFT JOIN reco_meg_data_view damaged 
                                ON a.reco_id = damaged.reco_id AND a.month = damaged.month AND a.year = damaged.year AND damaged.meg_type = 'damaged'
                            LEFT JOIN reco_meg_data_view broken 
                                ON a.reco_id = broken.reco_id AND a.month = broken.month AND a.year = broken.year AND broken.meg_type = 'broken'
                            LEFT JOIN reco_meg_data_view expired 
                                ON a.reco_id = expired.reco_id AND a.month = expired.month AND a.year = expired.year AND expired.meg_type = 'expired'
                            WHERE stock.reco_id = a.reco_id AND stock.month = a.month AND stock.year = a.year AND stock.meg_type = 'stock'
                        )::BIGINT,
                        'nbr_referred', (SELECT SUM(implant) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'implant' AND is_fp_referred IS TRUE)::BIGINT,
                        'nbr_side_effect', (SELECT SUM(implant) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'implant' AND has_fp_side_effect IS TRUE)::BIGINT
                    ) AS implant,

                     jsonb_build_object(
                        'label', 'Ligature des trompes',
                        'nbr_new_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'tubal_ligation' AND a.form IN ('pregnancy_family_planning', 'family_planning') AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS NOT TRUE),0)::BIGINT, 
                        'nbr_regular_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'tubal_ligation' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE AND a.already_use_method IS TRUE),0)::BIGINT, 
                        'nbr_total_user', COALESCE(COUNT(DISTINCT a.patient_id) FILTER (WHERE a.fp_method = 'tubal_ligation' AND a.has_counseling IS TRUE AND a.is_method_avaible_reco IS TRUE AND a.method_was_given IS TRUE),0)::BIGINT, 
                        'nbr_delivered', (SELECT SUM(tubal_ligation) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND meg_type = 'consumption' AND tubal_ligation IS NOT NULL AND tubal_ligation > 0)::BIGINT,
                        'nbr_in_stock', (
                            SELECT COALESCE(SUM(stock.tubal_ligation), 0) - COALESCE(SUM(consumption.tubal_ligation), 0) - COALESCE(SUM(loss.tubal_ligation), 0) - COALESCE(SUM(damaged.tubal_ligation), 0) - COALESCE(SUM(broken.tubal_ligation), 0) - COALESCE(SUM(expired.tubal_ligation), 0)
                            FROM reco_meg_data_view stock
                            LEFT JOIN reco_meg_data_view consumption 
                                ON a.reco_id = consumption.reco_id AND a.month = consumption.month AND a.year = consumption.year AND consumption.meg_type = 'consumption'
                            LEFT JOIN reco_meg_data_view loss 
                                ON a.reco_id = loss.reco_id AND a.month = loss.month AND a.year = loss.year AND loss.meg_type = 'loss'
                            LEFT JOIN reco_meg_data_view damaged 
                                ON a.reco_id = damaged.reco_id AND a.month = damaged.month AND a.year = damaged.year AND damaged.meg_type = 'damaged'
                            LEFT JOIN reco_meg_data_view broken 
                                ON a.reco_id = broken.reco_id AND a.month = broken.month AND a.year = broken.year AND broken.meg_type = 'broken'
                            LEFT JOIN reco_meg_data_view expired 
                                ON a.reco_id = expired.reco_id AND a.month = expired.month AND a.year = expired.year AND expired.meg_type = 'expired'
                            WHERE stock.reco_id = a.reco_id AND stock.month = a.month AND stock.year = a.year AND stock.meg_type = 'stock'
                        )::BIGINT,
                        'nbr_referred', (SELECT SUM(tubal_ligation) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'tubal_ligation' AND is_fp_referred IS TRUE)::BIGINT,
                        'nbr_side_effect', (SELECT SUM(tubal_ligation) FROM reco_meg_data_view WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND fp_method = 'tubal_ligation' AND has_fp_side_effect IS TRUE)::BIGINT
                    ) AS tubal_ligation,

                    jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone) AS reco,
                    jsonb_build_object('id', c.id, 'name', c.name) AS COUNTry,
                    jsonb_build_object('id', g.id, 'name', g.name) AS region,
                    jsonb_build_object('id', p.id, 'name', p.name) AS prefecture,
                    jsonb_build_object('id', m.id, 'name', m.name) AS commune,
                    jsonb_build_object('id', h.id, 'name', h.name) AS hospital,
                    jsonb_build_object('id', d.id, 'name', d.name) AS district_quartier,
                    jsonb_build_object('id', v.id, 'name', v.name) AS village_secteur

                FROM family_planning_data_view a
                
                    LEFT JOIN reco_view r ON a.reco_id = r.id 
                    LEFT JOIN COUNTry_view c ON a.COUNTry_id = c.id 
                    LEFT JOIN region_view g ON a.region_id = g.id 
                    LEFT JOIN prefecture_view p ON a.prefecture_id = p.id 
                    LEFT JOIN commune_view m ON a.commune_id = m.id 
                    LEFT JOIN hospital_view h ON a.hospital_id = h.id 
                    LEFT JOIN district_quartier_view d ON a.district_quartier_id = d.id 
                    LEFT JOIN village_secteur_view v ON a.village_secteur_id = v.id 

                GROUP BY a.reco_id, a.month, a.year, r.id, r.name, r.phone, 
                        c.id, c.name, g.id, g.name, p.id, p.name, 
                        m.id, m.name, h.id, h.name, d.id, d.name, 
                        v.id, v.name;
        
        `);

        await CreateViewIndex('reports_family_planning_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('reports_family_planning_view', queryRunner);
    }

}

