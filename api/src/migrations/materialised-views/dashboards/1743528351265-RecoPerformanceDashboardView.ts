import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class RecoPerformanceDashboardView1743528351265 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_reco_performance_view AS 
                WITH colors AS (
                        SELECT generateRandomColors(
                            COALESCE((SELECT COUNT(id) FROM reco_view), 1) * 30
                        ) AS color
                    )

                SELECT 
                    CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
                    a.month AS month,
                    a.year AS year,
                    a.reco_id AS reco_id,

                    COALESCE((SELECT COUNT(id) FROM family_view 
                        WHERE reco_id = a.reco_id 
                        AND reported_date <= (DATE_TRUNC('month', TO_DATE(year || '-' || month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')
                     ),0)::BIGINT AS household_count,
                    
                    COALESCE((SELECT COUNT(id) FROM patient_view 
                        WHERE reco_id = a.reco_id 
                        AND reported_date <= (DATE_TRUNC('month', TO_DATE(year || '-' || month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')
                     ),0)::BIGINT AS patient_count,
                    
                    COALESCE((SELECT COUNT(id) FROM patient_view 
                        WHERE reco_id = a.reco_id 
                        AND calculateAgeIn('months', date_of_birth::DATE, NULL, a.month::TEXT, a.year::INT) < 2
                     ),0)::BIGINT AS newborn_less_02_months_count,
                    
                    COALESCE((SELECT COUNT(id) FROM patient_view 
                        WHERE reco_id = a.reco_id 
                        AND calculateAgeIn('months', date_of_birth::DATE, NULL, a.month::TEXT, a.year::INT) >= 2
                        AND calculateAgeIn('months', date_of_birth::DATE, NULL, a.month::TEXT, a.year::INT) < 60
                     ),0)::BIGINT AS child_02_to_60_months_count,
                    
                    COALESCE((SELECT COUNT(id) FROM patient_view 
                        WHERE reco_id = a.reco_id 
                        AND calculateAgeIn('months', date_of_birth::DATE, NULL, a.month::TEXT, a.year::INT) >= 60
                        AND calculateAgeIn('years', date_of_birth::DATE, NULL, a.month::TEXT, a.year::INT) < 15
                     ),0)::BIGINT AS child_05_to_14_years_count,
                    
                    COALESCE((SELECT COUNT(id) FROM patient_view 
                        WHERE reco_id = a.reco_id 
                        AND calculateAgeIn('years', date_of_birth::DATE, NULL, a.month::TEXT, a.year::INT) >= 15
                     ),0)::BIGINT AS adult_over_14_years_count,
                    
                    COALESCE((SELECT COUNT(id) 
                        FROM (
                            SELECT id, consultation_followup FROM adult_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id, consultation_followup FROM family_planning_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id, consultation_followup FROM newborn_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id, consultation_followup FROM pcimne_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id, consultation_followup FROM pregnant_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                        ) cc 
                        WHERE cc.consultation_followup = 'consultation'
                     ),0)::BIGINT AS consultation_count,
                    
                    COALESCE((SELECT COUNT(id) 
                        FROM (
                            SELECT id, consultation_followup FROM adult_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id, consultation_followup FROM family_planning_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id, consultation_followup FROM newborn_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id, consultation_followup FROM pcimne_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id, consultation_followup FROM pregnant_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                        ) fc 
                        WHERE fc.consultation_followup <> 'consultation' --followup
                     ),0)::BIGINT AS followup_count,
                    
                    COALESCE((SELECT COUNT(id) 
                        FROM (
                            SELECT id FROM adult_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id FROM family_planning_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id FROM newborn_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id FROM pcimne_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id FROM pregnant_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id FROM delivery_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id FROM referal_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id FROM death_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id FROM events_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                            UNION ALL 
                            SELECT id FROM promotional_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                        ) ac 
                     ),0)::BIGINT AS all_actions_count,

                    jsonb_build_object(
                        'title', 'TOUTES LES ACTIONS DU RECO',
                        'type', 'line',
                        'absisseLabels', ARRAY['ACTIONS A DOMICILE'],
                        'datasets', jsonb_build_array(
                            jsonb_build_object(
                                'label', a.reco_id,
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[1],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[1],
                                'data', ARRAY[
                                    COALESCE((SELECT COUNT(id) 
                                        FROM (
                                            SELECT id FROM adult_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                                            UNION ALL 
                                            SELECT id FROM family_planning_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                                            UNION ALL 
                                            SELECT id FROM newborn_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                                            UNION ALL 
                                            SELECT id FROM pcimne_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                                            UNION ALL 
                                            SELECT id FROM pregnant_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                                            UNION ALL 
                                            SELECT id FROM delivery_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                                            UNION ALL 
                                            SELECT id FROM referal_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                                            UNION ALL 
                                            SELECT id FROM death_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                                            UNION ALL 
                                            SELECT id FROM events_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                                            UNION ALL 
                                            SELECT id FROM promotional_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id 
                                        )   
                                     ),0)::BIGINT
                                ]
                            )
                        )
                    ) AS linechart,

                    jsonb_build_object(
                        'title', 'TENDANCES DES ACTIVITE DU RECO',
                        'type', 'bar',
                        'absisseLabels', ARRAY['Adult', 'PF', 'Nouveau Né', 'Pcime', 'Enceinte', 'Accouchement', 'Suivi Référence', 'Décès', 'Evenements', 'Activités Promotionnelles'],
                        'datasets', jsonb_build_array(
                            jsonb_build_object(
                                'label', a.reco_id,
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[1],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[1],
                                'data', ARRAY[
                                    COALESCE((SELECT COUNT(id) FROM adult_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id ),0)::BIGINT,
                                    COALESCE((SELECT COUNT(id) FROM family_planning_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id ),0)::BIGINT,
                                    COALESCE((SELECT COUNT(id) FROM newborn_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id ),0)::BIGINT,
                                    COALESCE((SELECT COUNT(id) FROM pcimne_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id ),0)::BIGINT,
                                    COALESCE((SELECT COUNT(id) FROM pregnant_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id ),0)::BIGINT,
                                    COALESCE((SELECT COUNT(id) FROM delivery_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id ),0)::BIGINT,
                                    COALESCE((SELECT COUNT(id) FROM referal_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id ),0)::BIGINT,
                                    COALESCE((SELECT COUNT(id) FROM death_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id ),0)::BIGINT,
                                    COALESCE((SELECT COUNT(id) FROM events_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id ),0)::BIGINT,
                                    COALESCE((SELECT COUNT(id) FROM promotional_data_view WHERE month = a.month AND year = a.year AND reco_id = a.reco_id ),0)::BIGINT
                                ]
                            )
                        )
                    ) AS barchart,


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
                        month, year, reco_id, country_id, region_id, prefecture_id, commune_id, 
                        hospital_id, district_quartier_id, village_secteur_id 
                    FROM (
                        -- UNION de toutes les tables avec les mêmes colonnes
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM adult_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM family_planning_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM newborn_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pcimne_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pregnant_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM delivery_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM referal_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM death_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM events_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM promotional_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM family_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM patient_view 
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

        await CreateViewIndex('dashboard_reco_performance_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('dashboard_reco_performance_view', queryRunner);
    }

}

