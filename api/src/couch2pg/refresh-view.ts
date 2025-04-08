
import { DataSource, QueryRunner } from 'typeorm';
import { AppDataSource } from '../data-source';
let Connection: DataSource = AppDataSource.manager.connection;


export async function RefreshMaterializedView(): Promise<void> {

    const functions = [
        'calculateAgeIn(TEXT, DATE, DATE, TEXT, INT)',
        'generateRandomColors(BIGINT)',
        'ageWithFullLabel(BIGINT)',
    ];
    const viewsName = [
        'country_view',
        'region_view',
        'prefecture_view',
        'commune_view',
        'hospital_view',
        'district_quartier_view',
        'village_secteur_view',
        'family_view',

        'country_manager_view',
        'region_manager_view',
        'prefecture_manager_view',
        'commune_manager_view',
        'hospital_manager_view',
        'chw_view',
        'reco_view',
        'patient_view',

        'adult_data_view',
        'family_planning_data_view',
        'pregnant_data_view',
        'newborn_data_view',
        'pcimne_data_view',
        'delivery_data_view',
        'reco_meg_data_view',
        'referal_data_view',
        'vaccination_data_view',
        'events_data_view',
        'fs_meg_data_view',
        'promotional_data_view',
        'death_data_view',
        'reco_chws_supervision_view',

        'users_view',
    ];
    const reportsViewsName = [
        'reports_morbidity_view',
        'reports_chws_reco_view',
        'reports_promotional_view',
        'reports_family_planning_view',
        'reports_household_view',
        'reports_reco_meg_situation_view',
    ];
    const dashboardsViewsName = [
        'dashboard_reco_chart_performance_view',
        'dashboard_reco_performance_view',
        'dashboard_reco_vaccination_view',
    ];

    for (let i = 0; i < viewsName.length; i++) {
        try {
            const view = viewsName[i];
            if (i == 0) console.log('Start Refreshing data views ...');
            await CreateViewIndex(view);
            await Connection.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view};`);
            if (i == viewsName.length) console.log('Data views are Refreshed successfuly!');
        } catch (error) { }

    }

    for (let i = 0; i < reportsViewsName.length; i++) {
        try {
            const view = reportsViewsName[i];
            if (i == 0) console.log('Start Refreshing reports views ...');
            await CreateViewIndex(view);
            await Connection.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view};`);
            if (i == reportsViewsName.length) console.log('Reports are Refreshed successfuly!');
        } catch (error) { }

    }

    for (let j = 0; j < dashboardsViewsName.length; j++) {
        try {
            const view = dashboardsViewsName[j];
            if (j == 0) console.log('Start Refreshing dashboards views ...');
            await CreateViewIndex(view);
            await Connection.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view};`);

            if (j == reportsViewsName.length) console.log('Dashboards are Refreshed successfuly!');
        } catch (error) { }

    }

};


export async function RefreshViewTable(viewName: string, queryRunner?: QueryRunner): Promise<void> {
    await (queryRunner ?? Connection).query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName};`);
}

export async function CreateViewIndex(viewName: string, queryRunner?: QueryRunner): Promise<void> {
    const sqlToQuery = `CREATE UNIQUE INDEX IF NOT EXISTS ${viewName}_id_idx ON ${viewName} (id);`;
    // const sqlToQuery = `CREATE UNIQUE INDEX ${viewName}_id_idx ON ${viewName} (id) WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '${viewName}' AND indexname = '${viewName}_id_idx');`
    // const sqlToQuery = `CREATE UNIQUE INDEX CONCURRENTLY ${viewName}_id_idx ON ${viewName} (id) WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '${viewName}' AND indexname = '${viewName}_id_idx');`
    await (queryRunner ?? Connection).query(sqlToQuery);
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

export async function DropViewIndexAndTable(viewName: string, queryRunner?: QueryRunner): Promise<void> {
    await (queryRunner ?? Connection).query(`DROP INDEX IF EXISTS ${viewName}_id_idx;`);
    await (queryRunner ?? Connection).query(`DROP MATERIALIZED VIEW IF EXISTS ${viewName} CASCADE;`);
}

export async function DropFunction(functionName: string, queryRunner?: QueryRunner): Promise<void>{
    await (queryRunner ?? Connection).query(`DROP FUNCTION IF EXISTS ${functionName};`);
}
