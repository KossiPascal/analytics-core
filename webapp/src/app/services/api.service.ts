import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ConstanteService } from './constantes.service';
import { Observable } from 'rxjs';
import { Roles } from '@kossi-models/roles';
import { AdminUser } from '@kossi-models/user';
import { notNull } from '../utils/functions';
import { UserContextService } from './user-context.service';
import { SyncOrgUnit, getOrgUnitFromDbFilter } from '@kossi-models/org-units';
import { DataValue } from '@kossi-models/dhis2';

@Injectable({ providedIn: 'root' })
export class ApiService {

  backendUrl!: string;
  customHeaders!: { headers: HttpHeaders };

  constructor(private auth: AuthService, private http: HttpClient, private cst: ConstanteService, private userCtx: UserContextService,) {
    if (!this.backendUrl) this.backendUrl = this.cst.backenUrl();
    if (!this.customHeaders) this.customHeaders = this.cst.CustomHttpHeaders();
  }

  public ApiParams(params?: any, mustLoggedIn: boolean = true) {
    if (mustLoggedIn && !this.userCtx.isLoggedIn) return this.auth.logout();
    const fparams: any = notNull(params) ? params : {};
    fparams['userId'] = this.userCtx.currentUserCtx?.id;
    fparams['appLoadToken'] = this.userCtx.appLoadToken;
    return fparams;
  }

  //START AUTH

  login(params: { credential: string, password: string }): Observable<any> {
    const fparams = this.ApiParams(params, false);
    return this.http.post(`${this.backendUrl}/auth-user/login`, fparams, this.customHeaders);
  }

  register(user: AdminUser): Observable<any> {
    const fparams = this.ApiParams({ ...user });
    return this.http.post(`${this.backendUrl}/auth-user/register`, fparams, this.customHeaders);
  }
  //END AUTH

  //START ADMIN

  getUsers(): Observable<any> {
    const fparams = this.ApiParams();
    return this.http.post(`${this.backendUrl}/auth-user/users`, fparams, this.customHeaders);
  }

  updateUser(user: AdminUser): Observable<any> {
    const fparams = this.ApiParams({ ...user });
    return this.http.post(`${this.backendUrl}/auth-user/update-user`, fparams, this.customHeaders);
  }

  updatePassword(user: any): Observable<any> {
    const fparams = this.ApiParams({ ...user });
    return this.http.post(`${this.backendUrl}/auth-user/update-user-password`, fparams, this.customHeaders);
  }

  updateMyPassword(user: { old_password: string, new_password: string }): Observable<any> {
    const fparams = this.ApiParams({ ...user });
    return this.http.post(`${this.backendUrl}/auth-user/update-my-password`, fparams, this.customHeaders);
  }

  deleteUser(user: AdminUser, permanentDelete: boolean = false): Observable<any> {
    const fparams = this.ApiParams({ ...user, permanentDelete });
    return this.http.post(`${this.backendUrl}/auth-user/delete-user`, fparams, this.customHeaders);
  }

  GetRoles(): Observable<any> {
    const fparams = this.ApiParams();
    return this.http.post(`${this.backendUrl}/auth-user/roles`, fparams, this.customHeaders);
  }

  CreateRole(params: Roles): Observable<any> {
    const fparams = this.ApiParams(params);
    return this.http.post(`${this.backendUrl}/auth-user/create-role`, fparams, this.customHeaders);
  }

  UpdateRole(params: Roles): Observable<any> {
    const fparams = this.ApiParams(params);
    return this.http.post(`${this.backendUrl}/auth-user/update-role`, fparams, this.customHeaders);
  }

  DeleteRole(params: Roles): Observable<any> {
    const fparams = this.ApiParams(params);
    return this.http.post(`${this.backendUrl}/auth-user/delete-role`, fparams, this.customHeaders);
  }

  UserAutorizations(): Observable<any> {
    const fparams = this.ApiParams();
    return this.http.post(`${this.backendUrl}/auth-user/autorizations`, fparams, this.customHeaders);
  }

  UserRoutes(): Observable<any> {
    const fparams = this.ApiParams();
    return this.http.post(`${this.backendUrl}/auth-user/routes`, fparams, this.customHeaders);
  }

  ApiTokenAccessAction(params: { action: string, id?: number, token?: string, isActive?: boolean }): any {
    const fparams = this.ApiParams(params);
    return this.http.post(`${this.backendUrl}/auth-user/api-access-key`, fparams, this.customHeaders);
  }
  //END ADMIN


  //START REPORTS CALCULATION FROM DB
  CHW_RECO_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const fparams = this.ApiParams({ year, month });
    return this.http.post(`${this.backendUrl}/sync/db-chws-reco-report-calculation`, fparams, this.customHeaders);
  }
  FAMILY_PLANNNING_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const fparams = this.ApiParams({ year, month });
    return this.http.post(`${this.backendUrl}/sync/db-family-planning-report-calculation`, fparams, this.customHeaders);
  }
  ADULT_MORBIDITY_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const fparams = this.ApiParams({ year, month });
    return this.http.post(`${this.backendUrl}/sync/db-adult-morbidity-report-calculation`, fparams, this.customHeaders);
  }
  HOUSEHOLD_RECAPS_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const fparams = this.ApiParams({ year, month });
    return this.http.post(`${this.backendUrl}/sync/db-household-recaps-report-calculation`, fparams, this.customHeaders);
  }
  PCIMNE_NEWBORN_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const fparams = this.ApiParams({ year, month });
    return this.http.post(`${this.backendUrl}/sync/db-pcimne-newborn-report-calculation`, fparams, this.customHeaders);
  }
  PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const fparams = this.ApiParams({ year, month });
    return this.http.post(`${this.backendUrl}/sync/db-promotional-activity-report-calculation`, fparams, this.customHeaders);
  }
  RECO_MEG_SITUATION_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const fparams = this.ApiParams({ year, month });
    return this.http.post(`${this.backendUrl}/sync/db-reco-meg-situation-report-calculation`, fparams, this.customHeaders);
  }
  //END REPORTS CALCULATION FROM DB


  //END DASHBOARD CALCULATION FROM DB
  RECO_VACCINATION_DASHBOARD_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const fparams = this.ApiParams({ year, month });
    return this.http.post(`${this.backendUrl}/sync/db-reco-vaccination-dashboard-calculation`, fparams, this.customHeaders);
  }

  RECO_PERFORMANCE_DASHBOARD_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const fparams = this.ApiParams({ year, month });
    return this.http.post(`${this.backendUrl}/sync/db-reco-performance-dashboard-calculation`, fparams, this.customHeaders);
  }

  RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION(year: number): Observable<any> {
    const fparams = this.ApiParams({ year });
    return this.http.post(`${this.backendUrl}/sync/db-reco-chart-performance-dashboard-calculation`, fparams, this.customHeaders);
  }
  //END DASHBOARD CALCULATION FROM DB


  //START SYNC FROM COUCH-DB
  SYNC_ALL_FORMS_DATA_FROM_COUCHDB({ year, month }: { year: number, month: string }): Observable<any> {
    const fparams = this.ApiParams({ year, month });
    return this.http.post(`${this.backendUrl}/sync/couchdb-forms-data`, fparams, this.customHeaders);
  }
  SYNC_APP_USERS_FROM_COUCHDB(): Observable<any> {
    const fparams = this.ApiParams();
    return this.http.post(`${this.backendUrl}/sync/couchdb-users`, fparams, this.customHeaders);
  }
  SYNC_ALL_ORGUNITS_AND_CONTACTS_FROM_COUCHDB(param: SyncOrgUnit): Observable<any> {
    const fparams = this.ApiParams(param);
    return this.http.post(`${this.backendUrl}/sync/couchdb-orgunits-and-contacts`, fparams, this.customHeaders);
  }
  FULL_SYNC_AND_CALCULATE_COUCHDB_DATA(params: { year: number | undefined, month: string | undefined, start_date: string | undefined, end_date: string | undefined }): Observable<any> {
    const fparams = this.ApiParams(params);
    return this.http.post(`${this.backendUrl}/sync/all-in-one-from-couchdb-and-calculate`, fparams, this.customHeaders);
  }
  //END SYNC FROM COUCH-DB



  //START REPPORTS

  GetPromotionReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/promotion-reports`, fparams, this.customHeaders);
  }

  GetFamilyPlanningReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/family-planning-reports`, fparams, this.customHeaders);
  }

  GetMorbidityReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/morbidity-reports`, fparams, this.customHeaders);
  }

  GetHouseholdRecapReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/household-recaps-reports`, fparams, this.customHeaders);
  }

  GetPcimneNewbornReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/pcime-newborn-reports`, fparams, this.customHeaders);
  }

  GetChwsRecoReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/chws-reco-reports`, fparams, this.customHeaders);
  }

  GetRecoMegSituationReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/reco-meg-situation-reports`, fparams, this.customHeaders);
  }
  //END REPPORTS



  //START VALIDATE REPPORTS

  ValidatePromotionReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/promotion-reports-validation`, fparams, this.customHeaders);
  }

  ValidateFamilyPlanningReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/family-planning-reports-validation`, fparams, this.customHeaders);
  }

  ValidateMorbidityReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/morbidity-reports-validation`, fparams, this.customHeaders);
  }

  ValidateHouseholdRecapReports({ months, year, recos, dataIds }: { months: string[], year: number, recos: string[], dataIds: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos, dataIds });
    return this.http.post(`${this.backendUrl}/reports/household-recaps-reports-validation`, fparams, this.customHeaders);
  }

  ValidatePcimneNewbornReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/pcime-newborn-reports-validation`, fparams, this.customHeaders);
  }

  ValidateChwsRecoReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/chws-reco-reports-validation`, fparams, this.customHeaders);
  }

  ValidateRecoMegSituationReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/reports/reco-meg-situation-reports-validation`, fparams, this.customHeaders);
  }

  //END VALIDATE REPPORTS



  //START DASHBOARD
  GetRecoVaccinationDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/dashboards/reco-vaccination-dashboards`, fparams, this.customHeaders);
  }

  GetRecoPerformanceDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ months, year, recos });
    return this.http.post(`${this.backendUrl}/dashboards/reco-performance-dashboards`, fparams, this.customHeaders);
  }

  GetRecoChartPerformanceDashboards({ year, recos }: { year: number, recos: string[] }): Observable<any> {
    const fparams = this.ApiParams({ year, recos });
    return this.http.post(`${this.backendUrl}/dashboards/reco-chart-performance-dashboards`, fparams, this.customHeaders);
  }
  //END DASHBOARD



  //START ORG UNITS
  GetCountries(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/countries`, fparams, this.customHeaders);
  }
  GetRegions(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/regions`, fparams, this.customHeaders);
  }
  GetPrefectures(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/prefectures`, fparams, this.customHeaders);
  }
  GetCommunes(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/communes`, fparams, this.customHeaders);
  }
  GetHospitals(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/hospitals`, fparams, this.customHeaders);
  }
  GetDistrictQuartiers(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/district-quartiers`, fparams, this.customHeaders);
  }
  GetVillageSecteurs(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/village-secteurs`, fparams, this.customHeaders);
  }
  GetFamilys(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/families`, fparams, this.customHeaders);
  }
  GetChws(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/chws`, fparams, this.customHeaders);
  }
  GetRecos(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/recos`, fparams, this.customHeaders);
  }
  GetPatients(param?: getOrgUnitFromDbFilter): Observable<any> {
    const fparams = this.ApiParams({ ...param });
    return this.http.post(`${this.backendUrl}/org-units/patients`, fparams, this.customHeaders);
  }
  //END ORG UNITS


  //START DATABASES UTILS
  GetDataToDeleteFromCouchDb(params: { cible: string[], start_date: string, end_date: string, type: string }): any {
    const fparams = this.ApiParams({ ...params });
    return this.http.post(`${this.backendUrl}/database/couchdb/list-data-to-delete`, fparams, this.customHeaders);
  }

  deleteDataFromCouchDb(data: { _deleted: boolean, _id: string, _rev: string, _table: string }[], typeOfData: string): any {
    const fparams = this.ApiParams({ data_to_delete: data, type: typeOfData });
    return this.http.post(`${this.backendUrl}/database/couchdb/detele-data`, fparams, this.customHeaders);
  }

  updateUserFacilityContactPlace(params: { contact: string, parent: string, new_parent: string }): any {
    const fparams = this.ApiParams(params);
    return this.http.post(`${this.backendUrl}/database/couchdb/update-user-facility-contact-place`, fparams, this.customHeaders);
  }

  getDatabaseEntities(): any {
    const fparams = this.ApiParams();
    return this.http.post(`${this.backendUrl}/database/postgres/entities`, fparams, this.customHeaders);
  }

  truncateDatabase(params: { procide: boolean, entities: { name: string, table: string }[], action: "TRUNCATE" | "DROP" }): any {
    const fparams = this.ApiParams(params);
    return this.http.post(`${this.backendUrl}/database/postgres/truncate`, fparams, this.customHeaders);
  }
  //END DATABASES UTILS


  //START DHIS2
  SendPromotionActivitiesToDhis2({ dataValues, months, year, recos }: { dataValues: DataValue[], months: string[], year: number, recos: string[] }): any {
    const fparams = this.ApiParams({ dataValues, months, year, recos });
    return this.http.post(`${this.backendUrl}/dhis2/send/promotional-activity`, fparams, this.customHeaders);
  }

  SendRecoMegSituationActivitiesToDhis2({ dataValues, months, year, recos }: { dataValues: DataValue[], months: string[], year: number, recos: string[] }): any {
    const fparams = this.ApiParams({ dataValues, months, year, recos });
    return this.http.post(`${this.backendUrl}/dhis2/send/reco-meg-situation-activity`, fparams, this.customHeaders);
  }

  //END DHIS2



  // async get(dbName: 'users' | 'dashboard') {
  //   try {
  //     const response = await axios.get('/api/data');
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //     throw error;
  //   }
  // }

}
