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
    return from(this.ApiParams({ userHttpUrl, noLogData: true })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  appVersion(): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/configs/version`;
    return from(this.ApiParams({ userHttpUrl, noLogData: true })).pipe(
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

  getAllMigrationsPathList(): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sql/getall`;
    return from(this.ApiParams({ userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  runAllMigrationsAvailable(runAllMigrations: boolean = true): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sql/runall`;
    return from(this.ApiParams({ runAllMigrations, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  getOneMigrationsPath(migrationName: string): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sql/getone`;
    return from(this.ApiParams({ migrationName, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  runOneMigrationAvailable(migrationName: string, runOneMigrations: boolean = true): Observable<any> {
    const userHttpUrl = `${this.backendUrl}/sql/runone`;
    return from(this.ApiParams({ migrationName, runOneMigrations, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }


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
  GetRecoVaccinationNotDoneDashboards({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/dashboards/reco-vaccination-not-done-dashboards`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  GetRecoVaccinationPartialDoneDashboards({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/dashboards/reco-vaccination-partial-done-dashboards`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  GetRecoVaccinationAllDoneDashboards({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/dashboards/reco-vaccination-all-done-dashboards`;
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

  GetActiveRecoDashboards({ year, recos, sync }: { year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/dashboards/active-reco-dashboards`;
    return from(this.ApiParams({ year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }


  GetRecoTasksStateDashboards({ start_date, end_date, recos, sync }: { start_date: string; end_date: string; recos: string[]; sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/dashboards/reco-tasks-state-dashboards`;
    return from(this.ApiParams({ start_date, end_date, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  //END DASHBOARD


  //START MAPS
  GetRecoDataMaps({ months, year, recos, sync }: { months: string[], year: number, recos: string[], sync?: boolean }): Observable<any> {
    sync = sync ?? false;
    const userHttpUrl = `${this.backendUrl}/maps/reco-data-maps`;
    return from(this.ApiParams({ months, year, recos, sync, userHttpUrl })).pipe(
      switchMap(fparams =>
        this.http.post(userHttpUrl, fparams, this.customHeaders)
      )
    );
  }

  //END MAPS

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
