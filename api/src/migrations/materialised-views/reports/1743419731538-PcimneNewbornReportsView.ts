import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class PcimneNewbornReportsView1743419731538 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS reports_pcime_newborn_view AS 
                SELECT 
                    CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
                    a.month,
                    a.year,
                    a.reco_id,

                    jsonb_build_object(
                        'index', 1, 
                        'indicator', 'Nombre de cas reçu', 
                        'malaria_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        )
                    ) AS cases_received,

                    jsonb_build_object(
                        'index', 2, 
                        'indicator', 'Nombre de TDR effectué', 
                        'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE rdt_given IS TRUE AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE rdt_given IS TRUE AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE rdt_given IS TRUE AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE rdt_given IS TRUE AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
                    ) AS given_rdt,

                    jsonb_build_object(
                        'index', 3, 
                        'indicator', 'Nombre de TDR positif', 
                        'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE rdt_result = 'positive' AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE rdt_result = 'positive' AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE rdt_result = 'positive' AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE rdt_result = 'positive' AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
                    ) AS positive_rdt,

                    jsonb_build_object(
                        'index', 4, 
                        'indicator', 'Nombre de cas traités avec CTA', 
                        'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(cta_nn,0)> 0 OR COALESCE(cta_pe,0)> 0 OR COALESCE(cta_ge,0)> 0 OR COALESCE(cta_ad,0)> 0) AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(cta_nn,0)> 0 OR COALESCE(cta_pe,0)> 0 OR COALESCE(cta_ge,0)> 0 OR COALESCE(cta_ad,0)> 0) AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(cta_nn,0)> 0 OR COALESCE(cta_pe,0)> 0 OR COALESCE(cta_ge,0)> 0 OR COALESCE(cta_ad,0)> 0) AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(cta_nn,0)> 0 OR COALESCE(cta_pe,0)> 0 OR COALESCE(cta_ge,0)> 0 OR COALESCE(cta_ad,0)> 0) AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
                    ) AS case_cta_treated,

                    jsonb_build_object(
                        'index', 5, 
                        'indicator', 'Nombre de cas traités avec Amoxicilline', 
                        'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(amoxicillin_250mg,0)> 0 OR COALESCE(amoxicillin_500mg,0)> 0) AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(amoxicillin_250mg,0)> 0 OR COALESCE(amoxicillin_500mg,0)> 0) AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(amoxicillin_250mg,0)> 0 OR COALESCE(amoxicillin_500mg,0)> 0) AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(amoxicillin_250mg,0)> 0 OR COALESCE(amoxicillin_500mg,0)> 0) AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
                    ) AS case_amoxicilline_treated,

                    jsonb_build_object(
                        'index', 6, 
                        'indicator', 'Nombre de cas traités avec SRO et ZINC', 
                        'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(ors,0)> 0 OR COALESCE(zinc,0)> 0) AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(ors,0)> 0 OR COALESCE(zinc,0)> 0) AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(ors,0)> 0 OR COALESCE(zinc,0)> 0) AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(ors,0)> 0 OR COALESCE(zinc,0)> 0) AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
                    ) AS case_ors_zinc_treated,

                    jsonb_build_object(
                        'index', 7, 
                        'indicator', 'Nombre de cas traités avec  Paracetamol', 
                        'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(paracetamol_100mg,0)> 0 OR COALESCE(paracetamol_250mg,0)> 0 OR COALESCE(paracetamol_500mg,0)> 0) AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(paracetamol_100mg,0)> 0 OR COALESCE(paracetamol_250mg,0)> 0 OR COALESCE(paracetamol_500mg,0)> 0) AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(paracetamol_100mg,0)> 0 OR COALESCE(paracetamol_250mg,0)> 0 OR COALESCE(paracetamol_500mg,0)> 0) AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE (COALESCE(paracetamol_100mg,0)> 0 OR COALESCE(paracetamol_250mg,0)> 0 OR COALESCE(paracetamol_500mg,0)> 0) AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
                    ) AS case_paracetamol_treated,

                    jsonb_build_object(
                        'index', 8, 
                        'indicator', 'Nombre de cas traités dans les 24 H', 
                        'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE CAST(promptitude AS TEXT) = '1' AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        )
                    ) AS case_24h_treated,

                    jsonb_build_object(
                        'index', 9, 
                        'indicator', 'Nombre de visites de suivi réalisées', 
                        'malaria_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_followup' AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_followup' AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_followup' AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_followup' AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_followup' AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_followup' AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_followup' AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_followup' AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_followup' AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        )
                    ) AS followup_made,

                    jsonb_build_object(
                        'index', 10, 
                        'indicator', 'Nombre de traitements de pré-référence (RECTOCAPS)', 
                        'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE has_pre_reference_treatments IS TRUE AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        )
                    ) AS pre_referal_traitment,

                    jsonb_build_object(
                        'index', 11, 
                        'indicator', 'Nombre de cas référés', 
                        'malaria_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE is_referred IS TRUE AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE is_referred IS TRUE AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE is_referred IS TRUE AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE is_referred IS TRUE AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE is_referred IS TRUE AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE is_referred IS TRUE AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE is_referred IS TRUE AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE is_referred IS TRUE AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE is_referred IS TRUE AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        )
                    ) AS referal_case,

                    jsonb_build_object(
                        'index', 12, 
                        'indicator', 'Nombre de cas de malnutritions detectées', 
                        'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_register' AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_register' AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_register' AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_register' AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_register' AND sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_register' AND sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        )
                    ) AS case_malnutrition_detected,

                    jsonb_build_object(
                        'index', 13, 
                        'indicator', 'Nombre de cas de toux detectés', 
                        'malaria_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malaria_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'cough_pneumonia_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_register' AND sex = 'F' AND has_cough_cold IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE form = 'newborn_register' AND sex = 'M' AND has_cough_cold IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_register' AND sex = 'F' AND has_cough_cold IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_register' AND sex = 'M' AND has_cough_cold IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_register' AND sex = 'F' AND has_cough_cold IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE form = 'pcimne_register' AND sex = 'M' AND has_cough_cold IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'diarrhea_12_60',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_0_2',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_2_12',jsonb_build_object('F', NULL,'M', NULL),
                        'malnutrition_12_60',jsonb_build_object('F', NULL,'M', NULL)
                    ) AS case_cough_detected,

                    jsonb_build_object(
                        'index', 14, 
                        'indicator', 'Nombre de contre références reçues', 
                        'malaria_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'F' AND has_malaria IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'M' AND has_malaria IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_malaria IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_malaria IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_malaria IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_malaria IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND coupon_available IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND coupon_available IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND coupon_available IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND coupon_available IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND coupon_available IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND coupon_available IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'F' AND has_diarrhea IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'M' AND has_diarrhea IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_diarrhea IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_diarrhea IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_diarrhea IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_diarrhea IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'F' AND has_malnutrition IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM newborn_data_view WHERE sex = 'M' AND has_malnutrition IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_days,0) >= 0 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_malnutrition IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_malnutrition IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'F' AND has_malnutrition IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(id) FROM pcimne_data_view WHERE sex = 'M' AND has_malnutrition IS TRUE AND coupon_available IS TRUE AND COALESCE(age_in_months,0) >= 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        )
                    ) AS counter_referrals_received,

                    jsonb_build_object(
                        'index', 15, 
                        'indicator', 'Nombre de décès enregistrés', 
                        'malaria_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 2 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) < 2 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 2 AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 2 AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malaria_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND COALESCE(age_in_months,0) < 60 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND has_malaria IS TRUE AND COALESCE(age_in_months,0) >= 12 AND COALESCE(age_in_months,0) < 60 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 2 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) < 2 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 2 AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 2 AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'cough_pneumonia_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND COALESCE(age_in_months,0) < 60 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE) AND COALESCE(age_in_months,0) >= 12 AND COALESCE(age_in_months,0) < 60 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 2 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) < 2 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 2 AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 2 AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'diarrhea_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND COALESCE(age_in_months,0) < 60 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND has_diarrhea IS TRUE AND COALESCE(age_in_months,0) >= 12 AND COALESCE(age_in_months,0) < 60 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_0_2',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 2 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) < 2 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_2_12',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 2 AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 2 AND COALESCE(age_in_months,0) < 12 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        ),
                        'malnutrition_12_60',jsonb_build_object(
                            'F', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'F' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND COALESCE(age_in_months,0) < 60 AND reco_id = a.reco_id AND month = a.month AND year = a.year),
                            'M', (SELECT COUNT(DISTINCT patient_id) FROM death_data_view WHERE sex = 'M' AND has_malnutrition IS TRUE AND COALESCE(age_in_months,0) >= 12 AND COALESCE(age_in_months,0) < 60 AND reco_id = a.reco_id AND month = a.month AND year = a.year)
                        )
                    ) AS deaths_registered,

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
                     month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id 
                    FROM (
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pcimne_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM newborn_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM death_data_view 
                    ) AS merged_data
                ) AS a ON r.id = a.reco_id

                LEFT JOIN country_view c ON a.country_id = c.id 
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

        await CreateViewIndex('reports_pcime_newborn_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('reports_pcime_newborn_view', queryRunner);
    }

}


