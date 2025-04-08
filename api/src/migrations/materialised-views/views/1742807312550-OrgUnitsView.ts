import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class OrgUnitsView1742807312550 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  country_view AS
                SELECT 
                    (c.doc->>'_id')::UUID AS id,
                    (c.doc->>'_rev')::TEXT AS rev,
                    (c.doc->>'name')::TEXT AS name,
                    (c.doc->>'external_id')::TEXT AS external_id,
                    (c.doc->>'code')::TEXT AS code,
                    CASE WHEN c.doc->>'geolocation' IS NULL OR c.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(c.doc->'geolocation') IS NOT NULL THEN (c.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (c.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((c.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((c.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((c.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((c.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0') AS month 
                FROM couchdb c
                WHERE c.doc->>'type' = 'country' OR c.doc->>'contact_type' = 'country';
        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  region_view AS 
                SELECT 
                    (r.doc->>'_id')::UUID AS id,
                    (r.doc->>'_rev')::TEXT AS rev,
                    (r.doc->>'name')::TEXT AS name,
                    (r.doc->>'external_id')::TEXT AS external_id,
                    (r.doc->>'code')::TEXT AS code,
                    CASE WHEN r.doc->>'geolocation' IS NULL OR r.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(r.doc->'geolocation') IS NOT NULL THEN (r.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (r.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((r.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((r.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((r.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((r.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (r.doc->'parent'->>'_id')::UUID AS country_id,
                    json_build_object('id', c.id, 'name', c.name) AS country 
                FROM couchdb r 
                    LEFT JOIN country_view c ON (r.doc->'parent'->>'_id')::UUID = c.id 
                WHERE r.doc->'parent' ? '_id' AND (r.doc->>'type' = 'region' OR r.doc->>'contact_type' = 'region');

        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  prefecture_view AS 
                SELECT 
                    (p.doc->>'_id')::UUID AS id,
                    (p.doc->>'_rev')::TEXT AS rev,
                    (p.doc->>'name')::TEXT AS name,
                    (p.doc->>'external_id')::TEXT AS external_id,
                    (p.doc->>'code')::TEXT AS code,
                    CASE WHEN p.doc->>'geolocation' IS NULL OR p.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(p.doc->'geolocation') IS NOT NULL THEN (p.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (p.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (p.doc->'parent'->>'_id')::UUID AS region_id,
                    (p.doc->'parent'->'parent'->>'_id')::UUID AS country_id,
                    json_build_object('id', c.id, 'name', c.name) AS country,
                    json_build_object('id', r.id, 'name', r.name) AS region 
                FROM couchdb p 
                    LEFT JOIN region_view r ON (p.doc->'parent'->>'_id')::UUID = r.id 
                    LEFT JOIN country_view c ON (p.doc->'parent'->'parent'->>'_id')::UUID = c.id 
                WHERE p.doc->'parent' ? '_id' 
                    AND p.doc->'parent'->'parent' ? '_id' 
                    AND (p.doc->>'type' = 'prefecture' OR p.doc->>'contact_type' = 'prefecture');

        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  commune_view AS 
                SELECT 
                    (cm.doc->>'_id')::UUID AS id,
                    (cm.doc->>'_rev')::TEXT AS rev,
                    (cm.doc->>'name')::TEXT AS name,
                    (cm.doc->>'external_id')::TEXT AS external_id,
                    (cm.doc->>'code')::TEXT AS code,
                    CASE WHEN cm.doc->>'geolocation' IS NULL OR cm.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(cm.doc->'geolocation') IS NOT NULL THEN (cm.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (cm.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((cm.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((cm.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((cm.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((cm.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (cm.doc->'parent'->>'_id')::UUID AS prefecture_id,
                    (cm.doc->'parent'->'parent'->>'_id')::UUID AS region_id,
                    (cm.doc->'parent'->'parent'->'parent'->>'_id')::UUID AS country_id,
                    json_build_object('id', c.id, 'name', c.name) AS country, 
                    json_build_object('id', r.id, 'name', r.name) AS region, 
                    json_build_object('id', p.id, 'name', p.name) AS prefecture 
                FROM couchdb cm 
                    LEFT JOIN prefecture_view p ON (cm.doc->'parent'->>'_id')::UUID = p.id 
                    LEFT JOIN region_view r ON (cm.doc->'parent'->'parent'->>'_id')::UUID = r.id 
                    LEFT JOIN country_view c ON (cm.doc->'parent'->'parent'->'parent'->>'_id')::UUID = c.id 
                WHERE cm.doc->'parent' ? '_id' 
                    AND cm.doc->'parent'->'parent' ? '_id' 
                    AND cm.doc->'parent'->'parent'->'parent' ? '_id' 
                    AND (cm.doc->>'type' = 'commune' OR cm.doc->>'contact_type' = 'commune');

        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  hospital_view AS 
                SELECT 
                    (h.doc->>'_id')::UUID AS id,
                    (h.doc->>'_rev')::TEXT AS rev,
                    (h.doc->>'name')::TEXT AS name,
                    (h.doc->>'external_id')::TEXT AS external_id,
                    (h.doc->>'code')::TEXT AS code,
                    CASE WHEN h.doc->>'geolocation' IS NULL OR h.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(h.doc->'geolocation') IS NOT NULL THEN (h.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (h.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((h.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((h.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((h.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((h.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (h.doc->'parent'->>'_id')::UUID AS commune_id,
                    (h.doc->'parent'->'parent'->>'_id')::UUID AS prefecture_id,
                    (h.doc->'parent'->'parent'->'parent'->>'_id')::UUID AS region_id,
                    (h.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS country_id,
                    json_build_object('id', c.id, 'name', c.name) AS country, 
                    json_build_object('id', r.id, 'name', r.name) AS region, 
                    json_build_object('id', p.id, 'name', p.name) AS prefecture, 
                    json_build_object('id', cm.id, 'name', cm.name) AS commune  
                FROM couchdb h 
                    LEFT JOIN commune_view cm ON (h.doc->'parent'->>'_id')::UUID = cm.id 
                    LEFT JOIN prefecture_view p ON (h.doc->'parent'->'parent'->>'_id')::UUID = p.id 
                    LEFT JOIN region_view r ON (h.doc->'parent'->'parent'->'parent'->>'_id')::UUID = r.id 
                    LEFT JOIN country_view c ON (h.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = c.id
                WHERE h.doc->'parent' ? '_id' 
                    AND h.doc->'parent'->'parent' ? '_id' 
                    AND h.doc->'parent'->'parent'->'parent' ? '_id' 
                    AND h.doc->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND (h.doc->>'type' = 'hospital' OR h.doc->>'contact_type' = 'hospital');

        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  district_quartier_view AS 
                SELECT 
                    (d.doc->>'_id')::UUID AS id,
                    (d.doc->>'_rev')::TEXT AS rev,
                    (d.doc->>'name')::TEXT AS name,
                    (d.doc->>'external_id')::TEXT AS external_id,
                    (d.doc->>'code')::TEXT AS code,
                    CASE WHEN d.doc->>'geolocation' IS NULL OR d.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(d.doc->'geolocation') IS NOT NULL THEN (d.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (d.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((d.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((d.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((d.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((d.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (d.doc->'parent'->>'_id')::UUID AS hospital_id,
                    (d.doc->'parent'->'parent'->>'_id')::UUID AS commune_id,
                    (d.doc->'parent'->'parent'->'parent'->>'_id')::UUID AS prefecture_id,
                    (d.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS region_id,
                    (d.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS country_id,
                    json_build_object('id', c.id, 'name', c.name) AS country, 
                    json_build_object('id', r.id, 'name', r.name) AS region, 
                    json_build_object('id', p.id, 'name', p.name) AS prefecture, 
                    json_build_object('id', cm.id, 'name', cm.name) AS commune, 
                    json_build_object('id', h.id, 'name', h.name) AS hospital 
                FROM couchdb d 
                    LEFT JOIN hospital_view h ON (d.doc->'parent'->>'_id')::UUID = h.id 
                    LEFT JOIN commune_view cm ON (d.doc->'parent'->'parent'->>'_id')::UUID = cm.id 
                    LEFT JOIN prefecture_view p ON (d.doc->'parent'->'parent'->'parent'->>'_id')::UUID = p.id 
                    LEFT JOIN region_view r ON (d.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = r.id 
                    LEFT JOIN country_view c ON (d.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = c.id 
                WHERE d.doc->'parent' ? '_id' 
                    AND d.doc->'parent'->'parent' ? '_id' 
                    AND d.doc->'parent'->'parent'->'parent' ? '_id' 
                    AND d.doc->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND d.doc->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND (d.doc->>'type' = 'district_hospital' OR d.doc->>'contact_type' = 'district_hospital');

        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  village_secteur_view AS 
                SELECT 
                    (z.doc->>'_id')::UUID AS id,
                    (z.doc->>'_rev')::TEXT AS rev,
                    (z.doc->>'name')::TEXT AS name,
                    (z.doc->>'external_id')::TEXT AS external_id,
                    (z.doc->>'code')::TEXT AS code,
                    CASE WHEN z.doc->>'geolocation' IS NULL OR z.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(z.doc->'geolocation') IS NOT NULL THEN (z.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (z.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((z.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((z.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((z.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((z.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (z.doc->'contact'->>'_id')::UUID AS reco_id,
                    (z.doc->'parent'->>'_id')::UUID AS district_quartier_id,
                    (z.doc->'parent'->'parent'->>'_id')::UUID AS hospital_id,
                    (z.doc->'parent'->'parent'->'parent'->>'_id')::UUID AS commune_id,
                    (z.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS prefecture_id,
                    (z.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS region_id,
                    (z.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS country_id,
                    json_build_object('id', c.id, 'name', c.name) AS country, 
                    json_build_object('id', r.id, 'name', r.name) AS region, 
                    json_build_object('id', p.id, 'name', p.name) AS prefecture, 
                    json_build_object('id', cm.id, 'name', cm.name) AS commune, 
                    json_build_object('id', h.id, 'name', h.name) AS hospital,
                    json_build_object('id', d.id, 'name', d.name) AS district_quartier  
                FROM couchdb z 
                    LEFT JOIN district_quartier_view d ON (z.doc->'parent'->>'_id')::UUID = d.id 
                    LEFT JOIN hospital_view h ON (z.doc->'parent'->'parent'->>'_id')::UUID = h.id 
                    LEFT JOIN commune_view cm ON (z.doc->'parent'->'parent'->'parent'->>'_id')::UUID = cm.id 
                    LEFT JOIN prefecture_view p ON (z.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = p.id 
                    LEFT JOIN region_view r ON (z.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = r.id 
                    LEFT JOIN country_view c ON (z.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = c.id 
                WHERE z.doc->'parent' ? '_id' 
                    AND z.doc->'parent'->'parent' ? '_id' 
                    AND z.doc->'parent'->'parent'->'parent' ? '_id' 
                    AND z.doc->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND z.doc->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND z.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND (z.doc->>'type' = 'health_center' OR z.doc->>'contact_type' = 'health_center');
        `);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  family_view AS 
                SELECT 
                    (f.doc->>'_id')::UUID AS id,
                    (f.doc->>'_rev')::TEXT AS rev,
                    (f.doc->>'name')::TEXT AS name,
                    (f.doc->>'given_name')::TEXT AS given_name,
                    (f.doc->>'external_id')::TEXT AS external_id,
                    (f.doc->>'code')::TEXT AS code,
                    (f.doc->>'householder_phone')::TEXT AS householder_phone,

                    (CASE WHEN f.doc->'contact' IS NOT NULL AND f.doc->>'contact' <> '' AND f.doc->'contact'->>'_id' IS NOT NULL AND f.doc->'contact'->>'_id' <> ''
                        THEN f.doc->'contact'->>'_id'
                        ELSE NULL
                    END)::UUID AS householder_id,

                    CASE WHEN f.doc->>'geolocation' IS NULL OR f.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(f.doc->'geolocation') IS NOT NULL THEN (f.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (f.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000))::INTEGER  AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    CASE WHEN (f.doc->>'household_has_working_latrine' IS NOT NULL AND f.doc->>'household_has_working_latrine' <> '' AND
                            (f.doc->>'household_has_working_latrine' = 'true' OR f.doc->>'household_has_working_latrine' = 'yes' OR f.doc->>'household_has_working_latrine' = '1')) 
                        THEN true
                        ELSE false
                    END::BOOLEAN AS household_has_working_latrine,
                    CASE WHEN (f.doc->>'household_has_good_water_access' IS NOT NULL AND f.doc->>'household_has_good_water_access' <> '' AND
                            (f.doc->>'household_has_good_water_access' = 'true' OR f.doc->>'household_has_good_water_access' = 'yes' OR f.doc->>'household_has_good_water_access' = '1')) 
                        THEN true
                        ELSE false
                    END::BOOLEAN AS household_has_good_water_access,
                    (f.doc->'user_info'->>'created_user_id')::UUID AS reco_id,
                    (f.doc->'parent'->>'_id')::UUID AS village_secteur_id,
                    (f.doc->'parent'->'parent'->>'_id')::UUID AS district_quartier_id,
                    (f.doc->'parent'->'parent'->'parent'->>'_id')::UUID AS hospital_id,
                    (f.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS commune_id,
                    (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS prefecture_id,
                    (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS region_id,
                    (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS country_id, 
                    json_build_object('id', c.id, 'name', c.name) AS country, 
                    json_build_object('id', r.id, 'name', r.name) AS region, 
                    json_build_object('id', p.id, 'name', p.name) AS prefecture, 
                    json_build_object('id', cm.id, 'name', cm.name) AS commune, 
                    json_build_object('id', h.id, 'name', h.name) AS hospital,
                    json_build_object('id', d.id, 'name', d.name) AS district_quartier,
                    json_build_object('id', v.id, 'name', v.name) AS village_secteur 
                FROM couchdb f 
                    LEFT JOIN village_secteur_view v ON (f.doc->'parent'->>'_id')::UUID = v.id 
                    LEFT JOIN district_quartier_view d ON (f.doc->'parent'->'parent'->>'_id')::UUID = d.id 
                    LEFT JOIN hospital_view h ON (f.doc->'parent'->'parent'->'parent'->>'_id')::UUID = h.id 
                    LEFT JOIN commune_view cm ON (f.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = cm.id 
                    LEFT JOIN prefecture_view p ON (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = p.id 
                    LEFT JOIN region_view r ON (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = r.id 
                    LEFT JOIN country_view c ON (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = c.id 
                WHERE f.doc->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND (f.doc->>'type' = 'clinic' OR f.doc->>'contact_type' = 'clinic');

        `);
        
        await CreateViewIndex('country_view', queryRunner);
        await CreateViewIndex('region_view', queryRunner);
        await CreateViewIndex('prefecture_view', queryRunner);
        await CreateViewIndex('commune_view', queryRunner);
        await CreateViewIndex('hospital_view', queryRunner);
        await CreateViewIndex('district_quartier_view', queryRunner);
        await CreateViewIndex('village_secteur_view', queryRunner);
        await CreateViewIndex('family_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('country_view', queryRunner);
        await DropViewIndexAndTable('region_view', queryRunner);
        await DropViewIndexAndTable('prefecture_view', queryRunner);
        await DropViewIndexAndTable('commune_view', queryRunner);
        await DropViewIndexAndTable('hospital_view', queryRunner);
        await DropViewIndexAndTable('district_quartier_view', queryRunner);
        await DropViewIndexAndTable('village_secteur_view', queryRunner);
        await DropViewIndexAndTable('family_view', queryRunner);
    }

}
