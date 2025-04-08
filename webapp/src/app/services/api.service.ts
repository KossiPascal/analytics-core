import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConstanteService } from './constantes.service';
import { Observable, switchMap } from 'rxjs';
import { User, Roles } from '@kossi-models/user-role';
import { notNull } from '../shared/functions';
import { UserContextService } from './user-context.service';
import { SyncOrgUnit, getOrgUnitFromDbFilter } from '@kossi-models/org-units';
import { Dhis2DataValueSetParams } from '@kossi-models/dhis2';
import { from } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ApiService {

  backendUrl!: string;
  customHeaders!: { headers: HttpHeaders };

  constructor(private http: HttpClient, private cst: ConstanteService, private userCtx: UserContextService,) {
    this.initializeService();
  }

  private async initializeService() {
    this.backendUrl = this.cst.backenUrl();
    this.customHeaders = await this.cst.CustomHttpHeaders();
  }

  async ApiParams(params?: any, mustLoggedIn: boolean = true): Promise<{ [key: string]: any }> {
    // if (mustLoggedIn && !this.userCtx.isLoggedIn()) return this.auth.logout();
    const fparams: any = notNull(params) ? params : {};
    const user = await this.userCtx.currentUser();
    fparams['userId'] = user?.id;
    fparams['appLoadToken'] = this.userCtx.APP_AUTH_TOKEN;
    return fparams;
  }

  //START AUTH

  // public(url: string, prodApp?: boolean, ): Observable<any> {
  //   return from(this.ApiParams({prodApp}, false)).pipe(
  //     switchMap(fparams =>
  //       this.http.post(`${this.backendUrl}/auth-user/${url}`, fparams, this.customHeaders)
  //     )
  //   );
  // }

  login(params: { credential: string, password: string }): Observable<any> {
    return from(this.ApiParams({ ...params, loginModeCredents: true }, false)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/login`, fparams, this.customHeaders)
      )
    );
  }


  register(user: User): Observable<any> {
    return from(this.ApiParams({ ...user })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/register`, fparams, this.customHeaders)
      )
    );
  }

  /** Rafraîchir le token */
  newToken(updateReload: boolean = false): Observable<any> {
    return from(this.ApiParams({ updateReload })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/new-token`, fparams, this.customHeaders)
      )
    );
  }
  //END AUTH

  saveSurvey(params: any): Observable<any> {
    return from(this.ApiParams({ survey: params }, false)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/survey/save`, fparams, this.customHeaders)
      )
    );
  }

  getAverage(): Observable<any> {
    return from(this.ApiParams({}, false)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/survey/get-averages`, fparams, this.customHeaders)
      )
    );
  }

  //START ADMIN

  sendSms(params: { phoneNumbers: string[], message: string }): Observable<any> {
    return from(this.ApiParams(params)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sms/send-sms`, fparams, this.customHeaders)
      )
    );
  }

  sendCustomSms(params: { phone: string, message: string }[]): Observable<any> {
    return from(this.ApiParams({ phoneNumbersMessage: params })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sms/send-coustom-sms`, fparams, this.customHeaders)
      )
    );
  }

  getUsers(): Observable<any> {
    return from(this.ApiParams()).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/users`, fparams, this.customHeaders)
      )
    );
  }

  updateProfile(params: { id:string|undefined, fullname: string; email: string; phone: string; }): Observable<any> {
    return from(this.ApiParams(params)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/update-user-profile`, fparams, this.customHeaders)
      )
    );
}

  updateUser(user: User): Observable<any> {
    return from(this.ApiParams({ ...user })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/update-user`, fparams, this.customHeaders)
      )
    );
  }

  updatePassword(params: { id:string|undefined, oldPassword:string, newPassword:string }): Observable<any> {
    return from(this.ApiParams(params)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/update-user-password`, fparams, this.customHeaders)
      )
    );
  }

  deleteUser(user: User, permanentDelete: boolean = false): Observable<any> {
    return from(this.ApiParams({ ...user, permanentDelete })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/delete-user`, fparams, this.customHeaders)
      )
    );
  }

  GetRoles(): Observable<any> {
    return from(this.ApiParams()).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/roles`, fparams, this.customHeaders)
      )
    );
  }

  CreateRole(params: Roles): Observable<any> {
    return from(this.ApiParams(params)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/create-role`, fparams, this.customHeaders)
      )
    );
  }

  UpdateRole(params: Roles): Observable<any> {
    return from(this.ApiParams(params)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/update-role`, fparams, this.customHeaders)
      )
    );
  }

  DeleteRole(params: Roles): Observable<any> {
    return from(this.ApiParams(params)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/delete-role`, fparams, this.customHeaders)
      )
    );
  }

  UserAuthorizations(): Observable<any> {
    return from(this.ApiParams()).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/authorizations`, fparams, this.customHeaders)
      )
    );
  }

  UserRoutes(): Observable<any> {
    return from(this.ApiParams()).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/routes`, fparams, this.customHeaders)
      )
    );
  }

  ApiTokenAccessAction(params: { action: string, id?: number, token?: string, isActive?: boolean }): any {
    return from(this.ApiParams(params)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/auth-user/api-access-key`, fparams, this.customHeaders)
      )
    );
  }
  //END ADMIN


  //START REPORTS CALCULATION FROM DB
  CHW_RECO_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    return from(this.ApiParams({ year, month })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/db-chws-reco-report-calculation`, fparams, this.customHeaders)
      )
    );
  }
  FAMILY_PLANNNING_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    return from(this.ApiParams({ year, month })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/db-family-planning-report-calculation`, fparams, this.customHeaders)
      )
    );
  }
  ADULT_MORBIDITY_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    return from(this.ApiParams({ year, month })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/db-adult-morbidity-report-calculation`, fparams, this.customHeaders)
      )
    );
  }
  HOUSEHOLD_RECAPS_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    return from(this.ApiParams({ year, month })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/db-household-recaps-report-calculation`, fparams, this.customHeaders)
      )
    );
  }
  PCIMNE_NEWBORN_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    return from(this.ApiParams({ year, month })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/db-pcimne-newborn-report-calculation`, fparams, this.customHeaders)
      )
    );
  }
  PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    return from(this.ApiParams({ year, month })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/db-promotional-activity-report-calculation`, fparams, this.customHeaders)
      )
    );
  }
  RECO_MEG_SITUATION_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    return from(this.ApiParams({ year, month })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/db-reco-meg-situation-report-calculation`, fparams, this.customHeaders)
      )
    );
  }
  //END REPORTS CALCULATION FROM DB


  //END DASHBOARD CALCULATION FROM DB
  RECO_VACCINATION_DASHBOARD_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    return from(this.ApiParams({ year, month })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/db-reco-vaccination-dashboard-calculation`, fparams, this.customHeaders)
      )
    );
  }

  RECO_PERFORMANCE_DASHBOARD_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    return from(this.ApiParams({ year, month })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/db-reco-performance-dashboard-calculation`, fparams, this.customHeaders)
      )
    );
  }

  RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION(year: number): Observable<any> {
    return from(this.ApiParams({ year })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/db-reco-chart-performance-dashboard-calculation`, fparams, this.customHeaders)
      )
    );
  }
  //END DASHBOARD CALCULATION FROM DB


  //START SYNC FROM COUCH-DB
  SYNC_ALL_FORMS_DATA_FROM_COUCHDB({ year, month }: { year: number, month: string }): Observable<any> {
    return from(this.ApiParams({ year, month })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/couchdb-forms-data`, fparams, this.customHeaders)
      )
    );
  }
  SYNC_APP_USERS_FROM_COUCHDB(): Observable<any> {
    return from(this.ApiParams()).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/couchdb-users`, fparams, this.customHeaders)
      )
    );
  }
  SYNC_ALL_ORGUNITS_AND_CONTACTS_FROM_COUCHDB(param: SyncOrgUnit): Observable<any> {
    return from(this.ApiParams(param)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/couchdb-orgunits-and-contacts`, fparams, this.customHeaders)
      )
    );
  }
  FULL_SYNC_AND_CALCULATE_COUCHDB_DATA(params: { year: number | undefined, month: string | undefined, start_date: string | undefined, end_date: string | undefined }): Observable<any> {
    return from(this.ApiParams(params)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/sync/all-in-one-from-couchdb-and-calculate`, fparams, this.customHeaders)
      )
    );
  }
  //END SYNC FROM COUCH-DB



  //START REPPORTS
  GetPromotionReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    return from(this.ApiParams({ months, year, recos, sync })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/promotion-reports`, fparams, this.customHeaders)
      )
    );
  }

  GetFamilyPlanningReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    return from(this.ApiParams({ months, year, recos, sync })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/family-planning-reports`, fparams, this.customHeaders)
      )
    );
  }

  GetMorbidityReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    return from(this.ApiParams({ months, year, recos, sync })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/morbidity-reports`, fparams, this.customHeaders)
      )
    );
  }

  GetHouseholdRecapReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    return from(this.ApiParams({ months, year, recos, sync })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/household-recaps-reports`, fparams, this.customHeaders)
      )
    );
  }

  GetPcimneNewbornReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    return from(this.ApiParams({ months, year, recos, sync })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/pcime-newborn-reports`, fparams, this.customHeaders)
      )
    );
  }


  GetChwsRecoReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    return from(this.ApiParams({ months, year, recos, sync })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/chws-reco-reports`, fparams, this.customHeaders)
      )
    );
  }

  GetRecoMegSituationReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    return from(this.ApiParams({ months, year, recos, sync })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/reco-meg-situation-reports`, fparams, this.customHeaders)
      )
    );
  }
  //END REPPORTS



  //START VALIDATE REPPORTS
  ValidatePromotionReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/promotion-reports-validation`, fparams, this.customHeaders)
      )
    );
  }
  CancelValidatePromotionReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/cancel-promotion-reports-validation`, fparams, this.customHeaders)
      )
    );
  }

  ValidateFamilyPlanningReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/family-planning-reports-validation`, fparams, this.customHeaders)
      )
    );
  }
  CancelValidateFamilyPlanningReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/cancel-family-planning-reports-validation`, fparams, this.customHeaders)
      )
    );
  }

  ValidateMorbidityReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/morbidity-reports-validation`, fparams, this.customHeaders)
      )
    );
  }
  CancelValidateMorbidityReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/cancel-morbidity-reports-validation`, fparams, this.customHeaders)
      )
    );
  }

  ValidateHouseholdRecapReports({ months, year, recos, dataIds }: { months: string[], year: number, recos: string[], dataIds: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos, dataIds })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/household-recaps-reports-validation`, fparams, this.customHeaders)
      )
    );
  }
  CancelValidateHouseholdRecapReports({ months, year, recos, dataIds }: { months: string[], year: number, recos: string[], dataIds: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos, dataIds })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/cancel-household-recaps-reports-validation`, fparams, this.customHeaders)
      )
    );
  }

  ValidatePcimneNewbornReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/pcime-newborn-reports-validation`, fparams, this.customHeaders)
      )
    );
  }
  CancelValidatePcimneNewbornReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/cancel-pcime-newborn-reports-validation`, fparams, this.customHeaders)
      )
    );
  }

  ValidateChwsRecoReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/chws-reco-reports-validation`, fparams, this.customHeaders)
      )
    );
  }
  CancelValidateChwsRecoReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/cancel-chws-reco-reports-validation`, fparams, this.customHeaders)
      )
    );
  }

  ValidateRecoMegSituationReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/reco-meg-situation-reports-validation`, fparams, this.customHeaders)
      )
    );
  }
  CancelValidateRecoMegSituationReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    return from(this.ApiParams({ months, year, recos })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/reports/cancel-reco-meg-situation-reports-validation`, fparams, this.customHeaders)
      )
    );
  }
  //END VALIDATE REPPORTS



  //START DASHBOARD
  GetRecoVaccinationDashboards({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    return from(this.ApiParams({ months, year, recos, sync })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/dashboards/reco-vaccination-dashboards`, fparams, this.customHeaders)
      )
    );
  }

  GetRecoPerformanceDashboards({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    return from(this.ApiParams({ months, year, recos, sync })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/dashboards/reco-performance-dashboards`, fparams, this.customHeaders)
      )
    );
  }

  // GetRecoChartPerformanceDashboards({ year, recos, sync }: { year: number, recos: string[], sync?: boolean }): Observable<any> {
  //   sync = sync ?? false;
  //   return from(this.ApiParams({ year, recos, sync })).pipe(
  //     switchMap(fparams =>
  //       this.http.post(`${this.backendUrl}/dashboards/reco-chart-performance-dashboards`, fparams, this.customHeaders)
  //     )
  //   );
  // }
  //END DASHBOARD



  //START ORG UNITS
  GetCountries(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/countries`, fparams, this.customHeaders)
      )
    );
  }
  GetRegions(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/regions`, fparams, this.customHeaders)
      )
    );
  }
  GetPrefectures(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/prefectures`, fparams, this.customHeaders)
      )
    );
  }
  GetCommunes(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/communes`, fparams, this.customHeaders)
      )
    );
  }
  GetHospitals(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/hospitals`, fparams, this.customHeaders)
      )
    );
  }
  GetDistrictQuartiers(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/district-quartiers`, fparams, this.customHeaders)
      )
    );
  }
  GetVillageSecteurs(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/village-secteurs`, fparams, this.customHeaders)
      )
    );
  }
  GetFamilys(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/families`, fparams, this.customHeaders)
      )
    );
  }
  GetChws(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/chws`, fparams, this.customHeaders)
      )
    );
  }
  GetRecos(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/recos`, fparams, this.customHeaders)
      )
    );
  }
  GetPatients(param?: getOrgUnitFromDbFilter): Observable<any> {
    return from(this.ApiParams({ ...param })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/org-units/patients`, fparams, this.customHeaders)
      )
    );
  }
  //END ORG UNITS


  //START DATABASES UTILS
  GetDataToDeleteFromCouchDb(params: { cible: string[], start_date: string, end_date: string, type: string }): any {
    const fparams = this.ApiParams();
    return from(this.ApiParams({ ...params })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/database/couchdb/list-data-to-delete`, fparams, this.customHeaders)
      )
    );
  }

  deleteDataFromCouchDb(data: { _deleted: boolean, _id: string, _rev: string, _table: string }[], typeOfData: string): any {
    return from(this.ApiParams({ data_to_delete: data, type: typeOfData })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/database/couchdb/detele-data`, fparams, this.customHeaders)
      )
    );
  }

  updateUserFacilityContactPlace(params: { contact: string, parent: string, new_parent: string }): any {
    return from(this.ApiParams(params)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/database/couchdb/update-user-facility-contact-place`, fparams, this.customHeaders)
      )
    );
  }

  getDatabaseEntities(): any {
    return from(this.ApiParams()).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/database/postgres/entities`, fparams, this.customHeaders)
      )
    );
  }

  truncateDatabase(params: { procide: boolean, entities: { name: string, table: string }[], action: "TRUNCATE" | "DROP" }): any {
    return from(this.ApiParams(params)).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/database/postgres/truncate`, fparams, this.customHeaders)
      )
    );
  }
  //END DATABASES UTILS



  //START DHIS2
  SendChwsRecoReportsToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/dhis2/send/monthly-activity`, fparams, this.customHeaders)
      )
    );
  }

  SendFamilyPlanningActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/dhis2/send/family-planning-activity`, fparams, this.customHeaders)
      )
    );
  }

  SendHouseholdActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/dhis2/send/household-activity`, fparams, this.customHeaders)
      )
    );
  }

  SendMorbidityActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    const fparams = this.ApiParams();
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/dhis2/send/morbidity-activity`, fparams, this.customHeaders)
      )
    );
  }

  SendPcimneNewbornActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/dhis2/send/pcimne-newborn-activity`, fparams, this.customHeaders)
      )
    );
  }

  SendPromotionActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/dhis2/send/promotional-activity`, fparams, this.customHeaders)
      )
    );
  }

  SendRecoMegSituationActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit })).pipe(
      switchMap(fparams =>
        this.http.post(`${this.backendUrl}/dhis2/send/reco-meg-situation-activity`, fparams, this.customHeaders)
      )
    );
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
