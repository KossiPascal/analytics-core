import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class RecoChartPerformanceDashboardView1743512587502 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_reco_chart_performance_view AS
                WITH months AS (
                    SELECT unnest(ARRAY['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']) AS month
                ),
                colors AS (
                    SELECT generateRandomColors(
                        COALESCE((SELECT COUNT(id) FROM reco_view), 1) * 30
                    ) AS color
                )
                    
                SELECT 
                    CONCAT(a.year, '-', a.reco_id) AS id,
                    a.year,
                    a.reco_id,
                    jsonb_build_object(
                        'absisseLabels', (SELECT jsonb_agg(month) FROM months),
                        'datasets', jsonb_build_array(
                            jsonb_build_object(
                                'label','Adult',
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[1],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[1],
                                'data', (
                                    SELECT jsonb_agg(COALESCE(count, 0) ORDER BY m.month, year) 
                                    FROM months m
                                    LEFT JOIN (
                                        SELECT month, year, COUNT(id) AS count FROM adult_data_view GROUP BY month, year
                                    ) dt ON dt.month = m.month AND dt.year = a.year
                                )
                            ),
                            jsonb_build_object(
                                'label','PF',
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[2],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[2],
                                'data', (
                                    SELECT jsonb_agg(COALESCE(count, 0) ORDER BY m.month, year) 
                                    FROM months m
                                    LEFT JOIN (
                                        SELECT month, year, COUNT(id) AS count FROM family_planning_data_view GROUP BY month, year
                                    ) fp ON fp.month = m.month AND fp.year = a.year
                                )
                            ),
                            jsonb_build_object(
                                'label','Nouveau Né',
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[3],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[3],
                                'data', (
                                    SELECT jsonb_agg(COALESCE(count, 0) ORDER BY m.month, year) 
                                    FROM months m
                                    LEFT JOIN (
                                        SELECT month, year, COUNT(id) AS count FROM newborn_data_view GROUP BY month, year
                                    ) nb ON nb.month = m.month AND nb.year = a.year
                                )
                            ),
                            jsonb_build_object(
                                'label','Pcimne',
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[4],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[4],
                                'data', (
                                    SELECT jsonb_agg(COALESCE(count, 0) ORDER BY m.month, year) 
                                    FROM months m
                                    LEFT JOIN (
                                        SELECT month, year, COUNT(id) AS count FROM pcimne_data_view GROUP BY month, year
                                    ) pc ON pc.month = m.month AND pc.year = a.year
                                )
                            ),
                            jsonb_build_object(
                                'label','Enceinte',
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[5],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[5],
                                'data', (
                                    SELECT jsonb_agg(COALESCE(count, 0) ORDER BY m.month, year) 
                                    FROM months m
                                    LEFT JOIN (
                                        SELECT month, year, COUNT(id) AS count FROM pregnant_data_view GROUP BY month, year
                                    ) preg ON preg.month = m.month AND preg.year = a.year
                                )
                            ),
                            jsonb_build_object(
                                'label','Accouchement',
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[6],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[6],
                                'data', (
                                    SELECT jsonb_agg(COALESCE(count, 0) ORDER BY m.month, year) 
                                    FROM months m
                                    LEFT JOIN (
                                        SELECT month, year, COUNT(id) AS count FROM delivery_data_view GROUP BY month, year
                                    ) del ON del.month = m.month AND del.year = a.year
                                )
                            ),
                            jsonb_build_object(
                                'label','Suivi Référence',
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[7],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[7],
                                'data', (
                                    SELECT jsonb_agg(COALESCE(count, 0) ORDER BY m.month, year) 
                                    FROM months m
                                    LEFT JOIN (
                                        SELECT month, year, COUNT(id) AS count FROM referal_data_view GROUP BY month, year
                                    ) ref ON ref.month = m.month AND ref.year = a.year
                                )
                            ),
                            jsonb_build_object(
                                'label','Décès',
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[8],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[8],
                                'data', (
                                    SELECT jsonb_agg(COALESCE(count, 0) ORDER BY m.month, year) 
                                    FROM months m
                                    LEFT JOIN (
                                        SELECT month, year, COUNT(id) AS count FROM death_data_view GROUP BY month, year
                                    ) dth ON dth.month = m.month AND dth.year = a.year
                                )
                            ),
                            jsonb_build_object(
                                'label','Evenements',
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[9],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[9],
                                'data', (
                                    SELECT jsonb_agg(COALESCE(count, 0) ORDER BY m.month, year) 
                                    FROM months m
                                    LEFT JOIN (
                                        SELECT month, year, COUNT(id) AS count FROM events_data_view GROUP BY month, year
                                    ) ev ON ev.month = m.month AND ev.year = a.year
                                )
                            ),
                            jsonb_build_object(
                                'label','Activités Promotionnelles',
                                'backgroundColor', (SELECT color FROM colors LIMIT 1)[10],
                                'borderColor', (SELECT color FROM colors LIMIT 1)[10],
                                'data', (
                                    SELECT jsonb_agg(COALESCE(count, 0) ORDER BY m.month, year) 
                                    FROM months m
                                    LEFT JOIN (
                                        SELECT month, year, COUNT(id) AS count FROM promotional_data_view GROUP BY month, year
                                    ) pm ON pm.month = m.month AND pm.year = a.year
                                )
                            )
                        )

                    ) AS chart,

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
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM adult_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM family_planning_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pcimne_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM newborn_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pregnant_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM delivery_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM referal_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM death_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM promotional_data_view 
                        UNION ALL 
                        SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM events_data_view 
                    ) AS merged_data
                ) AS a ON r.id = a.reco_id
                    LEFT JOIN country_view c ON a.country_id = c.id 
                    LEFT JOIN region_view g ON a.region_id = g.id 
                    LEFT JOIN prefecture_view p ON a.prefecture_id = p.id 
                    LEFT JOIN commune_view m ON a.commune_id = m.id 
                    LEFT JOIN hospital_view h ON a.hospital_id = h.id 
                    LEFT JOIN district_quartier_view d ON a.district_quartier_id = d.id 
                    LEFT JOIN village_secteur_view v ON a.village_secteur_id = v.id 
                GROUP BY a.reco_id, a.year, r.id, r.name, r.phone, 
                        c.id, c.name, g.id, g.name, p.id, p.name, 
                        m.id, m.name, h.id, h.name, d.id, d.name, 
                        v.id, v.name;
 

        `);

        await CreateViewIndex('dashboard_reco_chart_performance_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('dashboard_reco_chart_performance_view', queryRunner);
    }

}







// CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_reco_chart_performance_view AS
//                 WITH months AS (
//                     SELECT unnest(ARRAY['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']) AS month
//                 )
//                 SELECT 
//                     CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
//                     a.month AS month,
//                     a.year AS year,
//                     a.reco_id AS reco_id,

//                     jsonb_build_object(
//                         'absisseLabels', (SELECT jsonb_agg(month) FROM months),
//                         'datasets', jsonb_agg(jsonb_build_object(
//                             'label', dataset.label,
//                             'backgroundColor', generate_random_color(dataset.index),
//                             'borderColor', generate_random_color(dataset.index),
//                             'data', dataset.data
//                         ))
//                     ) AS chart,

//                     jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone) AS reco,
//                     jsonb_build_object('id', c.id, 'name', c.name) AS country,
//                     jsonb_build_object('id', g.id, 'name', g.name) AS region,
//                     jsonb_build_object('id', p.id, 'name', p.name) AS prefecture,
//                     jsonb_build_object('id', m.id, 'name', m.name) AS commune,
//                     jsonb_build_object('id', h.id, 'name', h.name) AS hospital,
//                     jsonb_build_object('id', d.id, 'name', d.name) AS district_quartier,
//                     jsonb_build_object('id', v.id, 'name', v.name) AS village_secteur 

//                 FROM (
//                     -- Sous-requête pour regrouper les données en JSON
//                     SELECT 
//                         label, 
//                         index,
//                         jsonb_agg(COALESCE(count, 0) ORDER BY month) AS data
//                     FROM (
//                         SELECT 
//                             'Adult' AS label, 1 AS index, a.month, COUNT(a.id) AS count
//                         FROM adult_data_view a GROUP BY a.month
//                         UNION ALL
//                         SELECT 
//                             'PF', 2, fp.month, COUNT(fp.id)
//                         FROM family_planning_data_view fp GROUP BY fp.month
//                         UNION ALL
//                         SELECT 
//                             'Nouveau Né', 3, nb.month, COUNT(nb.id)
//                         FROM newborn_data_view nb GROUP BY nb.month
//                         UNION ALL
//                         SELECT 
//                             'Pcimne', 4, pc.month, COUNT(pc.id)
//                         FROM pcimne_data_view pc GROUP BY pc.month
//                         UNION ALL
//                         SELECT 
//                             'Enceinte', 5, preg.month, COUNT(preg.id)
//                         FROM pregnant_data_view preg GROUP BY preg.month
//                         UNION ALL
//                         SELECT 
//                             'Accouchement', 6, del.month, COUNT(del.id)
//                         FROM delivery_data_view del GROUP BY del.month
//                         UNION ALL
//                         SELECT 
//                             'Suivi Référence', 7, ref.month, COUNT(ref.id)
//                         FROM referal_data_view ref GROUP BY ref.month
//                         UNION ALL
//                         SELECT 
//                             'Décès', 8, dth.month, COUNT(dth.id)
//                         FROM death_data_view dth GROUP BY dth.month
//                         UNION ALL
//                         SELECT 
//                             'Evenements', 9, ev.month, COUNT(ev.id)
//                         FROM events_data_view ev GROUP BY ev.month
//                         UNION ALL
//                         SELECT 
//                             'Activités Promotionnelles', 10, pm.month, COUNT(pm.id)
//                         FROM promotional_data_view pm GROUP BY pm.month
//                     ) dataset
//                     GROUP BY label, index
//                 ) dataset,

//                 -- Récupération des informations du RECO et des localisations
//                 reco_view r
//                 JOIN (
//                     SELECT DISTINCT ON (reco_id, month, year) 
//                         month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id 
//                     FROM (
//                         SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM adult_data_view 
//                         UNION ALL 
//                         SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM family_planning_data_view 
//                         UNION ALL 
//                         SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pcimne_data_view 
//                         UNION ALL 
//                         SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM newborn_data_view 
//                         UNION ALL 
//                         SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pregnant_data_view 
//                         UNION ALL 
//                         SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM delivery_data_view 
//                         UNION ALL 
//                         SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM referal_data_view 
//                         UNION ALL 
//                         SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM death_data_view 
//                         UNION ALL 
//                         SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM promotional_data_view 
//                         UNION ALL 
//                         SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM events_data_view 
//                     ) AS merged_data
//                 ) AS a ON r.id = a.reco_id

//                 LEFT JOIN country_view c ON a.country_id = c.id 
//                 LEFT JOIN region_view g ON a.region_id = g.id 
//                 LEFT JOIN prefecture_view p ON a.prefecture_id = p.id 
//                 LEFT JOIN commune_view m ON a.commune_id = m.id 
//                 LEFT JOIN hospital_view h ON a.hospital_id = h.id 
//                 LEFT JOIN district_quartier_view d ON a.district_quartier_id = d.id 
//                 LEFT JOIN village_secteur_view v ON a.village_secteur_id = v.id 

//                 GROUP BY a.reco_id, a.month, a.year, r.id, r.name, r.phone, 
//                         c.id, c.name, g.id, g.name, p.id, p.name, 
//                         m.id, m.name, h.id, h.name, d.id, d.name, 
//                         v.id, v.name;








