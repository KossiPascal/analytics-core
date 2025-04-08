import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class PersonsView1742808170987 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  country_manager_view AS 
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
                    EXTRACT(YEAR FROM TO_TIMESTAMP((r.doc->>'reported_date')::BIGINT / 1000))::INTEGER AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((r.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (r.doc->>'role')::TEXT AS role,
                    CASE WHEN r.doc->>'date_of_birth' IS NOT NULL AND r.doc->>'date_of_birth' <> '' THEN
                            r.doc->>'date_of_birth'
                        ELSE NULL
                    END::DATE AS date_of_birth,
                    (r.doc->>'phone')::TEXT AS phone,
                    (r.doc->>'phone_other')::TEXT AS phone_other,
                    (r.doc->>'email')::TEXT AS email,
                    (r.doc->>'profession')::TEXT AS profession,
                    CASE WHEN r.doc->>'sex' IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
                        WHEN r.doc->>'sex' IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
                        ELSE NULL
                    END::VARCHAR(1) AS sex,
                    (r.doc->'parent'->>'_id')::UUID AS country_id,
                    json_build_object('id', c.id, 'name', c.name) AS country  
                FROM couchdb r 
                    LEFT JOIN country_view c ON (r.doc->'parent'->>'_id')::UUID = c.id 
                WHERE r.doc->'parent' ? '_id' 
                    AND doc->>'type' = 'person' 
                    AND doc->>'role' = 'country_manager';
        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  region_manager_view AS 
                SELECT 
                    (p.doc->>'_id')::UUID AS id,
                    (p.doc->>'_rev')::TEXT  AS rev,
                    (p.doc->>'name')::TEXT  AS name,
                    (p.doc->>'external_id')::TEXT  AS external_id,
                    (p.doc->>'code')::TEXT  AS code,
                    CASE WHEN p.doc->>'geolocation' IS NULL OR p.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(p.doc->'geolocation') IS NOT NULL THEN (p.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (p.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000))::INTEGER AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((p.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (p.doc->>'role')::TEXT  AS role,
                    CASE WHEN p.doc->>'date_of_birth' IS NOT NULL AND p.doc->>'date_of_birth' <> '' THEN
                            p.doc->>'date_of_birth'
                        ELSE NULL
                    END::DATE AS date_of_birth,
                    (p.doc->>'phone')::TEXT  AS phone,
                    (p.doc->>'phone_other')::TEXT AS phone_other,
                    (p.doc->>'email')::TEXT  AS email,
                    (p.doc->>'profession')::TEXT  AS profession,
                    CASE WHEN p.doc->>'sex' IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
                        WHEN p.doc->>'sex' IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
                        ELSE NULL
                    END::VARCHAR(1) AS sex,
                    (p.doc->'parent'->>'_id')::UUID AS region_id,
                    (p.doc->'parent'->'parent'->>'_id')::UUID AS country_id,
                    json_build_object('id', r.id, 'name', r.name) AS region,
                    json_build_object('id', c.id, 'name', c.name) AS country  
                FROM couchdb p 
                    LEFT JOIN region_view r ON (p.doc->'parent'->>'_id')::UUID = r.id 
                    LEFT JOIN country_view c ON (p.doc->'parent'->'parent'->>'_id')::UUID = c.id 
                WHERE p.doc->'parent' ? '_id' 
                    AND p.doc->'parent'->'parent' ? '_id' 
                    AND p.doc->>'type' = 'person' 
                    AND p.doc->>'role' = 'region_manager';
        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  prefecture_manager_view AS 
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
                    EXTRACT(YEAR FROM TO_TIMESTAMP((cm.doc->>'reported_date')::BIGINT / 1000))::INTEGER AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((cm.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (cm.doc->>'role')::TEXT AS role,
                    CASE WHEN cm.doc->>'date_of_birth' IS NOT NULL AND cm.doc->>'date_of_birth' <> '' THEN
                            cm.doc->>'date_of_birth'
                        ELSE NULL
                    END::DATE AS date_of_birth,
                    (cm.doc->>'phone')::TEXT AS phone,
                    (cm.doc->>'phone_other')::TEXT AS phone_other,
                    (cm.doc->>'email')::TEXT AS email,
                    (cm.doc->>'profession')::TEXT AS profession,
                    CASE WHEN cm.doc->>'sex' IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
                        WHEN cm.doc->>'sex' IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
                        ELSE NULL
                    END::VARCHAR(1) AS sex,
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
                    AND cm.doc->>'type' = 'person' 
                    AND cm.doc->>'role' = 'prefecture_manager';
        `);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  commune_manager_view AS 
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
                    EXTRACT(YEAR FROM TO_TIMESTAMP((h.doc->>'reported_date')::BIGINT / 1000))::INTEGER AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((h.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (h.doc->>'role')::TEXT AS role,
                    CASE WHEN h.doc->>'date_of_birth' IS NOT NULL AND h.doc->>'date_of_birth' <> '' THEN
                            h.doc->>'date_of_birth'
                        ELSE NULL
                    END::DATE AS date_of_birth,
                    (h.doc->>'phone')::TEXT AS phone,
                    (h.doc->>'phone_other')::TEXT AS phone_other,
                    (h.doc->>'email')::TEXT AS email,
                    (h.doc->>'profession')::TEXT AS profession,
                    CASE WHEN h.doc->>'sex' IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
                        WHEN h.doc->>'sex' IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
                        ELSE NULL
                    END::VARCHAR(1) AS sex,
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
                    AND h.doc->>'type' = 'person' 
                    AND h.doc->>'role' = 'commune_manager';
        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  hospital_manager_view AS 
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
                    EXTRACT(YEAR FROM TO_TIMESTAMP((d.doc->>'reported_date')::BIGINT / 1000))::INTEGER AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((d.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (d.doc->>'role')::TEXT AS role,
                    CASE WHEN d.doc->>'date_of_birth' IS NOT NULL AND d.doc->>'date_of_birth' <> '' THEN
                            d.doc->>'date_of_birth'
                        ELSE NULL
                    END::DATE AS date_of_birth,
                    (d.doc->>'phone')::TEXT AS phone,
                    (d.doc->>'phone_other')::TEXT AS phone_other,
                    (d.doc->>'email')::TEXT AS email,
                    (d.doc->>'profession')::TEXT AS profession,
                    CASE WHEN d.doc->>'sex' IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
                        WHEN d.doc->>'sex' IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
                        ELSE NULL
                    END::VARCHAR(1) AS sex,
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
                    AND d.doc->>'type' = 'person' 
                    AND d.doc->>'role' = 'hospital_manager';
        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  chw_view AS 
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
                    EXTRACT(YEAR FROM TO_TIMESTAMP((z.doc->>'reported_date')::BIGINT / 1000))::INTEGER AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((z.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (z.doc->>'role')::TEXT AS role,
                    CASE WHEN z.doc->>'date_of_birth' IS NOT NULL AND z.doc->>'date_of_birth' <> '' THEN
                            z.doc->>'date_of_birth'
                        ELSE NULL
                    END::DATE AS date_of_birth,
                    (z.doc->>'phone')::TEXT AS phone,
                    (z.doc->>'phone_other')::TEXT AS phone_other,
                    (z.doc->>'email')::TEXT AS email,
                    (z.doc->>'profession')::TEXT AS profession,
                    CASE WHEN z.doc->>'sex' IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
                        WHEN z.doc->>'sex' IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
                        ELSE NULL
                    END::VARCHAR(1) AS sex,
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
                    AND z.doc->>'type' = 'person' 
                    AND z.doc->>'role' = 'chw';
        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  reco_view AS 
                SELECT 
                    (f.doc->>'_id')::UUID AS id,
                    (f.doc->>'_rev')::TEXT AS rev,
                    (f.doc->>'name')::TEXT AS name,
                    (f.doc->>'external_id')::TEXT AS external_id,
                    (f.doc->>'code')::TEXT AS code,
                    CASE WHEN f.doc->>'geolocation' IS NULL OR f.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(f.doc->'geolocation') IS NOT NULL THEN (f.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (f.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000))::INTEGER AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (f.doc->>'role')::TEXT AS role,
                    CASE WHEN f.doc->>'date_of_birth' IS NOT NULL AND f.doc->>'date_of_birth' <> '' THEN
                            f.doc->>'date_of_birth'
                        ELSE NULL
                    END::DATE AS date_of_birth,
                    (f.doc->>'phone')::TEXT AS phone,
                    (f.doc->>'phone_other')::TEXT AS phone_other,
                    (f.doc->>'email')::TEXT AS email,
                    (f.doc->>'profession')::TEXT AS profession,
                    CASE WHEN f.doc->>'sex' IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
                        WHEN f.doc->>'sex' IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
                        ELSE NULL
                    END::VARCHAR(1) AS sex,
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
                    AND f.doc->>'type' = 'person' 
                    AND f.doc->>'role' = 'reco';
        `);
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  patient_view AS 
                SELECT 
                    (f.doc->>'_id')::UUID AS id,
                    (f.doc->>'_rev')::TEXT AS rev,
                    (f.doc->>'name')::TEXT AS name,
                    (f.doc->>'external_id')::TEXT AS external_id,
                    (f.doc->>'code')::TEXT AS code,
                    CASE WHEN f.doc->>'geolocation' IS NULL OR f.doc->>'geolocation' = '' THEN NULL
                        WHEN jsonb_typeof(f.doc->'geolocation') IS NOT NULL THEN (f.doc->'geolocation')::JSONB
                        ELSE NULL
                    END AS geolocation,
                    (f.doc->>'reported_date')::BIGINT AS reported_date_timestamp,
                    TO_CHAR(TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD')::DATE AS reported_date,
                    TO_CHAR(TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP AS reported_full_date,
                    EXTRACT(YEAR FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000))::INTEGER AS year,
                    LPAD(EXTRACT(MONTH FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000))::TEXT, 2, '0')::TEXT AS month,
                    (f.doc->>'role')::TEXT AS role,
                    CASE WHEN f.doc->>'date_of_birth' IS NOT NULL AND f.doc->>'date_of_birth' <> '' 
                        THEN f.doc->>'date_of_birth'
                        ELSE NULL
                    END::DATE AS date_of_birth,
                    (f.doc->>'phone')::TEXT AS phone,
                    (f.doc->>'phone_other')::TEXT AS phone_other,
                    (f.doc->>'email')::TEXT AS email,
                    (f.doc->>'profession')::TEXT AS profession,
                    CASE WHEN f.doc->>'date_of_death' IS NOT NULL AND f.doc->>'date_of_death' <> '' 
                        THEN TO_DATE(f.doc->>'date_of_death', 'YYYY-MM-DD')
                        ELSE NULL
                    END::DATE AS date_of_death,
                    CASE WHEN f.doc->>'date_of_death' IS NOT NULL AND f.doc->>'date_of_death' <> '' 
                        THEN EXTRACT(YEAR FROM TO_DATE(f.doc->>'date_of_death', 'YYYY-MM-DD'))
                        ELSE NULL
                    END::BIGINT AS year_of_death,
                    CASE WHEN f.doc->>'date_of_death' IS NOT NULL AND f.doc->>'date_of_death' <> '' 
                        THEN LPAD(EXTRACT(MONTH FROM TO_DATE(f.doc->>'date_of_death', 'YYYY-MM-DD'))::TEXT, 2, '0')                            
                        ELSE NULL
                    END::TEXT AS month_of_death,
                    CASE WHEN f.doc->>'sex' IN ('male', 'Male', 'homme', 'Homme') THEN 'M'
                        WHEN f.doc->>'sex' IN ('female', 'Female', 'femme', 'Femme') THEN 'F'
                        ELSE NULL
                    END::VARCHAR(1) AS sex,
                    CASE WHEN (f.doc->>'has_birth_certificate' IS NOT NULL AND f.doc->>'has_birth_certificate' <> '' AND
                            (f.doc->>'has_birth_certificate' = 'true' OR f.doc->>'has_birth_certificate' = 'yes' OR f.doc->>'has_birth_certificate' = '1')) 
                        THEN true
                        ELSE false
                    END::BOOLEAN AS has_birth_certificate,
                    CASE WHEN (f.doc->>'is_home_death' IS NOT NULL AND f.doc->>'is_home_death' <> '' AND
                            (f.doc->>'is_home_death' = 'true' OR f.doc->>'is_home_death' = 'yes' OR f.doc->>'is_home_death' = '1')) 
                        THEN true
                        ELSE false
                    END::BOOLEAN AS is_home_death,
                    CASE WHEN (f.doc->>'is_stillbirth' IS NOT NULL AND f.doc->>'is_stillbirth' <> '' AND
                            (f.doc->>'is_stillbirth' = 'true' OR f.doc->>'is_stillbirth' = 'yes' OR f.doc->>'is_stillbirth' = '1')) 
                        THEN true
                        ELSE false
                    END::BOOLEAN AS is_stillbirth,
                    CASE WHEN f.doc->>'date_of_birth' IS NOT NULL AND f.doc->>'date_of_birth' <> '' THEN
                            EXTRACT(YEAR FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000)) - EXTRACT(YEAR FROM TO_DATE(f.doc->>'date_of_birth', 'YYYY-MM-DD'))
                        ELSE NULL
                    END::BIGINT AS age_in_year_on_creation,
                    CASE WHEN f.doc->>'date_of_birth' IS NOT NULL AND f.doc->>'date_of_birth' <> '' THEN
                            (EXTRACT(YEAR FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000)) - EXTRACT(YEAR FROM TO_DATE(f.doc->>'date_of_birth', 'YYYY-MM-DD'))) * 12 
                            + (EXTRACT(MONTH FROM TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000)) - EXTRACT(MONTH FROM TO_DATE(f.doc->>'date_of_birth', 'YYYY-MM-DD')))
                        ELSE NULL
                    END::BIGINT AS age_in_month_on_creation,
                    CASE WHEN f.doc->>'date_of_birth' IS NOT NULL AND f.doc->>'date_of_birth' <> '' THEN
                            (EXTRACT(EPOCH FROM (TO_TIMESTAMP((f.doc->>'reported_date')::BIGINT / 1000) - TO_DATE(f.doc->>'date_of_birth', 'YYYY-MM-DD'))) / 86400)
                        ELSE NULL
                    END::BIGINT AS age_in_day_on_creation,

                    (f.doc->'user_info'->>'created_user_id')::UUID AS reco_id,
                    (f.doc->>'relationship_with_household_head')::TEXT AS relationship_with_household_head,
                    
                    (f.doc->'parent'->>'_id')::UUID AS family_id,
                    (f.doc->'parent'->'parent'->>'_id')::UUID AS village_secteur_id,
                    (f.doc->'parent'->'parent'->'parent'->>'_id')::UUID AS district_quartier_id,
                    (f.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS hospital_id,
                    (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS commune_id,
                    (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS prefecture_id,
                    (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS region_id,
                    (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID AS country_id, 
                    json_build_object('id', c.id, 'name', c.name) AS country, 
                    json_build_object('id', r.id, 'name', r.name) AS region, 
                    json_build_object('id', p.id, 'name', p.name) AS prefecture, 
                    json_build_object('id', cm.id, 'name', cm.name) AS commune, 
                    json_build_object('id', h.id, 'name', h.name) AS hospital,
                    json_build_object('id', d.id, 'name', d.name) AS district_quartier,
                    json_build_object('id', v.id, 'name', v.name) AS village_secteur,
                    json_build_object('id', fm.id, 'name', fm.name) AS family,
                    json_build_object('id', rc.id, 'name', rc.name) AS reco 
                FROM couchdb f 
                    LEFT JOIN family_view fm ON (f.doc->'parent'->>'_id')::UUID = fm.id 
                    LEFT JOIN village_secteur_view v ON (f.doc->'parent'->'parent'->>'_id')::UUID = v.id 
                    LEFT JOIN district_quartier_view d ON (f.doc->'parent'->'parent'->'parent'->>'_id')::UUID = d.id 
                    LEFT JOIN hospital_view h ON (f.doc->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = h.id 
                    LEFT JOIN commune_view cm ON (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = cm.id 
                    LEFT JOIN prefecture_view p ON (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = p.id 
                    LEFT JOIN region_view r ON (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = r.id 
                    LEFT JOIN country_view c ON (f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->>'_id')::UUID = c.id 
                    LEFT JOIN reco_view rc ON (f.doc->'user_info'->>'created_user_id')::UUID = rc.id 
                WHERE f.doc->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND f.doc->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent'->'parent' ? '_id' 
                    AND f.doc->>'type' = 'person' 
                    AND f.doc->>'role' = 'patient';
        `);

        await CreateViewIndex('country_manager_view', queryRunner);
        await CreateViewIndex('region_manager_view', queryRunner);
        await CreateViewIndex('prefecture_manager_view', queryRunner);
        await CreateViewIndex('commune_manager_view', queryRunner);
        await CreateViewIndex('hospital_manager_view', queryRunner);
        await CreateViewIndex('chw_view', queryRunner);
        await CreateViewIndex('reco_view', queryRunner);
        await CreateViewIndex('patient_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('country_manager_view', queryRunner);
        await DropViewIndexAndTable('region_manager_view', queryRunner);
        await DropViewIndexAndTable('prefecture_manager_view', queryRunner);
        await DropViewIndexAndTable('commune_manager_view', queryRunner);
        await DropViewIndexAndTable('hospital_manager_view', queryRunner);
        await DropViewIndexAndTable('chw_view', queryRunner);
        await DropViewIndexAndTable('reco_view', queryRunner);
        await DropViewIndexAndTable('patient_view', queryRunner);
    }

}
