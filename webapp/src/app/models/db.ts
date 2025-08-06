
export type DatabaseName = 'users' |
    'user_info' |
    'token' |
    'reco_vaccine_not_done_dashboard' |
    'reco_vaccine_partial_done_dashboard' |
    'reco_vaccine_all_done_dashboard' |
    'reco_performance_dashboard' |
    'reco_full_year_performance_dashboard' |
    'promotion_reports' |
    'family_planning_reports' |
    'morbidity_reports' |
    'malaria_morbidity_reports' |
    'household_recaps_reports' |
    'pcime_newborn_reports' |
    'chws_reco_reports' |
    'reco_meg_situation_reports' |
    'reco_data_maps' |
    'active_reco_dashboard' |
    'reco_tasks_state_dashboard';

export const LOCAL_REPPORTS_DB_NAME:DatabaseName[] = [
    'promotion_reports',
    'family_planning_reports',
    'morbidity_reports',
    'malaria_morbidity_reports',
    'household_recaps_reports',
    'pcime_newborn_reports',
    'chws_reco_reports',
    'reco_meg_situation_reports',
];
export const LOCAL_DASHBOARDS_DB_NAME:DatabaseName[] = [
    'reco_vaccine_not_done_dashboard',
    'reco_vaccine_partial_done_dashboard',
    'reco_vaccine_all_done_dashboard',
    'reco_performance_dashboard',
    'reco_full_year_performance_dashboard',
    'active_reco_dashboard',
    'reco_tasks_state_dashboard'
];
export const LOCAL_MAPS_DB_NAME:DatabaseName[] = [
    'reco_data_maps',
];



export type FunctionAsStringName = 'chwsRecoTransformFunction' | 'promotionTransformFunction' | 'familyPlanningTransformFunction' | 'morbidityTransformFunction' | 'householdTransformFunction' | 'pcimneNewbornTransformFunction' | 'recoMegTransformFunction' | 'vaccineTransformFunction' | 'recoPerformanceTransformFunction' | 'recoDataMapsTransformFunction' | 'activeRecoTransformFunction' | 'recoTasksStateTransformFunction';

export type LocalDbName = 'local' | 'session' | 'coockie';

export type SyncStatus = 'success' | 'pending' | 'error' | 'offline' | 'outdated' | 'idle';
