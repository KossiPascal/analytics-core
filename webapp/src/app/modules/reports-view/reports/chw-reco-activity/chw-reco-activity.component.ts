import { Component } from '@angular/core';
import { ChwsRecoReport } from '@kossi-models/reports';
import { ApiService } from '@kossi-services/api.service';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { DbSyncService } from '@kossi-services/db-sync.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { BaseReportsComponent } from '../base-reports.component';
import { from } from 'rxjs';
import { FormGroupService } from '@kossi-services/form-group.service';
import { Dhis2Service } from '@kossi-services/dhis2.service';

@Component({
  standalone: false,
  selector: 'chw-reco-activity-report',
  templateUrl: './chw-reco-activity.component.html',
  styleUrl: './chw-reco-activity.component.css',
})
export class ChwRecoMonthlyActivityReportComponent extends BaseReportsComponent<ChwsRecoReport> {

  override REPPORT_NAME = 'MONTHLY_ACTIVITY';


  constructor(private api: ApiService, private ldbfetch: LocalDbDataFetchService, dhis2Service: Dhis2Service, db: DbSyncService, userCtx: UserContextService, conn: ConnectivityService, snackbar: SnackbarService, fGroup: FormGroupService) {

    super(
      fGroup,
      db,
      userCtx,
      conn,
      snackbar,
      dhis2Service,
      (formData, isOnline) => from(this.ldbfetch.GetChwsRecoReports(formData, isOnline)),
      (formData) => this.api.ValidateChwsRecoReports(formData),
      (formData) => this.api.CancelValidateChwsRecoReports(formData),
      (dhis2Params) => this.api.SendChwsRecoReportsToDhis2(dhis2Params),
    );

    // this.dhis2Service.getDhis2SendingStatus().pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
    //   if (dataSaved) {
    //     this.snackbar.show({ msg: dataSaved.msg, color: dataSaved.color, position: dataSaved.position ?? 'TOP', duration: dataSaved.duration ?? 5000 });
    //     this.CHANGE_STATE = new Date();
    //   }
    // });
  }

  get DATA_FETCHED() {
      return (this.REPORTS_DATA as any)[this.REPPORT_NAME]?.data as ChwsRecoReport;
  }

}

