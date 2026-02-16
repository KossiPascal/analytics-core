from typing import List, Optional, Dict, Tuple, Literal

from backend.src.databases.types import BaseViewMigration


# -----------------------
# EXEMPLE DE VUES
# -----------------------

__MIGRATION_REGISTRY_GROUPED:List[BaseViewMigration] = [
    BaseViewMigration(
        revision=10,
        name="functions_before_views",
        views=[
            "get_value_or_default",
            "calculate_age_in",
            "generate_random_colors",
            "age_with_full_label",
            "generate_full_year_month_grid",
            "parse_json_boolean",
            "parse_json_bigint",
            "parse_json_decimal",
            "clean_json_text",
            "no_vaccine_reason"
        ],
        folder="functions/before_views",
        type="function",
        refresh=False,
        drop_before_create=False
    ),
    BaseViewMigration(
        revision=20,
        name="year_month_grid",
        views=["year_month_grid_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)],
        depends_on=[10]
    ),
    BaseViewMigration(
        revision=30,
        name="OrgUnitsView",
        views=[
            "country_view", 
            "region_view", 
            "prefecture_view", 
            "commune_view", 
            "hospital_view", 
            "district_quartier_view", 
            "village_secteur_view", 
            "family_view"
        ],
        unique_combos=[("id",)],
        combos=[("month",),("year",)],
        folder="views/orgunits"
    ),
    BaseViewMigration(
        revision=40,
        name="PersonsView",
        views=[
            "country_manager_view", 
            "region_manager_view", 
            "prefecture_manager_view", 
            "commune_manager_view", 
            "hospital_manager_view", 
            "chw_view", "reco_view", 
            "patient_view"
        ],
        folder="views/persons",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=50,
        name="AdultDataView",
        views=["adult_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=60,
        name="FamilyPlanningDataView",
        views=["family_planning_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=70,
        name="PregnantDataView",
        views=["pregnant_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=80,
        name="NewbornDataView",
        views=["newborn_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=90,
        name="PcimneDataView",
        views=["pcimne_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=100,
        name="DeliveryDataView",
        views=["delivery_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=110,
        name="RecoMegDataView",
        views=["reco_meg_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=120,
        name="ReferalDataView",
        views=["referal_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=130,
        name="VaccinationDataView",
        views=["vaccination_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=140,
        name="EventsDataView",
        views=["events_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=150,
        name="FsMegDataView",
        views=["fs_meg_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=160,
        name="PromotionalDataView",
        views=["promotional_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=170,
        name="DeathDataView",
        views=["death_data_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=180,
        name="RecoChwSupervisionView",
        views=["reco_chws_supervision_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=190,
        name="YearMonthRecoGridView",
        views=["year_month_reco_grid_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=200,
        name="PatientHouseholdStatsView",
        views=["patient_household_stats_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[("month",),("year",)]
    ),
    BaseViewMigration(
        revision=210,
        name="TasksStateView",
        views=["tasks_state_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[]
    ),
    BaseViewMigration(
        revision=220,
        name="UsersView",
        views=["users_view"],
        folder="views",
        unique_combos=[("id",)],
        combos=[]
    ),

    # Functions After General Views
    BaseViewMigration(
        revision=230,
        name="functions_after_views",
        views=["build_meg_json", "build_family_planning_json", "safe_monthly_count"],
        folder="functions/after_views",
        type="function",
        refresh=False,
        drop_before_create=False,
        depends_on=[220]
    ),
    
    # Start Reports Utils Views
    BaseViewMigration(
        revision=240,
        name="RepportsUtils50",
        views=["report_all_cover_reco_view"],
        folder="reports/utils_views",
        unique_combos=[("id",)],
        combos=[],
        depends_on=[230]
    ),
    BaseViewMigration(
        revision=250,
        name="RepportsUtils51",
        views=["report_all_functional_reco_view", "report_adults_view", "report_death_view"],
        folder="reports/utils_views",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=260,
        name="RepportsUtils52",
        views=["report_events_view", "report_family_view",],
        folder="reports/utils_views",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=270,
        name="RepportsUtils53",
        views=["report_newborn_view", "report_patient_view"],
        folder="reports/utils_views",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=280,
        name="RepportsUtils54",
        views=["report_pcime_view", "report_pregnant_view"],
        folder="reports/utils_views",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=290,
        name="RepportsUtils55",
        views=["report_promotional_view", "report_vaccination_view"],
        folder="reports/utils_views",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=300,
        name="PatientsCountView56",
        views=["report_patient_count_view"],
        unique_combos=[("id",)],
        combos=[("month",),("year",)],
        folder="reports/utils_views"
    ),
    BaseViewMigration(
        revision=310,
        name="MorbidityReportView",
        views=["reports_morbidity_view"],
        folder="reports",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=320,
        name="ChwsRecoActivitiesReportsView",
        views=["reports_chws_reco_view"],
        folder="reports",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=330,
        name="PromotionalActivitiesReportsView",
        views=["reports_promotional_activities_view"],
        folder="reports",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=340,
        name="FamilyPlanningReportsView",
        views=["reports_family_planning_view"],
        folder="reports",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=350,
        name="HouseholdReportsView",
        views=["reports_household_view"],
        unique_combos=[("id",)],
        combos=[("month",),("year",)],
        folder="reports"
    ),
    BaseViewMigration(
        revision=360,
        name="PcimneNewbornReportsView",
        views=["reports_pcime_newborn_view"],
        folder="reports",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=370,
        name="RecoMegSituationReportsView",
        views=["reports_reco_meg_situation_view"],
        folder="reports",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=380,
        name="DashboardsUtilsView",
        views=["dash_max_vaccination_view"],
        folder="dashboards/utils_views",
        unique_combos=[("id",)],
        combos=[],
    ),
    BaseViewMigration(
        revision=390,
        name="DashboardsUtilsView",
        views=["dash_all_actions_view"],
        unique_combos=[("id",)],
        combos=[("month",),("year",)],
        folder="dashboards/utils_views"
    ),
    BaseViewMigration(
        revision=400,
        name="DashboardsUtilsView",
        views=["dash_consultation_followup_view"],
        unique_combos=[("id",)],
        combos=[("month",),("year",)],
        folder="dashboards/utils_views"
    ),
    BaseViewMigration(
        revision=410,
        name="ActiveRecoDashboardView",
        views=["dashboards_active_reco_view"],
        folder="dashboards",
        unique_combos=[("reco_id", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=420,
        name="RecoPerformanceDashboardView",
        views=["dashboards_reco_performance_view"],
        folder="dashboards",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=430,
        name="RecoPerformanceFullYearDashboardView",
        views=["dashboards_reco_performance_full_year_view"],
        folder="dashboards",
        unique_combos=[("reco_id", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=440,
        name="RecoVaccinationNotDoneDashboardView",
        views=["dashboards_reco_vaccination_not_done_view"],
        folder="dashboards",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=450,
        name="RecoVaccinationAllDoneDashboardView",
        views=["dashboards_reco_vaccination_all_done_view"],
        folder="dashboards",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=460,
        name="RecoVaccinationPartialDoneDashboardView",
        views=["dashboards_reco_vaccination_partial_done_view"],
        folder="dashboards",
        unique_combos=[("reco_id", "month", "year")],
        combos=[("id",)]
    ),
    BaseViewMigration(
        revision=470,
        name="TasksStateDashboardView",
        views=["dashboards_tasks_state_view"],
        folder="dashboards",
        unique_combos=[("id",)],
        combos=[]
    ),
    BaseViewMigration(
        revision=480,
        name="RecoMapsView",
        views=["reco_data_map_view"],
        folder="maps",
        unique_combos=[("id",)],
        combos=[]
    ),
    BaseViewMigration(
        revision=490,
        name="DevicesTelemetryView",
        views=["devices_telemetry_view"],
        folder="telemetries",
        unique_combos=[("id",)],
        combos=[]
    ),
    BaseViewMigration(
        revision=500,
        name="MetricsTelemetryView",
        views=["metrics_telemetry_view"],
        folder="telemetries",
        unique_combos=[("id",)],
        combos=[]
    ),
    BaseViewMigration(
        revision=510,
        name="UsersTelemetryView",
        views=["users_telemetry_view"],
        folder="telemetries",
        unique_combos=[("id",)],
        combos=[]
    ),
    BaseViewMigration(
        revision=520,
        name="UsersFeedbackView",
        views=["users_feedback_view"],
        folder="telemetries",
        unique_combos=[("id",)],
        combos=[]
    ),
]


# def __generate_version(revision:int, migration_index:int, view_index:int, interval:int=20)->int:
#     mi = 0 if migration_index == 0 else (migration_index + interval)
#     return migration_index+mi+view_index

def __generate_view_revision(base_revision: int,migration_index: int,view_index: int,interval: int = 100) -> int:
    """ Exemple : base_revision = 10 | migration_index = 2 | view_index = 1 | => 10_201 """
    return base_revision * 10_000 + migration_index * interval + view_index


def FormatViewMigration()->List[BaseViewMigration]:
    migrations: List[BaseViewMigration] = []
    grouped = sorted(__MIGRATION_REGISTRY_GROUPED, key=lambda m: m.revision)

    for migration_index, base_migration in enumerate(grouped):
        for view_index, view_name in enumerate(base_migration.views):

            depends_on = []
            for m in migrations:
                depends_on.append(m.revision)

            vm = BaseViewMigration(
                name=f"{base_migration.name}__{view_name}",
                revision=__generate_view_revision(base_migration.revision,migration_index,view_index,),
                views=[view_name],
                type=base_migration.type,
                folder=base_migration.folder,
                refresh=base_migration.refresh,
                refresh_mode=base_migration.refresh_mode,
                combos=base_migration.combos,
                unique_combos=base_migration.unique_combos,
                create_sql=base_migration.create_sql,
                drop_sql=base_migration.drop_sql,
                refresh_sql=base_migration.refresh_sql,
                create_index_sql=base_migration.create_index_sql,
                drop_index_sql=base_migration.drop_index_sql,
                depends_on=sorted(depends_on, key=lambda d: d), #base_migration.depends_on,
                drop_before_create=base_migration.drop_before_create,
            )

            migrations.append(vm)

    return migrations

