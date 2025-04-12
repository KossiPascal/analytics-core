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




  getConfigs(): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/configs`;
    return from(this.ApiParams({ userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  appVersion(): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/configs/version`;
    return from(this.ApiParams({ userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  //START AUTH

  // public(url: string, prodApp?: boolean, ): Observable<any> {
  //   const userHttpUrl = `${this.backendUrl}/auth-user/${url}`;
  //   return from(this.ApiParams({prodApp}, false)).pipe(
  //     switchMap(fparams =>
  //       this.http.post(userHttpUrl, fparams, this.customHeaders)
  //     )
  //   );
  // }

  login(params: { credential: string, password: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/login`;
    return from(this.ApiParams({ ...params, loginModeCredents: true, userHttpUrl }, false)).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  register(user: User): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/register`;
    return from(this.ApiParams({ ...user, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  /** Rafraîchir le token */
  newToken(updateReload: boolean = false): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/new-token`;
    return from(this.ApiParams({ updateReload, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  //END AUTH

  saveSurvey(params: any): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/survey/save`;
    return from(this.ApiParams({ survey: params, userHttpUrl }, false)).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  getAverage(): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/survey/get-averages`;
    return from(this.ApiParams({ userHttpUrl }, false)).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  //START ADMIN

  sendSms(params: { phoneNumbers: string[], message: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sms/send-sms`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  sendCustomSms(params: { phone: string, message: string }[]): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sms/send-coustom-sms`;
    return from(this.ApiParams({ phoneNumbersMessage: params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  getUsers(): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/users`;
    return from(this.ApiParams({ userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  updateProfile(params: { id: string | undefined, fullname: string; email: string; phone: string; }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/update-user-profile`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  updateUser(user: User): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/update-user`;
    return from(this.ApiParams({ ...user, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  updatePassword(params: { id: string | undefined, oldPassword: string, newPassword: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/update-user-password`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  deleteUser(user: User, permanentDelete: boolean = false): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/delete-user`;
    return from(this.ApiParams({ ...user, permanentDelete, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  GetRoles(): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/roles`;
    return from(this.ApiParams({ userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  CreateRole(params: Roles): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/create-role`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  UpdateRole(params: Roles): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/update-role`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  DeleteRole(params: Roles): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/delete-role`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  UserAuthorizations(): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/authorizations`;
    return from(this.ApiParams({ userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  UserRoutes(): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/auth-user/routes`;
    return from(this.ApiParams({ userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  ApiTokenAccessAction(params: { action: string, id?: number, token?: string, isActive?: boolean }): any {
    const userHttpUrl = `${this.backendUrl}/auth-user/api-access-key`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  //END ADMIN


  //START REPORTS CALCULATION FROM DB
  CHW_RECO_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/db-chws-reco-report-calculation`;
    return from(this.ApiParams({ year, month, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  FAMILY_PLANNNING_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/db-family-planning-report-calculation`;
    return from(this.ApiParams({ year, month, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  ADULT_MORBIDITY_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/db-adult-morbidity-report-calculation`;
    return from(this.ApiParams({ year, month, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  HOUSEHOLD_RECAPS_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/db-household-recaps-report-calculation`;
    return from(this.ApiParams({ year, month, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  PCIMNE_NEWBORN_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/db-pcimne-newborn-report-calculation`;
    return from(this.ApiParams({ year, month, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/db-promotional-activity-report-calculation`;
    return from(this.ApiParams({ year, month, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  RECO_MEG_SITUATION_REPORTS_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/db-reco-meg-situation-report-calculation`;
    return from(this.ApiParams({ year, month, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  //END REPORTS CALCULATION FROM DB


  //END DASHBOARD CALCULATION FROM DB
  RECO_VACCINATION_DASHBOARD_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/db-reco-vaccination-dashboard-calculation`;
    return from(this.ApiParams({ year, month, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  RECO_PERFORMANCE_DASHBOARD_CALCULATION({ year, month }: { year: number, month: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/db-reco-performance-dashboard-calculation`;
    return from(this.ApiParams({ year, month, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION(year: number): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/db-reco-chart-performance-dashboard-calculation`;
    return from(this.ApiParams({ year, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  //END DASHBOARD CALCULATION FROM DB


  //START SYNC FROM COUCH-DB
  SYNC_ALL_FORMS_DATA_FROM_COUCHDB({ year, month }: { year: number, month: string }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/couchdb-forms-data`;
    return from(this.ApiParams({ year, month, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  SYNC_APP_USERS_FROM_COUCHDB(): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/couchdb-users`;
    return from(this.ApiParams({ userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  SYNC_ALL_ORGUNITS_AND_CONTACTS_FROM_COUCHDB(param: SyncOrgUnit): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/couchdb-orgunits-and-contacts`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  FULL_SYNC_AND_CALCULATE_COUCHDB_DATA(params: { year: number | undefined, month: string | undefined, start_date: string | undefined, end_date: string | undefined }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sync/all-in-one-from-couchdb-and-calculate`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  //END SYNC FROM COUCH-DB


  //START REPPORTS
  GetPromotionReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/reports/promotion-reports`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  GetFamilyPlanningReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/reports/family-planning-reports`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  GetMorbidityReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/reports/morbidity-reports`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  GetHouseholdRecapReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/reports/household-recaps-reports`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  GetPcimneNewbornReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/reports/pcime-newborn-reports`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  GetChwsRecoReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/reports/chws-reco-reports`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  GetRecoMegSituationReports({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/reports/reco-meg-situation-reports`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  //END REPPORTS



  //START VALIDATE REPPORTS
  ValidatePromotionReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/promotion-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  CancelValidatePromotionReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/cancel-promotion-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  ValidateFamilyPlanningReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/family-planning-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  CancelValidateFamilyPlanningReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/cancel-family-planning-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  ValidateMorbidityReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/morbidity-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  CancelValidateMorbidityReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/cancel-morbidity-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  ValidateHouseholdRecapReports({ months, year, recos, dataIds }: { months: string[], year: number, recos: string[], dataIds: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/household-recaps-reports-validation`;
    return from(this.ApiParams({ months, year, recos, dataIds, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  CancelValidateHouseholdRecapReports({ months, year, recos, dataIds }: { months: string[], year: number, recos: string[], dataIds: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/cancel-household-recaps-reports-validation`;
    return from(this.ApiParams({ months, year, recos, dataIds, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  ValidatePcimneNewbornReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/pcime-newborn-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  CancelValidatePcimneNewbornReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/cancel-pcime-newborn-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  ValidateChwsRecoReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/chws-reco-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  CancelValidateChwsRecoReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/cancel-chws-reco-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  ValidateRecoMegSituationReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/reco-meg-situation-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  CancelValidateRecoMegSituationReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/reports/cancel-reco-meg-situation-reports-validation`;
    return from(this.ApiParams({ months, year, recos, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  //END VALIDATE REPPORTS



  //START DASHBOARD
  GetRecoVaccinationDashboards({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/dashboards/reco-vaccination-dashboards`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  GetRecoPerformanceDashboards({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/dashboards/reco-performance-dashboards`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  // GetRecoChartPerformanceDashboards({ year, recos, sync }: { year: number, recos: string[], sync?: boolean }): Observable<any> {
  //   sync = sync ?? false;
  //   const userHttpUrl = `${this.backendUrl}/dashboards/reco-chart-performance-dashboards`;
  //   return from(this.ApiParams({ year, recos, sync, userHttpUrl })).pipe(
  //     switchMap(fparams =>
  //       this.http.post(userHttpUrl, fparams, this.customHeaders)
  //     )
  //   );
  // }
  //END DASHBOARD



  //START ORG UNITS
  GetCountries(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/countries`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  GetRegions(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/regions`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  GetPrefectures(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/prefectures`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  GetCommunes(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/communes`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  GetHospitals(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/hospitals`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  GetDistrictQuartiers(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/district-quartiers`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  GetVillageSecteurs(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/village-secteurs`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  GetFamilys(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/families`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  GetChws(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/chws`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  GetRecos(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/recos`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  GetPatients(param?: getOrgUnitFromDbFilter): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/org-units/patients`;
    return from(this.ApiParams({ ...param, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  //END ORG UNITS


  //START DATABASES UTILS
  GetDataToDeleteFromCouchDb(params: { cible: string[], start_date: string, end_date: string, type: string }): any {
    const fparams = this.ApiParams();
    const userHttpUrl = `${this.backendUrl}/database/couchdb/list-data-to-delete`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  deleteDataFromCouchDb(data: { _deleted: boolean, _id: string, _rev: string, _table: string }[], typeOfData: string): any {
    const userHttpUrl = `${this.backendUrl}/database/couchdb/detele-data`;
    return from(this.ApiParams({ data_to_delete: data, type: typeOfData, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  updateUserFacilityContactPlace(params: { contact: string, parent: string, new_parent: string }): any {
    const userHttpUrl = `${this.backendUrl}/database/couchdb/update-user-facility-contact-place`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  getDatabaseEntities(): any {
    const userHttpUrl = `${this.backendUrl}/database/postgres/entities`;
    return from(this.ApiParams({ userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  truncateDatabase(params: { procide: boolean, entities: { name: string, table: string }[], action: "TRUNCATE" | "DROP" }): any {
    const userHttpUrl = `${this.backendUrl}/database/postgres/truncate`;
    return from(this.ApiParams({ ...params, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }
  //END DATABASES UTILS



  //START DHIS2
  SendChwsRecoReportsToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    const userHttpUrl = `${this.backendUrl}/dhis2/send/monthly-activity`;
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  SendFamilyPlanningActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    const userHttpUrl = `${this.backendUrl}/dhis2/send/family-planning-activity`;
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  SendHouseholdActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    const userHttpUrl = `${this.backendUrl}/dhis2/send/household-activity`;
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  SendMorbidityActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    const fparams = this.ApiParams();
    const userHttpUrl = `${this.backendUrl}/dhis2/send/morbidity-activity`;
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  SendPcimneNewbornActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    const userHttpUrl = `${this.backendUrl}/dhis2/send/pcimne-newborn-activity`;
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  SendPromotionActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    const userHttpUrl = `${this.backendUrl}/dhis2/send/promotional-activity`;
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  SendRecoMegSituationActivitiesToDhis2({ username, password, data, period, months, year, recos, orgunit }: Dhis2DataValueSetParams): any {
    const userHttpUrl = `${this.backendUrl}/dhis2/send/reco-meg-situation-activity`;
    return from(this.ApiParams({ username, password, data, period, months, year, recos, orgunit, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
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
