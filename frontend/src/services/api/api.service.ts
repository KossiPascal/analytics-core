import { axiosInstance } from './axios.instance';
import type { PaginatedResponse, PaginationParams } from '@/types';

// ============================================
// MODE MOCK - Utiliser les données de test locales
// Mettre USE_MOCK_API à false pour utiliser le vrai backend
// ============================================
const USE_MOCK_API = true;

// Import conditionnel des APIs Mock
import {
  AuthApiMock,
  ReportsApiMock,
  DashboardsApiMock,
  MapsApiMock,
  OrgUnitsApiMock,
  DatabaseApiMock,
  Dhis2ApiMock,
  SmsApiMock,
  ConfigApiMock,
  MigrationsApiMock,
  SurveyApiMock,
  AdminApiMock,
  OrganizationsApiMock,
  PermissionsApiMock,
  VisualizationsApiMock,
  type StoredVisualization,
} from './api.mock.service';

// ============================================
// GENERIC API SERVICE CLASS
// ============================================
class ApiService {
  // Generic GET request
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await axiosInstance.get<T>(url, { params });
    return response.data;
  }

  // Generic POST request
  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.post<T>(url, data);
    return response.data;
  }

  // Generic PUT request
  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.put<T>(url, data);
    return response.data;
  }

  // Generic PATCH request
  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data);
    return response.data;
  }

  // Generic DELETE request
  async delete<T>(url: string): Promise<T> {
    const response = await axiosInstance.delete<T>(url);
    return response.data;
  }

  // Paginated GET request
  async getPaginated<T>(
    url: string,
    params?: PaginationParams & Record<string, unknown>
  ): Promise<PaginatedResponse<T>> {
    const response = await axiosInstance.get<PaginatedResponse<T>>(url, { params });
    return response.data;
  }

  // Upload file
  async uploadFile<T>(url: string, file: File, fieldName = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await axiosInstance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Download file
  async downloadFile(url: string, filename: string): Promise<void> {
    const response = await axiosInstance.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const apiService = new ApiService();

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get user ID from localStorage
const getUserId = (): string | null => {
  try {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed?.state?.user?.id || null;
    }
  } catch {
    return null;
  }
  return null;
};

// Add userId to params
const withUserId = <T extends object>(params: T): T & { userId: string | null } => {
  return { ...params, userId: getUserId() };
};

// Generic API response type
interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  message?: string;
}

// ============================================
// AUTH API (Version réelle - backend)
// ============================================
const _RealAuthApi = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/login', {
      credential: credentials.username,
      password: credentials.password,
      loginModeCredents: true,
    });
    return response.data;
  },

  register: async (user: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/register', withUserId(user));
    return response.data;
  },

  createUser: async (user: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/create-user', withUserId(user));
    return response.data;
  },

  refreshToken: async (updateReload = false) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/new-token', withUserId({ updateReload }));
    return response.data;
  },

  getUsers: async () => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/users', withUserId({}));
    return response.data;
  },

  updateProfile: async (params: { id: string; fullname: string; email: string; phone: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/update-user-profile', withUserId(params));
    return response.data;
  },

  updateUser: async (user: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/update-user', withUserId(user));
    return response.data;
  },

  updatePassword: async (params: { id: string; oldPassword: string; newPassword: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/update-user-password', withUserId(params));
    return response.data;
  },

  deleteUser: async (user: Record<string, unknown>, permanentDelete = false) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/delete-user', withUserId({ ...user, permanentDelete }));
    return response.data;
  },

  getRoles: async () => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/roles', withUserId({}));
    return response.data;
  },

  createRole: async (role: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/create-role', withUserId(role));
    return response.data;
  },

  updateRole: async (role: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/update-role', withUserId(role));
    return response.data;
  },

  deleteRole: async (role: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/delete-role', withUserId(role));
    return response.data;
  },

  getAuthorizations: async () => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/authorizations', withUserId({}));
    return response.data;
  },

  getRoutes: async () => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/routes', withUserId({}));
    return response.data;
  },

  apiTokenAction: async (params: { action: string; id?: number; token?: string; isActive?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/api-access-key', withUserId(params));
    return response.data;
  },
};

// ============================================
// REPORTS API (Version réelle - backend)
// ============================================
const _RealReportsApi = {
  getPromotionReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/promotion-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getFamilyPlanningReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/family-planning-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getMorbidityReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/morbidity-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getHouseholdRecapReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/household-recaps-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getPcimneNewbornReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/pcime-newborn-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getChwsRecoReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/chws-reco-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getRecoMegSituationReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/reco-meg-situation-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  // Validation endpoints
  validatePromotionReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/promotion-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidatePromotionReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-promotion-reports-validation', withUserId(params));
    return response.data;
  },

  validateFamilyPlanningReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/family-planning-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidateFamilyPlanningReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-family-planning-reports-validation', withUserId(params));
    return response.data;
  },

  validateMorbidityReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/morbidity-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidateMorbidityReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-morbidity-reports-validation', withUserId(params));
    return response.data;
  },

  validateHouseholdRecapReports: async (params: { months: string[]; year: number; recos: string[]; dataIds: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/household-recaps-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidateHouseholdRecapReports: async (params: { months: string[]; year: number; recos: string[]; dataIds: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-household-recaps-reports-validation', withUserId(params));
    return response.data;
  },

  validatePcimneNewbornReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/pcime-newborn-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidatePcimneNewbornReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-pcime-newborn-reports-validation', withUserId(params));
    return response.data;
  },

  validateChwsRecoReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/chws-reco-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidateChwsRecoReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-chws-reco-reports-validation', withUserId(params));
    return response.data;
  },

  validateRecoMegSituationReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/reco-meg-situation-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidateRecoMegSituationReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-reco-meg-situation-reports-validation', withUserId(params));
    return response.data;
  },
};

// ============================================
// DASHBOARDS API (Version réelle - backend)
// ============================================
const _RealDashboardsApi = {
  getRecoVaccinationNotDone: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/reco-vaccination-not-done-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getRecoVaccinationPartialDone: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/reco-vaccination-partial-done-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getRecoVaccinationAllDone: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/reco-vaccination-all-done-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getRecoPerformance: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/reco-performance-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getActiveReco: async (params: { year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/active-reco-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getRecoTasksState: async (params: { start_date: string; end_date: string; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/reco-tasks-state-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },
};

// ============================================
// MAPS API (Version réelle - backend)
// ============================================
const _RealMapsApi = {
  getRecoDataMaps: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/maps/reco-data-maps', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },
};

// ============================================
// ORG UNITS API (Version réelle - backend)
// ============================================
const _RealOrgUnitsApi = {
  getCountries: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/countries', withUserId(params || {}));
    return response.data;
  },

  getRegions: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/regions', withUserId(params || {}));
    return response.data;
  },

  getPrefectures: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/prefectures', withUserId(params || {}));
    return response.data;
  },

  getCommunes: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/communes', withUserId(params || {}));
    return response.data;
  },

  getHospitals: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/hospitals', withUserId(params || {}));
    return response.data;
  },

  getDistrictQuartiers: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/district-quartiers', withUserId(params || {}));
    return response.data;
  },

  getVillageSecteurs: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/village-secteurs', withUserId(params || {}));
    return response.data;
  },

  getFamilies: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/families', withUserId(params || {}));
    return response.data;
  },

  getChws: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/chws', withUserId(params || {}));
    return response.data;
  },

  getRecos: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/recos', withUserId(params || {}));
    return response.data;
  },

  getPatients: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/patients', withUserId(params || {}));
    return response.data;
  },
};

// ============================================
// DATABASE API (Version réelle - backend)
// ============================================
const _RealDatabaseApi = {
  getDataToDeleteFromCouchDb: async (params: { cible: string[]; start_date: string; end_date: string; type: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/database/couchdb/list-data-to-delete', withUserId(params));
    return response.data;
  },

  deleteDataFromCouchDb: async (data: { _deleted: boolean; _id: string; _rev: string; _table: string }[], typeOfData: string) => {
    const response = await axiosInstance.post<ApiResponse>('/database/couchdb/detele-data', withUserId({ data_to_delete: data, type: typeOfData }));
    return response.data;
  },

  updateUserFacilityContactPlace: async (params: { contact: string; parent: string; new_parent: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/database/couchdb/update-user-facility-contact-place', withUserId(params));
    return response.data;
  },

  getDatabaseEntities: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/postgres/entities', withUserId({}));
    return response.data;
  },

  truncateDatabase: async (params: { procide: boolean; entities: { name: string; table: string }[]; action: 'TRUNCATE' | 'DROP' }) => {
    const response = await axiosInstance.post<ApiResponse>('/database/postgres/truncate', withUserId(params));
    return response.data;
  },
};

// ============================================
// DHIS2 API (Version réelle - backend)
// ============================================
interface Dhis2Params {
  username: string;
  password: string;
  data: unknown;
  period: string;
  months: string[];
  year: number;
  recos: string[];
  orgunit: string;
}

const _RealDhis2Api = {
  sendChwsRecoReports: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/monthly-activity', withUserId(params));
    return response.data;
  },

  sendFamilyPlanningActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/family-planning-activity', withUserId(params));
    return response.data;
  },

  sendHouseholdActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/household-activity', withUserId(params));
    return response.data;
  },

  sendMorbidityActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/morbidity-activity', withUserId(params));
    return response.data;
  },

  sendPcimneNewbornActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/pcimne-newborn-activity', withUserId(params));
    return response.data;
  },

  sendPromotionActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/promotional-activity', withUserId(params));
    return response.data;
  },

  sendRecoMegSituationActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/reco-meg-situation-activity', withUserId(params));
    return response.data;
  },
};

// ============================================
// SMS API (Version réelle - backend)
// ============================================
const _RealSmsApi = {
  sendSms: async (params: { phoneNumbers: string[]; message: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/sms/send-sms', withUserId(params));
    return response.data;
  },

  sendCustomSms: async (params: { phone: string; message: string }[]) => {
    const response = await axiosInstance.post<ApiResponse>('/sms/send-coustom-sms', withUserId({ phoneNumbersMessage: params }));
    return response.data;
  },
};

// ============================================
// CONFIG API (Version réelle - backend)
// ============================================
const _RealConfigApi = {
  getConfigs: async () => {
    const response = await axiosInstance.post<ApiResponse>('/configs', withUserId({ noLogData: true }));
    return response.data;
  },

  getAppVersion: async () => {
    const response = await axiosInstance.post<ApiResponse>('/configs/version', withUserId({ noLogData: true }));
    return response.data;
  },
};

// ============================================
// SQL MIGRATIONS API (Version réelle - backend)
// ============================================
const _RealMigrationsApi = {
  getAllMigrations: async () => {
    const response = await axiosInstance.post<ApiResponse>('/sql/getall', withUserId({}));
    return response.data;
  },

  runAllMigrations: async (runAllMigrations = true) => {
    const response = await axiosInstance.post<ApiResponse>('/sql/runall', withUserId({ runAllMigrations }));
    return response.data;
  },

  getOneMigration: async (migrationName: string) => {
    const response = await axiosInstance.post<ApiResponse>('/sql/getone', withUserId({ migrationName }));
    return response.data;
  },

  runOneMigration: async (migrationName: string, runOneMigrations = true) => {
    const response = await axiosInstance.post<ApiResponse>('/sql/runone', withUserId({ migrationName, runOneMigrations }));
    return response.data;
  },
};

// ============================================
// SURVEY API (Version réelle - backend)
// ============================================
const _RealSurveyApi = {
  saveSurvey: async (survey: unknown) => {
    const response = await axiosInstance.post<ApiResponse>('/survey/save', { survey, userId: null });
    return response.data;
  },

  getAverages: async () => {
    const response = await axiosInstance.post<ApiResponse>('/survey/get-averages', { userId: null });
    return response.data;
  },
};

// ============================================
// ADMIN API (Version réelle - backend)
// ============================================
const _RealAdminApi = {
  // API Token Management
  getApiTokens: async () => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/api-access-key', withUserId({ action: 'list' }));
    return response.data;
  },

  manageApiToken: async (params: { action: string; id?: string; token?: string; isActive?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/api-access-key', withUserId(params));
    return response.data;
  },

  // Database Management
  syncDatabase: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/sync', withUserId({}));
    return response.data;
  },

  testDatabaseConnection: async (params: {
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
    const response = await axiosInstance.post<ApiResponse>('/database/connection/test', withUserId(params));
    return response.data;
  },

  rebuildIndexes: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/rebuild-indexes', withUserId({}));
    return response.data;
  },

  vacuumDatabase: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/vacuum', withUserId({}));
    return response.data;
  },

  checkDatabaseHealth: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/health', withUserId({}));
    return response.data;
  },

  // CouchDB Data Management
  getDataToDeleteFromCouchDb: async (params: { cible: string[]; start_date: string; end_date: string; type: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/database/couchdb/list-data-to-delete', withUserId(params));
    return response.data;
  },

  deleteDataFromCouchDb: async (data: { _deleted: boolean; _id: string; _rev: string; _table: string }[], typeOfData: string) => {
    const response = await axiosInstance.post<ApiResponse>('/database/couchdb/detele-data', withUserId({ data_to_delete: data, type: typeOfData }));
    return response.data;
  },

  // Database Entities Management
  getDatabaseEntities: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/postgres/entities', withUserId({}));
    return response.data;
  },

  truncateDatabase: async (params: { procide: boolean; entities: { name: string; table: string }[]; action: 'TRUNCATE' | 'DROP' }) => {
    const response = await axiosInstance.post<ApiResponse>('/database/postgres/truncate', withUserId(params));
    return response.data;
  },

  // PDF Generator
  generatePdf: async (params: { templateId: string; config: Record<string, unknown> }) => {
    const response = await axiosInstance.post<ApiResponse>('/admin/generate-pdf', withUserId(params));
    return response.data;
  },

  // Signature Management
  getSignatures: async () => {
    const response = await axiosInstance.post<ApiResponse>('/admin/signatures', withUserId({ action: 'list' }));
    return response.data;
  },

  saveSignature: async (params: { name: string; dataUrl: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/admin/signatures', withUserId({ action: 'create', ...params }));
    return response.data;
  },

  deleteSignature: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse>('/admin/signatures', withUserId({ action: 'delete', id }));
    return response.data;
  },
};

// ============================================
// ORGANIZATIONS API (Version réelle - backend)
// ============================================
const _RealOrganizationsApi = {
  getOrganizations: async () => {
    const response = await axiosInstance.post<ApiResponse>('/organizations/list', withUserId({}));
    return response.data;
  },

  createOrganization: async (org: { name: string; description?: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/organizations/create', withUserId(org));
    return response.data;
  },

  updateOrganization: async (org: { id: string; name?: string; description?: string; isActive?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/organizations/update', withUserId(org));
    return response.data;
  },

  deleteOrganization: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse>('/organizations/delete', withUserId({ id }));
    return response.data;
  },
};

// ============================================
// PERMISSIONS API (Version réelle - backend)
// ============================================
const _RealPermissionsApi = {
  getPermissions: async () => {
    const response = await axiosInstance.post<ApiResponse>('/permissions/list', withUserId({}));
    return response.data;
  },

  createPermission: async (perm: { name: string; description?: string; canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/permissions/create', withUserId(perm));
    return response.data;
  },

  updatePermission: async (perm: { id: string; name?: string; description?: string; canCreate?: boolean; canRead?: boolean; canUpdate?: boolean; canDelete?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/permissions/update', withUserId(perm));
    return response.data;
  },

  deletePermission: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse>('/permissions/delete', withUserId({ id }));
    return response.data;
  },
};

// ============================================
// VISUALIZATIONS API (Version réelle - backend)
// ============================================
const _RealVisualizationsApi = {
  getVisualizations: async (params?: { type?: 'dashboard' | 'report' }) => {
    const response = await axiosInstance.post<ApiResponse>('/visualizations/list', withUserId(params || {}));
    return response.data;
  },

  getVisualization: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse>('/visualizations/get', withUserId({ id }));
    return response.data;
  },

  createVisualization: async (viz: Omit<StoredVisualization, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await axiosInstance.post<ApiResponse>('/visualizations/create', withUserId(viz));
    return response.data;
  },

  updateVisualization: async (id: string, viz: Partial<StoredVisualization>) => {
    const response = await axiosInstance.post<ApiResponse>('/visualizations/update', withUserId({ id, ...viz }));
    return response.data;
  },

  deleteVisualization: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse>('/visualizations/delete', withUserId({ id }));
    return response.data;
  },

  getDimensionData: async () => {
    const response = await axiosInstance.post<ApiResponse>('/visualizations/dimensions', withUserId({}));
    return response.data;
  },

  getAnalyticsData: async (params: {
    dataElements?: string[];
    indicators?: string[];
    periods?: string[];
    orgUnits?: string[];
  }) => {
    const response = await axiosInstance.post<ApiResponse>('/visualizations/analytics', withUserId(params));
    return response.data;
  },
};

// ============================================
// EXPORT ALL APIs - Utilise Mock si activé
// ============================================

// Export des APIs conditionnelles (mock ou réel)
export const AuthApi = USE_MOCK_API ? AuthApiMock : _RealAuthApi;
export const ReportsApi = USE_MOCK_API ? ReportsApiMock : _RealReportsApi;
export const DashboardsApi = USE_MOCK_API ? DashboardsApiMock : _RealDashboardsApi;
export const MapsApi = USE_MOCK_API ? MapsApiMock : _RealMapsApi;
export const OrgUnitsApi = USE_MOCK_API ? OrgUnitsApiMock : _RealOrgUnitsApi;
export const DatabaseApi = USE_MOCK_API ? DatabaseApiMock : _RealDatabaseApi;
export const Dhis2Api = USE_MOCK_API ? Dhis2ApiMock : _RealDhis2Api;
export const SmsApi = USE_MOCK_API ? SmsApiMock : _RealSmsApi;
export const ConfigApi = USE_MOCK_API ? ConfigApiMock : _RealConfigApi;
export const MigrationsApi = USE_MOCK_API ? MigrationsApiMock : _RealMigrationsApi;
export const SurveyApi = USE_MOCK_API ? SurveyApiMock : _RealSurveyApi;
export const AdminApi = USE_MOCK_API ? AdminApiMock : _RealAdminApi;
export const OrganizationsApi = USE_MOCK_API ? OrganizationsApiMock : _RealOrganizationsApi;
export const PermissionsApi = USE_MOCK_API ? PermissionsApiMock : _RealPermissionsApi;
export const VisualizationsApi = USE_MOCK_API ? VisualizationsApiMock : _RealVisualizationsApi;

export const Api = {
  auth: AuthApi,
  reports: ReportsApi,
  dashboards: DashboardsApi,
  maps: MapsApi,
  orgUnits: OrgUnitsApi,
  database: DatabaseApi,
  dhis2: Dhis2Api,
  sms: SmsApi,
  config: ConfigApi,
  migrations: MigrationsApi,
  survey: SurveyApi,
  admin: AdminApi,
  organizations: OrganizationsApi,
  permissions: PermissionsApi,
  visualizations: VisualizationsApi,
};

export default Api;
