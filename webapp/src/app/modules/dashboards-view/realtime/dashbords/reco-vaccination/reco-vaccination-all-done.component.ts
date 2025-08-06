import { Component } from '@angular/core';
import { RecoVaccinationDashboard } from '@kossi-models/dashboards';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { BaseDashboardsComponent } from '../../../base-dashboards.component';
import { FormGroupService } from '@kossi-services/form-group.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { from } from 'rxjs';

@Component({
  standalone: false,
  selector: 'reco-vaccinations-all-done-dashboard',
  templateUrl: './a-reco-vaccination.component.html',
  styleUrl: './a-reco-vaccination.component.css'
})

export class RecoVaccinationAllDoneDashboardComponent extends BaseDashboardsComponent<RecoVaccinationDashboard[]> {

  override DASHBOARD_NAME = 'RECOS_VACCINES_ALL_DONE';

  constructor(private ldbfetch: LocalDbDataFetchService, fGroup: FormGroupService, conn: ConnectivityService, snackbar: SnackbarService, userCtx: UserContextService) {
    super(
      fGroup,
      conn,
      snackbar,
      userCtx,
      (formData, isOnline) => from(this.ldbfetch.GetRecoVaccinationAllDoneDashboard(formData, isOnline)),
    );
  }

  PAGINATION_DATA: RecoVaccinationDashboard[][] = [];


  onUpdatedPaginate(data: RecoVaccinationDashboard[][]) {
    this.PAGINATION_DATA = data
  }

   get DATA_FETCHED() {
    return ((this.DASHBOARDS_DATA as any)[this.DASHBOARD_NAME]?.data ?? []) as RecoVaccinationDashboard[][];
  }
}

