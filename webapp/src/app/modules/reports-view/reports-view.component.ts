import { Component, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SnakBarOutPut } from '@kossi-models/interfaces';
import { HouseholdRecapReport } from '@kossi-models/reports';
import { ReportsData, ReportsHealth } from '@kossi-models/reports-selectors';
import { User } from '@kossi-models/user-role';
import { ApiService } from '@kossi-services/api.service';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { DbSyncService } from '@kossi-services/db-sync.service';
import { Dhis2Service } from '@kossi-services/dhis2.service';
import { FormGroupService } from '@kossi-services/form-group.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { initTabsLinkView } from '@kossi-shared/functions';
import { Observable, Subject, takeUntil } from 'rxjs';

@Component({
  standalone: false,
  selector: 'reports-view',
  templateUrl: './reports-view.component.html',
  styleUrl: './reports-view.component.css',
})
export class ReportsViewComponent implements OnDestroy {
  CHANGE_STATE: any = null;
  private form!: FormGroup<any>;

  private destroy$ = new Subject<void>();


  REPORTS_HEADER: ReportsHealth = {
    ON_FETCHING: {},
    IS_VALIDATED: {},
    IS_ON_DHIS2: {},
    ON_VALIDATION: {},
    ON_CANCEL_VALIDATION: {},
    ON_DHIS2_SENDING: {},
    ON_DHIS2_SENDING_ERROR: {},
  };

  private REPORTS_DATA: ReportsData = {
    MONTHLY_ACTIVITY: undefined,
    FAMILY_PLANNING: undefined,
    HOUSE_HOLD_RECAP: undefined,
    MORBIDITY: undefined,
    PCIMNE_NEWBORN: undefined,
    PROMOTION: undefined,
    RECO_MEG_QUANTITIES: undefined,
  }

  USER!: User|null


  isOnline: boolean;

  constructor(
    private api: ApiService,
    private db: DbSyncService,
    private userCtx: UserContextService,
    private snackbar: SnackbarService,
    private conn: ConnectivityService,
    private fGroup: FormGroupService,
    private dhis2Service: Dhis2Service,
  ) {

    this.isOnline = window.navigator.onLine;
    this.conn.getOnlineStatus().subscribe(isOnline => this.isOnline = isOnline);
    this.initializeComponent();

    initTabsLinkView();

    this.conn.getOnlineStatus().pipe(takeUntil(this.destroy$)).subscribe(isOnline => {
      this.isOnline = isOnline;
    });

    this.fGroup.formGroup$.pipe(takeUntil(this.destroy$)).subscribe(formGroup => {
      if (formGroup) this.form = formGroup;
    });

    // this.fGroup.dhis2FormGroup$.pipe(takeUntil(this.destroy$)).subscribe(dhis2FormGroup => {
    //   if (dhis2FormGroup) this.dhis2Form = dhis2FormGroup;
    // });


    this.fGroup.REPORTS_HEADER$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {
        Object.entries(this.REPORTS_HEADER).forEach(([key, value]) => {
          (this.REPORTS_HEADER as any)[key] = dataSaved[key] ?? (Array.isArray(value) ? [] : {});
        });
      }
    });

    this.fGroup.REPORTS_DATA$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {
        Object.keys(this.REPORTS_DATA).forEach(key => {
          (this.REPORTS_DATA as any)[key] = (dataSaved as any)[key];
          (this.REPORTS_HEADER as any)['ON_FETCHING'][key] = false;
        });
        this.SET_REPORTS_HEADER();
      }
    });
  }

  private async initializeComponent(){
      this.USER = await this.userCtx.currentUser();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  private SET_REPORTS_HEADER() {
    this.fGroup.SET_REPORTS_HEADER(this.REPORTS_HEADER);
    this.CHANGE_STATE = new Date();
  }

  private UPDATE_REPORT_FIELD(field: string, reportKey: keyof typeof this.REPORTS_DATA, value: boolean | string) {
    (this.REPORTS_HEADER as any)[field][reportKey] = value;
    this.SET_REPORTS_HEADER();
  }


  // private getDhis2Params(cibleData: any) {
  //   const mth = this.form.value.months;
  //   const period = {
  //     year: this.form.value.year,
  //     month: Array.isArray(mth) ? mth[0] : mth,
  //   };

  //   const dhis2Params: Dhis2DataValueSetParams = {
  //     months: this.form.value.months,
  //     year: this.form.value.year,
  //     recos: this.form.value.recos,
  //     username: this.dhis2Form.value.dhis2_username,
  //     password: this.dhis2Form.value.dhis2_password,
  //     data: cibleData,
  //     period: period,
  //     orgunit: this.dhis2Form.value.dhis2_orgunit_uid
  //   };

  //   this.snackbar.show({ msg: `Envoi des données du au DHIS2 sur ${this.dhis2Form.value.dhis2_orgunit_name}`, color: 'success', position: 'TOP', duration: 10000 });

  //   return dhis2Params;
  // }


  SEND_ALL_REPPORTS_DATA_TO_DHIS2(dhis2FormGroup?: FormGroup) {
    this.dhis2Service.sendReportsToDhis2({
      form: this.form, dhis2Form: dhis2FormGroup, reportNames: Object.keys(this.REPORTS_DATA),
      onStart: (data: SnakBarOutPut | undefined) => {
        this.showProcessMessage(data);
      },
      onProcess: (data: SnakBarOutPut | undefined) => {
        this.showProcessMessage(data);
      },
      onSuccess: (data: SnakBarOutPut | undefined) => {
        this.showProcessMessage(data);
      },
      onError: (data: SnakBarOutPut | undefined) => {
        this.showProcessMessage(data);
      },
      onWarning: (data: SnakBarOutPut | undefined) => {
        this.showProcessMessage(data);
      }
    })
  }


  VALIDATE_ALL_REPORTS(): void {
    if (!this.form) return;

    for (const key of Object.keys(this.REPORTS_DATA)) {
      const reportKey = key as keyof typeof this.REPORTS_DATA;

      this.UPDATE_REPORT_FIELD('ON_VALIDATION', reportKey, true);
      let apiMethod: Observable<any> | undefined = undefined;
      let startApiTransfert = true;

      if (reportKey == 'MONTHLY_ACTIVITY') apiMethod = this.api.ValidateChwsRecoReports(this.form.value);
      if (reportKey == 'FAMILY_PLANNING') apiMethod = this.api.ValidateFamilyPlanningReports(this.form.value);
      if (reportKey == 'HOUSE_HOLD_RECAP') {
        const dataIds = (((this.REPORTS_DATA as any)?.[reportKey]?.data ?? []) as HouseholdRecapReport[])?.map(h => (h as any).id) ?? [];
        startApiTransfert = dataIds && dataIds.length > 0;
        apiMethod = this.api.ValidateHouseholdRecapReports({ ...this.form.value, dataIds });
      }
      if (reportKey == 'MORBIDITY') apiMethod = this.api.ValidateMorbidityReports(this.form.value);
      if (reportKey == 'PCIMNE_NEWBORN') apiMethod = this.api.ValidatePcimneNewbornReports(this.form.value);
      if (reportKey == 'PROMOTION') apiMethod = this.api.ValidatePromotionReports(this.form.value);
      if (reportKey == 'RECO_MEG_QUANTITIES') apiMethod = this.api.ValidateRecoMegSituationReports(this.form.value);

      if (startApiTransfert && apiMethod) {
        apiMethod.subscribe({
          next: async (_c$: { status: number, data: string }) => {
            if (_c$.status == 200) {
              this.SHOW_ALL_DATA(false);
              this.UPDATE_REPORT_FIELD('ON_VALIDATION', reportKey, false);
              this.UPDATE_REPORT_FIELD('IS_VALIDATED', reportKey, true);
              this.snackbar.show({ msg: `${reportKey} validé avec succès.`, color: 'success', position: 'TOP' });
              if (this.USER?.role.canUseOfflineMode === true && this.isOnline) {
                await this.db.all(this.form.value).then(res => { });
              }
            } else {
              this.UPDATE_REPORT_FIELD('ON_VALIDATION', reportKey, false);
              this.snackbar.show({ msg: `Impossible de valider ${reportKey}.`, color: 'warning', position: 'TOP' });
            }
          },
          error: (err) => {
            this.UPDATE_REPORT_FIELD('ON_VALIDATION', reportKey, false);
            this.snackbar.show({ msg: `Erreur lors de la validation du ${reportKey}.`, color: 'danger', position: 'TOP' });
          }
        });
      } else {
        this.snackbar.showWarning(`Pas d'informations suffisantes pour la validation.`);
        this.UPDATE_REPORT_FIELD('ON_VALIDATION', reportKey, false);
      }
    }
  }


  CANCEL_ALL_VALIDATION(): void {
    if (!this.form) return;


    for (const key of Object.keys(this.REPORTS_DATA)) {
      const reportKey = key as keyof typeof this.REPORTS_DATA;

      this.UPDATE_REPORT_FIELD('ON_CANCEL_VALIDATION', reportKey, true);
      let apiMethod: Observable<any> | undefined = undefined;
      let startApiTransfert = true;

      if (reportKey == 'MONTHLY_ACTIVITY') apiMethod = this.api.CancelValidateChwsRecoReports(this.form.value);
      if (reportKey == 'FAMILY_PLANNING') apiMethod = this.api.CancelValidateFamilyPlanningReports(this.form.value);
      if (reportKey == 'HOUSE_HOLD_RECAP') {
        const dataIds = (((this.REPORTS_DATA as any)?.[reportKey]?.data ?? []) as HouseholdRecapReport[])?.map(h => (h as any).id) ?? [];
        startApiTransfert = dataIds && dataIds.length > 0;
        apiMethod = this.api.CancelValidateHouseholdRecapReports({ ...this.form.value, dataIds });
      }
      if (reportKey == 'MORBIDITY') apiMethod = this.api.CancelValidateMorbidityReports(this.form.value);
      if (reportKey == 'PCIMNE_NEWBORN') apiMethod = this.api.CancelValidatePcimneNewbornReports(this.form.value);
      if (reportKey == 'PROMOTION') apiMethod = this.api.CancelValidatePromotionReports(this.form.value);
      if (reportKey == 'RECO_MEG_QUANTITIES') apiMethod = this.api.CancelValidateRecoMegSituationReports(this.form.value);

      if (startApiTransfert && apiMethod) {
        apiMethod.subscribe({
          next: async (_c$: { status: number, data: string }) => {
            if (_c$.status == 200) {
              this.SHOW_ALL_DATA(false);
              this.snackbar.show({ msg: `Validation du ${reportKey} annulée.`, color: 'success', position: 'TOP' });
              this.UPDATE_REPORT_FIELD('ON_CANCEL_VALIDATION', reportKey, false);
              this.UPDATE_REPORT_FIELD('IS_VALIDATED', reportKey, false);
              if (this.USER?.role.canUseOfflineMode === true && this.isOnline) {
                await this.db.all(this.form.value).then(res => { });
              }
            } else {
              this.UPDATE_REPORT_FIELD('ON_CANCEL_VALIDATION', reportKey, false);
            }
          },
          error: (err) => {
            this.snackbar.showError(`Erreur lors de l'annulation de la validation.`);
            this.UPDATE_REPORT_FIELD('ON_CANCEL_VALIDATION', reportKey, false);
          }
        });
      } else {
        this.snackbar.showWarning(`Pas d'informations suffisantes pour annuler la validation.`);
        this.UPDATE_REPORT_FIELD('ON_CANCEL_VALIDATION', reportKey, false);
      }
    }
  }

  SHOW_ALL_DATA(showProcess: boolean) {

  }

  showProcessMessage(data: SnakBarOutPut | undefined) {
    if (data) {
      this.snackbar.show({ msg: data.msg, color: data.color, position: data.position ?? 'TOP', duration: 10000 });
      this.CHANGE_STATE = new Date();
    }
  }

}
