import { Component } from '@angular/core';
import { FamilyPlanningReport } from '@kossi-models/reports';
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
  selector: 'family-planning-report',
  templateUrl: './family-planning.component.html',
  styleUrl: './family-planning.component.css',
})
export class FamilyPlanningReportComponent extends BaseReportsComponent<FamilyPlanningReport> {

  override REPPORT_NAME = 'FAMILY_PLANNING';

  constructor(private api: ApiService, private ldbfetch: LocalDbDataFetchService, dhis2Service: Dhis2Service, db: DbSyncService, userCtx: UserContextService, conn: ConnectivityService, snackbar: SnackbarService, fGroup: FormGroupService) {

    super(
      fGroup,
      db,
      userCtx,
      conn,
      snackbar,
      dhis2Service,
      (formData, isOnline) => from(this.ldbfetch.GetFamilyPlanningReports(formData, isOnline)),
      (formData) => this.api.ValidateFamilyPlanningReports(formData),
      (formData) => this.api.CancelValidateFamilyPlanningReports(formData),
      (dhis2Params) => this.api.SendFamilyPlanningActivitiesToDhis2(dhis2Params),
    );

    this.dhis2Service.getDhis2SendingStatus().pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {
        this.snackbar.show({ msg: dataSaved.msg, color: dataSaved.color, position: dataSaved.position ?? 'TOP', duration: dataSaved.duration ?? 5000 });
        this.CHANGE_STATE = new Date();
      }
    });
  }

  get DATA_FETCHED() {
    return (this.REPORTS_DATA as any)[this.REPPORT_NAME]?.data as FamilyPlanningReport;
  }
}

