import { Component } from '@angular/core';
import { HouseholdRecapReport } from '@kossi-models/reports';
import { ApiService } from '@kossi-services/api.service';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { DbSyncService } from '@kossi-services/db-sync.service';
import { FormGroupService } from '@kossi-services/form-group.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { from, takeUntil } from 'rxjs';
import { BaseReportsComponent } from '../base-reports.component';
import { Dhis2Service } from '@kossi-services/dhis2.service';

@Component({
  standalone: false,
  selector: 'household-recap-report',
  templateUrl: './household-recap.component.html',
  styleUrl: './household-recap.component.css',
})
export class HouseholdRecapReportComponent extends BaseReportsComponent<HouseholdRecapReport> {

  PAGINATION_DATA: HouseholdRecapReport[] = [];

  override REPPORT_NAME = 'HOUSE_HOLD_RECAP';

  constructor(private api: ApiService, private ldbfetch: LocalDbDataFetchService, dhis2Service: Dhis2Service, db: DbSyncService, userCtx: UserContextService, conn: ConnectivityService, snackbar: SnackbarService, fGroup: FormGroupService) {
    super(
      fGroup,
      db,
      userCtx,
      conn,
      snackbar,
      dhis2Service,
      (formData, isOnline) => from(this.ldbfetch.GetHouseholdRecapReports(formData, isOnline)),
      (formData) => this.api.ValidateHouseholdRecapReports(formData),
      (formData) => this.api.CancelValidateHouseholdRecapReports(formData),
      (dhis2Params) => this.api.SendHouseholdActivitiesToDhis2(dhis2Params),
    );

    this.dhis2Service.getDhis2SendingStatus().pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {
        this.snackbar.show({ msg: dataSaved.msg, color: dataSaved.color, position: dataSaved.position ?? 'TOP', duration: dataSaved.duration ?? 5000 });
        this.CHANGE_STATE = new Date();
      }
    });
  }

  onUpdatedPaginate(data: HouseholdRecapReport[]){
    this.PAGINATION_DATA = data
  }

  get DATA_FETCHED() {
        return ((this.REPORTS_DATA as any)[this.REPPORT_NAME]?.data ?? []) as HouseholdRecapReport[];
  }

  get DATA_FETCHED_TOTAL(): HouseholdRecapReport|undefined {

    return this.DATA_FETCHED ? {
      total_household_members: this.DATA_FETCHED.map(d => d.total_household_members).reduce((total, num) => total + num, 0),
      total_women_15_50_years: this.DATA_FETCHED.map(d => d.total_women_15_50_years).reduce((total, num) => total + num, 0),
      total_children_under_5_years: this.DATA_FETCHED.map(d => d.total_children_under_5_years).reduce((total, num) => total + num, 0),
      total_children_0_12_months: this.DATA_FETCHED.map(d => d.total_children_0_12_months).reduce((total, num) => total + num, 0),
      total_children_12_60_months: this.DATA_FETCHED.map(d => d.total_children_12_60_months).reduce((total, num) => total + num, 0),
      has_functional_latrine: this.DATA_FETCHED.map(d => d.has_functional_latrine).reduce((acc, val) => val === true ? acc + 1 : acc, 0),
      has_drinking_water_access: this.DATA_FETCHED.map(d => d.has_drinking_water_access).reduce((acc, val) => val === true ? acc + 1 : acc, 0)
    } as any : undefined;
  }

}


