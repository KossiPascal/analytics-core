
import { DataSource, QueryRunner } from 'typeorm';
import { AppDataSource } from '../data-source';
import { CouchdbFetchCible, IndexTarget } from '../models/Interfaces';
let Connection: DataSource = AppDataSource.manager.connection;

// sudo systemctl restart postgresql

export async function RefreshMaterializedView(couchdbCible: CouchdbFetchCible): Promise<void> {

    const functions = [
        'calculate_age_in(TEXT, DATE, DATE, TEXT, INT)',
        'generate_random_colors(BIGINT)',
        'age_with_full_label(BIGINT)',
        'generate_full_year_month_grid(INT, INT, INT)',
        'parse_json_boolean(TEXT)'
    ];

    const viewsName: { name: string; cible: IndexTarget; couchdbCible: CouchdbFetchCible; group: 'Data' | 'Reports' | 'Dashboards' | 'Maps' | 'Telemetries'; type: 'view' | 'mat_view' }[] = [
        { name: 'year_month_grid_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'country_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'region_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'prefecture_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'commune_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'hospital_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'district_quartier_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'village_secteur_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'family_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },

        { name: 'country_manager_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'region_manager_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'prefecture_manager_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'commune_manager_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'hospital_manager_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'chw_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'reco_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'patient_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'patient_household_stats_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },

        { name: 'adult_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'family_planning_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'pregnant_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'newborn_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'pcimne_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'delivery_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'reco_meg_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'referal_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'vaccination_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'events_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'fs_meg_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'promotional_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'death_data_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'reco_chws_supervision_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'tasks_state_view', cible: 'only_id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'year_month_reco_grid_view', cible: 'id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },

        { name: 'users_view', cible: 'only_id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },

        { name: 'report_all_cover_reco_view', cible: 'only_id', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_all_functional_reco_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_adults_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_death_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_events_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_family_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_newborn_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_patient_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_pcime_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_pregnant_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_promotional_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'report_vaccination_view', cible: 'reco_month_year', group: 'Data', couchdbCible: 'medic', type: 'mat_view' },

        { name: 'dash_max_vaccination_view', cible: 'only_id', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'dash_all_actions_view', cible: 'id', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'dash_consultation_followup_view', cible: 'id', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },

        { name: 'reports_morbidity_view', cible: 'reco_month_year', group: 'Reports', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'reports_chws_reco_view', cible: 'reco_month_year', group: 'Reports', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'reports_promotional_activities_view', cible: 'reco_month_year', group: 'Reports', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'reports_family_planning_view', cible: 'reco_month_year', group: 'Reports', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'reports_household_view', cible: 'id', group: 'Reports', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'reports_reco_meg_situation_view', cible: 'reco_month_year', group: 'Reports', couchdbCible: 'medic', type: 'mat_view' },

        { name: 'dashboards_reco_performance_view', cible: 'reco_month_year', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'dashboards_reco_performance_full_year_view', cible: 'reco_year', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },

        { name: 'dashboards_reco_performance_full_year_view', cible: 'reco_year', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'dashboards_reco_vaccination_not_done_view', cible: 'reco_month_year', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'dashboards_reco_vaccination_all_done_view', cible: 'reco_month_year', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'dashboards_reco_vaccination_partial_done_view', cible: 'reco_month_year', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'dashboards_active_reco_view', cible: 'reco_year', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },
        { name: 'dashboards_tasks_state_view', cible: 'only_id', group: 'Dashboards', couchdbCible: 'medic', type: 'mat_view' },

        { name: 'reco_data_map_view', cible: 'only_id', group: 'Maps', couchdbCible: 'medic', type: 'mat_view' },

        { name: 'devices_telemetry_view', cible: 'only_id', group: 'Telemetries', couchdbCible: 'users_meta', type: 'mat_view' },
        { name: 'metrics_telemetry_view', cible: 'only_id', group: 'Telemetries', couchdbCible: 'users_meta', type: 'mat_view' },
        { name: 'users_telemetry_view', cible: 'only_id', group: 'Telemetries', couchdbCible: 'users_meta', type: 'mat_view' },
        { name: 'users_feedback_view', cible: 'only_id', group: 'Telemetries', couchdbCible: 'users_meta', type: 'mat_view' },

    ];

    const filteredViewsName = viewsName.filter(v => v.couchdbCible == couchdbCible);

    for (let i = 0; i < filteredViewsName.length; i++) {
        const view = filteredViewsName[i];
        if (view.couchdbCible == couchdbCible) {
            try {
                if (i == 0) console.log(`Start Refreshing ${view.group} views ...`);
                await CreateViewIndex(view.name, { cible: view.cible });
                await Connection.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view.name};`);
                if (i == filteredViewsName.length) console.log(`${view.group} views are Refreshed successfuly!`);
            } catch (error) { }
        }
    }
};

export async function RefreshViewTable(viewName: string, queryRunner?: QueryRunner): Promise<void> {
    await (queryRunner ?? Connection).query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName};`);
}



function indexMap(viewName: string): Record<IndexTarget, { create: string[]; drop: string[] }> {
    return {
        only_id: {
            create: [
                `CREATE UNIQUE INDEX IF NOT EXISTS ${viewName}_id_idx ON ${viewName} (id);`,
            ],
            drop: [
                `DROP INDEX IF EXISTS ${viewName}_id_idx;`,
            ],
        },
        id: {
            create: [
                `CREATE UNIQUE INDEX IF NOT EXISTS ${viewName}_id_idx ON ${viewName} (id);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_month_idx ON ${viewName} (month);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_year_idx ON ${viewName} (year);`,
            ],
            drop: [
                `DROP INDEX IF EXISTS ${viewName}_id_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_month_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_year_idx;`,
            ],
        },
        id_reco: {
            create: [
                `CREATE UNIQUE INDEX IF NOT EXISTS ${viewName}_id_idx ON ${viewName} (id);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_month_idx ON ${viewName} (month);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_year_idx ON ${viewName} (year);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_reco_idx ON ${viewName} (reco_id);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_reco_month_idx ON ${viewName} (reco_id, month);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_reco_year_idx ON ${viewName} (reco_id, year);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_reco_month_year_idx ON ${viewName} (reco_id, month, year);`,
            ],
            drop: [
                `DROP INDEX IF EXISTS ${viewName}_id_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_month_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_year_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_reco_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_reco_month_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_reco_year_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_reco_month_year_idx;`,
            ],
        },
        reco_month_year: {
            create: [
                `CREATE UNIQUE INDEX IF NOT EXISTS ${viewName}_reco_month_year_idx ON ${viewName} (reco_id, month, year);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_id_idx ON ${viewName} (id);`,
            ],
            drop: [
                `DROP INDEX IF EXISTS ${viewName}_reco_month_year_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_id_idx;`,
            ],
        },
        reco_month: {
            create: [
                `CREATE UNIQUE INDEX IF NOT EXISTS ${viewName}_reco_month_idx ON ${viewName} (reco_id, month);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_id_idx ON ${viewName} (id);`,
            ],
            drop: [
                `DROP INDEX IF EXISTS ${viewName}_reco_month_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_id_idx;`,
            ],
        },
        reco_year: {
            create: [
                `CREATE UNIQUE INDEX IF NOT EXISTS ${viewName}_reco_year_idx ON ${viewName} (reco_id, year);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_id_idx ON ${viewName} (id);`,
            ],
            drop: [
                `DROP INDEX IF EXISTS ${viewName}_reco_year_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_id_idx;`,
            ],
        },
        month: {
            create: [
                `CREATE INDEX IF NOT EXISTS ${viewName}_month_idx ON ${viewName} (month);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_id_idx ON ${viewName} (id);`,
            ],
            drop: [
                `DROP INDEX IF EXISTS ${viewName}_month_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_id_idx;`,
            ],
        },
        year: {
            create: [
                `CREATE INDEX IF NOT EXISTS ${viewName}_year_idx ON ${viewName} (year);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_id_idx ON ${viewName} (id);`,
            ],
            drop: [
                `DROP INDEX IF EXISTS ${viewName}_year_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_id_idx;`,
            ],
        },
        year_month: {
            create: [
                `CREATE INDEX IF NOT EXISTS ${viewName}_year_month_idx ON ${viewName} (year, month);`,
                `CREATE INDEX IF NOT EXISTS ${viewName}_id_idx ON ${viewName} (id);`,
            ],
            drop: [
                `DROP INDEX IF EXISTS ${viewName}_year_month_idx;`,
                `DROP INDEX IF EXISTS ${viewName}_id_idx;`,
            ],
        },
    };
}


export async function CreateViewIndex(viewName: string, opt: { cible: IndexTarget; queryRunner?: QueryRunner }): Promise<void> {
    const runner = opt.queryRunner ?? Connection;

    const queries = indexMap(viewName)[opt.cible];

    if (!queries) {
        throw new Error(`Unknown index target '${opt.cible}' for view '${viewName}'`);
    }

    for (const sql of queries.create) {
        await runner.query(sql);
    }

    // const sqlToQuery = `CREATE UNIQUE INDEX ${viewName}_id_idx ON ${viewName} (id) WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '${viewName}' AND indexname = '${viewName}_id_idx');`
    // const sqlToQuery = `CREATE UNIQUE INDEX CONCURRENTLY ${viewName}_id_idx ON ${viewName} (id) WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '${viewName}' AND indexname = '${viewName}_id_idx');`
    // `DO $$ 
    // BEGIN 
    //     IF NOT EXISTS (
    //         SELECT 1 
    //         FROM pg_indexes 
    //         WHERE tablename = '${viewName}' 
    //         AND indexname = '${viewName}_id_idx'
    //     ) THEN 
    //         CREATE UNIQUE INDEX CONCURRENTLY ${viewName}_id_idx 
    //         ON ${viewName} (id);
    //     END IF; 
    // END $$;`
}


export async function DropViewIndexAndTable(viewName: string, opt: { cible: IndexTarget; queryRunner?: QueryRunner }): Promise<void> {
    const runner = opt.queryRunner ?? Connection;

    const queries = indexMap(viewName)[opt.cible];
    if (!queries) {
        throw new Error(`Unknown index target '${opt.cible}' for view '${viewName}'`);
    }

    for (const sql of queries.drop) {
        await runner.query(sql);
    }

    await runner.query(`DROP MATERIALIZED VIEW IF EXISTS ${viewName} CASCADE;`);
}


export async function DropFunction(functionName: string, queryRunner?: QueryRunner): Promise<void> {
    const runner = queryRunner ?? Connection;
    await runner.query(`DROP FUNCTION IF EXISTS ${functionName};`);
}
