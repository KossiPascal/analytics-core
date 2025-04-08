import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class MorbidityReportView1743161098947 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  reports_morbidity_view AS
                SELECT 
                    CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
                    a.month AS month,
                    a.year AS year,
                    a.reco_id AS reco_id,
                    jsonb_build_object(
                        'indicator', 'Accident de circulation', 
                        'nbr_5_14_years', count(
                            CASE
                                WHEN ('traffic_accident' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_14_25_years', count(
                            CASE
                                WHEN ('traffic_accident' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_25_60_years', count(
                            CASE
                                WHEN ('traffic_accident' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_60_more_years', count(
                            CASE
                                WHEN ('traffic_accident' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('traffic_accident' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 
                        'nbr_total', count(
                            CASE
                                WHEN ('traffic_accident' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_referred', count(
                            CASE
                                WHEN ('traffic_accident' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_circulation_accident,

                    jsonb_build_object(
                        'indicator', 'Brûlure', 
                        'nbr_5_14_years', count(
                            CASE
                                WHEN ('burns' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_14_25_years', count(
                            CASE
                                WHEN ('burns' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_25_60_years', count(
                            CASE
                                WHEN ('burns' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_60_more_years', count(
                            CASE
                                WHEN ('burns' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('burns' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 
                        'nbr_total', count(
                            CASE
                                WHEN ('burns' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_referred', count(
                            CASE
                                WHEN ('burns' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_burn,
                    jsonb_build_object(
                        'indicator', 'Cas suspects de TB', 
                        'nbr_5_14_years', count(
                            CASE
                                WHEN ('suspected_tb' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_14_25_years', count(
                            CASE
                                WHEN ('suspected_tb' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_25_60_years', count(
                            CASE
                                WHEN ('suspected_tb' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_60_more_years', count(
                            CASE
                                WHEN ('suspected_tb' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('suspected_tb' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 
                        'nbr_total', count(
                            CASE
                                WHEN ('suspected_tb' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_referred', count(
                            CASE
                                WHEN ('suspected_tb' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_suspected_tb_cases,
                    jsonb_build_object(
                        'indicator', 'Dermatose', 
                        'nbr_5_14_years', count(
                            CASE
                                WHEN ('dermatosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_14_25_years', count(
                            CASE
                                WHEN ('dermatosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_25_60_years', count(
                            CASE
                                WHEN ('dermatosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_60_more_years', count(
                            CASE
                                WHEN ('dermatosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('dermatosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 
                        'nbr_total', count(
                            CASE
                                WHEN ('dermatosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_referred', count(
                            CASE
                                WHEN ('dermatosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_dermatosis,
                    jsonb_build_object(
                        'indicator', 'Diarrhées', 
                        'nbr_5_14_years', count(
                            CASE
                                WHEN (('diarrhea' = ANY (a.visit_motifs)) OR a.has_diarrhea = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_14_25_years', count(
                            CASE
                                WHEN (('diarrhea' = ANY (a.visit_motifs)) OR a.has_diarrhea = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_25_60_years', count(
                            CASE
                                WHEN (('diarrhea' = ANY (a.visit_motifs)) OR a.has_diarrhea = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_60_more_years', count(
                            CASE
                                WHEN (('diarrhea' = ANY (a.visit_motifs)) OR a.has_diarrhea = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_pregnant_woman', count(
                            CASE
                                WHEN (('diarrhea' = ANY (a.visit_motifs)) OR a.has_diarrhea = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 
                        'nbr_total', count(
                            CASE
                                WHEN (('diarrhea' = ANY (a.visit_motifs)) OR a.has_diarrhea = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_referred', count(
                            CASE
                                WHEN (('diarrhea' = ANY (a.visit_motifs)) OR a.has_diarrhea = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_diarrhea,
                    jsonb_build_object(
                        'indicator', 'Ecoulement uretrale', 
                        'nbr_5_14_years', count(
                            CASE
                                WHEN ('urethral_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_14_25_years', count(
                            CASE
                                WHEN ('urethral_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_25_60_years', count(
                            CASE
                                WHEN ('urethral_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_60_more_years', count(
                            CASE
                                WHEN ('urethral_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('urethral_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 
                        'nbr_total', count(
                            CASE
                                WHEN ('urethral_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_referred', count(
                            CASE
                                WHEN ('urethral_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_urethral_discharge,
                    jsonb_build_object('indicator', 'Ecoulement vaginal', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('vaginal_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('vaginal_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('vaginal_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('vaginal_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('vaginal_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('vaginal_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('vaginal_discharge' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_vaginal_discharge,
                    jsonb_build_object('indicator', 'Perte urinaire', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('loss_of_urine' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('loss_of_urine' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('loss_of_urine' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('loss_of_urine' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('loss_of_urine' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('loss_of_urine' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('loss_of_urine' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_urinary_loss,
                    jsonb_build_object('indicator', 'Ingestion accidentelle des produits caustiques', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('accidental_ingestion_caustic_products' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('accidental_ingestion_caustic_products' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('accidental_ingestion_caustic_products' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('accidental_ingestion_caustic_products' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('accidental_ingestion_caustic_products' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('accidental_ingestion_caustic_products' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('accidental_ingestion_caustic_products' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_accidental_caustic_products_ingestion,
                    jsonb_build_object('indicator', 'Intoxication alimentaire', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('food_poisoning' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('food_poisoning' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('food_poisoning' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('food_poisoning' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('food_poisoning' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('food_poisoning' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('food_poisoning' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_food_poisoning,
                    jsonb_build_object('indicator', 'Maladies bucco-dentaires', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('oral_and_dental_diseases' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('oral_and_dental_diseases' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('oral_and_dental_diseases' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('oral_and_dental_diseases' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('oral_and_dental_diseases' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('oral_and_dental_diseases' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('oral_and_dental_diseases' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_oral_diseases,
                    jsonb_build_object('indicator', 'Morsure de chien', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('dog_bites' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('dog_bites' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('dog_bites' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('dog_bites' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('dog_bites' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('dog_bites' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('dog_bites' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_dog_bite,
                    jsonb_build_object('indicator', 'Morsure de serpent', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('snake_bite' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('snake_bite' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('snake_bite' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('snake_bite' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('snake_bite' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('snake_bite' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('snake_bite' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_snake_bite,
                    jsonb_build_object('indicator', 'Parasitose', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('parasitosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('parasitosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('parasitosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('parasitosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('parasitosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('parasitosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('parasitosis' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_parasitosis,
                    jsonb_build_object('indicator', 'Rougeole', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('measles' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('measles' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('measles' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('measles' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('measles' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('measles' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('measles' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_measles,
                    jsonb_build_object('indicator', 'Traumatisme', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('trauma' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('trauma' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('trauma' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('trauma' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('trauma' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('trauma' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('trauma' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_trauma,
                    jsonb_build_object('indicator', 'Violence basées sur le genre (VBG)', 'nbr_5_14_years', count(
                            CASE
                                WHEN ('gender_based_violence' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN ('gender_based_violence' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN ('gender_based_violence' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN ('gender_based_violence' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN ('gender_based_violence' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN ('gender_based_violence' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN ('gender_based_violence' = ANY (a.visit_motifs)) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS hp_gender_based_violence,
                    jsonb_build_object('indicator', 'Nombre total de cas', 'nbr_5_14_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_pregnant = true THEN 1
                                ELSE NULL
                            END), 'nbr_total', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.is_referred = true THEN 1
                                ELSE NULL
                            END)) AS malaria_total_cases,
                    jsonb_build_object('indicator', 'Nombre de TDR effectués', 'nbr_5_14_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.rdt_given = true AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.rdt_given = true AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.rdt_given = true AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.rdt_given = true AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', NULL, 'nbr_total', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.rdt_given = true AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', NULL) AS malaria_rdt_performed,
                    jsonb_build_object('indicator', 'Nombre de TDR positifs', 'nbr_5_14_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.rdt_given = true AND a.rdt_result = 'positive' AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 'nbr_14_25_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.rdt_given = true AND a.rdt_result = 'positive' AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 'nbr_25_60_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.rdt_given = true AND a.rdt_result = 'positive' AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 'nbr_60_more_years', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.rdt_given = true AND a.rdt_result = 'positive' AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 'nbr_pregnant_woman', NULL, 'nbr_total', count(
                            CASE
                                WHEN (('malaria' = ANY (a.visit_motifs)) OR a.has_malaria = true) AND a.rdt_given = true AND a.rdt_result = 'positive' AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 'nbr_referred', NULL) AS malaria_positive_rdts,
                    jsonb_build_object(
                        'indicator', 'Nombre de cas traités avec CTA', 
                        'nbr_5_14_years', count(
                            CASE
                                WHEN (a.cta_nn IS NOT NULL AND a.cta_nn > 0 OR a.cta_pe IS NOT NULL AND a.cta_pe > 0 OR a.cta_ge IS NOT NULL AND a.cta_ge > 0 OR a.cta_ad IS NOT NULL AND a.cta_ad > 0) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 AND a.age_in_years < 14 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_14_25_years', count(
                            CASE
                                WHEN (a.cta_nn IS NOT NULL AND a.cta_nn > 0 OR a.cta_pe IS NOT NULL AND a.cta_pe > 0 OR a.cta_ge IS NOT NULL AND a.cta_ge > 0 OR a.cta_ad IS NOT NULL AND a.cta_ad > 0) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 14 AND a.age_in_years < 25 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_25_60_years', count(
                            CASE
                                WHEN (a.cta_nn IS NOT NULL AND a.cta_nn > 0 OR a.cta_pe IS NOT NULL AND a.cta_pe > 0 OR a.cta_ge IS NOT NULL AND a.cta_ge > 0 OR a.cta_ad IS NOT NULL AND a.cta_ad > 0) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 25 AND a.age_in_years < 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_60_more_years', count(
                            CASE
                                WHEN (a.cta_nn IS NOT NULL AND a.cta_nn > 0 OR a.cta_pe IS NOT NULL AND a.cta_pe > 0 OR a.cta_ge IS NOT NULL AND a.cta_ge > 0 OR a.cta_ad IS NOT NULL AND a.cta_ad > 0) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 60 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_pregnant_woman', NULL, 
                        'nbr_total', count(
                            CASE
                                WHEN (a.cta_nn IS NOT NULL AND a.cta_nn > 0 OR a.cta_pe IS NOT NULL AND a.cta_pe > 0 OR a.cta_ge IS NOT NULL AND a.cta_ge > 0 OR a.cta_ad IS NOT NULL AND a.cta_ad > 0) AND a.age_in_years IS NOT NULL AND a.age_in_years >= 5 THEN 1
                                ELSE NULL
                            END), 
                        'nbr_referred', NULL) AS malaria_cases_treated_with_cta,

                    jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone) AS reco,
                    jsonb_build_object('id', c.id, 'name', c.name) AS country,
                    jsonb_build_object('id', g.id, 'name', g.name) AS region,
                    jsonb_build_object('id', p.id, 'name', p.name) AS prefecture,
                    jsonb_build_object('id', m.id, 'name', m.name) AS commune,
                    jsonb_build_object('id', h.id, 'name', h.name) AS hospital,
                    jsonb_build_object('id', d.id, 'name', d.name) AS district_quartier,
                    jsonb_build_object('id', v.id, 'name', v.name) AS village_secteur

                FROM adult_data_view a

                    LEFT JOIN reco_view r ON a.reco_id = r.id
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


        await CreateViewIndex('reports_morbidity_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('reports_morbidity_view', queryRunner);
    }

}
