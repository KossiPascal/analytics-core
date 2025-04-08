
import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class RecoMegSituationReportsView1743441666991 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            
           CREATE MATERIALIZED VIEW IF NOT EXISTS reports_reco_meg_situation_view AS 
                SELECT
                    CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
                    a.reco_id,
                    a.month,
                    a.year,

                    jsonb_build_object(
                        'index', 1,
                        'label', 'Amoxicilline 250 mg',
                        'month_beginning', COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND amoxicillin_250mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND amoxicillin_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND amoxicillin_250mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND amoxicillin_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND amoxicillin_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND amoxicillin_250mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND amoxicillin_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND amoxicillin_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND amoxicillin_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'loss' AND amoxicillin_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND amoxicillin_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'broken' AND amoxicillin_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(amoxicillin_250mg) FROM reco_meg_data_view WHERE meg_type = 'expired' AND amoxicillin_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS amoxicillin_250mg,

                    jsonb_build_object(
                        'index', 2,
                        'label', 'Amoxicilline 500 mg',
                        'month_beginning', COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND amoxicillin_500mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND amoxicillin_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND amoxicillin_500mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND amoxicillin_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND amoxicillin_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND amoxicillin_500mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND amoxicillin_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND amoxicillin_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND amoxicillin_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'loss' AND amoxicillin_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND amoxicillin_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'broken' AND amoxicillin_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(amoxicillin_500mg) FROM reco_meg_data_view WHERE meg_type = 'expired' AND amoxicillin_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS amoxicillin_500mg,

                    jsonb_build_object(
                        'index', 3,
                        'label', 'Paracetamol 100 mg',
                        'month_beginning', COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_100mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND paracetamol_100mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_100mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND paracetamol_100mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND paracetamol_100mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_100mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND paracetamol_100mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND paracetamol_100mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_100mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'loss' AND paracetamol_100mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND paracetamol_100mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'broken' AND paracetamol_100mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(paracetamol_100mg) FROM reco_meg_data_view WHERE meg_type = 'expired' AND paracetamol_100mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS paracetamol_100mg,

                    jsonb_build_object(
                        'index', 4,
                        'label', 'Paracetamol 250 mg',
                        'month_beginning', COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_250mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND paracetamol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_250mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND paracetamol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND paracetamol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_250mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND paracetamol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND paracetamol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'loss' AND paracetamol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND paracetamol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'broken' AND paracetamol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(paracetamol_250mg) FROM reco_meg_data_view WHERE meg_type = 'expired' AND paracetamol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS paracetamol_250mg,

                   jsonb_build_object(
                        'index', 5,
                        'label', 'Paracetamol 500 mg',
                        'month_beginning', COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_500mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND paracetamol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_500mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND paracetamol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND paracetamol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_500mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND paracetamol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND paracetamol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND paracetamol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'loss' AND paracetamol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND paracetamol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'broken' AND paracetamol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(paracetamol_500mg) FROM reco_meg_data_view WHERE meg_type = 'expired' AND paracetamol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS paracetamol_500mg,

                   jsonb_build_object(
                        'index', 6,
                        'label', 'Mebendazol 250 mg',
                        'month_beginning', COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND mebendazol_250mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND mebendazol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND mebendazol_250mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND mebendazol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND mebendazol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND mebendazol_250mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND mebendazol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND mebendazol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND mebendazol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'loss' AND mebendazol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND mebendazol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'broken' AND mebendazol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(mebendazol_250mg) FROM reco_meg_data_view WHERE meg_type = 'expired' AND mebendazol_250mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS mebendazol_250mg,

                   jsonb_build_object(
                        'index', 7,
                        'label', 'Mebendazol 500 mg',
                        'month_beginning', COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND mebendazol_500mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND mebendazol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND mebendazol_500mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND mebendazol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND mebendazol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND mebendazol_500mg IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'stock' AND mebendazol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND mebendazol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND mebendazol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'loss' AND mebendazol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND mebendazol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'broken' AND mebendazol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(mebendazol_500mg) FROM reco_meg_data_view WHERE meg_type = 'expired' AND mebendazol_500mg IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS mebendazol_500mg,

                   jsonb_build_object(
                        'index', 8,
                        'label', 'SRO',
                        'month_beginning', COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND ors IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'stock' AND ors IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND ors IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'stock' AND ors IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND ors IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND ors IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'stock' AND ors IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND ors IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND ors IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'loss' AND ors IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND ors IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'broken' AND ors IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(ors) FROM reco_meg_data_view WHERE meg_type = 'expired' AND ors IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS ors,

                   jsonb_build_object(
                        'index', 9,
                        'label', 'Zinc',
                        'month_beginning', COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND zinc IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'stock' AND zinc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND zinc IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'stock' AND zinc IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND zinc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND zinc IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'stock' AND zinc IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND zinc IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND zinc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'loss' AND zinc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND zinc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'broken' AND zinc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(zinc) FROM reco_meg_data_view WHERE meg_type = 'expired' AND zinc IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS zinc,

                   jsonb_build_object(
                        'index', 10,
                        'label', 'CTA: AL (NN)',
                        'month_beginning', COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_nn IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_nn IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_nn IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_nn IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND cta_nn IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_nn IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_nn IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND cta_nn IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_nn IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'loss' AND cta_nn IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND cta_nn IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'broken' AND cta_nn IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(cta_nn) FROM reco_meg_data_view WHERE meg_type = 'expired' AND cta_nn IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS cta_nn,

                   jsonb_build_object(
                        'index', 11,
                        'label', 'CTA: AL (PE)',
                        'month_beginning', COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_pe IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_pe IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_pe IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_pe IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND cta_pe IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_pe IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_pe IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND cta_pe IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_pe IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'loss' AND cta_pe IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND cta_pe IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'broken' AND cta_pe IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(cta_pe) FROM reco_meg_data_view WHERE meg_type = 'expired' AND cta_pe IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS cta_pe,

                   jsonb_build_object(
                        'index', 12,
                        'label', 'CTA: AL (GE)',
                        'month_beginning', COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_ge IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_ge IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_ge IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_ge IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND cta_ge IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_ge IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_ge IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND cta_ge IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_ge IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'loss' AND cta_ge IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND cta_ge IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'broken' AND cta_ge IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(cta_ge) FROM reco_meg_data_view WHERE meg_type = 'expired' AND cta_ge IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS cta_ge,

                   jsonb_build_object(
                        'index', 13,
                        'label', 'CTA: AL (AD)',
                        'month_beginning', COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_ad IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_ad IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_ad IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_ad IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND cta_ad IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_ad IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'stock' AND cta_ad IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND cta_ad IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND cta_ad IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'loss' AND cta_ad IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND cta_ad IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'broken' AND cta_ad IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(cta_ad) FROM reco_meg_data_view WHERE meg_type = 'expired' AND cta_ad IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS cta_ad,

                   jsonb_build_object(
                        'index', 14,
                        'label', 'TDR',
                        'month_beginning', COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND tdr IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'stock' AND tdr IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND tdr IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'stock' AND tdr IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND tdr IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND tdr IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'stock' AND tdr IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND tdr IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND tdr IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'loss' AND tdr IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND tdr IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'broken' AND tdr IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(tdr) FROM reco_meg_data_view WHERE meg_type = 'expired' AND tdr IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS tdr,

                   jsonb_build_object(
                        'index', 15,
                        'label', 'Vitamin A',
                        'month_beginning', COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND vitamin_a IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'stock' AND vitamin_a IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND vitamin_a IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'stock' AND vitamin_a IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND vitamin_a IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND vitamin_a IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'stock' AND vitamin_a IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND vitamin_a IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND vitamin_a IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'loss' AND vitamin_a IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND vitamin_a IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'broken' AND vitamin_a IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(vitamin_a) FROM reco_meg_data_view WHERE meg_type = 'expired' AND vitamin_a IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS vitamin_a,

                   jsonb_build_object(
                        'index', 16,
                        'label', 'Pillule COC',
                        'month_beginning', COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND pill_coc IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'stock' AND pill_coc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND pill_coc IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'stock' AND pill_coc IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND pill_coc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND pill_coc IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'stock' AND pill_coc IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND pill_coc IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND pill_coc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'loss' AND pill_coc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND pill_coc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'broken' AND pill_coc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(pill_coc) FROM reco_meg_data_view WHERE meg_type = 'expired' AND pill_coc IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS pill_coc,

                   jsonb_build_object(
                        'index', 17,
                        'label', 'Pillule COP',
                        'month_beginning', COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND pill_cop IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'stock' AND pill_cop IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND pill_cop IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'stock' AND pill_cop IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND pill_cop IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND pill_cop IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'stock' AND pill_cop IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND pill_cop IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND pill_cop IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'loss' AND pill_cop IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND pill_cop IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'broken' AND pill_cop IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(pill_cop) FROM reco_meg_data_view WHERE meg_type = 'expired' AND pill_cop IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS pill_cop,

                   jsonb_build_object(
                        'index', 18,
                        'label', 'Condoms',
                        'month_beginning', COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND condoms IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'stock' AND condoms IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND condoms IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'stock' AND condoms IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND condoms IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND condoms IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'stock' AND condoms IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND condoms IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND condoms IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'loss' AND condoms IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND condoms IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'broken' AND condoms IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(condoms) FROM reco_meg_data_view WHERE meg_type = 'expired' AND condoms IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS condoms,

                   jsonb_build_object(
                        'index', 19,
                        'label', 'Dmpa SC (Sayana-press)',
                        'month_beginning', COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND dmpa_sc IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'stock' AND dmpa_sc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND dmpa_sc IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'stock' AND dmpa_sc IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND dmpa_sc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND dmpa_sc IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'stock' AND dmpa_sc IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND dmpa_sc IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND dmpa_sc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'loss' AND dmpa_sc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND dmpa_sc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'broken' AND dmpa_sc IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(dmpa_sc) FROM reco_meg_data_view WHERE meg_type = 'expired' AND dmpa_sc IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS dmpa_sc,

                   jsonb_build_object(
                        'index', 20,
                        'label', 'Implant',
                        'month_beginning', COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND implant IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0),
                        'month_received', COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'stock' AND implant IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_total_start', (
                            COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND implant IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'stock' AND implant IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_consumption', COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'consumption' AND implant IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_theoreticaly', (
                            COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND implant IS NOT NULL AND month = a.prev_month AND year = a.prev_year), 0)
                            + 
                            COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'stock' AND implant IS NOT NULL AND month = a.month AND year = a.year), 0)
                            - 
                            COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type IN ('consumption', 'loss', 'damaged', 'broken', 'expired') AND implant IS NOT NULL AND month = a.month AND year = a.year), 0)
                        ),
                        'month_inventory', COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'inventory' AND implant IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_loss', COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'loss' AND implant IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_damaged', COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'damaged' AND implant IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_broken', COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'broken' AND implant IS NOT NULL AND month = a.month AND year = a.year), 0),
                        'month_expired', COALESCE((SELECT SUM(implant) FROM reco_meg_data_view WHERE meg_type = 'expired' AND implant IS NOT NULL AND month = a.month AND year = a.year), 0)
                    ) AS implant,

                    jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone) AS reco,
                    jsonb_build_object('id', c.id, 'name', c.name) AS country,
                    jsonb_build_object('id', g.id, 'name', g.name) AS region,
                    jsonb_build_object('id', p.id, 'name', p.name) AS prefecture,
                    jsonb_build_object('id', m.id, 'name', m.name) AS commune,
                    jsonb_build_object('id', h.id, 'name', h.name) AS hospital,
                    jsonb_build_object('id', d.id, 'name', d.name) AS district_quartier,
                    jsonb_build_object('id', v.id, 'name', v.name) AS village_secteur 

                FROM reco_view r

                    JOIN (
                        SELECT DISTINCT ON (reco_id, month, year) 
                            month, year, reco_id,
                            (CASE WHEN month = '01' THEN '12' ELSE LPAD(CAST(CAST(month AS INT) - 1 AS TEXT), 2, '0') END) AS prev_month,
                            (CASE WHEN month = '01' THEN CAST(year AS INT) - 1 ELSE year END) AS prev_year
                        FROM reco_meg_data_view
                    ) AS a ON r.id = a.reco_id

                    LEFT JOIN country_view c ON r.country_id = c.id 
                    LEFT JOIN region_view g ON r.region_id = g.id 
                    LEFT JOIN prefecture_view p ON r.prefecture_id = p.id 
                    LEFT JOIN commune_view m ON r.commune_id = m.id 
                    LEFT JOIN hospital_view h ON r.hospital_id = h.id 
                    LEFT JOIN district_quartier_view d ON r.district_quartier_id = d.id 
                    LEFT JOIN village_secteur_view v ON r.village_secteur_id = v.id 

                GROUP BY a.reco_id, a.month, a.year, a.prev_month, a.prev_year, 
                         r.id, r.name, r.phone, 
                         c.id, c.name, 
                         g.id, g.name, 
                         p.id, p.name, 
                         m.id, m.name, 
                         h.id, h.name, 
                         d.id, d.name, 
                         v.id, v.name;
        `);

        await CreateViewIndex('reports_reco_meg_situation_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('reports_reco_meg_situation_view', queryRunner);
    }

}





// JOIN (
//     SELECT 
//         month, year, reco_id,
//         (CASE WHEN month = '01' THEN '12' ELSE LPAD(CAST(CAST(month AS INT) - 1 AS TEXT), 2, '0') END) AS prev_month,
//         (CASE WHEN month = '01' THEN CAST(year AS INT) - 1 ELSE year END) AS prev_year,
//         ROW_NUMBER() OVER (PARTITION BY reco_id, month, year ORDER BY country_id) AS row_num
//     FROM reco_meg_data_view 
//     WHERE month IS NOT NULL AND year IS NOT NULL AND reco_id IS NOT NULL
// ) AS a ON r.id = a.reco_id AND a.row_num = 1 