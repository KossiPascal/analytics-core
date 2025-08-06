import { SqlBaseViewMigration } from "../postgres/SqlBaseViewMigration";
import { getSqlFileContent } from "../postgres/SqlBaseViewMigration";
import { MigrationInterface, QueryRunner } from "typeorm";
import { DropFunction } from "../couch2pg/refresh-view";
import { IndexTarget } from "../models/Interfaces";

// Functions Before General Views
export class FunctionsBeforeGeneralInitView1740000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(getSqlFileContent('calculate_age_in', 'functions_before_general_views_init'));
        await queryRunner.query(getSqlFileContent('generate_random_colors', 'functions_before_general_views_init'));
        await queryRunner.query(getSqlFileContent('age_with_full_label', 'functions_before_general_views_init'));
        await queryRunner.query(getSqlFileContent('generate_full_year_month_grid', 'functions_before_general_views_init'));
        await queryRunner.query(getSqlFileContent('parse_json_boolean', 'functions_before_general_views_init'));
        await queryRunner.query(getSqlFileContent('parse_json_bigint', 'functions_before_general_views_init'));
        await queryRunner.query(getSqlFileContent('parse_json_decimal', 'functions_before_general_views_init'));
        await queryRunner.query(getSqlFileContent('clean_json_text', 'functions_before_general_views_init'));
        await queryRunner.query(getSqlFileContent('no_vaccine_reason', 'functions_before_general_views_init'));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropFunction(queryRunner);
    }

    private async dropFunction(queryRunner: QueryRunner): Promise<void> {
        await DropFunction('calculate_age_in(TEXT, DATE, DATE, TEXT, INT)', queryRunner);
        await DropFunction('generate_random_colors(BIGINT)', queryRunner);
        await DropFunction('age_with_full_label(BIGINT)', queryRunner);
        await DropFunction('generate_full_year_month_grid(INT, INT, INT)', queryRunner);
        await DropFunction('parse_json_boolean(TEXT)', queryRunner);
        await DropFunction('parse_json_bigint(TEXT)', queryRunner);
        await DropFunction('parse_json_decimal(TEXT)', queryRunner);
        await DropFunction('clean_json_text(TEXT)', queryRunner);
        await DropFunction('no_vaccine_reason(TEXT)', queryRunner);
        
    }
}




// Start Général Views
export class YearMonthGridView1740000000001 extends SqlBaseViewMigration {
    protected viewsNames = ['year_month_grid_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class OrgUnitsView1740000000002 extends SqlBaseViewMigration {
    protected viewsNames = ['country_view', 'region_view', 'prefecture_view', 'commune_view', 'hospital_view', 'district_quartier_view', 'village_secteur_view', 'family_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views/orgunits';
}

export class PersonsView1740000000003 extends SqlBaseViewMigration {
    protected viewsNames = ['country_manager_view', 'region_manager_view', 'prefecture_manager_view', 'commune_manager_view', 'hospital_manager_view', 'chw_view', 'reco_view', 'patient_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views/persons';
}

export class AdultDataView1740000000004 extends SqlBaseViewMigration {
    protected viewsNames = ['adult_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class FamilyPlanningDataView1740000000005 extends SqlBaseViewMigration {
    protected viewsNames = ['family_planning_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class PregnantDataView1740000000006 extends SqlBaseViewMigration {
    protected viewsNames = ['pregnant_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class NewbornDataView1740000000007 extends SqlBaseViewMigration {
    protected viewsNames = ['newborn_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class PcimneDataView1740000000008 extends SqlBaseViewMigration {
    protected viewsNames = ['pcimne_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class DeliveryDataView1740000000009 extends SqlBaseViewMigration {
    protected viewsNames = ['delivery_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class RecoMegDataView1740000000010 extends SqlBaseViewMigration {
    protected viewsNames = ['reco_meg_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class ReferalDataView1740000000011 extends SqlBaseViewMigration {
    protected viewsNames = ['referal_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class VaccinationDataView1740000000012 extends SqlBaseViewMigration {
    protected viewsNames = ['vaccination_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class EventsDataView1740000000013 extends SqlBaseViewMigration {
    protected viewsNames = ['events_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class FsMegDataView1740000000014 extends SqlBaseViewMigration {
    protected viewsNames = ['fs_meg_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class PromotionalDataView1740000000015 extends SqlBaseViewMigration {
    protected viewsNames = ['promotional_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class DeathDataView1740000000016 extends SqlBaseViewMigration {
    protected viewsNames = ['death_data_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class RecoChwSupervisionView1740000000017 extends SqlBaseViewMigration {
    protected viewsNames = ['reco_chws_supervision_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class YearMonthRecoGridView1740000000018 extends SqlBaseViewMigration {
    protected viewsNames = ['year_month_reco_grid_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class PatientHouseholdStatsView1740000000019 extends SqlBaseViewMigration {
    protected viewsNames = ['patient_household_stats_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'views';
}

export class TasksStateView1740000000020 extends SqlBaseViewMigration {
    protected viewsNames = ['tasks_state_view'];
    protected cible: IndexTarget = 'only_id';
    protected schema = 'views';
}



export class UsersView1740000000080 extends SqlBaseViewMigration {
    protected viewsNames = ['users_view'];
    protected cible: IndexTarget = 'only_id';
    protected schema = 'views';
}


// Functions After General Views
export class FunctionsAfterGeneralInitView1740000000081 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(getSqlFileContent('build_meg_json', 'functions_after_general_views_init'));
        await queryRunner.query(getSqlFileContent('build_family_planning_json', 'functions_after_general_views_init'));
        await queryRunner.query(getSqlFileContent('safe_monthly_count', 'functions_after_general_views_init'));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropFunction(queryRunner);
    }

    private async dropFunction(queryRunner: QueryRunner): Promise<void> {
        await DropFunction('build_meg_json(INT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, INT)', queryRunner);
        await DropFunction('build_family_planning_json(TEXT, TEXT, TEXT, TEXT, INT)', queryRunner);
        await DropFunction('safe_monthly_count(TEXT, TEXT, TEXT, TEXT)', queryRunner);
    }
}



    
// Start Reports Utils Views
export class RepportsUtils1740000000082 extends SqlBaseViewMigration {
    protected viewsNames = ['report_all_cover_reco_view'];
    protected cible: IndexTarget = 'only_id';
    protected schema = 'reports/utils_views';
}

export class RepportsUtils1740000000083 extends SqlBaseViewMigration {
    protected viewsNames = ['report_all_functional_reco_view', 'report_adults_view', 'report_death_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports/utils_views';
}

export class RepportsUtils1740000000084 extends SqlBaseViewMigration {
    protected viewsNames = ['report_events_view', 'report_family_view',];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports/utils_views';
}

export class RepportsUtils1740000000085 extends SqlBaseViewMigration {
    protected viewsNames = ['report_newborn_view', 'report_patient_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports/utils_views';
}

export class RepportsUtils1740000000086 extends SqlBaseViewMigration {
    protected viewsNames = ['report_pcime_view', 'report_pregnant_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports/utils_views';
}

export class RepportsUtils1740000000087 extends SqlBaseViewMigration {
    protected viewsNames = ['report_promotional_view', 'report_vaccination_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports/utils_views';
}

export class PatientsCountView1740000000088 extends SqlBaseViewMigration {
    protected viewsNames = ['report_patient_count_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'reports/utils_views';
}





// Start Reports Views
export class MorbidityReportView1740000000101 extends SqlBaseViewMigration {
    protected viewsNames = ['reports_morbidity_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports';
}
export class ChwsRecoActivitiesReportsView1740000000102 extends SqlBaseViewMigration {
    protected viewsNames = ['reports_chws_reco_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports';
}
export class PromotionalActivitiesReportsView1740000000103 extends SqlBaseViewMigration {
    protected viewsNames = ['reports_promotional_activities_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports';
}
export class FamilyPlanningReportsView1740000000104 extends SqlBaseViewMigration {
    protected viewsNames = ['reports_family_planning_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports';
}
export class HouseholdReportsView1740000000105 extends SqlBaseViewMigration {
    protected viewsNames = ['reports_household_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'reports';
}
export class PcimneNewbornReportsView1740000000106 extends SqlBaseViewMigration {
    protected viewsNames = ['reports_pcime_newborn_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports';
}
export class RecoMegSituationReportsView1740000000107 extends SqlBaseViewMigration {
    protected viewsNames = ['reports_reco_meg_situation_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'reports';
}




// Start Dashboards Views
export class DashboardsUtilsView1740000000150 extends SqlBaseViewMigration {
    protected viewsNames = ['dash_max_vaccination_view'];
    protected cible: IndexTarget = 'only_id';
    protected schema = 'dashboards/utils_views';
}
export class DashboardsUtilsView1740000000151 extends SqlBaseViewMigration {
    protected viewsNames = ['dash_all_actions_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'dashboards/utils_views';
}
export class DashboardsUtilsView1740000000152 extends SqlBaseViewMigration {
    protected viewsNames = ['dash_consultation_followup_view'];
    protected cible: IndexTarget = 'id';
    protected schema = 'dashboards/utils_views';
}


// Start Dashboards Views
export class ActiveRecoDashboardView1740000000200 extends SqlBaseViewMigration {
    protected viewsNames = ['dashboards_active_reco_view'];
    protected cible: IndexTarget = 'reco_year';
    protected schema = 'dashboards';
}
export class RecoPerformanceDashboardView1740000000201 extends SqlBaseViewMigration {
    protected viewsNames = ['dashboards_reco_performance_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'dashboards';
}
export class RecoPerformanceFullYearDashboardView1740000000202 extends SqlBaseViewMigration {
    protected viewsNames = ['dashboards_reco_performance_full_year_view'];
    protected cible: IndexTarget = 'reco_year';
    protected schema = 'dashboards';
}
export class RecoVaccinationNotDoneDashboardView1740000000203 extends SqlBaseViewMigration {
    protected viewsNames = ['dashboards_reco_vaccination_not_done_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'dashboards';
}
export class RecoVaccinationAllDoneDashboardView1740000000204 extends SqlBaseViewMigration {
    protected viewsNames = ['dashboards_reco_vaccination_all_done_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'dashboards';
}
export class RecoVaccinationPartialDoneDashboardView1740000000205 extends SqlBaseViewMigration {
    protected viewsNames = ['dashboards_reco_vaccination_partial_done_view'];
    protected cible: IndexTarget = 'reco_month_year';
    protected schema = 'dashboards';
}
export class TasksStateDashboardView1740000000206 extends SqlBaseViewMigration {
    protected viewsNames = ['dashboards_tasks_state_view'];
    protected cible: IndexTarget = 'only_id';
    protected schema = 'dashboards';
}



// Start Maps Views
export class RecoMapsView1740000000301 extends SqlBaseViewMigration {
    protected viewsNames = ['reco_data_map_view'];
    protected cible: IndexTarget = 'only_id';
    protected schema = 'maps';
}


// Users Telemetries
export class DevicesTelemetryView1740000000401 extends SqlBaseViewMigration {
    protected viewsNames = ['devices_telemetry_view'];
    protected cible: IndexTarget = 'only_id';
    protected schema = 'telemetries';
}
export class MetricsTelemetryView1740000000402 extends SqlBaseViewMigration {
    protected viewsNames = ['metrics_telemetry_view'];
    protected cible: IndexTarget = 'only_id';
    protected schema = 'telemetries';
}
export class UsersTelemetryView1740000000403 extends SqlBaseViewMigration {
    protected viewsNames = ['users_telemetry_view'];
    protected cible: IndexTarget = 'only_id';
    protected schema = 'telemetries';
}
export class UsersFeedbackView1740000000404 extends SqlBaseViewMigration {
    protected viewsNames = ['users_feedback_view'];
    protected cible: IndexTarget = 'only_id';
    protected schema = 'telemetries';
}






