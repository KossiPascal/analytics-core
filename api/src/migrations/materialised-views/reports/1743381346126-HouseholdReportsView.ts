import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class HouseholdReportsView1743381346126 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS reports_household_view AS
                SELECT 
                    CONCAT(a.month, '-', a.year, '-', a.reco_id, '-', a.id) AS id,
                    a.month,
                    a.year,
                    a.reco_id,

                    a.external_id AS household_code, 
                    a.name AS household_name,
                    a.household_has_working_latrine AS has_functional_latrine,
                    a.household_has_good_water_access AS has_drinking_water_access,

                    COUNT(CASE
                        WHEN p.reco_id = a.reco_id AND p.family_id = a.id 
                            AND p.reported_date_timestamp <= (EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000)
                        THEN 1 
                    END) AS total_household_members,

                    COUNT(CASE 
                        WHEN p.sex = 'F' 
                            AND EXTRACT(YEAR FROM AGE(TO_TIMESTAMP((EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) / 1000), p.date_of_birth)) >= 15 
                            AND EXTRACT(YEAR FROM AGE(TO_TIMESTAMP((EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) / 1000), p.date_of_birth)) < 50
                        THEN 1 
                    END) AS total_women_15_50_years,

                    COUNT(CASE 
                        WHEN EXTRACT(YEAR FROM AGE(TO_TIMESTAMP((EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) / 1000), p.date_of_birth)) >= 0 
                            AND EXTRACT(YEAR FROM AGE(TO_TIMESTAMP((EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) / 1000), p.date_of_birth)) < 5
                        THEN 1 
                    END) AS total_children_under_5_years,

                    COUNT(CASE 
                        WHEN EXTRACT(MONTH FROM AGE(TO_TIMESTAMP((EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) / 1000), p.date_of_birth)) >= 0 
                            AND EXTRACT(MONTH FROM AGE(TO_TIMESTAMP((EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) / 1000), p.date_of_birth)) < 12
                        THEN 1 
                    END) AS total_children_0_12_months,

                    COUNT(CASE 
                        WHEN EXTRACT(MONTH FROM AGE(TO_TIMESTAMP((EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) / 1000), p.date_of_birth)) >= 12 
                            AND EXTRACT(MONTH FROM AGE(TO_TIMESTAMP((EXTRACT(EPOCH FROM (DATE_TRUNC('month', TO_DATE(a.year || '-' || a.month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 microsecond')) * 1000) / 1000), p.date_of_birth)) < 60
                        THEN 1 
                    END) AS total_children_12_60_months,

                    jsonb_build_object('id', r.id, 'name', r.name, 'phone', r.phone) AS reco,
                    jsonb_build_object('id', c.id, 'name', c.name) AS country,
                    jsonb_build_object('id', g.id, 'name', g.name) AS region,
                    jsonb_build_object('id', pr.id, 'name', pr.name) AS prefecture,
                    jsonb_build_object('id', m.id, 'name', m.name) AS commune,
                    jsonb_build_object('id', h.id, 'name', h.name) AS hospital,
                    jsonb_build_object('id', d.id, 'name', d.name) AS district_quartier,
                    jsonb_build_object('id', v.id, 'name', v.name) AS village_secteur
                    

                FROM family_view a

                    LEFT JOIN reco_view r ON a.reco_id = r.id 
                    LEFT JOIN country_view c ON a.country_id = c.id 
                    LEFT JOIN region_view g ON a.region_id = g.id 
                    LEFT JOIN prefecture_view pr ON a.prefecture_id = pr.id 
                    LEFT JOIN commune_view m ON a.commune_id = m.id 
                    LEFT JOIN hospital_view h ON a.hospital_id = h.id 
                    LEFT JOIN district_quartier_view d ON a.district_quartier_id = d.id 
                    LEFT JOIN village_secteur_view v ON a.village_secteur_id = v.id 
                    LEFT JOIN patient_view p ON p.family_id = a.id

                GROUP BY a.id, r.id, r.name, r.phone, a.reco_id, a.month, a.year,
                        a.external_id, a.name, 
                        a.household_has_working_latrine, a.household_has_good_water_access, 
                        c.id, c.name, g.id, g.name, pr.id, pr.name, 
                        m.id, m.name, h.id, h.name, d.id, d.name, 
                        v.id, v.name;

        `);

        await CreateViewIndex('reports_household_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    public async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('reports_household_view', queryRunner);
    }

}

