/* src/utils/TestData.ts - Données de test pour le frontend */

import { Database } from './Database';
import type {
  CountryMap,
  RegionsMap,
  PrefecturesMap,
  CommunesMap,
  HospitalsMap,
  DistrictQuartiersMap,
  VillageSecteursMap,
  ChwsMap,
  RecosMap,
  LocationInfo,
} from '@/types/org-unit.types';
import type {
  RecoPerformanceDashboard,
  RecoPerformanceDashboardDbOutput,
  RecoVaccinationDashboard,
  RecoVaccinationDashboardDbOutput,
  ActiveRecoDashboard,
  ActiveRecoRecord,
  ActiveRecoUtils,
  RecoTasksStateDashboard,
  RecoTasksStateFamilies,
} from '@/types/dashboard.types';
import type {
  FamilyPlanningReport,
  MorbidityReport,
  PromotionReport,
  HouseholdRecapReport,
  PcimneNewbornReport,
  ChwsRecoReport,
  RecoMegSituationReport,
  FP_Utils,
  MorbidityUtils,
  DomainsThemesUtils,
} from '@/types/reports.types';
import type { Roles, Routes } from '@/types/auth.types';

// ============================================================================
// DATABASE INSTANCE
// ============================================================================
export const db = new Database({ namespace: 'kendeya_test', integrityCheck: true });

// ============================================================================
// ORG UNITS DATA - Guinée
// ============================================================================

// Pays
export const COUNTRIES: CountryMap[] = [
  { id: 'country-gn', external_id: 'GN001', name: 'Guinée' },
];

// Régions
export const REGIONS: RegionsMap[] = [
  { id: 'region-conakry', external_id: 'RG001', name: 'Conakry', country_id: 'country-gn' },
  { id: 'region-kindia', external_id: 'RG002', name: 'Kindia', country_id: 'country-gn' },
  { id: 'region-boke', external_id: 'RG003', name: 'Boké', country_id: 'country-gn' },
  { id: 'region-mamou', external_id: 'RG004', name: 'Mamou', country_id: 'country-gn' },
];

// Préfectures
export const PREFECTURES: PrefecturesMap[] = [
  { id: 'pref-ratoma', external_id: 'PF001', name: 'Ratoma', country_id: 'country-gn', region_id: 'region-conakry' },
  { id: 'pref-matam', external_id: 'PF002', name: 'Matam', country_id: 'country-gn', region_id: 'region-conakry' },
  { id: 'pref-dixinn', external_id: 'PF003', name: 'Dixinn', country_id: 'country-gn', region_id: 'region-conakry' },
  { id: 'pref-kindia', external_id: 'PF004', name: 'Kindia', country_id: 'country-gn', region_id: 'region-kindia' },
  { id: 'pref-coyah', external_id: 'PF005', name: 'Coyah', country_id: 'country-gn', region_id: 'region-kindia' },
];

// Communes
export const COMMUNES: CommunesMap[] = [
  { id: 'com-ratoma', external_id: 'CM001', name: 'Ratoma Centre', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma' },
  { id: 'com-nongo', external_id: 'CM002', name: 'Nongo', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma' },
  { id: 'com-matam', external_id: 'CM003', name: 'Matam Centre', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-matam' },
  { id: 'com-kindia', external_id: 'CM004', name: 'Kindia Urbain', country_id: 'country-gn', region_id: 'region-kindia', prefecture_id: 'pref-kindia' },
];

// Hôpitaux/Centres de santé
export const HOSPITALS: HospitalsMap[] = [
  { id: 'hosp-ratoma', external_id: 'HP001', name: 'CS Ratoma', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma' },
  { id: 'hosp-nongo', external_id: 'HP002', name: 'CS Nongo', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-nongo' },
  { id: 'hosp-matam', external_id: 'HP003', name: 'CS Matam', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-matam', commune_id: 'com-matam' },
  { id: 'hosp-kindia', external_id: 'HP004', name: 'Hôpital Régional Kindia', country_id: 'country-gn', region_id: 'region-kindia', prefecture_id: 'pref-kindia', commune_id: 'com-kindia' },
];

// Districts/Quartiers
export const DISTRICT_QUARTIERS: DistrictQuartiersMap[] = [
  { id: 'dq-koloma', external_id: 'DQ001', name: 'Koloma', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma', hospital_id: 'hosp-ratoma' },
  { id: 'dq-kipé', external_id: 'DQ002', name: 'Kipé', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma', hospital_id: 'hosp-ratoma' },
  { id: 'dq-nongo', external_id: 'DQ003', name: 'Nongo Taady', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-nongo', hospital_id: 'hosp-nongo' },
  { id: 'dq-matam-port', external_id: 'DQ004', name: 'Matam Port', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-matam', commune_id: 'com-matam', hospital_id: 'hosp-matam' },
];

// Villages/Secteurs
export const VILLAGE_SECTEURS: VillageSecteursMap[] = [
  { id: 'vs-koloma-1', external_id: 'VS001', name: 'Koloma Secteur 1', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma', hospital_id: 'hosp-ratoma', district_quartier_id: 'dq-koloma' },
  { id: 'vs-koloma-2', external_id: 'VS002', name: 'Koloma Secteur 2', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma', hospital_id: 'hosp-ratoma', district_quartier_id: 'dq-koloma' },
  { id: 'vs-kipé-1', external_id: 'VS003', name: 'Kipé Secteur 1', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma', hospital_id: 'hosp-ratoma', district_quartier_id: 'dq-kipé' },
  { id: 'vs-nongo-1', external_id: 'VS004', name: 'Nongo Secteur 1', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-nongo', hospital_id: 'hosp-nongo', district_quartier_id: 'dq-nongo' },
];

// ============================================================================
// VISUALIZATION DIMENSIONS
// ============================================================================
export interface VisualizationDimensionItem {
  id: string;
  name: string;
  code?: string;
}

export const VISUALIZATION_DATA_ELEMENTS: VisualizationDimensionItem[] = [
  { id: 'de1', name: 'Consultations totales', code: 'CONS_TOTAL' },
  { id: 'de2', name: 'Consultations prénatales', code: 'CPN' },
  { id: 'de3', name: 'Vaccinations complètes', code: 'VAC_COMP' },
  { id: 'de4', name: 'Naissances assistées', code: 'NAIS_ASST' },
  { id: 'de5', name: 'Cas de paludisme', code: 'PALU_CAS' },
  { id: 'de6', name: 'Cas de diarrhée', code: 'DIAR_CAS' },
  { id: 'de7', name: 'Enfants malnutris', code: 'MALNUT' },
  { id: 'de8', name: 'Décès maternels', code: 'DEC_MAT' },
  { id: 'de9', name: 'Décès infantiles', code: 'DEC_INF' },
  { id: 'de10', name: 'Accouchements', code: 'ACCOU' },
];

export const VISUALIZATION_INDICATORS: VisualizationDimensionItem[] = [
  { id: 'ind1', name: 'Taux de couverture vaccinale', code: 'TX_VAC' },
  { id: 'ind2', name: 'Taux de consultation prénatale', code: 'TX_CPN' },
  { id: 'ind3', name: 'Taux de mortalité infantile', code: 'TX_MORT_INF' },
  { id: 'ind4', name: 'Taux de mortalité maternelle', code: 'TX_MORT_MAT' },
  { id: 'ind5', name: 'Ratio personnel/population', code: 'RATIO_PERS' },
];

export const VISUALIZATION_PERIODS: VisualizationDimensionItem[] = [
  { id: 'THIS_MONTH', name: 'Ce mois-ci' },
  { id: 'LAST_MONTH', name: 'Mois dernier' },
  { id: 'LAST_3_MONTHS', name: '3 derniers mois' },
  { id: 'LAST_6_MONTHS', name: '6 derniers mois' },
  { id: 'THIS_YEAR', name: 'Cette année' },
  { id: 'LAST_YEAR', name: 'Année dernière' },
  { id: 'LAST_5_YEARS', name: '5 dernières années' },
  { id: '2024', name: '2024' },
  { id: '2023', name: '2023' },
  { id: '2022', name: '2022' },
  { id: '202401', name: 'Janvier 2024' },
  { id: '202402', name: 'Février 2024' },
  { id: '202403', name: 'Mars 2024' },
];

export const VISUALIZATION_ORG_UNITS: VisualizationDimensionItem[] = [
  { id: 'ou1', name: 'Région de Conakry', code: 'CKY' },
  { id: 'ou2', name: 'Région de Kindia', code: 'KND' },
  { id: 'ou3', name: 'Région de Boké', code: 'BOK' },
  { id: 'ou4', name: 'Région de Mamou', code: 'MAM' },
  { id: 'ou5', name: 'Région de Labé', code: 'LAB' },
  { id: 'ou6', name: 'Région de Faranah', code: 'FAR' },
  { id: 'ou7', name: 'Région de Kankan', code: 'KAN' },
  { id: 'ou8', name: 'Région de Nzérékoré', code: 'NZR' },
];

// CHWs (Agents de Santé Communautaire)
export const CHWS: ChwsMap[] = [
  { id: 'chw-001', external_id: 'CHW001', name: 'Mamadou Diallo', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma', hospital_id: 'hosp-ratoma', district_quartier_id: 'dq-koloma' },
  { id: 'chw-002', external_id: 'CHW002', name: 'Fatoumata Barry', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma', hospital_id: 'hosp-ratoma', district_quartier_id: 'dq-kipé' },
  { id: 'chw-003', external_id: 'CHW003', name: 'Ibrahima Sow', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-nongo', hospital_id: 'hosp-nongo', district_quartier_id: 'dq-nongo' },
];

// RECOs (Relais Communautaires)
export const RECOS: RecosMap[] = [
  { id: 'reco-001', external_id: 'RECO001', name: 'Aissatou Bah', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma', hospital_id: 'hosp-ratoma', district_quartier_id: 'dq-koloma', village_secteur_id: 'vs-koloma-1' },
  { id: 'reco-002', external_id: 'RECO002', name: 'Oumar Camara', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma', hospital_id: 'hosp-ratoma', district_quartier_id: 'dq-koloma', village_secteur_id: 'vs-koloma-2' },
  { id: 'reco-003', external_id: 'RECO003', name: 'Mariama Sylla', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-ratoma', hospital_id: 'hosp-ratoma', district_quartier_id: 'dq-kipé', village_secteur_id: 'vs-kipé-1' },
  { id: 'reco-004', external_id: 'RECO004', name: 'Amadou Baldé', country_id: 'country-gn', region_id: 'region-conakry', prefecture_id: 'pref-ratoma', commune_id: 'com-nongo', hospital_id: 'hosp-nongo', district_quartier_id: 'dq-nongo', village_secteur_id: 'vs-nongo-1' },
];

// Familles
export interface Family {
  id: string;
  external_id: string;
  code: string;
  name: string;
  fullname: string;
  phone: string;
  reco_id: string;
  village_secteur_id: string;
}

export const FAMILIES: Family[] = [
  { id: 'fam-001', external_id: 'FAM001', code: 'FAM-001', name: 'Diallo', fullname: 'Famille Diallo', phone: '+224 620 11 11 11', reco_id: 'reco-001', village_secteur_id: 'vs-koloma-1' },
  { id: 'fam-002', external_id: 'FAM002', code: 'FAM-002', name: 'Barry', fullname: 'Famille Barry', phone: '+224 620 22 22 22', reco_id: 'reco-001', village_secteur_id: 'vs-koloma-1' },
  { id: 'fam-003', external_id: 'FAM003', code: 'FAM-003', name: 'Camara', fullname: 'Famille Camara', phone: '+224 620 33 33 33', reco_id: 'reco-002', village_secteur_id: 'vs-koloma-2' },
  { id: 'fam-004', external_id: 'FAM004', code: 'FAM-004', name: 'Sylla', fullname: 'Famille Sylla', phone: '+224 620 44 44 44', reco_id: 'reco-003', village_secteur_id: 'vs-kipé-1' },
  { id: 'fam-005', external_id: 'FAM005', code: 'FAM-005', name: 'Baldé', fullname: 'Famille Baldé', phone: '+224 620 55 55 55', reco_id: 'reco-004', village_secteur_id: 'vs-nongo-1' },
];

// Patients
export interface Patient {
  id: string;
  external_id: string;
  code: string;
  name: string;
  sex: 'M' | 'F';
  birth_date: string;
  family_id: string;
}

export const PATIENTS: Patient[] = [
  { id: 'pat-001', external_id: 'PAT001', code: 'PAT-001', name: 'Mamadou Diallo Jr', sex: 'M', birth_date: '2023-06-15', family_id: 'fam-001' },
  { id: 'pat-002', external_id: 'PAT002', code: 'PAT-002', name: 'Aissatou Diallo', sex: 'F', birth_date: '2024-01-20', family_id: 'fam-001' },
  { id: 'pat-003', external_id: 'PAT003', code: 'PAT-003', name: 'Ibrahim Barry', sex: 'M', birth_date: '2022-08-10', family_id: 'fam-002' },
  { id: 'pat-004', external_id: 'PAT004', code: 'PAT-004', name: 'Fatoumata Barry', sex: 'F', birth_date: '2023-12-05', family_id: 'fam-002' },
  { id: 'pat-005', external_id: 'PAT005', code: 'PAT-005', name: 'Oumar Camara Jr', sex: 'M', birth_date: '2024-03-18', family_id: 'fam-003' },
  { id: 'pat-006', external_id: 'PAT006', code: 'PAT-006', name: 'Mariama Sylla Jr', sex: 'F', birth_date: '2023-09-25', family_id: 'fam-004' },
  { id: 'pat-007', external_id: 'PAT007', code: 'PAT-007', name: 'Amadou Baldé Jr', sex: 'M', birth_date: '2022-11-30', family_id: 'fam-005' },
];

// ============================================================================
// ROLES & AUTHORIZATIONS
// ============================================================================

export const AUTHORIZATIONS: string[] = [
  'admin',
  'user',
  'view_reports',
  'validate_reports',
  'send_to_dhis2',
  'view_dashboards',
  'manage_users',
  'manage_roles',
  'view_maps',
  'download_data',
];

export const ROUTES: Routes[] = [
  { path: '/reports', label: 'Rapports', authorizations: ['view_reports'] },
  { path: '/dashboards', label: 'Tableaux de bord', authorizations: ['view_dashboards'] },
  { path: '/maps', label: 'Cartes', authorizations: ['view_maps'] },
  { path: '/users', label: 'Utilisateurs', authorizations: ['manage_users'] },
  { path: '/roles', label: 'Rôles', authorizations: ['manage_roles'] },
  { path: '/admin', label: 'Administration', authorizations: ['admin'] },
];

export const ROLES: Roles[] = [
  {
    id: 1,
    name: 'Administrateur',
    authorizations: AUTHORIZATIONS,
    routes: ROUTES,
    isDeleted: false,
    deletedAt: null,
  },
  {
    id: 2,
    name: 'Superviseur',
    authorizations: ['user', 'view_reports', 'validate_reports', 'view_dashboards', 'view_maps'],
    routes: ROUTES.filter(r => ['/reports', '/dashboards', '/maps'].includes(r.path)),
    isDeleted: false,
    deletedAt: null,
  },
  {
    id: 3,
    name: 'Agent de Santé',
    authorizations: ['user', 'view_reports', 'view_dashboards'],
    routes: ROUTES.filter(r => ['/reports', '/dashboards'].includes(r.path)),
    isDeleted: false,
    deletedAt: null,
  },
];

// ============================================================================
// ORGANIZATIONS
// ============================================================================
export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export const ORGANIZATIONS: Organization[] = [
  {
    id: 'org-1',
    name: 'Kendeya Analytics',
    description: 'Organisation principale',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'org-2',
    name: 'Ministère de la Santé',
    description: 'Ministère de la Santé de Guinée',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
];

// ============================================================================
// PERMISSIONS
// ============================================================================
export interface Permission {
  id: string;
  name: string;
  description?: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PERMISSIONS: Permission[] = [
  {
    id: 'perm-1',
    name: 'manage_users',
    description: 'Gérer les utilisateurs',
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'perm-2',
    name: 'view_reports',
    description: 'Voir les rapports',
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'perm-3',
    name: 'validate_data',
    description: 'Valider les données',
    canCreate: false,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// API TOKENS
// ============================================================================
export interface ApiToken {
  id: string;
  token: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getLocationInfo(recoId: string): LocationInfo {
  const reco = RECOS.find(r => r.id === recoId);
  if (!reco) {
    return {
      country: { id: 'country-gn', name: 'Guinée' },
      region: { id: 'region-conakry', name: 'Conakry' },
      prefecture: { id: 'pref-ratoma', name: 'Ratoma' },
      commune: { id: 'com-ratoma', name: 'Ratoma Centre' },
      hospital: { id: 'hosp-ratoma', name: 'CS Ratoma' },
      district_quartier: { id: 'dq-koloma', name: 'Koloma' },
      village_secteur: { id: 'vs-koloma-1', name: 'Koloma Secteur 1' },
      reco: { id: 'reco-001', name: 'Aissatou Bah', phone: '+224 620 00 00 01' },
    };
  }

  const vs = VILLAGE_SECTEURS.find(v => v.id === reco.village_secteur_id)!;
  const dq = DISTRICT_QUARTIERS.find(d => d.id === reco.district_quartier_id)!;
  const hosp = HOSPITALS.find(h => h.id === reco.hospital_id)!;
  const commune = COMMUNES.find(c => c.id === reco.commune_id)!;
  const pref = PREFECTURES.find(p => p.id === reco.prefecture_id)!;
  const region = REGIONS.find(r => r.id === reco.region_id)!;
  const country = COUNTRIES.find(c => c.id === reco.country_id)!;

  return {
    country: { id: country.id, name: country.name },
    region: { id: region.id, name: region.name },
    prefecture: { id: pref.id, name: pref.name },
    commune: { id: commune.id, name: commune.name },
    hospital: { id: hosp.id, name: hosp.name },
    district_quartier: { id: dq.id, name: dq.name },
    village_secteur: { id: vs.id, name: vs.name },
    reco: { id: reco.id, name: reco.name, phone: '+224 620 00 00 01' },
  };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================================
// DASHBOARD DATA GENERATORS
// ============================================================================

function generatePerformanceData(year: number, month: string, recoId: string): RecoPerformanceDashboardDbOutput {
  const location = getLocationInfo(recoId);
  return {
    id: `perf-${recoId}-${year}-${month}`,
    year,
    month,
    ...location,
    family_count: randomInt(20, 50),
    patient_count: randomInt(80, 200),
    referal_data_count: randomInt(5, 20),
    delivery_data_count: randomInt(2, 10),
    events_data_count: randomInt(10, 30),
    promotional_data_count: randomInt(15, 40),
    death_data_count: randomInt(0, 3),
    all_actions_count: randomInt(100, 300),
    adult_data_count: { consultation: randomInt(10, 30), followup: randomInt(5, 15), total: randomInt(15, 45) },
    family_planning_data_count: { consultation: randomInt(5, 15), followup: randomInt(3, 10), total: randomInt(8, 25) },
    newborn_data_count: { consultation: randomInt(8, 20), followup: randomInt(4, 12), total: randomInt(12, 32) },
    pcimne_data_count: { consultation: randomInt(15, 40), followup: randomInt(8, 20), total: randomInt(23, 60) },
    pregnant_data_count: { consultation: randomInt(6, 18), followup: randomInt(3, 10), total: randomInt(9, 28) },
    all_consultation_followup_count: { consultation: randomInt(50, 120), followup: randomInt(25, 60), total: randomInt(75, 180) },
    is_validate: Math.random() > 0.3,
    already_on_dhis2: Math.random() > 0.5,
  };
}

export function generateRecoPerformanceDashboard(year: number, months: string[]): RecoPerformanceDashboard {
  const performances: RecoPerformanceDashboardDbOutput[] = [];

  for (const month of months) {
    for (const reco of RECOS) {
      performances.push(generatePerformanceData(year, month, reco.id));
    }
  }

  const total = {
    family_count: performances.reduce((sum, p) => sum + p.family_count, 0),
    patient_count: performances.reduce((sum, p) => sum + p.patient_count, 0),
    adult_data_count: {
      consultation: performances.reduce((sum, p) => sum + p.adult_data_count.consultation, 0),
      followup: performances.reduce((sum, p) => sum + p.adult_data_count.followup, 0),
      total: performances.reduce((sum, p) => sum + p.adult_data_count.total, 0),
    },
    family_planning_data_count: {
      consultation: performances.reduce((sum, p) => sum + p.family_planning_data_count.consultation, 0),
      followup: performances.reduce((sum, p) => sum + p.family_planning_data_count.followup, 0),
      total: performances.reduce((sum, p) => sum + p.family_planning_data_count.total, 0),
    },
    newborn_data_count: {
      consultation: performances.reduce((sum, p) => sum + p.newborn_data_count.consultation, 0),
      followup: performances.reduce((sum, p) => sum + p.newborn_data_count.followup, 0),
      total: performances.reduce((sum, p) => sum + p.newborn_data_count.total, 0),
    },
    pcimne_data_count: {
      consultation: performances.reduce((sum, p) => sum + p.pcimne_data_count.consultation, 0),
      followup: performances.reduce((sum, p) => sum + p.pcimne_data_count.followup, 0),
      total: performances.reduce((sum, p) => sum + p.pcimne_data_count.total, 0),
    },
    pregnant_data_count: {
      consultation: performances.reduce((sum, p) => sum + p.pregnant_data_count.consultation, 0),
      followup: performances.reduce((sum, p) => sum + p.pregnant_data_count.followup, 0),
      total: performances.reduce((sum, p) => sum + p.pregnant_data_count.total, 0),
    },
    all_consultation_followup_count: {
      consultation: performances.reduce((sum, p) => sum + p.all_consultation_followup_count.consultation, 0),
      followup: performances.reduce((sum, p) => sum + p.all_consultation_followup_count.followup, 0),
      total: performances.reduce((sum, p) => sum + p.all_consultation_followup_count.total, 0),
    },
    referal_data_count: performances.reduce((sum, p) => sum + p.referal_data_count, 0),
    delivery_data_count: performances.reduce((sum, p) => sum + p.delivery_data_count, 0),
    events_data_count: performances.reduce((sum, p) => sum + p.events_data_count, 0),
    promotional_data_count: performances.reduce((sum, p) => sum + p.promotional_data_count, 0),
    death_data_count: performances.reduce((sum, p) => sum + p.death_data_count, 0),
    all_actions_count: performances.reduce((sum, p) => sum + p.all_actions_count, 0),
  };

  return {
    performances,
    yearDatas: {},
    total,
  };
}

function generateVaccinationChild(family: Family, patient: Patient): RecoVaccinationDashboard {
  const birthDate = new Date(patient.birth_date);
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const ageInMonths = Math.floor(ageInDays / 30);
  const ageInYears = Math.floor(ageInDays / 365);

  const hasVaccine = () => Math.random() > 0.3;
  const vaccineDate = (done: boolean) => done ? new Date(Date.now() - randomInt(30, 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null;

  const bcg = hasVaccine();
  const vpo0 = hasVaccine();
  const penta1 = hasVaccine();
  const vpo1 = hasVaccine();
  const penta2 = penta1 && hasVaccine();
  const vpo2 = vpo1 && hasVaccine();
  const penta3 = penta2 && hasVaccine();
  const vpo3 = vpo2 && hasVaccine();
  const vpi1 = hasVaccine();
  const var1 = hasVaccine();
  const vaa = hasVaccine();
  const vpi2 = vpi1 && hasVaccine();
  const menA = hasVaccine();
  const var2 = var1 && hasVaccine();

  return {
    family_id: family.id,
    family_name: family.name,
    family_fullname: family.fullname,
    family_code: family.code,
    child_id: patient.id,
    child_name: patient.name,
    child_code: patient.code,
    child_sex: patient.sex,
    reco_phone: '+224 620 00 00 01',
    parent_phone: family.phone,
    neighbor_phone: '+224 620 99 99 99',
    child_age_in_days: ageInDays,
    child_age_in_months: ageInMonths,
    child_age_in_years: ageInYears,
    child_age_str: ageInMonths < 12 ? `${ageInMonths} mois` : `${ageInYears} an(s)`,
    vaccine_BCG: bcg,
    vaccine_VPO_0: vpo0,
    vaccine_PENTA_1: penta1,
    vaccine_VPO_1: vpo1,
    vaccine_PENTA_2: penta2,
    vaccine_VPO_2: vpo2,
    vaccine_PENTA_3: penta3,
    vaccine_VPO_3: vpo3,
    vaccine_VPI_1: vpi1,
    vaccine_VAR_1: var1,
    vaccine_VAA: vaa,
    vaccine_VPI_2: vpi2,
    vaccine_MEN_A: menA,
    vaccine_VAR_2: var2,
    vaccine_BCG_date: vaccineDate(bcg),
    vaccine_VPO_0_date: vaccineDate(vpo0),
    vaccine_PENTA_1_date: vaccineDate(penta1),
    vaccine_VPO_1_date: vaccineDate(vpo1),
    vaccine_PENTA_2_date: vaccineDate(penta2),
    vaccine_VPO_2_date: vaccineDate(vpo2),
    vaccine_PENTA_3_date: vaccineDate(penta3),
    vaccine_VPO_3_date: vaccineDate(vpo3),
    vaccine_VPI_1_date: vaccineDate(vpi1),
    vaccine_VAR_1_date: vaccineDate(var1),
    vaccine_VAA_date: vaccineDate(vaa),
    vaccine_VPI_2_date: vaccineDate(vpi2),
    vaccine_MEN_A_date: vaccineDate(menA),
    vaccine_VAR_2_date: vaccineDate(var2),
    no_BCG_reason: bcg ? null : 'En attente',
    no_VPO_0_reason: vpo0 ? null : 'En attente',
    no_PENTA_1_reason: penta1 ? null : 'Rupture de stock',
    no_VPO_1_reason: vpo1 ? null : 'En attente',
    no_PENTA_2_reason: penta2 ? null : 'Absent',
    no_VPO_2_reason: vpo2 ? null : 'En attente',
    no_PENTA_3_reason: penta3 ? null : 'En attente',
    no_VPO_3_reason: vpo3 ? null : 'En attente',
    no_VPI_1_reason: vpi1 ? null : 'Refus parental',
    no_VAR_1_reason: var1 ? null : 'En attente',
    no_VAA_reason: vaa ? null : 'En attente',
    no_VPI_2_reason: vpi2 ? null : 'En attente',
    no_MEN_A_reason: menA ? null : 'En attente',
    no_VAR_2_reason: var2 ? null : 'En attente',
  };
}

export function generateVaccinationDashboard(year: number, month: string, type: 'all' | 'partial' | 'none'): RecoVaccinationDashboardDbOutput[] {
  const result: RecoVaccinationDashboardDbOutput[] = [];

  for (const reco of RECOS) {
    const location = getLocationInfo(reco.id);
    const recoFamilies = FAMILIES.filter(f => f.reco_id === reco.id);

    const childrenVaccines = recoFamilies.map(family => {
      const familyPatients = PATIENTS.filter(p => p.family_id === family.id);
      const data = familyPatients.map(patient => {
        const child = generateVaccinationChild(family, patient);

        // Filtrer selon le type
        const vaccineCount = [
          child.vaccine_BCG, child.vaccine_VPO_0, child.vaccine_PENTA_1, child.vaccine_VPO_1,
          child.vaccine_PENTA_2, child.vaccine_VPO_2, child.vaccine_PENTA_3, child.vaccine_VPO_3,
          child.vaccine_VPI_1, child.vaccine_VAR_1, child.vaccine_VAA, child.vaccine_VPI_2,
          child.vaccine_MEN_A, child.vaccine_VAR_2,
        ].filter(Boolean).length;

        if (type === 'all' && vaccineCount === 14) return child;
        if (type === 'partial' && vaccineCount > 0 && vaccineCount < 14) return child;
        if (type === 'none' && vaccineCount === 0) return child;
        return null;
      }).filter(Boolean) as RecoVaccinationDashboard[];

      return {
        family_id: family.id,
        family_name: family.name,
        family_fullname: family.fullname,
        family_code: family.code,
        data,
      };
    }).filter(f => f.data.length > 0);

    if (childrenVaccines.length > 0) {
      result.push({
        id: `vac-${reco.id}-${year}-${month}-${type}`,
        month,
        year,
        ...location,
        children_vaccines: childrenVaccines,
        is_validate: true,
      });
    }
  }

  return result;
}

function generateActiveRecoMonth(): ActiveRecoUtils {
  return {
    cover: Math.random() > 0.2,
    supervised: Math.random() > 0.3,
    fonctionnal: Math.random() > 0.15,
  };
}

export function generateActiveRecoDashboard(_year: number): ActiveRecoDashboard {
  const record: ActiveRecoRecord[] = [];

  for (const dq of DISTRICT_QUARTIERS) {
    const dqRecos = RECOS.filter(r => r.district_quartier_id === dq.id);

    record.push({
      id: dq.id,
      name: dq.name,
      phone: '+224 620 00 00 00',
      country: { id: 'country-gn', name: 'Guinée' },
      region: { id: 'region-conakry', name: 'Conakry' },
      prefecture: { id: 'pref-ratoma', name: 'Ratoma' },
      commune: { id: 'com-ratoma', name: 'Ratoma Centre' },
      hospital: { id: 'hosp-ratoma', name: 'CS Ratoma' },
      district_quartier: { id: dq.id, name: dq.name },
      recos: dqRecos.map(reco => {
        const vs = VILLAGE_SECTEURS.find(v => v.id === reco.village_secteur_id)!;
        return {
          id: reco.id,
          name: reco.name,
          phone: '+224 620 00 00 01',
          village_secteur: { id: vs.id, name: vs.name },
          jan: generateActiveRecoMonth(),
          fev: generateActiveRecoMonth(),
          mar: generateActiveRecoMonth(),
          avr: generateActiveRecoMonth(),
          mai: generateActiveRecoMonth(),
          jui: generateActiveRecoMonth(),
          jul: generateActiveRecoMonth(),
          aou: generateActiveRecoMonth(),
          sep: generateActiveRecoMonth(),
          oct: generateActiveRecoMonth(),
          nov: generateActiveRecoMonth(),
          dec: generateActiveRecoMonth(),
        };
      }),
    });
  }

  const months = ['jan', 'fev', 'mar', 'avr', 'mai', 'jui', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec'] as const;
  const total = {} as ActiveRecoDashboard['total'];

  for (const month of months) {
    total[month] = {
      cover: record.reduce((sum, r) => sum + r.recos.filter(reco => reco[month].cover).length, 0),
      supervised: record.reduce((sum, r) => sum + r.recos.filter(reco => reco[month].supervised).length, 0),
      fonctionnal: record.reduce((sum, r) => sum + r.recos.filter(reco => reco[month].fonctionnal).length, 0),
    };
  }

  return { record, total };
}

export function generateTasksStateDashboard(): RecoTasksStateDashboard[] {
  const tasks = ['pregnancy_followup', 'child_vaccination', 'family_visit', 'health_education', 'medicine_delivery'];
  const taskLabels: Record<string, string> = {
    pregnancy_followup: 'Suivi de grossesse',
    child_vaccination: 'Vaccination enfant',
    family_visit: 'Visite familiale',
    health_education: 'Éducation sanitaire',
    medicine_delivery: 'Distribution médicaments',
  };

  return RECOS.map(reco => {
    const recoFamilies = FAMILIES.filter(f => f.reco_id === reco.id);
    const vs = VILLAGE_SECTEURS.find(v => v.id === reco.village_secteur_id)!;

    const families: RecoTasksStateFamilies[] = recoFamilies.map(family => {
      const familyPatients = PATIENTS.filter(p => p.family_id === family.id);

      return {
        id: family.id,
        name: family.name,
        given_name: family.fullname,
        external_id: family.external_id,
        code: family.code,
        patients: familyPatients.map(patient => ({
          id: patient.id,
          name: patient.name,
          external_id: patient.external_id,
          code: patient.code,
          data: tasks.slice(0, randomInt(1, 3)).map(task => {
            const dueDate = new Date(Date.now() + randomInt(-7, 14) * 24 * 60 * 60 * 1000);
            return {
              form: task,
              label: taskLabels[task],
              title: `${taskLabels[task]} - ${patient.name}`,
              source: 'system',
              due_date: dueDate.toISOString(),
              end_date: new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              source_id: `src-${task}-${patient.id}`,
              start_date: new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              patient_id: patient.id,
              patient_code: patient.code,
              patient_name: patient.name,
              patient_external_id: patient.external_id,
              family_id: family.id,
              family_name: family.name,
              family_given_name: family.fullname,
              family_external_id: family.external_id,
              family_code: family.code,
            };
          }),
        })),
      };
    });

    return {
      id: reco.id,
      name: reco.name,
      phone: '+224 620 00 00 01',
      code: reco.external_id,
      external_id: reco.external_id,
      village_secteur: { id: vs.id, name: vs.name },
      families,
    };
  });
}

// ============================================================================
// REPORTS DATA GENERATORS
// ============================================================================

function createFPMethod(label: string): FP_Utils {
  return {
    label,
    nbr_new_user: randomInt(0, 15),
    nbr_regular_user: randomInt(5, 30),
    nbr_total_user: randomInt(5, 45),
    nbr_delivered: randomInt(10, 50),
    nbr_in_stock: randomInt(20, 100),
    nbr_referred: randomInt(0, 5),
    nbr_side_effect: randomInt(0, 3),
  };
}

export function generateFamilyPlanningReport(year: number, month: string, recoId: string): FamilyPlanningReport {
  const location = getLocationInfo(recoId);
  return {
    id: `fp-${recoId}-${year}-${month}`,
    month,
    year,
    ...location,
    is_validate: Math.random() > 0.3,
    already_on_dhis2: Math.random() > 0.5,
    methods: {
      pill_coc: createFPMethod('Pilule COC'),
      pill_cop: createFPMethod('Pilule COP'),
      condoms: createFPMethod('Préservatifs féminins'),
      condoms_masculin: createFPMethod('Préservatifs masculins'),
      depo_provera_im: createFPMethod('Depo Provera IM'),
      dmpa_sc: createFPMethod('DMPA-SC'),
      cycle_necklace: createFPMethod('Collier du cycle'),
      diu: createFPMethod('DIU'),
      implant: createFPMethod('Implant'),
      tubal_ligation: createFPMethod('Ligature des trompes'),
    },
  };
}

function createMorbidityIndicator(indicator: string): MorbidityUtils {
  return {
    indicator,
    nbr_5_14_years: randomInt(0, 20),
    nbr_14_25_years: randomInt(0, 25),
    nbr_25_60_years: randomInt(0, 30),
    nbr_60_more_years: randomInt(0, 15),
    nbr_pregnant_woman: randomInt(0, 10),
    nbr_total: randomInt(0, 100),
    nbr_referred: randomInt(0, 10),
  };
}

export function generateMorbidityReport(year: number, month: string, recoId: string): MorbidityReport {
  const location = getLocationInfo(recoId);
  return {
    id: `morb-${recoId}-${year}-${month}`,
    month,
    year,
    ...location,
    is_validate: Math.random() > 0.3,
    already_on_dhis2: Math.random() > 0.5,
    hp_circulation_accident: createMorbidityIndicator('Accident de circulation'),
    hp_burn: createMorbidityIndicator('Brûlures'),
    hp_suspected_tb_cases: createMorbidityIndicator('Cas suspects de TB'),
    hp_dermatosis: createMorbidityIndicator('Dermatoses'),
    hp_diarrhea: createMorbidityIndicator('Diarrhées'),
    hp_urethral_discharge: createMorbidityIndicator('Écoulement urétral'),
    hp_vaginal_discharge: createMorbidityIndicator('Pertes vaginales'),
    hp_urinary_loss: createMorbidityIndicator('Pertes urinaires'),
    hp_accidental_caustic_products_ingestion: createMorbidityIndicator('Ingestion produits caustiques'),
    hp_food_poisoning: createMorbidityIndicator('Intoxication alimentaire'),
    hp_oral_diseases: createMorbidityIndicator('Maladies bucco-dentaires'),
    hp_dog_bite: createMorbidityIndicator('Morsure de chien'),
    hp_snake_bite: createMorbidityIndicator('Morsure de serpent'),
    hp_parasitosis: createMorbidityIndicator('Parasitoses'),
    hp_measles: createMorbidityIndicator('Rougeole'),
    hp_trauma: createMorbidityIndicator('Traumatismes'),
    hp_gender_based_violence: createMorbidityIndicator('Violences basées sur le genre'),
    malaria_total_cases: createMorbidityIndicator('Paludisme - Cas totaux'),
    malaria_rdt_performed: createMorbidityIndicator('Paludisme - TDR effectués'),
    malaria_positive_rdts: createMorbidityIndicator('Paludisme - TDR positifs'),
    malaria_cases_treated_with_cta: createMorbidityIndicator('Paludisme - Cas traités CTA'),
  };
}

function createDomainTheme(label: string): DomainsThemesUtils {
  return {
    label,
    vad: { F: randomInt(0, 20), M: randomInt(0, 15) },
    talk: { F: randomInt(0, 30), M: randomInt(0, 25) },
    personal: { F: randomInt(0, 10), M: randomInt(0, 8) },
    total: { F: randomInt(0, 60), M: randomInt(0, 48) },
    bigtotal: randomInt(0, 108),
  };
}

export function generatePromotionReport(year: number, month: string, recoId: string): PromotionReport {
  const location = getLocationInfo(recoId);
  return {
    id: `promo-${recoId}-${year}-${month}`,
    month,
    year,
    ...location,
    is_validate: Math.random() > 0.3,
    already_on_dhis2: Math.random() > 0.5,
    domains: {
      maternel_childhealth: createDomainTheme('Santé maternelle et infantile'),
      education: createDomainTheme('Éducation'),
      gbv: createDomainTheme('Violences basées sur le genre'),
      nutrition: createDomainTheme('Nutrition'),
      water_hygiene: createDomainTheme('Eau et hygiène'),
      ist_vih: createDomainTheme('IST/VIH'),
      disease_control: createDomainTheme('Lutte contre les maladies'),
      others: createDomainTheme('Autres'),
    },
    themes: {
      prenatal_consultation: createDomainTheme('Consultation prénatale'),
      birth_attended: createDomainTheme('Accouchement assisté'),
      delivery: createDomainTheme('Accouchement'),
      birth_registration: createDomainTheme('Enregistrement des naissances'),
      post_natal: createDomainTheme('Post-natal'),
      post_abortion: createDomainTheme('Post-avortement'),
      obstetric_fistula: createDomainTheme('Fistule obstétricale'),
      family_planning: createDomainTheme('Planification familiale'),
      oral_contraceptive: createDomainTheme('Contraceptif oral'),
      vaccination: createDomainTheme('Vaccination'),
      newborn_care_home: createDomainTheme('Soins nouveau-né à domicile'),
      care_home_illness_case: createDomainTheme('Soins maladie à domicile'),
      child_development_care: createDomainTheme('Soins développement enfant'),
      advice_for_child_development: createDomainTheme('Conseils développement enfant'),
      child_abuse: createDomainTheme('Maltraitance enfant'),
      female_genital_mutilation: createDomainTheme('MGF'),
      exclusive_breastfeeding: createDomainTheme('Allaitement exclusif'),
      vitamin_a_supp: createDomainTheme('Supplémentation Vitamine A'),
      suppl_feeding: createDomainTheme('Alimentation complémentaire'),
      malnutrition: createDomainTheme('Malnutrition'),
      combating_iodine: createDomainTheme('Lutte carence iode'),
      hand_washing: createDomainTheme('Lavage des mains'),
      community_led: createDomainTheme('ATPC'),
      tuberculosis: createDomainTheme('Tuberculose'),
      leprosy: createDomainTheme('Lèpre'),
      buruli_ulcer: createDomainTheme('Ulcère de Buruli'),
      onchocerciasis: createDomainTheme('Onchocercose'),
      bilharzia: createDomainTheme('Bilharziose'),
      mass_deworming: createDomainTheme('Déparasitage de masse'),
      human_african_trypanosomiasis: createDomainTheme('THA'),
      lymphatic: createDomainTheme('Filariose lymphatique'),
      trachoma: createDomainTheme('Trachome'),
      sti_and_hepatitis: createDomainTheme('IST et hépatites'),
      hypertension: createDomainTheme('Hypertension'),
      diabetes: createDomainTheme('Diabète'),
      cancers: createDomainTheme('Cancers'),
      sickle_cell_disease: createDomainTheme('Drépanocytose'),
      malaria: createDomainTheme('Paludisme'),
      diarrhea: createDomainTheme('Diarrhée'),
      bloody_diarrhea: createDomainTheme('Diarrhée sanglante'),
      pneumonia: createDomainTheme('Pneumonie'),
      yellow_fever: createDomainTheme('Fièvre jaune'),
      cholera: createDomainTheme('Choléra'),
      tetanus: createDomainTheme('Tétanos'),
      viral_diseases: createDomainTheme('Maladies virales'),
      meningitis: createDomainTheme('Méningite'),
      pfa: createDomainTheme('PFA'),
      urine_loss: createDomainTheme('Incontinence urinaire'),
      blood_pressure: createDomainTheme('Tension artérielle'),
      hiv: createDomainTheme('VIH'),
      ist: createDomainTheme('IST'),
    },
  };
}

export function generateHouseholdRecapReport(year: number, month: string, recoId: string): HouseholdRecapReport[] {
  const location = getLocationInfo(recoId);
  const recoFamilies = FAMILIES.filter(f => {
    const reco = RECOS.find(r => r.id === recoId);
    return reco && f.reco_id === recoId;
  });

  return recoFamilies.map((family, index) => ({
    id: `hh-${family.id}-${year}-${month}`,
    month,
    year,
    ...location,
    is_validate: Math.random() > 0.3,
    already_on_dhis2: Math.random() > 0.5,
    index: index + 1,
    family_code: family.code,
    family_name: family.name,
    family_fullname: family.fullname,
    total_household_members: randomInt(3, 12),
    total_adult_women_15_50_years: randomInt(1, 4),
    total_children_0_12_months: randomInt(0, 2),
    total_children_12_60_months: randomInt(0, 3),
    total_children_under_5_years: randomInt(0, 4),
    has_functional_latrine: Math.random() > 0.3,
    has_drinking_water_access: Math.random() > 0.2,
  }));
}

export function generatePcimneNewbornReport(year: number, month: string, recoId: string): PcimneNewbornReport {
  const location = getLocationInfo(recoId);
  const indicators = [
    'Cas vus',
    'Cas référés',
    'Cas traités',
    'Cas guéris',
    'Cas décédés',
  ];

  return {
    id: `pcimne-${recoId}-${year}-${month}`,
    month,
    year,
    ...location,
    is_validate: Math.random() > 0.3,
    already_on_dhis2: Math.random() > 0.5,
    pcimne_newborn: indicators.map((indicator, index) => ({
      index: index + 1,
      indicator,
      malaria_0_2: { F: randomInt(0, 5), M: randomInt(0, 6) },
      malaria_2_12: { F: randomInt(0, 8), M: randomInt(0, 10) },
      malaria_12_60: { F: randomInt(0, 12), M: randomInt(0, 15) },
      cough_pneumonia_0_2: { F: randomInt(0, 4), M: randomInt(0, 5) },
      cough_pneumonia_2_12: { F: randomInt(0, 7), M: randomInt(0, 8) },
      cough_pneumonia_12_60: { F: randomInt(0, 10), M: randomInt(0, 12) },
      diarrhea_0_2: { F: randomInt(0, 6), M: randomInt(0, 7) },
      diarrhea_2_12: { F: randomInt(0, 9), M: randomInt(0, 11) },
      diarrhea_12_60: { F: randomInt(0, 14), M: randomInt(0, 16) },
      malnutrition_0_2: { F: randomInt(0, 3), M: randomInt(0, 4) },
      malnutrition_2_12: { F: randomInt(0, 5), M: randomInt(0, 6) },
      malnutrition_12_60: { F: randomInt(0, 8), M: randomInt(0, 9) },
      total: { F: randomInt(0, 50), M: randomInt(0, 60) },
      bigtotal: randomInt(0, 110),
    })),
  };
}

export function generateChwsRecoReport(year: number, month: string, recoId: string): ChwsRecoReport {
  const location = getLocationInfo(recoId);

  const createElements = (group: string, position: string, indicators: string[]) => ({
    index: 1,
    group,
    position,
    data: indicators.map((indicator, idx) => ({
      index: idx + 1,
      indicator,
      de_number: randomInt(0, 50),
      observation: null,
    })),
  });

  return {
    id: `chw-${recoId}-${year}-${month}`,
    month,
    year,
    ...location,
    is_validate: Math.random() > 0.3,
    already_on_dhis2: Math.random() > 0.5,
    reco_monitoring: createElements('Suivi RECO', 'top', [
      'Nombre de jours travaillés',
      'Nombre de supervisions reçues',
      'Nombre de réunions communautaires',
    ]),
    demography: createElements('Démographie', 'top', [
      'Population totale',
      'Femmes en âge de procréer',
      'Enfants de 0-11 mois',
      'Enfants de 12-59 mois',
    ]),
    child_health_0_59_months: createElements('Santé enfant 0-59 mois', 'left', [
      'Enfants pesés',
      'Enfants malnutris MAM',
      'Enfants malnutris MAS',
      'Enfants référés',
    ]),
    mother_health: createElements('Santé maternelle', 'left', [
      'Femmes enceintes suivies',
      'CPN1', 'CPN2', 'CPN3', 'CPN4',
      'Accouchements à domicile',
      'Référées pour accouchement',
    ]),
    pcimne_activity: createElements('Activités PCIMNE', 'left', [
      'Cas de paludisme simple',
      'Cas de diarrhée',
      'Cas de pneumonie',
      'Cas référés',
    ]),
    morbidity_activities: createElements('Activités morbidité', 'right', [
      'Consultations totales',
      'Cas traités',
      'Cas référés',
    ]),
    malaria_more_5_years: createElements('Paludisme +5 ans', 'right', [
      'TDR effectués',
      'TDR positifs',
      'Cas traités CTA',
    ]),
    home_visit: createElements('Visites à domicile', 'right', [
      'VAD effectuées',
      'VAD femmes enceintes',
      'VAD nouveau-nés',
      'VAD enfants malades',
    ]),
    educational_talk: createElements('Causeries éducatives', 'bottom', [
      'Causeries effectuées',
      'Participants hommes',
      'Participants femmes',
    ]),
    developed_areas: createElements('Domaines développés', 'bottom', [
      'Santé maternelle',
      'Vaccination',
      'Nutrition',
      'Hygiène',
    ]),
    diseases_alerts: createElements('Alertes maladies', 'bottom', [
      'Alertes signalées',
      'Épidémies suspectées',
      'Décès communautaires',
    ]),
  };
}

export function generateRecoMegSituationReport(year: number, month: string, recoId: string): RecoMegSituationReport {
  const location = getLocationInfo(recoId);
  const products = [
    'Paracétamol 500mg',
    'Amoxicilline 250mg',
    'CTA (Artemether-Lumefantrine)',
    'SRO',
    'Zinc 20mg',
    'Vitamine A 200000 UI',
    'Mébendazole 500mg',
  ];

  return {
    id: `meg-${recoId}-${year}-${month}`,
    month,
    year,
    ...location,
    is_validate: Math.random() > 0.3,
    already_on_dhis2: Math.random() > 0.5,
    meg_data: products.map((label, index) => {
      const beginning = randomInt(20, 100);
      const received = randomInt(0, 50);
      const totalStart = beginning + received;
      const consumption = randomInt(10, Math.min(totalStart, 60));
      const theoretical = totalStart - consumption;
      const inventory = theoretical - randomInt(0, 5);

      return {
        index: index + 1,
        label,
        month_beginning: beginning,
        month_received: received,
        month_total_start: totalStart,
        month_consumption: consumption,
        month_theoreticaly: theoretical,
        month_inventory: inventory,
        month_loss: randomInt(0, 3),
        month_damaged: randomInt(0, 2),
        month_broken: randomInt(0, 2),
        month_expired: randomInt(0, 5),
      };
    }),
  };
}

// ============================================================================
// INITIALIZATION FUNCTION
// ============================================================================

export function initializeTestData(): void {
  console.log('[TestData] Initialisation des données de test...');

  // OrgUnits
  if (db.count('countries') === 0) {
    db.createMany('countries', COUNTRIES);
    console.log('[TestData] Pays créés:', COUNTRIES.length);
  }

  if (db.count('regions') === 0) {
    db.createMany('regions', REGIONS);
    console.log('[TestData] Régions créées:', REGIONS.length);
  }

  if (db.count('prefectures') === 0) {
    db.createMany('prefectures', PREFECTURES);
    console.log('[TestData] Préfectures créées:', PREFECTURES.length);
  }

  if (db.count('communes') === 0) {
    db.createMany('communes', COMMUNES);
    console.log('[TestData] Communes créées:', COMMUNES.length);
  }

  if (db.count('hospitals') === 0) {
    db.createMany('hospitals', HOSPITALS);
    console.log('[TestData] Hôpitaux créés:', HOSPITALS.length);
  }

  if (db.count('district_quartiers') === 0) {
    db.createMany('district_quartiers', DISTRICT_QUARTIERS);
    console.log('[TestData] Districts/Quartiers créés:', DISTRICT_QUARTIERS.length);
  }

  if (db.count('village_secteurs') === 0) {
    db.createMany('village_secteurs', VILLAGE_SECTEURS);
    console.log('[TestData] Villages/Secteurs créés:', VILLAGE_SECTEURS.length);
  }

  if (db.count('chws') === 0) {
    db.createMany('chws', CHWS);
    console.log('[TestData] CHWs créés:', CHWS.length);
  }

  if (db.count('recos') === 0) {
    db.createMany('recos', RECOS);
    console.log('[TestData] RECOs créés:', RECOS.length);
  }

  // Visualization dimensions
  if (db.count('visualization_data_elements') === 0) {
    db.createMany('visualization_data_elements', VISUALIZATION_DATA_ELEMENTS);
    console.log('[TestData] Éléments de données de visualisation créés:', VISUALIZATION_DATA_ELEMENTS.length);
  }

  if (db.count('visualization_indicators') === 0) {
    db.createMany('visualization_indicators', VISUALIZATION_INDICATORS);
    console.log('[TestData] Indicateurs de visualisation créés:', VISUALIZATION_INDICATORS.length);
  }

  if (db.count('visualization_periods') === 0) {
    db.createMany('visualization_periods', VISUALIZATION_PERIODS);
    console.log('[TestData] Périodes de visualisation créées:', VISUALIZATION_PERIODS.length);
  }

  if (db.count('visualization_org_units') === 0) {
    db.createMany('visualization_org_units', VISUALIZATION_ORG_UNITS);
    console.log('[TestData] Unités organisationnelles de visualisation créées:', VISUALIZATION_ORG_UNITS.length);
  }

  if (db.count('families') === 0) {
    db.createMany('families', FAMILIES);
    console.log('[TestData] Familles créées:', FAMILIES.length);
  }

  if (db.count('patients') === 0) {
    db.createMany('patients', PATIENTS);
    console.log('[TestData] Patients créés:', PATIENTS.length);
  }

  // Roles & Auth
  if (db.count('roles') === 0) {
    db.createMany('roles', ROLES.map(r => ({ ...r, id: String(r.id) })));
    console.log('[TestData] Rôles créés:', ROLES.length);
  }

  if (db.count('authorizations') === 0) {
    AUTHORIZATIONS.forEach((auth, i) => db.create<{ name: string }>('authorizations', { id: `auth-${i}`, name: auth }));
    console.log('[TestData] Autorisations créées:', AUTHORIZATIONS.length);
  }

  if (db.count('routes') === 0) {
    ROUTES.forEach((route, i) => db.create<Routes>('routes', { id: `route-${i}`, ...route }));
    console.log('[TestData] Routes créées:', ROUTES.length);
  }

  // Organizations
  if (db.count('organizations') === 0) {
    db.createMany('organizations', ORGANIZATIONS);
    console.log('[TestData] Organisations créées:', ORGANIZATIONS.length);
  }

  // Permissions
  if (db.count('permissions') === 0) {
    db.createMany('permissions', PERMISSIONS);
    console.log('[TestData] Permissions créées:', PERMISSIONS.length);
  }

  // API Tokens (collection vide par défaut)
  if (db.count('api_tokens') === 0) {
    console.log('[TestData] Collection api_tokens initialisée (vide)');
  }

  console.log('[TestData] Initialisation terminée!');
}

// Auto-initialisation
initializeTestData();
