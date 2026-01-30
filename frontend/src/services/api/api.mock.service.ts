/* api.mock.service.ts - Service API Mock utilisant les données de test locales */

import {
  db,
  COUNTRIES,
  REGIONS,
  PREFECTURES,
  COMMUNES,
  HOSPITALS,
  DISTRICT_QUARTIERS,
  VILLAGE_SECTEURS,
  CHWS,
  RECOS,
  FAMILIES,
  PATIENTS,
  ROLES,
  AUTHORIZATIONS,
  ROUTES,
  ORGANIZATIONS,
  PERMISSIONS,
  generateRecoPerformanceDashboard,
  generateVaccinationDashboard,
  generateActiveRecoDashboard,
  generateTasksStateDashboard,
  generateFamilyPlanningReport,
  generateMorbidityReport,
  generatePromotionReport,
  generateHouseholdRecapReport,
  generatePcimneNewbornReport,
  generateChwsRecoReport,
  generateRecoMegSituationReport,
  initializeTestData,
} from '@/utils/TestData';
import type { Organization, Permission, ApiToken } from '@/utils/TestData';

// Initialiser les données
initializeTestData();

// Simulation de délai réseau
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Type de réponse API standard
interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  message?: string;
}

// Créer une réponse success
function success<T>(data: T, message?: string): ApiResponse<T> {
  return { status: 200, data, message: message ?? 'Success' };
}

// ============================================
// AUTH API MOCK
// ============================================
export const AuthApiMock = {
  login: async (_credentials: { username: string; password: string }) => {
    await delay(500);
    // Le login est géré par auth.service.ts
    return success({ message: 'Login handled by auth.service' });
  },

  register: async (user: Record<string, unknown>) => {
    await delay(400);
    const userId = typeof user.id === 'string' ? user.id : `user-${Date.now()}`;
    const newUser = db.create('users', {
      ...user,
      id: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    });
    return success(newUser, 'Utilisateur créé');
  },

  createUser: async (user: Record<string, unknown>) => {
    await delay(400);
    const userId = typeof user.id === 'string' ? user.id : `user-${Date.now()}`;
    const newUser = db.create('users', {
      ...user,
      id: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    });
    return success(newUser, 'Utilisateur créé');
  },

  refreshToken: async () => {
    await delay(200);
    return success({ token: 'mock-refreshed-token' });
  },

  getUsers: async () => {
    await delay(300);
    const { items } = db.list('users');
    return success(items);
  },

  updateProfile: async (params: { id: string; fullname: string; email: string; phone: string }) => {
    await delay(300);
    const updated = db.update('users', params.id, params);
    return success(updated, 'Profil mis à jour');
  },

  updateUser: async (user: Record<string, unknown>) => {
    await delay(300);
    const updated = db.update('users', user.id as string, user);
    return success(updated, 'Utilisateur mis à jour');
  },

  updatePassword: async (_params: { id: string; oldPassword: string; newPassword: string }) => {
    await delay(400);
    return success(null, 'Mot de passe mis à jour');
  },

  deleteUser: async (user: Record<string, unknown>, _permanentDelete = false) => {
    await delay(300);
    db.delete('users', user.id as string);
    return success(null, 'Utilisateur supprimé');
  },

  getRoles: async () => {
    await delay(200);
    // Récupérer les rôles de la base de données locale
    const { items } = db.list('roles');
    return success(items.length > 0 ? items : ROLES);
  },

  createRole: async (role: Record<string, unknown>) => {
    await delay(300);
    const roleId = typeof role.id === 'string' ? role.id : `role-${Date.now()}`;
    const newRole = db.create('roles', {
      ...role,
      id: roleId,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: null,
    });
    return success(newRole, 'Rôle créé');
  },

  updateRole: async (role: Record<string, unknown>) => {
    await delay(300);
    const updated = db.update('roles', role.id as string, {
      ...role,
      updatedAt: new Date().toISOString(),
    });
    return success(updated, 'Rôle mis à jour');
  },

  deleteRole: async (role: Record<string, unknown>) => {
    await delay(300);
    db.delete('roles', role.id as string);
    return success(null, 'Rôle supprimé');
  },

  getAuthorizations: async () => {
    await delay(200);
    return success(AUTHORIZATIONS);
  },

  getRoutes: async () => {
    await delay(200);
    return success(ROUTES);
  },

  apiTokenAction: async (_params: { action: string; id?: number; token?: string; isActive?: boolean }) => {
    await delay(300);
    return success({ tokens: [] }, 'Action effectuée');
  },
};

// ============================================
// REPORTS API MOCK
// ============================================
export const ReportsApiMock = {
  getPromotionReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(500);
    const recoIds = params.recos.length > 0 ? params.recos : RECOS.map(r => r.id);
    const data = recoIds.flatMap(recoId =>
      params.months.map(month => generatePromotionReport(params.year, month, recoId))
    );
    return success(data);
  },

  getFamilyPlanningReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(500);
    const recoIds = params.recos.length > 0 ? params.recos : RECOS.map(r => r.id);
    const data = recoIds.flatMap(recoId =>
      params.months.map(month => generateFamilyPlanningReport(params.year, month, recoId))
    );
    return success(data);
  },

  getMorbidityReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(500);
    const recoIds = params.recos.length > 0 ? params.recos : RECOS.map(r => r.id);
    const data = recoIds.flatMap(recoId =>
      params.months.map(month => generateMorbidityReport(params.year, month, recoId))
    );
    return success(data);
  },

  getHouseholdRecapReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(500);
    const recoIds = params.recos.length > 0 ? params.recos : RECOS.map(r => r.id);
    const data = recoIds.flatMap(recoId =>
      params.months.flatMap(month => generateHouseholdRecapReport(params.year, month, recoId))
    );
    return success(data);
  },

  getPcimneNewbornReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(500);
    const recoIds = params.recos.length > 0 ? params.recos : RECOS.map(r => r.id);
    const data = recoIds.flatMap(recoId =>
      params.months.map(month => generatePcimneNewbornReport(params.year, month, recoId))
    );
    return success(data);
  },

  getChwsRecoReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(500);
    const recoIds = params.recos.length > 0 ? params.recos : RECOS.map(r => r.id);
    const data = recoIds.flatMap(recoId =>
      params.months.map(month => generateChwsRecoReport(params.year, month, recoId))
    );
    return success(data);
  },

  getRecoMegSituationReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(500);
    const recoIds = params.recos.length > 0 ? params.recos : RECOS.map(r => r.id);
    const data = recoIds.flatMap(recoId =>
      params.months.map(month => generateRecoMegSituationReport(params.year, month, recoId))
    );
    return success(data);
  },

  // Validation endpoints - tous retournent success
  validatePromotionReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Rapports validés');
  },

  cancelValidatePromotionReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Validation annulée');
  },

  validateFamilyPlanningReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Rapports validés');
  },

  cancelValidateFamilyPlanningReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Validation annulée');
  },

  validateMorbidityReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Rapports validés');
  },

  cancelValidateMorbidityReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Validation annulée');
  },

  validateHouseholdRecapReports: async (_params: { months: string[]; year: number; recos: string[]; dataIds: string[] }) => {
    await delay(400);
    return success(null, 'Rapports validés');
  },

  cancelValidateHouseholdRecapReports: async (_params: { months: string[]; year: number; recos: string[]; dataIds: string[] }) => {
    await delay(400);
    return success(null, 'Validation annulée');
  },

  validatePcimneNewbornReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Rapports validés');
  },

  cancelValidatePcimneNewbornReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Validation annulée');
  },

  validateChwsRecoReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Rapports validés');
  },

  cancelValidateChwsRecoReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Validation annulée');
  },

  validateRecoMegSituationReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Rapports validés');
  },

  cancelValidateRecoMegSituationReports: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    return success(null, 'Validation annulée');
  },
};

// ============================================
// DASHBOARDS API MOCK
// ============================================
export const DashboardsApiMock = {
  getRecoVaccinationNotDone: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(600);
    const data = params.months.flatMap(month => generateVaccinationDashboard(params.year, month, 'none'));
    return success(data);
  },

  getRecoVaccinationPartialDone: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(600);
    const data = params.months.flatMap(month => generateVaccinationDashboard(params.year, month, 'partial'));
    return success(data);
  },

  getRecoVaccinationAllDone: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(600);
    const data = params.months.flatMap(month => generateVaccinationDashboard(params.year, month, 'all'));
    return success(data);
  },

  getRecoPerformance: async (params: { months: string[]; year: number; recos: string[] }) => {
    await delay(500);
    const data = generateRecoPerformanceDashboard(params.year, params.months);
    return success(data);
  },

  getActiveReco: async (params: { year: number; recos: string[] }) => {
    await delay(500);
    const data = generateActiveRecoDashboard(params.year);
    return success(data);
  },

  getRecoTasksState: async (_params: { start_date: string; end_date: string; recos: string[] }) => {
    await delay(500);
    const data = generateTasksStateDashboard();
    return success(data);
  },
};

// ============================================
// MAPS API MOCK
// ============================================
export const MapsApiMock = {
  getRecoDataMaps: async (_params: { months: string[]; year: number; recos: string[] }) => {
    await delay(400);
    // Données de carte simulées
    const mapData = RECOS.map(reco => ({
      id: reco.id,
      name: reco.name,
      coordinates: {
        latitude: 9.5 + Math.random() * 0.5,
        longitude: -13.7 + Math.random() * 0.5,
      },
      metrics: {
        families: Math.floor(Math.random() * 50) + 10,
        patients: Math.floor(Math.random() * 200) + 50,
        visits: Math.floor(Math.random() * 100) + 20,
      },
    }));
    return success(mapData);
  },
};

// ============================================
// ORG UNITS API MOCK
// ============================================
export const OrgUnitsApiMock = {
  getCountries: async () => {
    await delay(200);
    return success(COUNTRIES);
  },

  getRegions: async (params?: { countries?: string[]; country_id?: string }) => {
    await delay(200);
    let data = REGIONS;
    if (params?.countries && params.countries.length > 0) {
      data = REGIONS.filter(r => params.countries!.includes(r.country_id));
    } else if (params?.country_id) {
      data = REGIONS.filter(r => r.country_id === params.country_id);
    }
    return success(data);
  },

  getPrefectures: async (params?: { regions?: string[]; region_id?: string }) => {
    await delay(200);
    let data = PREFECTURES;
    if (params?.regions && params.regions.length > 0) {
      data = PREFECTURES.filter(p => params.regions!.includes(p.region_id));
    } else if (params?.region_id) {
      data = PREFECTURES.filter(p => p.region_id === params.region_id);
    }
    return success(data);
  },

  getCommunes: async (params?: { prefectures?: string[]; prefecture_id?: string }) => {
    await delay(200);
    let data = COMMUNES;
    if (params?.prefectures && params.prefectures.length > 0) {
      data = COMMUNES.filter(c => params.prefectures!.includes(c.prefecture_id));
    } else if (params?.prefecture_id) {
      data = COMMUNES.filter(c => c.prefecture_id === params.prefecture_id);
    }
    return success(data);
  },

  getHospitals: async (params?: { communes?: string[]; commune_id?: string }) => {
    await delay(200);
    let data = HOSPITALS;
    if (params?.communes && params.communes.length > 0) {
      data = HOSPITALS.filter(h => params.communes!.includes(h.commune_id));
    } else if (params?.commune_id) {
      data = HOSPITALS.filter(h => h.commune_id === params.commune_id);
    }
    return success(data);
  },

  getDistrictQuartiers: async (params?: { hospitals?: string[]; hospital_id?: string }) => {
    await delay(200);
    let data = DISTRICT_QUARTIERS;
    if (params?.hospitals && params.hospitals.length > 0) {
      data = DISTRICT_QUARTIERS.filter(d => params.hospitals!.includes(d.hospital_id));
    } else if (params?.hospital_id) {
      data = DISTRICT_QUARTIERS.filter(d => d.hospital_id === params.hospital_id);
    }
    return success(data);
  },

  getVillageSecteurs: async (params?: { district_quartiers?: string[]; district_quartier_id?: string }) => {
    await delay(200);
    let data = VILLAGE_SECTEURS;
    if (params?.district_quartiers && params.district_quartiers.length > 0) {
      data = VILLAGE_SECTEURS.filter(v => params.district_quartiers!.includes(v.district_quartier_id));
    } else if (params?.district_quartier_id) {
      data = VILLAGE_SECTEURS.filter(v => v.district_quartier_id === params.district_quartier_id);
    }
    return success(data);
  },

  getFamilies: async (params?: { recos?: string[]; reco_id?: string }) => {
    await delay(200);
    let data = FAMILIES;
    if (params?.recos && params.recos.length > 0) {
      data = FAMILIES.filter(f => params.recos!.includes(f.reco_id));
    } else if (params?.reco_id) {
      data = FAMILIES.filter(f => f.reco_id === params.reco_id);
    }
    return success(data);
  },

  getChws: async (params?: { district_quartiers?: string[]; district_quartier_id?: string }) => {
    await delay(200);
    let data = CHWS;
    if (params?.district_quartiers && params.district_quartiers.length > 0) {
      data = CHWS.filter(c => params.district_quartiers!.includes(c.district_quartier_id));
    } else if (params?.district_quartier_id) {
      data = CHWS.filter(c => c.district_quartier_id === params.district_quartier_id);
    }
    return success(data);
  },

  getRecos: async (params?: { village_secteurs?: string[]; village_secteur_id?: string }) => {
    await delay(200);
    let data = RECOS;
    if (params?.village_secteurs && params.village_secteurs.length > 0) {
      data = RECOS.filter(r => params.village_secteurs!.includes(r.village_secteur_id));
    } else if (params?.village_secteur_id) {
      data = RECOS.filter(r => r.village_secteur_id === params.village_secteur_id);
    }
    return success(data);
  },

  getPatients: async (params?: { families?: string[]; family_id?: string }) => {
    await delay(200);
    let data = PATIENTS;
    if (params?.families && params.families.length > 0) {
      data = PATIENTS.filter(p => params.families!.includes(p.family_id));
    } else if (params?.family_id) {
      data = PATIENTS.filter(p => p.family_id === params.family_id);
    }
    return success(data);
  },
};

// ============================================
// DATABASE API MOCK
// ============================================
export const DatabaseApiMock = {
  getDataToDeleteFromCouchDb: async (_params: { cible: string[]; start_date: string; end_date: string; type: string }) => {
    await delay(400);
    return success([]);
  },

  deleteDataFromCouchDb: async (_data: unknown[], _typeOfData: string) => {
    await delay(400);
    return success(null, 'Données supprimées');
  },

  updateUserFacilityContactPlace: async (_params: { contact: string; parent: string; new_parent: string }) => {
    await delay(400);
    return success(null, 'Mise à jour effectuée');
  },

  getDatabaseEntities: async () => {
    await delay(300);
    return success([
      { name: 'Users', table: 'users' },
      { name: 'Families', table: 'families' },
      { name: 'Patients', table: 'patients' },
      { name: 'Reports', table: 'reports' },
    ]);
  },

  truncateDatabase: async (_params: { procide: boolean; entities: { name: string; table: string }[]; action: 'TRUNCATE' | 'DROP' }) => {
    await delay(500);
    return success(null, 'Base de données tronquée');
  },
};

// ============================================
// DHIS2 API MOCK
// ============================================
export const Dhis2ApiMock = {
  sendChwsRecoReports: async (_params: unknown) => {
    await delay(800);
    return success({ sent: true }, 'Données envoyées à DHIS2');
  },

  sendFamilyPlanningActivities: async (_params: unknown) => {
    await delay(800);
    return success({ sent: true }, 'Données envoyées à DHIS2');
  },

  sendHouseholdActivities: async (_params: unknown) => {
    await delay(800);
    return success({ sent: true }, 'Données envoyées à DHIS2');
  },

  sendMorbidityActivities: async (_params: unknown) => {
    await delay(800);
    return success({ sent: true }, 'Données envoyées à DHIS2');
  },

  sendPcimneNewbornActivities: async (_params: unknown) => {
    await delay(800);
    return success({ sent: true }, 'Données envoyées à DHIS2');
  },

  sendPromotionActivities: async (_params: unknown) => {
    await delay(800);
    return success({ sent: true }, 'Données envoyées à DHIS2');
  },

  sendRecoMegSituationActivities: async (_params: unknown) => {
    await delay(800);
    return success({ sent: true }, 'Données envoyées à DHIS2');
  },
};

// ============================================
// SMS API MOCK
// ============================================
export const SmsApiMock = {
  sendSms: async (params: { phoneNumbers: string[]; message: string }) => {
    await delay(500);
    console.log('[SMS Mock] Envoi SMS à:', params.phoneNumbers, 'Message:', params.message);
    return success({ sent: params.phoneNumbers.length }, 'SMS envoyés');
  },

  sendCustomSms: async (params: { phone: string; message: string }[]) => {
    await delay(500);
    console.log('[SMS Mock] Envoi SMS personnalisés:', params);
    return success({ sent: params.length }, 'SMS envoyés');
  },
};

// ============================================
// CONFIG API MOCK
// ============================================
export const ConfigApiMock = {
  getConfigs: async () => {
    await delay(200);
    return success({
      appName: 'Kendeya Analytics',
      version: '1.0.0-mock',
      environment: 'development',
      features: {
        dashboards: true,
        reports: true,
        maps: true,
        sms: true,
      },
    });
  },

  getAppVersion: async () => {
    await delay(100);
    return success({ version: '1.0.0-mock', build: 'test-123' });
  },
};

// ============================================
// SQL MIGRATIONS API MOCK
// ============================================
export const MigrationsApiMock = {
  getAllMigrations: async () => {
    await delay(300);
    return success([
      { name: '001_create_users', status: 'completed', date: '2024-01-15' },
      { name: '002_create_families', status: 'completed', date: '2024-01-16' },
      { name: '003_create_patients', status: 'completed', date: '2024-01-17' },
    ]);
  },

  runAllMigrations: async (_runAllMigrations = true) => {
    await delay(500);
    return success(null, 'Migrations exécutées');
  },

  getOneMigration: async (migrationName: string) => {
    await delay(200);
    return success({ name: migrationName, status: 'completed' });
  },

  runOneMigration: async (migrationName: string, _runOneMigrations = true) => {
    await delay(300);
    return success({ name: migrationName }, 'Migration exécutée');
  },
};

// ============================================
// SURVEY API MOCK
// ============================================
export const SurveyApiMock = {
  saveSurvey: async (survey: unknown) => {
    await delay(400);
    console.log('[Survey Mock] Sauvegarde enquête:', survey);
    return success({ id: 'survey-' + Date.now() }, 'Enquête sauvegardée');
  },

  getAverages: async () => {
    await delay(300);
    return success({
      satisfaction: 4.2,
      usability: 4.5,
      performance: 4.0,
      responses: 150,
    });
  },
};

// ============================================
// ADMIN API MOCK
// ============================================
export const AdminApiMock = {
  getApiTokens: async () => {
    await delay(300);
    const { items } = db.list<ApiToken>('api_tokens');
    return success(items);
  },

  manageApiToken: async (params: { action: string; id?: string; token?: string; isActive?: boolean }) => {
    await delay(300);
    const { action, id, token, isActive } = params;

    switch (action) {
      case 'create': {
        const newToken = db.create<ApiToken>('api_tokens', {
          id: `token-${Date.now()}`,
          token: token ?? '',
          isActive: isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return success(newToken, 'Token créé');
      }
      case 'update': {
        if (!id) return success(null, 'ID requis');
        const updated = db.update<ApiToken>('api_tokens', id, {
          token,
          isActive,
          updatedAt: new Date().toISOString(),
        });
        return success(updated, 'Token mis à jour');
      }
      case 'delete': {
        if (!id) return success(null, 'ID requis');
        db.delete('api_tokens', id);
        return success(null, 'Token supprimé');
      }
      case 'list':
      default: {
        const { items } = db.list<ApiToken>('api_tokens');
        return success(items);
      }
    }
  },

  syncDatabase: async () => {
    await delay(1000);
    return success(null, 'Synchronisation terminée');
  },

  testDatabaseConnection: async (_params: {
    connectionName?: string;
    databaseName: string;
    username: string;
    password?: string;
    host: string;
    port: string;
    type: string;
    ssh?: {
      host?: string;
      port?: string;
      username?: string;
      password?: string;
      key?: string;
    } | null;
  }) => {
    await delay(600);
    return success({ message: 'Connexion établie avec succès' });
  },

  rebuildIndexes: async () => {
    await delay(800);
    return success(null, 'Index reconstruits');
  },

  vacuumDatabase: async () => {
    await delay(600);
    return success(null, 'Vacuum effectué');
  },

  checkDatabaseHealth: async () => {
    await delay(200);
    return success({
      status: 'healthy',
      connections: 5,
      uptime: '24h 30m',
      size: '125 MB',
    });
  },

  getDataToDeleteFromCouchDb: async (_params: { cible: string[]; start_date: string; end_date: string; type: string }) => {
    await delay(400);
    return success([]);
  },

  deleteDataFromCouchDb: async (_data: unknown[], _typeOfData: string) => {
    await delay(400);
    return success(null, 'Données supprimées');
  },

  getDatabaseEntities: async () => {
    await delay(300);
    return success([
      { name: 'Users', table: 'users' },
      { name: 'Families', table: 'families' },
      { name: 'Patients', table: 'patients' },
    ]);
  },

  truncateDatabase: async (_params: { procide: boolean; entities: { name: string; table: string }[]; action: 'TRUNCATE' | 'DROP' }) => {
    await delay(500);
    return success(null, 'Base tronquée');
  },

  generatePdf: async (_params: { templateId: string; config: Record<string, unknown> }) => {
    await delay(1000);
    return success({ url: '/mock-pdf-generated.pdf' }, 'PDF généré');
  },

  getSignatures: async () => {
    await delay(300);
    return success([
      { id: '1', name: 'Directeur', dataUrl: 'data:image/png;base64,xxx' },
      { id: '2', name: 'Superviseur', dataUrl: 'data:image/png;base64,yyy' },
    ]);
  },

  saveSignature: async (_params: { name: string; dataUrl: string }) => {
    await delay(400);
    return success({ id: 'sig-' + Date.now() }, 'Signature sauvegardée');
  },

  deleteSignature: async (_id: string) => {
    await delay(300);
    return success(null, 'Signature supprimée');
  },
};

// ============================================
// ORGANIZATIONS API MOCK
// ============================================
export const OrganizationsApiMock = {
  getOrganizations: async () => {
    await delay(200);
    const { items } = db.list<Organization>('organizations');
    return success(items.length > 0 ? items : ORGANIZATIONS);
  },

  createOrganization: async (org: { name: string; description?: string }) => {
    await delay(300);
    const newOrg = db.create<Organization>('organizations', {
      id: `org-${Date.now()}`,
      name: org.name,
      description: org.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    });
    return success(newOrg, 'Organisation créée');
  },

  updateOrganization: async (org: { id: string; name?: string; description?: string; isActive?: boolean }) => {
    await delay(300);
    const updated = db.update<Organization>('organizations', org.id, {
      ...org,
      updatedAt: new Date().toISOString(),
    });
    return success(updated, 'Organisation mise à jour');
  },

  deleteOrganization: async (id: string) => {
    await delay(300);
    db.delete('organizations', id);
    return success(null, 'Organisation supprimée');
  },
};

// ============================================
// PERMISSIONS API MOCK
// ============================================
export const PermissionsApiMock = {
  getPermissions: async () => {
    await delay(200);
    const { items } = db.list<Permission>('permissions');
    return success(items.length > 0 ? items : PERMISSIONS);
  },

  createPermission: async (perm: { name: string; description?: string; canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }) => {
    await delay(300);
    const newPerm = db.create<Permission>('permissions', {
      id: `perm-${Date.now()}`,
      name: perm.name,
      description: perm.description,
      canCreate: perm.canCreate,
      canRead: perm.canRead,
      canUpdate: perm.canUpdate,
      canDelete: perm.canDelete,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return success(newPerm, 'Permission créée');
  },

  updatePermission: async (perm: { id: string; name?: string; description?: string; canCreate?: boolean; canRead?: boolean; canUpdate?: boolean; canDelete?: boolean }) => {
    await delay(300);
    const updated = db.update<Permission>('permissions', perm.id, {
      ...perm,
      updatedAt: new Date().toISOString(),
    });
    return success(updated, 'Permission mise à jour');
  },

  deletePermission: async (id: string) => {
    await delay(300);
    db.delete('permissions', id);
    return success(null, 'Permission supprimée');
  },
};

// ============================================
// VISUALIZATIONS API MOCK
// ============================================
export interface StoredVisualization {
  id: string;
  name: string;
  description?: string;
  type: 'dashboard' | 'report';
  chartType: string;
  columns: { dimension: string; items: string[] }[];
  rows: { dimension: string; items: string[] }[];
  filters: { dimension: string; items: string[] }[];
  options: {
    title?: string;
    subtitle?: string;
    showLegend: boolean;
    showTooltip: boolean;
    showGrid: boolean;
    stacked: boolean;
    animation: boolean;
    colors?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface DimensionItem {
  id: string;
  name: string;
  code?: string;
}

export const VisualizationsApiMock = {
  // Get all visualizations
  getVisualizations: async (params?: { type?: 'dashboard' | 'report' }) => {
    await delay(300);
    const query = params?.type ? { where: { type: params.type } } : {};
    const { items } = db.list<StoredVisualization>('visualizations', {
      ...query,
      sortBy: 'updatedAt',
      sortDir: 'desc',
    });
    return success(items);
  },

  // Get single visualization
  getVisualization: async (id: string) => {
    await delay(200);
    const viz = db.getById<StoredVisualization>('visualizations', id);
    if (!viz) {
      return { status: 404, data: null, message: 'Visualisation non trouvée' };
    }
    return success(viz);
  },

  // Create visualization
  createVisualization: async (viz: Omit<StoredVisualization, 'id' | 'createdAt' | 'updatedAt'>) => {
    await delay(400);
    const newViz = db.create<StoredVisualization>('visualizations', {
      ...viz,
      id: `viz-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return success(newViz, 'Visualisation créée');
  },

  // Update visualization
  updateVisualization: async (id: string, viz: Partial<StoredVisualization>) => {
    await delay(300);
    const updated = db.update<StoredVisualization>('visualizations', id, {
      ...viz,
      updatedAt: new Date().toISOString(),
    });
    return success(updated, 'Visualisation mise à jour');
  },

  // Delete visualization
  deleteVisualization: async (id: string) => {
    await delay(300);
    db.delete('visualizations', id);
    return success(null, 'Visualisation supprimée');
  },

  // Get dimension data (data elements, indicators, periods, org units)
  getDimensionData: async () => {
    await delay(200);
    const dataElements = db.list<DimensionItem>('visualization_data_elements').items;
    const indicators = db.list<DimensionItem>('visualization_indicators').items;
    const periods = db.list<DimensionItem>('visualization_periods').items;
    const orgUnits = db.list<DimensionItem>('visualization_org_units').items;

    return success({
      dataElements,
      indicators,
      periods,
      orgUnits,
    });
  },

  // Get analytics data for a visualization
  getAnalyticsData: async (params: {
    dataElements?: string[];
    indicators?: string[];
    periods?: string[];
    orgUnits?: string[];
  }) => {
    await delay(500);
    // Generate mock analytics data based on params
    const rows: Record<string, unknown>[] = [];
    const dx = [...(params.dataElements || []), ...(params.indicators || [])];
    const pe = params.periods || ['202401', '202402', '202403'];
    const ou = params.orgUnits || ['ou1'];

    for (const period of pe) {
      for (const orgUnit of ou) {
        const row: Record<string, unknown> = {
          period,
          orgUnit,
        };
        for (const dataItem of dx) {
          row[dataItem] = Math.floor(Math.random() * 500) + 50;
        }
        rows.push(row);
      }
    }

    return success({
      headers: ['period', 'orgUnit', ...dx],
      rows,
      metaData: {
        dimensions: { dx, pe, ou },
      },
    });
  },
};

// ============================================
// EXPORT MOCK APIs
// ============================================
export const ApiMock = {
  auth: AuthApiMock,
  reports: ReportsApiMock,
  dashboards: DashboardsApiMock,
  maps: MapsApiMock,
  orgUnits: OrgUnitsApiMock,
  database: DatabaseApiMock,
  dhis2: Dhis2ApiMock,
  sms: SmsApiMock,
  config: ConfigApiMock,
  migrations: MigrationsApiMock,
  survey: SurveyApiMock,
  admin: AdminApiMock,
  organizations: OrganizationsApiMock,
  permissions: PermissionsApiMock,
  visualizations: VisualizationsApiMock,
};

export default ApiMock;
