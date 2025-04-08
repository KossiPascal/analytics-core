import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class ChwsRecoActivitiesReportsView1743193669213 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS reports_chws_reco_view AS
            SELECT 
                CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
                a.month AS month,
                a.year AS year,
                a.reco_id AS reco_id,
                 
                jsonb_build_object(
                    'index', 1,
                    'group', 'Suivi des RECO',
                    'position', 'I',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1,
                            'indicator', 'Nombre total de RECO couvert',
                            'de_number', (
                                CASE 
                                    WHEN a.reco_id IN (
                                        SELECT DISTINCT reco_id FROM vaccination_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM pcimne_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM newborn_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM family_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM patient_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM death_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM adult_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM promotional_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM events_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM pregnant_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM delivery_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM family_planning_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM reco_meg_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM referal_data_view
                                        UNION 
                                        SELECT DISTINCT reco_id FROM reco_chws_supervision_view
                                    ) 
                                    THEN 1 
                                    ELSE 0 
                                END::BIGINT
                            ),
                            'observation', NULL
                        ),

                        jsonb_build_object(
                            'index', 2,
                            'indicator', 'Nombre total de RECO supervisé au cours du mois',
                            'de_number', (
                                CASE 
                                    WHEN EXISTS (
                                        SELECT 1 
                                        FROM (
                                            SELECT DISTINCT reco_id 
                                            FROM reco_chws_supervision_view 
                                            WHERE reco_id IS NOT NULL 
                                            AND reco_id = a.reco_id 
                                            AND month = a.month AND year = a.year 
                                        ) AS reco_union
                                        WHERE reco_union.reco_id = a.reco_id
                                    ) 
                                    THEN 1 
                                    ELSE 0 
                                END::BIGINT
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3,
                            'indicator', 'Nombre de RECO fonctionnel au cours du Mois (RECO ayant déposé le rapport)',
                            'de_number', (
                                CASE 
                                    WHEN a.reco_id IN (
                                        SELECT DISTINCT reco_id FROM vaccination_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM pcimne_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM newborn_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM family_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM patient_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM death_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM adult_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM promotional_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM events_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM pregnant_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM delivery_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM family_planning_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM reco_meg_data_view WHERE month = a.month AND year = a.year
                                        UNION 
                                        SELECT DISTINCT reco_id FROM referal_data_view WHERE month = a.month AND year = a.year
                                    ) 
                                    THEN 1 
                                    ELSE 0 
                                END::BIGINT
                            ),
                            'observation', NULL
                        )
                    )
                ) AS reco_monitoring,

                jsonb_build_object(
                    'index', 2,
                    'group', 'Démographie',
                    'position', 'II',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1,
                            'indicator', 'Population couverte par les RECO (ce mois)',
                            'de_number', (
                                SELECT COUNT(id) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2,
                            'indicator', 'Nombre de ménages couverts par les RECO (ce mois)',
                            'de_number', (
                                SELECT COUNT(id) FROM family_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3,
                            'indicator', 'Nombre de Femmes enceintes dénombrées par mois (ce mois)',
                            'de_number', (
                                SELECT COUNT(*) FROM pregnant_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND form IN ('pregnancy_family_planning', 'pregnancy_register')
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 4,
                            'indicator', 'Nombre d''enfants de 0 - 11 mois dénombrés (ce mois)',
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND age_in_month_on_creation IS NOT NULL AND age_in_month_on_creation >= 0 AND age_in_month_on_creation < 12 
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 5,
                            'indicator', 'Nombre d''enfants de 12-59 mois dénombrés (ce mois)',
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND age_in_month_on_creation IS NOT NULL AND age_in_month_on_creation >= 12 AND age_in_month_on_creation < 60 
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 6,
                            'indicator', 'Nombre de femmes de 15 -49 ans dénombrées (ce mois)',
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND sex = 'F' 
                                AND month = a.month AND year = a.year 
                                AND age_in_year_on_creation IS NOT NULL AND age_in_year_on_creation >= 15  AND age_in_year_on_creation < 50  
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 7,
                            'indicator', 'Nombre de décès communautaires enregistrés par mois (ce mois)',
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND month_of_death IS NOT NULL AND year_of_death IS NOT NULL 
                                AND month_of_death = a.month AND year_of_death = a.year
                            ),
                            'observation', NULL
                        ),


                        -- TOUT TOTAL CONFONDU

                        jsonb_build_object(
                            'index', 8,
                            'indicator', 'Population couverte par les RECO (total) 📌',
                            'de_number', (
                                SELECT COUNT(id) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000)
                            ),
                            'observation', NULL
                        ),

                        jsonb_build_object(
                            'index', 9,
                            'indicator', 'Nombre de ménages couverts par les RECO (total) 📌',
                            'de_number', (
                                SELECT COUNT(id) FROM family_view 
                                WHERE reco_id = a.reco_id 
                                AND reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000)
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 10,
                            'indicator', 'Nombre de Femmes enceintes dénombrées par mois (total) 📌',
                            'de_number', (
                                SELECT COUNT(*) FROM pregnant_data_view 
                                WHERE reco_id = a.reco_id 
                                AND form IN ('pregnancy_family_planning', 'pregnancy_register')
                                AND reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) 

                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 11,
                            'indicator', 'Nombre d''enfants de 0 - 11 mois dénombrés (total) 📌',
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND age_in_month_on_creation IS NOT NULL AND age_in_month_on_creation >= 0 AND age_in_month_on_creation < 12 
                                AND reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) 
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 12,
                            'indicator', 'Nombre d''enfants de 12-59 mois dénombrés (total) 📌',
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND age_in_month_on_creation IS NOT NULL AND age_in_month_on_creation >= 12 AND age_in_month_on_creation < 60 
                                AND reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) 
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 13,
                            'indicator', 'Nombre de femmes de 15 -49 ans dénombrées (total) 📌',
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND sex = 'F' 
                                AND age_in_year_on_creation IS NOT NULL AND age_in_year_on_creation >= 15  AND age_in_year_on_creation < 50  
                                AND reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000)
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 14,
                            'indicator', 'Nombre de décès communautaires enregistrés par mois (total) 📌',
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND month_of_death IS NOT NULL AND year_of_death IS NOT NULL 
                                AND reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000)
                            ),
                            'observation', NULL
                        )
                    )
                ) AS demography,

                jsonb_build_object(
                    'index', 3,
                    'group', 'Santé de l''Enfant 0-59 Mois',
                    'position', 'III',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1, 
                            'indicator', 'Nombre de nouveaux nés de 0-45 jours à rattrapper pour le BCG', 
                            'de_number', (
                                SELECT COUNT(*) FROM vaccination_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year
                                AND vaccine_BCG IS NOT TRUE 
                                AND age_in_days IS NOT NULL AND age_in_days >= 0 AND age_in_days <= 45
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2, 
                            'indicator', 'Nombre de nouveaux nés de 0-45 jours rattrappé pour le BCG', 
                            'de_number', (
                                SELECT COUNT(*) FROM vaccination_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year
                                AND vaccine_BCG IS TRUE 
                                AND age_in_days IS NOT NULL AND age_in_days >= 0 AND age_in_days <= 45
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3, 
                            'indicator', 'Nombre de nouveaux nés de 0-45 Jours à rattrapper pour le Polio 0', 
                            'de_number', (
                                SELECT COUNT(*) FROM vaccination_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year
                                AND vaccine_VPO_0 IS NOT TRUE 
                                AND age_in_days IS NOT NULL AND age_in_days >= 0 AND age_in_days <= 45
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 4, 
                            'indicator', 'Nombre de nouveaux nés de 0-45 Jours rattrappé pour le Polio 0', 
                            'de_number', (
                                SELECT COUNT(*) FROM vaccination_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year
                                AND vaccine_VPO_0 IS TRUE 
                                AND age_in_days IS NOT NULL AND age_in_days >= 0 AND age_in_days <= 45
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 5, 
                            'indicator', 'Nombre d''enfants de 3-5 mois à rattrapper pour le Penta 3', 
                            'de_number', (
                                SELECT COUNT(*) FROM vaccination_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year
                                AND vaccine_PENTA_3 IS NOT TRUE 
                                AND age_in_months IS NOT NULL AND age_in_months >= 3 AND age_in_months <= 5
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 6, 
                            'indicator', 'Nombre d''enfants de 3-5 mois rattrappé pour le Penta 3', 
                            'de_number', (
                                SELECT COUNT(*) FROM vaccination_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year
                                AND vaccine_PENTA_3 IS TRUE 
                                AND age_in_months IS NOT NULL AND age_in_months >= 3 AND age_in_months <= 5
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 7, 
                            'indicator', 'Nombre d''enfants de 9 à 11 mois entièrement vaccinés VAR / VAA', 
                            'de_number', (
                                SELECT COUNT(*) FROM vaccination_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year
                                AND (vaccine_VAR_2 IS TRUE OR vaccine_VAA IS TRUE )
                                AND age_in_months IS NOT NULL AND age_in_months >= 9 AND age_in_months <= 11
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 8, 
                            'indicator', 'Nombre d''enfant zéro dose à rattrapper', 
                            'de_number', (
                                SELECT COUNT(*) FROM vaccination_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year
                                AND is_birth_vaccine_ok IS NOT TRUE 
                                AND is_six_weeks_vaccine_ok IS NOT TRUE  
                                AND is_ten_weeks_vaccine_ok IS NOT TRUE  
                                AND is_forteen_weeks_vaccine_ok IS NOT TRUE  
                                AND is_nine_months_vaccine_ok IS NOT TRUE  
                                AND is_fifty_months_vaccine_ok IS NOT TRUE
                                AND age_in_months IS NOT NULL AND age_in_months >= 0 AND age_in_months < 60 
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 9, 
                            'indicator', 'Nombre d''enfant zéro dose rattrappé', 
                            'de_number', (
                                SELECT COUNT(*) FROM vaccination_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year
                                AND age_in_months IS NOT NULL AND age_in_months >= 0 AND age_in_months < 60 
                                AND (is_birth_vaccine_ok IS TRUE OR is_six_weeks_vaccine_ok IS TRUE OR is_ten_weeks_vaccine_ok IS TRUE OR is_forteen_weeks_vaccine_ok IS TRUE OR is_nine_months_vaccine_ok IS TRUE OR is_fifty_months_vaccine_ok IS TRUE)
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 10, 
                            'indicator', 'Nombre de nouveau nés  referés avec signes de danger', 
                            'de_number', (
                                SELECT COUNT(DISTINCT patient_id)
                                FROM newborn_data_view 
                                WHERE reco_id = a.reco_id 
                                    AND month = a.month AND year = a.year
                                    AND is_referred IS TRUE
                                    AND has_danger_sign IS TRUE
                                    AND age_in_months IS NOT NULL AND age_in_months >= 0 AND age_in_months < 2
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 11, 
                            'indicator', 'Nombre de nouveau-nés enregistrés par mois par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND year = a.year 
                                AND month = a.month 
                                AND age_in_month_on_creation IS NOT NULL AND age_in_month_on_creation >= 0 AND age_in_month_on_creation < 2  
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 12, 
                            'indicator', 'Nombre d''enfants orientés pour l''extrait de naissance', 
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND year = a.year 
                                AND month = a.month 
                                AND has_birth_certificate IS NOT TRUE 
                                AND age_in_month_on_creation IS NOT NULL AND age_in_month_on_creation >= 0 AND age_in_month_on_creation < 60  
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 13, 
                            'indicator', 'Nombre d''enfants ayant reçu l''extrait de naissance', 
                            'de_number', (
                                SELECT COUNT(*) FROM patient_view 
                                WHERE reco_id = a.reco_id 
                                AND year = a.year AND month = a.month 
                                AND has_birth_certificate IS TRUE 
                                AND age_in_month_on_creation IS NOT NULL AND age_in_month_on_creation >= 0 AND age_in_month_on_creation < 60  
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 14, 
                            'indicator', 'Nombre d''enfants de 6 à 59 mois orienté pour la vitamine A ❌', 
                            'de_number', 0, 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 15, 
                            'indicator', 'Nombre d''enfant  évalués pour la malnutrition', 
                            'de_number', (
                                SELECT COUNT(DISTINCT patient_id)
                                FROM (
                                    SELECT patient_id 
                                    FROM pcimne_data_view 
                                    WHERE year = a.year AND month = a.month AND reco_id = a.reco_id AND patient_id IS NOT NULL AND has_malnutrition IS TRUE  
                                    
                                    UNION ALL 

                                    SELECT patient_id FROM newborn_data_view 
                                    WHERE year = a.year AND month = a.month AND reco_id = a.reco_id AND patient_id IS NOT NULL AND has_malnutrition IS TRUE  
                                )
                                
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 16, 
                            'indicator', 'Nombre total d''enfants de 06 à 59 mois dont PB est inferieur à 12,5 Cm', 
                            'de_number', (
                                SELECT COUNT(DISTINCT patient_id)
                                FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id AND year = a.year AND month = a.month 
                                    AND age_in_months IS NOT NULL AND age_in_months >= 6 AND age_in_months < 60 
                                    AND has_malnutrition IS TRUE AND (has_modere_malnutrition IS TRUE OR has_severe_malnutrition IS TRUE) 
                                
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 17, 
                            'indicator', 'Nombre d''enfants de 6 à 59 mois à risque de Malnutrition orientés vers le centre/poste de santé (❌)', 
                            'de_number', (
                                SELECT COUNT(DISTINCT patient_id)
                                FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id AND year = a.year AND month = a.month 
                                    AND age_in_months IS NOT NULL AND age_in_months >= 6 AND age_in_months < 60 
                                    AND has_malnutrition IS TRUE AND is_referred IS TRUE
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 18, 
                            'indicator', 'Nombre total de cas de diarrhées chez les enfants de 0 à 59 mois', 
                            'de_number', (
                                SELECT COUNT(DISTINCT patient_id)
                                FROM (
                                    SELECT patient_id FROM pcimne_data_view 
                                        WHERE patient_id IS NOT NULL AND reco_id = a.reco_id AND has_diarrhea IS TRUE AND year = a.year 
                                        AND month = a.month AND age_in_months IS NOT NULL AND age_in_months >= 0 AND age_in_months < 60 
                                    
                                    UNION ALL 
                                    
                                    SELECT patient_id FROM newborn_data_view 
                                        WHERE patient_id IS NOT NULL AND reco_id = a.reco_id AND has_diarrhea IS TRUE AND year = a.year 
                                        AND month = a.month AND age_in_months IS NOT NULL AND age_in_months >= 0 AND age_in_months < 60 
                                )
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 19, 
                            'indicator', 'Nombre d''enfants 0-59 mois avec diarrhées ayant recu SRO + Zinc', 
                            'de_number', (
                                SELECT COUNT(DISTINCT patient_id)
                                FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                    AND year = a.year AND month = a.month 
                                    AND age_in_months IS NOT NULL AND age_in_months >= 2 AND age_in_months < 60 
                                    AND has_diarrhea IS TRUE AND ((ors IS NOT NULL AND ors > 0) OR (zinc IS NOT NULL AND zinc > 0))
                                
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 20, 
                            'indicator', 'Nombre de ménages ayant des latrines fonctionnelles dans leur foyer', 
                            'de_number', (
                                SELECT COUNT(id) FROM family_view 
                                WHERE reco_id = a.reco_id 
                                    AND year = a.year AND month = a.month 
                                    AND household_has_working_latrine IS TRUE 
                                    AND reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000)
                            ),
                            'observation', NULL
                        ),

                        jsonb_build_object(
                            'index', 21, 
                            'indicator', 'Nombre de ménages vivant avec les enfants de 0 à 59 mois ayant accès à l''eau potable', 
                            'de_number', (
                                SELECT COUNT(id) FROM family_view 
                                WHERE id IN (
                                    SELECT DISTINCT family_id
                                    FROM patient_view 
                                    WHERE year = a.year AND month = a.month 
                                    AND reco_id = a.reco_id 
                                    AND date_of_birth IS NOT NULL AND AGE(CURRENT_DATE, date_of_birth) < INTERVAL '60 months'
                                ) 
                                AND reco_id = a.reco_id 
                                AND household_has_good_water_access IS TRUE 
                                AND year = a.year AND month = a.month 
                                AND reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000)
                            ),
                            'observation', NULL
                        )
                    )
                ) AS child_health_0_59_months,

                jsonb_build_object(
                    'index', 4,
                    'group', 'Santé de la Mère',
                    'position', 'IV',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1, 
                            'indicator', 'Nombre de femmes enceintes orientées par mois en CPN 1', 
                            'de_number', (
                                SELECT COUNT(*) FROM pregnant_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND form IN ('pregnancy_family_planning', 'pregnancy_register') 
                                AND cpn_done IS NOT TRUE AND (cpn_number IS NULL OR cpn_number <= 0)
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2, 
                            'indicator', 'Nombre d’accouchements à domicile (uniquement)', 
                            'de_number', (
                                SELECT COUNT(*) FROM delivery_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_home_delivery IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3, 
                            'indicator', 'Nombre total de femmes enceintes orienté par les RECO dans une structure de santé pour accouchement', 
                            'de_number', (
                                SELECT COUNT(*) FROM pregnant_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND form IN ('pregnancy_family_planning', 'pregnancy_register') 
                                AND is_home_delivery_wanted IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 4, 
                            'indicator', 'Nombre de décès maternels à domicile enregistrés par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM death_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND sex = 'F' 
                                AND is_maternal_death IS TRUE 
                                AND is_home_death IS TRUE 
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 5, 
                            'indicator', 'Nombre de décès néonatals (<28 jours) à domicile enregistrés par les RECO', 
                            'de_number', (
                                SELECT COUNT(*)
                                FROM (
                                    SELECT id FROM death_data_view 
                                    WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND is_home_death IS TRUE 
                                        AND age_in_days IS NOT NULL AND age_in_days >= 0 AND age_in_days < 28
                                    
                                    UNION ALL

                                    SELECT id FROM patient_view 
                                    WHERE reco_id = a.reco_id AND month = a.month AND year = a.year AND is_home_death IS TRUE 
                                        AND age_in_day_on_creation IS NOT NULL AND age_in_day_on_creation >= 0 AND age_in_day_on_creation < 28
                                )
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 6, 
                            'indicator', 'Nombre de décès d''enfants de moins de cinq ans (<5 ans) à domicile enregistrés par les RECO', 
                            'de_number', (
                                SELECT COUNT(*)
                                FROM (
                                    SELECT id FROM death_data_view 
                                    WHERE reco_id = a.reco_id AND month = a.month AND is_home_death IS TRUE 
                                        AND age_in_months IS NOT NULL AND age_in_months >= 0 AND age_in_months < 60 
                                    
                                    UNION ALL

                                    SELECT id FROM patient_view 
                                    WHERE reco_id = a.reco_id AND month = a.month AND is_home_death IS TRUE 
                                        AND age_in_month_on_creation IS NOT NULL AND age_in_month_on_creation >= 0 AND age_in_month_on_creation < 60
                                )
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 7, 
                            'indicator', 'Nombre de femme enceintes orientée vers le CS par les RECO pour CPN', 
                            'de_number', (
                                SELECT COUNT(*) FROM pregnant_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND form IN ('pregnancy_family_planning', 'pregnancy_register') 
                                AND cpn_done IS NOT TRUE
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 8, 
                            'indicator', 'Nombre de femmes nouvelles utilisatrices des methodes contraceptives dans la communauté', 
                            'de_number', (
                                SELECT COUNT(*) FROM family_planning_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND form IN ('pregnancy_family_planning', 'family_planning') 
                                AND has_counseling IS TRUE 
                                AND already_use_method IS NOT TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 9, 
                            'indicator', 'Nombre de femmes enceintes referées au CS par les RECO avec signes de danger', 
                            'de_number', (
                                SELECT COUNT(*) FROM pregnant_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND form IN ('pregnancy_family_planning', 'pregnancy_register') 
                                AND is_referred IS TRUE 
                                AND has_danger_sign IS TRUE 
                            ), 
                            'observation', NULL
                        )
                    )
                ) AS mother_health,
                
                jsonb_build_object(
                    'index', 5,
                    'group', 'ACTIVITE PCIMNE',
                    'position', 'V',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1, 
                            'indicator', 'Nombre de TDR palu effectué par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND rdt_given IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2, 
                            'indicator', 'Nombre de TDR palu positif réalisé par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND rdt_given IS TRUE 
                                AND has_malaria IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3, 
                            'indicator', 'Nombre de cas traités avec CTA par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND rdt_given IS TRUE 
                                AND has_malaria IS TRUE 
                                AND (
                                    (cta_nn IS NOT NULL AND cta_nn > 0) OR 
                                    (cta_pe IS NOT NULL AND cta_pe > 0) OR 
                                    (cta_ge IS NOT NULL AND cta_ge > 0) OR 
                                    (cta_ad IS NOT NULL AND cta_ad > 0)
                                )
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 4, 
                            'indicator', 'Nombre de cas de palu grave reféré par les RECO au CS', 
                            'de_number', (
                                SELECT COUNT(*) FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND rdt_given IS TRUE 
                                AND has_malaria IS TRUE 
                                AND is_principal_referal IS TRUE 
                                AND has_serious_malaria IS TRUE 
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 5, 
                            'indicator', 'Nombre de cas de deces lié au paludisme enregistré par le RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM death_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND has_malaria IS TRUE 
                                AND age_in_months IS NOT NULL AND age_in_months >=0 AND age_in_months < 60
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 6, 
                            'indicator', 'Nombre de cas de diarrhée enregistré par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND has_diarrhea IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 7, 
                            'indicator', 'Nombre de cas de diarrhée reféré par les RECO au CS', 
                            'de_number', (
                                SELECT COUNT(*) FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND has_diarrhea IS TRUE 
                                AND is_referred IS TRUE 
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 8, 
                            'indicator', 'Nombre de deces dû à la diarrhée enregistré par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM death_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND has_diarrhea IS TRUE 
                                AND age_in_months IS NOT NULL AND age_in_months >=0 AND age_in_months < 60
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 9, 
                            'indicator', 'Nombre de cas de diarrhée traités par les RECO avec SRO et ZINC', 
                            'de_number', (
                                SELECT COUNT(*) FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND has_diarrhea IS TRUE 
                                AND (
                                    (ors IS NOT NULL AND ors > 0) OR 
                                    (zinc IS NOT NULL AND zinc > 0)
                                )
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 10, 
                            'indicator', 'Nombre de cas de Toux/Difficulté respiratoire/pneumonie simple enregisté par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND has_pneumonia IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 11, 
                            'indicator', 'Nombre de cas  traités avec Amoxicilline de Toux/Difficulté respiratoire/pneumonie simple enregisté par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND (has_pneumonia IS TRUE OR has_cough_cold IS TRUE) 
                                AND (
                                    (amoxicillin_250mg IS NOT NULL AND amoxicillin_250mg > 0) OR 
                                    (amoxicillin_500mg IS NOT NULL AND amoxicillin_500mg > 0)
                                ) 
                                AND age_in_months IS NOT NULL AND age_in_months >= 0 AND age_in_months < 60
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 12, 
                            'indicator', 'Nombre de cas  reféré de Toux/Difficulté respiratoire/pneumonie simple par les RECO', 
                            'de_number', (
                                SELECT COUNT(DISTINCT patient_id)
                                FROM pcimne_data_view 
                                WHERE reco_id = a.reco_id 
                                    AND year = a.year AND month = a.month 
                                    AND age_in_months IS NOT NULL AND age_in_months >= 0 AND age_in_months < 60 
                                    AND is_referred = TRUE 
                                    AND has_pneumonia = TRUE 
                                    AND has_cough_cold = TRUE 
                                
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 13, 
                            'indicator', 'Nombre de deces Toux/Difficulté respiratoire/pneumonie simple', 
                            'de_number', (
                                SELECT COUNT(*) FROM death_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND age_in_months IS NOT NULL AND age_in_months >=0 AND age_in_months < 60 
                                AND (has_cough_cold IS TRUE OR has_pneumonia IS TRUE)
                            ),  
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 14, 
                            'indicator', 'Nombre de traitements de pré-référence (RECTOCAPS) réalisées par les RECO ❌', 
                            'de_number', 0, 
                            'observation', NULL
                        )
                    )
                ) AS pcimne_activity,
                
                jsonb_build_object(
                    'index', 6,
                    'group', 'ACTIVITES MORBIDITES',
                    'position', 'VI',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1, 
                            'indicator', 'Nombre de cas d''accident de circulation notifié par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND traffic_accident IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2, 
                            'indicator', 'Nombre de cas de brûlure notifié par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND burns IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3, 
                            'indicator', 'Nombre de cas suspects de TB orienté par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND suspected_tb IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 4, 
                            'indicator', 'Nombre de cas de dermatose orienté par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND dermatosis IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 5, 
                            'indicator', 'Nombre de cas de diarrhées réferé par les RECO > à 5 ans', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND diarrhea IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 6, 
                            'indicator', 'Nombre de cas d''écoulement uretrale réferé au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND urethral_discharge IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 7, 
                            'indicator', 'Nombre de cas d''écoulement vaginal réferé au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND vaginal_discharge IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 8, 
                            'indicator', 'Nombre de cas de perte urinaire réferé au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND loss_of_urine IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 9, 
                            'indicator', 'Nombre de cas d''ingestion accidentelle des produits caustiques réferé au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND accidental_ingestion_caustic_products IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 10, 
                            'indicator', 'Nombre de cas d''intoxication alimentaire réferée au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND food_poisoning IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 11, 
                            'indicator', 'Nombre de cas de maladies bucco-dentaires réferé au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND oral_and_dental_diseases IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 12, 
                            'indicator', 'Nombre de cas de morsure de chien réferée au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND dog_bites IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 13, 
                            'indicator', 'Nombre de cas de morsure de serpent réferée au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND snake_bite IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 14, 
                            'indicator', 'Nombre de cas de rougeole réferé au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND measles IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 15, 
                            'indicator', 'Nombre de cas de violence basées sur le genre (VBG) réferé au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND gender_based_violence IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        )
                    )
                ) AS morbidity_activities,
                
                jsonb_build_object(
                    'index', 7,
                    'group', 'Paludisme(supérieur à 5 ans)',
                    'position', 'VII',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1, 
                            'indicator', 'Nombre de TDR effectué par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND rdt_given IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2, 
                            'indicator', 'Nombre de TDR positif réalisé par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND rdt_given IS TRUE 
                                AND rdt_result = 'positive'
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3, 
                            'indicator', 'Nombre de cas de palu traités avec CTA par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND has_malaria IS TRUE 
                                AND (
                                    (cta_nn IS NOT NULL AND cta_nn > 0) OR 
                                    (cta_pe IS NOT NULL AND cta_pe > 0) OR 
                                    (cta_ge IS NOT NULL AND cta_ge > 0) OR 
                                    (cta_ad IS NOT NULL AND cta_ad > 0)
                                )
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 4, 
                            'indicator', 'Nombre de cas  de palu reféré au CS par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND has_malaria IS TRUE 
                                AND is_referred IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 5, 
                            'indicator', 'Nombre de cas de deces lié au paludisme notifié par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM adult_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND has_malaria IS TRUE 
                                AND age_in_months IS NOT NULL AND age_in_months >= 60
                            ), 
                            'observation', NULL
                        )
                    )
                ) AS malaria_more_5_years,

                jsonb_build_object(
                    'index', 8,
                    'bigGroup', 'ACTIVITE PROMOTIONNELLE',
                    'group', 'VISITE A DOMICILE',
                    'position', 'VIII',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1, 
                            'indicator', 'Nombre de visites à domicile réalisée par les RECO par mois', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_vad_method IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2, 
                            'indicator', 'Nombre d''homme touché  par les VAD', 
                            'de_number', (
                                SELECT COALESCE(SUM(CAST(men_number AS BIGINT)), 0) 
                                FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_vad_method IS TRUE 
                                AND men_number IS NOT NULL 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3, 
                            'indicator', 'Nombre de femmes touchées par les VAD', 
                            'de_number', (
                                SELECT COALESCE(SUM(CAST(women_number AS BIGINT)), 0) 
                                FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_vad_method IS TRUE 
                                AND women_number IS NOT NULL 
                            ), 
                            'observation', NULL
                        )
                    )
                ) AS home_visit,
                
                jsonb_build_object(
                    'index', 9,
                    'bigGroup', 'ACTIVITE PROMOTIONNELLE',
                    'group', 'CAUSERIE EDUCATIVE',
                    'position', 'VIII',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1, 
                            'indicator', 'Nombre de causeries éducatives effectuées par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_talk_method IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2, 
                            'indicator', 'Nombre d''homme touché  par les causeries éducatives', 
                            'de_number', (
                                SELECT COALESCE(SUM(CAST(men_number AS BIGINT)), 0)
                                FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_talk_method IS TRUE 
                                AND men_number IS NOT NULL
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3, 
                            'indicator', 'Nombre de femmes touchées par les causeries éducatives', 
                            'de_number', (
                                SELECT COALESCE(SUM(CAST(women_number AS BIGINT)), 0) 
                                FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_talk_method IS TRUE 
                                AND women_number IS NOT NULL
                            ), 
                            'observation', NULL
                        )
                    )
                ) AS educational_talk,
                
                jsonb_build_object(
                    'index', 9,
                    'bigGroup', 'ACTIVITE PROMOTIONNELLE',
                    'group', 'CAUSERIE INTERPERSONELLE',
                    'position', 'VIII',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1, 
                            'indicator', 'Nombre de causeries interpersonelles effectuées par les RECO', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_interpersonal_talk_method IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2, 
                            'indicator', 'Nombre d''homme ayant reçu de causeries interpersonelles', 
                            'de_number', (
                                SELECT COALESCE(SUM(CAST(men_number AS BIGINT)), 0)
                                FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_interpersonal_talk_method IS TRUE 
                                AND men_number IS NOT NULL
                            ),
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3, 
                            'indicator', 'Nombre de femmes ayant reçu de causeries interpersonelles', 
                            'de_number', (
                                SELECT COALESCE(SUM(CAST(women_number AS BIGINT)), 0) 
                                FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_interpersonal_talk_method IS TRUE 
                                AND women_number IS NOT NULL
                            ), 
                            'observation', NULL
                        )
                    )
                ) AS interpersonal_talk,

                jsonb_build_object(
                    'index', 10,
                    'group', 'DOMAINES DEVELOPPES',
                    'position', 'IX',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1, 
                            'indicator', 'Paludisme', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_malaria_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2, 
                            'indicator', 'Planification Familiale', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_family_planning_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3, 
                            'indicator', 'CPN', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_prenatal_consultation_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 4, 
                            'indicator', 'CPoN', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_post_natal_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 5, 
                            'indicator', 'Accouchement', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_delivery_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 6, 
                            'indicator', 'Vaccination', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_vaccination_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 7, 
                            'indicator', 'IST / VIH', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_disease_control_domain IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 8, 
                            'indicator', 'Tuberculose', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_tuberculosis_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 9, 
                            'indicator', 'Nutrition', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_nutrition_domain IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 10, 
                            'indicator', 'Eau, Hygiène et aissainement', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_water_hygiene_domain IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 11, 
                            'indicator', 'VBG', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_gbv_domain IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 12, 
                            'indicator', 'MGF', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_female_genital_mutilation_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 13, 
                            'indicator', 'Diarrhée', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_diarrhea_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 14, 
                            'indicator', 'Pneumonie', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_pneumonia_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 15, 
                            'indicator', 'Enregistrement des Naissances', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_birth_registration_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 16, 
                            'indicator', 'Lèpre', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_leprosy_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 17, 
                            'indicator', 'Pertes d''Urines', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_urine_loss_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 18, 
                            'indicator', 'Diabète', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_diabetes_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 19, 
                            'indicator', 'Tension artérielle', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_blood_pressure_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 20, 
                            'indicator', 'Onchocercose', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_onchocerciasis_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 21, 
                            'indicator', 'Trypanosomiase Humaine Africaine', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_human_african_trypanosomiasis_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 22, 
                            'indicator', 'PFA', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_pfa_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 23, 
                            'indicator', 'Diarrhée sanglante', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_bloody_diarrhea_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 24, 
                            'indicator', 'Fièvre Jaune', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_yellow_fever_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 25, 
                            'indicator', 'Cholera', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_cholera_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 26, 
                            'indicator', 'Tétanos Maternel et Néonatal', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_tetanus_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 27, 
                            'indicator', 'Maladies virales', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_viral_diseases_theme IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 28, 
                            'indicator', 'Méningite', 
                            'de_number', (
                                SELECT COUNT(*) FROM promotional_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_meningitis_theme IS TRUE 
                            ), 
                            'observation', NULL
                        )
                    )
                ) AS developed_areas,
                
                jsonb_build_object(
                    'index', 11,
                    'group', 'MALADIES ET EVENEMENTS NOTIFIES ET ALERTES',
                    'position', 'X',
                    'data', jsonb_build_array(
                        jsonb_build_object(
                            'index', 1, 
                            'indicator', 'PFA', 
                            'de_number', (
                                SELECT COUNT(*) FROM events_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_pfa IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 2, 
                            'indicator', 'Diarrhée sanglante', 
                            'de_number', (
                                SELECT COUNT(*) FROM events_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_bloody_diarrhea IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 3, 
                            'indicator', 'Fièvre Jaune', 
                            'de_number', (
                                SELECT COUNT(*) FROM events_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_yellow_fever IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 4, 
                            'indicator', 'Cholera', 
                            'de_number', (
                                SELECT COUNT(*) FROM events_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_cholera IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 5, 
                            'indicator', 'Tétanos Maternel et Néonatal', 
                            'de_number', (
                                SELECT COUNT(*) FROM events_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_maternal_and_neonatal_tetanus IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 6, 
                            'indicator', 'Maladies virales(ebola, marburg, lassa)', 
                            'de_number', (
                                SELECT COUNT(*) FROM events_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_viral_diseases IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 7, 
                            'indicator', 'Méningite', 
                            'de_number', (
                                SELECT COUNT(*) FROM events_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_meningitis IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 8, 
                            'indicator', 'Décès maternels', 
                            'de_number', (
                                SELECT COUNT(*) FROM events_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_maternal_deaths IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 9, 
                            'indicator', 'Décès communautaires', 
                            'de_number', (
                                SELECT COUNT(*) FROM events_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_community_deaths IS TRUE 
                            ), 
                            'observation', NULL
                        ),
                        jsonb_build_object(
                            'index', 10, 
                            'indicator', 'Fievre grippale', 
                            'de_number', (
                                SELECT COUNT(*) FROM events_data_view 
                                WHERE reco_id = a.reco_id 
                                AND month = a.month AND year = a.year 
                                AND is_influenza_fever IS TRUE 
                            ), 
                            'observation', NULL
                        )
                    )
                ) AS diseases_alerts,

                jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone) AS reco,
                jsonb_build_object('id', c.id, 'name', c.name) AS country,
                jsonb_build_object('id', g.id, 'name', g.name) AS region,
                jsonb_build_object('id', p.id, 'name', p.name) AS prefecture,
                jsonb_build_object('id', m.id, 'name', m.name) AS commune,
                jsonb_build_object('id', h.id, 'name', h.name) AS hospital,
                jsonb_build_object('id', d.id, 'name', d.name) AS district_quartier,
                jsonb_build_object('id', v.id, 'name', v.name) AS village_secteur 

            FROM reco_view r

            RIGHT JOIN (
                SELECT DISTINCT ON (reco_id, month, year) 
                    month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id 
                FROM (
                    -- UNION de toutes les tables avec les mêmes colonnes
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM vaccination_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pcimne_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM newborn_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM family_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM patient_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM death_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM adult_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM promotional_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM events_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM pregnant_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM delivery_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM family_planning_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM reco_meg_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM referal_data_view 
                    UNION ALL 
                    SELECT month, year, reco_id, country_id, region_id, prefecture_id, commune_id, hospital_id, district_quartier_id, village_secteur_id FROM reco_chws_supervision_view 
                ) AS merged_data
            ) AS a ON a.reco_id = r.id 

            LEFT JOIN country_view c ON a.country_id = c.id
            LEFT JOIN region_view g ON a.region_id = g.id
            LEFT JOIN prefecture_view p ON a.prefecture_id = p.id
            LEFT JOIN commune_view m ON a.commune_id = m.id
            LEFT JOIN hospital_view h ON a.hospital_id = h.id
            LEFT JOIN district_quartier_view d ON a.district_quartier_id = d.id
            LEFT JOIN village_secteur_view v ON a.village_secteur_id = v.id

            WHERE 
                c.id IS NOT NULL AND g.id IS NOT NULL AND p.id IS NOT NULL AND m.id IS NOT NULL AND h.id IS NOT NULL AND d.id IS NOT NULL AND v.id IS NOT NULL

            GROUP BY a.reco_id, a.month, a.year, r.id, r.name, r.phone, 
                    c.id, c.name, g.id, g.name, p.id, p.name, 
                    m.id, m.name, h.id, h.name, d.id, d.name, 
                    v.id, v.name;
        `);

        await CreateViewIndex('reports_chws_reco_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('reports_chws_reco_view', queryRunner);
    }

}

