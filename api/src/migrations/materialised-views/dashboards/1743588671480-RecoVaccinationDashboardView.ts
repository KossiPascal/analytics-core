import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class RecoVaccinationDashboardView1743588671480 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_reco_vaccination_view AS 

                SELECT * FROM (
                    SELECT 
                        CONCAT(a.month, '-', a.year, '-', a.reco_id) AS id,
                        a.month,
                        a.year,
                        a.reco_id,
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'family_id', f.id,
                                    'family_name', f.given_name,
                                    'family_fullname', f.name,
                                    'family_code', f.external_id,
                                    'family_phone', (CASE WHEN f.householder_phone IS NOT NULL AND f.householder_phone <> ''
                                                            THEN f.householder_phone
                                                          WHEN f.householder_phone_other IS NOT NULL AND f.householder_phone_other <> ''
                                                            THEN f.householder_phone_other
                                                          ELSE NULL
                                                    END),
                                    'data', (
                                              SELECT jsonb_agg(
                                                jsonb_build_object(
                                                    'family_id', f.id,
                                                    'family_name', f.given_name,
                                                    'family_fullname', f.name,
                                                    'family_code', f.external_id,
                                                    'child_id', v.child_id,
                                                    'child_name', v.child_name,
                                                    'child_code', v.child_code,
                                                    'child_sex', v.child_sex,

                                                    'reco_phone', (CASE WHEN v.child_phone IS NOT NULL AND v.child_phone <> '' AND v.child_phone = r.phone
                                                                            THEN v.child_phone
                                                                        WHEN f.householder_phone IS NOT NULL AND f.householder_phone <> '' AND f.householder_phone = r.phone
                                                                            THEN f.householder_phone
                                                                        WHEN f.householder_phone_other IS NOT NULL AND f.householder_phone_other <> '' AND f.householder_phone_other = r.phone
                                                                            THEN f.householder_phone_other
                                                                        WHEN r.phone IS NOT NULL AND r.phone  <> ''
                                                                            THEN r.phone
                                                                        ELSE NULL
                                                                  END),

                                                    'parent_phone', (CASE WHEN f.householder_phone IS NOT NULL AND f.householder_phone <> '' AND f.householder_phone <> r.phone
                                                                            THEN f.householder_phone
                                                                          ELSE NULL
                                                                    END),

                                                    'neighbor_phone', (CASE WHEN f.householder_phone_other IS NOT NULL AND f.householder_phone_other <> '' AND f.householder_phone_other <> r.phone
                                                                            THEN f.householder_phone_other
                                                                            ELSE NULL
                                                                      END),

                                                    'child_age_in_days', v.child_age_in_days,
                                                    'child_age_in_months', v.child_age_in_months,
                                                    'child_age_in_years', v.child_age_in_years,
                                                    'child_age_str', v.child_age_str,

                                                    'vaccine_BCG', v.vaccine_BCG,
                                                    'vaccine_VPO_0', v.vaccine_VPO_0,
                                                    'vaccine_PENTA_1', v.vaccine_PENTA_1,
                                                    'vaccine_VPO_1', v.vaccine_VPO_1,
                                                    'vaccine_PENTA_2', v.vaccine_PENTA_2,
                                                    'vaccine_VPO_2', v.vaccine_VPO_2,
                                                    'vaccine_PENTA_3', v.vaccine_PENTA_3,
                                                    'vaccine_VPO_3', v.vaccine_VPO_3,
                                                    'vaccine_VPI_1', v.vaccine_VPI_1,
                                                    'vaccine_VAR_1', v.vaccine_VAR_1,
                                                    'vaccine_VAA', v.vaccine_VAA,
                                                    'vaccine_VPI_2', v.vaccine_VPI_2,
                                                    'vaccine_MEN_A', v.vaccine_MEN_A,
                                                    'vaccine_VAR_2', v.vaccine_VAR_2,

                                                    'no_BCG_reason', v.no_BCG_reason,
                                                    'no_VPO_0_reason', v.no_VPO_0_reason,
                                                    'no_PENTA_1_reason', v.no_PENTA_1_reason,
                                                    'no_VPO_1_reason', v.no_VPO_1_reason,
                                                    'no_PENTA_2_reason', v.no_PENTA_2_reason,
                                                    'no_VPO_2_reason', v.no_VPO_2_reason,
                                                    'no_PENTA_3_reason', v.no_PENTA_3_reason,
                                                    'no_VPO_3_reason', v.no_VPO_3_reason,
                                                    'no_VPI_1_reason', v.no_VPI_1_reason,
                                                    'no_VAR_1_reason', v.no_VAR_1_reason,
                                                    'no_VAA_reason', v.no_VAA_reason,
                                                    'no_VPI_2_reason', v.no_VPI_2_reason,
                                                    'no_MEN_A_reason', v.no_MEN_A_reason,
                                                    'no_VAR_2_reason', v.no_VAR_2_reason
                                                ) ORDER BY v.child_name
                                            )
                                            FROM (
                                                SELECT DISTINCT ON (ppt.id) 
                                                    ppt.id AS child_id,
                                                    ppt.name AS child_name, 
                                                    ppt.external_id AS child_code, 
                                                    ppt.sex AS child_sex, 
                                                    (CASE 
                                                        WHEN ppt.phone IS NOT NULL AND ppt.phone <> ''
                                                            THEN ppt.phone
                                                        WHEN ppt.phone_other IS NOT NULL AND ppt.phone_other <> ''
                                                            THEN ppt.phone_other
                                                        ELSE NULL
                                                    END) AS child_phone,

                                                    ppt.date_of_birth AS birth_date,

                                                    calculateAgeIn('days',ppt.date_of_birth::DATE) AS child_age_in_days,
                                                    calculateAgeIn('months',ppt.date_of_birth::DATE) AS child_age_in_months,
                                                    calculateAgeIn('years',ppt.date_of_birth::DATE) AS child_age_in_years,
                                                    
                                                    ageWithFullLabel(ppt.date_of_birth::DATE) child_age_str,

                                                    ppt.family_id,
                                                    vd.reco_id,
                                                    
                                                    vd.vaccine_BCG,
                                                    vd.vaccine_VPO_0,
                                                    vd.vaccine_PENTA_1,
                                                    vd.vaccine_VPO_1,
                                                    vd.vaccine_PENTA_2,
                                                    vd.vaccine_VPO_2,
                                                    vd.vaccine_PENTA_3,
                                                    vd.vaccine_VPO_3,
                                                    vd.vaccine_VPI_1,
                                                    vd.vaccine_VAR_1,
                                                    vd.vaccine_VAA,
                                                    vd.vaccine_VPI_2,
                                                    vd.vaccine_MEN_A,
                                                    vd.vaccine_VAR_2,
                                                    (CASE 
                                                        WHEN vd.no_BCG_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_BCG_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_BCG_reason,
                                                    (CASE 
                                                        WHEN vd.no_VPO_0_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_VPO_0_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_VPO_0_reason,
                                                    (CASE 
                                                        WHEN vd.no_PENTA_1_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_PENTA_1_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_PENTA_1_reason,
                                                    (CASE 
                                                        WHEN vd.no_VPO_1_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_VPO_1_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_VPO_1_reason,
                                                    (CASE 
                                                        WHEN vd.no_PENTA_2_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_PENTA_2_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_PENTA_2_reason,
                                                    (CASE 
                                                        WHEN vd.no_VPO_2_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_VPO_2_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_VPO_2_reason,
                                                    (CASE 
                                                        WHEN vd.no_PENTA_3_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_PENTA_3_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_PENTA_3_reason,
                                                    (CASE 
                                                        WHEN vd.no_VPO_3_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_VPO_3_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_VPO_3_reason,
                                                    (CASE 
                                                        WHEN vd.no_VPI_1_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_VPI_1_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_VPI_1_reason,
                                                    (CASE 
                                                        WHEN vd.no_VAR_1_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_VAR_1_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_VAR_1_reason,
                                                    (CASE 
                                                        WHEN vd.no_VAA_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_VAA_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_VAA_reason,
                                                    (CASE 
                                                        WHEN vd.no_VPI_2_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_VPI_2_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_VPI_2_reason,
                                                    (CASE 
                                                        WHEN vd.no_MEN_A_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_MEN_A_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_MEN_A_reason,
                                                    (CASE 
                                                        WHEN vd.no_VAR_2_reason = 'shortage' THEN 'Rupture'
                                                        WHEN vd.no_VAR_2_reason = 'no_appointment_respect' THEN 'Non respect du rendez-vous' 
                                                        ELSE NULL
                                                    END) AS no_VAR_2_reason,

                                                    vd.is_birth_vaccine_ok,
                                                    vd.is_six_weeks_vaccine_ok,
                                                    vd.is_ten_weeks_vaccine_ok,
                                                    vd.is_forteen_weeks_vaccine_ok,
                                                    vd.is_nine_months_vaccine_ok,
                                                    vd.is_fifty_months_vaccine_ok

                                                FROM patient_view ppt 
                                                
                                                INNER JOIN (
                                                    SELECT 
                                                        patient_id, 
                                                        MAX(reported_date_timestamp) AS last_vaccination_date
                                                    FROM 
                                                        vaccination_data_view
                                                    WHERE
                                                        reported_date <= (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')
                                                    GROUP BY 
                                                        patient_id
                                                ) AS max_vd ON ppt.id = max_vd.patient_id

                                                INNER JOIN 
                                                        vaccination_data_view vd ON ppt.id = vd.patient_id 
                                                        AND vd.reported_date_timestamp = max_vd.last_vaccination_date 
                                                        AND vd.reported_date <= (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')

                                                WHERE 

                                                    vd.has_all_vaccine_done IS DISTINCT FROM TRUE
                                                    AND ppt.date_of_birth IS NOT NULL 
                                                    AND ppt.date_of_death IS NULL
                                                    
                                            ) AS v 
                                            WHERE 
                                                    v.family_id = f.id
                                                AND v.child_id IS NOT NULL
                                                AND v.reco_id = a.reco_id 
                                                AND calculateAgeIn('days',v.birth_date::DATE) > 0 
                                                AND calculateAgeIn('months',v.birth_date::DATE) < 60 
                                                AND (
                                                    (calculateAgeIn('days',v.birth_date::DATE) > 0 AND v.is_birth_vaccine_ok IS NOT TRUE) OR
                                                    (calculateAgeIn('days',v.birth_date::DATE) >= 42 AND (v.is_birth_vaccine_ok IS NOT TRUE OR v.is_six_weeks_vaccine_ok IS NOT TRUE)) OR
                                                    (calculateAgeIn('days',v.birth_date::DATE) >= 70 AND (v.is_birth_vaccine_ok IS NOT TRUE OR v.is_six_weeks_vaccine_ok IS NOT TRUE OR v.is_ten_weeks_vaccine_ok IS NOT TRUE)) OR
                                                    (calculateAgeIn('days',v.birth_date::DATE) >= 98 AND (v.is_birth_vaccine_ok IS NOT TRUE OR v.is_six_weeks_vaccine_ok IS NOT TRUE OR v.is_ten_weeks_vaccine_ok IS NOT TRUE OR v.is_forteen_weeks_vaccine_ok IS NOT TRUE)) OR
                                                    (calculateAgeIn('months',v.birth_date::DATE) >= 9 AND (v.is_birth_vaccine_ok IS NOT TRUE OR v.is_six_weeks_vaccine_ok IS NOT TRUE OR v.is_ten_weeks_vaccine_ok IS NOT TRUE OR v.is_forteen_weeks_vaccine_ok IS NOT TRUE OR v.is_nine_months_vaccine_ok IS NOT TRUE)) OR
                                                    (calculateAgeIn('months',v.birth_date::DATE) >= 15 AND (v.is_birth_vaccine_ok IS NOT TRUE OR v.is_six_weeks_vaccine_ok IS NOT TRUE OR v.is_ten_weeks_vaccine_ok IS NOT TRUE OR v.is_forteen_weeks_vaccine_ok IS NOT TRUE OR v.is_nine_months_vaccine_ok IS NOT TRUE OR v.is_fifty_months_vaccine_ok IS NOT TRUE))
                                                )
                                        )

                                ) ORDER BY f.given_name
                            )
                            FROM (
                                SELECT DISTINCT ON (fy.id, cpt.id) fy.id, fy.given_name, fy.name, fy.external_id , fy.reco_id, cpt.phone AS householder_phone, cpt.phone_other AS householder_phone_other
                                FROM family_view fy
                                INNER JOIN patient_view pt ON fy.id = pt.family_id  AND pt.reco_id = a.reco_id 

                                LEFT JOIN patient_view cpt ON fy.householder_id = cpt.id 

                                INNER JOIN (
                                    SELECT 
                                        patient_id, 
                                        MAX(reported_date_timestamp) AS last_vaccination_date
                                    FROM 
                                        vaccination_data_view
                                    WHERE
                                        reported_date <= (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')
                                    GROUP BY 
                                        patient_id
                                ) AS max_vdd ON pt.id = max_vdd.patient_id

                                INNER JOIN 
                                        vaccination_data_view vdd ON pt.id = vdd.patient_id 
                                        AND vdd.reported_date_timestamp = max_vdd.last_vaccination_date 
                                        AND vdd.reported_date <= (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')

                                WHERE 
                                    fy.reco_id = a.reco_id 
                                    AND vdd.has_all_vaccine_done IS DISTINCT FROM TRUE
                                    AND pt.date_of_birth IS NOT NULL 
                                    AND pt.date_of_death IS NULL
                                    AND calculateAgeIn('days',pt.date_of_birth::DATE) > 0 
                                    AND calculateAgeIn('months', pt.date_of_birth::DATE) < 60
                                    AND (
                                        (calculateAgeIn('days',pt.date_of_birth::DATE) > 0 AND vdd.is_birth_vaccine_ok IS NOT TRUE) OR
                                        (calculateAgeIn('days',pt.date_of_birth::DATE) >= 42 AND (vdd.is_birth_vaccine_ok IS NOT TRUE OR vdd.is_six_weeks_vaccine_ok IS NOT TRUE)) OR
                                        (calculateAgeIn('days',pt.date_of_birth::DATE) >= 70 AND (vdd.is_birth_vaccine_ok IS NOT TRUE OR vdd.is_six_weeks_vaccine_ok IS NOT TRUE OR vdd.is_ten_weeks_vaccine_ok IS NOT TRUE)) OR
                                        (calculateAgeIn('days',pt.date_of_birth::DATE) >= 98 AND (vdd.is_birth_vaccine_ok IS NOT TRUE OR vdd.is_six_weeks_vaccine_ok IS NOT TRUE OR vdd.is_ten_weeks_vaccine_ok IS NOT TRUE OR vdd.is_forteen_weeks_vaccine_ok IS NOT TRUE)) OR
                                        (calculateAgeIn('months',pt.date_of_birth::DATE) >= 9 AND (vdd.is_birth_vaccine_ok IS NOT TRUE OR vdd.is_six_weeks_vaccine_ok IS NOT TRUE OR vdd.is_ten_weeks_vaccine_ok IS NOT TRUE OR vdd.is_forteen_weeks_vaccine_ok IS NOT TRUE OR vdd.is_nine_months_vaccine_ok IS NOT TRUE)) OR
                                        (calculateAgeIn('months',pt.date_of_birth::DATE) >= 15 AND (vdd.is_birth_vaccine_ok IS NOT TRUE OR vdd.is_six_weeks_vaccine_ok IS NOT TRUE OR vdd.is_ten_weeks_vaccine_ok IS NOT TRUE OR vdd.is_forteen_weeks_vaccine_ok IS NOT TRUE OR vdd.is_nine_months_vaccine_ok IS NOT TRUE OR vdd.is_fifty_months_vaccine_ok IS NOT TRUE))
                                    )
                                    AND vdd.patient_id IS NOT NULL
                            ) AS f
                        ) AS children_vaccines,

                        jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone) AS reco,
                        jsonb_build_object('id', c.id, 'name', c.name) AS country,
                        jsonb_build_object('id', g.id, 'name', g.name) AS region,
                        jsonb_build_object('id', p.id, 'name', p.name) AS prefecture,
                        jsonb_build_object('id', m.id, 'name', m.name) AS commune,
                        jsonb_build_object('id', h.id, 'name', h.name) AS hospital,
                        jsonb_build_object('id', d.id, 'name', d.name) AS district_quartier,
                        jsonb_build_object('id', vs.id, 'name', vs.name) AS village_secteur 

                    FROM reco_view r

                    INNER JOIN (
                        SELECT DISTINCT ON (reco_id, month, year) 
                            month, year, reco_id, country_id, region_id, prefecture_id, commune_id, 
                            hospital_id, district_quartier_id, village_secteur_id 
                        FROM vaccination_data_view
                        ORDER BY reco_id, month, year, reported_date_timestamp DESC
                    ) AS a ON r.id = a.reco_id

                    LEFT JOIN country_view c ON a.country_id = c.id 
                    LEFT JOIN region_view g ON a.region_id = g.id 
                    LEFT JOIN prefecture_view p ON a.prefecture_id = p.id 
                    LEFT JOIN commune_view m ON a.commune_id = m.id 
                    LEFT JOIN hospital_view h ON a.hospital_id = h.id 
                    LEFT JOIN district_quartier_view d ON a.district_quartier_id = d.id 
                    LEFT JOIN village_secteur_view vs ON a.village_secteur_id = vs.id 

                    WHERE 
                        c.id IS NOT NULL AND g.id IS NOT NULL AND p.id IS NOT NULL AND m.id IS NOT NULL AND h.id IS NOT NULL AND d.id IS NOT NULL AND vs.id IS NOT NULL

                    GROUP BY a.reco_id, a.month, a.year, r.id, r.name, r.phone, 
                            c.id, c.name, g.id, g.name, p.id, p.name, 
                            m.id, m.name, h.id, h.name, d.id, d.name, 
                            vs.id, vs.name
                )
            
                WHERE children_vaccines IS NOT NULL 
                AND EXISTS (
                    SELECT 1 
                    FROM jsonb_array_elements(children_vaccines) AS family 
                    WHERE jsonb_typeof(family->'data') = 'array'  -- Vérifie que "data" est un tableau
                    AND EXISTS (
                        SELECT 1 
                        FROM jsonb_array_elements(family->'data') AS child 
                        WHERE child->>'child_name' IS NOT NULL AND child->>'child_name' <> ''
                    )
                );

        `);

        await CreateViewIndex('dashboard_reco_vaccination_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('dashboard_reco_vaccination_view', queryRunner);
    }
}
