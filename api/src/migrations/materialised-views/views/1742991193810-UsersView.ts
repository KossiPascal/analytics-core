import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../../../couch2pg/refresh-view";

export class UsersView1742991193810 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);

        await queryRunner.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS  users_view AS
                SELECT 
                    (doc->>'_id')::TEXT AS id,
                    (doc->>'_rev')::TEXT AS rev,
                    (doc->>'name')::TEXT AS name,
                    (doc->>'code')::TEXT AS code,
                    (doc->>'known')::TEXT AS known,
                    (doc->>'type')::TEXT AS type,
                    (doc->>'email')::TEXT AS email,
                    (doc->>'phone')::TEXT AS phone,
                    (doc->>'roles')::JSONB AS roles,
                    (doc->>'fullname')::TEXT AS fullname,
                    (doc->>'contact_id')::TEXT AS contact_id,
                    (doc->>'facility_id')::JSONB AS places
                FROM couchdb
                WHERE id ~ '^org\.couchdb\.user:[a-zA-Z0-9_-]+$';
        `);

        await CreateViewIndex('users_view', queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropViews(queryRunner);
    }

    private async dropViews(queryRunner: QueryRunner): Promise<void> {
        await DropViewIndexAndTable('users_view', queryRunner);
    }

}
