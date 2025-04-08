
export type DatabaseName = 'users' |
    'user_info' |
    'token' |
    'reco_vaccination_dashboard' |
    'reco_performance_dashboard' |
    'reco_chart_performance_dashboard' |
    'promotion_reports' |
    'family_planning_reports' |
    'morbidity_reports' |
    'malaria_morbidity_reports' |
    'household_recaps_reports' |
    'pcime_newborn_reports' |
    'chws_reco_reports' |
    'reco_meg_situation_reports';

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
    'reco_vaccination_dashboard',
    'reco_performance_dashboard',
    'reco_chart_performance_dashboard'
];


export type FunctionAsStringName = 'chwsRecoTransformFunction' | 'promotionTransformFunction' | 'familyPlanningTransformFunction' | 'morbidityTransformFunction' | 'householdTransformFunction' | 'pcimneNewbornTransformFunction' | 'recoMegTransformFunction' | 'vaccineTransformFunction' | 'performanceChartTransformFunction';

export type LocalDbName = 'local' | 'session' | 'coockie';

export type SyncStatus = 'success' | 'pending' | 'error' | 'offline' | 'outdated' | 'idle';
